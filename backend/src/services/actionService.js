const mongoose = require('mongoose');
const Action = require('../models/Action');
const Campaign = require('../models/Campaign');
const Insight = require('../models/Insight');
const Merchant = require('../models/Merchant');
const Product = require('../models/Product');
const memoryService = require('./memoryService');
const contextService = require('./contextService');
const n8nService = require('./n8nService');
const notificationService = require('./notificationService');
const Groq = require('groq-sdk');

const GROQ_API_KEY = process.env.GROQ_API_KEY || null;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

let groqClient = null;
if (GROQ_API_KEY && GROQ_API_KEY.trim() !== '') {
  try {
    groqClient = new Groq({ apiKey: GROQ_API_KEY });
  } catch (e) {
    // fallback mode active
  }
}

/**
 * Generate AI-crafted grounded campaign message copy
 */
const generateCampaignCopy = async (merchant, insight, products = [], memoryFacts = [], externalContext = null) => {
  // Deterministic grounded fallback template
  const generateFallbackCopy = () => {
    let headline = 'Exclusive Special Offer 🌟';
    let body = `Enjoy our special selection today at ${merchant.businessName}. Crafted fresh for our valued patrons.`;
    let cta = 'Show this message at counter or order online.';
    let offer = 'Special Bundle';
    let audience = 'Repeat & nearby customers';
    let timing = 'Today only';
    let channel = 'WHATSAPP';

    if (insight.type === 'WEAK_HOURS') {
      headline = 'Afternoon Coffee & Snack Break ☕';
      body = 'Beat the afternoon slump! Recharge with our exclusive ₹199 combo pairing your favorite brew with a freshly baked snack.';
      cta = 'Available today between 2:00 PM and 5:00 PM.';
      offer = '₹199 Combo';
      timing = '2:00 PM – 5:00 PM weekdays';
    } else if (insight.type === 'PRODUCT_DECLINE') {
      const prodName = insight.title.split(': ')[1] || 'Special Item';
      headline = `Value Pack Special: ${prodName} 🛒`;
      body = `Stock up on your essentials! Get a special bundle featuring ${prodName} alongside your daily favorites.`;
      cta = 'Valid while promotional stocks last this week.';
      offer = 'Special Bundle Savings';
      timing = 'This week';
    } else if (insight.type === 'EXTERNAL_CONTEXT') {
      headline = 'Rainy Day Warm-Up Special 🌧️';
      body = `Stay cozy during the rain! Enjoy our hot signature beverages and warm bites at ${merchant.businessName}.`;
      cta = 'Order takeaway or drop by for a hot drink!';
      offer = 'Warm Drink Combo';
      timing = 'Today 4:00 PM – 8:00 PM';
    } else if (insight.type === 'STRONG_HOURS') {
      headline = 'Weekend Celebration Special 🎉';
      body = `Make the most of your weekend at ${merchant.businessName}! Treat yourself and your family with our best-selling menu specials.`;
      cta = 'Reserve your spot or drop by early!';
      offer = 'Weekend Signature Special';
      timing = 'This weekend';
      audience = 'All customers';
    }

    return { headline, body, cta, offer, audience, timing, channel };
  };

  if (!groqClient) {
    return generateFallbackCopy();
  }

  try {
    const memorySnippet = memoryFacts.map((m) => `- ${m.content}`).join('\n') || 'None recorded.';
    const prodSnippet = products.map((p) => `${p.name} (₹${p.price})`).join(', ') || 'Standard catalogue';

    const systemPrompt = `You are GrowKaro AI, an expert copywriter and business partner for Indian digital merchants.
Draft a brief, compelling, customer-ready promotional message.
RULES:
1. Base the message strictly on the merchant's business type, verified products, and the specific recommendation.
2. Never invent products not listed in the catalogue.
3. If merchant memory prefers combos/bundles over % discounts, use bundle pricing (e.g. ₹199 combo).
4. Tone: Warm, inviting, and professional. Use Indian Rupee (₹) amounts.

Respond ONLY with valid JSON:
{
  "headline": "Catchy headline with 1 relevant emoji (max 6 words)",
  "body": "Friendly 1-2 sentence message describing the offer and value (max 35 words)",
  "cta": "Clear call to action with timing constraints (max 10 words)",
  "offer": "Short offer title (e.g. ₹199 Afternoon Combo)",
  "targetAudience": "Specific customer audience segment",
  "timing": "Recommended timing window"
}`;

    const userPrompt = `MERCHANT: ${merchant.businessName} (${merchant.businessType} in ${merchant.location?.city || 'India'})
RECOMMENDED ACTION: ${insight.recommendation?.action || insight.title}
BUSINESS GOAL: ${insight.recommendation?.goal || 'Drive volume'}
CATALOGUE PRODUCTS: ${prodSnippet}
MERCHANT MEMORY (Cognee): ${memorySnippet}
EXTERNAL WEATHER: ${externalContext?.weather?.condition || 'Normal'}`;

    const completion = await groqClient.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 350,
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(completion.choices[0]?.message?.content);
    if (!parsed || !parsed.body) {
      return generateFallbackCopy();
    }

    return {
      headline: parsed.headline,
      body: parsed.body,
      cta: parsed.cta,
      offer: parsed.offer || 'Special Promotion',
      audience: parsed.targetAudience || 'Repeat & nearby customers',
      timing: parsed.timing || 'Immediate window',
      channel: 'WHATSAPP',
    };
  } catch (err) {
    console.warn(`[Groq Copywriter Fallback]: ${err.message}`);
    return generateFallbackCopy();
  }
};

/**
 * 1. Create an Action Draft from an Insight Recommendation
 */
const createActionDraft = async (merchantId, insightId, overrides = {}) => {
  const [merchant, insight] = await Promise.all([
    Merchant.findById(merchantId).lean(),
    Insight.findById(insightId).lean(),
  ]);

  if (!merchant) throw new Error('Merchant not found');
  if (!insight) throw new Error('Insight not found');

  // Avoid creating duplicate pending actions for the same insight
  const existingAction = await Action.findOne({
    merchantId,
    insightId,
    approvalStatus: { $in: ['PENDING', 'APPROVED'] },
  }).lean();

  if (existingAction) {
    return existingAction;
  }

  // Gather products, memory & context for grounding
  const [products, memoryFacts, contextData] = await Promise.all([
    Product.find({ merchantId, isActive: true }).lean(),
    memoryService.getRelevantMemoryContext(merchantId, `${insight.type} ${insight.title}`),
    contextService.getMerchantContext(merchant),
  ]);

  // Generate grounded promotional copy
  const copy = await generateCampaignCopy(merchant, insight, products, memoryFacts, contextData);

  const actionData = {
    merchantId,
    insightId,
    type: insight.recommendation?.suggestedAction?.type || 'CAMPAIGN_DRAFT',
    title: overrides.title || copy.headline || insight.recommendation?.suggestedAction?.title || insight.title,
    description: insight.recommendation?.action || insight.title,
    targetAudience: overrides.targetAudience || copy.audience || 'Repeat & nearby customers',
    channel: overrides.channel || 'WHATSAPP',
    timing: overrides.timing || copy.timing || 'Immediate window',
    payload: {
      headline: copy.headline,
      body: copy.body,
      cta: copy.cta,
      offer: copy.offer,
      discountDetails: insight.recommendation?.goal || '',
      products: products.slice(0, 3).map((p) => p.name),
      ...overrides.payload,
    },
    teamImpact: [
      {
        role: 'MARKETING',
        taskTitle: `Campaign Creative: ${overrides.title || copy.headline || insight.title}`,
        taskDescription: `Review promotional copy ("${copy.headline}"), prepare WhatsApp creative assets, and verify targeted segment (${overrides.targetAudience || copy.audience}).`,
        assignedToName: 'Rahul Verma',
      },
      {
        role: 'STAFF',
        taskTitle: `Inventory & Counter Prep: ${overrides.title || copy.headline || insight.title}`,
        taskDescription: `Prepare required ingredients and counter display for the promotional window (${overrides.timing || copy.timing}). Verify active offer: "${copy.offer}".`,
        assignedToName: 'Ananya Das',
      },
      {
        role: 'MANAGER',
        taskTitle: `Execution Supervision & Shift Briefing`,
        taskDescription: `Brief floor staff on promotional pricing and monitor afternoon footfall velocity.`,
        assignedToName: 'Priya Sharma',
      },
    ],
    approvalStatus: 'PENDING',
    executionStatus: 'NOT_STARTED',
    auditLog: [
      {
        status: 'DRAFT_CREATED',
        note: 'AI generated action draft from insight recommendation. Awaiting merchant approval.',
        actor: 'system',
      },
    ],
  };

  const action = await Action.create(actionData);

  // Also create linked Campaign document
  await Campaign.create({
    merchantId,
    actionId: action._id,
    name: action.title,
    objective: insight.recommendation?.goal || 'Customer engagement and volume lift',
    channel: action.channel,
    headline: action.payload.headline,
    message: action.payload.body,
    targetAudience: action.targetAudience,
    offer: action.payload.offer,
    timing: action.timing,
    status: 'PENDING_APPROVAL',
  });

  // Automatically dispatch high-priority approval notification to merchant
  await notificationService.notifyActionRequired(action, merchant, insight).catch((err) => {
    console.warn('[Notification Notice]:', err.message);
  });

  // Optional n8n email dispatch if configured
  await n8nService.dispatchEmailNotification(merchant, action).catch(() => {});

  return action;
};

/**
 * 2. Edit Action Draft before approval
 */
const editActionDraft = async (merchantId, actionId, updates = {}) => {
  const action = await Action.findOne({ _id: actionId, merchantId });
  if (!action) throw new Error('Action not found');

  if (action.approvalStatus === 'APPROVED' && action.executionStatus === 'SUCCESS') {
    throw new Error('Cannot edit an action that has already completed execution');
  }

  if (updates.title) action.title = updates.title;
  if (updates.targetAudience) action.targetAudience = updates.targetAudience;
  if (updates.channel) action.channel = updates.channel;
  if (updates.timing) action.timing = updates.timing;

  if (updates.payload) {
    action.payload = {
      ...action.payload,
      ...updates.payload,
    };
  }

  action.auditLog.push({
    status: 'EDITED',
    note: 'Merchant updated action parameters before execution.',
    actor: 'merchant',
  });

  await action.save();

  // Keep linked campaign synchronized
  await Campaign.findOneAndUpdate(
    { actionId: action._id },
    {
      name: action.title,
      headline: action.payload.headline,
      message: action.payload.body,
      offer: action.payload.offer,
      targetAudience: action.targetAudience,
      channel: action.channel,
      timing: action.timing,
    }
  );

  return action;
};

/**
 * 3. Approve & Execute Action (Enforces Approval Gate)
 */
const approveAndExecuteAction = async (merchantId, actionId, approvedPayload = {}) => {
  const action = await Action.findOne({ _id: actionId, merchantId });
  if (!action) throw new Error('Action not found');

  const merchant = await Merchant.findById(merchantId).lean();
  if (!merchant) throw new Error('Merchant not found');

  // Security gate: allow if PENDING, or allow re-execution if FAILED
  if (action.approvalStatus === 'REJECTED' || action.executionStatus === 'CANCELLED') {
    throw new Error('Cannot execute a rejected or cancelled action. Create a new action draft.');
  }

  // Idempotency: If already executed successfully, return existing action
  if (action.executionStatus === 'SUCCESS') {
    return action;
  }

  // Apply any final review edits from approval payload
  if (approvedPayload.payload) {
    action.payload = { ...action.payload, ...approvedPayload.payload };
  }
  if (approvedPayload.title) action.title = approvedPayload.title;

  // Transition to APPROVED and QUEUED
  action.approvalStatus = 'APPROVED';
  action.approvedAt = new Date();
  action.executionStatus = 'QUEUED';
  action.auditLog.push({
    status: 'APPROVED',
    note: 'Merchant explicitly approved action execution.',
    actor: 'merchant',
  });

  await action.save();

  await Campaign.findOneAndUpdate(
    { actionId: action._id },
    {
      status: 'APPROVED',
      approvedBy: merchant.ownerName || 'Merchant',
    }
  );

  // Automatically coordinate merchant team: create role-specific tasks
  try {
    const taskService = require('./taskService');
    await taskService.createTasksForAction(action, merchant);
  } catch (taskErr) {
    console.warn('[Task Coordination Notice]:', taskErr.message);
  }

  // Transition to RUNNING
  action.executionStatus = 'RUNNING';
  action.executedAt = new Date();
  await action.save();

  await Campaign.findOneAndUpdate({ actionId: action._id }, { status: 'RUNNING' });

  // Dispatch to n8n workflow engine (or transparent demo sandbox)
  try {
    const execResult = await n8nService.executeActionWorkflow(action, merchant);

    action.executionStatus = 'SUCCESS';
    action.completedAt = new Date();
    action.n8nExecutionId = execResult.executionId;
    action.executionResult = execResult;
    action.auditLog.push({
      status: 'SUCCESS',
      note: execResult.message || 'Workflow completed successfully',
      actor: 'n8n',
    });

    await action.save();

    await Campaign.findOneAndUpdate(
      { actionId: action._id },
      {
        status: 'COMPLETED',
        n8nExecutionId: execResult.executionId,
        deliveryStats: execResult.deliveryStats,
      }
    );

    // Dispatch ACTION_COMPLETED notification
    await notificationService.notifyActionStatus(action, 'SUCCESS', merchant, execResult.deliveryStats).catch(() => {});

    return action;
  } catch (err) {
    action.executionStatus = 'FAILED';
    action.failureReason = err.message;
    action.auditLog.push({
      status: 'FAILED',
      note: `Execution failed: ${err.message}`,
      actor: 'n8n',
    });

    await action.save();

    await Campaign.findOneAndUpdate(
      { actionId: action._id },
      { status: 'FAILED' }
    );

    // Dispatch ACTION_FAILED notification
    await notificationService.notifyActionStatus(action, 'FAILED', merchant, { reason: err.message }).catch(() => {});

    return action;
  }
};

/**
 * 4. Reject Action
 */
const rejectAction = async (merchantId, actionId, reason = 'Merchant dismissed proposal') => {
  const action = await Action.findOne({ _id: actionId, merchantId });
  if (!action) throw new Error('Action not found');

  action.approvalStatus = 'REJECTED';
  action.executionStatus = 'CANCELLED';
  action.auditLog.push({
    status: 'REJECTED',
    note: `Merchant rejected action: ${reason}`,
    actor: 'merchant',
  });

  await action.save();

  await Campaign.findOneAndUpdate(
    { actionId: action._id },
    { status: 'CANCELLED' }
  );

  // Save rejection fact to Cognee merchant memory so future recommendations adapt
  await memoryService.storeMemory(merchantId, {
    type: 'preference',
    key: `rejected_${action.type}_${Date.now()}`,
    content: `Merchant rejected proposal "${action.title}". Reason: ${reason}`,
    tags: ['rejection', 'preference', action.channel.toLowerCase()],
    source: 'merchant_feedback',
  }).catch(() => {});

  const merchant = await Merchant.findById(merchantId).lean();
  if (merchant) {
    await notificationService.notifyActionStatus(action, 'REJECTED', merchant, { reason }).catch(() => {});
  }

  return action;
};

/**
 * 5. Retry a Failed Action
 */
const retryAction = async (merchantId, actionId) => {
  const action = await Action.findOne({ _id: actionId, merchantId });
  if (!action) throw new Error('Action not found');

  if (action.executionStatus !== 'FAILED') {
    throw new Error('Only failed actions can be retried');
  }

  action.failureReason = null;
  action.auditLog.push({
    status: 'RETRY_INITIATED',
    note: 'Merchant requested retry of failed execution.',
    actor: 'merchant',
  });
  await action.save();

  return approveAndExecuteAction(merchantId, actionId);
};

/**
 * 6. Query Actions for Merchant
 */
const getMerchantActions = async (merchantId, filter = {}) => {
  const query = { merchantId };
  if (filter.status && filter.status !== 'ALL') {
    query.approvalStatus = filter.status.toUpperCase();
  }
  return await Action.find(query).sort({ createdAt: -1 }).populate('insightId').lean();
};

/**
 * 7. Get Action Detail
 */
const getActionById = async (merchantId, actionId) => {
  return await Action.findOne({ _id: actionId, merchantId }).populate('insightId').lean();
};

/**
 * 8. Query Campaigns for Merchant
 */
const getMerchantCampaigns = async (merchantId) => {
  return await Campaign.find({ merchantId }).sort({ createdAt: -1 }).lean();
};

/**
 * 9. Trigger Action Execution after all prep tasks are completed
 */
const triggerExecutionAfterTasks = async (actionId, merchant) => {
  const action = await Action.findById(actionId);
  if (!action || action.executionStatus === 'SUCCESS') return action;

  try {
    const execResult = await n8nService.executeActionWorkflow(action, merchant);
    action.executionStatus = 'SUCCESS';
    action.completedAt = new Date();
    action.n8nExecutionId = execResult.executionId;
    action.executionResult = execResult;
    action.auditLog.push({
      status: 'SUCCESS',
      note: 'Workflow executed after team members completed preparatory tasks.',
      actor: 'n8n',
    });
    await action.save();

    await Campaign.findOneAndUpdate(
      { actionId: action._id },
      {
        status: 'COMPLETED',
        n8nExecutionId: execResult.executionId,
        deliveryStats: execResult.deliveryStats,
      }
    );

    await notificationService.notifyActionStatus(action, 'SUCCESS', merchant, execResult.deliveryStats).catch(() => {});
    return action;
  } catch (err) {
    action.executionStatus = 'FAILED';
    action.failureReason = err.message;
    await action.save();
    return action;
  }
};

module.exports = {
  createActionDraft,
  editActionDraft,
  approveAndExecuteAction,
  rejectAction,
  retryAction,
  getMerchantActions,
  getActionById,
  getMerchantCampaigns,
  triggerExecutionAfterTasks,
};