class ResponseHelpers {
  static success(res, data, message = "Success", statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  static error(
    res,
    message = "Internal Server Error",
    statusCode = 500,
    errors = null
  ) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString(),
    });
  }

  static validationError(res, errors) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.map((err) => ({
        field: err.path?.[0] || err.context?.key,
        message: err.message,
      })),
      timestamp: new Date().toISOString(),
    });
  }

  static unauthorized(res, message = "Unauthorized") {
    return res.status(401).json({
      success: false,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  static forbidden(res, message = "Forbidden") {
    return res.status(403).json({
      success: false,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  static notFound(res, message = "Resource not found") {
    return res.status(404).json({
      success: false,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  static paginated(res, data, pagination, message = "Success") {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination: {
        currentPage: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages: pagination.totalPages,
        hasNext: pagination.page < pagination.totalPages,
        hasPrev: pagination.page > 1,
      },
      timestamp: new Date().toISOString(),
    });
  }
}

module.exports = ResponseHelpers;
