const { body } = require('express-validator');
const mongoose = require('mongoose');
const { ROLES } = require('../models/User');

const createUserValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role').isIn(ROLES).withMessage(`Role must be one of: ${ROLES.join(', ')}`),
  body('managerId')
    .if(body('role').equals('sales_executive'))
    .custom((value) => mongoose.isValidObjectId(value))
    .withMessage('A valid managerId is required for sales_executive users'),
];

const updateUserValidator = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('role').optional().isIn(ROLES).withMessage(`Role must be one of: ${ROLES.join(', ')}`),
  body('managerId')
    .optional({ nullable: true })
    .custom((value) => value === null || mongoose.isValidObjectId(value))
    .withMessage('managerId must be a valid user id or null'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
];

module.exports = { createUserValidator, updateUserValidator };
