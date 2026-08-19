const { ApiError } = require('../utils/apiResponse');
const { buildPagination } = require('../utils/queryBuilder');
const Notification = require('../models/Notification');
const Activity = require('../models/Activity');

const UPCOMING_WINDOW_MS = 24 * 60 * 60 * 1000;

// Notifications are a side-effect of another action, not core business data
// a failure here must never break the write path that triggered it (mirrors
// timelineService's error-swallowing).
async function notify(userId, type, message, relatedEntityType, relatedEntityId) {
  try {
    await Notification.create({ user: userId, type, message, relatedEntityType, relatedEntityId });
  } catch (err) {
    console.error('Failed to create notification:', err.message);
  }
}

// Derives followup_upcoming/followup_overdue notifications from the
// requester's own pending activities at read time there is no cron worker.
// Upserts idempotently keyed on (user, type, relatedEntityId) so repeated
// polling doesn't create duplicates for the same follow-up.
async function syncFollowupNotifications(userId) {
  const now = new Date();
  const soon = new Date(now.getTime() + UPCOMING_WINDOW_MS);

  const [upcoming, overdue] = await Promise.all([
    Activity.find({ assignedTo: userId, status: 'pending', dueDate: { $gte: now, $lte: soon } }),
    Activity.find({ assignedTo: userId, status: 'pending', dueDate: { $lt: now } }),
  ]);

  const derived = [
    ...upcoming.map((activity) => ({ activity, type: 'followup_upcoming', label: 'is due soon' })),
    ...overdue.map((activity) => ({ activity, type: 'followup_overdue', label: 'is overdue' })),
  ];

  await Promise.all(
    derived.map(({ activity, type, label }) =>
      Notification.findOneAndUpdate(
        { user: userId, type, relatedEntityId: activity._id },
        {
          $setOnInsert: {
            user: userId,
            type,
            relatedEntityType: 'Activity',
            relatedEntityId: activity._id,
            message: `Follow-up (${activity.type}) ${label} due ${new Date(activity.dueDate).toLocaleDateString()}`,
            isRead: false,
          },
        },
        { upsert: true }
      )
    )
  );
}

async function listNotifications(userId, query) {
  await syncFollowupNotifications(userId);

  const filter = { user: userId };
  const { page, limit, skip } = buildPagination(query);

  const [items, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ isRead: 1, createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: userId, isRead: false }),
  ]);

  return { items, total, page, limit, totalPages: Math.max(Math.ceil(total / limit), 1), unreadCount };
}

async function markAsRead(id, userId) {
  const notification = await Notification.findOneAndUpdate({ _id: id, user: userId }, { isRead: true }, { new: true });
  if (!notification) throw new ApiError(404, 'Notification not found');
  return notification;
}

async function markAllAsRead(userId) {
  await Notification.updateMany({ user: userId, isRead: false }, { isRead: true });
}

module.exports = { notify, listNotifications, markAsRead, markAllAsRead };
