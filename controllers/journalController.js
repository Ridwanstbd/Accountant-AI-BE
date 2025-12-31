const journalService = require("../services/journalService");

class JournalController {
  async getAllJournals(req, res, next) {
    try {
      const businessId = req.headers["x-business-id"];
      const journals = await journalService.getAllJournals(
        businessId,
        req.query
      );

      res.status(200).json({
        success: true,
        data: journals,
      });
    } catch (error) {
      next(error);
    }
  }

  async getJournalById(req, res, next) {
    try {
      const businessId = req.headers["x-business-id"];
      const { id } = req.params;
      const journal = await journalService.getJournalById(businessId, id);

      if (!journal) {
        return res.status(404).json({
          success: false,
          message: "Journal not found",
        });
      }

      res.status(200).json({
        success: true,
        data: journal,
      });
    } catch (error) {
      next(error);
    }
  }

  async createJournal(req, res, next) {
    try {
      const businessId = req.headers["x-business-id"];
      const journal = await journalService.createJournal(businessId, req.body);

      res.status(201).json({
        success: true,
        message: "Journal created successfully",
        data: journal,
      });
    } catch (error) {
      next(error);
    }
  }

  async createSalesJournal(req, res, next) {
    try {
      const businessId = req.headers["x-business-id"];
      const journal = await journalService.createSalesJournal(
        businessId,
        req.body
      );

      res.status(201).json({
        success: true,
        message: "Sales journal created successfully",
        data: journal,
      });
    } catch (error) {
      next(error);
    }
  }

  async postJournal(req, res, next) {
    try {
      const businessId = req.headers["x-business-id"];
      const { id } = req.params;
      const journal = await journalService.postJournal(businessId, id);

      res.status(200).json({
        success: true,
        message: "Journal posted successfully. Account balances updated.",
        data: journal,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteJournal(req, res, next) {
    try {
      const businessId = req.headers["x-business-id"];
      const { id } = req.params;
      await journalService.deleteJournal(businessId, id);

      res.status(200).json({
        success: true,
        message: "Journal deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new JournalController();
