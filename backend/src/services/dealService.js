const Deal = require('../models/Deal');
const { STAGE_DEFAULT_PROBABILITY } = Deal;

const POPULATE_ASSIGNEE = { path: 'assignedTo', select: 'name email role' };

// Full Deal CRUD, stage-transition rules, and the pipeline UI land in
// Phase 5. For now this only supports what lead conversion needs: creating
// the initial deal and listing a customer's deals read-only.
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

module.exports = { createInitialDeal, listByCustomer };
