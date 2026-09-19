const mongoose = require('mongoose');

/**
 * DailyBrief Model
 * Persists the generated morning business brief per merchant per day.
 * Prevents unnecessary regeneration while supporting force refresh.
 */
const dailyBriefSchema = new mongoose.Schema(
  {
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Merchant',
      required: true,
      index: true,
    },
    briefDate: {
      type: String, // Format: YYYY-MM-DD
      required: true,
      index: true,
    },
    greeting: {
      type: String,
      default: 'Good morning!',
    },
    dateFormatted: {
      type: String,
      default: '',
    },
    yesterdayPerformance: {
      revenue: { type: Number, default: 0 },
      netSales: { type: Number, default: 0 },
      transactions: { type: Number, default: 0 },
      aov: { type: Number, default: 0 },
      revenueChange: { type: Number, default: 0 },
      refunds: {
        count: { type: Number, default: 0 },
        total: { type: Number, default: 0 },
      },
    },
    topProduct: {
      type: String,
      default: '',
    },
    weakestProduct: {
      type: String,
      default: '',
    },
    newCustomers: {
      type: Number,
      default: 0,
    },
    repeatCustomers: {
      type: Number,
      default: 0,
    },
    whatChanged: [
      {
        type: String,
      },
    ],
    whatMatters: {
      type: String,
      default: '',
    },
    whatNeedsAttention: {
      type: String,
      default: '',
    },
    topOpportunity: {
      type: String,
      default: '',
    },
    opportunity: {
      type: String,
      default: '',
    },
    externalContextNote: {
      type: String,
      default: '',
    },
    recommendedAction: {
      type: String,
      default: '',
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

dailyBriefSchema.index({ merchantId: 1, briefDate: 1 }, { unique: true });

module.exports = mongoose.model('DailyBrief', dailyBriefSchema);
