const Joi = require("joi");

const journalEntrySchema = Joi.object({
  debitAccountId: Joi.string().allow(null, ""),
  creditAccountId: Joi.string().allow(null, ""),
  description: Joi.string().max(255).allow(null, ""),
  debitAmount: Joi.number().min(0).default(0),
  creditAmount: Joi.number().min(0).default(0),
}).or("debitAccountId", "creditAccountId");

const createJournalSchema = Joi.object({
  date: Joi.date().required().messages({
    "any.required": "Tanggal jurnal wajib diisi",
  }),
  type: Joi.string()
    .valid("GENERAL", "SALES", "PURCHASE", "EXPENSE", "ADJUSTMENT")
    .required(),
  reference: Joi.string().max(100).allow(null, ""),
  entries: Joi.array().items(journalEntrySchema).min(2).required().messages({
    "array.min": "Jurnal minimal harus memiliki 2 entri (debit dan kredit)",
  }),
}).custom((value, helpers) => {
  const totalDebit = value.entries.reduce(
    (sum, e) => sum + (e.debitAmount || 0),
    0
  );
  const totalCredit = value.entries.reduce(
    (sum, e) => sum + (e.creditAmount || 0),
    0
  );

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    return helpers.message("Total Debit dan Kredit tidak seimbang");
  }
  return value;
});

const createSalesJournalSchema = Joi.object({
  saleId: Joi.string().required(),
  cashAccountId: Joi.string().required(),
  salesAccountId: Joi.string().required(),
  taxAccountId: Joi.string().allow(null, "").optional(),
});

const journalQuerySchema = Joi.object({
  type: Joi.string()
    .valid("GENERAL", "SALES", "PURCHASE", "EXPENSE", "ADJUSTMENT")
    .optional(),
  status: Joi.string().valid("DRAFT", "POSTED").optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().min(Joi.ref("startDate")).optional().messages({
    "date.min": "Tanggal akhir tidak boleh lebih kecil dari tanggal mulai",
  }),
});

module.exports = {
  createJournalSchema,
  createSalesJournalSchema,
  journalQuerySchema,
};
