const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const { syncMerchantTelemetry, getKolkataDayRange } = require('./telemetrySyncService');

/**
 * analyticsService.js
 *
 * All business metric calculations for Phase 1.
 * These are deterministic — no LLM involved.
 *
 * Design principle (from WHOLE-PROJECT.md):
 *   "Code calculates facts. LLM explains facts." (Phase 2)
 *
 * Phase 2 Growth Detector will import these same functions and build on top.
 */

/**
 * Get date range for a given period in Asia/Kolkata
 */
const getDateRange = (days) => {
  const today = getKolkataDayRange(0);
  const earliest = getKolkataDayRange(days - 1);
  return { start: earliest.start, end: today.end };
};

/**
 * Get today's date range in Asia/Kolkata
 */
const getTodayRange = () => {
  return getKolkataDayRange(0);
};

/**
 * Get yesterday's date range in Asia/Kolkata
 */
const getYesterdayRange = () => {
  return getKolkataDayRange(1);
};

/**
 * Calculate KPIs for a time window
 */
/**
 * Calculate KPIs for a time window with Profit/Loss and Refund accounting
 */
const calcKPIsForRange = async (merchantId, start, end) => {
  const transactions = await Transaction.find({
    merchantId,
    timestamp: { $gte: start, $lte: end },
    paymentStatus: { $ne: 'failed' },
  }).lean();

  let grossRevenue = 0;
  let salesCount = 0;
  let refundTotal = 0;
  let refundCount = 0;
  let totalCost = 0;
  let costEntries = 0;
  const uniqueCustomerSet = new Set();

  transactions.forEach((tx) => {
    const isRefund = tx.transactionType === 'REFUND' || tx.paymentStatus === 'refunded';
    if (isRefund) {
      refundTotal += (tx.amount || 0);
      refundCount += 1;
    } else {
      grossRevenue += (tx.amount || 0);
      salesCount += 1;
      if (tx.customerId) uniqueCustomerSet.add(tx.customerId.toString());

      // COGS calculation if cost information is present
      if (Array.isArray(tx.items) && tx.items.length > 0) {
        tx.items.forEach((item) => {
          if (item.unitCost != null && !isNaN(item.unitCost) && item.unitCost > 0) {
            totalCost += (item.unitCost * (item.quantity || 1));
            costEntries += 1;
          }
        });
      } else if (tx.cost != null && !isNaN(tx.cost) && tx.cost > 0) {
        totalCost += tx.cost;
        costEntries += 1;
      }
    }
  });

  const netRevenue = Math.max(0, grossRevenue - refundTotal);
  const aov = salesCount > 0 ? Math.round((netRevenue / salesCount) * 100) / 100 : 0;
  const refundRate = grossRevenue > 0 ? Math.round((refundTotal / grossRevenue) * 1000) / 10 : 0;
  const hasCostData = costEntries > 0;
  const grossProfit = hasCostData ? Math.round((netRevenue - totalCost) * 100) / 100 : null;
  const grossMargin = (hasCostData && netRevenue > 0) ? Math.round(((netRevenue - totalCost) / netRevenue) * 1000) / 10 : null;

  return {
    totalRevenue: netRevenue, // Preserved for backwards compatibility with existing UI
    netRevenue,
    grossRevenue,
    refundTotal,
    refundCount,
    refundRate,
    transactionCount: salesCount,
    aov,
    uniqueCustomers: uniqueCustomerSet.size,
    hasCostData,
    cogs: hasCostData ? Math.round(totalCost * 100) / 100 : null,
    grossProfit,
    grossMargin,
  };
};

/**
 * Deterministically compute Business Pulse / Health status
 * Scoring rules:
 * - Base score: 75
 * - Sales trend: +10 (>=+10%), +5 (>0%), -10 (<=-5%), -15 (<=-12%), -25 (<=-25%)
 * - Refund rate: +5 (0%), -10 (>5%), -20 (>10% or >=3 refunds)
 * - Repeat rate: +5 (>=35%), -5 (<20%)
 * - Declining items: -5 per declining product (max -15)
 * Score >= 75: HEALTHY | 50-74: NEEDS_ATTENTION | <50: RISK_DETECTED
 */
const calculateBusinessPulse = async (merchantId, kpis) => {
  let score = 75;
  const factors = [];

  // 1. Sales Trend Factor
  const revChange = kpis?.changes?.revenue ?? 0;
  if (revChange >= 10) {
    score += 10;
    factors.push({ label: `Daily Sales Surge (+${revChange.toFixed(1)}%)`, impact: '+10', type: 'POSITIVE' });
  } else if (revChange > 0) {
    score += 5;
    factors.push({ label: `Moderate Sales Growth (+${revChange.toFixed(1)}%)`, impact: '+5', type: 'POSITIVE' });
  } else if (revChange <= -25) {
    score -= 25;
    factors.push({ label: `Critical Revenue Drop (${revChange.toFixed(1)}%)`, impact: '-25', type: 'NEGATIVE' });
  } else if (revChange <= -12) {
    score -= 15;
    factors.push({ label: `Sizable Sales Drop (${revChange.toFixed(1)}%)`, impact: '-15', type: 'NEGATIVE' });
  } else if (revChange < 0) {
    score -= 5;
    factors.push({ label: `Minor Daily Softness (${revChange.toFixed(1)}%)`, impact: '-5', type: 'NEGATIVE' });
  }

  // 2. Refund Activity Factor
  const refundRate = kpis?.today?.refundRate ?? 0;
  const refundCount = kpis?.today?.refundCount ?? 0;
  if (refundRate > 10 || refundCount >= 3) {
    score -= 20;
    factors.push({ label: `Elevated Refund Activity (${refundRate}%, ${refundCount} claims)`, impact: '-20', type: 'NEGATIVE' });
  } else if (refundRate > 5 || refundCount >= 1) {
    score -= 10;
    factors.push({ label: `Refund Activity Observed (${refundRate}%)`, impact: '-10', type: 'NEGATIVE' });
  } else if (refundCount === 0) {
    score += 5;
    factors.push({ label: 'Zero Refund Claims Today', impact: '+5', type: 'POSITIVE' });
  }

  // 3. Repeat Customer Ratio
  const repeatRate = kpis?.repeatCustomerPct ?? 0;
  if (repeatRate >= 35) {
    score += 5;
    factors.push({ label: `Strong Repeat Patronage (${repeatRate}%)`, impact: '+5', type: 'POSITIVE' });
  } else if (repeatRate > 0 && repeatRate < 20) {
    score -= 5;
    factors.push({ label: `Sub-Optimal Retention (${repeatRate}%)`, impact: '-5', type: 'NEGATIVE' });
  }

  // 4. Declining Product Check
  try {
    const decliningCount = await Product.countDocuments({ merchantId, trend: 'declining', isActive: true });
    if (decliningCount > 0) {
      const deduction = Math.min(15, decliningCount * 5);
      score -= deduction;
      factors.push({ label: `${decliningCount} Item(s) Showing Softening Demand`, impact: `-${deduction}`, type: 'NEGATIVE' });
    }
  } catch {}

  score = Math.max(15, Math.min(98, score));

  let status = 'HEALTHY';
  let label = 'Healthy';
  let badge = 'bg-emerald-100 text-emerald-800 border-emerald-300';
  let icon = '🟢';
  let summary = 'Operational indicators demonstrate healthy revenue velocity and standard return rates.';

  if (score < 50) {
    status = 'RISK_DETECTED';
    label = 'Risk Detected';
    badge = 'bg-rose-100 text-rose-800 border-rose-300';
    icon = '🔴';
    summary = 'Immediate operational intervention advised due to notable sales decline or elevated refund activity.';
  } else if (score < 75) {
    status = 'NEEDS_ATTENTION';
    label = 'Needs Attention';
    badge = 'bg-amber-100 text-amber-800 border-amber-300';
    icon = '🟡';
    summary = 'Moderate performance drag observed. Monitor mid-day lull and product mix to recover momentum.';
  }

  return {
    score,
    status,
    label,
    icon,
    badge,
    summary,
    factors,
    lastEvaluatedAt: new Date(),
  };
};

/**
 * Get dashboard KPIs: today vs yesterday comparison + Business Pulse
 */
const getDashboardKPIs = async (merchantId) => {
  await syncMerchantTelemetry(merchantId);
  const { start: todayStart, end: todayEnd } = getTodayRange();
  const { start: ystdStart, end: ystdEnd } = getYesterdayRange();

  const [today, yesterday] = await Promise.all([
    calcKPIsForRange(merchantId, todayStart, todayEnd),
    calcKPIsForRange(merchantId, ystdStart, ystdEnd),
  ]);

  const revenueChange =
    yesterday.totalRevenue > 0
      ? Math.round(((today.totalRevenue - yesterday.totalRevenue) / yesterday.totalRevenue) * 1000) / 10
      : 0;

  const transactionChange =
    yesterday.transactionCount > 0
      ? Math.round(((today.transactionCount - yesterday.transactionCount) / yesterday.transactionCount) * 1000) / 10
      : 0;

  // Repeat customer % for today
  const repeatPct = await getRepeatCustomerRate(merchantId, 30);

  const kpis = {
    today: {
      revenue: today.totalRevenue,
      netSales: today.netRevenue,
      grossSales: today.grossRevenue,
      refunds: today.refundTotal,
      refundCount: today.refundCount,
      refundRate: today.refundRate,
      transactions: today.transactionCount,
      aov: today.aov,
      uniqueCustomers: today.uniqueCustomers,
      hasCostData: today.hasCostData,
      cogs: today.cogs,
      grossProfit: today.grossProfit,
      grossMargin: today.grossMargin,
    },
    yesterday: {
      revenue: yesterday.totalRevenue,
      netSales: yesterday.netRevenue,
      grossSales: yesterday.grossRevenue,
      refunds: yesterday.refundTotal,
      refundCount: yesterday.refundCount,
      refundRate: yesterday.refundRate,
      transactions: yesterday.transactionCount,
      aov: yesterday.aov,
    },
    changes: {
      revenue: revenueChange,
      transactions: transactionChange,
    },
    repeatCustomerPct: repeatPct,
  };

  const businessPulse = await calculateBusinessPulse(merchantId, kpis);
  kpis.businessPulse = businessPulse;

  return kpis;
};

/**
 * Revenue trend: daily revenue for the last N days
 */
const getRevenueTrend = async (merchantId, days = 30) => {
  await syncMerchantTelemetry(merchantId);
  const { start, end } = getDateRange(days);

  const result = await Transaction.aggregate([
    {
      $match: {
        merchantId,
        timestamp: { $gte: start, $lte: end },
        paymentStatus: 'completed',
        transactionType: { $ne: 'REFUND' },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$timestamp', timezone: 'Asia/Kolkata' },
        },
        revenue: { $sum: '$amount' },
        transactions: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Fill in missing days with 0
  const trendMap = {};
  result.forEach((r) => {
    trendMap[r._id] = { revenue: Math.round(r.revenue), transactions: r.transactions };
  });

  const trend = [];
  for (let i = days - 1; i >= 0; i--) {
    const { dateStr: key } = getKolkataDayRange(i);
    trend.push({
      date: key,
      revenue: trendMap[key]?.revenue || 0,
      transactions: trendMap[key]?.transactions || 0,
    });
  }

  return trend;
};

/**
 * Hourly sales: aggregate revenue by hour of day (0-23) for the last N days
 */
const getHourlySales = async (merchantId, days = 30) => {
  const { start, end } = getDateRange(days);

  const result = await Transaction.aggregate([
    {
      $match: {
        merchantId,
        timestamp: { $gte: start, $lte: end },
        paymentStatus: 'completed',
        transactionType: { $ne: 'REFUND' },
      },
    },
    {
      $group: {
        _id: {
          $hour: { date: '$timestamp', timezone: 'Asia/Kolkata' },
        },
        revenue: { $sum: '$amount' },
        transactions: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const hourMap = {};
  result.forEach((r) => {
    hourMap[r._id] = { revenue: Math.round(r.revenue), transactions: r.transactions };
  });

  return Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    label: h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`,
    revenue: hourMap[h]?.revenue || 0,
    transactions: hourMap[h]?.transactions || 0,
  }));
};

/**
 * Weekday sales: aggregate revenue by day of week (0=Sun..6=Sat)
 */
const getWeekdaySales = async (merchantId, weeks = 8) => {
  const days = weeks * 7;
  const { start, end } = getDateRange(days);

  const result = await Transaction.aggregate([
    {
      $match: {
        merchantId,
        timestamp: { $gte: start, $lte: end },
        paymentStatus: 'completed',
        transactionType: { $ne: 'REFUND' },
      },
    },
    {
      $group: {
        _id: {
          $dayOfWeek: { date: '$timestamp', timezone: 'Asia/Kolkata' },
        },
        revenue: { $sum: '$amount' },
        transactions: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayMap = {};
  result.forEach((r) => {
    // MongoDB dayOfWeek: 1=Sun, 2=Mon, ..., 7=Sat → map to 0–6
    dayMap[r._id - 1] = { revenue: Math.round(r.revenue), transactions: r.transactions };
  });

  return dayNames.map((name, i) => ({
    day: name,
    revenue: dayMap[i]?.revenue || 0,
    transactions: dayMap[i]?.transactions || 0,
  }));
};

/**
 * Product performance: top products by revenue
 */
const getProductPerformance = async (merchantId) => {
  const products = await Product.find({ merchantId, isActive: true })
    .sort({ revenue: -1 })
    .lean();

  const totalRevenue = products.reduce((sum, p) => sum + (p.revenue || 0), 0);

  return products.map((p) => ({
    id: p._id,
    name: p.name,
    category: p.category,
    price: p.price,
    unitsSold: p.unitsSold,
    revenue: Math.round(p.revenue || 0),
    revenueShare: totalRevenue > 0 ? Math.round((p.revenue / totalRevenue) * 1000) / 10 : 0,
    trend: p.trend,
  }));
};

/**
 * Category performance: revenue breakdown by category
 */
const getCategoryPerformance = async (merchantId, days = 30) => {
  const { start, end } = getDateRange(days);

  const result = await Transaction.aggregate([
    {
      $match: {
        merchantId,
        timestamp: { $gte: start, $lte: end },
        paymentStatus: 'completed',
      },
    },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.category',
        revenue: { $sum: '$items.totalPrice' },
        unitsSold: { $sum: '$items.quantity' },
        transactions: { $sum: 1 },
      },
    },
    { $sort: { revenue: -1 } },
  ]);

  const total = result.reduce((s, r) => s + r.revenue, 0);
  return result.map((r) => ({
    category: r._id,
    revenue: Math.round(r.revenue),
    unitsSold: r.unitsSold,
    transactions: r.transactions,
    revenueShare: total > 0 ? Math.round((r.revenue / total) * 1000) / 10 : 0,
  }));
};

/**
 * Repeat customer rate: % of active customers with 2+ transactions in last N days
 */
const getRepeatCustomerRate = async (merchantId, days = 30) => {
  const { start, end } = getDateRange(days);

  const result = await Transaction.aggregate([
    {
      $match: {
        merchantId,
        timestamp: { $gte: start, $lte: end },
        paymentStatus: 'completed',
        customerId: { $ne: null },
      },
    },
    {
      $group: {
        _id: '$customerId',
        count: { $sum: 1 },
      },
    },
  ]);

  if (!result.length) return 0;
  const repeat = result.filter((r) => r.count >= 2).length;
  return Math.round((repeat / result.length) * 1000) / 10;
};

/**
 * Customer segment breakdown
 */
const getCustomerSegments = async (merchantId) => {
  const inactiveCutoff = new Date();
  inactiveCutoff.setDate(inactiveCutoff.getDate() - 30);

  const [total, inactive, vip, repeat, newCust] = await Promise.all([
    Customer.countDocuments({ merchantId }),
    Customer.countDocuments({ merchantId, lastTransactionAt: { $lt: inactiveCutoff } }),
    Customer.countDocuments({ merchantId, customerSegment: 'vip' }),
    Customer.countDocuments({ merchantId, customerSegment: 'repeat' }),
    Customer.countDocuments({ merchantId, customerSegment: 'new' }),
  ]);

  return { total, inactive, vip, repeat, new: newCust };
};

/**
 * Top customers by total spend
 */
const getTopCustomers = async (merchantId, limit = 10) => {
  const customers = await Customer.find({ merchantId })
    .sort({ totalSpend: -1 })
    .limit(limit)
    .lean();

  return customers.map((c) => ({
    id: c._id,
    displayName: c.displayName,
    totalTransactions: c.totalTransactions,
    totalSpend: Math.round(c.totalSpend),
    averageOrderValue: Math.round(c.averageOrderValue),
    lastTransactionAt: c.lastTransactionAt,
    customerSegment: c.customerSegment,
  }));
};

/**
 * Full dashboard data: aggregated KPIs + trends for one API call
 */
const getDashboardData = async (merchantId, revenueDays = 30) => {
  const [kpis, revenueTrend, hourlySales, weekdaySales] = await Promise.all([
    getDashboardKPIs(merchantId),
    getRevenueTrend(merchantId, revenueDays),
    getHourlySales(merchantId, revenueDays),
    getWeekdaySales(merchantId, 8),
  ]);

  return { kpis, revenueTrend, hourlySales, weekdaySales };
};

module.exports = {
  getDashboardData,
  getDashboardKPIs,
  calculateBusinessPulse,
  calcKPIsForRange,
  getRevenueTrend,
  getHourlySales,
  getWeekdaySales,
  getProductPerformance,
  getCategoryPerformance,
  getCustomerSegments,
  getTopCustomers,
  getRepeatCustomerRate,
};