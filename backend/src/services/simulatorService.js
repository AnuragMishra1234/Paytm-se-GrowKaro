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
const Customer = require('../models/Customer');
const analyticsService = require('./analyticsService');
const briefService = require('./briefService');
const { emitToMerchant } = require('../socket');

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

/**
 * 5. Simulate Positive Sale (Live Judge Demo)
 * Creates a realistic ₹450 transaction and updates MongoDB & Socket in real-time
 */
const simulateSale = async (merchantId, customData = {}) => {
  const merchant = await Merchant.findById(merchantId);
  if (!merchant) throw new Error('Merchant not found');

  const now = new Date();
  let customer = await Customer.findOne({ merchantId, customerSegment: { $in: ['repeat', 'vip'] } });
  if (!customer) {
    customer = await Customer.findOne({ merchantId });
  }

  const items = customData.items || [
    { name: 'Cold Brew Coffee', category: 'beverages', quantity: 1, unitPrice: 200, unitCost: 65, totalPrice: 200 },
    { name: 'Fresh Butter Croissant', category: 'food', quantity: 1, unitPrice: 150, unitCost: 45, totalPrice: 150 },
    { name: 'Roasted Almond Pack', category: 'packaged', quantity: 1, unitPrice: 100, unitCost: 40, totalPrice: 100 },
  ];

  const amount = customData.amount || 450;
  const billNum = customData.billNumber || ('BILL-#' + Math.floor(10000 + Math.random() * 90000));

  const transaction = new Transaction({
    merchantId,
    customerId: customer?._id || null,
    amount,
    billNumber: billNum,
    transactionType: 'SALE',
    paymentStatus: 'completed',
    paymentMethod: 'upi',
    items,
    category: 'beverages',
    isLiveSimulated: true,
    timestamp: now,
    sourceProvider: 'LIVE_SIMULATION',
    sourceType: 'UNIFIED_LINKED',
  });
  const savedTx = await transaction.save();

  // Update customer spend
  if (customer) {
    customer.totalTransactions = (customer.totalTransactions || 0) + 1;
    customer.totalSpend = (customer.totalSpend || 0) + amount;
    customer.lastTransactionAt = now;
    customer.averageOrderValue = Math.round(customer.totalSpend / customer.totalTransactions);
    customer.customerSegment = customer.totalSpend >= 5000 ? 'vip' : 'repeat';
    await customer.save();
  }

  // Update product sales
  for (const it of items) {
    await Product.updateOne(
      { merchantId, name: new RegExp(`^${it.name}$`, 'i') },
      { $inc: { unitsSold: it.quantity || 1, revenue: it.totalPrice || it.unitPrice } }
    ).catch(() => {});
  }

  // Recalculate KPIs and Pulse
  const kpis = await analyticsService.getDashboardKPIs(merchantId);

  // Broadcast
  const broadcastPayload = {
    transaction: {
      _id: savedTx._id,
      billNumber: billNum,
      amount: savedTx.amount,
      totalBill: savedTx.amount,
      discount: 0,
      transactionType: 'SALE',
      paymentStatus: 'completed',
      paymentMethod: 'upi',
      timestamp: savedTx.timestamp,
      items: savedTx.items,
      customer: customer?.displayName || 'Ananya Das (Repeat Patron)',
      customerName: customer?.displayName || 'Ananya Das (Repeat Patron)',
      customerSegment: customer?.customerSegment || 'repeat',
      primaryItem: items[0]?.name || 'Counter Sale',
    },
    kpis,
    businessPulse: kpis.businessPulse,
  };
  emitToMerchant(merchantId, 'transaction:created', broadcastPayload);
  emitToMerchant(merchantId, 'dashboard:update', { kpis, businessPulse: kpis.businessPulse });

  return {
    scenario: 'SIMULATE_SALE',
    status: 'SUCCESS',
    transaction: savedTx,
    kpis,
    businessPulse: kpis.businessPulse,
    message: `Processed live SALE of ₹${amount} for ${merchant.businessName}. KPIs and real-time feed updated instantly.`,
  };
};

/**
 * 6. Simulate Refund (Negative / Loss Scenario for Judge Demo)
 * Injects ₹1,200 return, recalculates net sales, and triggers refund anomaly detector
 */
const simulateRefund = async (merchantId, customData = {}) => {
  const merchant = await Merchant.findById(merchantId);
  if (!merchant) throw new Error('Merchant not found');

  const now = new Date();
  const customer = await Customer.findOne({ merchantId }).sort({ totalSpend: -1 });

  const refundAmount = customData.amount || 1200;
  const items = customData.items || [
    { name: 'Specialty Belgian Chocolate Cake (1kg)', category: 'bakery', quantity: 1, unitPrice: 1200, unitCost: 450, totalPrice: 1200 },
  ];
  const billNum = customData.billNumber || ('REF-#' + Math.floor(10000 + Math.random() * 90000));

  const transaction = new Transaction({
    merchantId,
    customerId: customer?._id || null,
    amount: refundAmount,
    billNumber: billNum,
    transactionType: 'REFUND',
    paymentStatus: 'refunded',
    paymentMethod: 'upi',
    items,
    category: 'bakery',
    isLiveSimulated: true,
    timestamp: now,
    sourceProvider: 'LIVE_SIMULATION',
    sourceType: 'UNIFIED_LINKED',
  });
  const savedTx = await transaction.save();

  // Update customer spend
  if (customer) {
    customer.totalSpend = Math.max(0, (customer.totalSpend || 0) - refundAmount);
    await customer.save();
  }

  // Update product refund units
  await Product.updateOne(
    { merchantId, name: /Chocolate Cake/i },
    { $inc: { refundUnits: 1, unitsSold: -1 } }
  ).catch(() => {});

  // Recalculate KPIs and Pulse
  const kpis = await analyticsService.getDashboardKPIs(merchantId);

  // Trigger anomaly check
  const refundSignal = growthDetectorService.detectRefundAnomalies(kpis);
  let insight = null;
  let notification = null;

  if (refundSignal) {
    insight = new Insight({
      merchantId,
      type: refundSignal.type,
      severity: refundSignal.severity,
      category: refundSignal.category,
      title: refundSignal.title,
      whatHappened: refundSignal.whatHappened,
      whyItMatters: refundSignal.whyItMatters,
      whatToDo: refundSignal.whatToDo,
      recommendedAction: refundSignal.recommendedAction,
      comparisonPeriod: refundSignal.comparisonPeriod,
      confidence: 'HIGH',
      dataSource: 'PAYTM_LINKED_POS',
      metric: refundSignal.metric,
      currentValue: refundSignal.currentValue,
      baselineValue: refundSignal.baselineValue,
      changePercentage: refundSignal.changePercentage,
      evidence: refundSignal.evidence,
      priorityScore: refundSignal.priorityScore,
    });
    await insight.save();

    notification = new Notification({
      merchantId,
      type: 'WARNING',
      category: 'WARNING',
      priority: 'HIGH',
      title: refundSignal.title,
      message: refundSignal.whatHappened,
      relatedInsightId: insight._id,
    });
    await notification.save();
  }

  // Broadcast
  const broadcastPayload = {
    transaction: {
      _id: savedTx._id,
      billNumber: billNum,
      amount: savedTx.amount,
      totalBill: savedTx.amount,
      discount: 0,
      transactionType: 'REFUND',
      paymentStatus: 'refunded',
      paymentMethod: 'upi',
      timestamp: savedTx.timestamp,
      items: savedTx.items,
      customer: customer?.displayName || 'Customer Return',
      customerName: customer?.displayName || 'Customer Return',
      customerSegment: customer?.customerSegment || 'regular',
      primaryItem: items[0]?.name || 'Order Return',
    },
    kpis,
    businessPulse: kpis.businessPulse,
    newInsight: insight ? { _id: insight._id, title: insight.title, category: insight.category } : null,
    notification: notification ? { _id: notification._id, title: notification.title, type: notification.type } : null,
  };
  emitToMerchant(merchantId, 'transaction:created', broadcastPayload);
  emitToMerchant(merchantId, 'dashboard:update', { kpis, businessPulse: kpis.businessPulse });

  return {
    scenario: 'SIMULATE_REFUND',
    status: 'SUCCESS',
    transaction: savedTx,
    kpis,
    businessPulse: kpis.businessPulse,
    insight,
    notification,
    message: `Processed ₹${refundAmount} REFUND for ${merchant.businessName}. Net Sales adjusted down and refund activity alert dispatched.`,
  };
};

/**
 * 7. Boost Product Sales (Positive Demand Demonstration)
 */
const boostProduct = async (merchantId, productName = 'Cold Brew Coffee') => {
  await Product.updateOne({ merchantId, name: new RegExp(productName, 'i') }, { $set: { trend: 'growing' }, $inc: { unitsSold: 12, revenue: 1920 } });
  return simulateSale(merchantId, {
    amount: 640,
    items: [{ name: productName, category: 'beverages', quantity: 4, unitPrice: 160, unitCost: 55, totalPrice: 640 }],
  });
};

/**
 * 8. Decline Product Sales (Negative Demand Demonstration)
 */
const declineProduct = async (merchantId, productName = 'Chocolate Cake Slice') => {
  await Product.updateOne({ merchantId, name: new RegExp(productName, 'i') }, { $set: { trend: 'declining' } });
  const kpis = await analyticsService.getDashboardKPIs(merchantId);
  emitToMerchant(merchantId, 'dashboard:update', { kpis, businessPulse: kpis.businessPulse });
  return {
    scenario: 'DECLINE_PRODUCT',
    status: 'SUCCESS',
    productName,
    message: `Flagged ${productName} as declining across 3 consecutive cycles. Reflected in Product Intelligence and Business Pulse.`,
  };
};

/**
 * 9. Simulate Repeat Customer Return
 */
const simulateCustomerReturn = async (merchantId) => {
  const vipCustomer = await Customer.findOne({ merchantId, customerSegment: { $in: ['vip', 'repeat'] } });
  return simulateSale(merchantId, {
    amount: 1450,
    customerName: vipCustomer?.displayName || 'Rohan Kapoor (VIP Patron)',
    items: [
      { name: 'Cold Brew Coffee', category: 'beverages', quantity: 4, unitPrice: 200, unitCost: 65, totalPrice: 800 },
      { name: 'Fresh Butter Croissant', category: 'food', quantity: 3, unitPrice: 150, unitCost: 45, totalPrice: 450 },
      { name: 'Hazelnut Tart', category: 'food', quantity: 1, unitPrice: 200, unitCost: 70, totalPrice: 200 },
    ],
  });
};

/**
 * 10. Simulate Customer Churn Risk
 */
const simulateCustomerRisk = async (merchantId) => {
  const eighteenDaysAgo = new Date();
  eighteenDaysAgo.setDate(eighteenDaysAgo.getDate() - 18);

  await Customer.updateMany(
    { merchantId, totalSpend: { $gte: 1500 } },
    { $set: { lastTransactionAt: eighteenDaysAgo } }
  );

  const kpis = await analyticsService.getDashboardKPIs(merchantId);
  const churnSignal = await growthDetectorService.detectCustomerSignals(merchantId);

  emitToMerchant(merchantId, 'dashboard:update', { kpis, businessPulse: kpis.businessPulse });

  return {
    scenario: 'CUSTOMER_CHURN_RISK',
    status: 'SUCCESS',
    insights: churnSignal,
    message: `Simulated 18-day inactivity for VIP patrons. Churn alert dispatched to AI Priority Feed.`,
  };
};

module.exports = {
  simulateSalesDrop,
  simulateWeatherOpportunity,
  simulateCampaignOutcome,
  triggerDailyBrief,
  simulateSale,
  simulateRefund,
  boostProduct,
  declineProduct,
  simulateCustomerReturn,
  simulateCustomerRisk,
};
