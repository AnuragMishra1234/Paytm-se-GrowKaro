const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Customer = require('../models/Customer');
const Merchant = require('../models/Merchant');

/**
 * telemetrySyncService.js
 *
 * Ensures transaction telemetry remains realistic, active, and anchored to
 * "Today" and "Yesterday" regardless of calendar days elapsing.
 *
 * Problem it solves:
 * If a seed script generates transactions relative to the day it ran, subsequent
 * days leave "Today" and "Yesterday" with 0 transactions, showing ₹0 revenue and
 * broken trend lines in live presentations.
 *
 * This service seamlessly shifts historical telemetry forward so that:
 * 1. "Today" always has active ongoing business transactions.
 * 2. "Yesterday" always has a full day of baseline transactions.
 * 3. Cafe Aroma has the canonical afternoon lull (2:00 PM – 4:30 PM: 6 orders, ₹1,850).
 * 4. Trend charts smoothly connect to today without plummeting to 0.
 */

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
const lastSyncTimeByMerchant = new Map();

/**
 * Extract YYYY-MM-DD parts in Asia/Kolkata timezone
 */
function getKolkataDateParts(d = new Date()) {
  const str = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const [year, month, day] = str.split('-').map(Number);
  return { year, month, day, str };
}

/**
 * Compute precise [start, end] Date range for a day N days ago in Asia/Kolkata
 */
function getKolkataDayRange(daysAgo = 0) {
  const { year, month, day } = getKolkataDateParts(new Date());
  const midnightUTC = new Date(Date.UTC(year, month - 1, day - daysAgo, 0, 0, 0, 0));
  const start = new Date(midnightUTC.getTime() - IST_OFFSET_MS);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
  const dateStr = start.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  return { start, end, dateStr };
}

/**
 * Helper to generate a Date at a specific IST hour and minute for today or N days ago
 */
function getKolkataTime(daysAgo, hour, minute = 0) {
  const { start } = getKolkataDayRange(daysAgo);
  return new Date(start.getTime() + (hour * 60 + minute) * 60 * 1000);
}

/**
 * Ensure Cafe Aroma has the canonical 6 afternoon lull transactions totaling ₹1,850
 */
async function ensureCafeAromaLull(merchantId) {
  const lullStart = getKolkataTime(0, 14, 0); // 2:00 PM IST today
  const lullEnd = getKolkataTime(0, 16, 30);   // 4:30 PM IST today

  const existingLullTxs = await Transaction.find({
    merchantId,
    timestamp: { $gte: lullStart, $lte: lullEnd },
    paymentStatus: 'completed',
  });

  const existingSum = existingLullTxs.reduce((s, t) => s + t.amount, 0);

  // If already exactly 6 orders and ₹1,850, we're pristine
  if (existingLullTxs.length === 6 && existingSum === 1850) {
    return;
  }

  // Remove any mismatched transactions in this specific 2:00 - 4:30 PM window
  await Transaction.deleteMany({
    merchantId,
    timestamp: { $gte: lullStart, $lte: lullEnd },
  });

  // Get customer references for realistic association
  const customers = await Customer.find({ merchantId }).limit(10).lean();
  const getCustomer = (idx) => (customers.length > idx ? customers[idx]._id : null);

  const canonicalLullOrders = [
    {
      minuteOffset: 15, // 2:15 PM
      amount: 240,
      customerId: getCustomer(0),
      items: [
        { name: 'Cold Brew Coffee', category: 'beverages', quantity: 1, unitPrice: 160, totalPrice: 160 },
        { name: 'Croissant', category: 'food', quantity: 1, unitPrice: 80, totalPrice: 80 },
      ],
      category: 'beverages',
    },
    {
      minuteOffset: 40, // 2:40 PM
      amount: 230,
      customerId: getCustomer(1),
      items: [
        { name: 'Cold Brew Coffee', category: 'beverages', quantity: 1, unitPrice: 160, totalPrice: 160 },
        { name: 'Muffin', category: 'food', quantity: 1, unitPrice: 70, totalPrice: 70 },
      ],
      category: 'beverages',
    },
    {
      minuteOffset: 65, // 3:05 PM
      amount: 240,
      customerId: getCustomer(2),
      items: [
        { name: 'Cappuccino', category: 'beverages', quantity: 1, unitPrice: 120, totalPrice: 120 },
        { name: 'Chocolate Cake Slice', category: 'food', quantity: 1, unitPrice: 120, totalPrice: 120 },
      ],
      category: 'beverages',
    },
    {
      minuteOffset: 95, // 3:35 PM
      amount: 420,
      customerId: getCustomer(3),
      items: [
        { name: 'Cold Brew Coffee', category: 'beverages', quantity: 2, unitPrice: 160, totalPrice: 320 },
        { name: 'Veg Sandwich', category: 'food', quantity: 1, unitPrice: 100, totalPrice: 100 },
      ],
      category: 'beverages',
    },
    {
      minuteOffset: 120, // 4:00 PM
      amount: 140,
      customerId: getCustomer(4),
      items: [
        { name: 'Masala Chai', category: 'beverages', quantity: 1, unitPrice: 60, totalPrice: 60 },
        { name: 'Croissant', category: 'food', quantity: 1, unitPrice: 80, totalPrice: 80 },
      ],
      category: 'beverages',
    },
    {
      minuteOffset: 140, // 4:20 PM
      amount: 580,
      customerId: getCustomer(5),
      items: [
        { name: 'Cold Brew Coffee', category: 'beverages', quantity: 3, unitPrice: 160, totalPrice: 480 },
        { name: 'Veg Sandwich', category: 'food', quantity: 1, unitPrice: 100, totalPrice: 100 },
      ],
      category: 'beverages',
    },
  ];

  const docs = canonicalLullOrders.map((o) => ({
    _id: new mongoose.Types.ObjectId(),
    merchantId,
    customerId: o.customerId,
    amount: o.amount,
    timestamp: new Date(lullStart.getTime() + o.minuteOffset * 60 * 1000),
    paymentStatus: 'completed',
    paymentMethod: 'upi',
    items: o.items,
    category: o.category,
  }));

  await Transaction.insertMany(docs);
  console.log(`[telemetrySync] Injected canonical afternoon lull for Cafe Aroma: 6 orders, ₹1,850`);
}

/**
 * Synchronize telemetry for a given merchant so dates terminate on "Today"
 */
async function syncMerchantTelemetry(merchantId) {
  const mIdStr = merchantId.toString();
  const nowMs = Date.now();
  const lastSync = lastSyncTimeByMerchant.get(mIdStr);

  // Throttle: don't re-run more than once every 60 seconds per merchant
  if (lastSync && nowMs - lastSync < 60000) {
    return;
  }
  lastSyncTimeByMerchant.set(mIdStr, nowMs);

  const merchant = await Merchant.findById(merchantId).select('businessName').lean();
  if (!merchant) return;

  const latestTx = await Transaction.findOne({ merchantId }).sort({ timestamp: -1 });
  if (!latestTx) return;

  const latestDateStr = latestTx.timestamp.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const todayDateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

  if (latestDateStr < todayDateStr) {
    const [ly, lm, ld] = latestDateStr.split('-').map(Number);
    const [ty, tm, td] = todayDateStr.split('-').map(Number);
    const diffDays = Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(ly, lm - 1, ld)) / (24 * 60 * 60 * 1000));

    if (diffDays > 0) {
      console.log(`[telemetrySync] Shifting transactions for ${merchant.businessName} forward by ${diffDays} day(s)...`);
      const shiftMs = diffDays * 24 * 60 * 60 * 1000;

      await Transaction.updateMany(
        { merchantId },
        [{ $set: { timestamp: { $add: ['$timestamp', shiftMs] } } }]
      );

      await Customer.updateMany(
        { merchantId },
        [
          {
            $set: {
              lastTransactionAt: {
                $cond: [
                  { $ifNull: ['$lastTransactionAt', false] },
                  { $add: ['$lastTransactionAt', shiftMs] },
                  '$lastTransactionAt',
                ],
              },
              firstTransactionAt: {
                $cond: [
                  { $ifNull: ['$firstTransactionAt', false] },
                  { $add: ['$firstTransactionAt', shiftMs] },
                  '$firstTransactionAt',
                ],
              },
            },
          },
        ]
      );
      console.log(`[telemetrySync] Telemetry shifted successfully to ${todayDateStr}`);
    }
  }

  // If this is Cafe Aroma, ensure the afternoon lull matches the official presentation ground truth
  if (/Cafe Aroma/i.test(merchant.businessName)) {
    await ensureCafeAromaLull(merchantId);
  }
}

/**
 * Synchronize telemetry for all active merchants
 */
async function syncAllMerchants() {
  const merchants = await Merchant.find({ isActive: true }).select('_id businessName');
  for (const m of merchants) {
    await syncMerchantTelemetry(m._id);
  }
}

module.exports = {
  syncMerchantTelemetry,
  syncAllMerchants,
  getKolkataDayRange,
  getKolkataDateParts,
  getKolkataTime,
};
