const express = require('express');
const router = express.Router();
const { handleN8nWebhook } = require('../controllers/actionController');
const { getN8nStatus } = require('../controllers/outcomeController');

// GET /api/n8n/status
router.get('/status', getN8nStatus);

// POST /api/n8n/webhook/action-status
router.post('/webhook/action-status', handleN8nWebhook);

module.exports = router;