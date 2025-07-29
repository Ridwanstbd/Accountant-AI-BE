const accountService = require("../services/accountService");

class AccountController {
  async getAllAccounts(req, res, next) {
    try {
      const { type, category, active } = req.query;
      const accounts = await accountService.getAllAccounts({
        type,
        category,
        active,
      });

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
      const { id } = req.params;
      const account = await accountService.getAccountById(id);

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
      const account = await accountService.createAccount(req.body);

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
      const { id } = req.params;
      const account = await accountService.updateAccount(id, req.body);

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
      const { id } = req.params;
      const account = await accountService.deactivateAccount(id);

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
      const trialBalance = await accountService.getTrialBalance();

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
