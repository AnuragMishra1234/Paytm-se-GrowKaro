const express = require('express');
const router = express.Router();
const customerOfferService = require('../services/customerOfferService');

/**
 * POST /api/customer-offers/detect
 * Run detection scan across merchant customers and generate new opportunities
 */
router.post('/detect', async (req, res, next) => {
  try {
    const { merchantId } = req.body;
    if (!merchantId) {
      return res.status(400).json({ success: false, message: 'merchantId is required' });
    }
    const result = await customerOfferService.detectAndCreateCustomerOffers(merchantId);
    return res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/customer-offers/:offerId/approve
 * Mandatory merchant approval gate before dispatch
 */
router.post('/:offerId/approve', async (req, res, next) => {
  try {
    const { offerId } = req.params;
    const { merchantId } = req.body;
    if (!merchantId) {
      return res.status(400).json({ success: false, message: 'merchantId is required' });
    }
    const result = await customerOfferService.approveCustomerOffer(offerId, merchantId);
    return res.json({ success: true, data: result, message: 'Offer approved and dispatched' });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/customer-offers/:offerId/reject
 * Reject an offer and save merchant feedback learning
 */
router.post('/:offerId/reject', async (req, res, next) => {
  try {
    const { offerId } = req.params;
    const { merchantId, reason } = req.body;
    if (!merchantId) {
      return res.status(400).json({ success: false, message: 'merchantId is required' });
    }
    const result = await customerOfferService.rejectCustomerOffer(offerId, merchantId, reason);
    return res.json({ success: true, data: result, message: 'Offer rejected' });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/customer-offers/:offerId/edit
 * Edit offer details before approval
 */
router.post('/:offerId/edit', async (req, res, next) => {
  try {
    const { offerId } = req.params;
    const { merchantId, discountAmount, reason } = req.body;
    if (!merchantId) {
      return res.status(400).json({ success: false, message: 'merchantId is required' });
    }
    const result = await customerOfferService.editCustomerOffer(offerId, merchantId, {
      discountAmount,
      reason,
    });
    return res.json({ success: true, data: result, message: 'Offer updated' });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/customer-offers/:offerId/send
 * Dispatch an approved offer
 */
router.post('/:offerId/send', async (req, res, next) => {
  try {
    const { offerId } = req.params;
    const result = await customerOfferService.dispatchCustomerOffer(offerId);
    return res.json({ success: true, data: result, message: 'Offer dispatched' });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/customer-offers/:offerId/outcome
 * Record redemption / return outcome and save into Cognee memory
 */
router.post('/:offerId/outcome', async (req, res, next) => {
  try {
    const { offerId } = req.params;
    const { returnSpend, daysUntilReturn } = req.body;
    const result = await customerOfferService.recordCustomerOfferOutcome(offerId, {
      returnSpend: returnSpend !== undefined ? Number(returnSpend) : 420,
      daysUntilReturn: daysUntilReturn !== undefined ? Number(daysUntilReturn) : 3,
    });
    return res.json({ success: true, data: result, message: 'Outcome successfully recorded and saved to memory' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
