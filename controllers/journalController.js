const journalService = require("../services/journalService");

class JournalController {
  async getAllJournals(req, res, next) {
    try {
      const { type, status, startDate, endDate } = req.query;
      const journals = await journalService.getAllJournals({
        type,
        status,
        startDate,
        endDate,
      });

      res.status(200).json({
        success: true,
        message: "Journals retrieved successfully",
        data: journals,
      });
    } catch (error) {
      next(error);
    }
  }

  async getJournalById(req, res, next) {
    try {
      const { id } = req.params;
      const journal = await journalService.getjournalById(id);

      if (!journal) {
        return res.status(404).json({
          success: false,
          message: "Journal not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Journal retrieved successfully",
        data: journal,
      });
    } catch (error) {
      next(error);
    }
  }

  async createJournal(req, res, next) {
    try {
      const journal = await journalService.createjournal(req.body);

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
      const journal = await journalService.createSalesJournal(req.body);

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
      const { id } = req.params;
      const journal = await journalService.postJournal(id);

      res.status(200).json({
        success: true,
        message: "Journal posted successfully",
        data: journal,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteJournal(req, res, next) {
    try {
      const { id } = req.params;
      await journalService.deleteJournal(id);

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
