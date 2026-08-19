const Lead = require('../models/Lead');
const Deal = require('../models/Deal');
const Activity = require('../models/Activity');
const User = require('../models/User');

const OPEN_STAGES = Deal.STAGES.filter((s) => s !== 'Won' && s !== 'Lost');

function scopeFilter(scopeIds) {
  return scopeIds === null ? {} : { assignedTo: { $in: scopeIds } };
}

function normalizeGroup(groups, knownKeys) {
  const byKey = Object.fromEntries(groups.map((g) => [g._id, g]));
  return knownKeys.reduce((acc, key) => {
    acc[key] = { count: byKey[key]?.count || 0, value: byKey[key]?.value || 0 };
    return acc;
  }, {});
}

// req.scopeIds already encodes "own records" for an executive, "team
// records" for a manager, or "everything" for admin (null) reusing it here
// means the dashboard is automatically scoped the same way every other
// resource list is, with no separate role-branching logic needed.
async function getSummary(scopeIds) {
  const filter = scopeFilter(scopeIds);

  const [leadsByStatus, dealsByStage, totalLeads, convertedLeads, pendingFollowUps, overdueFollowUps] =
    await Promise.all([
      Lead.aggregate([{ $match: filter }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Deal.aggregate([{ $match: filter }, { $group: { _id: '$stage', count: { $sum: 1 }, value: { $sum: '$value' } } }]),
      Lead.countDocuments(filter),
      Lead.countDocuments({ ...filter, status: 'converted' }),
      Activity.countDocuments({ ...filter, status: 'pending', dueDate: { $gte: new Date() } }),
      Activity.countDocuments({ ...filter, status: 'pending', dueDate: { $lt: new Date() } }),
    ]);

  const dealsByStageNormalized = normalizeGroup(dealsByStage, Deal.STAGES);
  const pipelineValue = OPEN_STAGES.reduce((sum, stage) => sum + dealsByStageNormalized[stage].value, 0);
  const wonValue = dealsByStageNormalized.Won.value;
  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 1000) / 10 : 0;

  return {
    leadsByStatus: normalizeGroup(leadsByStatus, Lead.STATUSES),
    dealsByStage: dealsByStageNormalized,
    totalLeads,
    convertedLeads,
    conversionRate,
    pipelineValue,
    wonValue,
    pendingFollowUps,
    overdueFollowUps,
  };
}

// Manager/admin only. A manager sees their direct reports; an admin sees
// every rep company-wide (not scoped to req.scopeIds, since a flat
// comparison table across the whole company is the point of this view).
async function getTeamPerformance(requestingUser) {
  const reps =
    requestingUser.role === 'admin'
      ? await User.find({ isActive: true, role: { $in: ['sales_manager', 'sales_executive'] } }).sort({ name: 1 })
      : await User.find({ managerId: requestingUser._id, isActive: true }).sort({ name: 1 });

  return Promise.all(
    reps.map(async (rep) => {
      const [totalLeads, convertedLeads, dealsWon, revenueAgg] = await Promise.all([
        Lead.countDocuments({ assignedTo: rep._id }),
        Lead.countDocuments({ assignedTo: rep._id, status: 'converted' }),
        Deal.countDocuments({ assignedTo: rep._id, stage: 'Won' }),
        Deal.aggregate([
          { $match: { assignedTo: rep._id, stage: 'Won' } },
          { $group: { _id: null, total: { $sum: '$value' } } },
        ]),
      ]);

      return {
        user: { _id: rep._id, name: rep.name, role: rep.role },
        totalLeads,
        convertedLeads,
        conversionRate: totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 1000) / 10 : 0,
        dealsWon,
        revenueClosed: revenueAgg[0]?.total || 0,
      };
    })
  );
}

module.exports = { getSummary, getTeamPerformance };
