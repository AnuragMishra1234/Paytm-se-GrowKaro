# GrowKaro — Whole Project Specification

## 1. Project Identity

**Product Name:** GrowKaro

**One-line concept:**  
GrowKaro is an AI business partner for digital-payment merchants that continuously understands their business, detects problems and growth opportunities, recommends what to do next, executes approved actions through automated workflows, measures the results, and learns from past outcomes.

**Core positioning:**  
> Don't just show merchants what happened. Tell them what matters, what to do next, help them do it, and learn whether it worked.

---

# 2. Problem

Digital-payment merchants generate a large amount of transaction and business data, but most small merchants do not have the time, tools, or expertise to convert that data into useful business decisions.

Traditional merchant dashboards mainly show:
- Revenue
- Transactions
- Trends
- Payment history
- Basic customer information

The missing layer is decision support.

A merchant needs answers to questions such as:
- Why did my sales fall?
- What should I promote today?
- Which hours are weak?
- Which products are doing well?
- Which customers should I try to bring back?
- What should I stock more of?
- Is there an opportunity caused by weather, festivals, holidays, or local events?
- Did the action I took actually work?

GrowKaro addresses this gap by turning raw business data and external context into prioritized, actionable growth opportunities.

---

# 3. Target User

Primary user:

**Small and medium-sized merchants/business owners who accept digital payments.**

Examples:
- Restaurants
- Cafes
- Kirana stores
- Retail stores
- Salons
- Pharmacies
- Bakeries
- Clothing shops
- Electronics/accessory stores
- Service businesses

The system should be merchant-type aware so recommendations are relevant to the business.

---

# 4. Product Vision

GrowKaro should feel like an always-on business partner rather than a normal analytics dashboard or chatbot.

The product should follow this loop:

**Observe → Understand → Detect → Recommend → Approve → Act → Measure → Learn**

### Observe
Continuously examine business data.

### Understand
Build context about the merchant, customers, products, patterns, preferences, and past actions.

### Detect
Identify anomalies, risks, trends, and growth opportunities.

### Recommend
Explain the situation and give a specific next action.

### Approve
Let the merchant approve important external actions.

### Act
Use automated workflows to perform the approved action.

### Measure
Compare business performance before and after the action.

### Learn
Store the outcome so future recommendations become more personalized.

---

# 5. Core Product Modules

## 5.1 Merchant Dashboard

The dashboard is the merchant's main home screen.

Show:

### Business KPIs
- Today's revenue
- Transactions
- Average order value
- Repeat customer percentage
- Sales growth/decline
- Best-performing period
- Top products/categories

### Sales analytics
- Daily/weekly/monthly sales trend
- Transactions by hour
- Revenue by day
- Product/category performance
- Comparison with previous periods

### AI priority feed
Do not overwhelm the merchant with charts.

Show the most important things first:
- Act Now
- Opportunity
- Warning
- Positive trend

Example:

> **Sales dropped 28% today**  
> Your 6–9 PM sales are significantly below your recent baseline.  
> **Recommended action:** Run an evening combo offer.

---

# 6. AI Business Copilot

The merchant can ask natural-language questions.

Examples:

- "Why are my sales down?"
- "How can I increase sales today?"
- "What should I promote this weekend?"
- "Which product should I focus on?"
- "When are my busiest hours?"
- "Which customers should I target?"
- "Did my last campaign work?"
- "What should I stock before the weekend?"

The AI should answer using the merchant's actual business context rather than generic advice.

The response should ideally contain:

1. What happened
2. Why it happened
3. Relevant evidence
4. Recommended action
5. Optional action button

Example:

> **Your sales are down 24%.**  
> The largest decline is between 2–5 PM. Your weekday afternoon traffic has been weak for the last three weeks.  
> **Recommendation:** Try a limited afternoon combo between 2–5 PM.

---

# 7. Proactive Growth Detector

This is one of the most important GrowKaro features.

The system should not wait for the merchant to ask a question.

It should automatically detect:

### Sales anomalies
- Sudden sales drop
- Unusual sales spike
- Declining trend
- Unexpected low transaction count

### Time opportunities
- Weak hours
- Strong hours
- Day-of-week patterns
- Seasonal patterns

### Product opportunities
- Fast-growing product
- Declining product
- High-value product
- Product with unusual demand

### Customer opportunities
- Repeat customers
- Customers becoming inactive
- High-value customers
- Customer segments with potential

### Operational warnings
- Possible stock shortage
- Excess/slow-moving stock where data exists
- Campaign underperformance

Each detection should become an actionable insight.

---

# 8. AI Recommendation Engine

Every important insight should lead to a recommendation.

Recommendation structure:

**Situation → Evidence → Reason → Action → Goal**

Example:

> **Opportunity: Increase evening sales**  
> Evening transactions are 23% below your recent average.  
> Your ₹199 combo performed well during a previous campaign.  
> **Recommended action:** Reactivate the ₹199 evening combo from 6–8 PM.  
> **Goal:** Increase evening transactions.

The system should avoid generic recommendations such as "improve marketing."

Recommendations should be:
- Specific
- Data-backed
- Relevant to merchant type
- Feasible
- Easy to act on

---

# 9. External Context Intelligence

GrowKaro should combine internal merchant data with external real-world context.

Potential context:

- Weather
- Festivals
- Public holidays
- Weekends
- Local events
- Seasonal periods
- Relevant local conditions

Example:

Merchant:
- Tea/snack shop
- Strong historical rainy-day sales

External context:
- Heavy rain expected

GrowKaro:

> **Weather Opportunity**  
> Rain is expected tomorrow and your historical data shows higher evening beverage demand during rainy periods.  
> Consider increasing tea/snack inventory and promoting a hot-beverage combo from 5–9 PM.

The key idea:

**Merchant Data + External Context → Better Business Decision**

External context must be used only when it is relevant to the merchant's business and location.

---

# 10. Merchant Business Memory — Cognee

Cognee is the AI memory/knowledge layer.

It should maintain useful business context such as:

### Merchant profile
- Business type
- Location
- Products/categories
- Preferences

### Historical patterns
- Strong days
- Weak days
- Strong hours
- Seasonal patterns

### Past actions
- Campaigns
- Offers
- Recommendations
- Merchant approvals/rejections

### Outcomes
- Successful campaigns
- Failed campaigns
- Sales changes after actions

### Merchant preferences
- Discount preferences
- Preferred campaign types
- Previously rejected recommendations

The goal is personalization.

Example:

> A 10% discount failed previously, while a ₹199 combo worked well.

Later, GrowKaro should be able to use that history instead of repeatedly suggesting the same failed action.

---

# 11. AI Reasoning — Groq

Groq is the LLM/AI reasoning layer.

It should be used for:

- Understanding merchant questions
- Explaining business changes
- Generating recommendations
- Generating campaign copy
- Summarizing business performance
- Combining structured insights with retrieved merchant memory
- Producing natural-language business briefs

The LLM should not be responsible for calculating core business metrics.

Important principle:

**Code/analytics calculates facts.  
LLM explains facts and reasons about actions.**

---

# 12. Agentic Workflow / Automation — n8n

n8n is the workflow orchestration and execution layer.

It should connect the different parts of the system.

Example workflow:

1. Trigger on schedule or event
2. Fetch merchant data
3. Calculate/receive business metrics
4. Retrieve relevant merchant memory
5. Send context to Groq
6. Generate recommendation
7. Store recommendation
8. Show it to merchant
9. Wait for approval where required
10. Execute approved action
11. Track result
12. Update merchant memory

n8n can also handle:
- Scheduled daily briefs
- Alerts
- Campaign workflows
- Notifications
- External API connections
- AI workflows
- Follow-up actions

n8n is not the entire intelligence layer.

**n8n = orchestration/execution.  
Groq = reasoning.  
Cognee = AI memory.  
Backend = application/business logic.**

---

# 13. Action Agent

GrowKaro should move beyond recommendations.

When an action is available, show:

**[Approve & Execute]**

Possible prototype actions:

- Generate promotional message
- Create campaign draft
- Send notification
- Schedule campaign
- Generate WhatsApp/email copy
- Create merchant task/reminder
- Trigger a simulated offer

For real external actions, use merchant approval before execution.

The demo can use simulated/test integrations if production merchant APIs are unavailable.

---

# 14. Campaign Management

Merchant should be able to view:

- Active campaigns
- Draft campaigns
- Completed campaigns
- Campaign objective
- Start/end time
- Target audience
- Offer
- Results

Example:

**₹199 Evening Combo**

Objective:
Increase 6–8 PM sales.

Status:
Completed.

Result:
Before: ₹4,200  
After: ₹5,350  
Change: +27%

---

# 15. Outcome Tracking / Learning Loop

This is essential to the agentic story.

For every major action:

### Before
Capture baseline.

### Action
Execute campaign/recommendation.

### After
Measure the relevant metric.

### Result
Determine whether the action helped.

### Memory
Store the outcome in merchant memory.

Example:

**Recommendation:** ₹199 evening combo  
**Baseline:** ₹4,200  
**After:** ₹5,350  
**Observed change:** +27%

Store:

> Evening ₹199 combo was associated with improved evening sales.

Avoid claiming causation from a simple before/after comparison. Present it as an observed change unless a stronger experiment design is implemented.

---

# 16. Daily Business Brief

A scheduled AI workflow should generate a short merchant briefing.

Example:

## Good morning 👋

**Yesterday**
- Revenue: ₹18,420
- Transactions: 142
- Revenue change: -12%

**What matters**
- Evening sales were unusually low.
- Snacks performed strongly.
- Repeat customer activity declined.

**Today's opportunity**
- Promote the evening combo between 6–8 PM.

**External context**
- Rain expected in the evening.

**Recommended action**
- Increase beverage inventory and activate the evening combo.

---

# 17. Notification / Alert System

Notify the merchant when something important happens.

Examples:

- 🚨 Significant sales drop
- 📈 Unexpected sales growth
- 💡 Growth opportunity
- 📦 Inventory warning
- 🌦️ Relevant external-context opportunity
- 📊 Campaign result available

Avoid notifying for every small change.

The system should prioritize meaningful events.

---

# 18. Merchant Types

For the prototype, use a small number of merchant types.

Recommended:
- Restaurant/cafe
- Kirana/retail store
- Salon/service business

The system can use seeded/demo data for each merchant type.

Recommendations should adapt to the merchant category.

---

# 19. Demo Data

For the hackathon prototype, create realistic seeded data.

Example collections/data:

### Merchants
- merchant_id
- business_name
- business_type
- location
- preferences

### Transactions
- transaction_id
- merchant_id
- amount
- timestamp
- payment_status
- customer_id
- items/category

### Products
- product_id
- merchant_id
- product_name
- category
- price
- stock

### Customers
- customer_id
- merchant_id
- transaction_count
- total_spend
- last_transaction
- segment

### Campaigns
- campaign_id
- merchant_id
- offer
- objective
- status
- start/end

### Recommendations
- recommendation_id
- merchant_id
- trigger
- explanation
- recommendation
- status

### Actions
- action_id
- recommendation_id
- action_type
- approval_status
- execution_status

### Outcomes
- action_id
- baseline_metric
- post_action_metric
- observed_change

---

# 20. Database Strategy

## MongoDB

MongoDB is the primary application database.

Store:
- Merchant profiles
- Transactions
- Products
- Customers
- Campaigns
- Recommendations
- Actions
- Outcomes
- External-context snapshots

## Cognee

Cognee is the AI memory/knowledge layer.

Store/retrieve:
- Merchant business context
- Past recommendations
- Past campaign outcomes
- Merchant preferences
- Important business relationships/patterns

Do not treat Cognee as a replacement for MongoDB.

---

# 21. Technology Stack

## Frontend
- React
- Vite
- Tailwind CSS
- Recharts or equivalent charting library

## Backend
- Node.js
- Express.js

## Database
- MongoDB / MongoDB Atlas

## AI
- Groq API

## AI Memory / Knowledge
- Cognee

## Workflow / Agent Orchestration
- n8n

## Authentication
- JWT or a simplified demo authentication flow

## Real-time updates
- Socket.IO if needed

## Deployment
- Vercel for frontend
- Render/Railway or equivalent for backend
- Hosted/self-hosted n8n depending on availability
- MongoDB Atlas
- Cognee deployment appropriate to the prototype

Keep infrastructure minimal for the hackathon.

---

# 22. High-Level Architecture

```text
                         MERCHANT
                             |
                             v
                    React + Tailwind
                             |
                             v
                      Node + Express
                             |
             +---------------+---------------+
             |                               |
             v                               v
          MongoDB                           n8n
       Business Data                 Workflow/Automation
                                             |
                                  +----------+----------+
                                  |                     |
                                  v                     v
                               Cognee                 Groq
                            AI Memory               AI Brain
                                  |                     |
                                  +----------+----------+
                                             |
                                             v
                                      AI Decision
                                             |
                                             v
                                     Recommendation
                                             |
                                      Merchant Approval
                                             |
                                             v
                                            n8n
                                             |
                                      Action/Workflow
                                             |
                                             v
                                     Campaign/Alert
                                             |
                                             v
                                       Result Data
                                             |
                                      +------+------+
                                      |             |
                                      v             v
                                  MongoDB         Cognee
```

---

# 23. Data Flow

## Transaction-to-insight flow

```text
Transaction Data
      ↓
MongoDB
      ↓
Analytics / Business Logic
      ↓
Detect anomaly/opportunity
      ↓
Retrieve relevant merchant memory
      ↓
Cognee
      ↓
Groq
      ↓
Generate explanation + recommendation
      ↓
Store recommendation
      ↓
Merchant Dashboard
```

## Recommendation-to-action flow

```text
Recommendation
      ↓
Merchant Approval
      ↓
n8n
      ↓
Execute workflow
      ↓
Campaign / Notification / Task
      ↓
Measure result
      ↓
Store outcome
      ↓
Cognee memory
```

---

# 24. Core Agent Roles

GrowKaro can logically contain multiple specialized agents, even if they are implemented through a shared LLM + n8n workflow.

## Business Analyst Agent
Understands sales and business performance.

## Growth Opportunity Agent
Finds ways to improve sales/customer engagement.

## Customer Agent
Identifies retention/re-engagement opportunities.

## Marketing Agent
Creates campaign/offer recommendations and content.

## Context Agent
Evaluates relevant external context.

## Action Agent
Executes approved workflows.

## Learning/Outcome Agent
Evaluates results and updates merchant memory.

For an 8-hour prototype, these should be implemented as focused workflows rather than seven independent complex AI systems.

---

# 25. What Makes GrowKaro Different

The product should differentiate through the complete loop rather than one isolated feature.

### 1. Proactive, not just conversational
The system finds important issues without waiting for a merchant question.

### 2. Action-oriented
It doesn't stop at "here is an insight."

It provides a next action and can execute approved actions.

### 3. Persistent merchant memory
It remembers what worked, what failed, and what the merchant prefers.

### 4. External context
It combines business data with relevant real-world signals.

### 5. Outcome-driven
It measures what happened after the recommendation and feeds that result back into future decisions.

### Core differentiation statement:

> **GrowKaro turns payment and business signals into a continuous growth loop: detect → recommend → act → measure → learn.**

---

# 26. What NOT to Build

Do not spend the hackathon building:

- A full payment gateway
- A real banking system
- Complex production-grade inventory management
- A huge CRM
- A generic ChatGPT clone
- Dozens of disconnected AI agents
- Complex forecasting models without useful product value
- Full WhatsApp production infrastructure if APIs are unavailable
- Real financial lending decisions
- Unnecessary blockchain functionality

The product should demonstrate the intelligence loop, not infrastructure complexity.

---

# 27. Primary User Journey

```text
Merchant logs in
      ↓
Sees business dashboard
      ↓
AI Priority Feed shows:
"Evening sales dropped 28%"
      ↓
Merchant opens insight
      ↓
AI explains WHY
      ↓
AI checks merchant history
      ↓
Finds previous successful ₹199 combo
      ↓
Recommends reactivation
      ↓
Merchant clicks APPROVE
      ↓
n8n executes campaign workflow
      ↓
System measures outcome
      ↓
Dashboard shows observed result
      ↓
Cognee stores outcome
      ↓
Future recommendations use the new memory
```

This should be the main hackathon demo.

---

# 28. Secondary User Journey — External Context

```text
Merchant data
      +
Weather/event/festival context
      ↓
Context relevance check
      ↓
AI reasoning
      ↓
Opportunity detected
      ↓
Merchant sees:
"Rain tomorrow + your beverage sales rise on rainy days"
      ↓
Recommendation
      ↓
Approve
      ↓
Action
      ↓
Measure
      ↓
Learn
```

---

# 29. Final Product Experience

GrowKaro should have approximately these main screens:

1. **Login / Merchant Selection**
2. **Dashboard**
3. **AI Copilot**
4. **Insights / Priority Feed**
5. **Recommendations**
6. **Campaigns / Actions**
7. **Performance / Outcomes**
8. **Merchant Memory / Business Profile**
9. **Settings**

For an 8-hour build, prioritize:
- Dashboard
- AI Copilot
- Priority Feed
- Recommendation detail
- Action approval
- Campaign result

---

# 30. MVP Definition

The minimum impressive version should successfully demonstrate:

1. Merchant dashboard with realistic transaction data.
2. Automatic detection of a sales problem/opportunity.
3. AI explanation using merchant-specific data.
4. AI recommendation.
5. Relevant merchant memory through Cognee.
6. Merchant approval.
7. n8n workflow execution.
8. Campaign/action result.
9. Outcome measurement.
10. Memory update for future recommendations.
11. At least one external-context example.

If these work end-to-end, the prototype already communicates the full concept.

---

# 31. Four-Phase Development Plan

## PHASE 1 — Foundation + Merchant Intelligence

Build:
- Project setup
- React frontend
- Node/Express backend
- MongoDB
- Merchant model
- Transaction/product/customer models
- Seed/demo data
- Dashboard
- Basic analytics
- Authentication/demo merchant selection

Goal:

**Have a working merchant business dashboard backed by real seeded data.**

---

## PHASE 2 — AI Intelligence + Memory + External Context

Build:
- Groq integration
- AI Copilot
- Business insight generation
- Proactive growth detector
- Recommendation engine
- Cognee integration
- Merchant memory
- External context integration
- Context-aware recommendations

Goal:

**Turn the dashboard into an intelligent business advisor.**

---

## PHASE 3 — Agentic Actions + n8n

Build:
- n8n workflows
- Recommendation → approval flow
- Action Agent
- Campaign generation
- Notification/action workflow
- Scheduled daily business brief
- Automated triggers
- Action status tracking

Goal:

**Move from "AI tells you what to do" to "AI helps you do it."**

---

## PHASE 4 — Outcome Learning + Polish + Demo

Build:
- Campaign outcome tracking
- Before/after metrics
- Learning loop
- Cognee outcome updates
- Improved recommendation personalization
- UI polish
- Loading/error states
- Demo scenarios
- End-to-end testing
- Deployment
- Final presentation/demo flow

Goal:

**Complete the loop: Observe → Think → Recommend → Act → Measure → Learn.**

---

# 32. Success Criteria

A successful prototype should allow a judge to see:

### Before
Merchant has raw business data.

### GrowKaro
AI understands the merchant.

### Detection
GrowKaro identifies an important problem/opportunity.

### Recommendation
AI explains what is happening and recommends a specific action.

### Action
Merchant approves and n8n executes the workflow.

### Result
System measures the outcome.

### Memory
GrowKaro remembers the result and can use it in a future decision.

If a judge understands this flow in under two minutes, the core product story is clear.

---

# 33. One-Sentence Pitch

> **GrowKaro is an AI business partner for merchants that continuously analyzes their business and real-world context, identifies what matters, recommends what to do next, executes approved actions, and learns from the results.**

---

# 34. Short Pitch

> **Merchants already have payment data, but data alone doesn't tell them what to do. GrowKaro turns that data into action. It watches the business, detects problems and opportunities, understands merchant history through AI memory, considers external context such as weather and festivals, recommends specific growth actions, executes approved workflows through n8n, and learns from the outcome.**

---

# 35. Product Philosophy

GrowKaro should always answer three questions:

**What is happening?**

**Why is it happening?**

**What should I do next?**

And when possible:

**Can GrowKaro do it for me?**

That is the central product philosophy.
