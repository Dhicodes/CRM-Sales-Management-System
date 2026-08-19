const { body } = require('express-validator');
const mongoose = require('mongoose');
const Deal = require('../models/Deal');
const { STAGES } = Deal;
const { isTodayOrFuture } = require('../utils/dateValidation');

const createDealValidator = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('customerId')
    .custom((value) => mongoose.isValidObjectId(value))
    .withMessage('A valid customerId is required'),
  body('value').isFloat({ gt: 0 }).withMessage('Value must be a positive number'),
  body('currency').optional().trim(),
  body('expectedCloseDate')
    .isISO8601()
    .withMessage('A valid expected close date is required')
    .custom(isTodayOrFuture)
    .withMessage('Expected close date cannot be in the past')
    .toDate(),
  body('probability').optional().isInt({ min: 0, max: 100 }).withMessage('Probability must be between 0 and 100'),
  body('assignedTo')
    .optional()
    .custom((value) => mongoose.isValidObjectId(value))
    .withMessage('assignedTo must be a valid user id'),
];

const updateDealValidator = [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('value').optional().isFloat({ gt: 0 }).withMessage('Value must be a positive number'),
  body('currency').optional().trim(),
  body('expectedCloseDate').optional().isISO8601().withMessage('A valid expected close date is required').toDate(),
  body('probability').optional().isInt({ min: 0, max: 100 }).withMessage('Probability must be between 0 and 100'),
];

const changeStageValidator = [
  body('stage').isIn(STAGES).withMessage(`Stage must be one of: ${STAGES.join(', ')}`),
  body('probability').optional().isInt({ min: 0, max: 100 }).withMessage('Probability must be between 0 and 100'),
  body('lossReason')
    .if(body('stage').equals('Lost'))
    .trim()
    .notEmpty()
    .withMessage('lossReason is required when marking a deal as Lost'),
];

const assignDealValidator = [
  body('assignedTo')
    .exists()
    .withMessage('assignedTo is required')
    .custom((value) => mongoose.isValidObjectId(value))
    .withMessage('assignedTo must be a valid user id'),
];

module.exports = { createDealValidator, updateDealValidator, changeStageValidator, assignDealValidator };
