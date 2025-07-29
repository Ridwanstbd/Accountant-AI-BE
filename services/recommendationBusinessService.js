const AIService = require("./aiService");
const { prisma } = require("../models");
const { getMonthDateRange } = require("../utils/validation");
const {
  processFinancialData,
  generateFinancialSummary,
  determineRecommendationType,
} = require("../utils/financial");

class RecommendationBusinessService {
  constructor() {
    this.prisma = prisma;
    this.aiService = new AIService();
  }

  async generateMonthlyRecommendation(year, month) {
    try {
      // 1. Validate if recommendation already exists for this month
      const existingRecommendation = await this.findExistingRecommendation(
        year,
        month
      );

      if (
        existingRecommendation &&
        !this.shouldRegenerateRecommendation(existingRecommendation)
      ) {
        return {
          recommendation: existingRecommendation,
          isNew: false,
          message: "Rekomendasi untuk bulan ini sudah ada",
        };
      }

      // 2. Get financial data for the specified month
      const financialData = await this.getFinancialDataForMonth(year, month);

      // 3. Validate if there's enough data to generate recommendation
      if (!this.hasEnoughDataForRecommendation(financialData)) {
        throw new Error("Data keuangan tidak cukup untuk membuat rekomendasi");
      }

      // 4. Generate AI recommendation
      const aiResult = await this.generateAIRecommendation(
        financialData,
        month,
        year
      );

      // 5. Save recommendation to database
      const savedRecommendation = await this.saveRecommendation({
        year,
        month,
        ...aiResult,
        financialSummary: financialData.summary,
      });

      return {
        recommendation: savedRecommendation,
        financialSummary: financialData.processed,
        aiRawOutput: aiResult.aiRecommendationText,
        isNew: true,
      };
    } catch (error) {
      throw new Error(
        `Failed to generate monthly recommendation: ${error.message}`
      );
    }
  }

  async generateCustomRecommendation(params) {
    const {
      prompt,
      year,
      month,
      includeFinancialData = false,
      userId = null,
      aiOptions = {},
    } = params;

    try {
      let finalPrompt = prompt;
      let financialContext = null;

      // Include financial data if requested
      if (includeFinancialData && year && month) {
        const financialData = await this.getFinancialDataForMonth(year, month);
        financialContext = financialData.summary;
        finalPrompt = `${financialContext}\n\nBerdasarkan data keuangan di atas, ${prompt}`;
      }

      // Generate AI response
      const aiRecommendationText = await this.aiService.generateRecommendation(
        finalPrompt,
        aiOptions
      );
      const recommendationType =
        determineRecommendationType(aiRecommendationText);

      // Save custom recommendation
      const savedRecommendation =
        await this.prisma.monthlyAIRecommendation.create({
          data: {
            year: year || new Date().getFullYear(),
            month: month || new Date().getMonth() + 1,
            recommendationType,
            recommendationText: aiRecommendationText,
            isCustom: true,
            customPrompt: prompt,
            userId: userId,
            metadata: {
              includeFinancialData,
              financialContext: financialContext ? "included" : "not_included",
            },
          },
        });

      return {
        recommendation: savedRecommendation,
        originalPrompt: prompt,
        finalPrompt: includeFinancialData
          ? "Financial data included"
          : "No financial data",
        aiRawOutput: aiRecommendationText,
      };
    } catch (error) {
      throw new Error(
        `Failed to generate custom recommendation: ${error.message}`
      );
    }
  }

  async getRecommendations(filters) {
    const {
      startDate,
      endDate,
      year,
      month,
      type,
      isCustom,
      userId,
      isActive = true,
      limit = 10,
      offset = 0,
      sortBy = "generatedAt",
      sortOrder = "desc",
    } = filters;

    try {
      // Build complex filter conditions
      const where = { isActive };

      // Date filters
      if (year && month) {
        where.year = parseInt(year);
        where.month = parseInt(month);
      } else if (startDate || endDate) {
        const dateFilter = {};
        if (startDate) dateFilter.gte = new Date(startDate);
        if (endDate) dateFilter.lte = new Date(endDate);
        where.generatedAt = dateFilter;
      }

      // Other filters
      if (type) where.recommendationType = type;
      if (typeof isCustom === "boolean") where.isCustom = isCustom;
      if (userId) where.userId = userId;

      // Execute queries
      const [recommendations, total, stats] = await Promise.all([
        this.prisma.monthlyAIRecommendation.findMany({
          where,
          skip: parseInt(offset),
          take: parseInt(limit),
          orderBy: { [sortBy]: sortOrder },
        }),
        this.prisma.monthlyAIRecommendation.count({ where }),
        this.getRecommendationStats(where),
      ]);

      return {
        data: recommendations,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: total > parseInt(offset) + parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
          currentPage: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
        },
        statistics: stats,
      };
    } catch (error) {
      throw new Error(`Failed to get recommendations: ${error.message}`);
    }
  }

  async updateRecommendation(id, updateData) {
    try {
      // Check if recommendation exists and get current data
      const existingRecommendation =
        await this.prisma.monthlyAIRecommendation.findUnique({
          where: { id },
        });

      if (!existingRecommendation) {
        throw new Error("Rekomendasi tidak ditemukan");
      }

      // Validate update permissions (if it's a system-generated recommendation)
      if (!existingRecommendation.isCustom && updateData.recommendationText) {
        // Log the modification for audit
        await this.logRecommendationModification(id, "manual_edit", updateData);
      }

      // Prepare update data
      const dataToUpdate = {
        ...updateData,
        updatedAt: new Date(),
      };

      // If recommendation text is being updated, re-determine type
      if (updateData.recommendationText && !updateData.recommendationType) {
        dataToUpdate.recommendationType = determineRecommendationType(
          updateData.recommendationText
        );
      }

      // Update recommendation
      const updatedRecommendation =
        await this.prisma.monthlyAIRecommendation.update({
          where: { id },
          data: dataToUpdate,
        });

      return updatedRecommendation;
    } catch (error) {
      throw new Error(`Failed to update recommendation: ${error.message}`);
    }
  }

  async deleteRecommendation(id) {
    try {
      // Check if recommendation exists
      const existingRecommendation =
        await this.prisma.monthlyAIRecommendation.findUnique({
          where: { id },
        });

      if (!existingRecommendation) {
        throw new Error("Rekomendasi tidak ditemukan");
      }

      // Log deletion for audit
      await this.logRecommendationModification(
        id,
        "deleted",
        existingRecommendation
      );

      // Soft delete instead of hard delete to maintain audit trail
      const deletedRecommendation =
        await this.prisma.monthlyAIRecommendation.update({
          where: { id },
          data: {
            isActive: false,
            deletedAt: new Date(),
          },
        });

      return {
        deleted: deletedRecommendation,
        message: "Rekomendasi berhasil dihapus",
      };
    } catch (error) {
      throw new Error(`Failed to delete recommendation: ${error.message}`);
    }
  }

  async regenerateRecommendation(id, forceRegenerate = false) {
    try {
      // Get existing recommendation
      const existingRecommendation =
        await this.prisma.monthlyAIRecommendation.findUnique({
          where: { id },
        });

      if (!existingRecommendation) {
        throw new Error("Rekomendasi tidak ditemukan");
      }

      // Check if recently generated (smart caching)
      if (
        !forceRegenerate &&
        !this.shouldRegenerateRecommendation(existingRecommendation)
      ) {
        return {
          recommendation: existingRecommendation,
          regenerated: false,
          message: "Rekomendasi masih fresh, tidak perlu di-regenerate",
        };
      }

      // Archive old recommendation
      await this.archiveRecommendation(existingRecommendation);

      // Generate new recommendation
      const result = await this.generateMonthlyRecommendation(
        existingRecommendation.year,
        existingRecommendation.month
      );

      return {
        ...result,
        regenerated: true,
        previousRecommendation: existingRecommendation,
      };
    } catch (error) {
      throw new Error(`Failed to regenerate recommendation: ${error.message}`);
    }
  }

  async getServiceStatus() {
    try {
      const [dbHealth, aiHealth, systemStats] = await Promise.all([
        this.checkDatabaseHealth(),
        this.checkAIServiceHealth(),
        this.getSystemStatistics(),
      ]);

      return {
        database: dbHealth,
        aiService: aiHealth,
        statistics: systemStats,
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || "1.0.0",
      };
    } catch (error) {
      throw new Error(`Failed to get service status: ${error.message}`);
    }
  }

  async findExistingRecommendation(year, month) {
    return await this.prisma.monthlyAIRecommendation.findFirst({
      where: {
        year: year,
        month: month,
        isActive: true,
        isCustom: false,
      },
      orderBy: { generatedAt: "desc" },
    });
  }

  shouldRegenerateRecommendation(recommendation) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Always allow regeneration if older than 1 day
    if (recommendation.generatedAt < oneDayAgo) return true;

    // Don't regenerate if within last hour
    if (recommendation.generatedAt > oneHourAgo) return false;

    return true;
  }

  async getFinancialDataForMonth(year, month) {
    const { startDate, endDate } = getMonthDateRange(year, month);

    const [journalEntries, accounts] = await Promise.all([
      this.getJournalEntriesByDateRange(startDate, endDate),
      this.getAllAccounts(),
    ]);

    const processed = processFinancialData(journalEntries);
    const summary = generateFinancialSummary(processed, month, year);

    return {
      raw: { journalEntries, accounts },
      processed,
      summary,
    };
  }

  hasEnoughDataForRecommendation(financialData) {
    const { processed } = financialData;

    // Minimum criteria for generating recommendation
    return (
      processed.totalRevenue > 0 ||
      processed.totalExpense > 0 ||
      (processed.transactionSummaries &&
        processed.transactionSummaries.length >= 3)
    );
  }

  async generateAIRecommendation(financialData, month, year) {
    const aiRecommendationText = await this.aiService.generateRecommendation(
      financialData.summary
    );
    const recommendationType =
      determineRecommendationType(aiRecommendationText);

    return {
      aiRecommendationText,
      recommendationType,
    };
  }

  async saveRecommendation(data) {
    const { year, month, aiRecommendationText, recommendationType } = data;

    return await this.upsertMonthlyRecommendation({
      year,
      month,
      recommendationType,
      recommendationText: aiRecommendationText,
    });
  }

  async getRecommendationStats(where = {}) {
    const stats = await this.prisma.monthlyAIRecommendation.groupBy({
      by: ["recommendationType"],
      where: { ...where, isActive: true },
      _count: {
        id: true,
      },
    });

    return {
      byType: stats.reduce((acc, stat) => {
        acc[stat.recommendationType] = stat._count.id;
        return acc;
      }, {}),
      total: stats.reduce((sum, stat) => sum + stat._count.id, 0),
    };
  }

  async logRecommendationModification(recommendationId, action, data) {
    // This could be implemented with a separate audit log table
    console.log("Audit Log:", {
      recommendationId,
      action,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Archive old recommendation
   */
  async archiveRecommendation(recommendation) {
    await this.prisma.monthlyAIRecommendation.update({
      where: { id: recommendation.id },
      data: {
        isActive: false,
        archivedAt: new Date(),
      },
    });
  }

  /**
   * Check database health
   */
  async checkDatabaseHealth() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const recommendationCount =
        await this.prisma.monthlyAIRecommendation.count();

      return {
        status: "healthy",
        message: "Database connection OK",
        recommendationCount,
      };
    } catch (error) {
      return {
        status: "unhealthy",
        message: error.message,
      };
    }
  }

  /**
   * Check AI service health
   */
  async checkAIServiceHealth() {
    try {
      const isConfigured = this.aiService.isConfigured();
      if (!isConfigured) {
        return {
          status: "unhealthy",
          message: "AI service not configured",
        };
      }

      return {
        status: "healthy",
        message: "AI service configured and ready",
      };
    } catch (error) {
      return {
        status: "unhealthy",
        message: error.message,
      };
    }
  }

  /**
   * Get system statistics
   */
  async getSystemStatistics() {
    const [totalRecommendations, activeRecommendations, customRecommendations] =
      await Promise.all([
        this.prisma.monthlyAIRecommendation.count(),
        this.prisma.monthlyAIRecommendation.count({
          where: { isActive: true },
        }),
        this.prisma.monthlyAIRecommendation.count({
          where: { isCustom: true, isActive: true },
        }),
      ]);

    return {
      totalRecommendations,
      activeRecommendations,
      customRecommendations,
      systemRecommendations: activeRecommendations - customRecommendations,
    };
  }

  /**
   * Get journal entries by date range
   */
  async getJournalEntriesByDateRange(startDate, endDate) {
    return await this.prisma.journalEntry.findMany({
      where: {
        journal: {
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
      include: {
        debitAccount: true,
        creditAccount: true,
        journal: true,
      },
      orderBy: {
        journal: {
          date: "asc",
        },
      },
    });
  }

  /**
   * Get all accounts
   */
  async getAllAccounts() {
    return await this.prisma.account.findMany({
      where: { isActive: true },
      orderBy: {
        code: "asc",
      },
    });
  }

  /**
   * Upsert monthly recommendation
   */
  async upsertMonthlyRecommendation(data) {
    const { year, month, recommendationType, recommendationText } = data;

    return await this.prisma.monthlyAIRecommendation.upsert({
      where: {
        year_month: {
          year,
          month,
        },
      },
      update: {
        recommendationType,
        recommendationText,
        updatedAt: new Date(),
      },
      create: {
        year,
        month,
        recommendationType,
        recommendationText,
        isCustom: false,
        isActive: true,
      },
    });
  }

  /**
   * Cleanup method - disconnect from database
   */
  async cleanup() {
    await this.disconnect();
  }

  /**
   * Disconnect from database
   */
  async disconnect() {
    await this.prisma.$disconnect();
  }
}

module.exports = RecommendationBusinessService;
