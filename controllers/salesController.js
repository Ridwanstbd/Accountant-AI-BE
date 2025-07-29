const salesService = require("../services/salesService");

class SalesController {
  async getAllSales(req, res, next) {
    try {
      const { status, customerId, startDate, endDate } = req.query;
      const sales = await salesService.getAllSales({
        status,
        customerId,
        startDate,
        endDate,
      });

      res.status(200).json({
        success: true,
        message: "Sales retrieved successfully",
        data: sales,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSaleById(req, res, next) {
    try {
      const { id } = req.params;
      const sale = await salesService.getSaleById(id);

      if (!sale) {
        return res.status(404).json({
          success: false,
          message: "Sale not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Sale retrieved successfully",
        data: sale,
      });
    } catch (error) {
      next(error);
    }
  }

  async createSale(req, res, next) {
    try {
      const sale = await salesService.createSale(req.body);

      res.status(201).json({
        success: true,
        message: "Sale created successfully",
        data: sale,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateSaleStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const sale = await salesService.updateSaleStatus(id, status);

      res.status(200).json({
        success: true,
        message: "Sale status updated successfully",
        data: sale,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteSale(req, res, next) {
    try {
      const { id } = req.params;
      await salesService.deleteSale(id);

      res.status(200).json({
        success: true,
        message: "Sale deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async getSalesReport(req, res, next) {
    try {
      const { startDate, endDate, customerId } = req.query;
      const report = await salesService.getSalesReport({
        startDate,
        endDate,
        customerId,
      });

      res.status(200).json({
        success: true,
        message: "Sales report retrieved successfully",
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SalesController();
