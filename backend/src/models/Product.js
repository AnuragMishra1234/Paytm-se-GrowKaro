const mongoose = require('mongoose');

/**
 * Product Model
 * Represents items/services sold by a merchant.
 * unitsSold is a running total updated during seed and incrementally.
 */
const productSchema = new mongoose.Schema(
  {
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Merchant',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: true,
      default: 'general',
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    stock: {
      type: Number,
      default: null, // null = not tracked (services)
    },
    unitsSold: {
      type: Number,
      default: 0,
    },
    revenue: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    trend: {
      // populated by analytics service; Phase 2 AI can enhance
      type: String,
      enum: ['growing', 'stable', 'declining', 'unknown'],
      default: 'unknown',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Product', productSchema);