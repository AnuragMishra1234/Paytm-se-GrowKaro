const express = require('express');
const router = express.Router({ mergeParams: true });
const { createTransaction, getLiveFeed } = require('../controllers/transactionController');

// POST /api/merchants/:id/transactions
router.post('/', createTransaction);

// GET /api/merchants/:id/transactions/live-feed
router.get('/live-feed', getLiveFeed);

module.exports = router;
