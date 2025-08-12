const Joi = require("joi");

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  username: Joi.string().min(3).max(30).alphanum().required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().min(1).max(50),
  lastName: Joi.string().min(1).max(50),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const joinBusinessSchema = Joi.object({
  businessCode: Joi.string().required(),
  inviteCode: Joi.string().optional(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().min(6).required(),
});

module.exports = {
  registerSchema,
  loginSchema,
  joinBusinessSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
