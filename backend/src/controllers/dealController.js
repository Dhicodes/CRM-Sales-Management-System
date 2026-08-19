const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const dealService = require('../services/dealService');
const timelineService = require('../services/timelineService');

const listDeals = asyncHandler(async (req, res) => {
  const result = await dealService.listDeals(req.query, req.scopeIds);
  sendSuccess(res, 200, result, 'Deals retrieved successfully');
});

const createDeal = asyncHandler(async (req, res) => {
  const deal = await dealService.createDeal(req.body, req.user, req.scopeIds);
  sendSuccess(res, 201, deal, 'Deal created successfully');
});

const getDeal = asyncHandler(async (req, res) => {
  const deal = await dealService.getDealById(req.params.id, req.scopeIds);
  sendSuccess(res, 200, deal, 'Deal retrieved successfully');
});

const updateDeal = asyncHandler(async (req, res) => {
  const deal = await dealService.updateDeal(req.params.id, req.body, req.user, req.scopeIds);
  sendSuccess(res, 200, deal, 'Deal updated successfully');
});

const changeStage = asyncHandler(async (req, res) => {
  const deal = await dealService.changeStage(req.params.id, req.body, req.user, req.scopeIds);
  sendSuccess(res, 200, deal, 'Deal stage updated successfully');
});

const assignDeal = asyncHandler(async (req, res) => {
  const deal = await dealService.assignDeal(req.params.id, req.body.assignedTo, req.user, req.scopeIds);
  sendSuccess(res, 200, deal, 'Deal assignment updated successfully');
});

const getTimeline = asyncHandler(async (req, res) => {
  await dealService.getDealById(req.params.id, req.scopeIds);
  const events = await timelineService.getTimeline('Deal', req.params.id);
  sendSuccess(res, 200, events, 'Timeline retrieved successfully');
});

module.exports = { listDeals, createDeal, getDeal, updateDeal, changeStage, assignDeal, getTimeline };
