const Joi = require("joi");

const saleItemSchema = Joi.object({
  productName: Joi.string().min(1).max(255).required().messages({
    "string.empty": "Nama produk tidak boleh kosong",
  }),
  quantity: Joi.number().positive().required().messages({
    "number.positive": "Kuantitas harus lebih dari 0",
  }),
  price: Joi.number().min(0).required().messages({
    "number.min": "Harga tidak boleh negatif",
  }),
});

const createSaleSchema = Joi.object({
  customerId: Joi.string().guid({ version: "uuidv4" }).required().messages({
    "any.required": "Customer ID wajib diisi",
  }),
  date: Joi.date().required(),
  tax: Joi.number().min(0).default(0),
  items: Joi.array().items(saleItemSchema).min(1).required().messages({
    "array.min": "Minimal harus ada 1 item produk",
  }),
});

const updateSaleStatusSchema = Joi.object({
  status: Joi.string()
    .valid("PENDING", "CONFIRMED", "COMPLETED", "CANCELLED")
    .required()
    .messages({
      "any.only":
        "Status harus salah satu dari: PENDING, CONFIRMED, COMPLETED, CANCELLED",
    }),
});

const salesQuerySchema = Joi.object({
  status: Joi.string()
    .valid("PENDING", "CONFIRMED", "COMPLETED", "CANCELLED")
    .optional(),
  customerId: Joi.string().guid({ version: "uuidv4" }).optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().min(Joi.ref("startDate")).optional(),
});

module.exports = {
  createSaleSchema,
  updateSaleStatusSchema,
  salesQuerySchema,
};
