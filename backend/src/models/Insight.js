const mongoose = require('mongoose');

/**
 * Insight Model
 * Represents a proactive business insight detected deterministically
 * and enriched with AI explanations & recommendations.
 *
 * Categories:
 * - ACT_NOW: Urgent issues requiring immediate merchant intervention
 * - OPPORTUNITY: High-leverage potential growth windows
 * - WARNING: Emerging business risks or declining trends
 * - POSITIVE_TREND: Notable positive developments to sustain
 */
const insightSchema = new mongoose.Schema(
  {
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Merchant',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'SALES_DROP',
        'SALES_SPIKE',
        'WEAK_HOURS',
        'STRONG_HOURS',
        'PRODUCT_GROWTH',
        'PRODUCT_DECLINE',
        'CUSTOMER_INACTIVITY',
        'CUSTOMER_CHURN_RISK',
        'LOYAL_CUSTOMER_OPPORTUNITY',
        'REPEAT_CUSTOMER_OPP',
        'LOW_REPEAT_RATE',
        'WEAK_TIME_PERIOD',
        'STRONG_TIME_PERIOD',
        'UNUSUAL_TRANSACTION_PATTERN',
        'CAMPAIGN_RESULT',
        'INVENTORY_WARNING',
        'EXTERNAL_CONTEXT',
        'EXTERNAL_CONTEXT_OPPORTUNITY',
      ],
    },
    severity: {
      type: String,
      enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
      default: 'MEDIUM',
    },
    category: {
      type: String,
      enum: ['ACT_NOW', 'OPPORTUNITY', 'WARNING', 'POSITIVE_TREND', 'CONTEXT'],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    whatHappened: {
      type: String,
      default: '',
    },
    whyItMatters: {
      type: String,
      default: '',
    },
    whatToDo: {
      type: String,
      default: '',
    },
    recommendedAction: {
      type: String,
      default: '',
    },
    comparisonPeriod: {
      type: String,
      default: 'vs. baseline',
    },
    confidence: {
      type: String,
      enum: ['HIGH', 'MEDIUM', 'LOW'],
      default: 'HIGH',
      index: true,
    },
    dataSource: {
      type: String,
      default: 'PAYTM_LINKED_POS',
    },
    metric: {
      type: String,
      required: true,
    },
    currentValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    baselineValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    changePercentage: {
      type: Number,
      default: null,
    },
    evidence: [
      {
        type: String,
      },
    ],
    explanation: {
      type: String,
      default: '',
    },
    recommendation: {
      situation: { type: String, default: '' },
      evidence: { type: String, default: '' },
      explanation: { type: String, default: '' },
      action: { type: String, default: '' },
      goal: { type: String, default: '' },
      suggestedAction: {
        type: { type: String, default: 'CAMPAIGN_DRAFT' },
        title: { type: String, default: '' },
        details: { type: String, default: '' },
        targetAudience: { type: String, default: '' },
        timing: { type: String, default: '' },
        expectedImpact: { type: String, default: '' },
        isExecutable: { type: Boolean, default: false }, // Phase 3 will activate execution
      },
    },
    externalContext: {
      type: { type: String, default: null }, // e.g., 'WEATHER', 'CALENDAR'
      summary: { type: String, default: '' },
      relevance: { type: String, default: 'LOW' }, // 'HIGH', 'MEDIUM', 'LOW'
    },
    priorityScore: {
      type: Number,
      default: 50,
      index: true,
    },
    status: {
      type: String,
      enum: ['NEW', 'VIEWED', 'DISMISSED', 'RESOLVED'],
      default: 'NEW',
    },
  },
  {
    timestamps: true,
  }
);

insightSchema.index({ merchantId: 1, priorityScore: -1 });
insightSchema.index({ merchantId: 1, category: 1 });
insightSchema.index({ merchantId: 1, confidence: 1 });

module.exports = mongoose.model('Insight', insightSchema);