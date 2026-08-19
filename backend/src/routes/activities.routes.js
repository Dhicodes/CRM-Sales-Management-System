const express = require('express');
const activityController = require('../controllers/activityController');
const authenticate = require('../middleware/authenticate');
const scopeToAssigned = require('../middleware/scopeToAssigned');
const validate = require('../middleware/validate');
const { createActivityValidator, updateActivityValidator } = require('../validators/activityValidators');

const router = express.Router();

router.use(authenticate, scopeToAssigned);

router.get('/', activityController.listActivities);
router.post('/', createActivityValidator, validate, activityController.createActivity);
router.patch('/:id', updateActivityValidator, validate, activityController.updateActivity);
router.delete('/:id', activityController.deleteActivity);

module.exports = router;
