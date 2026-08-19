const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const activityService = require('../services/activityService');

const listActivities = asyncHandler(async (req, res) => {
  const result = await activityService.listActivities(req.query, req.scopeIds);
  sendSuccess(res, 200, result, 'Activities retrieved successfully');
});

const createActivity = asyncHandler(async (req, res) => {
  const activity = await activityService.createActivity(req.body, req.user, req.scopeIds);
  sendSuccess(res, 201, activity, 'Activity created successfully');
});

const updateActivity = asyncHandler(async (req, res) => {
  const activity = await activityService.updateActivity(req.params.id, req.body, req.user, req.scopeIds);
  sendSuccess(res, 200, activity, 'Activity updated successfully');
});

const deleteActivity = asyncHandler(async (req, res) => {
  await activityService.deleteActivity(req.params.id, req.scopeIds);
  sendSuccess(res, 200, null, 'Activity deleted successfully');
});

module.exports = { listActivities, createActivity, updateActivity, deleteActivity };
