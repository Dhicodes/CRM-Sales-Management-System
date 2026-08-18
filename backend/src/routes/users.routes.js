const express = require('express');
const userController = require('../controllers/userController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { createUserValidator, updateUserValidator } = require('../validators/userValidators');

const router = express.Router();

// User management is Admin-only per the role/permission matrix.
router.use(authenticate, authorize('admin'));

router.get('/', userController.listUsers);
router.post('/', createUserValidator, validate, userController.createUser);
router.get('/:id', userController.getUser);
router.patch('/:id', updateUserValidator, validate, userController.updateUser);
router.patch('/:id/deactivate', userController.deactivateUser);

module.exports = router;
