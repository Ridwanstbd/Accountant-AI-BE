const Joi = require("joi");

const createCustomerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    "string.empty": "Nama customer wajib diisi",
    "string.min": "Nama customer minimal 2 karakter",
    "any.required": "Nama customer wajib diisi",
  }),
  address: Joi.string().max(500).allow(null, "").optional(),
  phone: Joi.string()
    .pattern(/^[+]?[0-9]{9,15}$/)
    .allow(null, "")
    .optional()
    .messages({
      "string.pattern.base": "Format nomor telepon tidak valid",
    }),
});

const updateCustomerSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  address: Joi.string().max(500).allow(null, "").optional(),
  phone: Joi.string()
    .pattern(/^[+]?[0-9]{9,15}$/)
    .allow(null, "")
    .optional(),
}).min(1);

const customerQuerySchema = Joi.object({
  search: Joi.string().allow(null, "").optional(),
});

module.exports = {
  createCustomerSchema,
  updateCustomerSchema,
  customerQuerySchema,
};
