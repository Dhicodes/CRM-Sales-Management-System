const { ApiError } = require('../utils/apiResponse');

function notFound(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

// Normalizes Mongoose errors into the same { statusCode, message, errors }
// shape as ApiError so the response contract stays consistent regardless of
// where the error originated.
function normalizeError(err) {
  if (err instanceof ApiError) return err;

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return new ApiError(409, `${field} is already in use`);
  }

  if (err.name === 'CastError') {
    return new ApiError(400, `Invalid value for ${err.path}`);
  }

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return new ApiError(400, 'Validation failed', errors);
  }

  return err;
}

function errorHandler(err, req, res, next) {
  const normalized = normalizeError(err);
  const statusCode = normalized.statusCode || 500;
  const message = statusCode === 500 ? 'Internal Server Error' : normalized.message;
  const errors = normalized.errors || [];

  if (statusCode === 500) {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
}

module.exports = { notFound, errorHandler };
