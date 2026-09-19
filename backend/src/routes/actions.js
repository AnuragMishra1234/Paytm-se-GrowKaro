const express = require('express');
const router = express.Router();
const { validateObjectId } = require('../middleware/errorHandler');
const {
  createDraft,
  getAction,
  updateDraft,
  approve,
  reject,
  retry,
} = require('../controllers/actionController');

// POST /api/actions - Create draft
router.post('/', createDraft);

// GET /api/actions/:actionId - Detail
router.get('/:actionId', (req, res, next) => {
  req.params.id = req.params.actionId;
  validateObjectId(req, res, () => {
    getAction(req, res, next);
  });
});

// PATCH /api/actions/:actionId - Edit draft
router.patch('/:actionId', (req, res, next) => {
  req.params.id = req.params.actionId;
  validateObjectId(req, res, () => {
    updateDraft(req, res, next);
  });
});

// POST /api/actions/:actionId/approve - Explicit approval & execution
router.post('/:actionId/approve', (req, res, next) => {
  req.params.id = req.params.actionId;
  validateObjectId(req, res, () => {
    approve(req, res, next);
  });
});

// POST /api/actions/:actionId/reject - Reject action
router.post('/:actionId/reject', (req, res, next) => {
  req.params.id = req.params.actionId;
  validateObjectId(req, res, () => {
    reject(req, res, next);
  });
});

// POST /api/actions/:actionId/retry - Retry failed action
router.post('/:actionId/retry', (req, res, next) => {
  req.params.id = req.params.actionId;
  validateObjectId(req, res, () => {
    retry(req, res, next);
  });
});

const { measureAction, getActionOutcome } = require('../controllers/outcomeController');

// POST /api/actions/:actionId/measure - Measure outcome & trigger learning loop
router.post('/:actionId/measure', (req, res, next) => {
  req.params.id = req.params.actionId;
  validateObjectId(req, res, () => {
    measureAction(req, res, next);
  });
});

// GET /api/actions/:actionId/outcome - Retrieve measured outcome
router.get('/:actionId/outcome', (req, res, next) => {
  req.params.id = req.params.actionId;
  validateObjectId(req, res, () => {
    getActionOutcome(req, res, next);
  });
});

module.exports = router;