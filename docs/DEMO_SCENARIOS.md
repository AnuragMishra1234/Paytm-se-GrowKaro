# One-Click Judge Demo Scenarios & Walkthrough Guide

## 1. Overview

To enable hackathon judges and evaluators to experience GrowKaro's complete loop in under 3 minutes without manual setup, GrowKaro features a prominent **One-Click Judge Demo Control Panel** directly on the dashboard.

---

## 2. Five Primary Judge Actions

### Action 1: 🟢 Simulate Sale (+₹450)
- **What happens**:
  - Adds a counter order for 2 Cold Brews + 1 Fresh Butter Croissant (₹450).
  - Updates inventory sales and customer ledger.
  - Recalculates today's Gross and Net Revenue.
  - Pushes real-time event to Socket.IO.
- **Expected UI response**:
  - `● LIVE` badge pulses.
  - New row appears instantly at the top of the Live Transactions feed.
  - Net Revenue increments by ₹450 without page reload.

---

### Action 2: 🔴 Simulate Refund (-₹1,200)
- **What happens**:
  - Records an order return (Belgian Chocolate Cake, ₹1,200).
  - Triggers refund anomaly detection (`LOSS_SIGNAL` due to return $\ge ₹800$).
  - Recalculates Net Sales (Gross minus ₹1,200).
  - Lowers Business Pulse score due to refund deduction.
  - Generates an `ACT_NOW` notification in the Notification Center.
- **Expected UI response**:
  - Negative refund badge appears in transaction feed.
  - Total Refunds card increases by ₹1,200.
  - Business Pulse reflects the return penalty.
  - Bell icon shows an unread alert: *"Refund Spike Detected: Belgian Chocolate Cake"*.

---

### Action 3: 📉 Simulate Sales Drop (-35%)
- **What happens**:
  - Simulates a sudden weekday slump or traffic lull.
  - Evaluates Business Pulse with negative trend penalty ($-25$ points).
  - Pulse status moves to `🟡 NEEDS ATTENTION` or `🔴 RISK DETECTED`.
  - Generates a proactive recovery campaign proposal.
- **Expected UI response**:
  - Business Pulse gauge drops below 75 with warning badge.
  - AI Priority Feed surfaces a proactive traffic recovery action.

---

### Action 4: 🧠 Run Autonomous AI Analysis
- **What happens**:
  - Triggers full anomaly detection pipeline across products, hours, and customers.
  - Queries Cognee memory layer for historical merchant preferences.
  - Calls Groq LLM (LLaMA 3.3 70B) to formulate prioritized insights with concrete revenue upside.
- **Expected UI response**:
  - AI Priority Feed updates with fresh categorized cards (`ACT_NOW`, `OPPORTUNITY`, `WARNING`).

---

### Action 5: 🌅 Generate Daily Brief
- **What happens**:
  - Computes yesterday's exact facts: gross revenue, refunds, top seller, weakest product, customer repeat rate.
  - Formulates structured Morning Executive Brief.
  - Stores brief in MongoDB and notifies merchant.
- **Expected UI response**:
  - Daily Business Brief tab displays yesterday's financial summary with grounded numbers and bulleted "What Changed" breakdown.

---

## 3. Data Isolation Guarantee

All demo actions:
- Operate strictly on demo transactions flagged with `isLiveSimulated: true`.
- Never overwrite or corrupt uploaded CSV/XLSX merchant datasets.
- Can be reset at any time via the demo reset endpoint (`POST /api/demo/reset`).
