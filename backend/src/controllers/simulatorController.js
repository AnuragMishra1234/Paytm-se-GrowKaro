const simulatorService = require('../services/simulatorService');

/**
 * simulatorController.js — Handles demo and evaluation simulation triggers
 */

const runScenario = async (req, res, next) => {
  try {
    const merchantId = req.params.id;
    const { scenario } = req.params;

    let result = null;

    switch (scenario) {
      case 'sales-drop':
        result = await simulatorService.simulateSalesDrop(merchantId);
        break;

      case 'weather-rain':
      case 'monsoon':
        result = await simulatorService.simulateWeatherOpportunity(merchantId, 'rain');
        break;

      case 'measure-outcome':
        result = await simulatorService.simulateCampaignOutcome(merchantId, req.body?.actionId);
        break;

      case 'daily-brief':
        result = await simulatorService.triggerDailyBrief(merchantId);
        break;

      default:
        return res.status(400).json({
          success: false,
          message: `Unknown simulation scenario: "${scenario}". Supported: sales-drop, weather-rain, measure-outcome, daily-brief.`,
        });
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  runScenario,
};
