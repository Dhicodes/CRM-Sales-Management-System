const express = require('express');
const notificationController = require('../controllers/notificationController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.use(authenticate);

router.get('/', notificationController.listNotifications);
router.patch('/read-all', notificationController.markAllAsRead);
router.patch('/:id/read', notificationController.markAsRead);

module.exports = router;
