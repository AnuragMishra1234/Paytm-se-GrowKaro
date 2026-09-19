const mongoose = require('mongoose');
const marketIntelligenceService = require('../services/marketIntelligenceService');

/**
 * GET /api/merchants/:id/market-intelligence
 * Fetches synthesized live market trends and sales pattern suggestions
 */
const getMarketIntelligence = async (req, res, next) => {
  try {
    const merchantId = new mongoose.Types.ObjectId(req.params.id);
    const data = await marketIntelligenceService.analyzeMarketAndSales(merchantId);

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/merchants/:id/market-intelligence/refresh
 * Forces re-evaluation of market signals against fresh transaction records
 */
const refreshMarketIntelligence = async (req, res, next) => {
  try {
    const merchantId = new mongoose.Types.ObjectId(req.params.id);
    const data = await marketIntelligenceService.analyzeMarketAndSales(merchantId);

    res.json({
      success: true,
      message: 'Market signals and store sales patterns refreshed successfully.',
      data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/merchants/:id/market-intelligence/adopt
 * Adopts an AI market/sales recommendation directly into the store catalog or campaigns
 */
const adoptRecommendation = async (req, res, next) => {
  try {
    const merchantId = new mongoose.Types.ObjectId(req.params.id);
    const { suggestionId } = req.body;

    if (!suggestionId) {
      return res.status(400).json({ success: false, message: 'suggestionId is required' });
    }

    const result = await marketIntelligenceService.adoptSuggestion(merchantId, suggestionId);
    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMarketIntelligence,
  refreshMarketIntelligence,
  adoptRecommendation,
};
