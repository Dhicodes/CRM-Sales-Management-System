const { body } = require('express-validator');
const mongoose = require('mongoose');
const { SOURCES, STATUSES, PRIORITIES } = require('../models/Lead');
const { isTodayOrFuture } = require('../utils/dateValidation');

const assignableIdOrNull = (value) => value === null || mongoose.isValidObjectId(value);

const createLeadValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('phone').optional().trim(),
  body('company').optional().trim(),
  body('source').isIn(SOURCES).withMessage(`Source must be one of: ${SOURCES.join(', ')}`),
  body('priority').optional().isIn(PRIORITIES).withMessage(`Priority must be one of: ${PRIORITIES.join(', ')}`),
  body('assignedTo')
    .optional({ nullable: true })
    .custom(assignableIdOrNull)
    .withMessage('assignedTo must be a valid user id or null'),
];

const updateLeadValidator = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('phone').optional().trim(),
  body('company').optional().trim(),
  body('source').optional().isIn(SOURCES).withMessage(`Source must be one of: ${SOURCES.join(', ')}`),
  body('status').optional().isIn(STATUSES).withMessage(`Status must be one of: ${STATUSES.join(', ')}`),
  body('priority').optional().isIn(PRIORITIES).withMessage(`Priority must be one of: ${PRIORITIES.join(', ')}`),
];

const assignLeadValidator = [
  body('assignedTo')
    .exists()
    .withMessage('assignedTo is required (use null to unassign)')
    .custom(assignableIdOrNull)
    .withMessage('assignedTo must be a valid user id or null'),
];

const addNoteValidator = [body('text').trim().notEmpty().withMessage('Note text is required')];

const convertLeadValidator = [
  body('dealTitle').trim().notEmpty().withMessage('Deal title is required'),
  body('dealValue').isFloat({ gt: 0 }).withMessage('Deal value must be a positive number'),
  body('expectedCloseDate')
    .isISO8601()
    .withMessage('A valid expected close date is required')
    .custom(isTodayOrFuture)
    .withMessage('Expected close date cannot be in the past')
    .toDate(),
  body('assignedTo')
    .optional()
    .custom((value) => mongoose.isValidObjectId(value))
    .withMessage('assignedTo must be a valid user id'),
];

module.exports = {
  createLeadValidator,
  updateLeadValidator,
  assignLeadValidator,
  addNoteValidator,
  convertLeadValidator,
};
