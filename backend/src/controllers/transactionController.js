const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Merchant = require('../models/Merchant');
const Insight = require('../models/Insight');
const Notification = require('../models/Notification');
const analyticsService = require('../services/analyticsService');
const growthDetectorService = require('../services/growthDetectorService');
const aiService = require('../services/aiService');
const { emitToMerchant } = require('../socket');

/**
 * transactionController.js
 *
 * Implements the core live reactive loop:
 * Transaction ➔ Data Update ➔ Analytics ➔ AI Intelligence ➔ Notification ➔ Real-Time Socket
 */

/**
 * POST /api/merchants/:id/transactions
 * Create a live transaction (SALE or REFUND) manually or via demo
 */
const createTransaction = async (req, res, next) => {
  try {
    const merchantId = new mongoose.Types.ObjectId(req.params.id || req.body.merchantId);
    const merchant = await Merchant.findById(merchantId);
    if (!merchant) {
      return res.status(404).json({ success: false, message: 'Merchant not found' });
    }

    const {
      transactionType = 'SALE',
      amount,
      discount = 0,
      paymentMethod = 'upi',
      paymentStatus: rawPaymentStatus,
      items = [],
      customerName,
      customerPhone,
      customerId: rawCustomerId,
      isLiveSimulated = false,
      timestamp: customTimestamp,
    } = req.body;

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid positive amount is required' });
    }

    const numAmount = Number(amount);
    const isRefund = transactionType === 'REFUND';
    const paymentStatus = rawPaymentStatus || (isRefund ? 'refunded' : 'completed');
    const timestamp = customTimestamp ? new Date(customTimestamp) : new Date();

    // 1. Resolve or create Customer
    let customerId = null;
    let customerDoc = null;
    if (rawCustomerId && mongoose.Types.ObjectId.isValid(rawCustomerId)) {
      customerId = new mongoose.Types.ObjectId(rawCustomerId);
      customerDoc = await Customer.findById(customerId);
    } else if (customerName || customerPhone) {
      const searchCrit = { merchantId };
      if (customerPhone) searchCrit.phone = customerPhone;
      else if (customerName) searchCrit.displayName = new RegExp(`^${customerName.trim()}$`, 'i');

      customerDoc = await Customer.findOne(searchCrit);
      if (!customerDoc && customerName) {
        customerDoc = new Customer({
          merchantId,
          displayName: customerName.trim(),
          phone: customerPhone || '',
          totalTransactions: 0,
          totalSpend: 0,
          firstTransactionAt: timestamp,
          customerSegment: 'new',
        });
      }
    }

    if (customerDoc) {
      if (isRefund) {
        customerDoc.totalSpend = Math.max(0, (customerDoc.totalSpend || 0) - numAmount);
      } else {
        customerDoc.totalTransactions = (customerDoc.totalTransactions || 0) + 1;
        customerDoc.totalSpend = (customerDoc.totalSpend || 0) + numAmount;
        customerDoc.lastTransactionAt = timestamp;
        if (!customerDoc.firstTransactionAt) customerDoc.firstTransactionAt = timestamp;
        customerDoc.averageOrderValue = Math.round(customerDoc.totalSpend / customerDoc.totalTransactions);

        // Deterministic segment assignment
        if (customerDoc.totalTransactions >= 2 && customerDoc.totalSpend >= 5000) {
          customerDoc.customerSegment = 'vip';
        } else if (customerDoc.totalTransactions >= 2) {
          customerDoc.customerSegment = 'repeat';
        } else {
          customerDoc.customerSegment = 'new';
        }
      }
      await customerDoc.save();
      customerId = customerDoc._id;
    }

    // 2. Format Items and Update Product metrics
    const formattedItems = [];
    let calculatedCost = 0;
    let primaryCategory = 'general';

    for (const rawItem of items) {
      const itemName = rawItem.name || rawItem.productName || 'Custom Item';
      const qty = Number(rawItem.quantity) || 1;
      const uPrice = Number(rawItem.unitPrice) || Math.round(numAmount / qty);
      const uCost = rawItem.unitCost != null ? Number(rawItem.unitCost) : null;
      const tPrice = Number(rawItem.totalPrice) || (qty * uPrice);

      if (uCost != null && uCost > 0) {
        calculatedCost += (uCost * qty);
      }

      formattedItems.push({
        productId: rawItem.productId || null,
        name: itemName,
        productName: itemName,
        category: rawItem.category || 'general',
        quantity: qty,
        unitPrice: uPrice,
        unitCost: uCost,
        totalPrice: tPrice,
      });

      primaryCategory = rawItem.category || primaryCategory;

      // Update Product model in DB if productId or match by name
      try {
        let prod = null;
        if (rawItem.productId && mongoose.Types.ObjectId.isValid(rawItem.productId)) {
          prod = await Product.findById(rawItem.productId);
        }
        if (!prod && itemName) {
          prod = await Product.findOne({ merchantId, name: new RegExp(`^${itemName}$`, 'i') });
        }
        if (prod) {
          if (isRefund) {
            prod.refundUnits = (prod.refundUnits || 0) + qty;
            prod.revenue = Math.max(0, (prod.revenue || 0) - tPrice);
          } else {
            prod.unitsSold = (prod.unitsSold || 0) + qty;
            prod.revenue = (prod.revenue || 0) + tPrice;
            if (prod.stock != null) {
              prod.stock = Math.max(0, prod.stock - qty);
            }
          }
          await prod.save();
        }
      } catch (err) {
        console.warn(`[Transaction] Could not update Product '${itemName}':`, err.message);
      }
    }

    // 3. Create Transaction Document
    const billNumber = req.body.billNumber || ((isRefund ? 'REF-#' : 'BILL-#') + Math.floor(10000 + Math.random() * 90000));

    const transaction = new Transaction({
      merchantId,
      customerId,
      amount: numAmount,
      billNumber,
      transactionType,
      discount: Number(discount) || 0,
      cost: calculatedCost > 0 ? calculatedCost : null,
      isLiveSimulated,
      timestamp,
      paymentStatus,
      paymentMethod,
      items: formattedItems,
      category: primaryCategory,
      sourceProvider: isLiveSimulated ? 'LIVE_SIMULATION' : 'PAYTM',
      sourceType: 'UNIFIED_LINKED',
    });

    const savedTx = await transaction.save();

    // 4. Recalculate KPIs and Business Pulse
    const kpis = await analyticsService.getDashboardKPIs(merchantId);

    // 5. Intelligent Anomaly & Signal Detection
    let newInsight = null;
    let newNotification = null;

    // A. Check Refund Surge / Loss Signal
    if (isRefund) {
      const refundSignal = growthDetectorService.detectRefundAnomalies(kpis);
      if (refundSignal) {
        newInsight = new Insight({
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
        await newInsight.save();

        newNotification = new Notification({
          merchantId,
          type: 'WARNING',
          category: 'WARNING',
          priority: refundSignal.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
          title: refundSignal.title,
          message: refundSignal.whatHappened,
          relatedInsightId: newInsight._id,
        });
        await newNotification.save();
      }
    } else {
      // B. Check Sales Surge or High Value Customer
      const revChange = kpis?.changes?.revenue ?? 0;
      if (revChange >= 20) {
        const spikeSignal = growthDetectorService.detectSalesFluctuation(kpis);
        if (spikeSignal) {
          newInsight = new Insight({
            merchantId,
            type: spikeSignal.type,
            severity: spikeSignal.severity,
            category: spikeSignal.category,
            title: spikeSignal.title,
            whatHappened: spikeSignal.whatHappened,
            whyItMatters: spikeSignal.whyItMatters,
            whatToDo: spikeSignal.whatToDo,
            recommendedAction: spikeSignal.recommendedAction,
            comparisonPeriod: spikeSignal.comparisonPeriod,
            confidence: 'HIGH',
            dataSource: 'PAYTM_LINKED_POS',
            metric: spikeSignal.metric,
            currentValue: spikeSignal.currentValue,
            baselineValue: spikeSignal.baselineValue,
            changePercentage: spikeSignal.changePercentage,
            evidence: spikeSignal.evidence,
            priorityScore: spikeSignal.priorityScore,
          });
          await newInsight.save();

          newNotification = new Notification({
            merchantId,
            type: 'POSITIVE_TREND',
            category: 'POSITIVE_TREND',
            priority: 'MEDIUM',
            title: spikeSignal.title,
            message: spikeSignal.whatHappened,
            relatedInsightId: newInsight._id,
          });
          await newNotification.save();
        }
      }
    }

    // 6. Broadcast Real-Time Events via Socket.IO
    const bNum = savedTx.billNumber || ((isRefund ? 'REF-#' : 'BILL-#') + savedTx._id.toString().slice(-5).toUpperCase());
    const broadcastPayload = {
      transaction: {
        _id: savedTx._id,
        billNumber: bNum,
        amount: savedTx.amount,
        totalBill: savedTx.amount,
        discount: savedTx.discount || 0,
        transactionType: savedTx.transactionType,
        paymentStatus: savedTx.paymentStatus,
        paymentMethod: savedTx.paymentMethod,
        timestamp: savedTx.timestamp,
        items: savedTx.items || [],
        customer: customerDoc?.displayName || customerName || 'Walk-in Customer',
        customerName: customerDoc?.displayName || customerName || 'Walk-in Customer',
        customerPhone: customerDoc?.phone || customerPhone || '',
        customerSegment: customerDoc?.customerSegment || 'regular',
        primaryItem: savedTx.items?.[0]?.name || (isRefund ? 'Order Refund' : 'Counter Sale'),
      },
      kpis,
      businessPulse: kpis.businessPulse,
      newInsight: newInsight ? { _id: newInsight._id, title: newInsight.title, category: newInsight.category } : null,
      notification: newNotification ? { _id: newNotification._id, title: newNotification.title, type: newNotification.type } : null,
    };

    emitToMerchant(merchantId, 'transaction:created', broadcastPayload);
    emitToMerchant(merchantId, 'dashboard:update', { kpis, businessPulse: kpis.businessPulse });

    res.status(201).json({
      success: true,
      message: `${transactionType} transaction of ₹${numAmount} processed successfully.`,
      data: {
        transaction: savedTx,
        kpis,
        businessPulse: kpis.businessPulse,
        insight: newInsight,
        notification: newNotification,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/merchants/:id/transactions/live-feed
 * Retrieve latest live transactions stream (latest 20)
 */
const getLiveFeed = async (req, res, next) => {
  try {
    const merchantId = new mongoose.Types.ObjectId(req.params.id);
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);

    const transactions = await Transaction.find({ merchantId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('customerId', 'displayName phone customerSegment')
      .lean();

    const formatted = transactions.map((t) => {
      const isRef = t.transactionType === 'REFUND' || t.paymentStatus === 'refunded';
      const bNum = t.billNumber || ((isRef ? 'REF-#' : 'BILL-#') + t._id.toString().slice(-5).toUpperCase());
      return {
        _id: t._id,
        billNumber: bNum,
        amount: t.amount,
        totalBill: t.amount,
        discount: t.discount || 0,
        transactionType: t.transactionType || (isRef ? 'REFUND' : 'SALE'),
        paymentStatus: t.paymentStatus,
        paymentMethod: t.paymentMethod,
        timestamp: t.timestamp,
        customer: t.customerId?.displayName || 'Walk-in Customer',
        customerPhone: t.customerId?.phone || '',
        customerSegment: t.customerId?.customerSegment || 'new',
        items: t.items && t.items.length > 0 ? t.items : [
          {
            name: isRef ? 'Order Return Credit' : 'In-Store Item Sale',
            quantity: 1,
            unitPrice: t.amount,
            totalPrice: t.amount,
            category: t.category || 'general',
          }
        ],
        primaryItem: t.items?.[0]?.name || (isRef ? 'Order Return' : 'Direct Payment'),
        isLiveSimulated: t.isLiveSimulated || false,
      };
    });

    res.json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createTransaction,
  getLiveFeed,
};
