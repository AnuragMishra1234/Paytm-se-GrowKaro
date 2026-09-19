const mongoose = require('mongoose');

/**
 * Middleware to validate MongoDB ObjectId before reaching controller
 */
const validateObjectId = (req, res, next) => {
  const id = req.params.id || req.params.memberId || req.params.taskId || req.params.insightId || req.params.actionId;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: `Invalid ID: ${id}`,
    });
  }
  next();
};

/**
 * 404 handler for unknown routes
 */
const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

/**
 * Central error handler
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: Object.values(err.errors).map((e) => e.message),
    });
  }

  // Mongoose CastError (bad ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid value for field: ${err.path}`,
    });
  }

  // Default 500
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
};

module.exports = { errorHandler, notFound, validateObjectId };