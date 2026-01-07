const Joi = require("joi");

const generateMonthlySchema = Joi.object({
  year: Joi.number().integer().min(2020).max(2100).required(),
  month: Joi.number().integer().min(1).max(12).required(),
});

const generateCustomSchema = Joi.object({
  prompt: Joi.string().min(10).required().messages({
    "string.min": "Prompt minimal 10 karakter agar hasil AI optimal",
  }),
  year: Joi.number().integer().min(2020).max(2100).optional(),
  month: Joi.number().integer().min(1).max(12).optional(),
  includeFinancialData: Joi.boolean().default(false),
  userId: Joi.string().optional(),
  model: Joi.string().optional(),
  temperature: Joi.number().min(0).max(2).optional(),
  maxTokens: Joi.number().integer().min(100).max(4000).optional(),
});

const recommendationQuerySchema = Joi.object({
  startDate: Joi.date().optional(),
  endDate: Joi.date().min(Joi.ref("startDate")).optional(),
  year: Joi.number().integer().optional(),
  month: Joi.number().integer().min(1).max(12).optional(),
  type: Joi.string()
    .valid("CostSaving", "RevenueOptimization", "CashFlow", "General")
    .optional(),
  isCustom: Joi.boolean().optional(),
  userId: Joi.string().optional(),
  limit: Joi.number().integer().min(1).max(100).default(10),
  offset: Joi.number().integer().min(0).default(0),
  sortBy: Joi.string()
    .valid("generatedAt", "year", "month")
    .default("generatedAt"),
  sortOrder: Joi.string().valid("asc", "desc").default("desc"),
});

const updateRecommendationSchema = Joi.object({
  recommendationText: Joi.string().min(10).optional(),
  recommendationType: Joi.string()
    .valid("CostSaving", "RevenueOptimization", "CashFlow", "General")
    .optional(),
  isActive: Joi.boolean().optional(),
}).min(1);

const bulkDeleteSchema = Joi.object({
  ids: Joi.array().items(Joi.string()).min(1).required(),
});

module.exports = {
  generateMonthlySchema,
  generateCustomSchema,
  recommendationQuerySchema,
  updateRecommendationSchema,
  bulkDeleteSchema,
};
