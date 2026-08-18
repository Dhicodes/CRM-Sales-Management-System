const { validationResult } = require('express-validator');
const { ApiError } = require('../utils/apiResponse');

function validate(req, res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const errors = result.array().map((e) => ({ field: e.path, message: e.msg }));
    return next(new ApiError(400, 'Validation failed', errors));
  }
  next();
}

module.exports = validate;
