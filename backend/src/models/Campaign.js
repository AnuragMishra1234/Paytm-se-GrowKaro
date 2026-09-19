const mongoose = require('mongoose');

/**
 * Campaign Model
 * Represents an active, scheduled, or completed promotional campaign.
 * Created when an Action is drafted and updated upon merchant approval and execution.
 */
const campaignSchema = new mongoose.Schema(
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
    name: {
      type: String,
      required: true,
      trim: true,
    },
    objective: {
      type: String,
      default: 'Volume recovery and customer engagement',
    },
    channel: {
      type: String,
      enum: ['WHATSAPP', 'SMS', 'NOTIFICATION', 'IN_STORE_DISPLAY'],
      default: 'WHATSAPP',
    },
    headline: {
      type: String,
      default: '',
    },
    message: {
      type: String,
      default: '',
    },
    targetAudience: {
      type: String,
      default: 'Repeat & nearby customers',
    },
    offer: {
      type: String,
      default: '',
    },
    timing: {
      type: String,
      default: 'Immediate',
    },
    startAt: {
      type: Date,
      default: Date.now,
    },
    endAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: [
        'DRAFT',
        'PENDING_APPROVAL',
        'APPROVED',
        'SCHEDULED',
        'RUNNING',
        'COMPLETED',
        'FAILED',
        'CANCELLED',
      ],
      default: 'DRAFT',
      index: true,
    },
    approvedBy: {
      type: String,
      default: null,
    },
    n8nExecutionId: {
      type: String,
      default: null,
    },
    deliveryStats: {
      estimatedAudience: { type: Number, default: 0 },
      sentCount: { type: Number, default: 0 },
      deliveredCount: { type: Number, default: 0 },
      readCount: { type: Number, default: 0 },
      isSimulated: { type: Boolean, default: false },
    },
    isMeasured: {
      type: Boolean,
      default: false,
    },
    outcomeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Outcome',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

campaignSchema.index({ merchantId: 1, status: 1 });

module.exports = mongoose.model('Campaign', campaignSchema);