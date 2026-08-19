const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const scopeToAssigned = require('../middleware/scopeToAssigned');

const router = express.Router();

router.use(authenticate, scopeToAssigned);

router.get('/summary', dashboardController.getSummary);
router.get('/team-performance', authorize('admin', 'sales_manager'), dashboardController.getTeamPerformance);

module.exports = router;
