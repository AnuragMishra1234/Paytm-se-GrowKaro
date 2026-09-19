const express = require('express');
const router = express.Router();
const { validateObjectId } = require('../middleware/errorHandler');
const {
  getAllMerchants,
  getMerchant,
  getDashboard,
  getTransactions,
  getProducts,
  getCustomers,
  getAnalytics,
  getMerchantInsights,
  getMerchantInsightDetail,
  dismissMerchantInsight,
  getMerchantRecommendations,
  getMerchantMemories,
  addMerchantMemory,
  getMerchantContext,
  getMerchantActivity,
} = require('../controllers/merchantController');

// GET /api/merchants
router.get('/', getAllMerchants);

// GET /api/merchants/:id
router.get('/:id', validateObjectId, getMerchant);

// GET /api/merchants/:id/dashboard
router.get('/:id/dashboard', validateObjectId, getDashboard);

// GET /api/merchants/:id/transactions
router.get('/:id/transactions', validateObjectId, getTransactions);

// GET /api/merchants/:id/products
router.get('/:id/products', validateObjectId, getProducts);

// GET /api/merchants/:id/customers
router.get('/:id/customers', validateObjectId, getCustomers);

// GET /api/merchants/:id/analytics
router.get('/:id/analytics', validateObjectId, getAnalytics);

// ─── Phase 2 AI & Memory Endpoints ────────────────────────────────────────

// GET /api/merchants/:id/insights
router.get('/:id/insights', validateObjectId, getMerchantInsights);

// GET /api/merchants/:id/insights/:insightId
router.get('/:id/insights/:insightId', validateObjectId, getMerchantInsightDetail);

// POST /api/merchants/:id/insights/:insightId/dismiss
router.post('/:id/insights/:insightId/dismiss', validateObjectId, dismissMerchantInsight);

// GET /api/merchants/:id/recommendations
router.get('/:id/recommendations', validateObjectId, getMerchantRecommendations);

// GET & POST /api/merchants/:id/memory
router.get('/:id/memory', validateObjectId, getMerchantMemories);
router.post('/:id/memory', validateObjectId, addMerchantMemory);

// GET /api/merchants/:id/context
router.get('/:id/context', validateObjectId, getMerchantContext);

// ─── Phase 3 Agentic Actions & Campaigns ──────────────────────────────────

const { getMerchantActions, getMerchantCampaigns } = require('../controllers/actionController');

// GET /api/merchants/:id/actions
router.get('/:id/actions', validateObjectId, getMerchantActions);

// GET /api/merchants/:id/campaigns
router.get('/:id/campaigns', validateObjectId, getMerchantCampaigns);

// ─── Phase 4 Notifications, Outcomes, Activity & Simulation ───────────────

const { getNotifications, markAllRead } = require('../controllers/notificationController');
const { getOutcomes, getLearnedSummary } = require('../controllers/outcomeController');
const { getDailyBrief } = require('../controllers/aiController');
const { runScenario } = require('../controllers/simulatorController');

// GET /api/merchants/:id/notifications
router.get('/:id/notifications', validateObjectId, getNotifications);

// PATCH /api/merchants/:id/notifications/read-all
router.patch('/:id/notifications/read-all', validateObjectId, markAllRead);

// GET /api/merchants/:id/activity - Full chronological lifecycle timeline
router.get('/:id/activity', validateObjectId, getMerchantActivity);

// GET /api/merchants/:id/outcomes
router.get('/:id/outcomes', validateObjectId, getOutcomes);

// GET /api/merchants/:id/learned
router.get('/:id/learned', validateObjectId, getLearnedSummary);

// GET /api/merchants/:id/daily-brief & /:id/brief
router.get('/:id/daily-brief', (req, res, next) => {
  req.params.merchantId = req.params.id;
  getDailyBrief(req, res, next);
});

router.get('/:id/brief', (req, res, next) => {
  req.params.merchantId = req.params.id;
  getDailyBrief(req, res, next);
});

router.post('/:id/brief/generate', (req, res, next) => {
  req.params.merchantId = req.params.id;
  getDailyBrief(req, res, next);
});

// POST /api/merchants/:id/simulate/:scenario - Demo & evaluation triggers
router.post('/:id/simulate/:scenario', validateObjectId, runScenario);

module.exports = router;