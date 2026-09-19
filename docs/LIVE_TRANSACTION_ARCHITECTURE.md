# Live Transaction Simulation Architecture

## 1. System Overview & Principle

GrowKaro does not treat transactions as static ledger entries or simple database rows. In GrowKaro, every transaction initiates a reactive, deterministic intelligence pipeline:

```
[ Transaction Ingestion ]
         ↓
[ Atomic Database Commit (MongoDB) ]
         ↓
[ Real-Time Telemetry & Aggregations ]
         ↓
[ Anomaly & Trend Detectors ]
         ↓
[ Business Pulse Recalibration (0-100) ]
         ↓
[ Notification Center Alert Generation ]
         ↓
[ Socket.IO Broadcaster (Room: merchant_{id}) ]
         ↓
[ Dashboard Live Stream & UI Repaint ]
```

---

## 2. Transaction Model Schema

Every transaction is recorded with accounting precision:

```javascript
{
  merchantId: ObjectId,           // Demo or Real merchant
  transactionId: String,          // e.g. "TXN-1710892019-8124"
  amount: Number,                 // Net transaction total (₹)
  cost: Number,                   // Total Cost of Goods Sold (COGS)
  transactionType: "SALE" | "REFUND",
  paymentStatus: "completed" | "refunded" | "pending" | "failed",
  paymentMethod: "upi" | "card" | "cash" | "paytm_qr",
  items: [
    {
      productId: ObjectId,
      name: String,
      category: String,
      quantity: Number,
      unitPrice: Number,
      unitCost: Number,           // Preserved for Gross Margin accounting
      totalPrice: Number
    }
  ],
  customerId: ObjectId,           // Linked customer record (or null for walk-ins)
  discount: Number,
  timestamp: Date,
  isLiveSimulated: Boolean,       // Distinguishes demo entries from uploaded datasets
  sourceProvider: "LIVE_SIMULATION" | "MANUAL_ENTRY" | "PAYTM_UPI" | "POS_IMPORT"
}
```

---

## 3. Real-Time Socket.IO Bus

- **Transport**: WebSockets with HTTP polling fallback.
- **Merchant Rooms**: Upon connection, clients emit `join:merchant` with their `merchantId`. All transactional events are strictly scoped to `merchant_${merchantId}`.
- **Emitted Events**:
  - `transaction:created`: Transmits the newly created transaction payload alongside the newly calculated `pulse`.
  - `dashboard:update`: Broadcasts real-time changes when simulation scenarios (such as sales drops or refunds) are executed.
  - `brief:ready`: Signals when a proactive morning brief or weekly review has finished computation.

---

## 4. Grounded Numbers & Zero Fabrication Rule

1. **Deterministic Pipeline**: Numbers are never invented by an LLM. Revenue, refund totals, refund percentages, and business pulse scores are computed deterministically by `analyticsService.js` and `growthDetectorService.js`.
2. **Groq LLM Persona**: Groq is used solely to generate business narratives and tactical explanations based strictly on the computed facts.
3. **Data Isolation**: Simulated transactions and demo scenarios alter only the active demo merchant state (`isLiveSimulated: true`), preserving real uploaded CSV/XLSX customer datasets intact.
