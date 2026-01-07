const Joi = require("joi");

const reportFilterSchema = Joi.object({
  startDate: Joi.date().optional(),
  endDate: Joi.date().min(Joi.ref("startDate")).optional(),
  month: Joi.number().integer().min(1).max(12).optional(),
  year: Joi.number().integer().min(2020).max(2100).optional(),
  accountId: Joi.string().optional(),
});

module.exports = { reportFilterSchema };
