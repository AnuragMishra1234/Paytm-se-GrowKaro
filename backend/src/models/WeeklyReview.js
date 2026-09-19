const mongoose = require('mongoose');

/**
 * WeeklyReview Model
 * Persists the scheduled weekly strategic business intelligence report per merchant.
 * Generated automatically every Monday or on demand.
 */
const weeklyReviewSchema = new mongoose.Schema(
  {
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Merchant',
      required: true,
      index: true,
    },
    weekStart: {
      type: Date,
      required: true,
    },
    weekEnd: {
      type: Date,
      required: true,
    },
    reviewTitle: {
      type: String,
      default: 'Weekly Business Review',
    },
    weekLabel: {
      type: String,
      default: 'Weekly Business Review',
    },
    kpis: {
      revenue: { type: Number, default: 0 },
      revenueChange: { type: Number, default: 0 },
      transactions: { type: Number, default: 0 },
      transactionsChange: { type: Number, default: 0 },
      aov: { type: Number, default: 0 },
      aovChange: { type: Number, default: 0 },
      newCustomers: { type: Number, default: 0 },
      repeatCustomers: { type: Number, default: 0 },
      repeatRate: { type: Number, default: 0 },
    },
    mainIssue: {
      type: String,
      default: '',
    },
    topProducts: [
      {
        name: { type: String, required: true },
        revenue: { type: Number, default: 0 },
        units: { type: Number, default: 0 },
        change: { type: Number, default: 0 },
      },
    ],
    decliningProducts: [
      {
        name: { type: String, required: true },
        revenue: { type: Number, default: 0 },
        units: { type: Number, default: 0 },
        change: { type: Number, default: 0 },
      },
    ],
    peakHours: {
      type: String,
      default: '',
    },
    weakHours: {
      type: String,
      default: '',
    },
    inactiveCustomersCount: {
      type: Number,
      default: 0,
    },
    customerOpportunities: [
      {
        name: { type: String, default: '' },
        rationale: { type: String, default: '' },
        suggestedOffer: { type: String, default: '' },
      },
    ],
    externalContextSummary: {
      type: String,
      default: '',
    },
    recommendedActions: [
      {
        priority: { type: Number, default: 1 },
        title: { type: String, required: true },
        details: { type: String, default: '' },
        actionType: { type: String, default: 'CAMPAIGN' },
      },
    ],
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

weeklyReviewSchema.index({ merchantId: 1, weekStart: -1 });

module.exports = mongoose.model('WeeklyReview', weeklyReviewSchema);
