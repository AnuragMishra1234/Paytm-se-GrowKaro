# GrowKaro — Complete Production Deployment Guide
## Deploying Backend to Render & Frontend to Vercel

This guide provides exhaustive, step-by-step instructions for deploying the GrowKaro autonomous AI business partner platform to production using **Render** (Node.js/Express backend) and **Vercel** (Vite + React frontend) with **MongoDB Atlas** and **Groq Cloud AI**.

---

## 1. System Architecture & Tech Stack

```
                                  ┌────────────────────────┐
                                  │   Merchant / Investor  │
                                  └───────────┬────────────┘
                                              │ HTTPS
                                              ▼
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │ VERCEL (Frontend SPA)                                                                  │
 │ - Vite 5 + React 18 + Tailwind CSS                                                     │
 │ - Production Domain: https://growkaro.vercel.app                                       │
 │ - Handles SPA client routing (/dashboard, /employee, /test-real-data)                  │
 └────────────────────────────────────────────┬───────────────────────────────────────────┘
                                              │ REST API (JSON / CSV text)
                                              ▼
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │ RENDER (Backend Web Service)                                                           │
 │ - Node.js 18+ / Express 4 REST API                                                     │
 │ - Production Domain: https://growkaro-api.onrender.com                                 │
 │ - Grounded AI Reasoning Engine (Groq Llama 3.3 70B + Rule Fallbacks)                   │
 │ - RFC-4180 Pure-JS CSV Parsing & Validation Engine                                     │
 │ - RBAC Protection (Staff/Marketing financial isolation)                                │
 │ - Deterministic AI Loyalty & Customer Opportunity Math                                 │
 └─────────────────────────┬───────────────────────────────┬──────────────────────────────┘
                           │                               │
                           ▼                               ▼
       ┌───────────────────────────────┐       ┌───────────────────────────────┐
       │   MONGODB ATLAS (Cloud DB)    │       │     GROQ CLOUD (AI LLM)       │
       │   - M0 Free Cluster           │       │   - Llama-3.3-70b-versatile   │
       │   - IP Whitelist: 0.0.0.0/0   │       │   - Ultra-fast Copilot        │
       └───────────────────────────────┘       └───────────────────────────────┘
```

---

## 2. Step 1: MongoDB Atlas Cloud Database Setup

1. Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free **M0 Cluster** (Shared) in a region close to your users (e.g., AWS Mumbai `ap-south-1` or AWS Frankfurt/N. Virginia).
3. **Database Access (User Creation)**:
   - Go to **Security → Database Access → Add New Database User**.
   - Authentication Method: **Password**.
   - Username: `growkaro_admin`
   - Password: Generate or set a secure password (save this safely).
   - Database User Privileges: **Read and write to any database**.
4. **Network Access (IP Whitelist)**:
   - Go to **Security → Network Access → Add IP Address**.
   - Click **Allow Access From Anywhere** (`0.0.0.0/0`).
   - *Why?* Render web service instances have dynamic, ephemeral outbound IPs. Allowing `0.0.0.0/0` ensures uninterrupted database connectivity.
5. **Get Connection String**:
   - Go to **Databases → Clusters → Connect → Drivers (Node.js)**.
   - Copy your connection string:
     ```
     mongodb+srv://growkaro_admin:<password>@cluster0.xxxxx.mongodb.net/growkaro?retryWrites=true&w=majority
     ```
   - Replace `<password>` with your actual password and `<database>` with `growkaro`.

---

## 3. Step 2: Render Backend Web Service Deployment

### A. Repository & Service Setup
1. Push your complete `GrowKaro` repository to GitHub.
2. Log in to your [Render Dashboard](https://dashboard.render.com).
3. Click **New + → Web Service**.
4. Connect your GitHub repository (`GrowKaro`).
5. Configure the service settings:

| Setting | Value | Explanation |
| :--- | :--- | :--- |
| **Name** | `growkaro-api` | Your Render service slug |
| **Region** | Singapore / Frankfurt / Oregon | Closest to your users |
| **Branch** | `main` | Production branch |
| **Root Directory** | `backend` | **Crucial:** Points Render to the Express app |
| **Runtime** | `Node` | Node.js runtime |
| **Build Command** | `npm install` | Installs backend dependencies |
| **Start Command** | `node src/server.js` | Starts the production server |
| **Instance Type** | `Free` (or Starter) | 512MB RAM, 0.1 CPU |

---

### B. Environment Variables on Render
Under **Environment Variables**, add the following key-value pairs:

| Variable Key | Required | Example Value | Description |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | **Yes** | `production` | Enables production optimizations |
| `PORT` | Auto | `5000` | Render sets `PORT` automatically; backend uses `process.env.PORT \|\| 5000` |
| `MONGODB_URI` | **Yes** | `mongodb+srv://growkaro_admin:...@cluster0...` | Your MongoDB Atlas connection string |
| `GROQ_API_KEY` | Recommended | `gsk_...` | Groq API key for live AI Copilot (falls back gracefully if omitted) |
| `FRONTEND_URL` | **Yes** | `https://growkaro.vercel.app` | Allowed frontend origin for CORS (or comma-separated URLs) |
| `SESSION_SECRET` | Optional | `growkaro_production_secret_key_123` | Session security string |
| `N8N_MODE` | Optional | `demo` | Set to `demo` (default) or `real` |
| `N8N_WEBHOOK_URL` | Optional | `https://n8n.yourdomain.com/webhook/...` | Live n8n webhook (if running self-hosted n8n) |

---

### C. Health Check Configuration on Render
- In **Advanced Settings**, set **Health Check Path** to:
  ```
  /health
  ```
- The GrowKaro backend responds to `/health` with HTTP 200:
  ```json
  { "status": "ok", "service": "GrowKaro API", "version": "1.0.0" }
  ```

---

### D. Seed Benchmark Demo Data on Render
Once the deployment finishes and the service shows **Live**:
1. Open the Render Web Service page.
2. Click **Shell** in the left sidebar to open a web terminal in your container.
3. Run the reset & seed command:
   ```bash
   npm run demo:reset
   ```
4. This seeds the 3 benchmark merchants (Cafe Aroma, Green Grocers, Style Studio), benchmark patron **Ananya Das** (12 visits, ₹8,450 spend, Cold Brew favorite), active campaigns, tasks, and historical outcomes.

---

## 4. Step 3: Vercel Frontend Deployment

### A. Repository Import
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New... → Project**.
3. Import your GitHub repository (`GrowKaro`).
4. Configure the project settings:

| Setting | Value | Notes |
| :--- | :--- | :--- |
| **Framework Preset** | `Vite` | Auto-detected by Vercel |
| **Root Directory** | `frontend` | **Crucial:** Click "Edit" and choose `frontend` |
| **Build Command** | `npm run build` | Default Vite build |
| **Output Directory** | `dist` | Default Vite output |
| **Install Command** | `npm install` | Default |

---

### B. Environment Variables on Vercel
Under **Environment Variables**, add:

| Key | Value | Notes |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `https://growkaro-api.onrender.com` | **No trailing slash!** Use your Render backend URL |

> [!IMPORTANT]
> Vite requires client environment variables to begin with `VITE_`.
> Always use `https://your-backend-slug.onrender.com` without a trailing `/`.

---

### C. Single Page Application (SPA) Rewrites Configuration
GrowKaro includes `frontend/vercel.json` to handle client-side routing.
When a user directly navigates to or refreshes `/dashboard`, `/employee`, `/tasks`, or `/test-real-data`, this configuration rewrites all requests to `index.html` instead of returning a Vercel 404:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
*This file is already committed in `frontend/vercel.json`.*

---

## 5. Step 4: Cross-Origin Handshake Verification

Once both Render and Vercel are deployed:
1. Copy your Vercel URL (e.g., `https://growkaro.vercel.app`).
2. Go to **Render → Environment Variables** on your backend service.
3. Update `FRONTEND_URL` to your exact Vercel URL:
   ```
   FRONTEND_URL=https://growkaro.vercel.app
   ```
4. Render will automatically redeploy backend with the new CORS setting.

*(Note: GrowKaro's `app.js` is already coded to automatically permit all `*.vercel.app` domains as well as localhost for local testing.)*

---

## 6. Verification & Smoke Test Checklist

After deployment, test the full application flow:

- [ ] **Backend Health Check**:
  Open `https://growkaro-api.onrender.com/health` in your browser. Verify you get:
  `{"status":"ok","service":"GrowKaro API","version":"1.0.0"}`

- [ ] **Frontend Landing Page**:
  Open your Vercel domain. Verify the landing page loads cleanly with the GrowKaro brand logo.

- [ ] **Manager Dashboard (`/dashboard`)**:
  Click **Launch Demo / Dashboard**. Verify:
  - Top header displays: `[ 👔 MANAGER DASHBOARD ]` active in dark blue.
  - Business Pulse, KPI cards (Revenue, Transactions, AOV, Growth), and AI Priority Feed render with live data.
  - Sidebar contains no "Rahul's Workspace" (clean executive navigation).

- [ ] **Employee Dashboard Prototype (`/employee`)**:
  Click `[ 👥 EMPLOYEE DASHBOARD (Rahul & Ananya) ]` in the top header. Verify:
  - You land on the Employee Prototype page (`/employee`).
  - The top sub-persona switch allows toggling between:
    - `[ 📣 Rahul Verma · Marketing Lead ]`: WhatsApp campaigns, AI customer opportunities, marketing tasks.
    - `[ ☕ Ananya Das · Floor Operations & Barista ]`: Store floor shift checklist (Cold Brew kegging, pastry stocking, POS shortcuts) and floor tasks.
  - The font sizes across badges, task titles, checklists, and metrics are medium, comfortable, and readable.

- [ ] **Test With Real Data (`/test-real-data`)**:
  Click `[ 📊 Test With Real Data ]` in the header or sidebar:
  - Click **Try Sample Cafe Transactions** or upload any real CSV.
  - Verify column mapping detects Amount and Date.
  - Click **Analyze Dataset**.
  - Verify deterministic math computes total revenue, AOV, hourly peak distribution, AI insights, and customer loyalty profiles.

---

## 7. Troubleshooting & Common Issues

### 1. Render Free Tier Cold Starts
- **Symptom**: The first API call takes 30–50 seconds after 15 minutes of inactivity.
- **Cause**: Render free web services spin down after idling.
- **Solution**: For demo presentations, visit `https://growkaro-api.onrender.com/health` 1 minute before your presentation to wake up the container. Alternatively, upgrade to Render Starter ($7/mo) for 24/7 zero-spin-down availability.

### 2. "MongooseServerSelectionError" on Render
- **Symptom**: Render backend logs show `Failed to connect to MongoDB: connect ETIMEDOUT`.
- **Cause**: MongoDB Atlas Network Access does not permit Render's IP.
- **Solution**: Go to MongoDB Atlas → **Network Access** → ensure `0.0.0.0/0` (Allow Access from Anywhere) is active.

### 3. Vercel 404 Error on Page Refresh
- **Symptom**: Visiting `https://growkaro.vercel.app/employee` directly gives a 404.
- **Cause**: Missing SPA rewrite rule.
- **Solution**: Ensure `frontend/vercel.json` exists with `{"rewrites": [{"source": "/(.*)", "destination": "/index.html"}]}` and redeploy on Vercel.

### 4. Empty Dashboard / Red Error Cards
- **Symptom**: Dashboard shows "Merchant not found" or empty transactions.
- **Solution**: Open the Render Shell and run `npm run demo:reset` to seed the database with benchmark merchant records.

---

**GrowKaro is now 100% production-ready for deployment on Render and Vercel!**
