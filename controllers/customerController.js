const customerService = require("../services/customerService");

class CustomerController {
  async getAllCustomers(req, res, next) {
    try {
      const businessId = req.headers["x-business-id"];
      const { search } = req.query;

      const customers = await customerService.getAllCustomers(
        businessId,
        search
      );
      res.status(200).json({ success: true, data: customers });
    } catch (error) {
      next(error);
    }
  }

  async createCustomer(req, res, next) {
    try {
      const businessId = req.headers["x-business-id"];
      const customer = await customerService.createCustomer(
        businessId,
        req.body
      );

      res.status(201).json({
        success: true,
        message: "Customer created successfully",
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCustomer(req, res, next) {
    try {
      const businessId = req.headers["x-business-id"];
      const { id } = req.params;

      const customer = await customerService.updateCustomer(
        businessId,
        id,
        req.body
      );
      res.status(200).json({
        success: true,
        message: "Customer updated successfully",
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteCustomer(req, res, next) {
    try {
      const businessId = req.headers["x-business-id"];
      const { id } = req.params;

      await customerService.deleteCustomer(businessId, id);
      res.status(200).json({
        success: true,
        message: "Customer deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CustomerController();
