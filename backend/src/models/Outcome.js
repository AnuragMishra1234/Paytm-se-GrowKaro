const mongoose = require('mongoose');

/**
 * Outcome Model
 * Represents the measured business impact following an approved and executed Action/Campaign.
 * Adheres strictly to non-causal attribution guidelines ("Observed change", "Sales increased after the campaign").
 */
const outcomeSchema = new mongoose.Schema(
  {
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Merchant',
      required: true,
      index: true,
    },
    actionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Action',
      required: true,
      index: true,
    },
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      index: true,
      default: null,
    },
    metric: {
      type: String,
      enum: ['REVENUE', 'TRANSACTIONS', 'AOV', 'PRODUCT_UNITS'],
      default: 'REVENUE',
      required: true,
    },
    baselinePeriod: {
      start: { type: Date },
      end: { type: Date },
      label: { type: String, default: 'Pre-campaign baseline' },
    },
    postActionPeriod: {
      start: { type: Date },
      end: { type: Date },
      label: { type: String, default: 'Post-campaign observed window' },
    },
    baselineValue: {
      type: Number,
      required: true,
    },
    postActionValue: {
      type: Number,
      required: true,
    },
    changeValue: {
      type: Number,
      required: true,
    },
    changePercentage: {
      type: Number,
      required: true,
    },
    measurementWindow: {
      type: String,
      default: '3-day post-campaign window vs 3-day baseline',
    },
    status: {
      type: String,
      enum: ['PENDING_MEASUREMENT', 'MEASURED', 'INSUFFICIENT_DATA', 'FAILED'],
      default: 'MEASURED',
      index: true,
    },
    dataConfidence: {
      type: String,
      enum: ['HIGH', 'SUFFICIENT', 'LOW', 'INSUFFICIENT'],
      default: 'SUFFICIENT',
    },
    interpretation: {
      type: String,
      required: true,
    },
    evidence: [
      {
        type: String,
      },
    ],
    learningStored: {
      type: Boolean,
      default: false,
    },
    measuredAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

outcomeSchema.index({ merchantId: 1, measuredAt: -1 });

module.exports = mongoose.model('Outcome', outcomeSchema);
