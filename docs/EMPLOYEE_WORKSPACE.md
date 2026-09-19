# GrowKaro: Employee Workspace (Rahul Verma, Marketing Lead)

The Employee Workspace provides an operational execution console tailored specifically to merchant employees. Rather than exposing broad administrative controls, financial margins, or bank settings, GrowKaro presents role-appropriate actions, tasks, and intelligence.

$$\mathbf{Observe} \longrightarrow \mathbf{Understand} \longrightarrow \mathbf{Detect} \longrightarrow \mathbf{Recommend} \longrightarrow \mathbf{Approve} \longrightarrow \mathbf{Assign} \longrightarrow \mathbf{Notify} \longrightarrow \mathbf{Act} \longrightarrow \mathbf{Measure} \longrightarrow \mathbf{Learn}$$

---

## 1. Persona Profile & Scope

| Field | Description |
| :--- | :--- |
| **Employee Name** | Rahul Verma |
| **Merchant** | Cafe Aroma, Indiranagar, Bengaluru |
| **Role** | `MARKETING` (Marketing Lead) |
| **Console Route** | `/employee` |
| **Header Greeting** | *"Good morning, Rahul"* |
| **Console Subtitle** | *"Here are the marketing actions and customer opportunities that need your attention."* |

---

## 2. Access Scoping & Backend RBAC Enforcement

Access control is enforced at the backend via [`backend/src/middleware/rbac.js`](file:///e:/GrowKaro/backend/src/middleware/rbac.js) using the `x-demo-role` authorization header.

### Permitted Features:
- **My Tasks**: Operational work items assigned to Rahul (`MARKETING`), including copy review, banner preparation, and customer offer verification.
- **Customer Opportunities**: High-affinity, repeat, and at-risk patron profiles with grounded 4-part rationales.
- **Campaigns Assigned**: WhatsApp marketing campaigns with audience segmentation and delivery stats.
- **AI Marketing Assistant**: Context-aware recommendations integrating weather (e.g. Bengaluru 21°C), afternoon lull timing, and product pairing affinities.
- **Role Notifications**: Filtered notifications (`TASK_ASSIGNED`, `CAMPAIGN_APPROVED`, `OUTCOME_AVAILABLE`).
- **Campaign Results**: Safe, scientifically grounded non-causal observed metrics.

### Strictly Restricted Features:
- **Store Financial Analytics (`/api/merchants/:id/analytics`)**: Returns `HTTP 403 Forbidden` (`RESTRICTED_DATA`). Rahul cannot inspect gross profit margins or store bank payouts.
- **Merchant Team Administration (`/api/merchants/:id/team/invite`)**: Returns `HTTP 403 Forbidden`. Only `OWNER` and `MANAGER` can manage staff.

---

## 3. Connected Task Workflow Lifecycle

```
 Manager Approves Action / Personalized Offer
                     │
                     ▼
  Task Automatically Assigned to Rahul Verma (`TODO`)
                     │
                     ▼
 Rahul Opens Workspace (`/employee`) & Reviews Details
                     │
                     ▼
           Clicks [Start Task ⚙️] (`IN_PROGRESS`)
                     │
                     ▼
        Prepares Creative & Verifies Copy
                     │
                     ▼
           Clicks [Mark Complete ✓] (`COMPLETED`)
                     │
                     ▼
   Simulated n8n Automated Dispatch Executes
                     │
                     ▼
    Outcome Measured & Learned Fact Retained in Memory
```

---

## 4. UI Design System Preservation

Rahul's workspace adheres strictly to GrowKaro's design tokens:
- **Typography**: `Inter, system-ui, sans-serif`
- **Color Palette**: `#002970` brand navy, gray-50 background, white card surfaces with `border-gray-200/80` borders.
- **Icons**: Crisp SVG vector icons (no generic templates or emoji clutter in tables).
- **Responsive Layout**: Adapts seamlessly from desktop multi-column grids to mobile stacked cards.
