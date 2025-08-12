const Joi = require("joi");

const updateUserSchema = Joi.object({
  firstName: Joi.string().min(1).max(50),
  lastName: Joi.string().min(1).max(50),
  avatar: Joi.string().uri(),
});

const assignRoleSchema = Joi.object({
  roleId: Joi.string().required(),
});

const businessUserSchema = Joi.object({
  businessId: Joi.string().required(),
  userId: Joi.string().required(),
  roleId: Joi.string().required(),
});

module.exports = {
  updateUserSchema,
  assignRoleSchema,
  businessUserSchema,
};
