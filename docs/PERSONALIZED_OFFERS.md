# GrowKaro: Grounded Personalized Offer Recommendation Engine

GrowKaro's personalized offer engine does not broadcast blanket discounts. It formulates targeted 1-to-1 customer opportunities grounded in individual purchasing behavior.

---

## 1. Grounded 4-Part Rationale Framework

Every recommended offer explicitly documents four concrete rationales to the merchant and marketing team:

### Example: Ananya Das (At-Risk Loyal Patron)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                   GROUNDED 4-PART OFFER RATIONALE                        │
├──────────────────────────────────────────────────────────────────────────┤
│ 1. WHY THIS CUSTOMER?                                                    │
│    Ananya Das is one of your top patrons with 12 lifetime visits and      │
│    ₹8,450 total spend. Her loyalty is proven (top 5% of customer base).  │
│                                                                          │
│ 2. WHY THIS PRODUCT?                                                     │
│    Cold Brew Coffee is ordered in 100% of her visits (observed 15 items  │
│    ordered). Highly targeted product match.                              │
│                                                                          │
│ 3. WHY NOW?                                                              │
│    She hasn't visited in 10 days, exceeding her typical 3-4 day return   │
│    cadence. High probability of lapsing if not re-engaged now.           │
│                                                                          │
│ 4. WHY THIS OFFER?                                                       │
│    A personalized ₹50 saving on her favorite Cold Brew & Croissant combo │
│    triggers emotional recognition and immediate visit incentive.         │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Supported Intelligent Offer Types

| Offer Type | Target Customer Segment | Purpose | Example Copy |
| :--- | :--- | :--- | :--- |
| `AT_RISK_LOYAL_COMEBACK` | `LOYAL CUSTOMER` + `AT RISK` | Re-engage lapsing regular before habit shifts | *"We miss seeing you! Enjoy Cold Brew + Croissant for ₹179 today."* |
| `VIP_REPEAT_REWARD` | `LOYAL CUSTOMER` + `HIGH VALUE` | Acknowledge continuous patronage & lift AOV | *"Take 50% off any freshly baked pastry with your specialty coffee."* |
| `FAVORITE_PRODUCT_DISCOUNT` | `PRODUCT SPECIFIC` | Reward high product affinity | *"Enjoy 15% off your favorite Cold Brew on your next visit."* |
| `TIME_BASED_OFFER` | Customers with specific weekday/hour affinity | Stimulate traffic during slow merchant windows | *"Beat the afternoon lull: 2-hour combo deal."* |

---

## 3. Manager Approval Gate Integration

To ensure store control and brand protection:
1. **Rahul Verma** reviews the customer opportunity in `/employee`.
2. Rahul inspects the 4 rationales and customizes the WhatsApp message copy.
3. Rahul clicks **[Submit to Manager for Approval]**.
4. The system creates an `Action` with `approvalStatus: 'PENDING'`.
5. **Priya Sharma (Store Manager)** receives an urgent notification.
6. Once Priya approves the proposal, a task is dispatched back to Rahul to verify the scheduled dispatch, after which simulated n8n execution fires.
