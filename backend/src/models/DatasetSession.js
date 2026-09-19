const mongoose = require('mongoose');

/**
 * DatasetSession Model
 * Represents an isolated, temporary session created when a merchant or evaluator
 * uploads a real business dataset (CSV/XLSX) to test GrowKaro.
 *
 * CRITICAL ARCHITECTURAL PRINCIPLE:
 * Real uploaded data NEVER overwrites, mutates, or touches Cafe Aroma's
 * seeded demo data or production database collections.
 * Sessions expire automatically after 24 hours (TTL).
 */

const normalizedTransactionSchema = new mongoose.Schema(
  {
    transactionId: { type: String, default: null },
    amount: { type: Number, required: true },
    timestamp: { type: Date, required: true },
    customerId: { type: String, default: null },
    customerName: { type: String, default: null },
    product: { type: String, default: 'General Item' },
    category: { type: String, default: 'General' },
    status: { type: String, default: 'completed' },
    paymentMethod: { type: String, default: 'upi' },
  },
  { _id: false }
);

const datasetInsightSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    title: { type: String, required: true },
    category: { type: String, enum: ['OPPORTUNITY', 'WARNING', 'TREND', 'ACT_NOW'], default: 'OPPORTUNITY' },
    severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' },
    description: { type: String, required: true },
    metric: { type: String },
    evidence: [{ type: String }],
    recommendation: { type: String },
  },
  { _id: false }
);

const datasetCustomerProfileSchema = new mongoose.Schema(
  {
    customerId: { type: String, required: true },
    displayName: { type: String, default: '' },
    totalVisits: { type: Number, default: 0 },
    totalSpend: { type: Number, default: 0 },
    aov: { type: Number, default: 0 },
    lastVisitDate: { type: Date },
    daysSinceLastVisit: { type: Number, default: 0 },
    favoriteProduct: { type: String, default: 'None' },
    favoriteCategory: { type: String, default: 'General' },
    segmentTags: [{ type: String }],
    status: { type: String, default: 'ACTIVE' },
    opportunity: { type: String, default: null },
    personalizedOffer: {
      offerTitle: String,
      reason: String,
      discountText: String,
      productName: String,
    },
  },
  { _id: false }
);

const datasetSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Merchant',
      default: null,
      index: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    columnMapping: {
      type: Map,
      of: String,
      default: {},
    },
    qualitySummary: {
      totalRows: { type: Number, default: 0 },
      validRows: { type: Number, default: 0 },
      invalidRows: { type: Number, default: 0 },
      missingCustomerIds: { type: Number, default: 0 },
      duplicateRows: { type: Number, default: 0 },
      dateRange: {
        start: { type: Date, default: null },
        end: { type: Date, default: null },
      },
      totalRevenue: { type: Number, default: 0 },
      currency: { type: String, default: 'INR' },
      errorsSample: [{ row: Number, reason: String }],
    },
    transactions: [normalizedTransactionSchema],
    analyticsSummary: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    insights: [datasetInsightSchema],
    customerProfiles: [datasetCustomerProfileSchema],
    hasCustomerIdentifiers: {
      type: Boolean,
      default: false,
    },
    hasProductData: {
      type: Boolean,
      default: true,
    },
    dataConfidence: {
      type: String,
      enum: ['HIGH', 'MEDIUM', 'LOW'],
      default: 'HIGH',
    },
    limitationDisclaimer: {
      type: String,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 86400, // MongoDB TTL: deletes 24 hours after creation
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('DatasetSession', datasetSessionSchema);
