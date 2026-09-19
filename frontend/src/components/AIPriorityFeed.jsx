import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useMerchantContext } from "../context/MerchantContext";
import {
  createActionDraft,
  approveAction,
  rejectAction,
  fetchAutomatedDailyBrief,
  generateAutomatedDailyBrief,
  fetchAutomatedWeeklyReview,
  generateAutomatedWeeklyReview,
} from "../services/api";
import { ActionReviewModal } from "./ActionReviewModal";

const categoryMeta = {
  ACT_NOW: {
    label: "ACT NOW",
    badge: "bg-red-100 text-red-800 border-red-200",
    border: "border-red-300 bg-red-50/30",
    icon: "🔴",
  },
  OPPORTUNITY: {
    label: "OPPORTUNITY",
    badge: "bg-amber-100 text-amber-800 border-amber-200",
    border: "border-amber-300 bg-amber-50/30",
    icon: "🟡",
  },
  WARNING: {
    label: "WARNING",
    badge: "bg-orange-100 text-orange-800 border-orange-200",
    border: "border-orange-300 bg-orange-50/30",
    icon: "🟠",
  },
  POSITIVE_TREND: {
    label: "POSITIVE TREND",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
    border: "border-emerald-300 bg-emerald-50/30",
    icon: "🟢",
  },
};

const confidenceMeta = {
  HIGH: {
    label: "HIGH CONFIDENCE",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-300",
  },
  MEDIUM: {
    label: "MEDIUM CONFIDENCE",
    badge: "bg-blue-100 text-blue-800 border-blue-300",
  },
  LOW: {
    label: "LOW CONFIDENCE",
    badge: "bg-amber-100 text-amber-800 border-amber-300",
  },
};

const getContextText = (ctx) => {
  if (!ctx) return null;
  if (typeof ctx === "string") return ctx.trim() || null;
  if (typeof ctx === "object") {
    return (ctx.summary || ctx.note || "").trim() || null;
  }
  return null;
};

export function AIPriorityFeed({ insights = [], loading = false, dailyBrief = null, onRefresh = null }) {
  const { merchant } = useMerchantContext();
  const [activeTab, setActiveTab] = useState("noticed"); // 'noticed' | 'daily' | 'weekly'
  const [selectedInsight, setSelectedInsight] = useState(null);
  const [activeAction, setActiveAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Daily Brief state
  const [briefData, setBriefData] = useState(dailyBrief);
  const [briefLoading, setBriefLoading] = useState(false);

  // Weekly Review state
  const [weeklyData, setWeeklyData] = useState(null);
  const [weeklyLoading, setWeeklyLoading] = useState(false);

  useEffect(() => {
    if (dailyBrief) {
      setBriefData(dailyBrief);
    } else if (merchant?._id && activeTab === "daily" && !briefData) {
      loadDailyBrief();
    }
  }, [dailyBrief, merchant?._id, activeTab]);

  useEffect(() => {
    if (merchant?._id && activeTab === "weekly" && !weeklyData) {
      loadWeeklyReview();
    }
  }, [merchant?._id, activeTab]);

  const loadDailyBrief = async (refresh = false) => {
    if (!merchant?._id) return;
    setBriefLoading(true);
    try {
      const res = refresh
        ? await generateAutomatedDailyBrief(merchant._id)
        : await fetchAutomatedDailyBrief(merchant._id);
      setBriefData(res.data);
    } catch (err) {
      console.error("Failed to fetch daily brief:", err);
    } finally {
      setBriefLoading(false);
    }
  };

  const loadWeeklyReview = async (refresh = false) => {
    if (!merchant?._id) return;
    setWeeklyLoading(true);
    try {
      const res = refresh
        ? await generateAutomatedWeeklyReview(merchant._id)
        : await fetchAutomatedWeeklyReview(merchant._id);
      setWeeklyData(res.data);
    } catch (err) {
      console.error("Failed to fetch weekly review:", err);
    } finally {
      setWeeklyLoading(false);
    }
  };

  const handleTakeAction = async (insight) => {
    if (!merchant?._id || !insight?._id) return;
    setActionLoading(true);
    try {
      const res = await createActionDraft({
        merchantId: merchant._id,
        insightId: insight._id,
      });
      setActiveAction(res.data);
      setSelectedInsight(null);
    } catch (err) {
      console.error("Failed to draft action:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveAction = async (actionId, finalPayload) => {
    if (!merchant?._id) return;
    setActionLoading(true);
    try {
      const res = await approveAction(actionId, { merchantId: merchant._id, ...finalPayload });
      setActiveAction(res.data);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Failed to execute action:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectAction = async (actionId, reason) => {
    if (!merchant?._id) return;
    setActionLoading(true);
    try {
      const res = await rejectAction(actionId, { merchantId: merchant._id, reason });
      setActiveAction(res.data);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Failed to reject action:", err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card p-6 animate-pulse space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-5 bg-gray-200 rounded w-44" />
          <div className="h-5 bg-gray-200 rounded w-24" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6 space-y-4">
      {/* Header with Phase & Proactive AI Partner Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base md:text-lg font-black text-gray-950">GrowKaro Intelligence Feed</h2>
            <span className="badge bg-emerald-100 text-emerald-800 text-xs font-extrabold px-2 py-0.5 rounded">
              Proactive Monitoring
            </span>
          </div>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5 font-medium">
            Monitors → Detects → Explains → Recommends → Acts with approval
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="text-xs md:text-sm text-blue-700 hover:text-blue-900 font-bold px-3 py-1 rounded-lg bg-blue-50 border border-blue-200 shadow-2xs"
            >
              Analyze Live ⚡
            </button>
          )}
          <Link to="/insights" className="text-xs md:text-sm text-gray-600 hover:text-gray-900 font-bold">
            All Insights →
          </Link>
        </div>
      </div>

      {/* Tabs: Live Detections | Daily Brief | Weekly Review */}
      <div className="flex border-b border-gray-200 gap-2 text-xs md:text-sm font-bold">
        <button
          onClick={() => setActiveTab("noticed")}
          className={`pb-2 px-3 border-b-2 transition-all ${
            activeTab === "noticed"
              ? "border-[#002970] text-[#002970]"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          ⚡ GrowKaro Noticed ({insights.length})
        </button>
        <button
          onClick={() => {
            setActiveTab("daily");
            if (!briefData) loadDailyBrief();
          }}
          className={`pb-2 px-3 border-b-2 transition-all ${
            activeTab === "daily"
              ? "border-[#002970] text-[#002970]"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          🌅 Daily Brief
        </button>
        <button
          onClick={() => {
            setActiveTab("weekly");
            if (!weeklyData) loadWeeklyReview();
          }}
          className={`pb-2 px-3 border-b-2 transition-all ${
            activeTab === "weekly"
              ? "border-[#002970] text-[#002970]"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          📈 Weekly Review
        </button>
      </div>

      {/* TAB 1: GROWKARO NOTICED (PROACTIVE DETECTIONS) */}
      {activeTab === "noticed" && (
        <div className="space-y-4">
          {insights.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-sm">
              <p className="font-semibold text-gray-700">No critical business anomalies detected right now.</p>
              <p className="text-xs md:text-sm text-gray-500 mt-1">
                Your business metrics are operating steadily within normal baseline.
              </p>
            </div>
          ) : (
            insights.slice(0, 4).map((item) => {
              const meta = categoryMeta[item.category] || categoryMeta.OPPORTUNITY;
              const conf = confidenceMeta[item.confidence] || confidenceMeta.HIGH;
              return (
                <div
                  key={item._id || item.title}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all hover:shadow-xs space-y-3 ${meta.border}`}
                >
                  {/* Card Header: Category + Confidence + Score */}
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`badge border text-xs font-extrabold py-0.5 px-2 rounded ${meta.badge}`}>
                        {meta.icon} {meta.label}
                      </span>
                      <span className={`badge border text-[11px] font-bold py-0.5 px-2 rounded ${conf.badge}`}>
                        {conf.label}
                      </span>
                      {item.dataSource && (
                        <span className="badge bg-gray-100 text-gray-700 border border-gray-300 text-[11px] font-medium px-2 py-0.5 rounded">
                          {item.dataSource}
                        </span>
                      )}
                    </div>
                    {item.priorityScore && (
                      <span className="text-xs font-black text-gray-600 bg-white/90 px-2 py-0.5 rounded border border-gray-200">
                        Priority: {item.priorityScore}
                      </span>
                    )}
                  </div>

                  {/* 1. What Happened */}
                  <div>
                    <h3 className="text-sm md:text-base font-black text-gray-950 leading-snug">
                      {item.whatHappened || item.title}
                    </h3>
                  </div>

                  {/* 2. Why It Matters */}
                  {(item.whyItMatters || item.explanation) && (
                    <div className="text-xs md:text-sm text-gray-800 font-normal leading-relaxed bg-white/70 p-2.5 rounded-xl border border-gray-200/80">
                      <strong className="text-gray-900 font-bold">Why it matters:</strong>{" "}
                      {item.whyItMatters || item.explanation}
                    </div>
                  )}

                  {/* 3. Evidence */}
                  {item.evidence && item.evidence.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                        Verified Facts &amp; Evidence:
                      </div>
                      <ul className="list-disc pl-4 text-xs md:text-sm text-gray-700 space-y-1">
                        {item.evidence.map((ev, i) => (
                          <li key={i}>{ev}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 4. External Context (Weather/Non-Causal) */}
                  {getContextText(item.externalContext) && (
                    <div className="bg-sky-50/80 border border-sky-200 rounded-xl p-2.5 text-xs text-sky-950">
                      <span className="font-bold">☁️ External Context:</span> {getContextText(item.externalContext)}
                    </div>
                  )}

                  {/* 5. What To Do */}
                  {(item.whatToDo || item.recommendation?.action) && (
                    <div className="bg-blue-50/90 border border-blue-200 rounded-xl p-3 text-xs md:text-sm">
                      <div className="text-blue-900 font-bold flex items-center gap-1.5 mb-1">
                        <span>💡 Recommended Action:</span>
                      </div>
                      <p className="text-blue-950 font-medium leading-relaxed">
                        {item.whatToDo || item.recommendation.action}
                      </p>
                    </div>
                  )}

                  {/* 6. Action Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200/80 text-xs md:text-sm">
                    <button
                      onClick={() => setSelectedInsight(item)}
                      className="text-gray-600 hover:text-gray-950 font-bold"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleTakeAction(item)}
                      disabled={actionLoading}
                      className="btn-primary text-xs md:text-sm font-bold py-2 px-3.5 flex items-center gap-1.5 shadow-2xs"
                    >
                      <span>Take Action</span>
                      <span>⚡</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: DAILY BUSINESS BRIEF */}
      {activeTab === "daily" && (
        <div className="space-y-4">
          {briefLoading ? (
            <div className="p-8 text-center text-gray-500 animate-pulse text-sm font-medium">
              Generating today's Daily Business Brief...
            </div>
          ) : !briefData ? (
            <div className="py-8 text-center text-gray-500 space-y-2">
              <p>No brief generated for today yet.</p>
              <button
                onClick={() => loadDailyBrief(true)}
                className="btn-primary text-xs px-4 py-2"
              >
                Generate Today's Brief
              </button>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/70 border border-blue-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-blue-200/60 pb-3">
                <div>
                  <h3 className="text-base font-black text-blue-950 flex items-center gap-1.5">
                    <span>🌅</span> {briefData.greeting || "GOOD MORNING!"}
                  </h3>
                  <p className="text-xs text-blue-800 font-medium">{briefData.dateFormatted || briefData.date}</p>
                </div>
                <button
                  onClick={() => loadDailyBrief(true)}
                  className="text-xs font-bold text-blue-700 bg-white/80 hover:bg-white px-2.5 py-1 rounded-lg border border-blue-300 shadow-2xs"
                >
                  Refresh Brief ↻
                </button>
              </div>

              {/* Yesterday Performance Grid */}
              {briefData.yesterdayPerformance && (
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <div className="bg-white/90 p-3 rounded-xl border border-blue-100 shadow-2xs text-center">
                    <div className="text-[11px] font-bold text-gray-500">Yesterday Revenue</div>
                    <div className="text-base sm:text-lg font-black text-gray-900">
                      ₹{Number(briefData.yesterdayPerformance.revenue || 0).toLocaleString("en-IN")}
                    </div>
                    {briefData.yesterdayPerformance.revenueChange !== undefined && (
                      <div
                        className={`text-[11px] font-extrabold ${
                          briefData.yesterdayPerformance.revenueChange >= 0 ? "text-emerald-700" : "text-rose-700"
                        }`}
                      >
                        {briefData.yesterdayPerformance.revenueChange >= 0 ? "↑" : "↓"}{" "}
                        {Math.abs(briefData.yesterdayPerformance.revenueChange)}% vs prev day
                      </div>
                    )}
                  </div>
                  <div className="bg-white/90 p-3 rounded-xl border border-blue-100 shadow-2xs text-center">
                    <div className="text-[11px] font-bold text-gray-500">Orders</div>
                    <div className="text-base sm:text-lg font-black text-gray-900">
                      {briefData.yesterdayPerformance.transactions || 0}
                    </div>
                    <div className="text-[11px] text-gray-500 font-medium">Completed txs</div>
                  </div>
                  <div className="bg-white/90 p-3 rounded-xl border border-blue-100 shadow-2xs text-center">
                    <div className="text-[11px] font-bold text-gray-500">Avg Order Value</div>
                    <div className="text-base sm:text-lg font-black text-gray-900">
                      ₹{briefData.yesterdayPerformance.aov || 0}
                    </div>
                    <div className="text-[11px] text-gray-500 font-medium">Per ticket</div>
                  </div>
                </div>
              )}

              {/* Narrative Sections */}
              <div className="space-y-2 text-xs md:text-sm text-gray-800">
                <div className="bg-white/90 p-3 rounded-xl border border-blue-100 space-y-1">
                  <strong className="text-blue-950 font-bold block">What Matters Yesterday:</strong>
                  <p className="leading-relaxed">{briefData.whatMatters}</p>
                </div>

                <div className="bg-white/90 p-3 rounded-xl border border-blue-100 space-y-1">
                  <strong className="text-blue-950 font-bold block">Top Opportunity &amp; Concern:</strong>
                  <p className="leading-relaxed">{briefData.topOpportunity}</p>
                </div>

                {briefData.externalContextNote && (
                  <div className="bg-sky-50 p-3 rounded-xl border border-sky-200 text-sky-950 space-y-1">
                    <strong className="font-bold block">☁️ External Environment (Correlation Context):</strong>
                    <p className="leading-relaxed">{briefData.externalContextNote}</p>
                  </div>
                )}

                {briefData.recommendedAction && (
                  <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-emerald-950 space-y-1.5">
                    <strong className="font-black text-emerald-900 block">⚡ Recommended Action For Today:</strong>
                    <p className="leading-relaxed font-medium">{briefData.recommendedAction}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: WEEKLY BUSINESS REVIEW */}
      {activeTab === "weekly" && (
        <div className="space-y-4">
          {weeklyLoading ? (
            <div className="p-8 text-center text-gray-500 animate-pulse text-sm font-medium">
              Compiling 7-day strategic review...
            </div>
          ) : !weeklyData ? (
            <div className="py-8 text-center text-gray-500 space-y-2">
              <p>No weekly review generated yet.</p>
              <button
                onClick={() => loadWeeklyReview(true)}
                className="btn-primary text-xs px-4 py-2"
              >
                Generate Weekly Review
              </button>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-indigo-50/70 to-purple-50/70 border border-indigo-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-indigo-200/60 pb-3">
                <div>
                  <h3 className="text-base font-black text-indigo-950 flex items-center gap-1.5">
                    <span>📈</span> {weeklyData.weekLabel || "Weekly Business Review"}
                  </h3>
                  <p className="text-xs text-indigo-800 font-medium">
                    {weeklyData.dateRange?.start
                      ? `${new Date(weeklyData.dateRange.start).toLocaleDateString("en-IN", { month: "short", day: "numeric" })} – ${new Date(weeklyData.dateRange.end).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}`
                      : "Last 7 Days vs Prior 7 Days"}
                  </p>
                </div>
                <button
                  onClick={() => loadWeeklyReview(true)}
                  className="text-xs font-bold text-indigo-700 bg-white/80 hover:bg-white px-2.5 py-1 rounded-lg border border-indigo-300 shadow-2xs"
                >
                  Refresh Review ↻
                </button>
              </div>

              {/* 7-Day Comparison KPI Cards */}
              {weeklyData.kpis && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-white/90 p-3 rounded-xl border border-indigo-100 shadow-2xs">
                    <div className="text-[11px] font-bold text-gray-500">7-Day Revenue</div>
                    <div className="text-base font-black text-gray-900">
                      ₹{Number(weeklyData.kpis.revenue || 0).toLocaleString("en-IN")}
                    </div>
                    <div
                      className={`text-[11px] font-extrabold ${
                        weeklyData.kpis.revenueChange >= 0 ? "text-emerald-700" : "text-rose-700"
                      }`}
                    >
                      {weeklyData.kpis.revenueChange >= 0 ? "↑" : "↓"} {Math.abs(weeklyData.kpis.revenueChange || 0)}%
                    </div>
                  </div>

                  <div className="bg-white/90 p-3 rounded-xl border border-indigo-100 shadow-2xs">
                    <div className="text-[11px] font-bold text-gray-500">Transactions</div>
                    <div className="text-base font-black text-gray-900">
                      {weeklyData.kpis.transactions || 0}
                    </div>
                    <div
                      className={`text-[11px] font-extrabold ${
                        weeklyData.kpis.transactionsChange >= 0 ? "text-emerald-700" : "text-rose-700"
                      }`}
                    >
                      {weeklyData.kpis.transactionsChange >= 0 ? "↑" : "↓"}{" "}
                      {Math.abs(weeklyData.kpis.transactionsChange || 0)}%
                    </div>
                  </div>

                  <div className="bg-white/90 p-3 rounded-xl border border-indigo-100 shadow-2xs">
                    <div className="text-[11px] font-bold text-gray-500">Average Order</div>
                    <div className="text-base font-black text-gray-900">₹{weeklyData.kpis.aov || 0}</div>
                    <div
                      className={`text-[11px] font-extrabold ${
                        weeklyData.kpis.aovChange >= 0 ? "text-emerald-700" : "text-rose-700"
                      }`}
                    >
                      {weeklyData.kpis.aovChange >= 0 ? "↑" : "↓"} {Math.abs(weeklyData.kpis.aovChange || 0)}%
                    </div>
                  </div>

                  <div className="bg-white/90 p-3 rounded-xl border border-indigo-100 shadow-2xs">
                    <div className="text-[11px] font-bold text-gray-500">Repeat Rate</div>
                    <div className="text-base font-black text-indigo-700">
                      {weeklyData.kpis.repeatRate || 0}%
                    </div>
                    <div className="text-[11px] text-gray-500 font-medium">
                      {weeklyData.kpis.repeatCustomers || 0} repeat patrons
                    </div>
                  </div>
                </div>
              )}

              {/* Product Performance & Hourly Patterns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-white/90 p-3 rounded-xl border border-indigo-100 space-y-2">
                  <div className="font-bold text-gray-900 uppercase">Top vs Declining Items:</div>
                  <div className="space-y-1">
                    <div className="text-emerald-800 font-medium">
                      <strong>Top Volume:</strong>{" "}
                      {weeklyData.topProducts?.map((p) => `${p.name} (₹${p.revenue})`).join(", ") || "Active items"}
                    </div>
                    <div className="text-amber-800 font-medium">
                      <strong>Declining / Lull:</strong>{" "}
                      {weeklyData.decliningProducts?.map((p) => typeof p === "string" ? p : `${p.name} (↓${Math.abs(p.change || p.dropPct || 0)}%)`).join(", ") || "None"}
                    </div>
                  </div>
                </div>

                <div className="bg-white/90 p-3 rounded-xl border border-indigo-100 space-y-2">
                  <div className="font-bold text-gray-900 uppercase">Peak vs Weak Hours:</div>
                  <div className="space-y-1">
                    <div className="text-blue-800 font-medium">
                      <strong>Peak Windows:</strong> {Array.isArray(weeklyData.peakHours) ? weeklyData.peakHours.join(", ") : (weeklyData.peakHours || "5 PM - 8 PM")}
                    </div>
                    <div className="text-rose-800 font-medium">
                      <strong>Slow Windows:</strong> {Array.isArray(weeklyData.weakHours) ? weeklyData.weakHours.join(", ") : (weeklyData.weakHours || "2 PM - 4 PM")}
                    </div>
                  </div>
                </div>
              </div>

              {/* External Context Summary */}
              {getContextText(weeklyData.externalContextSummary) && (
                <div className="bg-sky-50/90 border border-sky-200 rounded-xl p-3 text-xs text-sky-950">
                  <span className="font-bold">☁️ Weather &amp; Footfall Observation:</span>{" "}
                  {getContextText(weeklyData.externalContextSummary)}
                </div>
              )}

              {/* 3 Prioritized Strategic Actions */}
              {weeklyData.recommendedActions && weeklyData.recommendedActions.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="text-xs font-black uppercase text-indigo-950 tracking-wider">
                    3 Prioritized Strategic Actions:
                  </div>
                  {weeklyData.recommendedActions.map((act, i) => (
                    <div
                      key={i}
                      className="bg-white p-3 rounded-xl border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-black flex items-center justify-center">
                            {act.priority || i + 1}
                          </span>
                          <span className="font-bold text-xs md:text-sm text-gray-950">{act.title}</span>
                          <span className="text-[10px] uppercase font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                            {act.actionType}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 pl-6">{act.details}</p>
                      </div>
                      <Link
                        to="/actions"
                        className="btn-primary text-xs font-bold py-1.5 px-3 self-start sm:self-auto shrink-0"
                      >
                        Deploy Action ›
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Insight Deep-Dive Modal */}
      {selectedInsight && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <span className={`badge text-[10px] font-semibold ${categoryMeta[selectedInsight.category]?.badge}`}>
                  {categoryMeta[selectedInsight.category]?.icon} {selectedInsight.category}
                </span>
                <h3 className="text-base font-bold text-gray-900 mt-1">{selectedInsight.title}</h3>
              </div>
              <button
                onClick={() => setSelectedInsight(null)}
                className="text-gray-400 hover:text-gray-600 text-lg p-1"
              >
                ✕
              </button>
            </div>

            {/* Hard Evidence */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Observed Evidence</h4>
              <ul className="list-disc pl-4 text-xs text-gray-700 space-y-1">
                {selectedInsight.evidence?.map((ev, i) => (
                  <li key={i}>{ev}</li>
                ))}
              </ul>
            </div>

            {/* Explanation / Why it matters */}
            {(selectedInsight.whyItMatters || selectedInsight.explanation) && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Why It Matters (AI Reasoning)</h4>
                <p className="text-xs text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg border">
                  {selectedInsight.whyItMatters || selectedInsight.explanation}
                </p>
              </div>
            )}

            {/* External Context */}
            {getContextText(selectedInsight.externalContext) && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">External Context</h4>
                <p className="text-xs text-sky-800 leading-relaxed bg-sky-50 p-3 rounded-lg border border-sky-200">
                  {getContextText(selectedInsight.externalContext)}
                </p>
              </div>
            )}

            {/* Recommended Action */}
            {(selectedInsight.whatToDo || selectedInsight.recommendation?.action) && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 space-y-2">
                <h4 className="text-xs font-bold text-blue-900 uppercase">Recommended Next Step</h4>
                <p className="text-xs text-blue-950 font-medium leading-relaxed">
                  {selectedInsight.whatToDo || selectedInsight.recommendation.action}
                </p>
              </div>
            )}

            {/* Agentic Action Execution CTA */}
            <div className="border border-blue-200 rounded-xl p-3.5 bg-blue-50/50 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-900">
                  {selectedInsight.recommendation?.suggestedAction?.title || "Automated Campaign"}
                </p>
                <p className="text-[11px] text-gray-500">Drafts copy and prepares for merchant approval</p>
              </div>
              <button
                onClick={() => handleTakeAction(selectedInsight)}
                disabled={actionLoading}
                className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 shadow-sm"
              >
                <span>Take Action</span>
                <span>⚡</span>
              </button>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedInsight(null)}
                className="btn-secondary text-xs px-4 py-1.5"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Review & Approval Modal */}
      {activeAction && (
        <ActionReviewModal
          action={activeAction}
          insight={selectedInsight || { title: activeAction.title, evidence: [activeAction.description] }}
          onClose={() => setActiveAction(null)}
          onApprove={handleApproveAction}
          onReject={handleRejectAction}
          loading={actionLoading}
        />
      )}
    </div>
  );
}