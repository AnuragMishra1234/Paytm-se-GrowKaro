const mongoose = require('mongoose');

/**
 * Task Model
 * Represents an operational work item assigned to a merchant's team member.
 * Automatically generated upon Action approval or manually created by Managers/Owners.
 *
 * Types:
 * - MARKETING: Copywriting, graphics, WhatsApp campaign prep
 * - OPERATIONS: Store setup, staff shift briefing, customer management
 * - INVENTORY: Ingredient prep, stock readiness (e.g. Cold Brew batching)
 * - CUSTOMER: In-store loyalty handling, direct reachout
 * - CAMPAIGN: Campaign launch validation
 * - GENERAL: General store management tasks
 */
const taskSchema = new mongoose.Schema(
  {
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Merchant',
      required: true,
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TeamMember',
      required: true,
      index: true,
    },
    assignedToRole: {
      type: String,
      enum: ['OWNER', 'MANAGER', 'MARKETING', 'STAFF'],
      required: true,
      index: true,
    },
    assignedToName: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TeamMember',
      default: null,
    },
    createdByName: {
      type: String,
      default: 'GrowKaro AI System',
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
    type: {
      type: String,
      enum: ['MARKETING', 'OPERATIONS', 'INVENTORY', 'CUSTOMER', 'CAMPAIGN', 'GENERAL'],
      default: 'GENERAL',
      index: true,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
      index: true,
    },
    status: {
      type: String,
      enum: ['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      default: 'TODO',
      index: true,
    },
    relatedActionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Action',
      default: null,
      index: true,
    },
    relatedCampaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      default: null,
    },
    dueAt: {
      type: Date,
      default: null,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    completionNote: {
      type: String,
      default: '',
    },
    auditLog: [
      {
        status: { type: String, required: true },
        actor: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        note: { type: String, default: '' },
      },
    ],
  },
  {
    timestamps: true,
  }
);

taskSchema.index({ merchantId: 1, status: 1 });
taskSchema.index({ merchantId: 1, assignedTo: 1, status: 1 });

module.exports = mongoose.model('Task', taskSchema);
