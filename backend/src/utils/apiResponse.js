class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

function sendSuccess(res, statusCode, data, message = 'Success') {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

module.exports = { ApiError, sendSuccess };
