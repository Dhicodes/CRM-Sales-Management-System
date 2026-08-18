const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const userService = require('../services/userService');

const createUser = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.body);
  sendSuccess(res, 201, user, 'User created successfully');
});

const listUsers = asyncHandler(async (req, res) => {
  const users = await userService.listUsers();
  sendSuccess(res, 200, users, 'Users retrieved successfully');
});

const getUser = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  sendSuccess(res, 200, user, 'User retrieved successfully');
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body, req.user._id);
  sendSuccess(res, 200, user, 'User updated successfully');
});

const deactivateUser = asyncHandler(async (req, res) => {
  const user = await userService.deactivateUser(req.params.id, req.user._id);
  sendSuccess(res, 200, user, 'User deactivated successfully');
});

module.exports = { createUser, listUsers, getUser, updateUser, deactivateUser };
