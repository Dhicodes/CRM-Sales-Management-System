const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const customerService = require('../services/customerService');

const listCustomers = asyncHandler(async (req, res) => {
  const result = await customerService.listCustomers(req.query, req.scopeIds);
  sendSuccess(res, 200, result, 'Customers retrieved successfully');
});

const createCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.createCustomer(req.body, req.user, req.scopeIds);
  sendSuccess(res, 201, customer, 'Customer created successfully');
});

const getCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.getCustomerById(req.params.id, req.scopeIds);
  sendSuccess(res, 200, customer, 'Customer retrieved successfully');
});

const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.updateCustomer(req.params.id, req.body, req.scopeIds);
  sendSuccess(res, 200, customer, 'Customer updated successfully');
});

const assignCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.assignCustomer(req.params.id, req.body.assignedTo, req.user, req.scopeIds);
  sendSuccess(res, 200, customer, 'Customer assignment updated successfully');
});

const listCustomerDeals = asyncHandler(async (req, res) => {
  const deals = await customerService.listCustomerDeals(req.params.id, req.scopeIds);
  sendSuccess(res, 200, deals, 'Customer deals retrieved successfully');
});

module.exports = { listCustomers, createCustomer, getCustomer, updateCustomer, assignCustomer, listCustomerDeals };
