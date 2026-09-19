# GrowKaro — PHASE 2
## AI Intelligence + Merchant Memory + External Context

### Phase Objective
Transform the Phase 1 analytics platform into an intelligent merchant advisor.

At the end of Phase 2, GrowKaro should:
- Understand merchant-specific business data.
- Answer merchant questions using real data.
- Proactively detect important problems/opportunities.
- Explain why something is happening.
- Recommend specific actions.
- Remember relevant merchant history using Cognee.
- Incorporate relevant external context such as weather/festivals/events.

No action execution is required yet; n8n execution is Phase 3.

---

# 1. Core Intelligence Loop

Implement:

Observe → Understand → Detect → Recommend

Phase 3 adds:
Approve → Act

Phase 4 adds:
Measure → Learn

---

# 2. Groq Integration

Use Groq as the reasoning/generation layer.

Create a clean AI service in the backend.

Use it for:
- Merchant questions
- Business explanations
- Recommendation generation
- Campaign-copy drafts
- Daily summaries
- Context-aware reasoning

Do NOT let the LLM invent transaction numbers.

Provide structured facts to the LLM.

---

# 3. AI Copilot

Create a merchant chat/copilot interface.

Example questions:
- Why are my sales down?
- How can I increase sales?
- What should I promote today?
- Which product should I focus on?
- Which customers should I target?
- Did my sales improve this week?
- What should I do this weekend?

The backend should:
1. Identify merchant.
2. Fetch relevant metrics.
3. Retrieve relevant memory.
4. Retrieve relevant external context.
5. Build a structured prompt.
6. Call Groq.
7. Return a grounded answer.

---

# 4. Proactive Growth Detector

Build deterministic detection rules before using the LLM.

Detect:
- Significant sales drop
- Significant sales increase
- Weak time periods
- Strong time periods
- Product growth
- Product decline
- Repeat-customer opportunity
- Customer inactivity
- Inventory warning where data supports it

Each detection should contain:
- type
- severity
- metric
- current value
- baseline value
- evidence
- merchantId
- timestamp

The LLM then explains the detection and recommends an action.

---

# 5. Recommendation Engine

Recommendation format:

Situation
→ Evidence
→ Explanation
→ Recommended action
→ Business goal

Example:

Situation:
Evening sales are down.

Evidence:
6–9 PM revenue is 28% below recent baseline.

Explanation:
The largest decline comes from evening transactions.

Recommendation:
Reactivate a ₹199 evening combo.

Goal:
Increase evening transactions.

Recommendations should be:
- Specific
- Grounded in data
- Merchant-type relevant
- Actionable
- Understandable in seconds

---

# 6. Cognee — Merchant Business Memory

Integrate Cognee as the AI memory/knowledge layer.

Do not use Cognee as the primary transactional database.

Store/retrieve meaningful context such as:
- Merchant profile
- Business type
- Merchant preferences
- Important sales patterns
- Past recommendations
- Past campaign actions
- Past campaign outcomes when available
- Accepted/rejected recommendations

Build a memory retrieval service.

Before generating important recommendations:
1. Identify the relevant merchant.
2. Query Cognee for relevant context.
3. Combine retrieved context with MongoDB facts.
4. Send grounded context to Groq.

---

# 7. Memory Examples

If a merchant previously:
- Tried 10% discount → poor result.
- Tried ₹199 combo → strong result.

Future recommendation should be able to say:

> Your previous ₹199 evening combo performed better than the 10% discount campaign. Consider reusing the combo.

Do not claim causality unless the data supports it.

---

# 8. External Context Intelligence

Add at least one useful external context source.

Recommended:
- Weather

Optional:
- Festivals
- Public holidays
- Local events

The system should associate context with merchant location and business type.

Example:

Tea shop + rain + historical rainy-day demand increase
→ beverage opportunity.

Do not blindly show every external event.
First determine whether the context is relevant.

---

# 9. Context Relevance Layer

Implement:

External signal
→ Is it relevant?
→ What merchant/product/time period does it affect?
→ Combine with internal data
→ Generate insight

This prevents irrelevant notifications.

---

# 10. Insight Feed

Create a proactive UI.

Categories:
- ACT NOW
- OPPORTUNITY
- WARNING
- POSITIVE TREND

Each card should show:
- Short title
- Metric
- Why it matters
- Recommendation
- View details

Phase 2 can show a disabled/preview action button that Phase 3 will activate.

---

# 11. Daily Business Brief

Create backend support for a daily summary.

Structure:
- Yesterday's performance
- Important change
- Main issue
- Opportunity
- External context
- Recommended action

n8n scheduling can be added in Phase 3.

---

# 12. AI Safety / Grounding Rules

The AI should:
- Use provided merchant data.
- Clearly distinguish facts from suggestions.
- Avoid inventing metrics.
- State when data is insufficient.
- Avoid pretending an action was executed.
- Avoid claiming guaranteed revenue increases.

---

# 13. Phase 2 APIs

Suggested:

POST /api/ai/chat
GET /api/merchants/:id/insights
GET /api/merchants/:id/recommendations
GET /api/merchants/:id/memory
GET /api/merchants/:id/context

POST /api/ai/analyze/:merchantId

Keep AI services modular.

---

# 14. Phase 2 Acceptance Criteria

1. Groq integration works.
2. Merchant can ask questions.
3. Answers use merchant-specific data.
4. Sales anomaly detection works.
5. Proactive insights appear without asking.
6. Recommendations are specific.
7. Cognee stores/retrieves merchant context.
8. External context can affect recommendations.
9. AI does not invent core metrics.
10. Insight feed is functional.
11. Different merchants receive different recommendations.
12. No action is falsely shown as executed.

---

# 15. Handoff to Phase 3

Phase 3 will take:
- Recommendations
- Merchant approval state
- Campaign drafts
- Action types
- Triggers
- n8n workflows

and turn recommendations into executable workflows.
