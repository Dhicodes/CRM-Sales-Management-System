const mongoose = require('mongoose');

const TYPES = [
  'lead_assigned',
  'customer_assigned',
  'deal_assigned',
  'lead_converted',
  'deal_closed',
  'followup_upcoming',
  'followup_overdue',
];
const RELATED_TYPES = ['Lead', 'Customer', 'Deal', 'Activity'];

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: TYPES, required: true },
    message: { type: String, required: true },
    relatedEntityType: { type: String, enum: RELATED_TYPES, required: true },
    relatedEntityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ user: 1, type: 1, relatedEntityId: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
module.exports.TYPES = TYPES;
module.exports.RELATED_TYPES = RELATED_TYPES;
