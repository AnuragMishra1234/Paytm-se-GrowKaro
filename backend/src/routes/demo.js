const express = require('express');
const router = express.Router();
const { resetDemoData } = require('../../scripts/resetDemo');
const Merchant = require('../models/Merchant');
const Action = require('../models/Action');
const Campaign = require('../models/Campaign');
const Notification = require('../models/Notification');
const Outcome = require('../models/Outcome');
const n8nService = require('../services/n8nService');

/**
 * POST /api/demo/reset
 * Explicit demo reset endpoint triggered from developer panel
 */
router.post('/reset', async (req, res, next) => {
  try {
    const result = await resetDemoData();
    res.json({
      success: true,
      data: result,
      message: 'Demo environment reset to pristine presentation baseline successfully.',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/demo/status
 * Check demo configuration, mode, and active counts
 */
router.get('/status', async (req, res, next) => {
  try {
    const cafe = await Merchant.findOne({ businessName: /Cafe Aroma/i });
    if (!cafe) {
      return res.status(404).json({ success: false, message: 'Cafe Aroma not found' });
    }

    const [pendingActions, activeCampaigns, unreadNotifs, outcomesCount] = await Promise.all([
      Action.countDocuments({ merchantId: cafe._id, approvalStatus: 'PENDING' }),
      Campaign.countDocuments({ merchantId: cafe._id }),
      Notification.countDocuments({ merchantId: cafe._id, read: false }),
      Outcome.countDocuments({ merchantId: cafe._id }),
    ]);

    const n8nStatus = n8nService.getN8nStatus();

    res.json({
      success: true,
      data: {
        isDemoMode: process.env.DEMO_MODE === 'true' || n8nStatus.mode === 'demo',
        n8nMode: n8nStatus.mode,
        n8nLabel: n8nStatus.label,
        merchant: {
          id: cafe._id,
          name: cafe.businessName,
          city: cafe.location?.city,
        },
        counts: {
          pendingActions,
          activeCampaigns,
          unreadNotifications: unreadNotifs,
          measuredOutcomes: outcomesCount,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
