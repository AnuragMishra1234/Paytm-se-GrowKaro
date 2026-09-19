const Transaction = require('../models/Transaction');
const Customer = require('../models/Customer');
const Merchant = require('../models/Merchant');
const Groq = require('groq-sdk');

let groqClient = null;
if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim() !== '') {
  try {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  } catch (err) {
    console.warn('Groq SDK initialization notice in churn service:', err.message);
  }
}

/**
 * Calculate deterministic visit gaps and churn indicators for a single customer.
 * Uses real transaction history.
 *
 * @param {ObjectId|string} customerId
 * @param {ObjectId|string} merchantId
 * @param {Date} [referenceDate] Optional reference date for deterministic testing
 */
const calculateCustomerChurnMetrics = async (customerId, merchantId, referenceDate = new Date()) => {
  const customer = await Customer.findOne({ _id: customerId, merchantId });
  if (!customer) {
    return null;
  }

  // Fetch all completed transactions for this customer at this merchant, ordered chronologically
  const transactions = await Transaction.find({
    customerId,
    merchantId,
    paymentStatus: 'completed',
  }).sort({ timestamp: 1 });

  // Rule 1: Must have at least 3 historical successful transactions
  if (transactions.length < 3) {
    return {
      qualifies: false,
      reason: 'Insufficient transaction history (minimum 3 required)',
      totalTransactions: transactions.length,
    };
  }

  // Rule 2: Calculate historical average visit gap between consecutive transactions
  let totalGapDays = 0;
  for (let i = 1; i < transactions.length; i++) {
    const prevTime = new Date(transactions[i - 1].timestamp).getTime();
    const currTime = new Date(transactions[i].timestamp).getTime();
    const gapDays = Math.max(0.5, (currTime - prevTime) / (1000 * 60 * 60 * 24));
    totalGapDays += gapDays;
  }
  const averageVisitGapDays = Math.max(1, Math.round(totalGapDays / (transactions.length - 1)));

  // Rule 3: Calculate days since last purchase
  const lastTx = transactions[transactions.length - 1];
  const lastPurchaseDate = new Date(lastTx.timestamp);
  const nowMs = new Date(referenceDate).getTime();
  const diffDays = (nowMs - lastPurchaseDate.getTime()) / (1000 * 60 * 60 * 24);
  const daysSinceLastPurchase = Math.max(0, Math.floor(diffDays));

  // Compute favorite product and category
  const productCounts = {};
  const categoryCounts = {};
  let totalSpend = 0;

  transactions.forEach((tx) => {
    totalSpend += tx.amount || 0;
    if (Array.isArray(tx.items)) {
      tx.items.forEach((item) => {
        if (item.name) {
          productCounts[item.name] = (productCounts[item.name] || 0) + (item.quantity || 1);
        }
        if (item.category) {
          categoryCounts[item.category] = (categoryCounts[item.category] || 0) + (item.quantity || 1);
        }
      });
    }
  });

  const favoriteProduct =
    Object.keys(productCounts).sort((a, b) => productCounts[b] - productCounts[a])[0] ||
    customer.favoriteProduct ||
    'Coffee';
  const favoriteCategory =
    Object.keys(categoryCounts).sort((a, b) => categoryCounts[b] - categoryCounts[a])[0] || 'beverages';

  // Rule 4: Churn detection condition:
  // (daysSinceLastPurchase >= 14) OR (daysSinceLastPurchase > 2.0 * averageVisitGapDays)
  const isInactive = daysSinceLastPurchase >= 14 || daysSinceLastPurchase >= 2.0 * averageVisitGapDays;

  if (!isInactive) {
    return {
      qualifies: false,
      reason: `Customer is active. Last visit was ${daysSinceLastPurchase} days ago (normal interval: ${averageVisitGapDays} days).`,
      customerId: customer._id,
      customerName: customer.displayName,
      totalVisits: transactions.length,
      daysSinceLastPurchase,
      averageVisitGapDays,
    };
  }

  // Rule 5: Deterministic Offer Sizing
  // High-value (spend >= 2500 or >= 10 visits) -> ₹100
  // Moderate-value -> ₹50
  const isHighValue = totalSpend >= 2500 || transactions.length >= 10;
  const recommendedOffer = isHighValue ? 100 : 50;
  const churnRisk = isHighValue && daysSinceLastPurchase >= 14 ? 'HIGH' : 'MEDIUM';

  // Format deterministic reasoning string (Groq may polish language, but figures remain strictly backend-derived)
  const deterministicReason = `Customer normally visits every ${averageVisitGapDays} days, but has not visited for ${daysSinceLastPurchase} days. They have made ${transactions.length} visits, spent ₹${Math.round(totalSpend).toLocaleString('en-IN')} historically, and frequently order ${favoriteProduct}.`;

  return {
    qualifies: true,
    customerId: customer._id,
    customerName: customer.displayName,
    contact: {
      phone: customer.phone || '',
      telegramChatId: customer.telegramChatId || '',
    },
    lastPurchaseDate: lastPurchaseDate.toISOString(),
    totalVisits: transactions.length,
    totalSpent: Math.round(totalSpend),
    averageVisitGapDays,
    daysSinceLastPurchase,
    favoriteCategory,
    favoriteProduct,
    churnRisk,
    recommendedOffer,
    reason: deterministicReason,
  };
};

/**
 * Optional Groq AI refinement of the natural language reason.
 * Adheres strictly to the pre-calculated numbers.
 */
const generateGroqExplanation = async (metrics, merchantName = 'Cafe Aroma') => {
  if (!groqClient) {
    return metrics.reason;
  }

  try {
    const prompt = `You are the AI retail partner for ${merchantName}.
Explain in 2 clear, concise sentences why GrowKaro flagged this customer for a win-back offer.
CRITICAL CONSTRAINT: Do NOT change any numbers or facts.
Customer: ${metrics.customerName}
Normal visit interval: every ${metrics.averageVisitGapDays} days
Days since last visit: ${metrics.daysSinceLastPurchase} days
Total visits: ${metrics.totalVisits}
Total spent: ₹${metrics.totalSpent}
Favorite item: ${metrics.favoriteProduct}
Recommended offer: ₹${metrics.recommendedOffer} OFF

Output ONLY the 2 sentence explanation.`;

    const response = await groqClient.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
      max_tokens: 150,
    });

    const aiText = response.choices?.[0]?.message?.content?.trim();
    return aiText || metrics.reason;
  } catch (err) {
    console.warn('Groq explanation fallback to deterministic rationale:', err.message);
    return metrics.reason;
  }
};

module.exports = {
  calculateCustomerChurnMetrics,
  generateGroqExplanation,
};
