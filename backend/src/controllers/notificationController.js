const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const notificationService = require('../services/notificationService');

const listNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.listNotifications(req.user._id, req.query);
  sendSuccess(res, 200, result, 'Notifications retrieved successfully');
});

const markAsRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markAsRead(req.params.id, req.user._id);
  sendSuccess(res, 200, notification, 'Notification marked as read');
});

const markAllAsRead = asyncHandler(async (req, res) => {
  await notificationService.markAllAsRead(req.user._id);
  sendSuccess(res, 200, null, 'All notifications marked as read');
});

module.exports = { listNotifications, markAsRead, markAllAsRead };
