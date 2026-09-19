const Transaction = require('../models/Transaction');
const Merchant = require('../models/Merchant');

/**
 * dataSourceService.js — Multi-Source Ingestion & Order-Payment Linking Architecture
 *
 * Enforces the core rule:
 * Payment Data (Paytm) != Order/Product Data (Merchant POS / Billing).
 * If a Paytm transaction (e.g. ₹500) is received without a linked POS order ticket,
 * product line items are marked as UNKNOWN_UNAVAILABLE with LOW CONFIDENCE.
 * We NEVER hallucinate or guess products.
 */

/**
 * Ingest / normalize a Paytm payment webhook or record
 */
const ingestPaytmPayment = async (merchantId, {
  externalOrderId,
  externalTransactionId,
  amount,
  timestamp = new Date(),
  paymentMethod = 'upi',
  paymentStatus = 'completed',
}) => {
  if (!merchantId || !amount) {
    throw new Error('merchantId and amount are required for payment ingestion');
  }

  // Check if a POS order ticket already exists for this externalOrderId
  let existingOrder = null;
  if (externalOrderId) {
    existingOrder = await Transaction.findOne({
      merchantId,
      externalOrderId,
      sourceType: 'ORDER',
    });
  }

  // If matching POS order exists, unify them with HIGH confidence
  if (existingOrder && existingOrder.items && existingOrder.items.length > 0) {
    existingOrder.sourceType = 'UNIFIED_LINKED';
    existingOrder.sourceProvider = 'PAYTM';
    existingOrder.externalTransactionId = externalTransactionId || existingOrder.externalTransactionId;
    existingOrder.paymentStatus = paymentStatus;
    existingOrder.paymentMethod = paymentMethod;
    existingOrder.dataConfidence = 'HIGH';
    existingOrder.productInfoStatus = 'AVAILABLE';
    existingOrder.amount = amount;
    await existingOrder.save();

    return {
      linked: true,
      confidence: 'HIGH',
      transaction: existingOrder,
      message: `Paytm Payment (${externalTransactionId || 'TXN'}) successfully linked to POS Order (${externalOrderId})`,
    };
  }

  // Unlinked payment: product information is honestly marked UNKNOWN
  const paymentTx = await Transaction.create({
    merchantId,
    amount,
    timestamp: new Date(timestamp),
    paymentStatus,
    paymentMethod,
    items: [],
    category: 'uncategorized',
    sourceProvider: 'PAYTM',
    sourceType: 'PAYMENT',
    externalOrderId: externalOrderId || null,
    externalTransactionId: externalTransactionId || null,
    dataConfidence: 'LOW',
    productInfoStatus: 'UNKNOWN_UNAVAILABLE',
  });

  return {
    linked: false,
    confidence: 'LOW',
    transaction: paymentTx,
    message: 'Payment recorded. Product details are UNKNOWN / UNAVAILABLE pending POS order ticket linkage.',
  };
};

/**
 * Ingest an itemized POS order ticket from merchant's billing system
 */
const ingestMerchantPOSOrder = async (merchantId, {
  externalOrderId,
  items = [],
  totalAmount,
  timestamp = new Date(),
  category = 'general',
}) => {
  if (!merchantId || !externalOrderId) {
    throw new Error('merchantId and externalOrderId are required for POS order ingestion');
  }

  const computedTotal = totalAmount || items.reduce((sum, item) => sum + (item.totalPrice || item.unitPrice * (item.quantity || 1)), 0);

  // Check if a payment has already arrived for this externalOrderId
  const existingPayment = await Transaction.findOne({
    merchantId,
    externalOrderId,
    sourceType: 'PAYMENT',
  });

  if (existingPayment) {
    // Unify payment and items
    existingPayment.sourceType = 'UNIFIED_LINKED';
    existingPayment.items = items.map((it) => ({
      productId: it.productId || null,
      name: it.name || it.productName,
      productName: it.name || it.productName,
      category: it.category || category || 'uncategorized',
      quantity: it.quantity || 1,
      unitPrice: it.unitPrice || 0,
      totalPrice: it.totalPrice || (it.unitPrice || 0) * (it.quantity || 1),
    }));
    existingPayment.category = category || existingPayment.items[0]?.category || 'uncategorized';
    existingPayment.dataConfidence = 'HIGH';
    existingPayment.productInfoStatus = 'AVAILABLE';
    await existingPayment.save();

    return {
      linked: true,
      confidence: 'HIGH',
      transaction: existingPayment,
      message: `POS Order (${externalOrderId}) linked to existing Paytm Payment (${existingPayment.externalTransactionId})`,
    };
  }

  // Create standalone POS order record pending payment confirmation
  const orderTx = await Transaction.create({
    merchantId,
    amount: computedTotal,
    timestamp: new Date(timestamp),
    paymentStatus: 'completed',
    paymentMethod: 'upi',
    items: items.map((it) => ({
      productId: it.productId || null,
      name: it.name || it.productName,
      productName: it.name || it.productName,
      category: it.category || category || 'uncategorized',
      quantity: it.quantity || 1,
      unitPrice: it.unitPrice || 0,
      totalPrice: it.totalPrice || (it.unitPrice || 0) * (it.quantity || 1),
    })),
    category,
    sourceProvider: 'MERCHANT_POS',
    sourceType: 'ORDER',
    externalOrderId,
    dataConfidence: 'MEDIUM',
    productInfoStatus: 'AVAILABLE',
  });

  return {
    linked: false,
    confidence: 'MEDIUM',
    transaction: orderTx,
    message: `POS Order (${externalOrderId}) recorded with ${items.length} item(s).`,
  };
};

/**
 * Manually or automatically trigger reconciliation between unlinked payments and POS tickets
 */
const reconcileOrderPaymentPairs = async (merchantId) => {
  const unlinkedPayments = await Transaction.find({
    merchantId,
    sourceType: 'PAYMENT',
    externalOrderId: { $ne: null },
  });

  let reconciledCount = 0;
  for (const payment of unlinkedPayments) {
    const posOrder = await Transaction.findOne({
      merchantId,
      externalOrderId: payment.externalOrderId,
      sourceType: 'ORDER',
    });

    if (posOrder) {
      payment.sourceType = 'UNIFIED_LINKED';
      payment.items = posOrder.items;
      payment.category = posOrder.category;
      payment.dataConfidence = 'HIGH';
      payment.productInfoStatus = 'AVAILABLE';
      await payment.save();

      // Remove redundant standalone order
      await Transaction.findByIdAndDelete(posOrder._id);
      reconciledCount++;
    }
  }

  return {
    reconciledCount,
    message: `Reconciliation complete: ${reconciledCount} order-payment pairs linked.`,
  };
};

/**
 * Get comprehensive data source status and confidence metrics for merchant
 */
const getDataSourceStatus = async (merchantId) => {
  const totalCount = await Transaction.countDocuments({ merchantId });
  if (totalCount === 0) {
    return {
      totalCount: 0,
      confidence: { high: 0, medium: 0, low: 0 },
      linkedPercentage: 100,
      activeSources: ['PAYTM'],
      summary: 'No transactions recorded yet.',
    };
  }

  const [sources, confidences] = await Promise.all([
    Transaction.aggregate([
      { $match: { merchantId } },
      { $group: { _id: '$sourceProvider', count: { $sum: 1 } } },
    ]),
    Transaction.aggregate([
      { $match: { merchantId } },
      { $group: { _id: '$dataConfidence', count: { $sum: 1 } } },
    ]),
  ]);

  const sourceMap = {};
  sources.forEach((s) => (sourceMap[s._id] = s.count));

  const confMap = { HIGH: 0, MEDIUM: 0, LOW: 0 };
  confidences.forEach((c) => {
    if (c._id && confMap[c._id] !== undefined) {
      confMap[c._id] = c.count;
    }
  });

  const highCount = confMap.HIGH || 0;
  const linkedPct = Math.round((highCount / totalCount) * 100);

  return {
    totalTransactions: totalCount,
    sourceBreakdown: sourceMap,
    confidenceBreakdown: confMap,
    linkedPercentage: linkedPct,
    primaryStatus: linkedPct >= 80 ? 'HIGH_CONFIDENCE' : linkedPct >= 40 ? 'MEDIUM_CONFIDENCE' : 'LOW_CONFIDENCE',
    badgeText: linkedPct >= 80 ? 'Paytm + Linked POS (High Confidence)' : 'Paytm Payments Only (Product Data Unavailable)',
    honestyStatement: linkedPct >= 80
      ? 'Over 80% of Paytm payments are verified and linked to itemized POS order tickets. Full basket and product-level intelligence is active.'
      : 'Transactions without matched POS order tickets report payment revenue accurately, but product-level claims are withheld to prevent AI hallucinations.',
  };
};

module.exports = {
  ingestPaytmPayment,
  ingestMerchantPOSOrder,
  reconcileOrderPaymentPairs,
  getDataSourceStatus,
};
