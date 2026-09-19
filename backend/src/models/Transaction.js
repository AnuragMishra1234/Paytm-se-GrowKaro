const mongoose = require('mongoose');

/**
 * Transaction Model
 * Core financial record for each merchant payment/sale.
 * Indexed on merchantId + timestamp for efficient time-series analytics.
 * items array supports multi-item transactions (cafes, kirana stores).
 */
const transactionItemSchema = new mongoose.Schema(
  {
    productId: { type: String, default: null },
    name: { type: String, required: true },
    productName: { type: String, default: null },
    category: { type: String, default: 'uncategorized' },
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number, required: true },
    unitCost: { type: Number, default: null }, // Optional product unit cost (COGS tracking)
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
    transactionType: {
      type: String,
      enum: ['SALE', 'REFUND'],
      default: 'SALE',
      index: true,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    cost: {
      type: Number,
      default: null, // Total COGS for transaction if cost data available
    },
    isLiveSimulated: {
      type: Boolean,
      default: false,
      index: true,
    },
    billNumber: {
      type: String,
      default: null,
      index: true,
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
    // Data Source & Order-Payment Linking Architecture
    sourceProvider: {
      type: String,
      enum: ['PAYTM', 'MERCHANT_POS', 'BILLING_SOFTWARE', 'ECOMMERCE', 'CSV', 'MANUAL_IMPORT', 'LIVE_SIMULATION', 'MANUAL_ENTRY'],
      default: 'PAYTM',
      index: true,
    },
    sourceType: {
      type: String,
      enum: ['PAYMENT', 'ORDER', 'UNIFIED_LINKED', 'IMPORTED_DATASET'],
      default: 'UNIFIED_LINKED',
      index: true,
    },
    externalOrderId: {
      type: String,
      default: null,
      index: true,
    },
    externalTransactionId: {
      type: String,
      default: null,
      index: true,
    },
    dataConfidence: {
      type: String,
      enum: ['HIGH', 'MEDIUM', 'LOW'],
      default: 'HIGH',
      index: true,
    },
    productInfoStatus: {
      type: String,
      enum: ['AVAILABLE', 'PARTIAL', 'UNKNOWN_UNAVAILABLE'],
      default: 'AVAILABLE',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for all time-series analytics queries
transactionSchema.index({ merchantId: 1, timestamp: -1 });
transactionSchema.index({ merchantId: 1, category: 1 });
transactionSchema.index({ merchantId: 1, externalOrderId: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);