const { body } = require('express-validator');
const mongoose = require('mongoose');

const createCustomerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('phone').optional().trim(),
  body('company').optional().trim(),
  body('address').optional().trim(),
  body('assignedTo')
    .optional()
    .custom((value) => mongoose.isValidObjectId(value))
    .withMessage('assignedTo must be a valid user id'),
];

const updateCustomerValidator = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('phone').optional().trim(),
  body('company').optional().trim(),
  body('address').optional().trim(),
];

const assignCustomerValidator = [
  body('assignedTo')
    .exists()
    .withMessage('assignedTo is required')
    .custom((value) => mongoose.isValidObjectId(value))
    .withMessage('assignedTo must be a valid user id'),
];

module.exports = { createCustomerValidator, updateCustomerValidator, assignCustomerValidator };
