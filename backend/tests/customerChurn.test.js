const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');

const Merchant = require('../src/models/Merchant');
const Customer = require('../src/models/Customer');
const Transaction = require('../src/models/Transaction');
const CustomerOffer = require('../src/models/CustomerOffer');
const Memory = require('../src/models/Memory');

const {
  calculateCustomerChurnMetrics,
} = require('../src/services/customerChurnService');
const {
  detectAndCreateCustomerOffers,
  approveCustomerOffer,
  rejectCustomerOffer,
  dispatchCustomerOffer,
  recordCustomerOfferOutcome,
} = require('../src/services/customerOfferService');

describe('Personalized Customer Win-Back Offers Test Suite', () => {
  let merchantA;
  let merchantB;
  let inactiveHighCustomer;
  let inactiveModerateCustomer;
  let activeCustomer;
  const now = new Date();

  before(async () => {
    await connectDB();

    // Clean test records
    await CustomerOffer.deleteMany({});
    await Transaction.deleteMany({});
    await Customer.deleteMany({});
    await Merchant.deleteMany({});
    await Memory.deleteMany({});

    // Setup Merchant A (Cafe Aroma)
    merchantA = await Merchant.create({
      businessName: 'Cafe Aroma',
      businessType: 'cafe',
      location: { city: 'Bengaluru' },
    });

    // Setup Merchant B (Competitor)
    merchantB = await Merchant.create({
      businessName: 'Fresh Kirana',
      businessType: 'kirana',
      location: { city: 'Mumbai' },
    });

    // 1. High-Value Inactive Customer (Rahul): 14 visits, ₹3,240 spend, ~5 day gap, last visit 17 days ago
    inactiveHighCustomer = await Customer.create({
      merchantId: merchantA._id,
      displayName: 'Rahul',
      phone: '+91 98765 43210',
      telegramChatId: 'demo_rahul_telegram_chat',
      favoriteProduct: 'Cold Brew Coffee',
      totalTransactions: 14,
      totalSpend: 3240,
      averageVisitGapDays: 5,
    });

    // Create 14 transactions for Rahul
    const rahulVisitDays = [82, 77, 72, 67, 62, 57, 52, 47, 42, 37, 32, 27, 22, 17];
    for (const daysAgo of rahulVisitDays) {
      const txDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      await Transaction.create({
        merchantId: merchantA._id,
        customerId: inactiveHighCustomer._id,
        amount: 231,
        timestamp: txDate,
        paymentStatus: 'completed',
        items: [{ name: 'Cold Brew Coffee', category: 'beverages', quantity: 1, unitPrice: 160, totalPrice: 160 }],
      });
    }

    // 2. Moderate-Value Inactive Customer: 4 visits, ₹480 spend, ~4 day gap, last visit 16 days ago
    inactiveModerateCustomer = await Customer.create({
      merchantId: merchantA._id,
      displayName: 'Priya',
      phone: '+91 98765 00000',
      telegramChatId: 'demo_priya_chat',
      totalTransactions: 4,
      totalSpend: 480,
      averageVisitGapDays: 4,
    });
    const priyaVisitDays = [28, 24, 20, 16];
    for (const daysAgo of priyaVisitDays) {
      const txDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      await Transaction.create({
        merchantId: merchantA._id,
        customerId: inactiveModerateCustomer._id,
        amount: 120,
        timestamp: txDate,
        paymentStatus: 'completed',
        items: [{ name: 'Cappuccino', category: 'beverages', quantity: 1, unitPrice: 120, totalPrice: 120 }],
      });
    }

    // 3. Active Customer (Visited 2 days ago, normal interval: 5 days)
    activeCustomer = await Customer.create({
      merchantId: merchantA._id,
      displayName: 'Amit',
      phone: '+91 98765 11111',
      totalTransactions: 5,
      totalSpend: 1000,
      averageVisitGapDays: 5,
    });
    const amitVisitDays = [22, 17, 12, 7, 2];
    for (const daysAgo of amitVisitDays) {
      const txDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      await Transaction.create({
        merchantId: merchantA._id,
        customerId: activeCustomer._id,
        amount: 200,
        timestamp: txDate,
        paymentStatus: 'completed',
        items: [{ name: 'Cold Brew Coffee', category: 'beverages', quantity: 1, unitPrice: 160, totalPrice: 160 }],
      });
    }
  });

  after(async () => {
    // Keep DB open if other daemon uses it, or close cleanly
  });

  it('1. Detect inactive repeat customer', async () => {
    const metrics = await calculateCustomerChurnMetrics(inactiveHighCustomer._id, merchantA._id, now);
    assert.strictEqual(metrics.qualifies, true);
    assert.strictEqual(metrics.customerName, 'Rahul');
    assert.strictEqual(metrics.totalVisits, 14);
  });

  it('2. Do not detect active customer', async () => {
    const metrics = await calculateCustomerChurnMetrics(activeCustomer._id, merchantA._id, now);
    assert.strictEqual(metrics.qualifies, false);
    assert.ok(metrics.reason.includes('Customer is active'));
  });

  it('3. Calculate days since purchase', async () => {
    const metrics = await calculateCustomerChurnMetrics(inactiveHighCustomer._id, merchantA._id, now);
    assert.strictEqual(metrics.daysSinceLastPurchase, 17);
  });

  it('4. Calculate average visit gap', async () => {
    const metrics = await calculateCustomerChurnMetrics(inactiveHighCustomer._id, merchantA._id, now);
    assert.strictEqual(metrics.averageVisitGapDays, 5);
  });

  it('5. Generate ₹50 offer for moderate value customer', async () => {
    const metrics = await calculateCustomerChurnMetrics(inactiveModerateCustomer._id, merchantA._id, now);
    assert.strictEqual(metrics.qualifies, true);
    assert.strictEqual(metrics.recommendedOffer, 50);
  });

  it('6. Generate ₹100 offer for high value customer', async () => {
    const metrics = await calculateCustomerChurnMetrics(inactiveHighCustomer._id, merchantA._id, now);
    assert.strictEqual(metrics.qualifies, true);
    assert.strictEqual(metrics.recommendedOffer, 100);
    assert.strictEqual(metrics.churnRisk, 'HIGH');
  });

  it('7. Do not create duplicate active offer', async () => {
    // Run detection twice
    const firstRun = await detectAndCreateCustomerOffers(merchantA._id, now);
    assert.ok(firstRun.created >= 1);

    const secondRun = await detectAndCreateCustomerOffers(merchantA._id, now);
    assert.strictEqual(secondRun.created, 0);
    assert.ok(secondRun.skippedActive >= 1);
  });

  it('8. Reject offer with reason', async () => {
    const offer = await CustomerOffer.findOne({
      customerId: inactiveModerateCustomer._id,
      merchantId: merchantA._id,
      status: 'PENDING_APPROVAL',
    });
    assert.ok(offer, 'Pending offer for Priya should exist');

    const rejected = await rejectCustomerOffer(offer.offerId, merchantA._id, 'Customer is travelling');
    assert.strictEqual(rejected.status, 'REJECTED');
    assert.strictEqual(rejected.rejectionReason, 'Customer is travelling');

    // Verify negative memory recorded
    const mem = await Memory.findOne({ key: `rejected_winback_${inactiveModerateCustomer._id}` });
    assert.ok(mem);
    assert.ok(mem.content.includes('Merchant rejected'));
  });

  it('9. Approve offer updates status to APPROVED and triggers dispatch', async () => {
    const offer = await CustomerOffer.findOne({
      customerId: inactiveHighCustomer._id,
      merchantId: merchantA._id,
      status: 'PENDING_APPROVAL',
    });
    assert.ok(offer, 'Pending offer for Rahul should exist');

    const approved = await approveCustomerOffer(offer.offerId, merchantA._id);
    assert.strictEqual(approved.status, 'SENT');
    assert.ok(approved.approvedAt instanceof Date);
    assert.ok(approved.sentAt instanceof Date);
  });

  it('10. Cannot send unapproved offer', async () => {
    // Create an unapproved draft offer
    const draftOffer = await CustomerOffer.create({
      offerId: `off_draft_${Date.now()}`,
      merchantId: merchantA._id,
      customerId: inactiveHighCustomer._id,
      customerName: 'Rahul',
      discountAmount: 100,
      reason: 'Draft test',
      trigger: {
        daysSinceLastPurchase: 17,
        averageVisitGapDays: 5,
        totalVisits: 14,
        totalSpent: 3240,
      },
      status: 'DRAFT',
      expiresAt: new Date(Date.now() + 86400000),
    });

    await assert.rejects(
      async () => {
        await dispatchCustomerOffer(draftOffer.offerId);
      },
      /Approval required first/
    );
  });

  it('11. Correct customerId is passed to dispatch', async () => {
    const offer = await CustomerOffer.findOne({
      customerId: inactiveHighCustomer._id,
      status: 'SENT',
    });
    assert.ok(offer);
    assert.strictEqual(offer.customerId.toString(), inactiveHighCustomer._id.toString());
  });

  it('12. Correct Telegram chat ID is stored and targeted', async () => {
    const offer = await CustomerOffer.findOne({
      customerId: inactiveHighCustomer._id,
      status: 'SENT',
    });
    assert.strictEqual(offer.targetContact.telegramChatId, 'demo_rahul_telegram_chat');
    assert.ok(offer.execution.telegramMessage.includes('Hi Rahul'));
    assert.ok(offer.execution.telegramMessage.includes('₹100 OFF'));
  });

  it('13. Outcome is recorded with revenue and memory learning loop', async () => {
    const offer = await CustomerOffer.findOne({
      customerId: inactiveHighCustomer._id,
      status: 'SENT',
    });

    const result = await recordCustomerOfferOutcome(offer.offerId, {
      returnSpend: 420,
      daysUntilReturn: 3,
    });

    assert.strictEqual(result.offer.status, 'REDEEMED');
    assert.strictEqual(result.offer.outcome.returned, true);
    assert.strictEqual(result.offer.outcome.returnSpend, 420);
    assert.strictEqual(result.offer.outcome.daysUntilReturn, 3);
    assert.strictEqual(result.transaction.amount, 420);

    // Verify learning memory loop
    const mem = await Memory.findOne({ key: `winback_outcome_${inactiveHighCustomer._id}` });
    assert.ok(mem);
    assert.ok(mem.content.includes('Rahul'));
    assert.ok(mem.content.includes('returned after 3 days'));
    assert.ok(mem.content.includes('420'));
  });

  it('14. Customer belongs to merchant (cross-merchant isolation prevents dispatch)', async () => {
    // Offer created for Merchant A with a customer belonging to Merchant B
    const rogueOffer = await CustomerOffer.create({
      offerId: `off_rogue_${Date.now()}`,
      merchantId: merchantA._id,
      customerId: inactiveHighCustomer._id, // Will be swapped to point to merchant B customer
      customerName: 'CrossMerchantPatron',
      discountAmount: 100,
      reason: 'Malicious cross-merchant trigger',
      trigger: {
        daysSinceLastPurchase: 17,
        averageVisitGapDays: 5,
        totalVisits: 5,
        totalSpent: 1000,
      },
      status: 'APPROVED',
      expiresAt: new Date(Date.now() + 86400000),
    });

    // Create customer belonging strictly to Merchant B
    const merchantBCustomer = await Customer.create({
      merchantId: merchantB._id,
      displayName: 'MerchantBCustomer',
      totalTransactions: 3,
      totalSpend: 500,
    });

    rogueOffer.customerId = merchantBCustomer._id;
    await rogueOffer.save();

    await assert.rejects(
      async () => {
        await dispatchCustomerOffer(rogueOffer.offerId);
      },
      /Security alert: Target customer does not belong to this merchant/
    );
  });

  it('15. Demo mode does not falsely claim real delivery', async () => {
    const offer = await CustomerOffer.findOne({
      customerId: inactiveHighCustomer._id,
      status: 'REDEEMED',
    });
    // In our test environment without real TELEGRAM_BOT_TOKEN set,
    // the execution mode is labeled 'demo' and deliveryStatus is 'SIMULATED_DEMO'.
    assert.strictEqual(offer.execution.mode, 'demo');
    assert.strictEqual(offer.execution.deliveryStatus, 'SIMULATED_DEMO');
  });
});
