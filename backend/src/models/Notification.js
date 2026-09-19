const mongoose = require('mongoose');

/**
 * Notification Model
 * Manages proactive communications to the merchant across the agentic loop:
 * - Detect ➔ ACTION_REQUIRED / WARNING / OPPORTUNITY
 * - Act ➔ ACTION_APPROVED / ACTION_EXECUTING / ACTION_COMPLETED / ACTION_FAILED
 * - Measure ➔ OUTCOME_MEASURED
 * - Learn ➔ DAILY_BRIEF
 */
const notificationSchema = new mongoose.Schema(
  {
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Merchant',
      required: true,
      index: true,
    },
    recipientMemberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TeamMember',
      default: null,
      index: true,
    },
    role: {
      type: String,
      enum: ['ALL', 'OWNER', 'MANAGER', 'MARKETING', 'STAFF'],
      default: 'ALL',
      index: true,
    },
    type: {
      type: String,
      enum: [
        'INSIGHT',
        'ACTION_REQUIRED',
        'ACTION_APPROVED',
        'ACTION_REJECTED',
        'ACTION_EXECUTING',
        'ACTION_COMPLETED',
        'ACTION_FAILED',
        'OUTCOME_MEASURED',
        'OUTCOME_AVAILABLE',
        'DAILY_BRIEF',
        'WARNING',
        'OPPORTUNITY',
        'POSITIVE_TREND',
        'TASK_ASSIGNED',
        'TASK_COMPLETED',
      ],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'URGENT'],
      default: 'MEDIUM',
      index: true,
    },
    category: {
      type: String,
      enum: ['ANOMALY', 'RECOMMENDATION', 'EXECUTION', 'OUTCOME', 'BRIEF', 'SYSTEM', 'TASK'],
      default: 'RECOMMENDATION',
    },
    relatedInsightId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Insight',
      default: null,
    },
    relatedActionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Action',
      default: null,
    },
    relatedCampaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      default: null,
    },
    relatedTaskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
      index: true,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    requiresApproval: {
      type: Boolean,
      default: false,
    },
    approvalStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'NONE'],
      default: 'NONE',
    },
    actionUrl: {
      type: String,
      default: null,
    },
    idempotencyKey: {
      type: String,
      default: null,
      sparse: true,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ merchantId: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
