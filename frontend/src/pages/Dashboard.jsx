import React, { useState, useEffect } from "react";
import { useMerchantContext } from "../context/MerchantContext";
import { useDashboard } from "../hooks/useDashboard";
import { KPICard } from "../components/KPICard";
import { RevenueChart } from "../components/charts/RevenueChart";
import { HourlyChart } from "../components/charts/HourlyChart";
import { WeekdayChart } from "../components/charts/WeekdayChart";
import { AIPriorityFeed } from "../components/AIPriorityFeed";
import { ErrorState } from "../components/LoadingSpinner";
import { getBusinessTypeInfo, formatDate } from "../utils/formatters";
import { fetchDailyBrief, triggerAnalysis } from "../services/api";
import { useOutcomes } from "../hooks/useOutcomes";
import { Link } from "react-router-dom";

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

  const { label, logo } = getBusinessTypeInfo(merchant?.businessType, merchant?.businessName);

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

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 p-1.5 flex items-center justify-center shadow-xs overflow-hidden shrink-0">
            <img
              src={logo}
              alt={merchant?.businessName}
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
              {merchant?.businessName}
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">{label} · AI Business Partner Overview</p>
          </div>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDays(opt.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                days === opt.value ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Today's Revenue"
          value={kpis?.today?.revenue}
          change={kpis?.changes?.revenue}
          format="currency"
          loading={loading}
        />
        <KPICard
          title="Transactions"
          value={kpis?.today?.transactions}
          change={kpis?.changes?.transactions}
          format="number"
          loading={loading}
        />
        <KPICard
          title="Avg Order Value"
          value={kpis?.today?.aov}
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

      {/* AI Priority Feed (Prominent Phase 2 Placement) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Revenue Trend</h2>
            <span className="text-xs text-gray-400">Last {days} days</span>
          </div>
          <RevenueChart data={data?.revenueTrend} loading={loading} />
        </div>
        <div>
          <AIPriorityFeed
            insights={insights}
            loading={loading}
            dailyBrief={dailyBrief}
            onRefresh={handleRefreshAnalysis}
          />
        </div>
      </div>

      {/* Phase 4: Recent Action Results & What GrowKaro Has Learned */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Action Results Card */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
            <div className="flex items-center gap-2">
              <h2 className="font-black text-base md:text-lg text-gray-950">Recent Action Results</h2>
            </div>
            <Link
              to="/performance"
              className="text-xs md:text-sm text-blue-700 hover:text-blue-900 font-bold"
            >
              View All Outcomes →
            </Link>
          </div>

          {outcomes.length === 0 ? (
            <p className="text-sm text-gray-400 italic py-4 text-center">
              No executed campaigns measured yet. Approved campaigns will report observed lift here.
            </p>
          ) : (
            <div className="space-y-3.5">
              {outcomes.slice(0, 2).map((item) => {
                const isPos = item.changePercentage >= 0;
                const sign = isPos ? "+" : "";
                const isCurr = item.metric === "REVENUE" || item.metric === "AOV";
                const formatVal = (v) =>
                  isCurr
                    ? new Intl.NumberFormat("en-IN", {
                        style: "currency",
                        currency: "INR",
                        maximumFractionDigits: 0,
                      }).format(v || 0)
                    : `${v || 0} units`;

                return (
                  <div
                    key={item._id}
                    className="p-4 bg-gray-50 rounded-2xl border border-gray-200/90 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-black text-sm md:text-base text-gray-950 truncate">
                        {item.actionId?.title || "Campaign Action"}
                      </span>
                      <span
                        className={`badge font-bold px-2.5 py-0.5 rounded-md text-xs ${
                          isPos ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {sign}{item.changePercentage}% Observed
                      </span>
                    </div>

                    <p className="text-gray-700 text-xs md:text-sm leading-relaxed font-normal">
                      {item.interpretation}
                    </p>

                    <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-200">
                      <span>Baseline: <strong>{formatVal(item.baselineValue)}</strong> → Post: <strong>{formatVal(item.postActionValue)}</strong></span>
                      <span className="text-purple-700 font-bold">Stored in Memory</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* What GrowKaro Has Learned Card */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
            <div className="flex items-center gap-2">
              <h2 className="font-black text-base md:text-lg text-gray-950">What GrowKaro Has Learned</h2>
            </div>
            <Link
              to="/performance"
              className="text-xs md:text-sm text-blue-700 hover:text-blue-900 font-bold"
            >
              Explore Memory Matrix →
            </Link>
          </div>

          <div className="space-y-3">
            {learnedSummary?.memoryMatrix?.provenTactics?.length > 0 ? (
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between text-xs text-emerald-800 font-bold uppercase">
                  <span>Verified Tactic</span>
                  <span>High Confidence</span>
                </div>
                <p className="text-sm md:text-base font-bold text-emerald-950 leading-relaxed">
                  {learnedSummary.memoryMatrix.provenTactics[0].content}
                </p>
              </div>
            ) : null}

            {learnedSummary?.memoryMatrix?.merchantPreferences?.length > 0 ? (
              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between text-xs text-blue-800 font-bold uppercase">
                  <span>Merchant Rule</span>
                  <span>Active Preference</span>
                </div>
                <p className="text-sm md:text-base font-bold text-blue-950 leading-relaxed">
                  {learnedSummary.memoryMatrix.merchantPreferences[0].content}
                </p>
              </div>
            ) : null}

            {learnedSummary?.memoryMatrix?.trafficPatterns?.length > 0 ? (
              <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between text-xs text-purple-800 font-bold uppercase">
                  <span>Operational Trend</span>
                  <span>Detected Pattern</span>
                </div>
                <p className="text-sm md:text-base font-bold text-purple-950 leading-relaxed">
                  {learnedSummary.memoryMatrix.trafficPatterns[0].content}
                </p>
              </div>
            ) : null}

            {!learnedSummary && (
              <p className="text-sm text-gray-400 italic py-4 text-center">
                Accumulating business memory...
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Hourly + Weekday Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Sales by Hour</h2>
          <HourlyChart data={data?.hourlySales} loading={loading} />
          <p className="text-xs text-gray-400 text-center mt-2">Hover to see revenue and transaction count</p>
        </div>
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Sales by Day of Week</h2>
          <WeekdayChart data={data?.weekdaySales} loading={loading} />
          <p className="text-xs text-gray-400 text-center mt-2">Based on last 8 weeks of data</p>
        </div>
      </div>

      {/* Summary stats */}
      {kpis && !loading && (
        <div className="card p-5">
          <h3 className="font-semibold text-gray-800 mb-3">Period Summary</h3>
          <div className="grid grid-cols-3 divide-x divide-gray-100">
            <div className="px-4 text-center first:pl-0">
              <p className="text-xs text-gray-400 mb-1">Yesterday Revenue</p>
              <p className="font-bold text-gray-900">
                {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(kpis.yesterday?.revenue || 0)}
              </p>
            </div>
            <div className="px-4 text-center">
              <p className="text-xs text-gray-400 mb-1">Yesterday Transactions</p>
              <p className="font-bold text-gray-900">{kpis.yesterday?.transactions || 0}</p>
            </div>
            <div className="px-4 text-center last:pr-0">
              <p className="text-xs text-gray-400 mb-1">Yesterday AOV</p>
              <p className="font-bold text-gray-900">
                {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(kpis.yesterday?.aov || 0)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}