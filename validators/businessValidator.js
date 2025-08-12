const Joi = require("joi");

const createBusinessSchema = Joi.object({
  code: Joi.string().min(2).max(20).alphanum().required(),
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(500).optional(),
  address: Joi.string().max(500).optional(),
  phone: Joi.string()
    .pattern(/^[+]?[1-9][\d]{0,15}$/)
    .optional(),
  email: Joi.string().email().optional(),
});

const updateBusinessSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  description: Joi.string().max(500).allow(""),
  address: Joi.string().max(500).allow(""),
  phone: Joi.string()
    .pattern(/^[+]?[1-9][\d]{0,15}$/)
    .allow(""),
  email: Joi.string().email().allow(""),
  isActive: Joi.boolean(),
});

const assignBusinessRoleSchema = Joi.object({
  userId: Joi.string().required(),
  roleId: Joi.string().required(),
});

module.exports = {
  createBusinessSchema,
  updateBusinessSchema,
  assignBusinessRoleSchema,
};
