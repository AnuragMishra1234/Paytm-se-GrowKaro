# GrowKaro — Team Roles & Notification Routing System

## 1. Role Capabilities Matrix

| Capability | OWNER | MANAGER | MARKETING | STAFF |
| :--- | :---: | :---: | :---: | :---: |
| View Financial Revenue & Profit Margins | ✅ Yes | ✅ Yes | ❌ Restricted | ❌ Restricted |
| View Daily Business Brief & Weather Pulse | ✅ Yes | ✅ Yes | ✅ Yes | ❌ Ops Only |
| Action Approval Gate (Approve/Reject Recommendations) | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| Edit Action Draft Parameters | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| Receive Task Assigned Notifications | ❌ No | ❌ No | ✅ Yes | ✅ Yes |
| Work & Complete Operational Tasks | ❌ No | ❌ No | ✅ Yes | ✅ Yes |
| Receive Task Completed Alerts | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| Receive Campaign Outcome Attribution Alerts | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No |
| Invite / Manage Team Members | ✅ Yes | ✅ Yes | ❌ No | ❌ No |

---

## 2. Central Notification Router (`backend/src/services/notificationService.js`)

GrowKaro uses a **central notification dispatch hub** ensuring that:
1. Notifications are created with exact role targeting (`role: 'ALL' | 'OWNER' | 'MANAGER' | 'MARKETING' | 'STAFF'`).
2. Recipient team members receive dedicated task assignments via `recipientMemberId`.
3. Notification queries filter results so users only see alerts relevant to their role.

### Notification Types & Role Routing Table

| Event / Trigger | Notification Type | Category | Target Roles | Action URL |
| :--- | :--- | :--- | :--- | :--- |
| AI Anomaly Detected | `ACTION_REQUIRED` | `RECOMMENDATION` | `OWNER`, `MANAGER` | `/campaigns` |
| Action Proposal Approved | `TASK_ASSIGNED` | `TASK` | Assigned `MARKETING` or `STAFF` | `/tasks` |
| Task Completed by Employee | `TASK_COMPLETED` | `TASK` | `MANAGER`, `OWNER` | `/tasks` |
| Campaign Dispatched via n8n | `ACTION_COMPLETED` | `EXECUTION` | `ALL` (`OWNER`, `MANAGER`, `MARKETING`) | `/campaigns` |
| Business Outcome Measured | `OUTCOME_AVAILABLE` / `OUTCOME_MEASURED` | `OUTCOME` | `OWNER`, `MANAGER`, `MARKETING` | `/performance` |
| Morning Operational Brief Ready | `DAILY_BRIEF` | `BRIEF` | `OWNER`, `MANAGER` | `/dashboard` |

---

## 3. Activity Timeline Integration

Every action and task lifecycle event is recorded in the immutable audit timeline (`GET /api/merchants/:id/activity`):
- **Stage: ASSIGN (`category: 'ASSIGN'`)**:
  - Event: `Task Assigned: <Task Title>`
  - Actor: Store Manager or System
  - Metadata: Role, priority, deadline
  - Deep link: `/tasks`
- **Stage: TASK_COMPLETED (`category: 'TASK_COMPLETED'`)**:
  - Event: `Task Completed: <Task Title>`
  - Actor: Employee display name (e.g., "Ananya Das", "Rahul Verma")
  - Metadata: Completion note, completion timestamp
  - Deep link: `/tasks`

---

## 4. Demo Role Switcher (For Presentation & Evaluation)

To allow seamless demonstration of role-based behaviors without requiring multiple email accounts or authentication barriers:
1. A **clean header pill group** is located in `AppLayout.jsx` topbar:
   - `[ 👑 Owner: Vikram ]`
   - `[ 👔 Manager: Priya ]`
   - `[ 📣 Marketing: Rahul ]`
   - `[ ☕ Staff: Ananya ]`
2. Switching roles:
   - Updates `TeamContext.jsx` and saves `growkaro_demo_role` in `localStorage`.
   - Sends the `x-demo-role` HTTP header on all subsequent API requests.
   - Automatically re-scopes the Dashboard:
     - When switched to **STAFF**, high-level revenue figures are hidden and replaced with the **Shift Operations Hub**.
     - In the **Notifications Center**, the "Tasks" filter tab highlights tasks assigned to the active role.
     - In the **Tasks Tab** (`/tasks`), the "My Role" tab filters directly for tasks assigned to the selected persona.
