const mongoose = require('mongoose');

const ENTITY_TYPES = ['Lead', 'Customer', 'Deal'];

const EVENT_TYPES = [
  'created',
  'assigned',
  'reassigned',
  'status_changed',
  'priority_changed',
  'details_updated',
  'note_added',
  'stage_changed',
  'converted',
  'followup_created',
  'followup_completed',
  'closed',
];

const timelineEventSchema = new mongoose.Schema(
  {
    entityType: { type: String, enum: ENTITY_TYPES, required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    eventType: { type: String, enum: EVENT_TYPES, required: true },
    description: { type: String, required: true },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

timelineEventSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

module.exports = mongoose.model('TimelineEvent', timelineEventSchema);
module.exports.ENTITY_TYPES = ENTITY_TYPES;
module.exports.EVENT_TYPES = EVENT_TYPES;
