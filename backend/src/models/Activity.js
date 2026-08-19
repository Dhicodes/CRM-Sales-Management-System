const mongoose = require('mongoose');

const TYPES = ['call', 'email', 'meeting', 'demo', 'reminder'];
const STATUSES = ['pending', 'completed'];
const RELATED_TYPES = ['Lead', 'Customer', 'Deal'];

const activitySchema = new mongoose.Schema(
  {
    type: { type: String, enum: TYPES, required: true },
    relatedToType: { type: String, enum: RELATED_TYPES, required: true },
    relatedToId: { type: mongoose.Schema.Types.ObjectId, required: true },
    dueDate: { type: Date, required: true },
    // "overdue" is derived (pending && dueDate < now), never stored.
    status: { type: String, enum: STATUSES, default: 'pending' },
    notes: { type: String, trim: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    completedAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

activitySchema.index({ assignedTo: 1, status: 1, dueDate: 1 });
activitySchema.index({ relatedToType: 1, relatedToId: 1 });

module.exports = mongoose.model('Activity', activitySchema);
module.exports.TYPES = TYPES;
module.exports.STATUSES = STATUSES;
module.exports.RELATED_TYPES = RELATED_TYPES;
