const mongoose = require('mongoose');

/**
 * Customer Model
 * Represents a customer belonging to a merchant.
 *
 * Segment definitions (deterministic, Phase 1):
 *   new       - exactly 1 transaction
 *   repeat    - 2 or more transactions
 *   vip       - repeat AND totalSpend > 5000
 *   inactive  - lastTransactionAt is more than 30 days ago
 *
 * Phase 2 may enhance segmentation using AI/Cognee, but the above
 * deterministic definitions remain the source of truth unless overridden.
 */
const customerSchema = new mongoose.Schema(
  {
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Merchant',
      required: true,
      index: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      default: '',
    },
    totalTransactions: {
      type: Number,
      default: 0,
    },
    totalSpend: {
      type: Number,
      default: 0,
    },
    lastTransactionAt: {
      type: Date,
      default: null,
    },
    firstTransactionAt: {
      type: Date,
      default: null,
    },
    /**
     * customerSegment: deterministically assigned.
     * new | repeat | vip | inactive
     */
    customerSegment: {
      type: String,
      enum: ['new', 'repeat', 'vip', 'inactive'],
      default: 'new',
    },
    averageOrderValue: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Utility static to compute segment from customer data
customerSchema.statics.computeSegment = function (customer, inactiveDays = 30) {
  const daysSinceLast = customer.lastTransactionAt
    ? (Date.now() - new Date(customer.lastTransactionAt).getTime()) / (1000 * 60 * 60 * 24)
    : Infinity;

  if (daysSinceLast > inactiveDays && customer.totalTransactions > 0) return 'inactive';
  if (customer.totalTransactions >= 2 && customer.totalSpend > 5000) return 'vip';
  if (customer.totalTransactions >= 2) return 'repeat';
  return 'new';
};

module.exports = mongoose.model('Customer', customerSchema);