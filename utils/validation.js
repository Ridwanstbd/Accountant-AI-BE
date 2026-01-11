const ResponseHelpers = require("./responseHelpers");

const { body, query, param, validationResult } = require("express-validator");
const {
  ACCOUNT_TYPES,
  JOURNAL_TYPES,
  JOURNAL_STATUS,
  SALE_STATUS,
} = require("./constants");

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      return ResponseHelpers.validationError(res, error.details);
    }

    next();
  };
};

const validateParams = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.params, { abortEarly: false });

    if (error) {
      return ResponseHelpers.validationError(res, error.details);
    }

    next();
  };
};

const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.query, { abortEarly: false });

    if (error) {
      return ResponseHelpers.validationError(res, error.details);
    }

    next();
  };
};

const accountValidation = {
  create: [
    body("code").notEmpty().withMessage("Kode akun harus diisi"),
    body("name").notEmpty().withMessage("Nama akun harus diisi"),
    body("type")
      .isIn(Object.values(ACCOUNT_TYPES))
      .withMessage("Tipe akun tidak valid"),
    body("category").notEmpty().withMessage("Kategori harus diisi"),
  ],

  update: [
    body("name")
      .optional()
      .notEmpty()
      .withMessage("Nama akun tidak boleh kosong"),
    body("type").optional().isIn(Object.values(ACCOUNT_TYPES)),
  ],
};

const journalValidation = {
  create: [
    body("date").isISO8601().withMessage("Format tanggal tidak valid"),
    body("type")
      .isIn(Object.values(JOURNAL_TYPES))
      .withMessage("Tipe jurnal tidak valid"),
    body("entries")
      .isArray({ min: 2 })
      .withMessage("Minimal 2 entry diperlukan"),
    body("entries.*.description")
      .notEmpty()
      .withMessage("Deskripsi entry harus diisi"),
  ],

  salesJournal: [
    body("saleId").notEmpty().withMessage("Sale ID harus diisi"),
    body("cashAccountId").notEmpty().withMessage("Akun kas harus diisi"),
    body("salesAccountId").notEmpty().withMessage("Akun penjualan harus diisi"),
  ],
};

const customerValidation = {
  create: [
    body("name").notEmpty().withMessage("Nama customer harus diisi"),
    body("email").optional().isEmail().withMessage("Format email tidak valid"),
  ],

  update: [
    body("name")
      .optional()
      .notEmpty()
      .withMessage("Nama customer tidak boleh kosong"),
    body("email").optional().isEmail().withMessage("Format email tidak valid"),
  ],
};

const salesValidation = {
  create: [
    body("customerId").notEmpty().withMessage("Customer ID harus diisi"),
    body("date").isISO8601().withMessage("Format tanggal tidak valid"),
    body("items").isArray({ min: 1 }).withMessage("Minimal 1 item diperlukan"),
    body("items.*.productName")
      .notEmpty()
      .withMessage("Nama produk harus diisi"),
    body("items.*.quantity")
      .isInt({ min: 1 })
      .withMessage("Quantity minimal 1"),
    body("items.*.price").isFloat({ min: 0 }).withMessage("Harga harus valid"),
  ],

  updateStatus: [
    body("status")
      .isIn(Object.values(SALE_STATUS))
      .withMessage("Status tidak valid"),
  ],
};

const recommendValidation = {
  monthlyRecommendation: [
    body("year")
      .notEmpty()
      .withMessage("Tahun harus diisi")
      .isInt({ min: 2000, max: new Date().getFullYear() + 1 })
      .withMessage(
        `Tahun harus antara 2000 dan ${new Date().getFullYear() + 1}`
      ),
    body("month")
      .notEmpty()
      .withMessage("Bulan harus diisi")
      .isInt({ min: 1, max: 12 })
      .withMessage("Bulan harus antara 1 dan 12"),
  ],

  getById: [
    param("id")
      .notEmpty()
      .withMessage("ID rekomendasi harus diisi")
      .isUUID()
      .withMessage("Format ID tidak valid"),
  ],

  getByDateRange: [
    query("startDate")
      .optional()
      .isISO8601()
      .withMessage("Format start date tidak valid (YYYY-MM-DD)"),
    query("endDate")
      .optional()
      .isISO8601()
      .withMessage("Format end date tidak valid (YYYY-MM-DD)"),
    query("year")
      .optional()
      .isInt({ min: 2000, max: new Date().getFullYear() + 1 })
      .withMessage(
        `Tahun harus antara 2000 dan ${new Date().getFullYear() + 1}`
      ),
    query("month")
      .optional()
      .isInt({ min: 1, max: 12 })
      .withMessage("Bulan harus antara 1 dan 12"),
  ],

  getByType: [
    query("type")
      .optional()
      .isIn(["General", "CostSaving", "RevenueOptimization", "CashFlow"])
      .withMessage("Tipe rekomendasi tidak valid"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit harus antara 1 dan 100"),
    query("offset")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Offset harus >= 0"),
  ],

  customRecommendation: [
    body("prompt")
      .notEmpty()
      .withMessage("Prompt harus diisi")
      .isLength({ min: 10, max: 2000 })
      .withMessage("Prompt harus antara 10 dan 2000 karakter"),
    body("year")
      .optional()
      .isInt({ min: 2000, max: new Date().getFullYear() + 1 })
      .withMessage(
        `Tahun harus antara 2000 dan ${new Date().getFullYear() + 1}`
      ),
    body("month")
      .optional()
      .isInt({ min: 1, max: 12 })
      .withMessage("Bulan harus antara 1 dan 12"),
    body("includeFinancialData")
      .optional()
      .isBoolean()
      .withMessage("includeFinancialData harus boolean"),
  ],

  updateRecommendation: [
    param("id")
      .notEmpty()
      .withMessage("ID rekomendasi harus diisi")
      .isUUID()
      .withMessage("Format ID tidak valid"),
    body("recommendationText")
      .optional()
      .notEmpty()
      .withMessage("Teks rekomendasi tidak boleh kosong")
      .isLength({ min: 10, max: 5000 })
      .withMessage("Teks rekomendasi harus antara 10 dan 5000 karakter"),
    body("recommendationType")
      .optional()
      .isIn(["General", "CostSaving", "RevenueOptimization", "CashFlow"])
      .withMessage("Tipe rekomendasi tidak valid"),
    body("isActive")
      .optional()
      .isBoolean()
      .withMessage("isActive harus boolean"),
  ],

  deleteRecommendation: [
    param("id")
      .notEmpty()
      .withMessage("ID rekomendasi harus diisi")
      .isUUID()
      .withMessage("Format ID tidak valid"),
  ],

  bulkDelete: [
    body("ids").isArray({ min: 1 }).withMessage("Minimal 1 ID diperlukan"),
    body("ids.*").isUUID().withMessage("Format ID tidak valid"),
  ],

  exportRecommendations: [
    query("format")
      .optional()
      .isIn(["json", "csv", "pdf"])
      .withMessage("Format export harus json, csv, atau pdf"),
    query("startDate")
      .optional()
      .isISO8601()
      .withMessage("Format start date tidak valid"),
    query("endDate")
      .optional()
      .isISO8601()
      .withMessage("Format end date tidak valid"),
    query("type")
      .optional()
      .isIn(["General", "CostSaving", "RevenueOptimization", "CashFlow"])
      .withMessage("Tipe rekomendasi tidak valid"),
  ],

  regenerateRecommendation: [
    param("id")
      .notEmpty()
      .withMessage("ID rekomendasi harus diisi")
      .isUUID()
      .withMessage("Format ID tidak valid"),
    body("forceRegenerate")
      .optional()
      .isBoolean()
      .withMessage("forceRegenerate harus boolean"),
  ],
};

const validateDateRange = (req, res, next) => {
  const { startDate, endDate } = req.query;

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return res.status(400).json({
        success: false,
        errors: [
          {
            field: "dateRange",
            message: "Start date harus lebih kecil dari end date",
          },
        ],
      });
    }
  }

  next();
};

const validateYearMonth = (req, res, next) => {
  const { year, month } = req.body || req.query;

  if (year && month) {
    const currentDate = new Date();
    const inputDate = new Date(year, month - 1, 1);

    if (
      inputDate >
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    ) {
      return res.status(400).json({
        success: false,
        errors: [
          {
            field: "yearMonth",
            message:
              "Tidak dapat membuat rekomendasi untuk bulan yang terlalu jauh di masa depan",
          },
        ],
      });
    }
  }

  next();
};

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map((error) => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value,
      })),
    });
  }
  next();
};

const validateMonthlyParams = (year, month) => {
  if (!year || !month) {
    return {
      isValid: false,
      error: "Tahun dan bulan diperlukan.",
    };
  }

  if (month < 1 || month > 12) {
    return {
      isValid: false,
      error: "Bulan harus antara 1 dan 12.",
    };
  }

  return {
    isValid: true,
    error: null,
  };
};

const getMonthDateRange = (year, month) => {
  // Konversi ke number untuk memastikan keamanan
  const y = parseInt(year);
  const m = parseInt(month);

  // Validasi dasar
  if (isNaN(y) || isNaN(m)) {
    throw new Error(`Invalid Year/Month: year=${year}, month=${month}`);
  }

  const startDate = new Date(y, m - 1, 1, 0, 0, 0); // Jam 00:00:00
  const endDate = new Date(y, m, 0, 23, 59, 59); // Jam 23:59:59

  return { startDate, endDate };
};

module.exports = {
  validate,
  validateParams,
  validateQuery,
  accountValidation,
  journalValidation,
  customerValidation,
  salesValidation,
  recommendValidation,
  handleValidationErrors,
  validateDateRange,
  validateYearMonth,
  validateMonthlyParams,
  getMonthDateRange,
};
