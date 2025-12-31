const express = require("express");
const RecommendationController = require("../controllers/recommendationController");
const { verifyToken } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const {
  generateMonthlySchema,
  generateCustomSchema,
  recommendationQuerySchema,
  updateRecommendationSchema,
  bulkDeleteSchema,
} = require("../validators/recommendationValidator");

const router = express.Router();
const recommendationController = new RecommendationController();

router.use(verifyToken);

router.get("/", validate(recommendationQuerySchema, "query"), (req, res) =>
  recommendationController.getRecommendations(req, res)
);
router.post("/monthly", validate(generateMonthlySchema, "body"), (req, res) =>
  recommendationController.generateMonthlyRecommendation(req, res)
);
router.post("/custom", validate(generateCustomSchema, "body"), (req, res) =>
  recommendationController.generateCustomRecommendation(req, res)
);
router.post("/analyze", validate(generateMonthlySchema, "body"), (req, res) =>
  recommendationController.analyzeFinancialData(req, res)
);

router.put("/:id", validate(updateRecommendationSchema, "body"), (req, res) =>
  recommendationController.updateRecommendation(req, res)
);
router.delete("/", validate(bulkDeleteSchema, "body"), (req, res) =>
  recommendationController.bulkDeleteRecommendations(req, res)
);

// Rute lainnya (tetap sama)
router.get("/status", (req, res) =>
  recommendationController.getServiceStatus(req, res)
);
router.get("/:id", (req, res) =>
  recommendationController.getRecommendationById(req, res)
);
router.delete("/:id", (req, res) =>
  recommendationController.deleteRecommendation(req, res)
);

module.exports = router;
