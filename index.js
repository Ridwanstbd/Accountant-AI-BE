const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const dotenv = require("dotenv");
const routes = require("./routes/index");
const swagger = require("./config/swagger");
const errorHandler = require("./middlewares/errorHandler");

dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();
app.set("trust proxy", 1);

app.use(helmet());
app.use(cors());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  validate: { xForwardedForHeader: false },
});

app.use("/api", limiter);

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

app.all("*", (req, res) => {
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

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
