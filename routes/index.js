const express = require("express");

const authRoutes = require("./auth");
const userRoutes = require("./user");
const roleRoutes = require("./role");
const permissionRoutes = require("./permission");
const businessRoutes = require("./business");
const accountRoutes = require("./accounts");
const journalRoutes = require("./journals");
const customerRoutes = require("./customers");
const salesRoutes = require("./sales");
const reportRoutes = require("./reports");
const recommendationRoutes = require("./recommendations");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/roles", roleRoutes);
router.use("/permissions", permissionRoutes);
router.use("/business", businessRoutes);
router.use("/accounts", accountRoutes);
router.use("/journals", journalRoutes);
router.use("/customers", customerRoutes);
router.use("/sales", salesRoutes);
router.use("/reports", reportRoutes);
router.use("/recommendations", recommendationRoutes);

router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
