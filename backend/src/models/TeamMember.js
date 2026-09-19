const mongoose = require('mongoose');

/**
 * TeamMember Model
 * Represents a merchant's employee or collaborator in GrowKaro.
 *
 * Supported Roles:
 * - OWNER: Full administrative, strategic, and financial visibility
 * - MANAGER: Daily operational management, action approval, and task oversight
 * - MARKETING: Campaign draft creative, customer copy prep, and campaign outcome review
 * - STAFF: Store-floor operations, prep, inventory readiness (no financial data)
 */
const teamMemberSchema = new mongoose.Schema(
  {
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Merchant',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    role: {
      type: String,
      enum: ['OWNER', 'MANAGER', 'MARKETING', 'STAFF'],
      default: 'STAFF',
      index: true,
    },
    status: {
      type: String,
      enum: ['INVITED', 'ACTIVE', 'SUSPENDED', 'REMOVED'],
      default: 'ACTIVE',
      index: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    permissions: [
      {
        type: String,
      },
    ],
    notificationPreferences: {
      inApp: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique email per merchant
teamMemberSchema.index({ merchantId: 1, email: 1 }, { unique: true });
teamMemberSchema.index({ merchantId: 1, role: 1 });

module.exports = mongoose.model('TeamMember', teamMemberSchema);
