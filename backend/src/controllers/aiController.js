const mongoose = require('mongoose');
const Merchant = require('../models/Merchant');
const DailyBrief = require('../models/DailyBrief');
const analyticsService = require('../services/analyticsService');
const memoryService = require('../services/memoryService');
const contextService = require('../services/contextService');
const aiService = require('../services/aiService');
const recommendationService = require('../services/recommendationService');

/**
 * POST /api/ai/chat
 * Merchant Copilot interactive reasoning
 */
const handleChat = async (req, res, next) => {
  try {
    const { merchantId, message, conversationHistory = [] } = req.body;

    if (!merchantId || !mongoose.Types.ObjectId.isValid(merchantId)) {
      return res.status(400).json({ success: false, message: 'Valid merchantId is required' });
    }
    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({ success: false, message: 'Message text is required' });
    }

    const merchant = await Merchant.findById(merchantId).lean();
    if (!merchant) {
      return res.status(404).json({ success: false, message: 'Merchant not found' });
    }

    // 1. Gather factual analytics context
    const [dashboardData, products, contextData] = await Promise.all([
      analyticsService.getDashboardData(merchant._id, 30),
      analyticsService.getProductPerformance(merchant._id),
      contextService.getMerchantContext(merchant),
    ]);

    // 2. Gather relevant memory
    const memoryFacts = await memoryService.getRelevantMemoryContext(merchant._id, message);

    const analyticsFacts = {
      kpis: dashboardData.kpis,
      hourlySales: dashboardData.hourlySales,
      weekdaySales: dashboardData.weekdaySales,
      products,
    };

    // 3. Ask Groq reasoning engine
    const aiResponse = await aiService.chatCopilot(
      merchant,
      message,
      conversationHistory,
      analyticsFacts,
      memoryFacts,
      contextData
    );

    res.json({
      success: true,
      data: {
        ...aiResponse,
        merchantId: merchant._id,
        contextSnapshot: {
          city: merchant.location?.city,
          weather: contextData.weather?.condition,
          repeatRate: dashboardData.kpis?.repeatCustomerPct,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/ai/analyze/:merchantId
 * On-demand full business diagnosis and proactive insight generation
 */
const triggerAnalysis = async (req, res, next) => {
  try {
    const merchantId = new mongoose.Types.ObjectId(req.params.merchantId);
    const insights = await recommendationService.generateAndPersistInsights(merchantId);

    res.json({
      success: true,
      data: insights,
      count: insights.length,
      message: 'Proactive detection and AI reasoning analysis complete',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/ai/brief/:merchantId
 * Generate or fetch daily executive business summary
 */
const getDailyBrief = async (req, res, next) => {
  try {
    const merchantId = new mongoose.Types.ObjectId(req.params.merchantId);
    const { forceRefresh } = req.query;
    const todayDateStr = new Date().toISOString().split('T')[0];

    const merchant = await Merchant.findById(merchantId).lean();
    if (!merchant) {
      return res.status(404).json({ success: false, message: 'Merchant not found' });
    }

    // Check if cached brief exists for today
    if (forceRefresh !== 'true') {
      const cached = await DailyBrief.findOne({ merchantId, briefDate: todayDateStr }).lean();
      if (cached) {
        return res.json({
          success: true,
          data: {
            greeting: cached.greeting,
            date: cached.dateFormatted,
            yesterdayPerformance: cached.yesterdayPerformance,
            whatMatters: cached.whatMatters,
            topOpportunity: cached.topOpportunity,
            externalContextNote: cached.externalContextNote,
            recommendedAction: cached.recommendedAction,
            isCached: true,
          },
        });
      }
    }

    const [kpis, insights, contextData, memories] = await Promise.all([
      analyticsService.getDashboardKPIs(merchantId),
      recommendationService.getInsights(merchantId),
      contextService.getMerchantContext(merchant),
      memoryService.getRelevantMemoryContext(merchantId, 'brief'),
    ]);

    const brief = await aiService.generateDailyBrief(
      merchant,
      kpis,
      insights.slice(0, 3),
      contextData,
      memories
    );

    // Persist to DailyBrief collection
    await DailyBrief.findOneAndUpdate(
      { merchantId, briefDate: todayDateStr },
      {
        merchantId,
        briefDate: todayDateStr,
        greeting: brief.greeting,
        dateFormatted: brief.date,
        yesterdayPerformance: brief.yesterdayPerformance,
        whatMatters: brief.whatMatters,
        topOpportunity: brief.topOpportunity,
        externalContextNote: brief.externalContextNote,
        recommendedAction: brief.recommendedAction,
        generatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      data: {
        ...brief,
        isCached: false,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  handleChat,
  triggerAnalysis,
  getDailyBrief,
};