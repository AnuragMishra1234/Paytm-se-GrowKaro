const mongoose = require('mongoose');
const outcomeService = require('../services/outcomeService');
const n8nService = require('../services/n8nService');

/**
 * POST /api/actions/:actionId/measure
 * Measure the business outcome of an executed action
 */
const measureAction = async (req, res, next) => {
  try {
    const { actionId } = req.params;
    const { merchantId } = req.body;

    if (!merchantId) {
      return res.status(400).json({ success: false, message: 'merchantId is required in body' });
    }

    const outcome = await outcomeService.measureActionOutcome(merchantId, actionId);
    res.status(201).json({
      success: true,
      data: outcome,
      message: 'Outcome measured successfully and stored in merchant business memory.',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/merchants/:id/outcomes
 * List all measured outcomes for a merchant
 */
const getOutcomes = async (req, res, next) => {
  try {
    const merchantId = req.params.id;
    const outcomes = await outcomeService.getMerchantOutcomes(merchantId);
    res.json({
      success: true,
      data: outcomes,
      count: outcomes.length,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/merchants/:id/learned
 * Get full learned summary: outcomes, recorded merchant preferences, active patterns
 */
const getLearnedSummary = async (req, res, next) => {
  try {
    const merchantId = req.params.id;
    const summary = await outcomeService.getLearnedSummary(merchantId);
    res.json({
      success: true,
      data: summary,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/n8n/status
 * Get n8n workflow connection status (real vs simulation)
 */
const getN8nStatus = (req, res) => {
  const status = n8nService.getN8nStatus();
  res.json({
    success: true,
    data: status,
  });
};

/**
 * GET /api/actions/:actionId/outcome
 * Retrieve the measured outcome for a specific action
 */
const getActionOutcome = async (req, res, next) => {
  try {
    const { actionId } = req.params;
    const Outcome = require('../models/Outcome');
    const outcome = await Outcome.findOne({ actionId }).sort({ measuredAt: -1 }).lean();
    if (!outcome) {
      return res.status(404).json({ success: false, message: 'Outcome not found for this action' });
    }
    res.json({ success: true, data: outcome });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  measureAction,
  getOutcomes,
  getLearnedSummary,
  getN8nStatus,
  getActionOutcome,
};
