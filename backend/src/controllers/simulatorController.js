const simulatorService = require('../services/simulatorService');
const growthDetectorService = require('../services/growthDetectorService');
const briefService = require('../services/briefService');

/**
 * simulatorController.js — Handles demo and evaluation simulation triggers
 */

const runScenario = async (req, res, next) => {
  try {
    const merchantId = req.params.id;
    const { scenario } = req.params;

    let result = null;

    switch (scenario) {
      case 'simulate-sale':
      case 'sale':
        result = await simulatorService.simulateSale(merchantId, req.body);
        break;

      case 'simulate-refund':
      case 'refund':
        result = await simulatorService.simulateRefund(merchantId, req.body);
        break;

      case 'sales-drop':
        result = await simulatorService.simulateSalesDrop(merchantId);
        break;

      case 'boost-product':
        result = await simulatorService.boostProduct(merchantId, req.body?.productName);
        break;

      case 'decline-product':
        result = await simulatorService.declineProduct(merchantId, req.body?.productName);
        break;

      case 'customer-return':
        result = await simulatorService.simulateCustomerReturn(merchantId);
        break;

      case 'customer-risk':
        result = await simulatorService.simulateCustomerRisk(merchantId);
        break;

      case 'run-analysis':
        result = await growthDetectorService.runAllDetectors(merchantId);
        break;

      case 'weather-rain':
      case 'monsoon':
        result = await simulatorService.simulateWeatherOpportunity(merchantId, 'rain');
        break;

      case 'measure-outcome':
        result = await simulatorService.simulateCampaignOutcome(merchantId, req.body?.actionId);
        break;

      case 'daily-brief':
        result = await briefService.getOrGenerateDailyBrief(merchantId, true);
        break;

      default:
        return res.status(400).json({
          success: false,
          message: `Unknown simulation scenario: "${scenario}". Supported: simulate-sale, simulate-refund, sales-drop, boost-product, decline-product, customer-return, customer-risk, run-analysis, daily-brief, weather-rain, measure-outcome.`,
        });
    }

    res.json({
      success: true,
      data: result,
      message: result?.message || `Successfully executed scenario: ${scenario}`,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  runScenario,
};
