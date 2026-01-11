const reportService = require("../services/reportService");

class ReportController {
  getBid = (req) => req.headers["x-business-id"];

  // Helper untuk validasi tanggal agar tidak "Invalid Date"
  parseDate = (dateStr, defaultDate) => {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? defaultDate : d;
  };

  getProfitAndLoss = async (req, res, next) => {
    try {
      const { startDate, endDate } = req.query;
      const data = await reportService.getProfitAndLoss(
        this.getBid(req),
        this.parseDate(startDate, new Date(new Date().getFullYear(), 0, 1)), // Default: Jan 1st
        this.parseDate(endDate, new Date())
      );
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  getBalanceSheet = async (req, res, next) => {
    try {
      // Sekarang mendukung historical balance sheet via query param
      const { date } = req.query;
      const data = await reportService.getBalanceSheet(
        this.getBid(req),
        this.parseDate(date, new Date())
      );
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  getRatios = async (req, res, next) => {
    try {
      const { startDate, endDate } = req.query;
      const start = this.parseDate(
        startDate,
        new Date(new Date().getFullYear(), 0, 1)
      );
      const end = this.parseDate(endDate, new Date());

      const data = await reportService.getFinancialRatios(
        this.getBid(req),
        start,
        end
      );
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
