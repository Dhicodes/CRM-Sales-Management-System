const express = require('express');
const userController = require('../controllers/userController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const scopeToAssigned = require('../middleware/scopeToAssigned');
const validate = require('../middleware/validate');
const { createUserValidator, updateUserValidator } = require('../validators/userValidators');

const router = express.Router();

router.use(authenticate);

// Read-only, role-scoped lookup used by the Leads assignment UI. Available
// to every authenticated role (unlike the admin-only CRUD below) each
// requester only ever sees themselves and (for managers) their own team.
router.get('/assignable', scopeToAssigned, userController.listAssignableUsers);

// User management is Admin-only per the role/permission matrix.
router.use(authorize('admin'));

router.get('/', userController.listUsers);
router.post('/', createUserValidator, validate, userController.createUser);
router.get('/:id', userController.getUser);
router.patch('/:id', updateUserValidator, validate, userController.updateUser);
router.patch('/:id/deactivate', userController.deactivateUser);

module.exports = router;
