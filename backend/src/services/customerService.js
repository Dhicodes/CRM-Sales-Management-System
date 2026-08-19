const { ApiError } = require('../utils/apiResponse');
const { buildPagination, buildSort, buildDateRangeFilter, escapeRegex } = require('../utils/queryBuilder');
const { resolveAssignee } = require('./assignmentService');
const timelineService = require('./timelineService');
const notificationService = require('./notificationService');
const Customer = require('../models/Customer');

const SORTABLE_FIELDS = ['createdAt', 'updatedAt', 'name'];
const POPULATE_ASSIGNEE = { path: 'assignedTo', select: 'name email role' };
const POPULATE_CREATOR = { path: 'createdBy', select: 'name email' };
const POPULATE_ORIGIN_LEAD = { path: 'originLead', select: 'name status' };

// Unlike Lead, Customer has no unassigned pool every record always has an
// owner, so scope checks are a plain membership test.
function isInScope(scopeIds, customer) {
  if (scopeIds === null) return true;
  return scopeIds.some((id) => String(id) === String(customer.assignedTo._id || customer.assignedTo));
}

async function listCustomers(query, scopeIds) {
  const and = [];
  if (scopeIds !== null) and.push({ assignedTo: { $in: scopeIds } });

  if (query.assignedTo) and.push({ assignedTo: query.assignedTo });

  const dateFilter = buildDateRangeFilter('createdAt', query.dateFrom, query.dateTo);
  if (dateFilter) and.push(dateFilter);

  if (query.search) {
    const regex = new RegExp(escapeRegex(query.search), 'i');
    and.push({ $or: [{ name: regex }, { email: regex }, { company: regex }] });
  }

  const filter = and.length ? { $and: and } : {};
  const { page, limit, skip } = buildPagination(query);
  const sort = buildSort(query, SORTABLE_FIELDS, '-createdAt');

  const [items, total] = await Promise.all([
    Customer.find(filter).sort(sort).skip(skip).limit(limit).populate(POPULATE_ASSIGNEE).populate(POPULATE_CREATOR),
    Customer.countDocuments(filter),
  ]);

  return { items, total, page, limit, totalPages: Math.max(Math.ceil(total / limit), 1) };
}

async function createCustomer(data, requestingUser, scopeIds) {
  const assignedTo = await resolveAssignee(data.assignedTo ?? requestingUser._id, requestingUser, scopeIds);

  const customer = await Customer.create({
    name: data.name,
    email: data.email,
    phone: data.phone,
    company: data.company,
    address: data.address,
    assignedTo,
    createdBy: requestingUser._id,
  });

  await timelineService.log({
    entityType: 'Customer',
    entityId: customer._id,
    eventType: 'created',
    description: 'Customer created',
    performedBy: requestingUser._id,
  });

  await customer.populate([POPULATE_ASSIGNEE, POPULATE_CREATOR]);

  if (String(assignedTo) !== String(requestingUser._id)) {
    await notificationService.notify(
      assignedTo,
      'customer_assigned',
      `You were assigned customer "${customer.name}"`,
      'Customer',
      customer._id
    );
  }

  return customer;
}

async function getCustomerById(id, scopeIds) {
  const customer = await Customer.findById(id)
    .populate(POPULATE_ASSIGNEE)
    .populate(POPULATE_CREATOR)
    .populate(POPULATE_ORIGIN_LEAD);
  if (!customer) throw new ApiError(404, 'Customer not found');
  if (!isInScope(scopeIds, customer)) {
    throw new ApiError(403, 'You do not have permission to view this customer');
  }
  return customer;
}

async function updateCustomer(id, updates, requestingUser, scopeIds) {
  const customer = await Customer.findById(id);
  if (!customer) throw new ApiError(404, 'Customer not found');
  if (!isInScope(scopeIds, customer)) {
    throw new ApiError(403, 'You do not have permission to modify this customer');
  }

  const editableFields = ['name', 'email', 'phone', 'company', 'address'];
  for (const field of editableFields) {
    if (updates[field] !== undefined) customer[field] = updates[field];
  }

  await customer.save();
  await customer.populate([POPULATE_ASSIGNEE, POPULATE_CREATOR]);

  if (editableFields.some((f) => updates[f] !== undefined)) {
    await timelineService.log({
      entityType: 'Customer',
      entityId: customer._id,
      eventType: 'details_updated',
      description: 'Customer details updated',
      performedBy: requestingUser._id,
    });
  }

  return customer;
}

// Reassignment is Admin/Manager-only there's no self-claim pool for
// customers the way there is for unassigned Leads.
async function assignCustomer(id, targetUserId, requestingUser, scopeIds) {
  if (requestingUser.role === 'sales_executive') {
    throw new ApiError(403, 'You do not have permission to reassign customers');
  }

  const customer = await Customer.findById(id);
  if (!customer) throw new ApiError(404, 'Customer not found');
  if (!isInScope(scopeIds, customer)) {
    throw new ApiError(403, 'You do not have permission to modify this customer');
  }

  customer.assignedTo = await resolveAssignee(targetUserId, requestingUser, scopeIds);
  await customer.save();
  await customer.populate([POPULATE_ASSIGNEE, POPULATE_CREATOR]);

  await timelineService.log({
    entityType: 'Customer',
    entityId: customer._id,
    eventType: 'reassigned',
    description: 'Customer reassigned',
    performedBy: requestingUser._id,
    metadata: { to: customer.assignedTo._id },
  });

  if (String(customer.assignedTo._id) !== String(requestingUser._id)) {
    await notificationService.notify(
      customer.assignedTo._id,
      'customer_assigned',
      `You were assigned customer "${customer.name}"`,
      'Customer',
      customer._id
    );
  }

  return customer;
}

async function listCustomerDeals(id, scopeIds) {
  const customer = await Customer.findById(id);
  if (!customer) throw new ApiError(404, 'Customer not found');
  if (!isInScope(scopeIds, customer)) {
    throw new ApiError(403, 'You do not have permission to view this customer');
  }
  // Required lazily (not at module top-level) customerService and
  // dealService require each other, and capturing this at load time can
  // grab a stale/incomplete reference depending on which module loads
  // first (see dealService.js for the same pattern on its side).
  const dealService = require('./dealService');
  return dealService.listByCustomer(id);
}

module.exports = {
  listCustomers,
  createCustomer,
  getCustomerById,
  updateCustomer,
  assignCustomer,
  listCustomerDeals,
  isInScope,
};
