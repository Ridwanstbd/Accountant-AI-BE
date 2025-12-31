const express = require("express");
const accountController = require("../controllers/accountController");
const { verifyToken } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const {
  createAccountSchema,
  updateAccountSchema,
  accountQuerySchema,
} = require("../validators/accountValidator");

const router = express.Router();

router.use(verifyToken);

router.get("/trial-balance", accountController.getTrialBalance);
router.get(
  "/",
  validate(accountQuerySchema, "query"),
  accountController.getAllAccounts
);
router.post(
  "/",
  validate(createAccountSchema, "body"),
  accountController.createAccount
);
router.get("/:id", accountController.getAccountById);
router.put(
  "/:id",
  validate(updateAccountSchema, "body"),
  accountController.updateAccount
);
router.patch("/:id/deactivate", accountController.deactivateAccount);

module.exports = router;
