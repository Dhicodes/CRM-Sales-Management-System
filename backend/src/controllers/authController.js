const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const { setAuthCookie, clearAuthCookie } = require('../utils/token');
const authService = require('../services/authService');

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { token, user } = await authService.login(email, password);
  setAuthCookie(res, token);
  sendSuccess(res, 200, user, 'Logged in successfully');
});

const logout = asyncHandler(async (req, res) => {
  clearAuthCookie(res);
  sendSuccess(res, 200, null, 'Logged out successfully');
});

const me = asyncHandler(async (req, res) => {
  sendSuccess(res, 200, req.user, 'Current user retrieved');
});

module.exports = { login, logout, me };
