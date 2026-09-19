const mongoose = require('mongoose');
const Merchant = require('../models/Merchant');
const Transaction = require('../models/Transaction');
const Insight = require('../models/Insight');
const Action = require('../models/Action');
const Outcome = require('../models/Outcome');
const Memory = require('../models/Memory');
const Notification = require('../models/Notification');
const analyticsService = require('../services/analyticsService');
const recommendationService = require('../services/recommendationService');
const memoryService = require('../services/memoryService');
const contextService = require('../services/contextService');

/**
 * GET /api/merchants
 * Returns all active merchants (for merchant selection screen)
 */
const getAllMerchants = async (req, res, next) => {
  try {
    const merchants = await Merchant.find({ isActive: true })
      .select('businessName businessType location currency ownerName')
      .lean();
    res.json({ success: true, data: merchants });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/merchants/:id
 * Returns a single merchant profile
 */
const getMerchant = async (req, res, next) => {
  try {
    const merchant = await Merchant.findById(req.params.id).lean();
    if (!merchant) {
      return res.status(404).json({ success: false, message: 'Merchant not found' });
    }
    res.json({ success: true, data: merchant });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/merchants/:id/dashboard
 * Returns aggregated dashboard data: KPIs + trends + Phase 2 AI insights
 * Query params: days=30 (revenue trend window)
 */
const getDashboard = async (req, res, next) => {
  try {
    const merchantId = new mongoose.Types.ObjectId(req.params.id);
    const days = parseInt(req.query.days) || 30;

    const merchant = await Merchant.findById(merchantId).lean();
    if (!merchant) {
      return res.status(404).json({ success: false, message: 'Merchant not found' });
    }

    const [dashboardData, insights] = await Promise.all([
      analyticsService.getDashboardData(merchantId, days),
      recommendationService.getInsights(merchantId),
    ]);

    res.json({
      success: true,
      data: {
        merchant: {
          id: merchant._id,
          businessName: merchant.businessName,
          businessType: merchant.businessType,
          location: merchant.location,
          currency: merchant.currency,
        },
        ...dashboardData,
        insights: insights.slice(0, 5), // Top 5 prioritized AI insights
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/merchants/:id/transactions
 * Returns paginated transaction list
 * Query params: page=1, limit=20, days=30
 */
const getTransactions = async (req, res, next) => {
  try {
    const merchantId = new mongoose.Types.ObjectId(req.params.id);
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const days = parseInt(req.query.days) || 30;

    const start = new Date();
    start.setDate(start.getDate() - days);

    const [transactions, total] = await Promise.all([
      Transaction.find({
        merchantId,
        timestamp: { $gte: start },
        paymentStatus: 'completed',
      })
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Transaction.countDocuments({ merchantId, timestamp: { $gte: start }, paymentStatus: 'completed' }),
    ]);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/merchants/:id/products
 * Returns product performance data
 */
const getProducts = async (req, res, next) => {
  try {
    const merchantId = new mongoose.Types.ObjectId(req.params.id);
    const days = parseInt(req.query.days) || 30;

    const [products, categories] = await Promise.all([
      analyticsService.getProductPerformance(merchantId),
      analyticsService.getCategoryPerformance(merchantId, days),
    ]);

    res.json({
      success: true,
      data: { products, categories },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/merchants/:id/customers
 * Returns customer analytics
 */
const getCustomers = async (req, res, next) => {
  try {
    const merchantId = new mongoose.Types.ObjectId(req.params.id);

    const [segments, topCustomers] = await Promise.all([
      analyticsService.getCustomerSegments(merchantId),
      analyticsService.getTopCustomers(merchantId, 10),
    ]);

    res.json({
      success: true,
      data: { segments, topCustomers },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/merchants/:id/analytics
 * Returns full analytics data (trends + hourly + weekday)
 * Query params: days=30
 */
const getAnalytics = async (req, res, next) => {
  try {
    const merchantId = new mongoose.Types.ObjectId(req.params.id);
    const days = parseInt(req.query.days) || 30;

    const [revenueTrend, hourlySales, weekdaySales, repeatRate] = await Promise.all([
      analyticsService.getRevenueTrend(merchantId, days),
      analyticsService.getHourlySales(merchantId, days),
      analyticsService.getWeekdaySales(merchantId, 8),
      analyticsService.getRepeatCustomerRate(merchantId, days),
    ]);

    res.json({
      success: true,
      data: { revenueTrend, hourlySales, weekdaySales, repeatRate },
    });
  } catch (err) {
    next(err);
  }
};

// ─── PHASE 2 AI & INSIGHTS ENDPOINTS ──────────────────────────────────────

/**
 * GET /api/merchants/:id/insights
 * Returns prioritized AI insights (supports ?category=ACT_NOW|OPPORTUNITY|WARNING|POSITIVE_TREND)
 */
const getMerchantInsights = async (req, res, next) => {
  try {
    const merchantId = new mongoose.Types.ObjectId(req.params.id);
    const { category } = req.query;
    const insights = await recommendationService.getInsights(merchantId, category);

    res.json({
      success: true,
      data: insights,
      count: insights.length,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/merchants/:id/insights/:insightId
 * Returns single insight detail
 */
const getMerchantInsightDetail = async (req, res, next) => {
  try {
    const merchantId = new mongoose.Types.ObjectId(req.params.id);
    const { insightId } = req.params;
    const insight = await recommendationService.getInsightById(merchantId, insightId);

    if (!insight) {
      return res.status(404).json({ success: false, message: 'Insight not found' });
    }

    res.json({ success: true, data: insight });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/merchants/:id/insights/:insightId/dismiss
 * Dismiss an insight
 */
const dismissMerchantInsight = async (req, res, next) => {
  try {
    const merchantId = new mongoose.Types.ObjectId(req.params.id);
    const { insightId } = req.params;
    const dismissed = await recommendationService.dismissInsight(merchantId, insightId);

    res.json({ success: true, data: dismissed, message: 'Insight dismissed' });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/merchants/:id/recommendations
 * Returns active actionable recommendations
 */
const getMerchantRecommendations = async (req, res, next) => {
  try {
    const merchantId = new mongoose.Types.ObjectId(req.params.id);
    const recommendations = await recommendationService.getRecommendations(merchantId);

    res.json({
      success: true,
      data: recommendations,
      count: recommendations.length,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/merchants/:id/memory
 * Returns Cognee / business memories for the merchant
 */
const getMerchantMemories = async (req, res, next) => {
  try {
    const merchantId = new mongoose.Types.ObjectId(req.params.id);
    const memories = await memoryService.getMerchantMemories(merchantId, req.query);

    res.json({
      success: true,
      data: memories,
      count: memories.length,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/merchants/:id/memory
 * Store a new business memory fact
 */
const addMerchantMemory = async (req, res, next) => {
  try {
    const merchantId = new mongoose.Types.ObjectId(req.params.id);
    const memory = await memoryService.storeMemory(merchantId, req.body);

    res.status(201).json({
      success: true,
      data: memory,
      message: 'Merchant memory stored successfully',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/merchants/:id/context
 * Returns current ambient external context (weather, calendar, relevance)
 */
const getMerchantContext = async (req, res, next) => {
  try {
    const merchantId = new mongoose.Types.ObjectId(req.params.id);
    const merchant = await Merchant.findById(merchantId).lean();
    if (!merchant) {
      return res.status(404).json({ success: false, message: 'Merchant not found' });
    }

    const contextData = await contextService.getMerchantContext(merchant);
    res.json({ success: true, data: contextData });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/merchants/:id/activity
 * Returns a chronological unified timeline of merchant lifecycle events:
 * - Insight detected
 * - Action proposed
 * - Merchant approved / rejected
 * - Campaign dispatched via n8n
 * - Outcome measured
 * - Memory recorded / preference learned
 */
const getMerchantActivity = async (req, res, next) => {
  try {
    const merchantId = new mongoose.Types.ObjectId(req.params.id);
    const limit = Math.min(parseInt(req.query.limit) || 30, 100);

    const [insights, actions, outcomes, memories] = await Promise.all([
      Insight.find({ merchantId }).sort({ createdAt: -1 }).limit(limit).lean(),
      Action.find({ merchantId }).sort({ createdAt: -1 }).limit(limit).lean(),
      Outcome.find({ merchantId }).sort({ measuredAt: -1 }).limit(limit).lean(),
      Memory.find({
        merchantId,
        type: { $in: ['preference', 'fact', 'past_outcome', 'pattern'] },
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
    ]);

    const events = [];

    // Map Insights
    insights.forEach((ins) => {
      events.push({
        id: `ins_${ins._id}`,
        sourceId: ins._id,
        eventType: 'INSIGHT_DETECTED',
        category: 'DETECT',
        title: `Insight Detected: ${ins.title}`,
        description: ins.explanation || (ins.evidence && ins.evidence[0]) || ins.title,
        status: ins.severity,
        timestamp: ins.createdAt,
        metadata: {
          insightType: ins.type,
          category: ins.category,
          severity: ins.severity,
        },
        link: '/insights',
      });
    });

    // Map Actions & Executions
    actions.forEach((act) => {
      // 1. Proposed
      events.push({
        id: `act_prop_${act._id}`,
        sourceId: act._id,
        eventType: 'ACTION_PROPOSED',
        category: 'RECOMMEND',
        title: `Action Proposed: ${act.title}`,
        description: act.description,
        status: act.approvalStatus,
        timestamp: act.createdAt,
        metadata: {
          channel: act.channel,
          type: act.type,
          approvalStatus: act.approvalStatus,
        },
        link: '/campaigns',
      });

      // 2. Approved or Rejected
      if (act.approvedAt) {
        events.push({
          id: `act_app_${act._id}`,
          sourceId: act._id,
          eventType: 'ACTION_APPROVED',
          category: 'APPROVE',
          title: `Action Approved: ${act.title}`,
          description: `Merchant approved action for ${act.channel} dispatch.`,
          status: 'APPROVED',
          timestamp: act.approvedAt,
          metadata: { channel: act.channel },
          link: '/campaigns',
        });
      } else if (act.approvalStatus === 'REJECTED') {
        events.push({
          id: `act_rej_${act._id}`,
          sourceId: act._id,
          eventType: 'ACTION_REJECTED',
          category: 'APPROVE',
          title: `Action Declined: ${act.title}`,
          description: `Merchant rejected proposal. Feedback preserved in business memory.`,
          status: 'REJECTED',
          timestamp: act.updatedAt,
          metadata: { channel: act.channel },
          link: '/campaigns',
        });
      }

      // 3. Executed / Dispatched
      if (act.executedAt || act.executionStatus === 'SUCCESS') {
        events.push({
          id: `act_exec_${act._id}`,
          sourceId: act._id,
          eventType: 'CAMPAIGN_DISPATCHED',
          category: 'ACT',
          title: `Campaign Dispatched: ${act.title}`,
          description: `Executed via n8n automation (${act.channel}). Audience: ${act.targetAudience}`,
          status: act.executionStatus,
          timestamp: act.executedAt || act.updatedAt,
          metadata: {
            channel: act.channel,
            executionId: act.n8nExecutionId,
            status: act.executionStatus,
          },
          link: '/campaigns',
        });
      }
    });

    // Map Outcomes
    outcomes.forEach((out) => {
      events.push({
        id: `out_${out._id}`,
        sourceId: out._id,
        eventType: 'OUTCOME_MEASURED',
        category: 'MEASURE',
        title: `Outcome Measured: ${out.changePercentage >= 0 ? '+' : ''}${out.changePercentage}% ${out.metric}`,
        description: out.interpretation,
        status: out.status,
        timestamp: out.measuredAt || out.createdAt,
        metadata: {
          metric: out.metric,
          changePercentage: out.changePercentage,
          baselineValue: out.baselineValue,
          postActionValue: out.postActionValue,
          dataConfidence: out.dataConfidence,
        },
        link: '/performance',
      });
    });

    // Map Memories
    memories.forEach((mem) => {
      events.push({
        id: `mem_${mem._id}`,
        sourceId: mem._id,
        eventType: 'MEMORY_RECORDED',
        category: 'LEARN',
        title: `Business Memory Stored: ${mem.key}`,
        description: mem.content,
        status: mem.type.toUpperCase(),
        timestamp: mem.createdAt,
        metadata: {
          type: mem.type,
          tags: mem.tags,
          source: mem.source,
        },
        link: '/performance',
      });
    });

    // Sort chronologically descending
    events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      success: true,
      data: events.slice(0, limit),
      count: Math.min(events.length, limit),
      totalCount: events.length,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
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
};