const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");

// Import internal
const routes = require("./routes/index");
const swagger = require("./config/swagger");
const errorHandler = require("./middlewares/errorHandler");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Trust Proxy (WAJIB di cPanel agar rate-limit tidak crash)
app.set("trust proxy", 1);

// 2. Security Middlewares
app.use(helmet({ contentSecurityPolicy: false })); // Agar Swagger tidak blank
app.use(cors());

// 3. Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  validate: { xForwardedForHeader: false },
});
app.use("/api", limiter);

// 4. Body Parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// 5. Documentation
app.use("/api-docs", swagger.serve, swagger.setup);

// 6. Main Routes
app.use("/api", routes);

app.get("/", (req, res) => {
  res.redirect("/api-docs");
});

// 7. 404 Handler (DIREVISI: Tanpa simbol '*' agar tidak error)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
    availableEndpoints: {
      documentation: "/api-docs",
      health: "/api/health",
    },
  });
});

// 8. Error Handler (Harus paling bawah)
app.use(errorHandler);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
