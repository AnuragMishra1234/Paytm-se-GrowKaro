const mongoose = require('mongoose');

/**
 * Action Model
 * Represents an executable business action originating from a Phase 2 recommendation.
 * Enforces a strict merchant approval gate:
 * - approvalStatus: PENDING -> APPROVED / REJECTED / CANCELLED
 * - executionStatus: NOT_STARTED -> QUEUED -> RUNNING -> SUCCESS / FAILED / CANCELLED
 */
const actionSchema = new mongoose.Schema(
  {
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Merchant',
      required: true,
      index: true,
    },
    insightId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Insight',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'CAMPAIGN_DRAFT',
        'CUSTOMER_MESSAGE',
        'PROMOTION',
        'REMINDER',
        'INVENTORY_ALERT',
        'DAILY_BRIEF',
      ],
      default: 'CAMPAIGN_DRAFT',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    targetAudience: {
      type: String,
      default: 'Repeat & nearby customers',
    },
    channel: {
      type: String,
      enum: ['WHATSAPP', 'SMS', 'NOTIFICATION', 'IN_STORE_DISPLAY'],
      default: 'WHATSAPP',
    },
    timing: {
      type: String,
      default: 'Immediate window',
    },
    payload: {
      headline: { type: String, default: '' },
      body: { type: String, default: '' },
      cta: { type: String, default: '' },
      offer: { type: String, default: '' },
      discountDetails: { type: String, default: '' },
      products: [{ type: String }],
    },
    approvalStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    executionStatus: {
      type: String,
      enum: ['NOT_STARTED', 'QUEUED', 'RUNNING', 'SUCCESS', 'FAILED', 'CANCELLED'],
      default: 'NOT_STARTED',
      index: true,
    },
    n8nExecutionId: {
      type: String,
      default: null,
    },
    n8nWorkflowId: {
      type: String,
      default: null,
    },
    scheduledAt: {
      type: Date,
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    executedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    failureReason: {
      type: String,
      default: null,
    },
    executionResult: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
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
    auditLog: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        note: { type: String, default: '' },
        actor: { type: String, default: 'merchant' }, // 'merchant', 'n8n', 'system'
      },
    ],
  },
  {
    timestamps: true,
  }
);

actionSchema.index({ merchantId: 1, approvalStatus: 1 });
actionSchema.index({ merchantId: 1, executionStatus: 1 });

module.exports = mongoose.model('Action', actionSchema);