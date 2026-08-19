const { body } = require('express-validator');
const mongoose = require('mongoose');
const Activity = require('../models/Activity');
const { TYPES, STATUSES, RELATED_TYPES } = Activity;

const createActivityValidator = [
  body('type').isIn(TYPES).withMessage(`Type must be one of: ${TYPES.join(', ')}`),
  body('relatedToType').isIn(RELATED_TYPES).withMessage(`relatedToType must be one of: ${RELATED_TYPES.join(', ')}`),
  body('relatedToId')
    .custom((value) => mongoose.isValidObjectId(value))
    .withMessage('A valid relatedToId is required'),
  body('dueDate').isISO8601().withMessage('A valid due date is required').toDate(),
  body('notes').optional().trim(),
  body('assignedTo')
    .optional()
    .custom((value) => mongoose.isValidObjectId(value))
    .withMessage('assignedTo must be a valid user id'),
];

const updateActivityValidator = [
  body('type').optional().isIn(TYPES).withMessage(`Type must be one of: ${TYPES.join(', ')}`),
  body('dueDate').optional().isISO8601().withMessage('A valid due date is required').toDate(),
  body('notes').optional().trim(),
  body('status').optional().isIn(STATUSES).withMessage(`Status must be one of: ${STATUSES.join(', ')}`),
];

module.exports = { createActivityValidator, updateActivityValidator };
