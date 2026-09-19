import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useMerchantContext } from "../context/MerchantContext";
import { useDashboard } from "../hooks/useDashboard";
import { useOutcomes } from "../hooks/useOutcomes";
import { KPICard } from "../components/KPICard";
import { RevenueChart } from "../components/charts/RevenueChart";
import { AIPriorityFeed } from "../components/AIPriorityFeed";
import CustomerOpportunities from "../components/CustomerOpportunities";
import { ErrorState } from "../components/LoadingSpinner";
import { fetchDailyBrief, triggerAnalysis } from "../services/api";
import { getBusinessTypeInfo, formatINR } from "../utils/formatters";

const PERIOD_OPTIONS = [
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
];

export default function Dashboard() {
  const { merchant } = useMerchantContext();
  const [days, setDays] = useState(30);
  const { data, loading, error, refetch } = useDashboard(merchant?._id, days);
  const { outcomes, learnedSummary } = useOutcomes(merchant?._id);
  const [dailyBrief, setDailyBrief] = useState(null);

  const { label } = getBusinessTypeInfo(merchant?.businessType, merchant?.businessName);

  useEffect(() => {
    if (merchant?._id) {
      fetchDailyBrief(merchant._id)
        .then((res) => setDailyBrief(res.data))
        .catch(() => setDailyBrief(null));
    }
  }, [merchant?._id]);

  const handleRefreshAnalysis = async () => {
    if (!merchant?._id) return;
    try {
      await triggerAnalysis(merchant._id);
      refetch();
      const briefRes = await fetchDailyBrief(merchant._id);
      setDailyBrief(briefRes.data);
    } catch (err) {
      console.error("Diagnosis failed:", err);
    }
  };

  if (error) {
    return (
      <div className="p-8">
        <ErrorState message={error} onRetry={refetch} />
      </div>
    );
  }

  const kpis = data?.kpis;
  const insights = data?.insights || [];

  // Compute Greeting based on local time
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";

  // Business Pulse sentence derived from dailyBrief or KPI changes
  const pulseSentence =
    dailyBrief?.summary ||
    (kpis?.changes?.revenue >= 0
      ? "Sales are stronger than yesterday, with solid customer participation across peak hours."
      : "Afternoon activity was slightly quieter than yesterday. Consider promotional combos to boost mid-day volume.");

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* ─── 1. Header & Quick Time Period Selector ──────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Good {greeting}, {merchant?.businessName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Here's how your {label.toLowerCase()} is performing today.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start sm:self-auto border border-slate-200/60">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDays(opt.value)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                days === opt.value
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── 2. Key Metrics Row ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Today's Revenue"
          value={kpis?.today?.revenue}
          change={kpis?.changes?.revenue}
          format="currency"
          loading={loading}
        />
        <KPICard
          title="Orders"
          value={kpis?.today?.transactions}
          change={kpis?.changes?.transactions}
          format="number"
          loading={loading}
        />
        <KPICard
          title="Avg Order Value"
          value={kpis?.today?.aov}
          change={kpis?.changes?.aov}
          format="currency"
          loading={loading}
        />
        <KPICard
          title="Repeat Customers"
          value={kpis?.repeatCustomerPct}
          format="percent"
          changeLabel="last 30 days"
          loading={loading}
        />
      </div>

      {/* ─── 3. Business Pulse Banner ─────────────────────────────────────── */}
      <div className="card p-4 sm:p-5 bg-gradient-to-r from-emerald-50/40 via-white to-slate-50 border-emerald-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-100/70 border border-emerald-200 flex items-center justify-center text-emerald-800 font-bold shrink-0 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
          </div>
          <div>
            <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider block">
              Business Pulse
            </span>
            <p className="text-sm font-medium text-slate-800 mt-0.5 leading-relaxed">
              "{pulseSentence}"
            </p>
          </div>
        </div>

        <button
          onClick={handleRefreshAnalysis}
          className="self-start sm:self-auto text-xs font-semibold text-emerald-700 hover:text-emerald-900 hover:underline px-2 py-1 shrink-0"
        >
          Diagnose Live Patterns →
        </button>
      </div>

      {/* ─── 4. Performance Trend & What Needs Attention ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Performance Trend Chart */}
        <div className="lg:col-span-8 card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Revenue Trend
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Daily transaction volume over the last {days} days
              </p>
            </div>
            <Link
              to="/analytics"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              View Analytics →
            </Link>
          </div>
          <RevenueChart data={data?.revenueTrend} loading={loading} />
        </div>

        {/* What Needs Attention (Insights Feed) */}
        <div className="lg:col-span-4">
          <AIPriorityFeed
            insights={insights}
            loading={loading}
            dailyBrief={dailyBrief}
            onRefresh={handleRefreshAnalysis}
          />
        </div>
      </div>

      {/* ─── 5. Customer Win-Back Opportunities ───────────────────────────── */}
      <CustomerOpportunities
        merchantId={merchant?._id}
        merchantName={merchant?.businessName}
      />

      {/* ─── 6. Recent Action Results & Learned Intelligence ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Measured Lift */}
        <div className="card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Recent Action Results
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Verified lift from executed merchant actions
              </p>
            </div>
            <Link
              to="/performance"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
            >
              View All Outcomes →
            </Link>
          </div>

          {outcomes.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-6 text-center">
              No executed campaigns measured yet. Approved actions report observed revenue lift here.
            </p>
          ) : (
            <div className="space-y-3">
              {outcomes.slice(0, 2).map((item) => {
                const isPos = item.changePercentage >= 0;
                const sign = isPos ? "+" : "";
                return (
                  <div
                    key={item._id}
                    className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                        {item.actionId?.title || "Campaign Action"}
                      </span>
                      <span
                        className={`badge font-semibold text-[11px] px-2 py-0.5 rounded ${
                          isPos ? "badge-emerald" : "badge-rose"
                        }`}
                      >
                        {sign}{item.changePercentage}% Observed
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {item.interpretation}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200/50">
                      <span>Baseline: <strong>{formatINR(item.baselineValue)}</strong> → Post: <strong>{formatINR(item.postActionValue)}</strong></span>
                      <span className="text-slate-500 font-medium">Memory Saved</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Learned Knowledge */}
        <div className="card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                What GrowKaro Has Learned
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Persistent patterns stored in business memory
              </p>
            </div>
            <Link
              to="/performance"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
            >
              Explore Memory →
            </Link>
          </div>

          <div className="space-y-3">
            {learnedSummary?.memoryMatrix?.provenTactics?.length > 0 ? (
              <div className="p-3.5 bg-emerald-50/50 border border-emerald-200/80 rounded-xl space-y-1">
                <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                  Verified Tactic
                </div>
                <p className="text-xs font-semibold text-emerald-950 leading-relaxed">
                  {learnedSummary.memoryMatrix.provenTactics[0].content}
                </p>
              </div>
            ) : null}

            {learnedSummary?.memoryMatrix?.merchantPreferences?.length > 0 ? (
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Merchant Rule
                </div>
                <p className="text-xs font-medium text-slate-800 leading-relaxed">
                  {learnedSummary.memoryMatrix.merchantPreferences[0].content}
                </p>
              </div>
            ) : null}

            {learnedSummary?.memoryMatrix?.trafficPatterns?.length > 0 ? (
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Traffic Pattern
                </div>
                <p className="text-xs font-medium text-slate-800 leading-relaxed">
                  {learnedSummary.memoryMatrix.trafficPatterns[0].content}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}