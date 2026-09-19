const mongoose = require('mongoose');

/**
 * CustomerOffer Model
 * Represents a personalized, 1-to-1 merchant offer created strictly for an individual customer.
 * Used for WIN_BACK retention, VIP appreciation, or personalized re-engagement.
 *
 * Strict targeting guarantee:
 * An offer is tied to exactly one customer (customerId) and cannot be broadcast to groups.
 */
const customerOfferSchema = new mongoose.Schema(
  {
    offerId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Merchant',
      required: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    targetContact: {
      phone: { type: String, default: '' },
      telegramChatId: { type: String, default: '' },
      email: { type: String, default: '' },
    },
    offerType: {
      type: String,
      enum: ['WIN_BACK', 'VIP_TREAT', 'LOYALTY_REWARD'],
      default: 'WIN_BACK',
      required: true,
    },
    discountAmount: {
      type: Number,
      required: true,
      min: 10,
      max: 1000,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    trigger: {
      daysSinceLastPurchase: { type: Number, required: true },
      averageVisitGapDays: { type: Number, required: true },
      totalVisits: { type: Number, required: true },
      totalSpent: { type: Number, required: true },
      favoriteProduct: { type: String, default: '' },
      favoriteCategory: { type: String, default: '' },
      churnRisk: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'], default: 'HIGH' },
    },
    status: {
      type: String,
      enum: [
        'DRAFT',
        'PENDING_APPROVAL',
        'APPROVED',
        'SENDING',
        'SENT',
        'REDEEMED',
        'EXPIRED',
        'REJECTED',
        'FAILED',
      ],
      default: 'PENDING_APPROVAL',
      index: true,
    },
    channel: {
      type: String,
      enum: ['TELEGRAM', 'SMS', 'EMAIL', 'DEMO'],
      default: 'TELEGRAM',
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    sentAt: {
      type: Date,
      default: null,
    },
    redeemedAt: {
      type: Date,
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    execution: {
      mode: { type: String, enum: ['real', 'demo'], default: 'demo' },
      executionId: { type: String, default: '' },
      telegramMessage: { type: String, default: '' },
      deliveryStatus: { type: String, default: 'PENDING' },
    },
    outcome: {
      returned: { type: Boolean, default: false },
      daysUntilReturn: { type: Number, default: 0 },
      redeemed: { type: Boolean, default: false },
      returnSpend: { type: Number, default: 0 },
      incrementalRevenue: { type: Number, default: 0 },
      measuredAt: { type: Date, default: null },
      learningRecorded: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate active offers for the same customer
customerOfferSchema.index({ customerId: 1, status: 1 });
customerOfferSchema.index({ merchantId: 1, status: 1 });

module.exports = mongoose.model('CustomerOffer', customerOfferSchema);
