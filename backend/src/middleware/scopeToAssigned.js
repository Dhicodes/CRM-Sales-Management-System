const User = require('../models/User');

// Reusable ownership-scoping middleware for role-scoped resources (Leads,
// Customers, Deals in later phases). Populates req.scopeFilter with a Mongo
// filter that controllers merge into their queries:
//   - admin: no restriction (req.scopeFilter = {})
//   - sales_manager: restricted to their own records + their team's records
//   - sales_executive: restricted to their own records only
// Not wired into any route yet — Users (Phase 2) are admin-managed and don't
// need ownership scoping; this becomes active once Leads/Customers/Deals exist.
async function scopeToAssigned(req, res, next) {
  const { user } = req;

  if (user.role === 'admin') {
    req.scopeFilter = {};
    return next();
  }

  if (user.role === 'sales_manager') {
    const team = await User.find({ managerId: user._id }).select('_id');
    const ids = [user._id, ...team.map((member) => member._id)];
    req.scopeFilter = { assignedTo: { $in: ids } };
    return next();
  }

  req.scopeFilter = { assignedTo: user._id };
  next();
}

module.exports = scopeToAssigned;
