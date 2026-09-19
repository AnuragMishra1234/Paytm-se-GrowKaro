const express = require('express');
const router = express.Router();
const {
  previewDataset,
  analyzeDataset,
  getDatasetSession,
  queryDatasetCopilot,
  deleteDatasetSession,
} = require('../controllers/datasetController');

// POST /api/datasets/preview
router.post('/preview', previewDataset);

// POST /api/datasets/analyze
router.post('/analyze', analyzeDataset);

// GET /api/datasets/:sessionId
router.get('/:sessionId', getDatasetSession);

// POST /api/datasets/:sessionId/copilot
router.post('/:sessionId/copilot', queryDatasetCopilot);

// DELETE /api/datasets/:sessionId
router.delete('/:sessionId', deleteDatasetSession);

module.exports = router;
