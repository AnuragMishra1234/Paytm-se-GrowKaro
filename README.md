# GrowKaro

> **An AI business partner for digital-payment merchants that continuously understands their business, detects problems and growth opportunities, recommends what to do next, and learns from results.**

---

## Current Phase

**Phase 3 — Agentic Actions + n8n Automation + Merchant Approval (ACTIVE)**

Phase 1 established the merchant foundation. Phase 2 introduced AI intelligence and proactive growth detection. **Phase 3 introduces agentic execution governed by merchant approval**: recommendations become actionable drafts, merchants review and edit copy, and execution triggers through n8n workflows (or demo sandbox) with real-time audit logging. Phase 4 will add outcome learning.

---

## Tech Stack

| Layer | Technology | Status |
|---|---|---|
| Frontend | React 18 + Vite + Tailwind CSS | Active |
| Charts | Recharts | Active |
| Backend | Node.js + Express | Active |
| Database | MongoDB Atlas | Active |
| AI Reasoning | Groq API (`qwen/qwen3.8-27b`) | Active (Phase 2 & 3) |
| AI Memory | Cognee abstraction + MongoDB Memory Store | Active (Phase 2) |
| Ambient Context | Open-Meteo Weather API + Indian Calendar | Active (Phase 2) |
| Automation & Workflows | n8n Webhook Integration + Sandbox Engine | Active (Phase 3) |
| Future (Ph4) | Outcome Learning Loop | Phase 4 |

---

## Project Structure

```
GrowKaro/
├── frontend/          React + Vite + Tailwind
│   ├── src/
│   │   ├── components/      Reusable UI components
│   │   │   └── charts/      Recharts wrappers
│   │   ├── pages/           Dashboard, Analytics, Products, Customers
│   │   ├── layouts/         AppLayout (sidebar)
│   │   ├── services/        api.js — all backend calls
│   │   ├── hooks/           useDashboard, useProducts, useCustomers
│   │   ├── utils/           formatters.js
│   │   └── context/         MerchantContext
│   └── package.json
│
├── backend/           Node.js + Express API
│   ├── src/
│   │   ├── config/          db.js — MongoDB connection
│   │   ├── models/          Merchant, Transaction, Product, Customer
│   │   ├── controllers/     merchantController.js
│   │   ├── routes/          merchants.js
│   │   ├── services/        analyticsService.js (all calculations)
│   │   └── middleware/      errorHandler.js
│   ├── scripts/
│   │   └── seed.js          Demo data generator
│   └── package.json
│
├── WHOLE-PROJECT.md   Complete product specification
├── PHASE1.md - PHASE4.md  Phase specifications
└── README.md
```

---

## Environment Variables

### Backend (`backend/.env`)

Copy `backend/.env.example`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/growkaro
FRONTEND_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)

Copy `frontend/.env.example`:

```env
VITE_API_BASE_URL=http://localhost:5000
```

---

## Installation

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (free tier works)

### 1. Clone / navigate to project

```bash
cd GrowKaro
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Configure backend environment

```bash
cp .env.example .env
# Edit .env with your MongoDB Atlas connection string
```

### 4. Install frontend dependencies

```bash
cd ../frontend
npm install
```

### 5. Configure frontend environment

```bash
cp .env.example .env
```

---

## MongoDB Setup

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a free cluster (M0)
3. Create a database user with read/write permissions
4. Allow your IP in Network Access (or use 0.0.0.0/0 for dev)
5. Get your connection string: Connect → Drivers → Node.js
6. Paste it as `MONGODB_URI` in `backend/.env`

---

## Seeding Demo Data

Run from the `backend/` folder:

```bash
npm run seed
```

This creates:
- **Cafe Aroma** — cafe with strong Fri/Sat evenings, weak 2–4 PM afternoons
- **Fresh Kirana** — kirana with strong weekend demand, declining cooking oil sales
- **Style Studio** — salon with weekend appointment surges, repeat customer base

About 90 days of realistic transaction data with intentional patterns for Phase 2 AI detection.

---

## Running the App

### Backend (from `backend/`)

```bash
npm run dev       # Development with nodemon
npm start         # Production
```

Backend runs on `http://localhost:5000`

### Frontend (from `frontend/`)

```bash
npm run dev
```

Frontend runs on `http://localhost:5173`

---

## API Overview

| Endpoint | Description |
|---|---|
| `GET /health` | Health check |
| `GET /api/merchants` | All merchants |
| `GET /api/merchants/:id` | Merchant profile |
| `GET /api/merchants/:id/dashboard` | Aggregated KPIs + trends |
| `GET /api/merchants/:id/transactions` | Paginated transactions |
| `GET /api/merchants/:id/products` | Product performance |
| `GET /api/merchants/:id/customers` | Customer analytics |
| `GET /api/merchants/:id/analytics` | Full analytics (trends, hourly, weekday) |

Query params: `days=7|30|90`, `page=1`, `limit=20`

---

## Phase 1 Features

- ✅ Merchant selection / demo login
- ✅ Revenue KPIs (today vs yesterday)
- ✅ Revenue trend chart (7/30/90 day)
- ✅ Sales by hour of day
- ✅ Sales by day of week
- ✅ Product performance + trends
- ✅ Category breakdown
- ✅ Customer segments (new/repeat/VIP/inactive)
- ✅ Top customers table
- ✅ Business Pulse (deterministic pattern flags)
- ✅ Loading / error / empty states
- ✅ Merchant switching

---

## Future Phases

| Phase | What it adds |
|---|---|
| **Phase 2** | Groq AI Copilot, Growth Detector, Cognee memory, external context |
| **Phase 3** | n8n workflows, approve & execute recommendations, campaigns |
| **Phase 4** | Outcome tracking, learning loop, full product polish |

---

## Architecture (Final Vision)

```
Merchant Dashboard
       ↓
Node.js/Express
       ↓
MongoDB (business facts)
       ↓
Analytics/Growth Detector
       ↓
Cognee (AI memory) + Groq (AI reasoning)
       ↓
Recommendations
       ↓
Merchant Approval
       ↓
n8n (action execution)
       ↓
Outcome → Cognee memory update
```

---

*GrowKaro Phase 1 · Built for hackathon demonstration*