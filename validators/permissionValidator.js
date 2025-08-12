const Joi = require("joi");

const createPermissionSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  displayName: Joi.string().min(2).max(100).required(),
  module: Joi.string().min(2).max(30).required(),
});

const updatePermissionSchema = Joi.object({
  name: Joi.string().min(2).max(50),
  displayName: Joi.string().min(2).max(100),
  module: Joi.string().min(2).max(30),
});

const createMultiplePermissionsSchema = Joi.object({
  permissions: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().min(2).max(50).required(),
        displayName: Joi.string().min(2).max(100).required(),
        module: Joi.string().min(2).max(30).required(),
      })
    )
    .min(1)
    .required(),
});

module.exports = {
  createPermissionSchema,
  updatePermissionSchema,
  createMultiplePermissionsSchema,
};
