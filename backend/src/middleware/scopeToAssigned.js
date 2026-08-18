const User = require('../models/User');

// Attaches req.scopeIds, the set of user ids a requester is allowed to act on
// for role-scoped resources (Leads now; Customers/Deals in later phases):
//   - admin: req.scopeIds = null (unrestricted)
//   - sales_manager: [self, ...their sales_executive team]
//   - sales_executive: [self]
// Each resource's service decides how to turn this into a query filter (e.g.
// Leads also expose an unassigned pool on top of this base scope).
async function scopeToAssigned(req, res, next) {
  const { user } = req;

  if (user.role === 'admin') {
    req.scopeIds = null;
    return next();
  }

  if (user.role === 'sales_manager') {
    const team = await User.find({ managerId: user._id }).select('_id');
    req.scopeIds = [user._id, ...team.map((member) => member._id)];
    return next();
  }

  req.scopeIds = [user._id];
  next();
}

module.exports = scopeToAssigned;
