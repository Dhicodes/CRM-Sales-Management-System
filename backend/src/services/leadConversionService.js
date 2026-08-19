const { ApiError } = require('../utils/apiResponse');
const { resolveAssignee } = require('./assignmentService');
const leadService = require('./leadService');
const dealService = require('./dealService');
const timelineService = require('./timelineService');
const notificationService = require('./notificationService');
const Lead = require('../models/Lead');
const Customer = require('../models/Customer');
const Deal = require('../models/Deal');
const User = require('../models/User');

const POPULATE_ASSIGNEE = { path: 'assignedTo', select: 'name email role' };
const POPULATE_CREATOR = { path: 'createdBy', select: 'name email' };

// The local MongoDB instance is a standalone node (no replica set), so
// multi-document transactions aren't available. Writes happen sequentially
// with manual rollback of already-created records if a later step fails,
// per the plan's fallback for a single-node dev setup.
async function convertLead(leadId, data, requestingUser, scopeIds) {
  const lead = await Lead.findById(leadId);
  if (!lead) throw new ApiError(404, 'Lead not found');
  if (!leadService.isEditable(scopeIds, lead)) {
    throw new ApiError(403, 'You do not have permission to convert this lead');
  }
  if (lead.status === 'converted') {
    throw new ApiError(400, 'This lead has already been converted');
  }
  if (lead.status !== 'qualified') {
    throw new ApiError(400, 'Only qualified leads can be converted');
  }

  const assignedTo =
    data.assignedTo !== undefined
      ? await resolveAssignee(data.assignedTo, requestingUser, scopeIds)
      : lead.assignedTo; // non-null: isEditable already guarantees an owner

  const customer = await Customer.create({
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    company: lead.company,
    originLead: lead._id,
    assignedTo,
    createdBy: requestingUser._id,
  });

  let deal;
  try {
    deal = await dealService.createInitialDeal({
      title: data.dealTitle,
      value: data.dealValue,
      expectedCloseDate: data.expectedCloseDate,
      customerId: customer._id,
      originLeadId: lead._id,
      assignedTo,
      createdBy: requestingUser._id,
    });
  } catch (err) {
    await Customer.findByIdAndDelete(customer._id);
    throw err;
  }

  try {
    lead.status = 'converted';
    lead.convertedToCustomer = customer._id;
    lead.convertedToDeal = deal._id;
    await lead.save();
  } catch (err) {
    await Deal.findByIdAndDelete(deal._id);
    await Customer.findByIdAndDelete(customer._id);
    throw err;
  }

  await customer.populate([POPULATE_ASSIGNEE, POPULATE_CREATOR]);
  await deal.populate(POPULATE_ASSIGNEE);
  await lead.populate([POPULATE_ASSIGNEE, POPULATE_CREATOR]);

  await timelineService.log({
    entityType: 'Lead',
    entityId: lead._id,
    eventType: 'converted',
    description: 'Lead converted to customer',
    performedBy: requestingUser._id,
    metadata: { customerId: customer._id, dealId: deal._id },
  });
  await timelineService.log({
    entityType: 'Customer',
    entityId: customer._id,
    eventType: 'created',
    description: 'Customer created from lead conversion',
    performedBy: requestingUser._id,
    metadata: { originLead: lead._id },
  });
  await timelineService.log({
    entityType: 'Deal',
    entityId: deal._id,
    eventType: 'created',
    description: 'Deal created from lead conversion',
    performedBy: requestingUser._id,
    metadata: { originLead: lead._id, customerId: customer._id },
  });

  if (String(assignedTo) !== String(requestingUser._id)) {
    await notificationService.notify(
      assignedTo,
      'lead_converted',
      `Lead "${lead.name}" was converted to a customer`,
      'Lead',
      lead._id
    );
  }
  const assignee = await User.findById(assignedTo).select('managerId');
  if (
    assignee?.managerId &&
    String(assignee.managerId) !== String(requestingUser._id) &&
    String(assignee.managerId) !== String(assignedTo)
  ) {
    await notificationService.notify(
      assignee.managerId,
      'lead_converted',
      `${requestingUser.name} converted lead "${lead.name}" to a customer`,
      'Lead',
      lead._id
    );
  }

  return { lead, customer, deal };
}

module.exports = { convertLead };
