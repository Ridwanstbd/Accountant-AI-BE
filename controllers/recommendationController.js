const RecommendationBusinessService = require("../services/recommendationBusinessService");
const AIService = require("../services/aiService");

class RecommendationController {
  constructor() {
    this.recommendationService = new RecommendationBusinessService();
    this.aiService = new AIService();
  }

  async generateMonthlyRecommendation(req, res) {
    try {
      const { year, month } = req.body;

      const result =
        await this.recommendationService.generateMonthlyRecommendation(
          year,
          month
        );

      res.status(200).json({
        success: true,
        message: "Rekomendasi AI berhasil dibuat dan disimpan.",
        data: {
          recommendation: result.recommendation,
          financialSummary: result.financialSummary,
        },
        meta: {
          aiRawOutput: result.aiRawOutput,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Error generating monthly recommendation:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan saat membuat rekomendasi AI.",
        error: error.message,
      });
    }
  }

  async getRecommendationById(req, res) {
    try {
      const { id } = req.params;

      const recommendation =
        await this.recommendationService.prisma.monthlyAIRecommendation.findUnique(
          {
            where: { id: id },
          }
        );

      if (!recommendation) {
        return res.status(404).json({
          success: false,
          message: "Rekomendasi tidak ditemukan.",
        });
      }

      res.status(200).json({
        success: true,
        message: "Rekomendasi berhasil ditemukan.",
        data: recommendation,
      });
    } catch (error) {
      console.error("Error getting recommendation by ID:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan saat mengambil rekomendasi.",
        error: error.message,
      });
    }
  }

  async getRecommendations(req, res) {
    try {
      const {
        startDate,
        endDate,
        year,
        month,
        type,
        isCustom,
        userId,
        limit = 10,
        offset = 0,
        sortBy = "generatedAt",
        sortOrder = "desc",
      } = req.query;

      const filters = {
        startDate,
        endDate,
        year,
        month,
        type,
        isCustom,
        userId,
        limit,
        offset,
        sortBy,
        sortOrder,
      };

      const result = await this.recommendationService.getRecommendations(
        filters
      );

      res.status(200).json({
        success: true,
        message: "Rekomendasi berhasil diambil.",
        data: result.data,
        pagination: result.pagination,
        statistics: result.statistics,
      });
    } catch (error) {
      console.error("Error getting recommendations:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan saat mengambil rekomendasi.",
        error: error.message,
      });
    }
  }

  async generateCustomRecommendation(req, res) {
    try {
      const {
        prompt,
        year,
        month,
        includeFinancialData = false,
        userId = null,
        model,
        temperature,
        maxTokens,
      } = req.body;

      const aiOptions = {};
      if (model) aiOptions.model = model;
      if (temperature) aiOptions.temperature = temperature;
      if (maxTokens) aiOptions.maxTokens = maxTokens;

      const result =
        await this.recommendationService.generateCustomRecommendation({
          prompt,
          year,
          month,
          includeFinancialData,
          userId,
          aiOptions,
        });

      res.status(200).json({
        success: true,
        message: "Rekomendasi custom berhasil dibuat.",
        data: result.recommendation,
        meta: {
          originalPrompt: result.originalPrompt,
          finalPrompt: result.finalPrompt,
          aiRawOutput: result.aiRawOutput,
          aiOptions: aiOptions,
        },
      });
    } catch (error) {
      console.error("Error generating custom recommendation:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan saat membuat rekomendasi custom.",
        error: error.message,
      });
    }
  }

  async generateRecommendationVariations(req, res) {
    try {
      const { year, month, variations = 3 } = req.body;

      const financialData =
        await this.recommendationService.getFinancialDataForMonth(year, month);

      const variationResults =
        await this.aiService.generateRecommendationVariations(
          financialData.summary,
          variations
        );

      res.status(200).json({
        success: true,
        message: "Variasi rekomendasi berhasil dibuat.",
        data: {
          variations: variationResults,
          financialSummary: {
            totalRevenue: financialData.processed.totalRevenue,
            totalExpense: financialData.processed.totalExpense,
            netIncome: financialData.processed.netIncome,
          },
        },
        meta: {
          year,
          month,
          variationCount: variationResults.length,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Error generating recommendation variations:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan saat membuat variasi rekomendasi.",
        error: error.message,
      });
    }
  }

  async analyzeFinancialData(req, res) {
    try {
      const { year, month } = req.body;

      const financialData =
        await this.recommendationService.getFinancialDataForMonth(year, month);

      const analysis = await this.aiService.analyzeFinancialData({
        ...financialData.processed,
        transactionCount: financialData.raw.journalEntries.length,
      });

      res.status(200).json({
        success: true,
        message: "Analisis data keuangan berhasil.",
        data: {
          analysis: analysis,
          financialData: {
            totalRevenue: financialData.processed.totalRevenue,
            totalExpense: financialData.processed.totalExpense,
            netIncome: financialData.processed.netIncome,
            transactionCount: financialData.raw.journalEntries.length,
          },
        },
        meta: {
          year,
          month,
          analyzedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Error analyzing financial data:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan saat menganalisis data keuangan.",
        error: error.message,
      });
    }
  }

  async testAIConnection(req, res) {
    try {
      const { model } = req.query;

      const testResult = await this.aiService.testConnection(model);

      res.status(testResult.success ? 200 : 503).json({
        success: testResult.success,
        message: testResult.success
          ? "Koneksi AI berhasil ditest."
          : "Koneksi AI gagal.",
        data: testResult,
      });
    } catch (error) {
      console.error("Error testing AI connection:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan saat testing koneksi AI.",
        error: error.message,
      });
    }
  }

  async getAvailableModels(req, res) {
    try {
      const models = await this.aiService.getAvailableModels();

      res.status(200).json({
        success: true,
        message: "Daftar model AI berhasil diambil.",
        data: {
          models: models,
          currentModel: this.aiService.defaultModel,
          config: this.aiService.getConfig(),
        },
      });
    } catch (error) {
      console.error("Error getting available models:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan saat mengambil daftar model.",
        error: error.message,
      });
    }
  }

  async updateRecommendation(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const updatedRecommendation =
        await this.recommendationService.updateRecommendation(id, updateData);

      res.status(200).json({
        success: true,
        message: "Rekomendasi berhasil diperbarui.",
        data: updatedRecommendation,
      });
    } catch (error) {
      console.error("Error updating recommendation:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan saat memperbarui rekomendasi.",
        error: error.message,
      });
    }
  }

  async deleteRecommendation(req, res) {
    try {
      const { id } = req.params;

      const result = await this.recommendationService.deleteRecommendation(id);

      res.status(200).json({
        success: true,
        message: result.message,
        data: { deletedId: id },
      });
    } catch (error) {
      console.error("Error deleting recommendation:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan saat menghapus rekomendasi.",
        error: error.message,
      });
    }
  }

  async bulkDeleteRecommendations(req, res) {
    try {
      const { ids } = req.body;

      const deleteResult =
        await this.recommendationService.prisma.monthlyAIRecommendation.deleteMany(
          {
            where: {
              id: { in: ids },
            },
          }
        );

      res.status(200).json({
        success: true,
        message: `${deleteResult.count} rekomendasi berhasil dihapus.`,
        data: {
          deletedCount: deleteResult.count,
          requestedIds: ids,
        },
      });
    } catch (error) {
      console.error("Error bulk deleting recommendations:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan saat menghapus rekomendasi.",
        error: error.message,
      });
    }
  }

  async regenerateRecommendation(req, res) {
    try {
      const { id } = req.params;
      const { forceRegenerate = false } = req.body;

      const result = await this.recommendationService.regenerateRecommendation(
        id,
        forceRegenerate
      );

      res.status(200).json({
        success: true,
        message: result.regenerated
          ? "Rekomendasi berhasil dibuat ulang."
          : result.message,
        data: {
          recommendation: result.recommendation,
          financialSummary: result.financialSummary,
        },
        meta: {
          regenerated: result.regenerated,
          previousRecommendation: result.previousRecommendation,
          aiRawOutput: result.aiRawOutput,
        },
      });
    } catch (error) {
      console.error("Error regenerating recommendation:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan saat membuat ulang rekomendasi.",
        error: error.message,
      });
    }
  }

  async exportRecommendations(req, res) {
    try {
      const { format = "json", startDate, endDate, type } = req.query;

      // Build filter
      const where = {};
      if (startDate || endDate) {
        const dateFilter = {};
        if (startDate) dateFilter.gte = new Date(startDate);
        if (endDate) dateFilter.lte = new Date(endDate);
        where.generatedAt = dateFilter;
      }
      if (type) where.recommendationType = type;

      const recommendations =
        await this.recommendationService.prisma.monthlyAIRecommendation.findMany(
          {
            where,
            orderBy: { generatedAt: "desc" },
          }
        );

      switch (format) {
        case "csv":
          const csvData = this.convertToCSV(recommendations);
          res.setHeader("Content-Type", "text/csv");
          res.setHeader(
            "Content-Disposition",
            "attachment; filename=recommendations.csv"
          );
          return res.send(csvData);

        case "pdf":
          return res.status(501).json({
            success: false,
            message: "PDF export belum diimplementasikan.",
          });

        default:
          res.status(200).json({
            success: true,
            message: "Data rekomendasi berhasil diekspor.",
            data: recommendations,
            meta: {
              exportedAt: new Date().toISOString(),
              format: format,
              count: recommendations.length,
            },
          });
      }
    } catch (error) {
      console.error("Error exporting recommendations:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan saat mengekspor rekomendasi.",
        error: error.message,
      });
    }
  }

  async getServiceStatus(req, res) {
    try {
      const status = await this.recommendationService.getServiceStatus();

      res.status(200).json({
        success: true,
        message: "Status layanan berhasil diambil.",
        data: status,
      });
    } catch (error) {
      console.error("Error getting service status:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan saat mengecek status layanan.",
        error: error.message,
      });
    }
  }

  convertToCSV(data) {
    if (!data.length) return "";

    const headers = Object.keys(data[0]).join(",");
    const rows = data.map((item) =>
      Object.values(item)
        .map((value) =>
          typeof value === "string" ? `"${value.replace(/"/g, '""')}"` : value
        )
        .join(",")
    );

    return [headers, ...rows].join("\n");
  }
}

module.exports = RecommendationController;
