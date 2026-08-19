const TimelineEvent = require('../models/TimelineEvent');

const POPULATE_PERFORMER = { path: 'performedBy', select: 'name email role' };

// Timeline entries are an audit trail, not core business data a failure
// here must never break the write path that triggered it, so errors are
// swallowed and logged rather than propagated.
async function log(entry) {
  try {
    return await TimelineEvent.create(entry);
  } catch (err) {
    console.error('Failed to write timeline event:', err.message);
    return null;
  }
}

async function getTimeline(entityType, entityId) {
  return TimelineEvent.find({ entityType, entityId }).sort({ createdAt: -1 }).populate(POPULATE_PERFORMER);
}

module.exports = { log, getTimeline };
