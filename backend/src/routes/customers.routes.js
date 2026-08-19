const express = require('express');
const customerController = require('../controllers/customerController');
const authenticate = require('../middleware/authenticate');
const scopeToAssigned = require('../middleware/scopeToAssigned');
const validate = require('../middleware/validate');
const {
  createCustomerValidator,
  updateCustomerValidator,
  assignCustomerValidator,
} = require('../validators/customerValidators');

const router = express.Router();

router.use(authenticate, scopeToAssigned);

router.get('/', customerController.listCustomers);
router.post('/', createCustomerValidator, validate, customerController.createCustomer);
router.get('/:id', customerController.getCustomer);
router.patch('/:id', updateCustomerValidator, validate, customerController.updateCustomer);
router.patch('/:id/assign', assignCustomerValidator, validate, customerController.assignCustomer);
router.get('/:id/deals', customerController.listCustomerDeals);

module.exports = router;
