const growthDetectorService = require('./growthDetectorService');
const memoryService = require('./memoryService');
const aiService = require('./aiService');
const Insight = require('../models/Insight');

/**
 * recommendationService.js — Recommendation Engine & Prioritization Pipeline
 *
 * Implements:
 *   Raw Detection
 *     + Relevant Cognee Memory
 *     + Ambient External Context
 *     -> Groq Explanation & Recommendation
 *     -> Deterministic Priority Scoring
 *     -> MongoDB Persistence & Feed Organization
 */

/**
 * Calculate deterministic priority score
 */
const calculatePriorityScore = (insight, memoryFacts = []) => {
  let score = 50;

  // Severity Weight
  if (insight.severity === 'CRITICAL') score += 35;
  else if (insight.severity === 'HIGH') score += 25;
  else if (insight.severity === 'MEDIUM') score += 10;
  else if (insight.severity === 'LOW') score += 0;

  // Category Weight
  if (insight.category === 'ACT_NOW') score += 15;
  else if (insight.category === 'OPPORTUNITY') score += 12;
  else if (insight.category === 'WARNING') score += 8;
  else if (insight.category === 'POSITIVE_TREND') score += 5;

  // High Impact Magnitude
  if (insight.changePercentage && Math.abs(insight.changePercentage) >= 20) {
    score += 8;
  }

  // Memory reinforcement: if past outcome is relevant, increase confidence/priority
  const hasPastOutcome = memoryFacts.some((m) => m.type === 'past_outcome');
  if (hasPastOutcome) score += 7;

  return Math.min(100, Math.max(10, score));
};

/**
 * Run full proactive insight pipeline for a merchant
 * Detects events -> Gathers Memory -> Generates AI Advice -> Saves to DB
 */
const generateAndPersistInsights = async (merchantId) => {
  // Ensure default memories exist for demo merchants
  const { merchant, rawInsights, dashboardData, contextData } = await growthDetectorService.runAllDetectors(merchantId);
  await memoryService.seedMerchantMemories(merchantId, merchant.businessType);

  // Process all raw insights concurrently in parallel
  const enrichedInsights = await Promise.all(
    rawInsights.map(async (raw) => {
      const memoryFacts = await memoryService.getRelevantMemoryContext(merchantId, `${raw.type} ${raw.title}`);
      const priorityScore = calculatePriorityScore(raw, memoryFacts);

      // Call AI service for explanation and grounded recommendation (with strict timeout)
      const aiResult = await aiService.explainAndRecommend(raw, memoryFacts, contextData, merchant);

      const insightDoc = {
        merchantId,
        type: raw.type,
        severity: raw.severity || 'MEDIUM',
        category: raw.category,
        title: raw.title,
        metric: raw.metric,
        currentValue: raw.currentValue,
        baselineValue: raw.baselineValue,
        changePercentage: raw.changePercentage,
        evidence: raw.evidence || [],
        explanation: aiResult.explanation,
        recommendation: aiResult.recommendation,
        externalContext: raw.externalContext || null,
        priorityScore,
        status: 'NEW',
      };

      // Upsert into MongoDB to prevent duplicate cards on refresh
      return await Insight.findOneAndUpdate(
        { merchantId, type: raw.type, title: raw.title },
        insightDoc,
        { upsert: true, new: true }
      );
    })
  );

  // Sort by priorityScore descending
  enrichedInsights.sort((a, b) => b.priorityScore - a.priorityScore);
  return enrichedInsights;
};

/**
 * Get active insights for merchant with optional category filtering
 */
const getInsights = async (merchantId, category = null) => {
  // First check if insights exist in DB
  let query = { merchantId, status: { $ne: 'DISMISSED' } };
  if (category && category !== 'ALL') {
    query.category = category.toUpperCase();
  }

  let insights = await Insight.find(query).sort({ priorityScore: -1 }).lean();

  // If no insights exist yet (e.g. first run), trigger generator
  if (insights.length === 0) {
    insights = await generateAndPersistInsights(merchantId);
    if (category && category !== 'ALL') {
      insights = insights.filter((i) => i.category === category.toUpperCase());
    }
  }

  return insights;
};

/**
 * Get single insight detail
 */
const getInsightById = async (merchantId, insightId) => {
  return await Insight.findOne({ _id: insightId, merchantId }).lean();
};

/**
 * Dismiss an insight
 */
const dismissInsight = async (merchantId, insightId) => {
  return await Insight.findOneAndUpdate(
    { _id: insightId, merchantId },
    { status: 'DISMISSED' },
    { new: true }
  );
};

/**
 * Get formatted recommendation list for recommendations screen
 */
const getRecommendations = async (merchantId) => {
  const insights = await getInsights(merchantId);
  return insights
    .filter((i) => i.recommendation && i.recommendation.action)
    .map((i) => ({
      id: i._id,
      title: i.title,
      category: i.category,
      severity: i.severity,
      priorityScore: i.priorityScore,
      recommendation: i.recommendation,
      evidence: i.evidence,
      createdAt: i.createdAt,
    }));
};

module.exports = {
  generateAndPersistInsights,
  getInsights,
  getInsightById,
  dismissInsight,
  getRecommendations,
  calculatePriorityScore,
};