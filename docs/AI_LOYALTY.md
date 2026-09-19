# GrowKaro: AI Customer Loyalty & Deterministic Segmentation

GrowKaro's AI Customer Loyalty engine rejects hallucinated scoring and black-box points systems. Instead, it computes **deterministic numerical facts** directly from real merchant transaction records in MongoDB, then applies multi-tag customer segmentation and grounded rationale generation.

---

## 1. Deterministic Metric Calculation Formulas

All metrics are calculated inside [`backend/src/services/loyaltyService.js`](file:///e:/GrowKaro/backend/src/services/loyaltyService.js) by querying real transactions matching `{ merchantId, customerId, paymentStatus: 'completed' }`:

| Metric | Calculation Method | Benchmark Example (Ananya Das) |
| :--- | :--- | :--- |
| **Total Visits** | Count of unique completed transactions | **12 visits** |
| **Total Spend** | Sum of all transaction amounts ($\sum \text{amount}$) | **₹8,450** |
| **Average Order Value (AOV)** | $\text{Total Spend} \div \text{Total Visits}$ | **₹704.17** |
| **Last Visit Date** | $\max(\text{timestamp})$ across customer transactions | **10 days ago** |
| **Days Inactive** | $\lfloor (\text{Date.now()} - \text{lastVisit}) \div (86,400,000) \rfloor$ | **10 days** |
| **Favorite Product** | Item name with highest quantity in transaction item arrays | **Cold Brew Coffee** (15 items across 12 orders) |
| **Favorite Category** | Category with highest order frequency | **Beverages** |
| **Preferred Day Pattern** | Day of week distribution comparison (Weekends vs Weekdays) | **Weekdays** (Monday, Wednesday) |

> [!IMPORTANT]
> The Groq LLM is **never** asked to calculate raw metrics. All mathematical aggregation is performed in Node.js and MongoDB. The LLM is used solely to generate grounded natural language explanations from those pre-computed facts.

---

## 2. Multi-Tag Customer Segmentation Taxonomy

A customer may simultaneously belong to multiple segments based on deterministic rules:

```
                                  Customer Transaction History
                                               │
               ┌───────────────────────────────┴───────────────────────────────┐
               ▼                                                               ▼
        Frequency Tiers                                                   Value Tiers
     • NEW CUSTOMER (1 visit)                                        • HIGH VALUE (Spend ≥ ₹5,000 or AOV ≥ ₹600)
     • REPEAT CUSTOMER (≥ 2 visits)
     • LOYAL CUSTOMER (≥ 5 visits)
               │                                                               │
               └───────────────────────────────┬───────────────────────────────┘
                                               ▼
                                      Activity & Affinity
                         • RECENTLY ACTIVE (≤ 3 days ago)
                         • AT RISK (≥ 2 visits, 7 to 45 days inactive)
                         • INACTIVE (> 45 days inactive)
                         • PRODUCT SPECIFIC (e.g. COLD BREW CUSTOMER)
```

### Benchmark Customer: Ananya Das
- **Visits**: 12
- **Spend**: ₹8,450 (AOV: ₹704)
- **Inactive**: 10 days
- **Assigned Tags**: `['LOYAL CUSTOMER', 'REPEAT CUSTOMER', 'HIGH VALUE', 'AT RISK', 'COLD BREW CUSTOMER']`

---

## 3. Scientific Non-Causal Attribution Standard

All campaign and offer outcome measurements adhere to strict scientific honesty:
- **Permitted Phrases**:
  - *"Observed purchases after offer"*
  - *"Customer returned after offer"*
  - *"Observed revenue during measurement window"*
- **Prohibited Phrases**:
  - *"This offer caused a 20% lift"* (unless evaluated via randomized A/B holdout testing).

---

## 4. Cognee Memory Integration

Customer preferences (e.g. favorite drink, preferred visit times, past offer responses) are persisted in GrowKaro's semantic memory layer ([`backend/src/models/Memory.js`](file:///e:/GrowKaro/backend/src/models/Memory.js)). This context informs future recommendations without replacing MongoDB as the transactional source of truth.
