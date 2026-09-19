# GrowKaro — PHASE 1
## Foundation + Merchant Intelligence

### Phase Objective
Build the complete non-AI foundation of GrowKaro so that a merchant can log in/select a demo merchant, view realistic business data, and understand their sales/customer/product performance.

At the end of Phase 1:
- Frontend works.
- Backend works.
- MongoDB works.
- Seed/demo merchant data exists.
- Dashboard is functional.
- APIs are connected.
- No dependency on Groq, Cognee, or n8n is required yet.

---

# 1. Scope

### Build
1. Project structure
2. React + Vite frontend
3. Tailwind CSS UI
4. Node.js + Express backend
5. MongoDB/MongoDB Atlas integration
6. Merchant data model
7. Transaction data model
8. Product data model
9. Customer data model
10. Campaign/outcome-ready models where useful
11. Seed/demo data
12. Merchant selection/login
13. Merchant dashboard
14. Sales analytics
15. Product analytics
16. Customer analytics
17. Backend APIs
18. Frontend-backend integration
19. Loading/error/empty states
20. Clean environment configuration

### Do NOT build yet
- Groq
- Cognee
- n8n
- AI agent
- AI recommendations
- External context intelligence
- Autonomous actions

These belong to later phases.

---

# 2. Product Screens

## 2.1 Merchant Login / Demo Selection
For hackathon prototype, allow selecting a demo merchant.

Show:
- Merchant/business name
- Business type
- Location
- Login/select button

Provide at least 3 demo merchants:
- Cafe/restaurant
- Kirana/retail
- Salon/service

The selected merchant must control all dashboard data.

---

# 3. Dashboard

Create a professional merchant-facing dashboard.

## KPI cards
- Today's revenue
- Today's transactions
- Average order value
- Repeat customer percentage
- Revenue change vs previous comparison period

## Sales section
- Revenue trend
- Transaction trend
- Hourly sales
- Day-of-week sales

## Product section
- Top products
- Best category
- Declining products
- Product revenue contribution

## Customer section
- New customers
- Repeat customers
- Inactive customers
- High-value customers

## Business pulse
Add a non-AI placeholder area for important metrics/flags that Phase 2 will later replace with AI-generated insights.

---

# 4. Data Models

## Merchant
Fields:
- merchantId
- businessName
- businessType
- location
- currency
- createdAt
- preferences placeholder

## Transaction
Fields:
- transactionId
- merchantId
- customerId
- amount
- timestamp
- paymentStatus
- items
- category
- paymentMethod

## Product
Fields:
- productId
- merchantId
- name
- category
- price
- stock
- unitsSold

## Customer
Fields:
- customerId
- merchantId
- name/displayName
- totalTransactions
- totalSpend
- lastTransactionAt
- customerSegment

Keep schemas simple and practical.

---

# 5. Seed Data

Generate realistic data rather than random-looking numbers.

Data should contain recognizable patterns so Phase 2 can detect them.

Examples:
- One merchant has weak weekday afternoons.
- One merchant has strong Friday/Saturday sales.
- One merchant has declining evening sales.
- Some products are growing.
- Some products are declining.
- Some customers are repeat customers.
- Some customers are becoming inactive.

Use timestamps across enough historical days/weeks to support comparisons.

---

# 6. Backend APIs

Create clean REST APIs.

Suggested endpoints:

GET /api/merchants
GET /api/merchants/:id
GET /api/merchants/:id/dashboard
GET /api/merchants/:id/transactions
GET /api/merchants/:id/products
GET /api/merchants/:id/customers

Dashboard API should return aggregated metrics where practical instead of forcing the frontend to calculate everything.

---

# 7. Analytics Logic

Use deterministic backend calculations.

Calculate:
- Revenue
- Transaction count
- Average order value
- Revenue change
- Sales by date
- Sales by hour
- Sales by weekday
- Product performance
- Customer repeat rate
- Customer recency
- Basic segments

Important:
Do NOT ask an LLM to calculate these metrics.

Code calculates facts.
AI will explain facts in Phase 2.

---

# 8. UI Requirements

Design should feel like a real fintech/merchant SaaS product.

Use:
- Clean responsive layout
- Sidebar/top navigation
- KPI cards
- Charts
- Tables
- Clear typography
- Good spacing
- Responsive desktop layout
- Mobile-friendly structure where practical

Avoid:
- Excessive gradients
- Random animations
- Fake AI everywhere
- Unnecessary cards
- Overloaded dashboard

---

# 9. Engineering Requirements

- Keep frontend/backend separated cleanly.
- Use environment variables.
- Never commit secrets.
- Add .env.example.
- Add README with setup instructions.
- Handle API errors.
- Add basic request validation.
- Use reusable frontend components.
- Keep business logic out of UI components.
- Keep database access organized.

---

# 10. Phase 1 Acceptance Criteria

Phase 1 is complete only when:

1. App starts successfully.
2. Backend connects to MongoDB.
3. Demo merchants exist.
4. Merchant selection works.
5. Dashboard loads merchant-specific data.
6. KPI calculations are correct.
7. Charts display real backend data.
8. Products display real backend data.
9. Customers display real backend data.
10. Different merchants show different patterns.
11. Loading/error states work.
12. No hardcoded dashboard values are used as the final data source.
13. Project has clean setup documentation.
14. No Groq/Cognee/n8n dependency is required.

---

# 11. Handoff to Phase 2

Phase 2 will consume Phase 1's:
- Merchant profile
- Transaction history
- Product data
- Customer data
- Analytics
- Merchant preferences

Do not redesign Phase 1 architecture when adding AI. Build clean extension points.
