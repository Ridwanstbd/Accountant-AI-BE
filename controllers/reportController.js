const reportService = require("../services/reportService");

class ReportController {
  getBid = (req) => {
    return req.headers["x-business-id"];
  };

  getProfitAndLoss = async (req, res, next) => {
    try {
      const { startDate, endDate } = req.query;
      const data = await reportService.getProfitAndLoss(
        this.getBid(req),
        new Date(startDate || "2000-01-01"),
        new Date(endDate || new Date())
      );
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  getBalanceSheet = async (req, res, next) => {
    try {
      const data = await reportService.getBalanceSheet(this.getBid(req));
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  getLedger = async (req, res, next) => {
    try {
      const data = await reportService.getGeneralLedger(
        this.getBid(req),
        req.query
      );
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  getRatios = async (req, res, next) => {
    try {
      const data = await reportService.getFinancialRatios(this.getBid(req));
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  exportProfitLoss = async (req, res, next) => {
    try {
      const { startDate, endDate, format = "xlsx" } = req.query;
      const businessId = this.getBid(req);

      const data = await reportService.getProfitAndLoss(
        businessId,
        new Date(startDate || "2000-01-01"),
        new Date(endDate || new Date())
      );

      // Kirim data dan filters ke service ekspor
      if (format === "pdf") {
        const buffer = await reportService.exportProfitLossPDF(
          businessId,
          data,
          { startDate, endDate }
        );
        res.setHeader("Content-Type", "application/pdf");
        res.send(buffer);
      } else {
        const buffer = await reportService.exportProfitLossExcel(
          businessId,
          data,
          { startDate, endDate }
        );
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.send(buffer);
      }
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new ReportController();
