const express = require("express");
const salesController = require("../controllers/salesController");
const { verifyToken } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const {
  createSaleSchema,
  updateSaleStatusSchema,
  salesQuerySchema,
} = require("../validators/salesValidator");

const router = express.Router();

router.use(verifyToken);

router.get(
  "/report",
  validate(salesQuerySchema, "query"),
  salesController.getSalesReport
);

router.get(
  "/",
  validate(salesQuerySchema, "query"),
  salesController.getAllSales
);

router.post(
  "/",
  validate(createSaleSchema, "body"),
  salesController.createSale
);

router.get("/:id", salesController.getSaleById);

router.patch(
  "/:id/status",
  validate(updateSaleStatusSchema, "body"),
  salesController.updateSaleStatus
);

router.delete("/:id", salesController.deleteSale);

module.exports = router;
