# Real-Time Dashboard & Business Pulse Gauge

## 1. Zero Page-Reload Real-Time Experience

The GrowKaro merchant dashboard operates over persistent WebSockets powered by **Socket.IO**. When counter sales occur, online orders arrive, or customer refunds are processed:

1. The transaction is instantly streamed to the frontend.
2. The Live Transaction feed prepends the new row without reloading the browser.
3. The **Business Pulse** vitality gauge dynamically recalibrates its score (0–100) and health indicators.
4. Top-line financial KPI cards (Gross Revenue, Deductions, Net Sales) instantly refresh.
5. The UI displays `● LIVE` with a pulsating beacon and "Last event: Just now".

---

## 2. Business Pulse Scoring Logic

The Business Pulse is a deterministic vitality index computed using transparent operational factors:

$$\text{Base Score} = 75$$

| Metric Category | Condition | Impact |
|---|---|---|
| **Sales Trend** | $\ge +10\%$ vs. yesterday | $+10$ points |
| | $> 0\%$ vs. yesterday | $+5$ points |
| | $\le -12\%$ vs. yesterday | $-15$ points |
| | $\le -25\%$ vs. yesterday | $-25$ points |
| **Refund Rate** | $0\%$ refunds today | $+5$ points |
| | $> 5\%$ refund rate or $\ge 1$ return | $-10$ points |
| | $> 10\%$ refund rate or $\ge 3$ returns | $-20$ points |
| **Repeat Customer Rate** | $\ge 35\%$ repeat customers | $+5$ points |
| | $< 20\%$ repeat customers | $-5$ points |
| **Declining Products** | Per declining active product | $-5$ points (max $-15$) |

### Health Status Bands:
- 🟢 **Healthy** ($\ge 75$): Store operating at optimal momentum.
- 🟡 **Needs Attention** ($50 - 74$): Moderate performance drag, mid-day lull, or isolated returns.
- 🔴 **Risk Detected** ($< 50$): Critical drop in velocity, sales anomaly, or refund surge requiring immediate merchant intervention.

---

## 3. Notification Center & 6 System Categories

Notifications are organized into 6 clear visual categories with distinct badges:

1. 🚨 **ACT_NOW**: Urgent matters requiring immediate merchant decision (loss signal, severe refund spike).
2. ⚠️ **WARNING**: Emerging threats or operational concerns (sales drop, lull detected).
3. 💡 **OPPORTUNITY**: Growth signals (high-margin combo pair, VIP customer arrival).
4. 📊 **BUSINESS_UPDATE**: Scheduled digests (Daily Business Brief, weekly summary).
5. 🌦 **CONTEXT**: External environmental factors (weather shifts, festival holidays).
6. ✅ **POSITIVE_TREND**: Celebratory milestones (repeat customer record, high campaign lift).
