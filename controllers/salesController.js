const salesService = require("../services/salesService");

class SalesController {
  async getAllSales(req, res, next) {
    try {
      const businessId = req.headers["x-business-id"];
      // req.query sudah bersih lewat middleware salesQuerySchema
      const sales = await salesService.getAllSales(businessId, req.query);

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
      const businessId = req.headers["x-business-id"];
      const { id } = req.params;
      const sale = await salesService.getSaleById(businessId, id);

      if (!sale) {
        return res.status(404).json({
          success: false,
          message: "Sale not found",
        });
      }

      res.status(200).json({
        success: true,
        data: sale,
      });
    } catch (error) {
      next(error);
    }
  }

  async createSale(req, res, next) {
    try {
      const businessId = req.headers["x-business-id"];
      const sale = await salesService.createSale(businessId, req.body);

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
      const businessId = req.headers["x-business-id"];
      const { id } = req.params;
      const { status } = req.body;
      const sale = await salesService.updateSaleStatus(businessId, id, status);

      res.status(200).json({
        success: true,
        message: `Sale status updated to ${status}`,
        data: sale,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteSale(req, res, next) {
    try {
      const businessId = req.headers["x-business-id"];
      const { id } = req.params;
      await salesService.deleteSale(businessId, id);

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
      const businessId = req.headers["x-business-id"];
      const report = await salesService.getSalesReport(businessId, req.query);

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SalesController();
