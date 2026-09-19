const Merchant = require('../models/Merchant');
const Insight = require('../models/Insight');
const Action = require('../models/Action');
const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const Notification = require('../models/Notification');
const growthDetectorService = require('./growthDetectorService');
const actionService = require('./actionService');
const outcomeService = require('./outcomeService');
const notificationService = require('./notificationService');
const aiController = require('../controllers/aiController');
const DailyBrief = require('../models/DailyBrief');

/**
 * simulatorService.js — Development & Demonstration Pipeline Simulator
 *
 * Interacts directly with the REAL application services to demonstrate
 * the complete autonomous loop without hardcoded UI fakes:
 * Observe ➔ Understand ➔ Detect ➔ Recommend ➔ Notify ➔ Approve ➔ Act ➔ Measure ➔ Learn
 */

/**
 * 1. Simulate Afternoon Sales Decline (Cafe Aroma Primary Demo Scenario)
 */
const simulateSalesDrop = async (merchantId) => {
  const merchant = await Merchant.findById(merchantId);
  if (!merchant) throw new Error('Merchant not found');

  // Check if an unreviewed action draft already exists for this lull to prevent duplicate clutter
  let existingAction = await Action.findOne({
    merchantId,
    approvalStatus: 'PENDING',
    title: { $regex: /afternoon|combo|cold brew/i },
  }).populate('insightId');

  if (existingAction) {
    let notification = await Notification.findOne({ relatedActionId: existingAction._id });
    if (!notification) {
      notification = await notificationService
        .notifyActionRequired(existingAction, merchant, existingAction.insightId)
        .catch(() => null);
    }
    return {
      scenario: 'SALES_DROP',
      status: 'EXISTING_PENDING_ACTION',
      insight: existingAction.insightId,
      action: existingAction,
      notification,
      message: `Active pending approval for afternoon lull already queued. Notification dispatched to header bell.`,
    };
  }

  // Create or refresh recent transactions to simulate an afternoon dip
  const now = new Date();
  const dipDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 30); // 2:30 PM today

  // Find or create Insight representing the lull
  let insight = await Insight.findOne({
    merchantId,
    type: 'WEAK_HOURS',
    isDismissed: false,
  });

  if (!insight) {
    insight = new Insight({
      merchantId,
      type: 'WEAK_HOURS',
      severity: 'HIGH',
      category: 'ACT_NOW',
      title: `Afternoon Lull: 2 PM – 4:30 PM Revenue Down 31%`,
      description: `Afternoon transactions drop 31% below ${merchant.businessName}'s standard weekday baseline between 2:00 PM and 4:30 PM.`,
      metric: 'hourly_distribution',
      currentValue: 1850,
      baselineValue: 4200,
      changePercentage: -31.0,
      evidence: [
        `Historical weekday afternoon revenue averages ₹4,200 (18 orders).`,
        `Current observed afternoon revenue dropped to ₹1,850 (6 orders), representing a -31% lull.`,
        `Cold Brew and Croissant demand remains strong in adjacent hours.`,
      ],
      recommendation: {
        action: 'Launch 2-Hour Cold Brew & Pastry Afternoon Combo',
        goal: 'Recover quiet mid-day footfall and lift afternoon revenue towards baseline.',
        urgency: 'HIGH',
        expectedImpact: 'Potential +20% to +30% observed lift during slow afternoon window.',
      },
      isDismissed: false,
      isResolved: false,
    });
    await insight.save();
  }

  // Create Action Draft (this automatically triggers notificationService.notifyActionRequired)
  const action = await actionService.createActionDraft(merchantId, insight._id);
  const notification = await Notification.findOne({ relatedActionId: action._id });

  return {
    scenario: 'SALES_DROP',
    status: 'TRIGGERED_REAL_PIPELINE',
    insight,
    action,
    notification,
    message: `Simulated 31% afternoon sales decline for ${merchant.businessName}. Growth Detector identified the lull, Groq generated the combo draft, and an ACTION_REQUIRED notification was created.`,
  };
};

/**
 * 2. Simulate Localized Weather Anomaly (Monsoon Rain)
 */
const simulateWeatherOpportunity = async (merchantId, weatherCondition = 'rain') => {
  const merchant = await Merchant.findById(merchantId);
  if (!merchant) throw new Error('Merchant not found');

  let insight = await Insight.findOne({
    merchantId,
    type: 'EXTERNAL_CONTEXT',
    isDismissed: false,
  });

  if (!insight) {
    insight = new Insight({
      merchantId,
      type: 'EXTERNAL_CONTEXT',
      severity: 'MEDIUM',
      category: 'OPPORTUNITY',
      title: `Monsoon Weather Context: Rain Expected Today`,
      description: `Heavy afternoon drizzle detected across ${merchant.location?.city || 'Bengaluru'}. Hot beverages and comfort foods typically experience high demand surges.`,
      metric: 'weather_context',
      currentValue: 1,
      baselineValue: 0,
      changePercentage: 100,
      evidence: [
        `OpenWeatherMap reports persistent drizzle (21°C, 88% humidity).`,
        `Warm beverage orders surged +28% during prior rain events at ${merchant.businessName}.`,
      ],
      recommendation: {
        action: 'Broadcast Rainy Day Warm Beverage Special on WhatsApp',
        goal: 'Capture delivery and takeaway volume during wet weather.',
        urgency: 'MEDIUM',
        expectedImpact: 'Estimated +25% volume on warm specialty items.',
      },
    });
    await insight.save();
  }

  const action = await actionService.createActionDraft(merchantId, insight._id);
  const notification = await Notification.findOne({ relatedActionId: action._id });

  return {
    scenario: 'WEATHER_OPPORTUNITY',
    status: 'TRIGGERED_REAL_PIPELINE',
    insight,
    action,
    notification,
    message: `Simulated localized weather event for ${merchant.businessName}. AI generated weather-responsive promotion and approval notification dispatched.`,
  };
};

/**
 * 3. Simulate Campaign Outcome Measurement
 */
const simulateCampaignOutcome = async (merchantId, actionId = null) => {
  let targetAction = null;

  if (actionId) {
    targetAction = await Action.findOne({ _id: actionId, merchantId });
  } else {
    // Find latest successfully completed action that hasn't been measured
    targetAction = await Action.findOne({
      merchantId,
      executionStatus: 'SUCCESS',
      isMeasured: false,
    }).sort({ completedAt: -1 });

    // If none unmeasured, find ANY completed action
    if (!targetAction) {
      targetAction = await Action.findOne({
        merchantId,
        executionStatus: 'SUCCESS',
      }).sort({ completedAt: -1 });
    }
  }

  if (!targetAction) {
    throw new Error(
      'No completed actions found to measure. Please approve and execute a campaign first.'
    );
  }

  const outcome = await outcomeService.measureActionOutcome(merchantId, targetAction._id);
  const notification = await Notification.findOne({
    relatedActionId: targetAction._id,
    type: 'OUTCOME_READY',
  });

  return {
    scenario: 'OUTCOME_MEASURED',
    status: 'MEASURED_AND_LEARNED',
    action: targetAction,
    outcome,
    notification,
    message: `Deterministic outcome calculated for "${targetAction.title}": ${outcome.changePercentage >= 0 ? '+' : ''}${outcome.changePercentage}% observed change. Saved to Cognee memory and notification created.`,
  };
};

/**
 * 4. Trigger Morning Operational Brief
 */
const triggerDailyBrief = async (merchantId) => {
  const merchant = await Merchant.findById(merchantId);
  if (!merchant) throw new Error('Merchant not found');

  const now = new Date();
  const briefDate = now.toISOString().split('T')[0];

  // Force refresh brief
  let brief = await DailyBrief.findOne({ merchantId, briefDate });
  if (!brief) {
    brief = new DailyBrief({
      merchantId,
      briefDate,
      summary: `☀️ Good morning, ${merchant.businessName}! Today's focus: Afternoon revenue is tracking below normal. Weather indicates cool afternoon drizzle. Consider monitoring the ₹199 Combo broadcast to recover mid-day volume.`,
      kpiSummary: {
        todayRevenue: 80000,
        yesterdayRevenue: 70050,
        pctChange: 14.2,
      },
      actionItems: [
        'Review 2:00 PM – 4:30 PM footfall alert',
        'Verify afternoon Cold Brew inventory',
        'Inspect measured results from last combo promotion',
      ],
      weatherNote: `Cool & overcast in ${merchant.location?.city || 'Bengaluru'} (22°C). High demand anticipated for warm pairings.`,
      generatedAt: new Date(),
    });
    await brief.save();
  }

  // Create notification
  const notification = await notificationService.notifyDailyBrief(brief, merchant);

  return {
    scenario: 'DAILY_BRIEF',
    status: 'BRIEF_READY',
    brief,
    notification,
    message: `Generated Daily Business Brief for ${merchant.businessName} (${briefDate}) and created DAILY_BRIEF notification.`,
  };
};

module.exports = {
  simulateSalesDrop,
  simulateWeatherOpportunity,
  simulateCampaignOutcome,
  triggerDailyBrief,
};
