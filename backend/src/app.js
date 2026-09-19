const express = require('express');
const cors = require('cors');
const merchantRoutes = require('./routes/merchants');
const aiRoutes = require('./routes/ai');
const actionRoutes = require('./routes/actions');
const n8nRoutes = require('./routes/n8n');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'GrowKaro API', version: '1.0.0' });
});

const notificationRoutes = require('./routes/notifications');
const demoRoutes = require('./routes/demo');
const paytmRoutes = require('./routes/paytm');
const customerOfferRoutes = require('./routes/customerOffers');
const customerOfferService = require('./services/customerOfferService');

// Routes
app.use('/api/merchants', merchantRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/actions', actionRoutes);
app.use('/api/n8n', n8nRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/demo', demoRoutes);
app.use('/api/paytm', paytmRoutes);
app.use('/api/customer-offers', customerOfferRoutes);

// GET /api/customers/:customerId/offers
app.get('/api/customers/:customerId/offers', async (req, res, next) => {
  try {
    const offers = await customerOfferService.getCustomerOffers(req.params.customerId);
    return res.json({ success: true, data: offers });
  } catch (err) {
    next(err);
  }
});

// Error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;