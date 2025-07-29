const express = require("express");
const salesController = require("../controllers/salesController");

const router = express.Router();

router.get("/report", salesController.getSalesReport);
router.get("/", salesController.getAllSales);
router.post("/", salesController.createSale);
router.get("/:id", salesController.getSaleById);
router.patch("/:id/status", salesController.updateSaleStatus);
router.delete("/:id", salesController.deleteSale);

module.exports = router;
