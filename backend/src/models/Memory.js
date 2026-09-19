const mongoose = require('mongoose');

/**
 * Memory Model
 * Merchant Business Memory layer (Cognee representation in MongoDB).
 * Stores persistent context, patterns, merchant preferences, past recommendations,
 * and outcomes so recommendations remain personalized over time.
 */
const memorySchema = new mongoose.Schema(
  {
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Merchant',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['profile', 'pattern', 'past_recommendation', 'past_outcome', 'preference', 'fact'],
      required: true,
    },
    key: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    tags: [
      {
        type: String,
      },
    ],
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    confidence: {
      type: Number,
      default: 1.0,
      min: 0,
      max: 1.0,
    },
    source: {
      type: String,
      enum: ['seed', 'system_observed', 'merchant_feedback', 'cognee'],
      default: 'seed',
    },
  },
  {
    timestamps: true,
  }
);

memorySchema.index({ merchantId: 1, type: 1 });
memorySchema.index({ merchantId: 1, tags: 1 });

module.exports = mongoose.model('Memory', memorySchema);