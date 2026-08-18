const asyncHandler = require('../utils/asyncHandler');
const { ApiError } = require('../utils/apiResponse');
const { verifyToken, COOKIE_NAME } = require('../utils/token');
const User = require('../models/User');

const authenticate = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    throw new ApiError(401, 'You must be logged in to access this resource');
  }

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (err) {
    throw new ApiError(401, 'Your session is invalid or has expired');
  }

  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) {
    throw new ApiError(401, 'Your session is invalid or has expired');
  }

  req.user = user;
  next();
});

module.exports = authenticate;
