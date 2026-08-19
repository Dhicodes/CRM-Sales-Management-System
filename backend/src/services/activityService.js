const { ApiError } = require('../utils/apiResponse');
const { buildPagination, buildSort, buildDateRangeFilter } = require('../utils/queryBuilder');
const { resolveAssignee } = require('./assignmentService');
const timelineService = require('./timelineService');
const leadService = require('./leadService');
const customerService = require('./customerService');
const dealService = require('./dealService');
const Activity = require('../models/Activity');

const SORTABLE_FIELDS = ['createdAt', 'updatedAt', 'dueDate'];
const POPULATE_ASSIGNEE = { path: 'assignedTo', select: 'name email role' };
const POPULATE_CREATOR = { path: 'createdBy', select: 'name email' };

const TYPE_LABELS = { call: 'Call', email: 'Email', meeting: 'Meeting', demo: 'Demo', reminder: 'Reminder' };

const RELATED_ENTITY_GETTERS = {
  Lead: leadService.getLeadById,
  Customer: customerService.getCustomerById,
  Deal: dealService.getDealById,
};

// Like Customer/Deal, an Activity always has an owner there is no
// unassigned pool.
function isInScope(scopeIds, activity) {
  if (scopeIds === null) return true;
  return scopeIds.some((id) => String(id) === String(activity.assignedTo._id || activity.assignedTo));
}

// Ensures the requester can already see the entity a follow-up is attached
// to reuses each resource's own ownership rules rather than duplicating them.
async function assertRelatedEntityVisible(relatedToType, relatedToId, scopeIds) {
  const getter = RELATED_ENTITY_GETTERS[relatedToType];
  if (!getter) throw new ApiError(400, 'Invalid relatedToType');
  await getter(relatedToId, scopeIds);
}

function withDerivedOverdue(activity) {
  const obj = activity.toObject ? activity.toObject() : activity;
  obj.isOverdue = obj.status === 'pending' && new Date(obj.dueDate) < new Date();
  return obj;
}

async function listActivities(query, scopeIds) {
  const and = [];
  if (scopeIds !== null) and.push({ assignedTo: { $in: scopeIds } });

  if (query.type) and.push({ type: query.type });
  if (query.relatedToType) and.push({ relatedToType: query.relatedToType });
  if (query.relatedToId) and.push({ relatedToId: query.relatedToId });

  if (query.status === 'overdue') {
    and.push({ status: 'pending', dueDate: { $lt: new Date() } });
  } else if (query.status === 'pending' || query.status === 'completed') {
    and.push({ status: query.status });
  }

  const dateFilter = buildDateRangeFilter('dueDate', query.dateFrom, query.dateTo);
  if (dateFilter) and.push(dateFilter);

  const filter = and.length ? { $and: and } : {};
  const { page, limit, skip } = buildPagination(query);
  const sort = buildSort(query, SORTABLE_FIELDS, 'dueDate');

  const [items, total] = await Promise.all([
    Activity.find(filter).sort(sort).skip(skip).limit(limit).populate(POPULATE_ASSIGNEE).populate(POPULATE_CREATOR),
    Activity.countDocuments(filter),
  ]);

  return {
    items: items.map(withDerivedOverdue),
    total,
    page,
    limit,
    totalPages: Math.max(Math.ceil(total / limit), 1),
  };
}

async function createActivity(data, requestingUser, scopeIds) {
  await assertRelatedEntityVisible(data.relatedToType, data.relatedToId, scopeIds);
  const assignedTo = await resolveAssignee(data.assignedTo ?? requestingUser._id, requestingUser, scopeIds);

  const activity = await Activity.create({
    type: data.type,
    relatedToType: data.relatedToType,
    relatedToId: data.relatedToId,
    dueDate: data.dueDate,
    notes: data.notes,
    assignedTo,
    createdBy: requestingUser._id,
  });
  await activity.populate([POPULATE_ASSIGNEE, POPULATE_CREATOR]);

  await timelineService.log({
    entityType: data.relatedToType,
    entityId: data.relatedToId,
    eventType: 'followup_created',
    description: `${TYPE_LABELS[data.type]} follow-up scheduled for ${new Date(data.dueDate).toLocaleDateString()}`,
    performedBy: requestingUser._id,
    metadata: { activityId: activity._id, type: data.type },
  });

  return withDerivedOverdue(activity);
}

async function updateActivity(id, updates, requestingUser, scopeIds) {
  const activity = await Activity.findById(id);
  if (!activity) throw new ApiError(404, 'Activity not found');
  if (!isInScope(scopeIds, activity)) {
    throw new ApiError(403, 'You do not have permission to modify this activity');
  }

  const wasCompleting = updates.status === 'completed' && activity.status !== 'completed';

  const editableFields = ['type', 'dueDate', 'notes'];
  for (const field of editableFields) {
    if (updates[field] !== undefined) activity[field] = updates[field];
  }
  if (updates.status !== undefined) {
    activity.status = updates.status;
    activity.completedAt = updates.status === 'completed' ? new Date() : null;
  }

  await activity.save();
  await activity.populate([POPULATE_ASSIGNEE, POPULATE_CREATOR]);

  if (wasCompleting) {
    await timelineService.log({
      entityType: activity.relatedToType,
      entityId: activity.relatedToId,
      eventType: 'followup_completed',
      description: `${TYPE_LABELS[activity.type]} follow-up completed`,
      performedBy: requestingUser._id,
      metadata: { activityId: activity._id },
    });
  }

  return withDerivedOverdue(activity);
}

async function deleteActivity(id, scopeIds) {
  const activity = await Activity.findById(id);
  if (!activity) throw new ApiError(404, 'Activity not found');
  if (!isInScope(scopeIds, activity)) {
    throw new ApiError(403, 'You do not have permission to delete this activity');
  }
  await Activity.findByIdAndDelete(id);
}

module.exports = { listActivities, createActivity, updateActivity, deleteActivity };
