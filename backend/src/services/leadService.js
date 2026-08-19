const { ApiError } = require('../utils/apiResponse');
const { buildPagination, buildSort, buildDateRangeFilter, escapeRegex } = require('../utils/queryBuilder');
const { resolveAssignee } = require('./assignmentService');
const Lead = require('../models/Lead');
const User = require('../models/User');

const SORTABLE_FIELDS = ['createdAt', 'updatedAt', 'name', 'priority', 'status'];
const POPULATE_ASSIGNEE = { path: 'assignedTo', select: 'name email role' };
const POPULATE_CREATOR = { path: 'createdBy', select: 'name email' };
const POPULATE_NOTE_AUTHOR = { path: 'notes.author', select: 'name email' };

// Leads have a pool concept unassigned leads (assignedTo: null) are
// visible to everyone in scope so managers/executives can pick them up.
function buildReadFilter(scopeIds) {
  if (scopeIds === null) return {};
  return { $or: [{ assignedTo: { $in: scopeIds } }, { assignedTo: null }] };
}

function isViewable(scopeIds, lead) {
  if (scopeIds === null) return true;
  if (!lead.assignedTo) return true;
  return scopeIds.some((id) => String(id) === String(lead.assignedTo._id || lead.assignedTo));
}

// Editing (status/priority/details/notes) requires the lead to already be
// claimed within the requester's scope unassigned leads must be claimed
// via the assign endpoint first.
function isEditable(scopeIds, lead) {
  if (scopeIds === null) return true;
  if (!lead.assignedTo) return false;
  return scopeIds.some((id) => String(id) === String(lead.assignedTo._id || lead.assignedTo));
}

async function listLeads(query, scopeIds) {
  const and = [];
  const scopeFilter = buildReadFilter(scopeIds);
  if (Object.keys(scopeFilter).length) and.push(scopeFilter);

  if (query.status) and.push({ status: query.status });
  if (query.priority) and.push({ priority: query.priority });
  if (query.source) and.push({ source: query.source });

  if (query.assignedTo === 'unassigned') {
    and.push({ assignedTo: null });
  } else if (query.assignedTo) {
    and.push({ assignedTo: query.assignedTo });
  }

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
    Lead.find(filter).sort(sort).skip(skip).limit(limit).populate(POPULATE_ASSIGNEE).populate(POPULATE_CREATOR),
    Lead.countDocuments(filter),
  ]);

  return { items, total, page, limit, totalPages: Math.max(Math.ceil(total / limit), 1) };
}

async function createLead(data, requestingUser, scopeIds) {
  let assignedTo = null;

  if (data.assignedTo === undefined) {
    if (requestingUser.role === 'sales_executive') assignedTo = requestingUser._id;
  } else if (data.assignedTo !== null) {
    assignedTo = await resolveAssignee(data.assignedTo, requestingUser, scopeIds);
  }

  const lead = await Lead.create({
    name: data.name,
    email: data.email,
    phone: data.phone,
    company: data.company,
    source: data.source,
    priority: data.priority,
    assignedTo,
    createdBy: requestingUser._id,
  });

  await lead.populate([POPULATE_ASSIGNEE, POPULATE_CREATOR]);
  return lead;
}

async function getLeadById(id, scopeIds) {
  const lead = await Lead.findById(id)
    .populate(POPULATE_ASSIGNEE)
    .populate(POPULATE_CREATOR)
    .populate(POPULATE_NOTE_AUTHOR)
    .populate('convertedToCustomer', 'name')
    .populate('convertedToDeal', 'title stage');
  if (!lead) throw new ApiError(404, 'Lead not found');
  if (!isViewable(scopeIds, lead)) {
    throw new ApiError(403, 'You do not have permission to view this lead');
  }
  return lead;
}

async function updateLead(id, updates, scopeIds) {
  const lead = await Lead.findById(id);
  if (!lead) throw new ApiError(404, 'Lead not found');
  if (!isEditable(scopeIds, lead)) {
    throw new ApiError(403, 'You do not have permission to modify this lead');
  }
  if (lead.status === 'converted') {
    throw new ApiError(400, 'Converted leads cannot be modified');
  }
  if (updates.status === 'converted') {
    throw new ApiError(400, 'Use the lead conversion flow to mark a lead as converted');
  }

  const editableFields = ['name', 'email', 'phone', 'company', 'source', 'status', 'priority'];
  for (const field of editableFields) {
    if (updates[field] !== undefined) lead[field] = updates[field];
  }

  await lead.save();
  await lead.populate([POPULATE_ASSIGNEE, POPULATE_CREATOR]);
  return lead;
}

// The dedicated assign/reassign action enforces stricter transition rules
// than creation: executives may only self-claim an unassigned lead.
async function assignLead(id, targetUserId, requestingUser, scopeIds) {
  const lead = await Lead.findById(id);
  if (!lead) throw new ApiError(404, 'Lead not found');
  if (lead.status === 'converted') {
    throw new ApiError(400, 'Converted leads cannot be reassigned');
  }

  if (requestingUser.role === 'sales_executive') {
    if (lead.assignedTo) {
      throw new ApiError(403, 'This lead is already assigned to someone else');
    }
    if (targetUserId === null || String(targetUserId) !== String(requestingUser._id)) {
      throw new ApiError(403, 'You can only assign leads to yourself');
    }
    lead.assignedTo = requestingUser._id;
  } else {
    if (requestingUser.role === 'sales_manager') {
      const leadInScope = !lead.assignedTo || scopeIds.some((id) => String(id) === String(lead.assignedTo));
      if (!leadInScope) throw new ApiError(403, 'This lead is outside your team');
    }

    if (targetUserId === null) {
      lead.assignedTo = null;
    } else {
      const target = await User.findById(targetUserId);
      if (!target || !target.isActive) {
        throw new ApiError(400, 'assignedTo must reference an active user');
      }
      if (requestingUser.role === 'sales_manager') {
        const targetInTeam = scopeIds.some((id) => String(id) === String(target._id));
        if (!targetInTeam) throw new ApiError(403, 'You can only assign leads to yourself or your team');
      }
      lead.assignedTo = target._id;
    }
  }

  await lead.save();
  await lead.populate([POPULATE_ASSIGNEE, POPULATE_CREATOR]);
  return lead;
}

async function addNote(id, text, requestingUser, scopeIds) {
  const lead = await Lead.findById(id);
  if (!lead) throw new ApiError(404, 'Lead not found');
  if (!isEditable(scopeIds, lead)) {
    throw new ApiError(403, 'You do not have permission to modify this lead');
  }
  if (lead.status === 'converted') {
    throw new ApiError(400, 'Converted leads cannot be modified');
  }

  lead.notes.push({ text, author: requestingUser._id });
  await lead.save();
  await lead.populate([POPULATE_ASSIGNEE, POPULATE_CREATOR, POPULATE_NOTE_AUTHOR]);
  return lead;
}

module.exports = {
  listLeads,
  createLead,
  getLeadById,
  updateLead,
  assignLead,
  addNote,
  isEditable,
  POPULATE_ASSIGNEE,
  POPULATE_CREATOR,
};
