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
import {
  fetchDailyBrief,
  triggerAnalysis,
  fetchDataSourceStatus,
  simulateDataSourceLink,
  fetchLiveTransactions,
} from "../services/api";
import socketService from "../services/socket";
import { BusinessPulseWidget } from "../components/BusinessPulseWidget";
import { useOutcomes } from "../hooks/useOutcomes";
import { useTeam } from "../context/TeamContext";
import { Link } from "react-router-dom";
import { BarChart3, Brain, Award, Sliders, Clock, ExternalLink, X, Link2 } from "lucide-react";

const PERIOD_OPTIONS = [
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
];

export default function Dashboard() {
  const { merchant } = useMerchantContext();
  const { isStaff, activePersona } = useTeam();
  const [days, setDays] = useState(30);
  const { data, loading, error, refetch } = useDashboard(merchant?._id, days);
  const { outcomes, learnedSummary } = useOutcomes(merchant?._id);
  const [dailyBrief, setDailyBrief] = useState(null);
  const [dataSourceStatus, setDataSourceStatus] = useState(null);
  const [showDataModal, setShowDataModal] = useState(false);
  const [linkingLoading, setLinkingLoading] = useState(false);

  // Live simulation & Socket.IO state
  const [liveTransactions, setLiveTransactions] = useState([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [showAddTxModal, setShowAddTxModal] = useState(false);
  const [addTxInitialType, setAddTxInitialType] = useState("SALE");
  const [livePulse, setLivePulse] = useState(null);
  const [lastLiveUpdate, setLastLiveUpdate] = useState("Just now");
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  const { label, logo } = getBusinessTypeInfo(merchant?.businessType, merchant?.businessName);

  // Daily brief & data source status
  useEffect(() => {
    if (merchant?._id) {
      fetchDailyBrief(merchant._id)
        .then((res) => setDailyBrief(res.data))
        .catch(() => setDailyBrief(null));

      fetchDataSourceStatus(merchant._id)
        .then((res) => setDataSourceStatus(res.data))
        .catch(() => setDataSourceStatus(null));
    }
  }, [merchant?._id]);

  // Socket.IO live stream & real-time connection
  useEffect(() => {
    if (!merchant?._id) return;

    setLiveLoading(true);
    fetchLiveTransactions(merchant._id, 15)
      .then((res) => {
        if (res.data) setLiveTransactions(res.data);
      })
      .catch((err) => console.warn("Live feed fetch warning:", err.message))
      .finally(() => setLiveLoading(false));

    socketService.connect(merchant._id);
    setIsSocketConnected(true);

    const handleTxCreated = (payload) => {
      const tx = payload?.transaction;
      if (tx) {
        setLiveTransactions((prev) => {
          const filtered = prev.filter((item) => item._id !== tx._id);
          return [tx, ...filtered].slice(0, 30);
        });
      }
      if (payload?.pulse) {
        setLivePulse(payload.pulse);
      }
      setLastLiveUpdate("Just now");
      refetch();
    };

    const handleDashboardUpdate = (payload) => {
      if (payload?.pulse) {
        setLivePulse(payload.pulse);
      }
      setLastLiveUpdate("Just now");
      refetch();
    };

    socketService.on("transaction:created", handleTxCreated);
    socketService.on("dashboard:update", handleDashboardUpdate);

    return () => {
      socketService.off("transaction:created", handleTxCreated);
      socketService.off("dashboard:update", handleDashboardUpdate);
      socketService.disconnect();
      setIsSocketConnected(false);
    };
  }, [merchant?._id, refetch]);

  const handleSimulateLink = async () => {
    if (!merchant?._id) return;
    setLinkingLoading(true);
    try {
      const res = await simulateDataSourceLink(merchant._id);
      if (res.data?.status) {
        setDataSourceStatus(res.data.status);
      }
      refetch();
    } catch (err) {
      console.error("Link simulation failed:", err);
    } finally {
      setLinkingLoading(false);
    }
  };

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

  const handleSimulationComplete = async () => {
    refetch();
    if (merchant?._id) {
      try {
        const [feedRes, briefRes] = await Promise.all([
          fetchLiveTransactions(merchant._id, 15),
          fetchDailyBrief(merchant._id),
        ]);
        if (feedRes.data) setLiveTransactions(feedRes.data);
        if (briefRes.data) setDailyBrief(briefRes.data);
      } catch (err) {
        console.warn("Simulation refresh warning:", err.message);
      }
    }
  };

  const handleTransactionCreated = (newTx) => {
    if (newTx) {
      setLiveTransactions((prev) => [newTx, ...prev.filter((t) => t._id !== newTx._id)].slice(0, 30));
    }
    setLastLiveUpdate("Just now");
    refetch();
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
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                {merchant?.businessName}
              </h1>
              {dataSourceStatus && (
                <button
                  onClick={() => setShowDataModal(true)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-all shadow-2xs ${
                    dataSourceStatus.primaryStatus === "HIGH_CONFIDENCE"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                      : "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
                  }`}
                  title="Click to view Data Source linking details"
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      dataSourceStatus.primaryStatus === "HIGH_CONFIDENCE"
                        ? "bg-emerald-500"
                        : "bg-amber-500 animate-pulse"
                    }`}
                  />
                  <span>{dataSourceStatus.badgeText}</span>
                  <span className="text-[10px] text-gray-500 underline ml-0.5">details</span>
                </button>
              )}
            </div>
            <p className="text-gray-500 text-sm mt-0.5">{label} · Autonomous AI Business Intelligence Active</p>
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

      {/* Role-Specific Scoped View: For STAFF, show Floor Operations instead of sensitive store margins */}
      {isStaff ? (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm md:text-base font-black text-gray-900">
                  Floor Operations &amp; Shift Hub
                </h3>
                <p className="text-xs text-gray-600">
                  Active role: <strong>{activePersona?.name}</strong> ({activePersona?.title}). Store financial margins are protected.
                </p>
              </div>
            </div>
            <Link
              to="/tasks"
              className="px-3.5 py-1.5 bg-[#002970] text-white rounded-xl text-xs font-bold shadow-2xs hover:bg-[#001f56] transition-all whitespace-nowrap self-start sm:self-auto"
            >
              View My Checklist ›
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs space-y-1">
              <div className="text-xs sm:text-sm font-bold text-gray-500">Store Readiness</div>
              <div className="text-lg font-black text-emerald-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Active Shift
              </div>
              <div className="text-xs text-gray-500 font-medium">Counter &amp; Barista Station</div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs space-y-1">
              <div className="text-xs sm:text-sm font-bold text-gray-500">Task Checklist</div>
              <div className="text-lg font-black text-blue-700">Action Prep</div>
              <div className="text-xs text-gray-500 font-medium">Inventory items assigned</div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs space-y-1">
              <div className="text-xs sm:text-sm font-bold text-gray-500">Active Combo</div>
              <div className="text-lg font-black text-gray-900">₹199 Cold Brew</div>
              <div className="text-xs text-gray-500 font-medium">Butter Croissant Pairing</div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs space-y-1">
              <div className="text-xs sm:text-sm font-bold text-gray-500">Prep Window</div>
              <div className="text-lg font-black text-rose-700">URGENT</div>
              <div className="text-xs text-gray-500 font-medium">2:00 PM Lull Target</div>
            </div>
          </div>
        </div>
      ) : (
        /* Standard Financial KPI Cards + Business Pulse for Owner & Manager */
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1">
              <BusinessPulseWidget
                pulse={livePulse || kpis?.businessPulse}
                lastUpdatedText={lastLiveUpdate}
              />
            </div>
            <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <KPICard
                title="Gross Revenue"
                value={kpis?.today?.grossSales ?? kpis?.today?.revenue}
                change={kpis?.changes?.revenue}
                icon="revenue"
                format="currency"
                loading={loading}
              />
              <KPICard
                title="Refund Deductions"
                value={kpis?.today?.refunds ?? 0}
                icon="refund"
                format="currency"
                changeLabel={
                  (kpis?.today?.refundRate ?? 0) > 0
                    ? `${kpis.today.refundRate}% return rate`
                    : "Zero returns"
                }
                loading={loading}
              />
              <KPICard
                title="Net Sales"
                value={kpis?.today?.netSales ?? kpis?.today?.revenue}
                icon="net"
                format="currency"
                changeLabel="Gross less returns"
                loading={loading}
              />
              <KPICard
                title="Repeat Customers"
                value={kpis?.repeatCustomerPct}
                icon="repeat"
                format="percent"
                changeLabel="last 30 days"
                loading={loading}
              />
            </div>
          </div>

          {/* Profitability & COGS Accounting Honesty Strip */}
          <div className="p-3.5 bg-gray-50 border border-gray-200/90 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs md:text-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-gray-200/70 text-gray-700 flex items-center justify-center shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                </svg>
              </div>
              <div>
                <span className="font-extrabold text-gray-900">Profit &amp; Loss Intelligence: </span>
                {kpis?.today?.hasCostData ? (
                  <span className="text-emerald-800 font-bold">
                    Gross Profit: ₹{Number(kpis.today.grossProfit || 0).toLocaleString("en-IN")} ({kpis.today.grossMargin}% margin) · COGS: ₹{Number(kpis.today.cogs || 0).toLocaleString("en-IN")}
                  </span>
                ) : (
                  <span className="text-amber-800 font-medium">
                    Product unit costs (COGS) unconfigured — displaying Net Sales &amp; Refund Loss. Configure inventory item unit costs to unlock true Gross Profit analysis.
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0 text-xs">
              <span className="text-gray-500 font-medium">Avg Ticket: <strong>₹{kpis?.today?.aov || 0}</strong></span>
              <span className="text-gray-300">|</span>
              <span className="text-gray-500 font-medium">Orders Today: <strong>{kpis?.today?.transactions || 0}</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* Sleek Live Activity & Simulation Strip */}
      <div className="p-4 bg-gradient-to-r from-blue-950 via-[#002970] to-indigo-900 rounded-2xl text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm border border-blue-800">
        <div className="flex items-center gap-3">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-wide uppercase">Real-Time POS &amp; Ledger Bus</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-extrabold px-2 py-0.5 rounded-full border border-emerald-400/30">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-blue-200">
              Live orders streamed via WebSockets · Last update: {lastLiveUpdate}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/market-intelligence"
            className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-white/20"
          >
            <span>Market &amp; Sales AI ›</span>
          </Link>
          <Link
            to="/live-simulation"
            className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-gray-950 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-2xs"
          >
            <span>Open Live Simulation &amp; Bills ›</span>
          </Link>
        </div>
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
              <BarChart3 className="w-5 h-5 text-gray-700" />
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
                      <span className="text-purple-700 font-bold flex items-center gap-1.5">
                        <Brain className="w-3.5 h-3.5" /> Stored in Memory
                      </span>
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
              <Brain className="w-5 h-5 text-purple-700" />
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
                  <span className="flex items-center gap-1.5"><Award className="w-3.5 h-3.5" /> Verified Tactic</span>
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
                  <span className="flex items-center gap-1.5"><Sliders className="w-3.5 h-3.5" /> Merchant Rule</span>
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
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Operational Trend</span>
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

      {/* Multi-Source Data Architecture Modal */}
      {showDataModal && dataSourceStatus && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <span className="badge bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded">
                  Data Architecture &amp; Honesty
                </span>
                <h3 className="text-base md:text-lg font-black text-gray-950 mt-1">
                  Paytm Payment vs. POS Order Ingestion
                </h3>
              </div>
              <button
                onClick={() => setShowDataModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Architecture Explanation */}
            <div className="text-xs md:text-sm text-gray-700 space-y-2 leading-relaxed">
              <p>
                GrowKaro cleanly separates <strong>Payment Data</strong> (Paytm UPI / Soundbox transactions: amount, timestamp, txn ID) from <strong>Itemized Order Data</strong> (Merchant POS / Billing tickets: items, quantities, prices).
              </p>
              <div className="bg-blue-50/80 p-3 rounded-xl border border-blue-200 text-blue-950 font-medium text-xs">
                {dataSourceStatus.honestyStatement}
              </div>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                <div className="text-xs font-bold text-gray-500 uppercase">Total Transactions</div>
                <div className="text-xl font-black text-gray-900 mt-0.5">
                  {dataSourceStatus.totalTransactions}
                </div>
              </div>
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                <div className="text-xs font-bold text-emerald-800 uppercase">Linked POS Orders</div>
                <div className="text-xl font-black text-emerald-700 mt-0.5">
                  {dataSourceStatus.linkedPercentage}%
                </div>
              </div>
            </div>

            {/* Confidence Breakdown Bars */}
            <div className="space-y-1.5 text-xs">
              <div className="font-bold text-gray-700 uppercase">Confidence Distribution:</div>
              <div className="flex items-center justify-between text-gray-600">
                <span>High Confidence (Paytm + POS Linked):</span>
                <span className="font-black text-emerald-700">{dataSourceStatus.confidenceBreakdown?.HIGH || 0}</span>
              </div>
              <div className="flex items-center justify-between text-gray-600">
                <span>Medium Confidence (POS Item Ticket Only):</span>
                <span className="font-black text-blue-700">{dataSourceStatus.confidenceBreakdown?.MEDIUM || 0}</span>
              </div>
              <div className="flex items-center justify-between text-gray-600">
                <span>Low Confidence (Payment Only - No Items):</span>
                <span className="font-black text-amber-700">{dataSourceStatus.confidenceBreakdown?.LOW || 0}</span>
              </div>
            </div>

            {/* Simulate Linking Button */}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
              <button
                onClick={handleSimulateLink}
                disabled={linkingLoading}
                className="btn-primary text-xs font-bold py-2 px-3.5 flex items-center gap-1.5 shadow-2xs"
              >
                <span>{linkingLoading ? "Linking..." : "Simulate POS Order Linking"}</span>
                <Link2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowDataModal(false)}
                className="btn-secondary text-xs px-4 py-2 font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}