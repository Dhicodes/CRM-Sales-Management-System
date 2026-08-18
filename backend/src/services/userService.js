const { ApiError } = require('../utils/apiResponse');
const User = require('../models/User');

// Enforces the manager/executive hierarchy: an executive must report to an
// existing sales_manager; managers/admins never carry a managerId.
async function resolveManagerId(role, managerId) {
  if (role !== 'sales_executive') return null;

  const manager = await User.findById(managerId);
  if (!manager || manager.role !== 'sales_manager') {
    throw new ApiError(400, 'managerId must reference an existing sales_manager');
  }
  return manager._id;
}

async function createUser({ name, email, password, role, managerId }) {
  const resolvedManagerId = await resolveManagerId(role, managerId);
  return User.create({ name, email, password, role, managerId: resolvedManagerId });
}

async function listUsers() {
  return User.find().sort({ createdAt: -1 });
}

async function getUserById(id) {
  const user = await User.findById(id);
  if (!user) throw new ApiError(404, 'User not found');
  return user;
}

async function updateUser(id, updates, requestingUserId) {
  const user = await getUserById(id);

  const nextRole = updates.role || user.role;
  if ('managerId' in updates || updates.role) {
    user.managerId = await resolveManagerId(nextRole, updates.managerId ?? user.managerId);
  }

  if (updates.name !== undefined) user.name = updates.name;
  if (updates.email !== undefined) user.email = updates.email;
  if (updates.role !== undefined) user.role = updates.role;
  if (updates.isActive !== undefined) {
    if (String(user._id) === String(requestingUserId) && updates.isActive === false) {
      throw new ApiError(400, 'You cannot deactivate your own account');
    }
    user.isActive = updates.isActive;
  }

  await user.save();
  return user;
}

async function deactivateUser(id, requestingUserId) {
  if (String(id) === String(requestingUserId)) {
    throw new ApiError(400, 'You cannot deactivate your own account');
  }
  const user = await getUserById(id);
  user.isActive = false;
  await user.save();
  return user;
}

module.exports = { createUser, listUsers, getUserById, updateUser, deactivateUser };
