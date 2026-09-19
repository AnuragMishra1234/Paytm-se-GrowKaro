const express = require('express');
const router = express.Router();
const { validateObjectId } = require('../middleware/errorHandler');
const { restrictFinancials, requireRole } = require('../middleware/rbac');
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
  getDailyBrief,
  getWeeklyReview,
  getDataSourceStatus,
  simulateDataSourceLink,
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

// GET /api/merchants/:id/analytics (Restricted for STAFF and MARKETING)
router.get('/:id/analytics', validateObjectId, restrictFinancials(), getAnalytics);

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

// ─── Proactive Business Intelligence: Daily Brief & Weekly Review ──────────

// GET & POST /api/merchants/:id/briefs/daily
router.get('/:id/briefs/daily', validateObjectId, getDailyBrief);
router.post('/:id/briefs/daily/generate', validateObjectId, getDailyBrief);

// GET & POST /api/merchants/:id/briefs/weekly
router.get('/:id/briefs/weekly', validateObjectId, getWeeklyReview);
router.post('/:id/briefs/weekly/generate', validateObjectId, getWeeklyReview);

// Backward-compatible endpoints
router.get('/:id/daily-brief', validateObjectId, getDailyBrief);
router.get('/:id/brief', validateObjectId, getDailyBrief);
router.post('/:id/brief/generate', validateObjectId, getDailyBrief);

// ─── Data Source Integration & Linking ────────────────────────────────────

// GET /api/merchants/:id/data-sources/status
router.get('/:id/data-sources/status', validateObjectId, getDataSourceStatus);

// POST /api/merchants/:id/data-sources/simulate-link
router.post('/:id/data-sources/simulate-link', validateObjectId, simulateDataSourceLink);

// POST /api/merchants/:id/simulate/:scenario - Demo & evaluation triggers
router.post('/:id/simulate/:scenario', validateObjectId, runScenario);

// ─── Phase 6 Team & Task Workflows ───────────────────────────────────────

const { getTeam, inviteMember } = require('../controllers/teamController');
const { getMerchantTasks, createTask } = require('../controllers/taskController');

// GET /api/merchants/:id/team
router.get('/:id/team', validateObjectId, getTeam);

// POST /api/merchants/:id/team/invite (Restricted to OWNER and MANAGER)
router.post('/:id/team/invite', validateObjectId, requireRole(['OWNER', 'MANAGER']), inviteMember);

// GET /api/merchants/:id/tasks
router.get('/:id/tasks', validateObjectId, getMerchantTasks);

// POST /api/merchants/:id/tasks
router.post('/:id/tasks', validateObjectId, createTask);

// ─── Employee Workspace & AI Loyalty Workflows ───────────────────────────

const {
  getEmployeeDashboard,
  startEmployeeTask,
  completeEmployeeTask,
} = require('../controllers/employeeController');

const {
  getLoyaltyCustomers,
  getCustomerLoyaltyDetail,
  getLoyaltyOpportunities,
  submitPersonalizedOffer,
  recordOfferOutcome,
} = require('../controllers/loyaltyController');

// Employee Workspace
router.get('/:id/employee/dashboard', validateObjectId, getEmployeeDashboard);
router.post('/:id/employee/tasks/:taskId/start', validateObjectId, startEmployeeTask);
router.post('/:id/employee/tasks/:taskId/complete', validateObjectId, completeEmployeeTask);

// AI Customer Loyalty & Personalized Offers
router.get('/:id/loyalty/customers', validateObjectId, getLoyaltyCustomers);
router.get('/:id/loyalty/customers/:customerId', validateObjectId, getCustomerLoyaltyDetail);
router.get('/:id/loyalty/opportunities', validateObjectId, getLoyaltyOpportunities);
router.post('/:id/loyalty/offers/create', validateObjectId, submitPersonalizedOffer);
router.post('/:id/loyalty/offers/:actionId/outcome', validateObjectId, recordOfferOutcome);

module.exports = router;