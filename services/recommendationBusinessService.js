const AIService = require("./aiService");
const { prisma } = require("../models");
const { getMonthDateRange } = require("../utils/validation");
const {
  processFinancialData,
  generateFinancialSummary,
  determineRecommendationType,
} = require("../utils/financial");
const reportService = require("./reportService");

class RecommendationBusinessService {
  constructor() {
    this.prisma = prisma;
    this.aiService = new AIService();
  }

  async generateMonthlyRecommendation(businessId, year, month) {
    try {
      const targetYear = parseInt(year);
      const targetMonth = parseInt(month);

      if (!targetYear || !targetMonth) {
        throw new Error("Tahun dan bulan diperlukan dan harus valid");
      }

      const { startDate, endDate } = getMonthDateRange(targetYear, targetMonth);

      // Kirim objek Date yang sudah pasti valid ke reportService
      const financialMetrics = await reportService.getFinancialRatios(
        businessId,
        startDate,
        endDate
      );

      // Tambahkan data jumlah transaksi (opsional sebagai context tambahan)
      const transactionCount = await this.prisma.journalEntry.count({
        where: {
          journal: { businessId, date: { gte: startDate, lte: endDate } },
        },
      });

      const fullFinancialData = {
        ...financialMetrics,
        transactionCount,
      };

      // 4. Generate AI recommendation menggunakan analyzeFinancialData (Output JSON)
      const aiAnalysis = await this.aiService.analyzeFinancialData(
        fullFinancialData
      );

      // 5. Simpan ke Database
      // Karena aiAnalysis berbentuk objek, kita simpan 'reasoning' atau gabungan insight ke kolom text
      const savedRecommendation = await this.saveRecommendation({
        businessId,
        year,
        month,
        recommendationType: aiAnalysis.recommendedType,
        recommendationText: aiAnalysis.reasoning, // Simpan alasan utama
        keyInsights: aiAnalysis.keyInsights, // Jika schema DB mendukung JSON, simpan ini
        priority: aiAnalysis.priority,
      });

      return {
        recommendation: savedRecommendation,
        financialMetrics: fullFinancialData,
        aiFullAnalysis: aiAnalysis,
        isNew: true,
      };
    } catch (error) {
      throw new Error(
        `Failed to generate monthly recommendation: ${error.message}`
      );
    }
  }

  async generateCustomRecommendation(businessId, params) {
    const {
      prompt,
      year,
      month,
      includeFinancialData = false,
      userId = null,
    } = params;

    try {
      let financialContext = "";
      const targetYear = year || new Date().getFullYear();
      const targetMonth = month || new Date().getMonth() + 1;
      const { startDate, endDate } = getMonthDateRange(targetYear, targetMonth);

      if (includeFinancialData) {
        // Ambil data rasio untuk context AI
        const metrics = await reportService.getFinancialRatios(
          businessId,
          startDate,
          endDate
        );

        financialContext = `
          Context Financial Data (${targetMonth}/${targetYear}):
          - Revenue: Rp${metrics.totalRevenue.toLocaleString()}
          - Expense: Rp${metrics.totalExpense.toLocaleString()}
          - Net Profit: Rp${metrics.netProfit.toLocaleString()}
          - ROI: ${metrics.roi}%
          - BEP: Rp${metrics.bep.toLocaleString()}
        `;
      }

      // Kirim ke AI Service
      const aiResponse = await this.aiService.generateCustomRecommendation(
        prompt,
        {
          includeFinancialContext: includeFinancialData,
          financialData: financialContext,
          recommendationType: "General",
        }
      );

      // Simpan sebagai custom recommendation
      const saved = await this.prisma.monthlyAIRecommendation.create({
        data: {
          businessId,
          year: targetYear,
          month: targetMonth,
          recommendationType: "General",
          recommendationText: aiResponse,
          isCustom: true,
          customPrompt: prompt,
          userId: userId,
        },
      });

      return { recommendation: saved, aiRawOutput: aiResponse };
    } catch (error) {
      throw new Error(
        `Failed to generate custom recommendation: ${error.message}`
      );
    }
  }

  async getRecommendations(businessId, filters) {
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
      const where = { businessId, isActive };

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
          include: {
            business: true,
          },
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

  async updateRecommendation(businessId, id, updateData) {
    try {
      // Check if recommendation exists and belongs to the business
      const existingRecommendation =
        await this.prisma.monthlyAIRecommendation.findFirst({
          where: {
            id,
            businessId,
          },
        });

      if (!existingRecommendation) {
        throw new Error(
          "Rekomendasi tidak ditemukan atau tidak memiliki akses"
        );
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

  async deleteRecommendation(businessId, id) {
    try {
      // Check if recommendation exists and belongs to the business
      const existingRecommendation =
        await this.prisma.monthlyAIRecommendation.findFirst({
          where: {
            id,
            businessId,
          },
        });

      if (!existingRecommendation) {
        throw new Error(
          "Rekomendasi tidak ditemukan atau tidak memiliki akses"
        );
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

  async getServiceStatus(businessId) {
    try {
      const [dbHealth, aiHealth, systemStats] = await Promise.all([
        this.checkDatabaseHealth(businessId),
        this.checkAIServiceHealth(),
        this.getSystemStatistics(businessId),
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

  async getFinancialDataForMonth(businessId, year, month) {
    const { startDate, endDate } = getMonthDateRange(year, month);

    const [journalEntries, accounts] = await Promise.all([
      this.getJournalEntriesByDateRange(businessId, startDate, endDate),
      this.getAllAccounts(businessId),
    ]);

    const processed = processFinancialData(journalEntries);
    const summary = generateFinancialSummary(processed, month, year);

    return {
      raw: { journalEntries, accounts },
      processed,
      summary,
    };
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
    const { businessId, year, month, recommendationType, recommendationText } =
      data;

    return await this.prisma.monthlyAIRecommendation.upsert({
      where: {
        business_year_month: {
          businessId,
          year: parseInt(year),
          month: parseInt(month),
        },
      },
      update: {
        recommendationType,
        recommendationText,
        isCustom: false,
        updatedAt: new Date(),
      },
      create: {
        businessId,
        year: parseInt(year),
        month: parseInt(month),
        recommendationType,
        recommendationText,
        isCustom: false,
        isActive: true,
      },
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
  async checkDatabaseHealth(businessId) {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const recommendationCount =
        await this.prisma.monthlyAIRecommendation.count({
          where: { businessId },
        });

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
  async getSystemStatistics(businessId) {
    const [totalRecommendations, activeRecommendations, customRecommendations] =
      await Promise.all([
        this.prisma.monthlyAIRecommendation.count({
          where: { businessId },
        }),
        this.prisma.monthlyAIRecommendation.count({
          where: { businessId, isActive: true },
        }),
        this.prisma.monthlyAIRecommendation.count({
          where: { businessId, isCustom: true, isActive: true },
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
  async getJournalEntriesByDateRange(businessId, startDate, endDate) {
    return await this.prisma.journalEntry.findMany({
      where: {
        journal: {
          businessId,
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
  async getAllAccounts(businessId) {
    return await this.prisma.account.findMany({
      where: {
        businessId,
        isActive: true,
      },
      orderBy: {
        code: "asc",
      },
    });
  }

  /**
   * Upsert monthly recommendation
   */
  async upsertMonthlyRecommendation(data) {
    const { businessId, year, month, recommendationType, recommendationText } =
      data;

    return await this.prisma.monthlyAIRecommendation.upsert({
      where: {
        business_year_month: {
          businessId,
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
        businessId,
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
