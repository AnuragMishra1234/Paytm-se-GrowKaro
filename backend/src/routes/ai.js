const express = require('express');
const router = express.Router();
const { validateObjectId } = require('../middleware/errorHandler');
const { handleChat, triggerAnalysis, getDailyBrief } = require('../controllers/aiController');

// POST /api/ai/chat
router.post('/chat', handleChat);

// POST /api/ai/analyze/:merchantId
router.post('/analyze/:merchantId', (req, res, next) => {
  req.params.id = req.params.merchantId;
  validateObjectId(req, res, () => {
    triggerAnalysis(req, res, next);
  });
});

// GET /api/ai/brief/:merchantId
router.get('/brief/:merchantId', (req, res, next) => {
  req.params.id = req.params.merchantId;
  validateObjectId(req, res, () => {
    getDailyBrief(req, res, next);
  });
});

module.exports = router;