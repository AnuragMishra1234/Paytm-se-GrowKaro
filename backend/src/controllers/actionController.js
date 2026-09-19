const mongoose = require('mongoose');
const actionService = require('../services/actionService');
const n8nService = require('../services/n8nService');
const Action = require('../models/Action');

/**
 * POST /api/actions
 * Create an Action Draft from an Insight Recommendation
 */
const createDraft = async (req, res, next) => {
  try {
    const { merchantId, insightId, overrides = {} } = req.body;

    if (!merchantId || !mongoose.Types.ObjectId.isValid(merchantId)) {
      return res.status(400).json({ success: false, message: 'Valid merchantId is required' });
    }
    if (!insightId || !mongoose.Types.ObjectId.isValid(insightId)) {
      return res.status(400).json({ success: false, message: 'Valid insightId is required' });
    }

    const action = await actionService.createActionDraft(merchantId, insightId, overrides);
    res.status(201).json({
      success: true,
      data: action,
      message: 'Action draft created successfully. Awaiting merchant approval.',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/actions/:actionId
 * Fetch single action detail
 */
const getAction = async (req, res, next) => {
  try {
    const { actionId } = req.params;
    const { merchantId } = req.query;

    if (!merchantId) {
      return res.status(400).json({ success: false, message: 'merchantId query parameter is required' });
    }

    const action = await actionService.getActionById(merchantId, actionId);
    if (!action) {
      return res.status(404).json({ success: false, message: 'Action not found' });
    }

    res.json({ success: true, data: action });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/actions/:actionId
 * Edit Action Draft before approval
 */
const updateDraft = async (req, res, next) => {
  try {
    const { actionId } = req.params;
    const { merchantId, ...updates } = req.body;

    if (!merchantId) {
      return res.status(400).json({ success: false, message: 'merchantId is required in body' });
    }

    const updated = await actionService.editActionDraft(merchantId, actionId, updates);
    res.json({
      success: true,
      data: updated,
      message: 'Action draft updated successfully',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/actions/:actionId/approve
 * Explicit Merchant Approval Gate -> Triggers Workflow Execution
 */
const approve = async (req, res, next) => {
  try {
    const { actionId } = req.params;
    let { merchantId, ...approvedPayload } = req.body;

    if (!merchantId) {
      const Action = require('../models/Action');
      const act = await Action.findById(actionId);
      if (act) merchantId = act.merchantId;
    }

    if (!merchantId) {
      return res.status(400).json({ success: false, message: 'merchantId is required' });
    }

    const executed = await actionService.approveAndExecuteAction(merchantId, actionId, approvedPayload);
    res.json({
      success: true,
      data: executed,
      message: executed.executionStatus === 'SUCCESS'
        ? 'Action approved and executed successfully'
        : 'Action approved but execution encountered an issue. See failureReason.',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/actions/:actionId/reject
 * Merchant Rejection
 */
const reject = async (req, res, next) => {
  try {
    const { actionId } = req.params;
    let { merchantId, reason } = req.body;

    if (!merchantId) {
      const Action = require('../models/Action');
      const act = await Action.findById(actionId);
      if (act) merchantId = act.merchantId;
    }

    if (!merchantId) {
      return res.status(400).json({ success: false, message: 'merchantId is required' });
    }

    const rejected = await actionService.rejectAction(merchantId, actionId, reason);
    res.json({
      success: true,
      data: rejected,
      message: 'Action proposal rejected. Feedback noted in merchant memory.',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/actions/:actionId/retry
 * Retry a failed action
 */
const retry = async (req, res, next) => {
  try {
    const { actionId } = req.params;
    let { merchantId } = req.body;

    if (!merchantId) {
      const Action = require('../models/Action');
      const act = await Action.findById(actionId);
      if (act) merchantId = act.merchantId;
    }

    if (!merchantId) {
      return res.status(400).json({ success: false, message: 'merchantId is required' });
    }

    const retried = await actionService.retryAction(merchantId, actionId);
    res.json({
      success: true,
      data: retried,
      message: 'Action retry initiated',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/merchants/:id/actions
 * List actions for a merchant
 */
const getMerchantActions = async (req, res, next) => {
  try {
    const merchantId = req.params.id;
    const { status } = req.query;

    const actions = await actionService.getMerchantActions(merchantId, { status });
    res.json({
      success: true,
      data: actions,
      count: actions.length,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/merchants/:id/campaigns
 * List campaigns for a merchant
 */
const getMerchantCampaigns = async (req, res, next) => {
  try {
    const merchantId = req.params.id;
    const campaigns = await actionService.getMerchantCampaigns(merchantId);
    res.json({
      success: true,
      data: campaigns,
      count: campaigns.length,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/n8n/webhook/action-status
 * Webhook status update from n8n execution callback
 */
const handleN8nWebhook = async (req, res, next) => {
  try {
    const secretHeader = req.headers['x-growkaro-secret'];
    if (!n8nService.validateWebhookSignature(secretHeader)) {
      return res.status(401).json({ success: false, message: 'Invalid webhook secret' });
    }

    const { actionId, executionId, status, message } = req.body;

    if (!actionId || !mongoose.Types.ObjectId.isValid(actionId)) {
      return res.status(400).json({ success: false, message: 'Valid actionId required' });
    }

    const action = await Action.findById(actionId);
    if (!action) {
      return res.status(404).json({ success: false, message: 'Action not found' });
    }

    if (status === 'SUCCESS') {
      action.executionStatus = 'SUCCESS';
      action.completedAt = new Date();
      action.n8nExecutionId = executionId || action.n8nExecutionId;
    } else if (status === 'FAILED') {
      action.executionStatus = 'FAILED';
      action.failureReason = message || 'n8n workflow reported failure';
    }

    action.auditLog.push({
      status: action.executionStatus,
      note: message || `n8n reported ${status}`,
      actor: 'n8n',
    });

    await action.save();

    res.json({ success: true, message: 'Status updated from n8n' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createDraft,
  getAction,
  updateDraft,
  approve,
  reject,
  retry,
  getMerchantActions,
  getMerchantCampaigns,
  handleN8nWebhook,
};