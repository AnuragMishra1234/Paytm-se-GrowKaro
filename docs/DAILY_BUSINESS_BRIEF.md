# Proactive Daily Business Brief & Weekly Review

## 1. System Philosophy

GrowKaro does not wait for the merchant to open a chat and ask questions.

Every morning, GrowKaro proactively evaluates yesterday's complete business ledger, calculates grounded facts, and produces a structured, actionable brief before the store opens.

---

## 2. Deterministic Facts Before Generative Narrative

The Daily Business Brief strictly adheres to the **facts-first rule**:

```
[ Aggregated Metrics Calculation ]
- Yesterday Net Revenue & Gross Sales
- Yesterday Deducted Refunds (₹)
- Order Count & Average Order Value (AOV)
- New vs. Repeat Customers
- Top Selling Product by Revenue & Units
- Weakest Performing Product
         ↓
[ Anomaly & Change Detection ]
- Revenue % variance vs. previous day
- Refund spike identification
- Shift in customer retention
         ↓
[ Grounded LLM Synthesis (Groq LLaMA 3.3) ]
- "What Matters": Executive summary of key drivers
- "What Needs Attention": Immediate risks or operational issues
- "Top Opportunity": Recommended campaign or pairing for the day
```

---

## 3. Schema Structure

The `DailyBrief` model captures both quantitative facts and operational direction:

```javascript
{
  merchantId: ObjectId,
  date: "2026-03-19",
  dateFormatted: "Thursday, Mar 19, 2026",
  greeting: "GOOD MORNING! Here is Cafe Aroma's Executive Brief.",
  yesterdayPerformance: {
    revenue: 4250,
    grossRevenue: 5450,
    refunds: 1200,
    refundCount: 1,
    transactions: 24,
    aov: 177,
    revenueChange: -8.5
  },
  topProduct: "Belgian Chocolate Cake (1kg)",
  weakestProduct: "Masala Chai Pot",
  newCustomers: 7,
  repeatCustomers: 17,
  whatChanged: [
    "Refunds increased by ₹1,200 due to single large cake return",
    "Repeat customer share remained resilient at 70.8%",
    "Morning breakfast rush delivered 42% of daily volume"
  ],
  whatMatters: "...",
  whatNeedsAttention: "...",
  recommendedAction: "...",
  opportunity: "...",
  externalContextNote: "Sunny spring weather, +24°C expected"
}
```
