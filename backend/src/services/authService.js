const { ApiError } = require('../utils/apiResponse');
const User = require('../models/User');
const { signToken } = require('../utils/token');

async function login(email, password) {
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }
  if (!user.isActive) {
    throw new ApiError(401, 'This account has been deactivated');
  }

  const token = signToken(user);
  return { token, user };
}

module.exports = { login };
