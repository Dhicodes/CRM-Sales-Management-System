const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const dashboardService = require('../services/dashboardService');

const getSummary = asyncHandler(async (req, res) => {
  const summary = await dashboardService.getSummary(req.scopeIds);
  sendSuccess(res, 200, summary, 'Dashboard summary retrieved successfully');
});

const getTeamPerformance = asyncHandler(async (req, res) => {
  const rows = await dashboardService.getTeamPerformance(req.user);
  sendSuccess(res, 200, rows, 'Team performance retrieved successfully');
});

module.exports = { getSummary, getTeamPerformance };
