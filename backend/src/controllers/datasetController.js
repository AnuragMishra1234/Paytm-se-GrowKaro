const DatasetSession = require('../models/DatasetSession');
const datasetParserService = require('../services/datasetParserService');

/**
 * datasetController.js
 * Controls the Real Data Ingestion, Column Mapping, Validation, Analytics & Copilot pipeline.
 *
 * CRITICAL ARCHITECTURAL ISOLATION:
 * Operates purely on DatasetSession documents. Live merchant data is completely untouched.
 */

// POST /api/datasets/preview
const previewDataset = async (req, res, next) => {
  try {
    const { rawContent, fileName = 'uploaded_data.csv' } = req.body;

    if (!rawContent || typeof rawContent !== 'string') {
      return res.status(400).json({ success: false, error: 'rawContent string is required' });
    }

    const { headers, rows } = datasetParserService.parseCSV(rawContent);

    if (headers.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Unable to parse CSV headers. Please ensure the file is a valid CSV.',
      });
    }

    const suggestedMapping = datasetParserService.detectColumnMapping(headers);

    res.json({
      success: true,
      data: {
        fileName,
        headers,
        totalRows: rows.length,
        previewRows: rows.slice(0, 5),
        suggestedMapping,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/datasets/analyze
const analyzeDataset = async (req, res, next) => {
  try {
    const {
      rawContent,
      fileName = 'uploaded_dataset.csv',
      fileSize = 0,
      columnMapping = {},
      merchantId = null,
    } = req.body;

    if (!rawContent || typeof rawContent !== 'string') {
      return res.status(400).json({ success: false, error: 'rawContent string is required' });
    }

    if (!columnMapping.amount || !columnMapping.date) {
      return res.status(400).json({
        success: false,
        error: 'Column mapping for "amount" and "date" are strictly required.',
      });
    }

    // 1. Parse CSV
    const { rows } = datasetParserService.parseCSV(rawContent);

    // 2. Validate against mapping
    const { qualitySummary, validTransactions } = datasetParserService.validateDataset(rows, columnMapping);

    if (validTransactions.length === 0) {
      return res.status(422).json({
        success: false,
        error: 'No valid transactions could be parsed with the provided column mapping.',
        qualitySummary,
      });
    }

    // 3. Calculate Deterministic Analytics
    const analyticsSummary = datasetParserService.computeDeterministicAnalytics(validTransactions);

    // 4. Determine Data Completeness & Confidence
    const hasProductData = Boolean(
      columnMapping.product &&
      validTransactions.some((tx) => tx.product && tx.product !== 'General Item')
    );
    const dataConfidence = hasProductData ? 'HIGH' : 'LOW';
    const limitationDisclaimer = hasProductData
      ? null
      : 'Product-level insights unavailable because the uploaded dataset does not contain item-level order data.';

    // 5. Calculate Customer Intelligence & Loyalty Opportunities
    const customerIntelligence = datasetParserService.computeCustomerIntelligence(validTransactions);

    // 6. Generate Grounded AI Insights
    const insights = await datasetParserService.generateRealDataInsights(analyticsSummary, customerIntelligence, hasProductData);

    // 7. Create Isolated DatasetSession
    const sessionId = `ds_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const session = await DatasetSession.create({
      sessionId,
      merchantId,
      fileName,
      fileSize,
      columnMapping,
      qualitySummary,
      // Store up to 2,000 valid transactions in session for interactive queries
      transactions: validTransactions.slice(0, 2000),
      analyticsSummary,
      insights,
      customerProfiles: customerIntelligence.customerProfiles || [],
      hasCustomerIdentifiers: customerIntelligence.hasCustomerIdentifiers,
      hasProductData,
      dataConfidence,
      limitationDisclaimer,
    });

    res.status(201).json({
      success: true,
      message: 'Dataset analyzed successfully in isolated session',
      data: {
        sessionId: session.sessionId,
        fileName: session.fileName,
        qualitySummary: session.qualitySummary,
        analyticsSummary: session.analyticsSummary,
        insights: session.insights,
        customerIntelligence,
        hasCustomerIdentifiers: session.hasCustomerIdentifiers,
        hasProductData: session.hasProductData,
        dataConfidence: session.dataConfidence,
        limitationDisclaimer: session.limitationDisclaimer,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/datasets/:sessionId
const getDatasetSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const session = await DatasetSession.findOne({ sessionId }).lean();

    if (!session) {
      return res.status(404).json({ success: false, error: 'Dataset session not found or expired' });
    }

    res.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        fileName: session.fileName,
        qualitySummary: session.qualitySummary,
        analyticsSummary: session.analyticsSummary,
        insights: session.insights,
        customerProfiles: session.customerProfiles,
        hasCustomerIdentifiers: session.hasCustomerIdentifiers,
        hasProductData: session.hasProductData !== false,
        dataConfidence: session.dataConfidence || (session.hasProductData !== false ? 'HIGH' : 'LOW'),
        limitationDisclaimer: session.limitationDisclaimer || (session.hasProductData === false ? 'Product-level insights unavailable because the uploaded dataset does not contain item-level order data.' : null),
        uploadedAt: session.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/datasets/:sessionId/copilot
const queryDatasetCopilot = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { query } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ success: false, error: 'query string is required' });
    }

    const session = await DatasetSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ success: false, error: 'Dataset session not found or expired' });
    }

    const result = await datasetParserService.queryDatasetCopilot(session, query);

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/datasets/:sessionId
const deleteDatasetSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const result = await DatasetSession.deleteOne({ sessionId });

    res.json({
      success: true,
      message: 'Temporary dataset session cleared cleanly.',
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  previewDataset,
  analyzeDataset,
  getDatasetSession,
  queryDatasetCopilot,
  deleteDatasetSession,
};
