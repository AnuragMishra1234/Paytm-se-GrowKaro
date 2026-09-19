# Personalized Customer Win-Back Offers

## Overview
The **Personalized Customer Win-Back Offers** system enables merchants (starting with Cafe Aroma) to autonomously identify loyal patrons who are slipping into dormancy, calculate individual churn risk, formulate a personalized discount offer (₹50 or ₹100), obtain merchant approval, and dispatch the offer strictly to that customer via n8n and Telegram.

Following the dispatch, GrowKaro monitors the customer's return, tracks incremental revenue, and feeds the outcome into the persistent **Cognee Business Memory** layer.

---

## 1. Customer Churn & Inactivity Detection

### Deterministic Rules (No AI Guesswork)
The detection logic in `backend/src/services/customerChurnService.js` evaluates actual MongoDB transaction records:

1. **Transaction Threshold**: The customer must have at least 3 historical successful transactions.
2. **Historical Visit Gap**: Sorts all completed transactions chronologically and computes the mean visit gap:
   $$\text{Average Visit Gap} = \frac{1}{N-1} \sum_{i=1}^{N-1} (t_i - t_{i-1})$$
3. **Inactivity Measurement**: Calculates days elapsed since the most recent purchase:
   $$\text{Days Inactive} = \frac{\text{Now} - t_{\text{last}}}{24 \times 60 \times 60 \times 1000}$$
4. **Churn Qualification Condition**:
   $$\text{Days Inactive} \ge 14 \quad \text{OR} \quad \text{Days Inactive} \ge 2.0 \times \text{Average Visit Gap}$$

### Deterministic Offer Sizing
- **High-Value Customer** ($\text{Total Spend} \ge ₹2,500$ OR $\text{Visits} \ge 10$):
  - Recommended Offer: **₹100 OFF**
  - Churn Risk: **HIGH**
- **Moderate-Value Customer**:
  - Recommended Offer: **₹50 OFF**
  - Churn Risk: **MEDIUM**

### Groq AI Role
Groq AI (`llama-3.3-70b-versatile`) is strictly confined to generating natural language rationale without altering pre-computed numbers:
> *"Rahul normally visits every 5 days, but has not visited for 17 days. They have made 14 visits, spent ₹3,240 historically, and frequently order Cold Brew Coffee."*

---

## 2. 1-to-1 Single Customer Association

Every offer created in the `CustomerOffer` model is tied exclusively to one customer:
- Mandatory `customerId` and `customerName`
- Target contact information (`telegramChatId`, `phone`)
- Rejection of cross-merchant dispatches (a merchant cannot target another merchant's patrons)
- Group broadcasts and mass campaigns are prohibited at the schema and route levels

---

## 3. Mandatory Merchant Approval Gate

Offers are never sent automatically.

```
[Detection Service] 
       ↓
Creates CustomerOffer (status: PENDING_APPROVAL)
       ↓
In-app notification sent to merchant
       ↓
Merchant views "Customer Opportunities" on Dashboard
       ↓
[Merchant Sign-Off]
  ├── Approve → moves to APPROVED → triggers n8n dispatch
  ├── Edit → updates discount amount (e.g. ₹50 / ₹100)
  └── Reject → moves to REJECTED → writes rejection memory
```

Unapproved offers (`status: DRAFT` or `status: PENDING_APPROVAL`) cannot be dispatched; attempts will throw `400 / 403 Approval required first`.

---

## 4. n8n & Telegram Dispatch Flow

### Architecture Pipeline
1. GrowKaro backend calls the n8n webhook or Telegram Bot API with:
   - `offerId`, `merchantId`, `customerId`
   - `status: APPROVED`
   - `targetTelegramChatId: <customer-specific chat ID>`
   - `messageText: <personalized message>`
2. n8n workflow (`backend/n8n/customer-winback-workflow.json`):
   - Validates that the payload contains individual chat ID and `status == APPROVED`.
   - Dispatches via the **Telegram Node** strictly to that individual chat ID.
   - Executes callback to GrowKaro marking the offer as `SENT`.

### 1-to-1 Telegram Message
```
Hi Rahul 👋

We haven't seen you at Cafe Aroma recently.

Here's a little comeback treat:

₹100 OFF your next Cafe Aroma order.

Valid until 26 Sep 2026.

Show this message when you visit.

— Cafe Aroma
```

---

## 5. Safe Demo Mode vs Real Telegram Delivery

The system provides transparent delivery reporting:
- **Real Mode**: Enabled when `TELEGRAM_BOT_TOKEN` and a valid customer `telegramChatId` are present in `.env`. Mode is labeled `real` and delivery status is `DELIVERED`.
- **Demo Mode**: When tokens are absent or running in development sandbox, GrowKaro simulates the dispatch with realistic latency (250ms), sets mode to `demo`, delivery status to `SIMULATED_DEMO`, and displays:
  > *"Demo message sent to Rahul (Safe Sandbox)"*
  
The UI never claims a real message was delivered when running in demo simulation.

---

## 6. Redemption & Outcome Measurement Loop

When a customer returns to redeem their offer:
1. **Simulation / Point-of-Sale Hook**: `POST /api/customer-offers/:offerId/outcome`
2. **Database Updates**:
   - Updates `CustomerOffer.status = 'REDEEMED'`
   - Inserts verified return order into `Transaction` collection (e.g., ₹420 UPI transaction)
   - Increments customer total spend and transaction count
3. **Persistent Memory Feedback**:
   - Stores learned tactic into MongoDB `Memory` collection:
     > *"₹100 win-back offer sent to Rahul. Customer returned after 3 days and purchased ₹420."*
   - Tagged with `['win_back', 'retention', 'proven_tactic']` for future AI recommendation prompts.

---

## 7. Duplicate Protection

- Before creating a new win-back opportunity, the system queries for existing offers in `['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENDING', 'SENT']` status for that `customerId`.
- If an active offer exists, new generation is skipped.

---

## 8. API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/merchants/:merchantId/customer-opportunities` | Fetch all pending & active customer win-back opportunities |
| `GET` | `/api/customers/:customerId/offers` | Fetch offers for a specific customer |
| `POST` | `/api/customer-offers/detect` | Manually run detection scan across merchant customers |
| `POST` | `/api/customer-offers/:offerId/approve` | Approve and trigger 1-to-1 dispatch |
| `POST` | `/api/customer-offers/:offerId/reject` | Reject offer and log feedback memory |
| `POST` | `/api/customer-offers/:offerId/edit` | Modify discount amount or rationale |
| `POST` | `/api/customer-offers/:offerId/send` | Dispatch an approved offer |
| `POST` | `/api/customer-offers/:offerId/outcome` | Record customer return, revenue, and memory |

---

## 9. Automated Test Suite

A complete 15-test test suite is available in `backend/tests/customerChurn.test.js`:
Run via:
```bash
cd backend && npm test
```
Tests pass with 100% assertions covering detection, visit gap calculations, sizing rules, cross-merchant isolation, and demo mode truth-in-reporting.
