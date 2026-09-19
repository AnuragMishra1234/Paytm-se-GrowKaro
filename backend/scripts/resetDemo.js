require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');

const Merchant = require('../src/models/Merchant');
const Insight = require('../src/models/Insight');
const Action = require('../src/models/Action');
const Campaign = require('../src/models/Campaign');
const Outcome = require('../src/models/Outcome');
const Notification = require('../src/models/Notification');
const Memory = require('../src/models/Memory');
const DailyBrief = require('../src/models/DailyBrief');
const telemetrySyncService = require('../src/services/telemetrySyncService');

/**
 * resetDemo.js — Controlled Clean Presentation Reset
 *
 * Safe & explicit reset that creates the pristine Cafe Aroma demo scenario:
 * - Preserves historical transaction telemetry (~5,234 transactions), customers, and catalog
 * - Purges old development test actions, duplicate campaigns, and clutter notifications
 * - Establishes:
 *   1. Exactly ONE current high-priority Insight: Afternoon Lull (-31%)
 *   2. Exactly ONE pending recommended Action: Afternoon Cold Brew & Pastry Combo
 *   3. Exactly ONE Action Required Notification linking to approval
 *   4. Exactly ONE historical completed Campaign with measured Outcome (+23.8% lift)
 *   5. Grounded business memory facts
 */

const dateAt = (daysAgo, hour, minuteOffset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minuteOffset, 0, 0);
  return d;
};

async function resetDemoData() {
  console.log('================================================================');
  console.log('🔄 GROWKARO CLEAN DEMO RESET');
  console.log('================================================================\n');

  await connectDB();

  try {
    const cafe = await Merchant.findOne({ businessName: /Cafe Aroma/i });
    if (!cafe) {
      throw new Error('Cafe Aroma merchant not found. Please run "npm run seed" first.');
    }

    console.log(`Target Merchant: ${cafe.businessName} (ID: ${cafe._id})`);

    // Ensure transaction telemetry is aligned to Today and Yesterday with afternoon lull
    await telemetrySyncService.syncMerchantTelemetry(cafe._id);

    // 1. Clear dynamic test collections for Cafe Aroma (NEVER touch transactions or products)
    console.log('--- Cleaning accumulated test clutter ---');
    const delActions = await Action.deleteMany({ merchantId: cafe._id });
    const delCampaigns = await Campaign.deleteMany({ merchantId: cafe._id });
    const delOutcomes = await Outcome.deleteMany({ merchantId: cafe._id });
    const delNotifs = await Notification.deleteMany({ merchantId: cafe._id });
    const delInsights = await Insight.deleteMany({ merchantId: cafe._id });
    const delBriefs = await DailyBrief.deleteMany({ merchantId: cafe._id });
    await Memory.deleteMany({
      merchantId: cafe._id,
      type: { $in: ['past_outcome', 'preference'] },
    });

    console.log(`   Removed ${delActions.deletedCount} old actions`);
    console.log(`   Removed ${delCampaigns.deletedCount} old campaigns`);
    console.log(`   Removed ${delOutcomes.deletedCount} old outcomes`);
    console.log(`   Removed ${delNotifs.deletedCount} old notifications`);
    console.log(`   Removed ${delInsights.deletedCount} old insights`);

    // 2. Create the ONE historical completed campaign with measured outcome
    console.log('\n--- Seeding 1 clean historical completed campaign ---');
    const pastInsight = await Insight.create({
      merchantId: cafe._id,
      type: 'EXTERNAL_CONTEXT',
      severity: 'MEDIUM',
      category: 'OPPORTUNITY',
      title: 'Monsoon Weather Context: Rain Opportunity',
      description: 'Persistent afternoon drizzle detected across Bengaluru. Warm beverage and savory snack pairings experience surging demand.',
      metric: 'weather_context',
      currentValue: 1,
      baselineValue: 0,
      changePercentage: 100,
      evidence: [
        'Persistent rainy weather recorded in Indiranagar.',
        'Hot beverage and fresh snack pairings see high volume during monsoon rains.',
      ],
      recommendation: {
        action: 'Broadcast Rainy Day Hot Chai & Samosa Combo on WhatsApp',
        goal: 'Capture delivery and takeaway volume during wet weather.',
        urgency: 'MEDIUM',
        expectedImpact: 'Estimated +20% to +30% volume lift.',
      },
      priorityScore: 70,
      status: 'RESOLVED',
      createdAt: dateAt(5, 14),
    });

    const pastAction = await Action.create({
      merchantId: cafe._id,
      insightId: pastInsight._id,
      type: 'CAMPAIGN_DRAFT',
      channel: 'WHATSAPP',
      title: 'Monsoon Hot Chai & Samosa Combo',
      description: 'Warm up with our fresh ginger chai and crispy samosa combo at a special ₹120 price.',
      targetAudience: 'Nearby regular patrons (30 customers)',
      timing: '2:00 PM – 5:00 PM',
      payload: {
        headline: 'Rainy Day Chai & Samosa Special',
        body: 'Warm up your afternoon! Enjoy our freshly brewed Ginger Chai paired with hot vegetable samosas for just ₹120.',
        offer: '₹120 Monsoon Combo',
        cta: 'Order takeaway or dine in today',
        products: ['Masala Chai', 'Samosa'],
      },
      approvalStatus: 'APPROVED',
      executionStatus: 'SUCCESS',
      scheduledAt: dateAt(5, 14, 30),
      approvedAt: dateAt(5, 14, 32),
      executedAt: dateAt(5, 14, 35),
      completedAt: dateAt(5, 14, 40),
      n8nExecutionId: 'n8n_exec_monsoon_101',
      executionResult: {
        success: true,
        mode: 'demo',
        status: 'SUCCESS',
        deliveryStats: {
          estimatedAudience: 30,
          sentCount: 30,
          deliveredCount: 29,
          readCount: 24,
          isSimulated: true,
        },
      },
      isMeasured: true,
      auditLog: [
        { status: 'DRAFT_CREATED', timestamp: dateAt(5, 14), actor: 'system' },
        { status: 'APPROVED', timestamp: dateAt(5, 14, 32), actor: 'merchant' },
        { status: 'SUCCESS', timestamp: dateAt(5, 14, 40), actor: 'n8n' },
      ],
      createdAt: dateAt(5, 14),
    });

    const pastCampaign = await Campaign.create({
      merchantId: cafe._id,
      actionId: pastAction._id,
      name: 'Monsoon Hot Chai & Samosa Combo',
      channel: 'WHATSAPP',
      status: 'COMPLETED',
      targetAudience: 'Nearby regular patrons (30 customers)',
      message: 'Warm up your afternoon! Enjoy our freshly brewed Ginger Chai paired with hot vegetable samosas for just ₹120.',
      deliveryStats: {
        estimatedAudience: 30,
        sentCount: 30,
        deliveredCount: 29,
        openedCount: 24,
        clickedCount: 16,
      },
      scheduledAt: dateAt(5, 14, 30),
      executedAt: dateAt(5, 14, 35),
      completedAt: dateAt(5, 14, 40),
      isMeasured: true,
      createdAt: dateAt(5, 14),
    });

    const pastOutcome = await Outcome.create({
      merchantId: cafe._id,
      actionId: pastAction._id,
      campaignId: pastCampaign._id,
      metric: 'REVENUE',
      baselinePeriod: {
        start: dateAt(8, 14),
        end: dateAt(5, 14),
        label: 'Pre-campaign 3-day baseline',
      },
      postActionPeriod: {
        start: dateAt(5, 15),
        end: dateAt(2, 15),
        label: 'Post-campaign 3-day window',
      },
      baselineValue: 3240,
      postActionValue: 4010,
      changeValue: 770,
      changePercentage: 23.8,
      measurementWindow: '3-day post-campaign performance vs prior 3-day baseline',
      status: 'MEASURED',
      dataConfidence: 'SUFFICIENT',
      interpretation: 'Observed +23.8% increase in revenue following the "Monsoon Hot Chai & Samosa Combo" campaign. Sales increased after the campaign dispatch.',
      evidence: [
        'Baseline afternoon revenue: ₹3,240 (historical 3-day avg).',
        'Post-campaign afternoon revenue: ₹4,010 (observed 3-day avg).',
        '24 of 30 recipients engaged with the offer.',
      ],
      learningStored: true,
      measuredAt: dateAt(2, 16),
      createdAt: dateAt(2, 16),
    });

    pastAction.outcomeId = pastOutcome._id;
    await pastAction.save();

    pastCampaign.outcomeId = pastOutcome._id;
    await pastCampaign.save();

    // Store historical learning memory
    await Memory.create({
      merchantId: cafe._id,
      type: 'past_outcome',
      key: `outcome_${pastAction._id}`,
      content: 'Previous Monsoon Hot Chai & Samosa combo was associated with +23.8% observed afternoon volume lift during rain events.',
      tags: ['outcome', 'past_outcome', 'revenue', 'whatsapp', 'positive_lift'],
      metadata: {
        actionId: pastAction._id.toString(),
        metric: 'REVENUE',
        changePercentage: 23.8,
        baselineValue: 3240,
        postActionValue: 4010,
      },
      confidence: 0.95,
      source: 'system_observed',
      createdAt: dateAt(2, 16),
    });

    console.log(`   ✓ Created completed historical campaign: "${pastCampaign.name}" (+23.8% observed lift)`);

    // 3. Create the ONE active official demo scenario
    console.log('\n--- Seeding official demo scenario (Afternoon Sales Lull) ---');
    const activeInsight = await Insight.create({
      merchantId: cafe._id,
      type: 'WEAK_HOURS',
      severity: 'HIGH',
      category: 'ACT_NOW',
      title: 'Afternoon Lull: 2 PM – 4:30 PM Revenue Down 31%',
      metric: 'hourly_distribution',
      currentValue: 1850,
      baselineValue: 4200,
      changePercentage: -31.0,
      evidence: [
        'Historical weekday afternoon revenue averages ₹4,200 (18 orders).',
        'Current observed afternoon revenue dropped to ₹1,850 (6 orders), representing a -31% lull.',
        'Cold Brew and Croissant demand remains strong in adjacent hours.',
      ],
      explanation: "Weekday mid-day sales consistently trough between 2:00 PM and 4:30 PM. Promoting an afternoon specialty combo can recover idle machine capacity and capture nearby office patrons.",
      recommendation: {
        situation: 'Mid-day transactions drop 31% below standard weekday baseline.',
        evidence: 'Historical ₹4,200 vs current ₹1,850 afternoon revenue.',
        explanation: 'Cold brew and fresh bakery items have high margins and rapid counter preparation.',
        action: 'Launch 2-Hour Cold Brew & Pastry Afternoon Combo for ₹199 on WhatsApp',
        goal: 'Recover quiet mid-day footfall and lift afternoon revenue towards baseline.',
        suggestedAction: {
          type: 'CAMPAIGN_DRAFT',
          title: 'Afternoon Cold Brew & Pastry Combo',
          details: 'Pair signature Cold Brew with a freshly baked Butter Croissant for ₹199.',
          targetAudience: '25 Repeat & Nearby Customers',
          timing: '2:00 PM – 5:00 PM Today',
          expectedImpact: 'Potential +20% to +30% observed lift during slow afternoon window.',
          isExecutable: true,
        },
      },
      externalContext: {
        type: 'WEATHER',
        summary: 'Overcast & cool in Bengaluru (21°C). High demand anticipated for afternoon pairings.',
        relevance: 'HIGH',
      },
      priorityScore: 92,
      status: 'NEW',
      createdAt: new Date(),
    });

    const activeAction = await Action.create({
      merchantId: cafe._id,
      insightId: activeInsight._id,
      type: 'CAMPAIGN_DRAFT',
      channel: 'WHATSAPP',
      title: 'Afternoon Cold Brew & Pastry Combo',
      description: 'Beat the mid-day lull with our refreshing Cold Brew and Croissant combo at a special ₹199 price.',
      targetAudience: '25 Repeat & Nearby Customers',
      timing: '2:00 PM – 5:00 PM Today',
      payload: {
        headline: 'Beat the Afternoon Slump',
        body: 'Recharge your afternoon! Enjoy our artisan Cold Brew paired with a freshly baked Butter Croissant for just ₹199 today.',
        offer: '₹199 Combo Deal',
        cta: 'Show this message at counter or order online',
        discountDetails: 'Save ₹60 on standard combo price',
        products: ['Cold Brew Coffee', 'Croissant'],
      },
      approvalStatus: 'PENDING',
      executionStatus: 'NOT_STARTED',
      auditLog: [
        { status: 'DRAFT_CREATED', timestamp: new Date(), actor: 'system', note: 'Generated from afternoon lull detection' },
      ],
      createdAt: new Date(),
    });

    // Create exactly ONE clean Action Required notification
    const activeNotif = await Notification.create({
      merchantId: cafe._id,
      type: 'ACTION_REQUIRED',
      title: 'GrowKaro found an opportunity for Cafe Aroma',
      message: 'Afternoon sales are 31% below normal pattern. Recommended action: Launch Afternoon Cold Brew Combo.',
      priority: 'CRITICAL',
      category: 'RECOMMENDATION',
      relatedInsightId: activeInsight._id,
      relatedActionId: activeAction._id,
      requiresApproval: true,
      actionUrl: '/campaigns',
      idempotencyKey: `action_req_${activeAction._id.toString()}`,
      metadata: {
        actionTitle: activeAction.title,
        offer: activeAction.payload?.offer,
        targetAudience: activeAction.targetAudience,
      },
      read: false,
      createdAt: new Date(),
    });

    // Create a clean daily brief
    const todayStr = new Date().toISOString().split('T')[0];
    await DailyBrief.create({
      merchantId: cafe._id,
      briefDate: todayStr,
      summary: `Good morning, Cafe Aroma! Today's focus: Afternoon revenue is tracking 31% below normal. Cool weather in Bengaluru (21°C). Launching the ₹199 Cold Brew Combo can recover mid-day footfall.`,
      kpiSummary: {
        todayRevenue: 84500,
        yesterdayRevenue: 78200,
        pctChange: 8.1,
      },
      actionItems: [
        'Review and approve the 2:00 PM – 4:30 PM Cold Brew Combo proposal',
        'Verify pastry inventory for the afternoon promotional window',
        'Inspect measured results from last week Monsoon Chai campaign (+23.8%)',
      ],
      weatherNote: 'Overcast & cool in Bengaluru (21°C). Ideal weather for warm snacks & fresh coffee.',
      generatedAt: new Date(),
    });

    console.log(`   ✓ Created active Insight: "${activeInsight.title}"`);
    console.log(`   ✓ Created pending Action Draft: "${activeAction.title}" (ID: ${activeAction._id})`);
    console.log(`   ✓ Created Notification: "${activeNotif.title}" (Bell count: 1)`);

    console.log('\n================================================================');
    console.log('🎉 DEMO RESET COMPLETE!');
    console.log('Cafe Aroma is now in the pristine presentation state.');
    console.log('================================================================\n');

    return {
      success: true,
      merchantId: cafe._id,
      merchantName: cafe.businessName,
      activeInsightId: activeInsight._id,
      pendingActionId: activeAction._id,
      notificationId: activeNotif._id,
      completedCampaignId: pastCampaign._id,
    };
  } catch (err) {
    console.error('❌ Demo reset failed:', err.message);
    throw err;
  }
}

// Allow CLI invocation or direct import
if (require.main === module) {
  resetDemoData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { resetDemoData };
