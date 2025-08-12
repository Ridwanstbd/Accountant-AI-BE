const ResponseHelpers = require("../utils/responseHelpers");

const errorHandler = (error, req, res, next) => {
  console.log("Error:", error);
  if (err.code === "P2002") {
    return ResponseHelpers.error(
      res,
      "A record with this data already exists",
      409
    );
  }

  if (err.code === "P2025") {
    return ResponseHelpers.notFound(res, "Record not found");
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return ResponseHelpers.unauthorized(res, "Invalid token");
  }

  if (err.name === "TokenExpiredError") {
    return ResponseHelpers.unauthorized(res, "Token expired");
  }

  // Validation errors
  if (err.name === "ValidationError") {
    return ResponseHelpers.validationError(res, err.details);
  }

  // Custom application errors
  if (err.statusCode) {
    return ResponseHelpers.error(res, err.message, err.statusCode);
  }

  // Default server error
  const message =
    process.env.NODE_ENV === "development"
      ? err.message
      : "Internal Server Error";

  return ResponseHelpers.error(res, message, 500);
};
module.exports = errorHandler;
