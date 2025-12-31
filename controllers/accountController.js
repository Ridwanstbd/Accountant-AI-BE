const accountService = require("../services/accountService");

class AccountController {
  async getAllAccounts(req, res, next) {
    try {
      const businessId = req.headers["x-business-id"];
      const accounts = await accountService.getAllAccounts(businessId, req.query);

      res.status(200).json({
        success: true,
        message: "Accounts retrieved successfully",
        data: accounts,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAccountById(req, res, next) {
    try {
      const businessId = req.headers["x-business-id"];
      const { id } = req.params;
      const account = await accountService.getAccountById(businessId, id);

      if (!account) {
        return res.status(404).json({
          success: false,
          message: "Account not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Account retrieved successfully",
        data: account,
      });
    } catch (error) {
      next(error);
    }
  }

  async createAccount(req, res, next) {
    try {
      const businessId = req.headers["x-business-id"];
      const account = await accountService.createAccount(businessId, req.body);

      res.status(201).json({
        success: true,
        message: "Account created successfully",
        data: account,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateAccount(req, res, next) {
    try {
      const businessId = req.headers["x-business-id"];
      const { id } = req.params;
      const account = await accountService.updateAccount(businessId, id, req.body);

      res.status(200).json({
        success: true,
        message: "Account updated successfully",
        data: account,
      });
    } catch (error) {
      next(error);
    }
  }

  async deactivateAccount(req, res, next) {
    try {
      const businessId = req.headers["x-business-id"];
      const { id } = req.params;
      const account = await accountService.deactivateAccount(businessId, id);

      res.status(200).json({
        success: true,
        message: "Account deactivated successfully",
        data: account,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTrialBalance(req, res, next) {
    try {
      const businessId = req.headers["x-business-id"];
      const trialBalance = await accountService.getTrialBalance(businessId);

      res.status(200).json({
        success: true,
        message: "Trial balance retrieved successfully",
        data: trialBalance,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AccountController();