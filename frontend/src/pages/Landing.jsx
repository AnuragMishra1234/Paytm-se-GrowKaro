import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMerchantContext } from "../context/MerchantContext";
import { fetchMerchants } from "../services/api";
import { getBusinessTypeInfo } from "../utils/formatters";
import PaytmLiveConnection from "../components/PaytmLiveConnection";

// Code Snippets for the Developer Section
const CODE_SNIPPETS = {
  CURL: `curl -X POST https://api.growkaro.in/api/n8n/webhook/action-status \\
  -H "Content-Type: application/json" \\
  -H "X-GrowKaro-Secret: \${N8N_WEBHOOK_SECRET}" \\
  -d '{
    "actionId": "act_6aad4ddea3570e25fb6f5bca",
    "merchantId": "mer_cafe_aroma_blr",
    "status": "SUCCESS",
    "deliveryStats": {
      "audience": 35,
      "delivered": 34,
      "channel": "WHATSAPP"
    }
  }'`,

  NODE: `const { executeActionWorkflow } = require('./services/n8nService');

// Dispatches approved campaign to n8n webhook pipeline
const result = await executeActionWorkflow({
  actionId: "act_6aad4ddea3570e25fb6f5bca",
  title: "₹199 Afternoon Combo (Cold Brew + Croissant)",
  channel: "WHATSAPP",
  targetAudience: "Repeat & nearby patrons",
  timing: "2:00 PM - 5:00 PM",
  payload: {
    headline: "Afternoon Coffee & Snack Break",
    body: "Beat the afternoon slump! Handcrafted cold brew with fresh croissant.",
    offer: "₹199 Combo"
  },
  approvedBy: "Rohan Kapoor (Owner)"
});

console.log("n8n Execution ID:", result.executionId);`,

  PYTHON: `import requests, os

# Trigger webhook for approved action
payload = {
    "actionId": "act_6aad4ddea3570e25fb6f5bca",
    "merchantId": "mer_cafe_aroma_blr",
    "status": "SUCCESS",
    "deliveryStats": {
        "audience": 35,
        "delivered": 34,
        "channel": "WHATSAPP"
    }
}

res = requests.post(
    "https://api.growkaro.in/api/n8n/webhook/action-status",
    json=payload,
    headers={"X-GrowKaro-Secret": os.getenv("N8N_SECRET")}
)
print("Response:", res.json())`,

  N8N: `{
  "name": "GrowKaro — Action Execution Workflow",
  "nodes": [
    {
      "parameters": { "httpMethod": "POST", "path": "growkaro-action" },
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook"
    },
    {
      "parameters": {
        "channel": "={{$json.body.channel}}",
        "message": "={{$json.body.payload.body}}",
        "offer": "={{$json.body.payload.offer}}"
      },
      "name": "WhatsApp Business Dispatch",
      "type": "n8n-nodes-base.httpRequest"
    },
    {
      "parameters": {
        "status": "SUCCESS",
        "actionId": "={{$json.body.actionId}}"
      },
      "name": "Report Status to GrowKaro",
      "type": "n8n-nodes-base.httpRequest"
    }
  ]
}`,

  OUTCOME: `// Deterministic Outcome Measurement (Non-Causal Attribution)
{
  "merchant": "Cafe Aroma (Bengaluru)",
  "campaign": "₹199 Afternoon Combo",
  "metric": "REVENUE",
  "measurementWindow": "3-day afternoon window (2 PM - 5 PM)",
  "baselineValue": 4200,
  "postActionValue": 5350,
  "observedDelta": "+₹1,150",
  "observedLift": "+27.4%",
  "standard": "NON_CAUSAL_CORRELATION",
  "memoryStored": true,
  "groqPersonalized": true
}`
};

export default function Landing() {
  const navigate = useNavigate();
  const { setMerchant } = useMerchantContext();
  const [activeCodeTab, setActiveCodeTab] = useState("CURL");
  const [copied, setCopied] = useState(false);
  const [showMerchantModal, setShowMerchantModal] = useState(false);
  const [merchantsList, setMerchantsList] = useState([]);
  const [loadingMerchants, setLoadingMerchants] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(CODE_SNIPPETS[activeCodeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openMerchantModal = async () => {
    setShowMerchantModal(true);
    if (merchantsList.length === 0) {
      setLoadingMerchants(true);
      try {
        const res = await fetchMerchants();
        setMerchantsList(res.data || []);
      } catch (err) {
        console.error("Failed to load merchants:", err);
      } finally {
        setLoadingMerchants(false);
      }
    }
  };

  const handleSelectMerchant = (m) => {
    setMerchant(m);
    navigate("/dashboard");
  };

  const codeLines = (CODE_SNIPPETS[activeCodeTab] || "").split("\n");

  const devFeatures = [
    "Rest based APIs with response returned in JSON",
    "Sample CURL & Node.js webhook request/response",
    "Code snippets for multiple backend languages",
    "Deterministic outcome measurement & non-causal attribution"
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 selection:bg-blue-100 selection:text-blue-900 font-sans w-full">
      {/* ─── 1. TOP NAVBAR (Edge-to-edge / Full Width) ────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 w-full">
        <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-20 2xl:px-24 h-20 sm:h-24 flex items-center justify-between">
          {/* Brand Logo on Left */}
          <Link to="/" className="flex items-center gap-3.5 group shrink-0 py-1">
            <img 
              src="/logo-transparent.png" 
              alt="GrowKaro Logo" 
              className="h-14 sm:h-16 lg:h-[70px] w-auto object-contain transition-transform group-hover:scale-105" 
            />
            <span className="text-base sm:text-lg font-bold text-gray-500 hidden sm:inline-block border-l-2 border-gray-300 pl-3.5 ml-1 self-center">
              for Business
            </span>
          </Link>

          {/* Desktop Nav Links in Center */}
          <nav className="hidden lg:flex items-center gap-8 xl:gap-11 text-[15px] font-medium text-gray-700">
            <a href="#overview" className="hover:text-[#002970] transition-colors">
              Overview
            </a>
            <a href="#in-store" className="hover:text-[#002970] transition-colors">
              In-Store Telemetry
            </a>
            <a href="#campaigns" className="hover:text-[#002970] transition-colors">
              Agentic Campaigns
            </a>
            <a href="#developer" className="hover:text-[#002970] transition-colors">
              n8n &amp; Developers
            </a>
            <a href="#outcomes" className="hover:text-[#002970] transition-colors">
              Measured ROI
            </a>
          </nav>

          {/* Right Action Buttons on Right */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <button
              onClick={openMerchantModal}
              className="hidden sm:inline-flex items-center justify-center px-5 py-2.5 rounded-full text-[14px] font-semibold text-gray-800 bg-white border border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all"
            >
              <span>Select Demo Merchant</span>
              <span className="ml-1 text-xs">›</span>
            </button>
            <button
              onClick={openMerchantModal}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full text-[14px] font-bold text-white bg-[#00baf2] hover:bg-[#00a8dc] transition-all shadow-sm hover:shadow"
            >
              <span>Launch Console</span>
              <span className="text-sm font-light">›</span>
            </button>
          </div>
        </div>
      </header>

      {/* ─── 2. HERO SECTION (Spacious & Full-Width Adjusted) ─────────────────── */}
      <section id="overview" className="relative pt-20 pb-28 sm:pt-24 sm:pb-36 overflow-hidden w-full">
        {/* Subtle ambient background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[650px] bg-gradient-to-b from-sky-50/70 via-blue-50/30 to-transparent pointer-events-none -z-10" />

        <div className="w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
            {/* Left Headline & Action Column */}
            <div className="lg:col-span-7 text-left space-y-6">
              {/* Partner Pill Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50/90 border border-blue-200/80 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#00baf2]" />
                <span className="text-xs font-bold text-[#002970] uppercase tracking-wider">
                  Paytm Ecosystem Partner
                </span>
                <span className="text-gray-300">|</span>
                <span className="text-xs font-semibold text-gray-600">
                  Smart Retail Intelligence
                </span>
              </div>

              {/* Grand Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-[54px] xl:text-[60px] font-extrabold text-[#0f172a] tracking-tight leading-[1.12]">
                Your AI Business Partner, powered by real Paytm transactions
              </h1>

              {/* Clean Subtitle Paragraph */}
              <p className="text-lg sm:text-[19px] text-gray-600 font-normal leading-relaxed max-w-2xl">
                Grow your business with intelligence from your transactions. GrowKaro watches live UPI and Soundbox activity, detects quiet hours, drafts merchant-approved promotions, executes through n8n workflows, and measures verified revenue lift.
              </p>

              {/* Primary CTA Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <button
                  onClick={openMerchantModal}
                  className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full text-base font-bold text-white bg-[#002970] hover:bg-[#001f54] transition-all shadow-xl shadow-[#002970]/20 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Become a GrowKaro Merchant</span>
                  <span className="text-lg font-light">›</span>
                </button>
                <button
                  onClick={openMerchantModal}
                  className="inline-flex items-center gap-2 px-6 py-4 rounded-full text-base font-semibold text-gray-700 bg-white border border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all"
                >
                  <span>Explore Sandbox Store</span>
                  <span className="text-xs">›</span>
                </button>
              </div>

              {/* Trust & Architecture Pipeline */}
              <div className="pt-2 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs font-medium text-gray-500">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Continuous Soundbox Sync</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00baf2]" />
                  <span>Zero Fake Telemetry</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  <span>Autonomous n8n Actions</span>
                </div>
              </div>
            </div>

            {/* Right 3D Paytm Connection Visualization */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <PaytmLiveConnection className="w-full max-w-sm sm:max-w-md" />
            </div>
          </div>
        </div>

        {/* ─── Hero Showcase Mockup (Spacious Full-Width Container) ──────────── */}
        <div className="w-full max-w-[1680px] mx-auto px-6 sm:px-10 lg:px-16 xl:px-20 2xl:px-24 mt-20 sm:mt-24">
          <div className="relative rounded-[32px] sm:rounded-[40px] p-5 sm:p-10 md:p-12 bg-gradient-to-b from-[#00b9f5]/15 via-blue-50/40 to-white border border-blue-100 shadow-2xl">
            {/* AI Badge floating in top right */}
            <div className="absolute -top-4 right-8 sm:right-16 bg-white border border-sky-200 px-4 py-1.5 rounded-full shadow-lg flex items-center gap-2 text-xs font-bold text-[#002970]">
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
              <span>AI Autonomous Loop</span>
            </div>

            {/* Dashboard Content Container */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-10 shadow-sm border border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-100 gap-4">
                <div className="flex items-center gap-3.5">
                  <img 
                    src="/logo-transparent.png" 
                    alt="GrowKaro" 
                    className="w-12 h-12 sm:w-14 sm:h-14 object-contain shrink-0" 
                  />
                  <div>
                    <h3 className="font-extrabold text-gray-900 text-base sm:text-lg">
                      GrowKaro Smart Retail — India
                    </h3>
                    <p className="text-xs text-gray-400">Merchant: Cafe Aroma · Indiranagar, Bengaluru</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-700 px-3.5 py-1.5 rounded-full font-semibold border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Soundbox Active
                  </span>
                  <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-4 py-1.5 rounded-full">
                    <span className="text-xs font-bold text-[#002970]">Groq AI Partner</span>
                  </div>
                </div>
              </div>

              {/* Mockup Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 mt-8">
                {/* Left Mini Stats & Trend */}
                <div className="lg:col-span-8 space-y-6">
                  <div className="grid grid-cols-3 gap-4 sm:gap-6">
                    <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-100">
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Today's Revenue</p>
                      <p className="text-xl sm:text-3xl font-extrabold text-gray-900 mt-1">₹80,000</p>
                      <p className="text-[11px] text-emerald-600 font-bold mt-1">+14.2% vs yesterday</p>
                    </div>
                    <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-100">
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Settlement</p>
                      <p className="text-xl sm:text-3xl font-extrabold text-gray-900 mt-1">₹79,000</p>
                      <p className="text-[11px] text-blue-600 font-semibold mt-1">Instant UPI Settle</p>
                    </div>
                    <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-100">
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Observed Lift</p>
                      <p className="text-xl sm:text-3xl font-extrabold text-emerald-700 mt-1">+27.4%</p>
                      <p className="text-[11px] text-purple-700 font-semibold mt-1">Past Combo Campaign</p>
                    </div>
                  </div>

                  {/* Mockup Wave Trend */}
                  <div className="bg-gradient-to-br from-blue-50/30 to-white p-6 rounded-2xl border border-blue-100">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-bold text-gray-800">Hourly Footfall &amp; UPI Volume Density</p>
                      <span className="text-[11px] text-gray-400">Peak: 7 PM - 9:30 PM (₹28,400)</span>
                    </div>
                    <div className="h-32 flex items-end justify-between gap-2.5 pt-4 px-2">
                      {[15, 20, 35, 75, 85, 22, 18, 25, 60, 95, 80, 45].map((h, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                          <div
                            style={{ height: `${h}%` }}
                            className={`w-full rounded-t transition-all ${
                              i === 5 || i === 6
                                ? "bg-amber-400/80"
                                : "bg-[#002970]"
                            }`}
                          />
                          <span className="text-[10px] text-gray-400 font-medium">{i + 10}h</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-amber-700 font-medium text-center mt-3.5 bg-amber-50 py-2 rounded-lg">
                      Notice: Yellow bars flag 2 PM – 4:30 PM lull (68% lower traffic) → AI triggered ₹199 Combo Draft
                    </p>
                  </div>
                </div>

                {/* Right Floating Mobile WhatsApp Preview */}
                <div className="lg:col-span-4 bg-[#e5ddd5]/30 p-6 rounded-2xl border border-emerald-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-emerald-300/40 pb-3 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#25d366]" />
                        <span className="text-xs font-bold text-emerald-950">WhatsApp Business Dispatch</span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono">2:05 PM</span>
                    </div>
                    <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm space-y-3 border border-emerald-100">
                      <p className="font-extrabold text-gray-900 text-xs sm:text-sm">Afternoon Coffee &amp; Snack Break</p>
                      <p className="text-xs text-gray-700 leading-relaxed">
                        Beat the afternoon slump! Enjoy our handcrafted Cold Brew with a freshly baked Butter Croissant for ₹199.
                      </p>
                      <div className="flex items-center justify-between pt-2 border-t text-[11px]">
                        <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded">
                          ₹199 Combo
                        </span>
                        <span className="text-blue-600 font-semibold">Valid 2 PM - 5 PM</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-emerald-200/60 flex items-center justify-between text-xs">
                    <span className="text-gray-500">Audience: <strong>34 Delivered</strong></span>
                    <span className="text-emerald-700 font-bold">Approved by Owner</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. OFFLINE PAYMENTS & IN-STORE COMMERCE (Full-Width Adjusted) ──── */}
      <section id="in-store" className="py-28 sm:py-32 bg-gray-50/60 border-t border-gray-100 w-full">
        <div className="w-full max-w-[1680px] mx-auto px-6 sm:px-10 lg:px-16 xl:px-20 2xl:px-24">
          <div className="text-center max-w-4xl mx-auto space-y-4 mb-16 sm:mb-20">
            <p className="text-xs font-extrabold uppercase tracking-widest text-[#00baf2]">
              Offline Payments &amp; In-Store Commerce
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0f172a] tracking-tight leading-tight">
              Upgrade your business with future-ready, AI-powered in-store merchant intelligence
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto">
              Your UPI QR Standee and Payment Soundbox do more than announce payments. GrowKaro turns every beep into actionable customer intelligence.
            </p>
          </div>

          {/* Large Hero In-Store Banner Card */}
          <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-[#002970] rounded-[32px] p-8 sm:p-14 lg:p-16 text-white shadow-xl relative overflow-hidden mb-16 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
              <div className="lg:col-span-7 space-y-6">
                <span className="inline-flex items-center gap-2 bg-blue-500/20 text-sky-300 border border-sky-400/30 px-4 py-1.5 rounded-full text-xs font-semibold">
                  Soundbox Audio Sync + Dynamic UPI
                </span>
                <h3 className="text-2xl sm:text-4xl lg:text-[42px] font-extrabold leading-snug">
                  Every scan feeds your autonomous merchant memory
                </h3>
                <p className="text-sm sm:text-base text-gray-300 leading-relaxed max-w-2xl">
                  GrowKaro continuously digests live transaction feeds across peak lunchtime rushes, quiet mid-day windows, and weekend spikes. It detects anomalies without requiring you to maintain complex spreadsheets.
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <span className="bg-white/10 px-4 py-2 rounded-xl text-xs font-medium backdrop-blur">
                    Instant Settlement Telemetry
                  </span>
                  <span className="bg-white/10 px-4 py-2 rounded-xl text-xs font-medium backdrop-blur">
                    Basket Size &amp; AOV Tracking
                  </span>
                  <span className="bg-white/10 px-4 py-2 rounded-xl text-xs font-medium backdrop-blur">
                    Zero Data Entry Required
                  </span>
                </div>
              </div>

              {/* Realistic Soundbox Simulation Visual */}
              <div className="lg:col-span-5 bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 space-y-5">
                <div className="flex items-center justify-between text-xs text-blue-200">
                  <span>Smart Soundbox 4.0</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Live Connected
                  </span>
                </div>
                <div className="bg-black/30 p-6 rounded-xl space-y-2">
                  <p className="text-xs text-gray-400">Latest UPI Payment Received</p>
                  <p className="text-3xl sm:text-4xl font-extrabold text-white">₹199.00</p>
                  <p className="text-xs text-sky-300 italic pt-1">
                    "Paytm par ek sau ninyanve rupaye prapt hue"
                  </p>
                </div>
                <div className="text-xs text-gray-300 bg-white/5 p-4 rounded-xl flex items-center justify-between">
                  <span>Customer: Rahul V. (Repeat Patron)</span>
                  <span className="text-emerald-400 font-semibold">+₹45 vs avg</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3 Pillar Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10 w-full">
            <div className="card p-8 sm:p-10 space-y-4 hover:shadow-lg transition-all rounded-2xl border border-gray-100">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-sm font-black">
                01
              </div>
              <h4 className="text-xl font-bold text-gray-900">Real-Time Transaction Stream</h4>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Connects directly to MongoDB Atlas transaction ledgers. Analyzes over 5,000+ customer payments across products, hours, and days.
              </p>
            </div>

            <div className="card p-8 sm:p-10 space-y-4 hover:shadow-lg transition-all rounded-2xl border border-gray-100">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center text-sm font-black">
                02
              </div>
              <h4 className="text-xl font-bold text-gray-900">Weak Hour &amp; Lull Detection</h4>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Automatically isolates slow periods (e.g. 2:00 PM – 4:30 PM weekdays) where footfall drops by 65%-75% and prepares targeted remedies.
              </p>
            </div>

            <div className="card p-8 sm:p-10 space-y-4 hover:shadow-lg transition-all rounded-2xl border border-gray-100">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center text-sm font-black">
                03
              </div>
              <h4 className="text-xl font-bold text-gray-900">Velocity &amp; Category Shifts</h4>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Pinpoints declining items (like cooking oil at Kirana) or surging high-margin services (head massages at salon) with root causes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. AGENTIC ACTIONS & AUTOMATED CAMPAIGNS (Full-Width Adjusted) ─── */}
      <section id="campaigns" className="py-28 sm:py-32 bg-white w-full">
        <div className="w-full max-w-[1680px] mx-auto px-6 sm:px-10 lg:px-16 xl:px-20 2xl:px-24">
          <div className="text-center max-w-4xl mx-auto space-y-4 mb-16 sm:mb-20">
            <p className="text-xs font-extrabold uppercase tracking-widest text-[#00baf2]">
              Autonomous Campaign Engine
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0f172a] tracking-tight leading-tight">
              Turn slow business hours into profit with automated, merchant-approved promotions
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto">
              GrowKaro drafts, designs, and targets promotional offers during quiet windows, leaving you in full control of approval and pricing.
            </p>
          </div>

          {/* Campaign Banner Card */}
          <div className="bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-white rounded-[32px] p-8 sm:p-14 lg:p-16 border border-blue-200/80 shadow-xl mb-16 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
              <div className="lg:col-span-6 space-y-6">
                <span className="badge bg-blue-100 text-[#002970] text-xs font-bold px-3.5 py-1">
                  Merchant-in-the-Loop Governance
                </span>
                <h3 className="text-2xl sm:text-3xl lg:text-[38px] font-extrabold text-[#0f172a] leading-snug">
                  AI drafts the campaign. You review and approve with 1 click.
                </h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  GrowKaro never broadcasts without your consent. The AI inspects active stock, checks weather conditions, and drafts WhatsApp copy. You can edit the text, change the discount, or reject with a reason that is remembered forever.
                </p>
                <div className="flex items-center gap-4 pt-2">
                  <button
                    onClick={openMerchantModal}
                    className="px-7 py-3 rounded-full text-xs font-bold text-white bg-[#002970] hover:bg-[#001f54] transition-all shadow-md"
                  >
                    Test Campaign Approval Flow →
                  </button>
                  <span className="text-xs text-gray-400">Zero setup required</span>
                </div>
              </div>

              {/* Visual Approval Card Showcase */}
              <div className="lg:col-span-6 bg-white p-6 sm:p-8 lg:p-10 rounded-2xl shadow-lg border border-gray-200 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b">
                  <span className="badge bg-amber-100 text-amber-800 text-xs font-bold">
                    Approval Gate Awaiting Sign-Off
                  </span>
                  <span className="text-xs text-gray-400 font-mono">Channel: WhatsApp Business</span>
                </div>
                <div className="space-y-2">
                  <div className="bg-gray-50 p-5 rounded-xl border text-xs sm:text-sm space-y-1.5">
                    <p className="font-bold text-gray-900">Headline: Afternoon Coffee &amp; Snack Break</p>
                    <p className="text-gray-600">
                      Body: Beat the afternoon slump! Recharge with our ₹199 cold brew &amp; croissant combo.
                    </p>
                    <p className="text-blue-700 font-semibold pt-1">Offer: ₹199 Bundle (No % margin dilution)</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-gray-500">Audience: <strong>35 Verified Patrons</strong></span>
                  <div className="flex gap-2">
                    <span className="text-xs text-red-600 px-3 py-1.5 font-semibold cursor-pointer">Reject</span>
                    <span className="text-xs bg-[#002970] text-white px-5 py-2.5 rounded-lg font-bold">
                      Approve &amp; Execute
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3 Value Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10 w-full">
            <div className="card p-8 sm:p-10 space-y-4 hover:shadow-lg transition-all rounded-2xl border border-gray-100">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-sm font-black">
                01
              </div>
              <h4 className="text-xl font-bold text-gray-900">Grounded Groq AI Copywriting</h4>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Powered by Groq LLM inference. Only recommends verified catalogue items. Respects merchant pricing rules like combo bundles over percentage markdowns.
              </p>
            </div>

            <div className="card p-8 sm:p-10 space-y-4 hover:shadow-lg transition-all rounded-2xl border border-gray-100">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-sm font-black">
                02
              </div>
              <h4 className="text-xl font-bold text-gray-900">Deterministic Approval Gate</h4>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Backend security strictly rejects any automated dispatch without an explicit cryptographic approval status. Zero rogue automation.
              </p>
            </div>

            <div className="card p-8 sm:p-10 space-y-4 hover:shadow-lg transition-all rounded-2xl border border-gray-100">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center text-sm font-black">
                03
              </div>
              <h4 className="text-xl font-bold text-gray-900">Verified Outcome Attribution</h4>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Deterministic before vs after window calculations. Strictly reports observed change (+27.4%) without false causal claims.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 5. DEVELOPER & n8n SECTION (Full-Width Adjusted Dark Mode) ─────── */}
      <section id="developer" className="py-32 sm:py-40 bg-[#060911] text-white relative overflow-hidden w-full">
        <div className="w-full max-w-[1680px] mx-auto px-6 sm:px-10 lg:px-16 xl:px-20 2xl:px-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 xl:gap-24 items-center w-full">
            {/* Left Content */}
            <div className="lg:col-span-5 space-y-8">
              <h2 className="text-4xl sm:text-5xl lg:text-[48px] font-extrabold tracking-tight leading-[1.15] text-white">
                Developer-friendly APIs<br />for seamless integration
              </h2>

              {/* Checklist items with generous spacing & clean circle ticks */}
              <div className="space-y-7 sm:space-y-8 pt-4">
                {devFeatures.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="w-7 h-7 rounded-full border border-gray-600 bg-black flex items-center justify-center shrink-0 shadow-inner">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="text-base sm:text-[17px] font-medium text-white leading-snug">
                      {feat}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-4">
                <button
                  onClick={openMerchantModal}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border border-white/30 hover:border-white text-white text-sm sm:text-base font-semibold transition-all hover:bg-white/10"
                >
                  <span>View Documentation</span>
                  <span className="text-sm font-light">›</span>
                </button>
              </div>
            </div>

            {/* Right Interactive Code Inspector */}
            <div className="lg:col-span-7 relative w-full">
              {/* Soft ambient glowing background orbs */}
              <div className="absolute -top-12 -left-12 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-12 -right-12 w-80 h-80 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />

              <div className="relative bg-[#121824]/90 rounded-[28px] border border-white/10 shadow-2xl p-7 sm:p-10 lg:p-12 backdrop-blur-2xl w-full">
                {/* Language Tabs Row */}
                <div className="flex items-center justify-between pb-6 border-b border-gray-800/80">
                  <div className="flex items-center gap-6 sm:gap-8 overflow-x-auto">
                    {Object.keys(CODE_SNIPPETS).map((tab) => {
                      const isActive = activeCodeTab === tab;
                      return (
                        <button
                          key={tab}
                          onClick={() => setActiveCodeTab(tab)}
                          className={
                            isActive
                              ? "bg-[#1e293b] text-[#00baf2] border border-[#00baf2]/40 px-4 py-1.5 rounded-full font-mono text-xs sm:text-[13px] font-bold tracking-wider transition-all shadow-sm"
                              : "text-gray-400 hover:text-white font-mono text-xs sm:text-[13px] font-medium tracking-wider transition-colors"
                          }
                        >
                          {tab}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Code Body with Line Numbers */}
                <div className="mt-6 flex font-mono text-xs sm:text-[13px] leading-[1.7] max-h-[420px] overflow-y-auto">
                  {/* Line Numbers Column */}
                  <div className="select-none text-gray-600 text-right pr-5 border-r border-gray-800/60 shrink-0 space-y-0.5">
                    {codeLines.map((_, i) => (
                      <div key={i}>{i + 1}</div>
                    ))}
                  </div>

                  {/* Code Text Column */}
                  <div className="pl-5 overflow-x-auto text-gray-200 space-y-0.5 w-full">
                    {codeLines.map((line, i) => (
                      <div key={i} className="whitespace-pre">
                        {line || " "}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Card Actions */}
                <div className="mt-8 pt-4 border-t border-gray-800/80 flex items-center justify-between">
                  <button
                    onClick={openMerchantModal}
                    className="text-[#00baf2] hover:text-[#38bdf8] font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-colors"
                  >
                    <span>Know More</span>
                    <span>›</span>
                  </button>

                  <button
                    onClick={handleCopy}
                    className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2 text-xs"
                    title="Copy code to clipboard"
                  >
                    {copied && <span className="text-emerald-400 font-medium">Copied!</span>}
                    <svg
                      className="w-5 h-5 text-gray-400 hover:text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 6. OUTCOMES & MERCHANT STORIES SECTION (Full-Width Adjusted) ────── */}
      <section id="outcomes" className="py-28 sm:py-32 bg-white w-full">
        <div className="w-full max-w-[1680px] mx-auto px-6 sm:px-10 lg:px-16 xl:px-20 2xl:px-24">
          <div className="text-center max-w-4xl mx-auto space-y-4 mb-16 sm:mb-20">
            <p className="text-xs font-extrabold uppercase tracking-widest text-[#00baf2]">
              Verified Business Impact
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0f172a] tracking-tight leading-tight">
              Real results across all 3 seeded demo merchants
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto">
              Choose any merchant to immediately inspect their live transactions, detected opportunities, approved campaigns, and measured ROI.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10 w-full">
            {/* Cafe Aroma */}
            <div
              className="card p-8 sm:p-10 space-y-5 border-2 border-transparent hover:border-blue-400 transition-all cursor-pointer rounded-[28px] shadow-sm hover:shadow-md"
              onClick={openMerchantModal}
            >
              <div className="flex items-center justify-between">
                <div className="w-16 h-16 rounded-2xl bg-white border border-gray-100 p-1.5 flex items-center justify-center shadow-xs overflow-hidden">
                  <img src="/merchants/cafe-logo.png" alt="Cafe Aroma" className="w-full h-full object-contain" />
                </div>
                <span className="badge bg-emerald-100 text-emerald-800 font-bold px-3 py-1">+27.4% Revenue Lift</span>
              </div>
              <h3 className="text-2xl font-extrabold text-gray-900">Cafe Aroma</h3>
              <p className="text-xs text-gray-500">Indiranagar, Bengaluru · Specialty Coffee</p>
              <div className="bg-gray-50 p-5 rounded-xl text-xs space-y-1.5">
                <p className="font-semibold text-gray-800">Afternoon Lull Recovery</p>
                <p className="text-gray-600">
                  Pre-campaign: ₹4,200 → Post-campaign: ₹5,350 (+₹1,150). Activated ₹199 Afternoon Combo.
                </p>
              </div>
              <button className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                <span>Enter Cafe Aroma Console</span>
                <span>→</span>
              </button>
            </div>

            {/* Fresh Kirana */}
            <div
              className="card p-8 sm:p-10 space-y-5 border-2 border-transparent hover:border-blue-400 transition-all cursor-pointer rounded-[28px] shadow-sm hover:shadow-md"
              onClick={openMerchantModal}
            >
              <div className="flex items-center justify-between">
                <div className="w-16 h-16 rounded-2xl bg-white border border-gray-100 p-1.5 flex items-center justify-center shadow-xs overflow-hidden">
                  <img src="/merchants/kirana-logo.png" alt="Fresh Kirana Store" className="w-full h-full object-contain" />
                </div>
                <span className="badge bg-blue-100 text-[#002970] font-bold px-3 py-1">+₹45 Basket Size</span>
              </div>
              <h3 className="text-2xl font-extrabold text-gray-900">Fresh Kirana Store</h3>
              <p className="text-xs text-gray-500">Dadar West, Mumbai · Daily Groceries</p>
              <div className="bg-gray-50 p-5 rounded-xl text-xs space-y-1.5">
                <p className="font-semibold text-gray-800">Countertop Impulse Merchandising</p>
                <p className="text-gray-600">
                  Pre-campaign AOV: ₹185 → Post-campaign: ₹230 (+24.3%). Placed quick snacks near UPI soundbox.
                </p>
              </div>
              <button className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                <span>Enter Fresh Kirana Console</span>
                <span>→</span>
              </button>
            </div>

            {/* Style Studio */}
            <div
              className="card p-8 sm:p-10 space-y-5 border-2 border-transparent hover:border-blue-400 transition-all cursor-pointer rounded-[28px] shadow-sm hover:shadow-md"
              onClick={openMerchantModal}
            >
              <div className="flex items-center justify-between">
                <div className="w-16 h-16 rounded-2xl bg-white border border-gray-100 p-1.5 flex items-center justify-center shadow-xs overflow-hidden">
                  <img src="/merchants/style-studio-logo.png" alt="Style Studio Salon" className="w-full h-full object-contain" />
                </div>
                <span className="badge bg-purple-100 text-purple-800 font-bold px-3 py-1">+62.5% Midweek Visits</span>
              </div>
              <h3 className="text-2xl font-extrabold text-gray-900">Style Studio Salon</h3>
              <p className="text-xs text-gray-500">Jubilee Hills, Hyderabad · Hair &amp; Wellness</p>
              <div className="bg-gray-50 p-5 rounded-xl text-xs space-y-1.5">
                <p className="font-semibold text-gray-800">VIP Midweek Appointment Perks</p>
                <p className="text-gray-600">
                  Chair bookings: 16 visits → 26 visits (+10 appointments). Targeted VIP WhatsApp reminders.
                </p>
              </div>
              <button className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                <span>Enter Style Studio Console</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 7. FINAL CTA STRIP ──────────────────────────────────────────────── */}
      <section className="py-20 sm:py-24 bg-[#002970] text-white w-full">
        <div className="w-full max-w-5xl mx-auto px-6 text-center space-y-8">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Ready to experience autonomous merchant intelligence?
          </h2>
          <p className="text-base sm:text-lg text-blue-100 max-w-2xl mx-auto">
            Test the complete loop: Observe transactions, detect opportunities, approve campaigns, and measure lift in real-time.
          </p>
          <div>
            <button
              onClick={openMerchantModal}
              className="px-10 py-4 rounded-full text-base font-bold text-[#002970] bg-white hover:bg-gray-100 transition-all shadow-xl hover:scale-105 active:scale-95"
            >
              Launch GrowKaro Console Now ›
            </button>
          </div>
        </div>
      </section>

      {/* ─── 8. FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="bg-gray-950 text-gray-400 py-16 sm:py-20 border-t border-gray-900 text-xs w-full">
        <div className="w-full max-w-[1680px] mx-auto px-6 sm:px-10 lg:px-16 xl:px-20 2xl:px-24 grid grid-cols-2 md:grid-cols-4 gap-10 sm:gap-14">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/95 p-1 rounded-xl shadow-sm inline-flex items-center justify-center">
                <img 
                  src="/logo-transparent.png" 
                  alt="GrowKaro" 
                  className="h-8 w-auto object-contain" 
                />
              </div>
              <span className="font-extrabold text-white text-base">GrowKaro</span>
            </div>
            <p className="text-gray-400 leading-relaxed text-xs">
              Autonomous business partner for digital payment merchants. Built for modern retail, cafes, and service businesses.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4 uppercase tracking-wider text-xs">Core Features</h4>
            <ul className="space-y-2.5 text-xs">
              <li><a href="#overview" className="hover:text-white">Live Transaction Telemetry</a></li>
              <li><a href="#campaigns" className="hover:text-white">Merchant Approval Gate</a></li>
              <li><a href="#developer" className="hover:text-white">n8n Automation Engine</a></li>
              <li><a href="#outcomes" className="hover:text-white">Deterministic Outcome Attribution</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4 uppercase tracking-wider text-xs">Demo Merchants</h4>
            <ul className="space-y-2.5 text-xs">
              <li><button onClick={openMerchantModal} className="hover:text-white">Cafe Aroma (Bengaluru)</button></li>
              <li><button onClick={openMerchantModal} className="hover:text-white">Fresh Kirana (Mumbai)</button></li>
              <li><button onClick={openMerchantModal} className="hover:text-white">Style Studio (Hyderabad)</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4 uppercase tracking-wider text-xs">Technology Stack</h4>
            <p className="text-xs leading-relaxed text-gray-400">
              Groq LLM Reasoning · MongoDB Atlas · n8n Automation · Cognee Memory · React · Node.js · Express
            </p>
            <p className="text-[11px] text-gray-500 mt-6">
              GrowKaro © 2026. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* ─── 9. DEMO MERCHANT LAUNCHER MODAL ─────────────────────────────────── */}
      {showMerchantModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] max-w-lg w-full p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="font-extrabold text-xl text-gray-900">Select Demo Merchant</h3>
                <p className="text-xs text-gray-500 mt-0.5">Pick a business profile to launch into the console</p>
              </div>
              <button
                onClick={() => setShowMerchantModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg p-1"
              >
                &times;
              </button>
            </div>

            {loadingMerchants ? (
              <div className="py-8 text-center text-xs text-gray-400">Loading merchants...</div>
            ) : (
              <div className="space-y-3.5">
                {merchantsList.map((m) => {
                  const { label, logo } = getBusinessTypeInfo(m.businessType, m.businessName);
                  return (
                    <button
                      key={m._id}
                      onClick={() => handleSelectMerchant(m)}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-200 hover:border-[#002970] hover:bg-blue-50/30 text-left transition-all group"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-white border border-gray-200 p-1 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform overflow-hidden shrink-0">
                        <img src={logo} alt={m.businessName} className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-extrabold text-gray-900 text-sm group-hover:text-[#002970]">
                          {m.businessName}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {label} · {m.location?.city || "India"}
                        </p>
                      </div>
                      <span className="text-[#002970] font-bold text-sm">Launch →</span>
                    </button>
                  );
                })}
              </div>
            )}

            <p className="text-xs text-gray-400 text-center">
              Each merchant comes pre-loaded with transactions, proactive AI insights, and measured outcomes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
