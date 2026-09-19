const express = require('express');
const router = express.Router();
const { validateObjectId } = require('../middleware/errorHandler');
const {
  getLoyaltyCustomers,
  getCustomerLoyaltyDetail,
  getLoyaltyOpportunities,
  submitPersonalizedOffer,
  recordOfferOutcome,
} = require('../controllers/loyaltyController');

// All loyalty endpoints are scoped to a merchant ID
// GET /api/merchants/:id/loyalty/customers
router.get('/:id/loyalty/customers', validateObjectId, getLoyaltyCustomers);

// GET /api/merchants/:id/loyalty/customers/:customerId
router.get('/:id/loyalty/customers/:customerId', validateObjectId, getCustomerLoyaltyDetail);

// GET /api/merchants/:id/loyalty/opportunities
router.get('/:id/loyalty/opportunities', validateObjectId, getLoyaltyOpportunities);

// POST /api/merchants/:id/loyalty/offers/create
router.post('/:id/loyalty/offers/create', validateObjectId, submitPersonalizedOffer);

// POST /api/merchants/:id/loyalty/offers/:actionId/outcome
router.post('/:id/loyalty/offers/:actionId/outcome', validateObjectId, recordOfferOutcome);

module.exports = router;
