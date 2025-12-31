const express = require("express");
const reportController = require("../controllers/reportController");
const { verifyToken } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const { reportFilterSchema } = require("../validators/reportValidator");

const router = express.Router();

router.use(verifyToken);

router.get(
  "/profit-loss",
  validate(reportFilterSchema, "query"),
  reportController.getProfitAndLoss
);
router.get("/balance-sheet", reportController.getBalanceSheet);
router.get(
  "/ledger",
  validate(reportFilterSchema, "query"),
  reportController.getLedger
);
router.get("/ratios", reportController.getRatios);

router.get(
  "/export/profit-loss",
  validate(reportFilterSchema, "query"),
  reportController.exportProfitLoss
);

module.exports = router;
