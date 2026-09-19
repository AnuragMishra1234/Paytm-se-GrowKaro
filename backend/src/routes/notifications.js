const express = require('express');
const router = express.Router();
const { validateObjectId } = require('../middleware/errorHandler');
const { markRead } = require('../controllers/notificationController');

// PATCH /api/notifications/:id/read - Mark individual notification as read
router.patch('/:id/read', validateObjectId, markRead);

module.exports = router;
