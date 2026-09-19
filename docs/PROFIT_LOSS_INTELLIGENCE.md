# Profit/Loss & Accounting Intelligence

## 1. Professional Accounting Principles

GrowKaro adheres to strict financial definitions:

- **Gross Revenue (Gross Sales)**: Total invoiced amount before discounts or returns.
  $$\text{Gross Revenue} = \sum (\text{item unit price} \times \text{quantity})$$
- **Refund Deductions**: Total money returned or credited back to customers.
  $$\text{Refunds} = \sum (\text{refund transaction amounts})$$
- **Net Sales (Net Revenue)**: The true top-line revenue retained by the business.
  $$\text{Net Sales} = \text{Gross Sales} - \text{Refunds}$$
- **Cost of Goods Sold (COGS)**: Direct inventory or preparation costs of sold goods.
  $$\text{COGS} = \sum (\text{item unit cost} \times \text{quantity})$$
- **Gross Profit**:
  $$\text{Gross Profit} = \text{Net Sales} - \text{COGS}$$
- **Gross Margin**:
  $$\text{Gross Margin} = \left(\frac{\text{Gross Profit}}{\text{Net Sales}}\right) \times 100\%$$

---

## 2. The Accounting Honesty Rule

Gross revenue is **never** labeled as profit.

When a merchant or demo account has not populated inventory unit cost (`costPrice` / `unitCost`), GrowKaro **strictly prevents** hallucinated or fabricated profit calculations:

- The UI displays **Net Sales** and total **Refund Deductions**.
- An explicit honesty badge is rendered:
  > *"Product cost data unconfigured — displaying Net Revenue & Refund Loss. Configure inventory item unit costs to unlock true Gross Profit analysis."*

When cost data is present:
- Real-time COGS is deducted.
- Gross Profit and Gross Margin percentage are computed deterministically.

---

## 3. Loss & Refund Anomaly Detection

GrowKaro actively monitors refund volume and spikes:
- **Spike Threshold**: A single refund $\ge ₹800$ or a daily refund rate $\ge 5\%$ triggers an automated `LOSS_SIGNAL` alert.
- **Priority**: Marked as `🚨 ACT_NOW` in the Notification Center.
- **Root Cause & Action**: AI drafts immediate mitigation tasks (e.g., checking batch quality with the barista, verifying POS receipt, or offering a loyalty recovery credit to the affected customer).
