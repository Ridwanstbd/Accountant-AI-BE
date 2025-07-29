const express = require("express");
const accountRoutes = require("./accounts");
const journalRoutes = require("./journals");
const customerRoutes = require("./customers");
const salesRoutes = require("./sales");
const recommendationRoutes = require("./recommendations");

const router = express.Router();

router.use("/accounts", accountRoutes);
router.use("/journals", journalRoutes);
router.use("/customers", customerRoutes);
router.use("/sales", salesRoutes);
router.use("/recommendations", recommendationRoutes);

router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
