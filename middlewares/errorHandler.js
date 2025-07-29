const errorHandler = (error, req, res, next) => {
  console.log("Error:", error);

  if (error.code === "P2025") {
    return res.status(404).json({
      success: false,
      message: "Record not found",
    });
  }
  if (error.code === "P2002") {
    return res.status(409).json({
      success: false,
      message: "Data already exists",
    });
  }
  if (error.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === "development"
        ? error.message
        : "Internal server error",
  });
};
module.exports = errorHandler;
