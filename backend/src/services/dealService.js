const { ApiError } = require('../utils/apiResponse');
const { buildPagination, buildSort, buildDateRangeFilter, escapeRegex } = require('../utils/queryBuilder');
const { resolveAssignee } = require('./assignmentService');
const timelineService = require('./timelineService');
const notificationService = require('./notificationService');
const Deal = require('../models/Deal');
const { STAGE_DEFAULT_PROBABILITY, STAGES } = Deal;

const CLOSED_STAGES = ['Won', 'Lost'];
const SORTABLE_FIELDS = ['createdAt', 'updatedAt', 'title', 'value', 'expectedCloseDate', 'probability'];
const POPULATE_ASSIGNEE = { path: 'assignedTo', select: 'name email role' };
const POPULATE_CREATOR = { path: 'createdBy', select: 'name email' };
const POPULATE_CUSTOMER = { path: 'customer', select: 'name company' };

// Like Customer, every Deal always has an owner there is no unassigned pool.
function isInScope(scopeIds, deal) {
  if (scopeIds === null) return true;
  return scopeIds.some((id) => String(id) === String(deal.assignedTo._id || deal.assignedTo));
}

async function createInitialDeal({ title, value, expectedCloseDate, customerId, originLeadId, assignedTo, createdBy }) {
  const stage = 'Qualification';
  const deal = await Deal.create({
    title,
    value,
    expectedCloseDate,
    customer: customerId,
    originLead: originLeadId,
    stage,
    probability: STAGE_DEFAULT_PROBABILITY[stage],
    assignedTo,
    createdBy,
  });
  return deal;
}

async function listByCustomer(customerId) {
  return Deal.find({ customer: customerId }).sort({ createdAt: -1 }).populate(POPULATE_ASSIGNEE);
}

async function listDeals(query, scopeIds) {
  const and = [];
  if (scopeIds !== null) and.push({ assignedTo: { $in: scopeIds } });

  if (query.stage) and.push({ stage: query.stage });
  if (query.customer) and.push({ customer: query.customer });
  if (query.assignedTo) and.push({ assignedTo: query.assignedTo });

  const dateFilter = buildDateRangeFilter('expectedCloseDate', query.dateFrom, query.dateTo);
  if (dateFilter) and.push(dateFilter);

  if (query.minValue || query.maxValue) {
    const range = {};
    if (query.minValue) range.$gte = Number(query.minValue);
    if (query.maxValue) range.$lte = Number(query.maxValue);
    and.push({ value: range });
  }

  if (query.search) {
    const regex = new RegExp(escapeRegex(query.search), 'i');
    and.push({ title: regex });
  }

  const filter = and.length ? { $and: and } : {};
  const { page, limit, skip } = buildPagination(query);
  const sort = buildSort(query, SORTABLE_FIELDS, '-createdAt');

  const [items, total] = await Promise.all([
    Deal.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate(POPULATE_ASSIGNEE)
      .populate(POPULATE_CREATOR)
      .populate(POPULATE_CUSTOMER),
    Deal.countDocuments(filter),
  ]);

  return { items, total, page, limit, totalPages: Math.max(Math.ceil(total / limit), 1) };
}

async function createDeal(data, requestingUser, scopeIds) {
  // Required lazily customerService and dealService require each other,
  // and capturing this at module top-level can grab a stale/incomplete
  // reference depending on which module loads first.
  const customerService = require('./customerService');
  // Ensures the requester can already see the target customer reuses the
  // same ownership rules rather than duplicating them here.
  await customerService.getCustomerById(data.customerId, scopeIds);

  const assignedTo = await resolveAssignee(data.assignedTo ?? requestingUser._id, requestingUser, scopeIds);
  const stage = 'Qualification';

  const deal = await Deal.create({
    title: data.title,
    value: data.value,
    currency: data.currency,
    expectedCloseDate: data.expectedCloseDate,
    customer: data.customerId,
    stage,
    probability: data.probability ?? STAGE_DEFAULT_PROBABILITY[stage],
    assignedTo,
    createdBy: requestingUser._id,
  });

  await timelineService.log({
    entityType: 'Deal',
    entityId: deal._id,
    eventType: 'created',
    description: 'Deal created',
    performedBy: requestingUser._id,
  });

  await deal.populate([POPULATE_ASSIGNEE, POPULATE_CREATOR, POPULATE_CUSTOMER]);

  if (String(assignedTo) !== String(requestingUser._id)) {
    await notificationService.notify(assignedTo, 'deal_assigned', `You were assigned deal "${deal.title}"`, 'Deal', deal._id);
  }

  return deal;
}

async function getDealById(id, scopeIds) {
  const deal = await Deal.findById(id).populate(POPULATE_ASSIGNEE).populate(POPULATE_CREATOR).populate(POPULATE_CUSTOMER);
  if (!deal) throw new ApiError(404, 'Deal not found');
  if (!isInScope(scopeIds, deal)) {
    throw new ApiError(403, 'You do not have permission to view this deal');
  }
  return deal;
}

async function updateDeal(id, updates, requestingUser, scopeIds) {
  const deal = await Deal.findById(id);
  if (!deal) throw new ApiError(404, 'Deal not found');
  if (!isInScope(scopeIds, deal)) {
    throw new ApiError(403, 'You do not have permission to modify this deal');
  }
  if (CLOSED_STAGES.includes(deal.stage) && requestingUser.role !== 'admin') {
    throw new ApiError(400, 'This deal is closed only an admin can modify it');
  }

  const editableFields = ['title', 'value', 'currency', 'expectedCloseDate', 'probability'];
  for (const field of editableFields) {
    if (updates[field] !== undefined) deal[field] = updates[field];
  }

  await deal.save();
  await deal.populate([POPULATE_ASSIGNEE, POPULATE_CREATOR, POPULATE_CUSTOMER]);

  if (editableFields.some((f) => updates[f] !== undefined)) {
    await timelineService.log({
      entityType: 'Deal',
      entityId: deal._id,
      eventType: 'details_updated',
      description: 'Deal details updated',
      performedBy: requestingUser._id,
    });
  }

  return deal;
}

// The dedicated stage-transition endpoint owns all the pipeline business
// rules: Won/Lost are terminal for non-admins, Won forces probability=100,
// Lost requires a reason and forces probability=0, and expectedRevenue is
// always recomputed server-side (never trusted from the client).
async function changeStage(id, data, requestingUser, scopeIds) {
  const deal = await Deal.findById(id);
  if (!deal) throw new ApiError(404, 'Deal not found');
  if (!isInScope(scopeIds, deal)) {
    throw new ApiError(403, 'You do not have permission to modify this deal');
  }

  const { stage: nextStage, probability, lossReason } = data;
  const fromStage = deal.stage;

  const isReopening = CLOSED_STAGES.includes(deal.stage) && nextStage !== deal.stage;
  if (isReopening && requestingUser.role !== 'admin') {
    throw new ApiError(403, 'Only an admin can reopen a Won or Lost deal');
  }

  if (!deal.expectedCloseDate) {
    throw new ApiError(400, 'expectedCloseDate is required before changing stage');
  }
  if (nextStage === 'Lost' && !lossReason) {
    throw new ApiError(400, 'lossReason is required when marking a deal as Lost');
  }

  deal.stage = nextStage;
  if (nextStage === 'Won') {
    deal.probability = 100;
    deal.actualCloseDate = new Date();
    deal.lossReason = null;
  } else if (nextStage === 'Lost') {
    deal.probability = 0;
    deal.actualCloseDate = new Date();
    deal.lossReason = lossReason;
  } else {
    deal.actualCloseDate = null;
    deal.lossReason = null;
    deal.probability = probability !== undefined ? probability : STAGE_DEFAULT_PROBABILITY[nextStage];
  }

  await deal.save();
  await deal.populate([POPULATE_ASSIGNEE, POPULATE_CREATOR, POPULATE_CUSTOMER]);

  const isClosing = CLOSED_STAGES.includes(nextStage);
  await timelineService.log({
    entityType: 'Deal',
    entityId: deal._id,
    eventType: isClosing ? 'closed' : 'stage_changed',
    description: isClosing
      ? `Deal marked as ${nextStage}${nextStage === 'Lost' ? `: ${lossReason}` : ''}`
      : `Stage changed from ${fromStage} to ${nextStage}`,
    performedBy: requestingUser._id,
    metadata: { from: fromStage, to: nextStage },
  });

  if (isClosing && String(deal.assignedTo._id) !== String(requestingUser._id)) {
    await notificationService.notify(
      deal.assignedTo._id,
      'deal_closed',
      `Deal "${deal.title}" was marked as ${nextStage}`,
      'Deal',
      deal._id
    );
  }

  return deal;
}

// Reassignment is Admin/Manager-only, same as Customer no self-claim pool.
async function assignDeal(id, targetUserId, requestingUser, scopeIds) {
  if (requestingUser.role === 'sales_executive') {
    throw new ApiError(403, 'You do not have permission to reassign deals');
  }

  const deal = await Deal.findById(id);
  if (!deal) throw new ApiError(404, 'Deal not found');
  if (!isInScope(scopeIds, deal)) {
    throw new ApiError(403, 'You do not have permission to modify this deal');
  }

  deal.assignedTo = await resolveAssignee(targetUserId, requestingUser, scopeIds);
  await deal.save();
  await deal.populate([POPULATE_ASSIGNEE, POPULATE_CREATOR, POPULATE_CUSTOMER]);

  await timelineService.log({
    entityType: 'Deal',
    entityId: deal._id,
    eventType: 'reassigned',
    description: 'Deal reassigned',
    performedBy: requestingUser._id,
    metadata: { to: deal.assignedTo._id },
  });

  if (String(deal.assignedTo._id) !== String(requestingUser._id)) {
    await notificationService.notify(deal.assignedTo._id, 'deal_assigned', `You were assigned deal "${deal.title}"`, 'Deal', deal._id);
  }

  return deal;
}

module.exports = {
  createInitialDeal,
  listByCustomer,
  listDeals,
  createDeal,
  getDealById,
  updateDeal,
  changeStage,
  assignDeal,
  isInScope,
  STAGES,
};
