const mongoose = require('mongoose');

const SOURCES = ['website', 'referral', 'social_media', 'email', 'phone'];
const STATUSES = ['new', 'contacted', 'qualified', 'unqualified', 'converted'];
const PRIORITIES = ['low', 'medium', 'high'];

const noteSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const leadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    company: { type: String, trim: true },
    source: { type: String, enum: SOURCES, required: true },
    status: { type: String, enum: STATUSES, default: 'new' },
    priority: { type: String, enum: PRIORITIES, default: 'medium' },
    // null = unassigned pool; any executive may self-claim from here.
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    notes: [noteSchema],
  },
  { timestamps: true }
);

leadSchema.index({ assignedTo: 1, status: 1 });
leadSchema.index({ source: 1 });
leadSchema.index({ createdAt: -1 });
leadSchema.index({ name: 'text', email: 'text', company: 'text' });

module.exports = mongoose.model('Lead', leadSchema);
module.exports.SOURCES = SOURCES;
module.exports.STATUSES = STATUSES;
module.exports.PRIORITIES = PRIORITIES;
