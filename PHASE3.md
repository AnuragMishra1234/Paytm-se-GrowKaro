# GrowKaro — PHASE 3
## Agentic Actions + n8n Automation

### Phase Objective
Turn GrowKaro from an AI advisor into an AI business copilot that can execute approved actions.

At the end of Phase 3:

Observe → Understand → Detect → Recommend → Approve → Act

The merchant remains in control of important external actions.

---

# 1. n8n Role

n8n is the workflow orchestration/execution layer.

Do not put the entire intelligence inside n8n.

Responsibilities:
- Triggers
- Data retrieval
- Workflow orchestration
- Calling backend/AI services
- Approval-driven execution
- Notifications
- Campaign workflows
- Scheduled workflows
- Status tracking

Backend remains responsible for core application/business logic.
Groq remains the reasoning layer.
Cognee remains the AI memory layer.
MongoDB remains the application source of truth.

---

# 2. Main n8n Workflow

Build the core workflow:

Trigger
→ Fetch merchant data
→ Fetch/retrieve insight
→ Retrieve memory
→ AI reasoning if needed
→ Generate recommendation
→ Store recommendation
→ Notify/show merchant
→ Wait for approval
→ Execute action
→ Store execution status

---

# 3. Recommendation Approval

Every action-capable recommendation should have:

- recommendationId
- merchantId
- actionType
- proposedAction
- approvalStatus
- executionStatus
- createdAt
- executedAt

Statuses:

Recommendation:
- NEW
- VIEWED
- APPROVED
- REJECTED

Execution:
- NOT_STARTED
- RUNNING
- COMPLETED
- FAILED

---

# 4. Action Agent

Implement practical prototype actions.

Recommended:
1. Generate promotional campaign.
2. Generate WhatsApp/SMS/email message.
3. Schedule merchant notification.
4. Create a campaign draft.
5. Create a merchant task/reminder.

If real external APIs are unavailable, use a realistic simulated/test action.

Never claim that a real customer campaign was sent if it was only simulated.

---

# 5. Campaign Generation

Example:

Recommendation:
Evening sales are weak.

Merchant:
Approve.

Workflow:
→ Groq generates campaign content
→ n8n creates campaign record
→ Dashboard shows campaign
→ Status becomes completed/simulated

Campaign fields:
- campaignId
- merchantId
- title
- objective
- offer
- audience
- message
- startTime
- endTime
- status

---

# 6. Daily Business Brief Automation

Use n8n to trigger a scheduled workflow.

Flow:

Schedule
→ Merchant data
→ Analytics
→ Cognee context
→ Groq
→ Daily brief
→ Store
→ Notify/display

The brief should contain:
- Performance
- Important issue
- Opportunity
- External context
- Recommended action

---

# 7. External Context Automation

Example:

Weather signal
→ n8n
→ identify relevant merchants
→ fetch merchant data
→ retrieve memory
→ Groq
→ generate opportunity
→ store insight
→ merchant notification

Only trigger when relevance is meaningful.

---

# 8. Action Tracking

Every workflow execution must be traceable.

Store:
- Trigger
- Recommendation ID
- Action
- Status
- Timestamp
- Output
- Error if any

The dashboard should show the merchant what happened.

---

# 9. Backend/n8n Integration

Expose secure webhook/API endpoints as needed.

Suggested:
POST /api/actions
POST /api/actions/:id/approve
POST /api/actions/:id/reject
GET /api/actions/:merchantId
POST /api/n8n/action-result

Validate webhook requests.

Do not expose private secrets in frontend.

---

# 10. Agentic UX

When a recommendation appears:

> 🔥 Evening Sales Opportunity

> Your 6–9 PM sales are 28% below baseline.

> **Recommendation:** Reactivate ₹199 evening combo.

Buttons:

[Approve & Execute]
[Edit]
[Dismiss]

After approval:

> ✓ Campaign workflow started.

Then:

> ✓ Campaign created.

This makes the agentic behavior visible to judges.

---

# 11. Phase 3 Acceptance Criteria

1. n8n is connected.
2. At least one end-to-end workflow works.
3. Merchant receives recommendation.
4. Merchant can approve/reject.
5. Approved action triggers n8n.
6. n8n executes the intended prototype action.
7. Execution status returns to application.
8. Campaign/action is visible in dashboard.
9. Daily brief workflow works.
10. No unauthorized external action is executed.

---

# 12. Handoff to Phase 4

Phase 4 will measure executed actions and update merchant memory.

Required data:
- Baseline metric
- Action
- Action timestamp
- Post-action metric
- Observed change
- Outcome
- Memory update
