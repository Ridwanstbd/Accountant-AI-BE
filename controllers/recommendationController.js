const RecommendationBusinessService = require("../services/recommendationBusinessService");
const AIService = require("../services/aiService");

class RecommendationController {
  constructor() {
    this.recommendationService = new RecommendationBusinessService();
    this.aiService = new AIService();
  }

  getBid(req) {
    return req.headers["x-business-id"];
  }

  async generateMonthlyRecommendation(req, res) {
    try {
      const { year, month } = req.body;

      const targetYear = parseInt(year) || new Date().getFullYear();
      const targetMonth = parseInt(month) || new Date().getMonth() + 1;

      const result =
        await this.recommendationService.generateMonthlyRecommendation(
          this.getBid(req),
          targetYear,
          targetMonth
        );

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getRecommendations(req, res) {
    try {
      // req.query sudah divalidasi & dibersihkan middleware
      const result = await this.recommendationService.getRecommendations(
        this.getBid(req),
        req.query
      );
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async generateCustomRecommendation(req, res) {
    try {
      const {
        prompt,
        year,
        month,
        includeFinancialData,
        userId,
        model,
        temperature,
        maxTokens,
      } = req.body;

      const aiOptions = { model, temperature, maxTokens };
      const result =
        await this.recommendationService.generateCustomRecommendation(
          this.getBid(req),
          {
            prompt,
            year,
            month,
            includeFinancialData,
            userId,
            aiOptions,
          }
        );

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateRecommendation(req, res) {
    try {
      const { id } = req.params;
      const updated = await this.recommendationService.updateRecommendation(
        this.getBid(req),
        id,
        req.body
      );
      res.status(200).json({ success: true, data: updated });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async deleteRecommendation(req, res) {
    try {
      const result = await this.recommendationService.deleteRecommendation(
        this.getBid(req),
        req.params.id
      );
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async bulkDeleteRecommendations(req, res) {
    try {
      const { ids } = req.body;
      const deleteResult =
        await this.recommendationService.prisma.monthlyAIRecommendation.deleteMany(
          {
            where: { id: { in: ids }, businessId: this.getBid(req) },
          }
        );
      res.status(200).json({ success: true, count: deleteResult.count });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getServiceStatus(req, res) {
    try {
      const status = await this.recommendationService.getServiceStatus(
        this.getBid(req)
      );
      res.status(200).json({ success: true, data: status });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = RecommendationController;
