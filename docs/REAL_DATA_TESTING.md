# GrowKaro: "Test With Real Data" Architecture & User Guide

The "Test With Real Data" system allows prospective merchants and evaluators to upload an external business dataset (CSV/XLSX) and immediately experience GrowKaro's deterministic analytics, AI insights, and customer loyalty intelligence on their own data.

---

## 1. Zero-Native-Binary Ingestion Pipeline

```
 [CSV Upload] ──► [RFC-4180 Pure JS Parser] ──► [Interactive Column Mapping]
                                                        │
                                                        ▼
 [Quality Report] ◄── [Validation & Duplicate Filter] ──┘
         │
         ▼
 [Isolated DatasetSession] ──► [Deterministic Analytics Engine]
                                         │
                         ┌───────────────┴───────────────┐
                         ▼                               ▼
               [Grounded AI Insights]          [Customer Intelligence]
                         │                               │
                         ▼                               ▼
               [Scoped AI Copilot]            [Personalized Offers]
```

### Pure JavaScript Parsing (`datasetParserService.js`)
To avoid native binary locks (e.g. `multer` temp file locking on Windows), the ingestion pipeline accepts CSV content via `express.json` and `express.text` with a 25 MB payload limit. An RFC-4180 compliant parser safely processes quotes, multiline descriptions, semicolons, tabs, and BOM headers.

---

## 2. Interactive Column Auto-Mapping

Datasets from different POS systems use varied naming conventions. GrowKaro automatically maps headers using heuristic matching:

| Standard Target Field | Required? | Candidate Heuristics |
| :--- | :--- | :--- |
| **Transaction Amount** | **Yes** | `amount`, `total`, `price`, `sales`, `revenue`, `grand_total`, `net_amount`, `cost` |
| **Transaction Date** | **Yes** | `date`, `time`, `timestamp`, `created_at`, `order_date`, `transaction_date`, `datetime` |
| **Customer ID** | Optional | `customer_id`, `client_id`, `phone`, `mobile`, `user_id`, `cust_id` |
| **Customer Name** | Optional | `customer_name`, `customer`, `name`, `client_name`, `cust_name` |
| **Product** | Optional | `product`, `item`, `product_name`, `sku`, `title`, `description` |
| **Category** | Optional | `category`, `product_category`, `department`, `type`, `item_category` |
| **Status** | Optional | `status`, `payment_status`, `order_status`, `state` |
| **Payment Method** | Optional | `payment_method`, `payment_mode`, `mode`, `method` |

---

## 3. Data Quality & Validation Summary

Before generating charts or insights, GrowKaro produces an explicit data quality audit:
- **Total Rows**: Complete count of records uploaded.
- **Valid Transactions**: Rows successfully parsed with valid positive amounts and dates.
- **Invalid Rows**: Filtered rows with explicit explanations (e.g. invalid date syntax, empty price).
- **Missing Customer IDs**: Tracks whether the dataset enables customer-level personalization.
- **Duplicate Transactions**: Identifies identical timestamps, amounts, and product combinations.

---

## 4. Isolated Temporary Sessions (`DatasetSession`)

> [!IMPORTANT]
> **Zero Contamination Guarantee**:
> Real uploaded data is stored exclusively in a dedicated MongoDB collection (`DatasetSession`) with a unique `sessionId` (e.g. `ds_1789803...`).
> - The live Cafe Aroma demo database (~5,246 transactions, catalog, seed customers) is **never modified or touched**.
> - Sessions expire automatically after 24 hours via MongoDB TTL indexes.
> - Evaluators can cleanly purge the session anytime by clicking **[✕ Exit Real Data & Clear Session]**.

---

## 5. Graceful Handling of Missing Fields

If an uploaded dataset lacks customer identifiers:
- The dashboard, hourly distributions, weekday sales, category breakdown, and product analytics calculate normally.
- The Customer Loyalty section displays:
  > *"Customer-level personalization requires a customer identifier in the dataset."*
- GrowKaro never hallucinates customer names or metrics that are absent from the dataset.
