# GrowKaro — Employee & Team Workflow Integration System

## 1. System Philosophy & Scope

GrowKaro is an **Autonomous AI Business Partner** for retail merchants.
The Team & Employee System is **strictly operational and agentic** — it is **NOT HR software**.

### What GrowKaro Does NOT Do:
- ❌ No payroll, salary calculations, or compensation management
- ❌ No biometric or attendance tracking
- ❌ No leave or vacation request management
- ❌ No employee performance appraisals or punitive scoring

### What GrowKaro DOES Do:
When GrowKaro detects an anomaly or business opportunity and the merchant/manager approves the recommended action, **the correct employees automatically know WHAT they need to do, WHEN it needs to happen, and WHY.**

```
AI Detects Anomaly
      ↓
AI Recommends Action
      ↓
Manager Approves (Approval Gate)
      ↓
Automatic Team Task Dispatch
      ↓
Correct Employee Receives Task Notification
      ↓
Employee Completes Task / Preps Floor
      ↓
n8n Action Executes (Customer Broadcast)
      ↓
Attributed Outcome Measured
      ↓
Relevant Team Members Notified of Results
      ↓
Cognee Business Memory Learns Pattern
```

---

## 2. Supported Roles & Responsibilities

| Role | Canonical Persona (Cafe Aroma) | Key Responsibilities | Access & Visibility Scope |
| :--- | :--- | :--- | :--- |
| **OWNER** | Vikram Mehta (`vikram@cafearoma.in`) | Strategic direction, daily business pulses, high-level opportunity alerts, long-term ROI. | Full administrative, financial, revenue, and operational access. |
| **MANAGER** | Priya Sharma (`priya@cafearoma.in`) | Operates the **Action Approval Gate**, coordinates shifts, reviews team checklists, tracks execution. | Approval authority, team oversight, daily pulse, protected financials. |
| **MARKETING** | Rahul Verma (`rahul@cafearoma.in`) | Campaign creative review, promotional copy validation, WhatsApp banner checks, customer audience targeting. | Actions, campaigns, creative assets, outcomes. Financial margins hidden. |
| **STAFF** | Ananya Das (`ananya@cafearoma.in`) | Store-floor operations, counter readiness, batch brewing, pastry inventory prep, customer brief. | Task checklists and shift operational status only. Sensitive revenue and margins hidden. |

---

## 3. Data Architecture & Data Models

### 3.1 `TeamMember` (`backend/src/models/TeamMember.js`)
Represents an authorized team member under a specific merchant tenant:
- `merchantId`: Reference to `Merchant` (strict tenant boundary)
- `name`: Full name
- `email`: Work email address (unique per merchant)
- `phone`: Contact phone number
- `role`: `OWNER` | `MANAGER` | `MARKETING` | `STAFF`
- `status`: `ACTIVE` | `INVITED` | `SUSPENDED` | `REMOVED`
- `avatar`: Two-letter initials badge
- `permissions`: Role capabilities array (`APPROVE_ACTIONS`, `ASSIGN_TASKS`, `WORK_TASKS`, etc.)

### 3.2 `Task` (`backend/src/models/Task.js`)
Represents an actionable operational checklist item linked to an AI action:
- `merchantId`: Reference to `Merchant`
- `assignedTo`: Reference to `TeamMember`
- `assignedToRole`: `OWNER` | `MANAGER` | `MARKETING` | `STAFF`
- `assignedToName`: Display name of assignee
- `createdBy`: Reference to `TeamMember` or null (System / Manager)
- `title`: Short task name (e.g., "Cold Brew & Croissant Inventory Prep")
- `description`: Detailed action instructions
- `type`: `MARKETING` | `OPERATIONS` | `INVENTORY` | `CUSTOMER` | `CAMPAIGN` | `GENERAL`
- `priority`: `URGENT` | `HIGH` | `MEDIUM` | `LOW`
- `status`: `TODO` -> `IN_PROGRESS` -> `COMPLETED` (or `CANCELLED`)
- `relatedActionId`: Reference to `Action`
- `relatedCampaignId`: Reference to `Campaign`
- `dueAt`: Target completion timestamp
- `startedAt` & `completedAt`: Lifecycle audit timestamps
- `completionNote`: Notes entered by the employee upon completion
- `auditLog`: Chronological timeline of state transitions

### 3.3 `Action.teamImpact` (`backend/src/models/Action.js`)
Structured field on the Action proposal outlining team task requirements before execution:
```json
"teamImpact": [
  {
    "role": "MARKETING",
    "taskTitle": "Campaign Creative & Copy Prep",
    "taskDescription": "Review WhatsApp copy and confirm target audience.",
    "assignedToName": "Rahul Verma"
  },
  {
    "role": "STAFF",
    "taskTitle": "Cold Brew & Croissant Inventory Prep",
    "taskDescription": "Ensure cold brew batches and croissants are stocked before 2:00 PM lull window.",
    "assignedToName": "Ananya Das"
  }
]
```

---

## 4. API Endpoints

### Team Management
- `GET /api/merchants/:id/team` — Fetch merchant team members with active task counts
- `POST /api/merchants/:id/team/invite` — Invite new team member
- `PATCH /api/team/:memberId` — Update member role, status, or details
- `DELETE /api/team/:memberId` — Soft-delete member from active team

### Operational Tasks
- `GET /api/merchants/:id/tasks` — Fetch tasks with filtering (`?role=`, `?status=`, `?relatedActionId=`)
- `POST /api/merchants/:id/tasks` — Create manual operational task
- `GET /api/tasks/:id` — Task detail
- `POST /api/tasks/:id/start` — Start task (`TODO` -> `IN_PROGRESS`)
- `POST /api/tasks/:id/complete` — Mark task as `COMPLETED` with optional note

---

## 5. Security & Sensitive Financial Data Protection

GrowKaro enforces Role-Based Access Control (RBAC) via `backend/src/middleware/rbac.js`:
1. **Multi-Tenant Isolation**: Store employees can only query their merchant's team and tasks.
2. **Financial Protection**:
   - On the frontend Dashboard, when `currentRole === 'STAFF'`, revenue/margin KPI cards are replaced with the **Floor Operations & Shift Hub** (Store Readiness, Shift Status, Prep Priority, Active Promotion Combo).
   - Backend APIs enforce role restrictions where appropriate, preventing floor staff from retrieving merchant profit margins.
