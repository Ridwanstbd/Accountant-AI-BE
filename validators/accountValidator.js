const Joi = require("joi");
const { ACCOUNT_TYPES } = require("../utils/constants");

const validAccountTypes = Object.values(ACCOUNT_TYPES);

const createAccountSchema = Joi.object({
  code: Joi.string().min(1).max(20).required().messages({
    "string.empty": "Kode akun tidak boleh kosong",
    "any.required": "Kode akun wajib diisi",
  }),
  name: Joi.string().min(2).max(100).required().messages({
    "string.empty": "Nama akun tidak boleh kosong",
  }),
  type: Joi.string()
    .valid(...validAccountTypes)
    .required()
    .messages({
      "any.only": `Tipe akun harus salah satu dari: ${validAccountTypes.join(
        ", "
      )}`,
    }),
  category: Joi.string().max(100).required(),
  balance: Joi.number().default(0),
});

const updateAccountSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  type: Joi.string().valid(...validAccountTypes),
  category: Joi.string().max(100),
  isActive: Joi.boolean(),
}).min(1);

const accountQuerySchema = Joi.object({
  type: Joi.string()
    .valid(...validAccountTypes)
    .optional(),
  category: Joi.string().optional(),
  active: Joi.string().valid("true", "false").optional(),
});

module.exports = {
  createAccountSchema,
  updateAccountSchema,
  accountQuerySchema,
};
