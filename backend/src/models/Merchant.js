const mongoose = require('mongoose');

/**
 * Merchant Model
 * Primary profile for each business using GrowKaro.
 * preferences is kept as a flexible object so Phase 2 (Cognee/AI) can
 * populate it with learned merchant patterns without schema changes.
 */
const merchantSchema = new mongoose.Schema(
  {
    businessName: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true,
    },
    businessType: {
      type: String,
      required: [true, 'Business type is required'],
      enum: ['cafe', 'kirana', 'salon', 'restaurant', 'retail', 'pharmacy', 'other'],
    },
    location: {
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      country: { type: String, default: 'India' },
    },
    currency: {
      type: String,
      default: 'INR',
    },
    ownerName: {
      type: String,
      default: '',
    },
    contactEmail: {
      type: String,
      default: '',
    },
    /**
     * preferences: kept flexible for Phase 2 AI memory integration.
     * Phase 1 populates with basic category/product preferences.
     * Phase 2 (Cognee) will enrich with learned patterns.
     */
    preferences: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Merchant', merchantSchema);