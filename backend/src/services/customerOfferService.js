const CustomerOffer = require('../models/CustomerOffer');
const Customer = require('../models/Customer');
const Merchant = require('../models/Merchant');
const Transaction = require('../models/Transaction');
const Memory = require('../models/Memory');
const Notification = require('../models/Notification');
const { calculateCustomerChurnMetrics, generateGroqExplanation } = require('./customerChurnService');
const { executeActionWorkflow } = require('./n8nService');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || null;

/**
 * Scan all customers for a merchant, detect inactivity/churn risk,
 * and create personalized WIN_BACK offers (with duplicate protection).
 */
const detectAndCreateCustomerOffers = async (merchantId, referenceDate = new Date()) => {
  const merchant = await Merchant.findById(merchantId);
  if (!merchant) {
    throw new Error('Merchant not found');
  }

  const customers = await Customer.find({ merchantId });
  const createdOffers = [];
  const skippedCount = { activeOffer: 0, notQualified: 0 };

  for (const customer of customers) {
    // 1. Duplicate Protection: Check if customer already has an active or pending WIN_BACK offer
    const existingActiveOffer = await CustomerOffer.findOne({
      customerId: customer._id,
      merchantId,
      status: { $in: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENDING', 'SENT'] },
    });

    if (existingActiveOffer) {
      skippedCount.activeOffer += 1;
      continue;
    }

    // 2. Deterministic churn calculation
    const metrics = await calculateCustomerChurnMetrics(customer._id, merchantId, referenceDate);
    if (!metrics || !metrics.qualifies) {
      skippedCount.notQualified += 1;
      continue;
    }

    // 3. AI or deterministic explanation
    const refinedReason = await generateGroqExplanation(metrics, merchant.businessName);

    // 4. Create single-customer targeted offer
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days validity
    const offerId = `off_winback_${Date.now()}_${customer._id.toString().slice(-4)}`;

    const newOffer = await CustomerOffer.create({
      offerId,
      merchantId: merchant._id,
      customerId: customer._id,
      customerName: customer.displayName,
      targetContact: {
        phone: customer.phone || '',
        telegramChatId: customer.telegramChatId || '',
      },
      offerType: 'WIN_BACK',
      discountAmount: metrics.recommendedOffer,
      reason: refinedReason,
      trigger: {
        daysSinceLastPurchase: metrics.daysSinceLastPurchase,
        averageVisitGapDays: metrics.averageVisitGapDays,
        totalVisits: metrics.totalVisits,
        totalSpent: metrics.totalSpent,
        favoriteProduct: metrics.favoriteProduct,
        favoriteCategory: metrics.favoriteCategory,
        churnRisk: metrics.churnRisk,
      },
      status: 'PENDING_APPROVAL',
      channel: customer.telegramChatId ? 'TELEGRAM' : 'DEMO',
      expiresAt,
    });

    // 5. Create in-app notification for the merchant
    try {
      await Notification.create({
        merchantId: merchant._id,
        type: 'INSIGHT',
        title: `Customer Win-Back Opportunity: ${customer.displayName}`,
        message: `GrowKaro found a customer who may be slipping away. ${customer.displayName} hasn't visited ${merchant.businessName} for ${metrics.daysSinceLastPurchase} days (normal interval: ${metrics.averageVisitGapDays} days). Recommended: ₹${metrics.recommendedOffer} comeback offer.`,
        urgency: metrics.churnRisk === 'HIGH' ? 'high' : 'medium',
        actionId: null,
      });
    } catch (notifErr) {
      console.warn('Could not create notification for customer offer:', notifErr.message);
    }

    createdOffers.push(newOffer);
  }

  return {
    scanned: customers.length,
    created: createdOffers.length,
    skippedActive: skippedCount.activeOffer,
    skippedNotQualified: skippedCount.notQualified,
    offers: createdOffers,
  };
};

/**
 * Get all customer opportunities / offers for a merchant
 */
const getMerchantCustomerOffers = async (merchantId, filterStatus = null) => {
  const query = { merchantId };
  if (filterStatus && filterStatus !== 'ALL') {
    query.status = filterStatus;
  }
  return CustomerOffer.find(query).sort({ createdAt: -1 });
};

/**
 * Get offers for a specific customer
 */
const getCustomerOffers = async (customerId, merchantId = null) => {
  const query = { customerId };
  if (merchantId) query.merchantId = merchantId;
  return CustomerOffer.find(query).sort({ createdAt: -1 });
};

/**
 * Approve a customer offer (Strict merchant ownership check)
 */
const approveCustomerOffer = async (offerId, merchantId) => {
  const offer = await CustomerOffer.findOne({ offerId, merchantId });
  if (!offer) {
    throw new Error('Customer offer not found or does not belong to this merchant');
  }

  if (offer.status !== 'PENDING_APPROVAL' && offer.status !== 'DRAFT') {
    throw new Error(`Cannot approve offer in ${offer.status} status`);
  }

  offer.status = 'APPROVED';
  offer.approvedAt = new Date();
  await offer.save();

  // Execute dispatch
  return dispatchCustomerOffer(offer.offerId);
};

/**
 * Reject a customer offer with reason and record learning
 */
const rejectCustomerOffer = async (offerId, merchantId, reason = 'Merchant declined') => {
  const offer = await CustomerOffer.findOne({ offerId, merchantId });
  if (!offer) {
    throw new Error('Customer offer not found or does not belong to this merchant');
  }

  offer.status = 'REJECTED';
  offer.rejectedAt = new Date();
  offer.rejectionReason = reason;
  await offer.save();

  // Record negative preference / rejection memory into Cognee layer
  try {
    await Memory.create({
      merchantId: offer.merchantId,
      type: 'past_outcome',
      key: `rejected_winback_${offer.customerId}`,
      content: `Merchant rejected ₹${offer.discountAmount} win-back offer for ${offer.customerName}. Note: ${reason}`,
      tags: ['win_back', 'rejection', 'merchant_feedback'],
      confidence: 1.0,
      source: 'merchant_feedback',
    });
  } catch (memErr) {
    console.warn('Memory logging notice:', memErr.message);
  }

  return offer;
};

/**
 * Edit an unapproved customer offer
 */
const editCustomerOffer = async (offerId, merchantId, { discountAmount, reason }) => {
  const offer = await CustomerOffer.findOne({ offerId, merchantId });
  if (!offer) {
    throw new Error('Customer offer not found or does not belong to this merchant');
  }

  if (offer.status !== 'PENDING_APPROVAL' && offer.status !== 'DRAFT') {
    throw new Error('Cannot edit an offer that is already approved or sent');
  }

  if (discountAmount !== undefined) {
    offer.discountAmount = Number(discountAmount);
  }
  if (reason) {
    offer.reason = reason;
  }

  await offer.save();
  return offer;
};

/**
 * Dispatch an approved offer strictly to the individual customer via Telegram or Safe Demo Mode
 */
const dispatchCustomerOffer = async (offerId) => {
  const offer = await CustomerOffer.findOne({ offerId });
  if (!offer) {
    throw new Error('Customer offer not found');
  }

  if (offer.status !== 'APPROVED') {
    throw new Error(`Cannot send offer. Approval required first (current status: ${offer.status})`);
  }

  const merchant = await Merchant.findById(offer.merchantId);
  const customer = await Customer.findById(offer.customerId);

  if (!customer) {
    offer.status = 'FAILED';
    await offer.save();
    throw new Error('Target customer does not exist. Cannot send offer without a target customer.');
  }

  // Cross-merchant isolation check
  if (customer.merchantId.toString() !== offer.merchantId.toString()) {
    offer.status = 'FAILED';
    await offer.save();
    throw new Error('Security alert: Target customer does not belong to this merchant.');
  }

  offer.status = 'SENDING';
  await offer.save();

  const expiryFormatted = new Date(offer.expiresAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const telegramMessage = `Hi ${customer.displayName} 👋\n\nWe haven't seen you at ${merchant.businessName} recently.\n\nHere's a little comeback treat:\n\n₹${offer.discountAmount} OFF your next ${merchant.businessName} order.\n\nValid until ${expiryFormatted}.\n\nShow this message when you visit.\n\n— ${merchant.businessName}`;

  const hasRealTelegram = Boolean(
    TELEGRAM_BOT_TOKEN &&
    (customer.telegramChatId || offer.targetContact?.telegramChatId) &&
    process.env.N8N_MODE !== 'demo'
  );

  if (hasRealTelegram) {
    const chatId = customer.telegramChatId || offer.targetContact.telegramChatId;
    console.log(`[Telegram Real Dispatch] Sending individual offer to chat ID ${chatId}...`);
    try {
      const tgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: telegramMessage,
        }),
      });

      if (!tgRes.ok) {
        const errData = await tgRes.json().catch(() => ({}));
        throw new Error(errData.description || `Telegram HTTP ${tgRes.status}`);
      }

      offer.status = 'SENT';
      offer.sentAt = new Date();
      offer.execution = {
        mode: 'real',
        executionId: `tg_live_${Date.now()}`,
        telegramMessage,
        deliveryStatus: 'DELIVERED',
      };
      await offer.save();
      return offer;
    } catch (tgErr) {
      console.error('[Telegram Dispatch Error]:', tgErr.message);
      offer.status = 'FAILED';
      offer.execution = {
        mode: 'real',
        deliveryStatus: 'FAILED',
        telegramMessage,
      };
      await offer.save();
      throw new Error(`Telegram delivery failed: ${tgErr.message}`);
    }
  }

  // Safe Demo Mode Execution: Transparently simulate without claiming fake real delivery
  console.log(`[Telegram Demo Sandbox] Simulating 1-to-1 message dispatch to ${customer.displayName}...`);
  await new Promise((resolve) => setTimeout(resolve, 300));

  offer.status = 'SENT';
  offer.sentAt = new Date();
  offer.execution = {
    mode: 'demo',
    executionId: `demo_winback_${Date.now()}`,
    telegramMessage,
    deliveryStatus: 'SIMULATED_DEMO',
  };
  await offer.save();

  return offer;
};

/**
 * Record customer return / redemption outcome and feed into Cognee memory loop
 */
const recordCustomerOfferOutcome = async (offerId, { returnSpend = 420, daysUntilReturn = 3 } = {}) => {
  const offer = await CustomerOffer.findOne({ offerId });
  if (!offer) {
    throw new Error('Customer offer not found');
  }

  if (offer.status !== 'SENT') {
    throw new Error(`Cannot record outcome for offer in ${offer.status} status (must be SENT)`);
  }

  const merchant = await Merchant.findById(offer.merchantId);
  const customer = await Customer.findById(offer.customerId);

  // Update offer outcome fields
  offer.status = 'REDEEMED';
  offer.redeemedAt = new Date();
  offer.outcome = {
    returned: true,
    daysUntilReturn,
    redeemed: true,
    returnSpend: Number(returnSpend),
    incrementalRevenue: Math.max(0, Number(returnSpend) - offer.discountAmount),
    measuredAt: new Date(),
    learningRecorded: true,
  };
  await offer.save();

  // Create real return transaction in DB
  const returnTx = await Transaction.create({
    merchantId: offer.merchantId,
    customerId: offer.customerId,
    amount: Number(returnSpend),
    timestamp: new Date(),
    paymentStatus: 'completed',
    paymentMethod: 'upi',
    category: offer.trigger?.favoriteCategory || 'beverages',
    items: [
      {
        name: offer.trigger?.favoriteProduct || 'Cold Brew Coffee',
        category: offer.trigger?.favoriteCategory || 'beverages',
        quantity: 2,
        unitPrice: Math.round(Number(returnSpend) / 2),
        totalPrice: Number(returnSpend),
      },
    ],
  });

  // Update customer totals
  if (customer) {
    customer.lastTransactionAt = new Date();
    customer.totalSpend = (customer.totalSpend || 0) + Number(returnSpend);
    customer.totalTransactions = (customer.totalTransactions || 0) + 1;
    customer.customerSegment = 'repeat';
    await customer.save();
  }

  // Feed learning back into Memory (Cognee layer)
  const memoryContent = `₹${offer.discountAmount} win-back offer sent to ${offer.customerName}. Customer returned after ${daysUntilReturn} days and purchased ₹${returnSpend}.`;
  await Memory.create({
    merchantId: offer.merchantId,
    type: 'past_outcome',
    key: `winback_outcome_${offer.customerId}`,
    content: memoryContent,
    tags: ['win_back', 'retention', 'customer_return', 'proven_tactic'],
    metadata: {
      offerId: offer.offerId,
      customerId: offer.customerId,
      discountAmount: offer.discountAmount,
      returnSpend: Number(returnSpend),
      daysUntilReturn,
    },
    confidence: 0.95,
    source: 'system_observed',
  });

  return {
    offer,
    transaction: returnTx,
    memoryCreated: memoryContent,
  };
};

module.exports = {
  detectAndCreateCustomerOffers,
  getMerchantCustomerOffers,
  getCustomerOffers,
  approveCustomerOffer,
  rejectCustomerOffer,
  editCustomerOffer,
  dispatchCustomerOffer,
  recordCustomerOfferOutcome,
};
