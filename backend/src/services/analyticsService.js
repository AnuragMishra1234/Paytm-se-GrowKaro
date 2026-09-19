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
const calcKPIsForRange = async (merchantId, start, end) => {
  const result = await Transaction.aggregate([
    {
      $match: {
        merchantId,
        timestamp: { $gte: start, $lte: end },
        paymentStatus: 'completed',
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$amount' },
        transactionCount: { $sum: 1 },
        uniqueCustomers: { $addToSet: '$customerId' },
      },
    },
  ]);

  if (!result.length) {
    return { totalRevenue: 0, transactionCount: 0, aov: 0, uniqueCustomers: 0 };
  }

  const { totalRevenue, transactionCount, uniqueCustomers } = result[0];
  return {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    transactionCount,
    aov: transactionCount > 0 ? Math.round((totalRevenue / transactionCount) * 100) / 100 : 0,
    uniqueCustomers: uniqueCustomers.filter(Boolean).length,
  };
};

/**
 * Get dashboard KPIs: today vs yesterday comparison
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

  return {
    today: {
      revenue: today.totalRevenue,
      transactions: today.transactionCount,
      aov: today.aov,
      uniqueCustomers: today.uniqueCustomers,
    },
    yesterday: {
      revenue: yesterday.totalRevenue,
      transactions: yesterday.transactionCount,
      aov: yesterday.aov,
    },
    changes: {
      revenue: revenueChange,
      transactions: transactionChange,
    },
    repeatCustomerPct: repeatPct,
  };
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
  getRevenueTrend,
  getHourlySales,
  getWeekdaySales,
  getProductPerformance,
  getCategoryPerformance,
  getCustomerSegments,
  getTopCustomers,
  getRepeatCustomerRate,
};