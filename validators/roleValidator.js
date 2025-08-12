const Joi = require("joi");

const createRoleSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  displayName: Joi.string().min(2).max(100).required(),
});

const updateRoleSchema = Joi.object({
  name: Joi.string().min(2).max(50),
  displayName: Joi.string().min(2).max(100),
  isActive: Joi.boolean(),
});

const assignPermissionSchema = Joi.object({
  permissionId: Joi.string().required(),
});

const assignMultiplePermissionsSchema = Joi.object({
  permissionIds: Joi.array().items(Joi.string()).min(1).required(),
});

module.exports = {
  createRoleSchema,
  updateRoleSchema,
  assignPermissionSchema,
  assignMultiplePermissionsSchema,
};
