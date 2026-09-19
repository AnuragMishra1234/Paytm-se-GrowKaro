const express = require('express');
const cors = require('cors');
const merchantRoutes = require('./routes/merchants');
const aiRoutes = require('./routes/ai');
const actionRoutes = require('./routes/actions');
const n8nRoutes = require('./routes/n8n');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map((u) => u.trim()) : []),
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.onrender.com') ||
      process.env.NODE_ENV !== 'production'
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
}));
app.use(express.json({ limit: '25mb' }));
app.use(express.text({ type: ['text/csv', 'text/plain'], limit: '25mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'GrowKaro API', version: '1.0.0' });
});

const notificationRoutes = require('./routes/notifications');
const demoRoutes = require('./routes/demo');
const teamRoutes = require('./routes/team');
const taskRoutes = require('./routes/tasks');
const datasetRoutes = require('./routes/dataset');
const employeeRoutes = require('./routes/employee');
const loyaltyRoutes = require('./routes/loyalty');

// Routes
app.use('/api/merchants', merchantRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/actions', actionRoutes);
app.use('/api/n8n', n8nRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/demo', demoRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/datasets', datasetRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/loyalty', loyaltyRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;