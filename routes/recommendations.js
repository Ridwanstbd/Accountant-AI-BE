const express = require("express");
const RecommendationController = require("../controllers/recommendationController");

const router = express.Router();
const recommendationController = new RecommendationController();

router.post("/monthly", async (req, res) => {
  await recommendationController.generateMonthlyRecommendation(req, res);
});

router.post("/custom", async (req, res) => {
  await recommendationController.generateCustomRecommendation(req, res);
});

router.post("/variations", async (req, res) => {
  await recommendationController.generateRecommendationVariations(req, res);
});

router.post("/analyze", async (req, res) => {
  await recommendationController.analyzeFinancialData(req, res);
});

router.get("/export", async (req, res) => {
  await recommendationController.exportRecommendations(req, res);
});

router.get("/test-ai", async (req, res) => {
  await recommendationController.testAIConnection(req, res);
});

router.get("/models", async (req, res) => {
  await recommendationController.getAvailableModels(req, res);
});

router.get("/status", async (req, res) => {
  await recommendationController.getServiceStatus(req, res);
});

router.get("/", async (req, res) => {
  await recommendationController.getRecommendations(req, res);
});

router.post("/:id/regenerate", async (req, res) => {
  await recommendationController.regenerateRecommendation(req, res);
});

router.get("/:id", async (req, res) => {
  await recommendationController.getRecommendationById(req, res);
});

router.put("/:id", async (req, res) => {
  await recommendationController.updateRecommendation(req, res);
});

router.delete("/:id", async (req, res) => {
  await recommendationController.deleteRecommendation(req, res);
});

router.delete("/", async (req, res) => {
  await recommendationController.bulkDeleteRecommendations(req, res);
});

module.exports = router;
