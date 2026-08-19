const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const leadService = require('../services/leadService');
const leadConversionService = require('../services/leadConversionService');

const listLeads = asyncHandler(async (req, res) => {
  const result = await leadService.listLeads(req.query, req.scopeIds);
  sendSuccess(res, 200, result, 'Leads retrieved successfully');
});

const createLead = asyncHandler(async (req, res) => {
  const lead = await leadService.createLead(req.body, req.user, req.scopeIds);
  sendSuccess(res, 201, lead, 'Lead created successfully');
});

const getLead = asyncHandler(async (req, res) => {
  const lead = await leadService.getLeadById(req.params.id, req.scopeIds);
  sendSuccess(res, 200, lead, 'Lead retrieved successfully');
});

const updateLead = asyncHandler(async (req, res) => {
  const lead = await leadService.updateLead(req.params.id, req.body, req.scopeIds);
  sendSuccess(res, 200, lead, 'Lead updated successfully');
});

const assignLead = asyncHandler(async (req, res) => {
  const lead = await leadService.assignLead(req.params.id, req.body.assignedTo, req.user, req.scopeIds);
  sendSuccess(res, 200, lead, 'Lead assignment updated successfully');
});

const addNote = asyncHandler(async (req, res) => {
  const lead = await leadService.addNote(req.params.id, req.body.text, req.user, req.scopeIds);
  sendSuccess(res, 201, lead, 'Note added successfully');
});

const convertLead = asyncHandler(async (req, res) => {
  const result = await leadConversionService.convertLead(req.params.id, req.body, req.user, req.scopeIds);
  sendSuccess(res, 201, result, 'Lead converted successfully');
});

module.exports = { listLeads, createLead, getLead, updateLead, assignLead, addNote, convertLead };
