const mongoose = require('mongoose');

/**
 * Transaction Model
 * Core financial record for each merchant payment/sale.
 * Indexed on merchantId + timestamp for efficient time-series analytics.
 * items array supports multi-item transactions (cafes, kirana stores).
 */
const transactionItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, default: 'uncategorized' },
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
  },
  { _id: false }
);

const transactionSchema = new mongoose.Schema(
  {
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Merchant',
      required: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['completed', 'pending', 'failed', 'refunded'],
      default: 'completed',
    },
    paymentMethod: {
      type: String,
      enum: ['upi', 'card', 'cash', 'netbanking', 'wallet'],
      default: 'upi',
    },
    items: [transactionItemSchema],
    // Primary category for quick filtering (derived from items)
    category: {
      type: String,
      default: 'uncategorized',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for all time-series analytics queries
transactionSchema.index({ merchantId: 1, timestamp: -1 });
transactionSchema.index({ merchantId: 1, category: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);