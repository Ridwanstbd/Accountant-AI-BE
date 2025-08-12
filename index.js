const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const dotenv = require("dotenv");
const routes = require("./routes/index");
const swagger = require("./config/swagger");
const errorHandler = require("./middlewares/errorHandler");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api-docs", swagger.serve, swagger.setup);
app.get("/swagger.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swagger.swaggerDocument);
});

app.use("/api", routes);

app.get("/", (req, res) => {
  res.redirect("/api-docs");
});

app.use(errorHandler);

app.use("/{*any}", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
    availableEndpoints: {
      documentation: "/api-docs",
      health: "/api/health",
      swagger_json: "/swagger.json",
    },
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
