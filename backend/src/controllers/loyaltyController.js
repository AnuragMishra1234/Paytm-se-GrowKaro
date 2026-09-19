const loyaltyService = require('../services/loyaltyService');

/**
 * loyaltyController.js
 * Exposes AI Customer Loyalty and Grounded Personalized Offer APIs.
 */

// GET /api/merchants/:id/loyalty/customers
const getLoyaltyCustomers = async (req, res, next) => {
  try {
    const merchantId = req.params.id;
    const customers = await loyaltyService.getLoyaltyCustomers(merchantId);
    res.json({
      success: true,
      data: customers,
      meta: {
        total: customers.length,
        loyalCount: customers.filter((c) => c.segmentTags.includes('LOYAL CUSTOMER')).length,
        atRiskCount: customers.filter((c) => c.segmentTags.includes('AT RISK')).length,
        highValueCount: customers.filter((c) => c.segmentTags.includes('HIGH VALUE')).length,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/merchants/:id/loyalty/customers/:customerId
const getCustomerLoyaltyDetail = async (req, res, next) => {
  try {
    const { id: merchantId, customerId } = req.params;
    const metrics = await loyaltyService.calculateCustomerMetrics(merchantId, customerId);
    res.json({
      success: true,
      data: metrics,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/merchants/:id/loyalty/opportunities
const getLoyaltyOpportunities = async (req, res, next) => {
  try {
    const merchantId = req.params.id;
    const opportunities = await loyaltyService.getPersonalizedOpportunities(merchantId);
    res.json({
      success: true,
      data: opportunities,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/merchants/:id/loyalty/offers/create
const submitPersonalizedOffer = async (req, res, next) => {
  try {
    const merchantId = req.params.id;
    const { customerId, offerTitle, message, discount, channel, memberId } = req.body;

    if (!customerId) {
      return res.status(400).json({ success: false, error: 'customerId is required' });
    }

    const action = await loyaltyService.submitOfferToManager({
      merchantId,
      customerId,
      offerTitle,
      message,
      discount,
      channel: channel || 'WHATSAPP',
      createdByMemberId: memberId,
    });

    res.status(201).json({
      success: true,
      message: 'Personalized offer submitted for manager approval',
      data: action,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/merchants/:id/loyalty/offers/:actionId/outcome
const recordOfferOutcome = async (req, res, next) => {
  try {
    const { id: merchantId, actionId } = req.params;
    const { customerReturned, returnDays, observedSpend } = req.body;

    const result = await loyaltyService.recordOfferOutcome(merchantId, actionId, {
      customerReturned: customerReturned ?? true,
      returnDays: returnDays || 2,
      observedSpend: observedSpend || 720,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getLoyaltyCustomers,
  getCustomerLoyaltyDetail,
  getLoyaltyOpportunities,
  submitPersonalizedOffer,
  recordOfferOutcome,
};
