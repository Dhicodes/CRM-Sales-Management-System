const { ApiError } = require('../utils/apiResponse');
const User = require('../models/User');

// Validates a non-null assignee against the requester's role/scope. Shared
// by Customer/Deal creation and Lead creation none of these have Leads'
// "unassigned pool" concept, so a target user is always required.
async function resolveAssignee(targetUserId, requestingUser, scopeIds) {
  if (requestingUser.role === 'sales_executive') {
    if (String(targetUserId) !== String(requestingUser._id)) {
      throw new ApiError(403, 'You can only assign records to yourself');
    }
    return requestingUser._id;
  }

  const target = await User.findById(targetUserId);
  if (!target || !target.isActive) {
    throw new ApiError(400, 'assignedTo must reference an active user');
  }

  if (requestingUser.role === 'sales_manager') {
    const allowed = scopeIds.some((id) => String(id) === String(target._id));
    if (!allowed) throw new ApiError(403, 'You can only assign records to yourself or your team');
  }

  return target._id;
}

module.exports = { resolveAssignee };
