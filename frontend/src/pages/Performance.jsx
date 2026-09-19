import React, { useState } from "react";
import { useMerchantContext } from "../context/MerchantContext";
import { useOutcomes } from "../hooks/useOutcomes";
import { useActions } from "../hooks/useActions";
import { LoadingSpinner, ErrorState } from "../components/LoadingSpinner";
import { formatDate } from "../utils/formatters";

const TABS = [
  { id: "OUTCOMES", label: "Measured Outcomes & Attribution" },
  { id: "LEARNED", label: "Store Memory & Learned Insights" },
];

export default function Performance() {
  const { merchant } = useMerchantContext();
  const {
    outcomes,
    learnedSummary,
    n8nStatus,
    loading: outcomesLoading,
    measuring,
    error,
    refetch,
    measure,
  } = useOutcomes(merchant?._id);

  const { actions, refetch: refetchActions } = useActions(merchant?._id);
  const [activeTab, setActiveTab] = useState("OUTCOMES");
  const [measuringId, setMeasuringId] = useState(null);

  // Find executed actions that are not yet measured
  const unmeasuredActions = actions.filter(
    (a) =>
      a.approvalStatus === "APPROVED" &&
      a.executionStatus === "SUCCESS" &&
      !a.isMeasured &&
      !outcomes.some((o) => o.actionId?._id === a._id || o.actionId === a._id)
  );

  const handleMeasureAction = async (actionId) => {
    setMeasuringId(actionId);
    try {
      await measure(actionId);
      await refetchActions();
    } catch (err) {
      console.error("Measurement error:", err);
    } finally {
      setMeasuringId(null);
    }
  };

  if (outcomesLoading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <ErrorState message={error} onRetry={refetch} />
      </div>
    );
  }

  const memoryMatrix = learnedSummary?.memoryMatrix || {
    provenTactics: [],
    merchantPreferences: [],
    trafficPatterns: [],
  };

  const avgLift = learnedSummary?.averageObservedLift || 0;
  const totalMeasured = outcomes.length;

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-900">
              Performance &amp; Outcome Learning
            </h1>
            <span className="badge-slate font-mono text-xs font-semibold">
              {totalMeasured} evaluated
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Deterministic before/after attribution and persistent merchant memory.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* n8n Status Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium">
            <span
              className={`w-2 h-2 rounded-full ${
                n8nStatus?.mode === "real" ? "bg-emerald-500 animate-pulse" : "bg-blue-500"
              }`}
            />
            <span className="text-slate-700">
              {n8nStatus?.mode === "real" ? "n8n Connected" : "n8n Sandbox"}
            </span>
          </div>

          <button
            onClick={refetch}
            className="btn-secondary text-xs font-semibold px-3 py-1.5 inline-flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* High-Level Impact Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 space-y-1">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
            Campaigns Measured
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold font-mono text-emerald-600">
              {totalMeasured}
            </span>
            <span className="text-xs text-slate-400">Attribution checks</span>
          </div>
        </div>

        <div className="card p-5 space-y-1">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
            Average Observed Lift
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold font-mono text-emerald-700">
              +{avgLift}%
            </span>
            <span className="text-xs text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
              Post-action delta
            </span>
          </div>
        </div>

        <div className="card p-5 space-y-1">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
            Store Memory Points
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold font-mono text-slate-900">
              {memoryMatrix.provenTactics.length +
                memoryMatrix.merchantPreferences.length +
                memoryMatrix.trafficPatterns.length}
            </span>
            <span className="text-xs text-slate-400">Persisted facts</span>
          </div>
        </div>

        <div className="card p-5 space-y-1">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
            Feedback Engine
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="badge-emerald text-xs font-medium">
              Active &amp; Adapting
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Closed-loop optimization</p>
        </div>
      </div>

      {/* Pending Actions Ready for Outcome Measurement */}
      {unmeasuredActions.length > 0 && (
        <div className="card p-5 border border-brand-200 bg-brand-50/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-600" />
              <h3 className="font-semibold text-xs text-slate-900 uppercase tracking-wider">
                Executed Campaigns Ready for Evaluation ({unmeasuredActions.length})
              </h3>
            </div>
            <span className="badge-slate font-mono text-[11px]">
              Requires Measurement
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {unmeasuredActions.map((act) => (
              <div
                key={act._id}
                className="bg-white p-3.5 rounded-lg border border-slate-200 flex items-center justify-between gap-3 shadow-2xs"
              >
                <div>
                  <p className="font-semibold text-xs text-slate-900">{act.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                    Completed: {formatDate(act.completedAt || act.createdAt)} · {act.channel}
                  </p>
                </div>
                <button
                  onClick={() => handleMeasureAction(act._id)}
                  disabled={measuring || measuringId === act._id}
                  className="btn-primary text-xs py-1.5 px-3 whitespace-nowrap shadow-sm font-semibold"
                >
                  {measuringId === act._id ? "Evaluating..." : "Measure Outcome"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-semibold transition-all relative flex items-center gap-2 ${
                activeTab === tab.id
                  ? "text-slate-900 border-b-2 border-brand-600"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>{tab.label}</span>
              {tab.id === "OUTCOMES" && (
                <span className="px-1.5 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-700 font-mono font-bold">
                  {totalMeasured}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* TAB 1: MEASURED OUTCOMES */}
      {activeTab === "OUTCOMES" && (
        <div className="space-y-4">
          {outcomes.length === 0 ? (
            <div className="card p-12 text-center space-y-3 border-dashed">
              <p className="font-semibold text-sm text-slate-900">No measured outcomes yet</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Approve and execute an action from the Operations inbox, then click "Measure Outcome" to verify deterministic before/after results.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {outcomes.map((item) => {
                const isPositive = item.changePercentage >= 0;
                const sign = isPositive ? "+" : "";
                const isCurrency = item.metric === "REVENUE" || item.metric === "AOV";

                const formatVal = (v) =>
                  isCurrency
                    ? new Intl.NumberFormat("en-IN", {
                        style: "currency",
                        currency: "INR",
                        maximumFractionDigits: 0,
                      }).format(v || 0)
                    : `${v || 0} ${item.metric === "PRODUCT_UNITS" ? "units" : "tx"}`;

                return (
                  <div
                    key={item._id}
                    className="card p-5 space-y-4 hover:shadow-card transition-all"
                  >
                    {/* Card Top */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="badge-slate font-mono text-[11px]">
                          {item.metric}
                        </span>
                        <h3 className="text-sm font-semibold text-slate-900 mt-1 leading-snug">
                          {item.actionId?.title || "Targeted Merchant Action"}
                        </h3>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-md ${
                            isPositive
                              ? "badge-emerald"
                              : "badge-rose"
                          }`}
                        >
                          {sign}
                          {item.changePercentage}% Observed
                        </span>
                        <p className="text-[11px] text-slate-400 font-mono mt-1">
                          {formatDate(item.measuredAt)}
                        </p>
                      </div>
                    </div>

                    {/* Before vs After Metric Strip */}
                    <div className="bg-slate-50 rounded-lg p-3 grid grid-cols-3 divide-x divide-slate-200 text-center border border-slate-100">
                      <div>
                        <span className="text-[11px] text-slate-500 block font-medium">
                          Baseline
                        </span>
                        <span className="font-mono font-semibold text-slate-700 text-sm mt-0.5 block">
                          {formatVal(item.baselineValue)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-500 block font-medium">
                          Observed
                        </span>
                        <span className="font-mono font-semibold text-slate-900 text-sm mt-0.5 block">
                          {formatVal(item.postActionValue)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-500 block font-medium">
                          Difference
                        </span>
                        <span
                          className={`font-mono font-semibold text-sm mt-0.5 block ${
                            isPositive ? "text-emerald-700" : "text-rose-600"
                          }`}
                        >
                          {sign}
                          {formatVal(item.changeValue)}
                        </span>
                      </div>
                    </div>

                    {/* Interpretation & Non-causal Attribution */}
                    <div className="bg-emerald-50/50 border border-emerald-200/60 rounded-lg p-3 text-xs space-y-2">
                      <p className="text-slate-800 leading-relaxed font-medium">
                        {item.interpretation}
                      </p>
                      <div className="text-[11px] text-slate-500 pt-1.5 border-t border-emerald-200/50">
                        <span className="font-medium text-slate-700">Attribution Method:</span> Transaction settlement delta across {item.measurementWindow}.
                      </div>
                    </div>

                    {/* Evidence Points */}
                    {item.evidence && item.evidence.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                          Measurement Evidence
                        </span>
                        <ul className="text-xs text-slate-600 space-y-1">
                          {item.evidence.map((ev, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-slate-400">•</span>
                              <span>{ev}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Footer / Status */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
                      <span>Window: {item.measurementWindow}</span>
                      <span className="badge-slate font-mono text-[10px]">
                        Saved in Memory
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: WHAT GROWKARO HAS LEARNED */}
      {activeTab === "LEARNED" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Proven Tactics */}
          <div className="card p-5 space-y-3">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="font-semibold text-sm text-slate-900">Proven Tactics</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Actions verified to produce measurable sales volume lift
              </p>
            </div>
            <div className="space-y-2.5 pt-1">
              {memoryMatrix.provenTactics.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No tactics verified yet.</p>
              ) : (
                memoryMatrix.provenTactics.map((tac) => (
                  <div
                    key={tac.id}
                    className="p-3 bg-emerald-50/50 border border-emerald-200/60 rounded-lg space-y-1.5"
                  >
                    <p className="text-xs font-medium text-slate-900 leading-relaxed">
                      {tac.content}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {tac.tags?.map((t) => (
                        <span
                          key={t}
                          className="badge-slate text-[10px] font-mono"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Merchant Preferences & Policies */}
          <div className="card p-5 space-y-3">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="font-semibold text-sm text-slate-900">Merchant Preferences</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Learned rules derived from merchant approvals, edits, and rejections
              </p>
            </div>
            <div className="space-y-2.5 pt-1">
              {memoryMatrix.merchantPreferences.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No preferences recorded yet.</p>
              ) : (
                memoryMatrix.merchantPreferences.map((pref) => (
                  <div
                    key={pref.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5"
                  >
                    <p className="text-xs font-medium text-slate-900 leading-relaxed">
                      {pref.content}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {pref.tags?.map((t) => (
                        <span
                          key={t}
                          className="badge-slate text-[10px] font-mono"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Business & Traffic Patterns */}
          <div className="card p-5 space-y-3">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="font-semibold text-sm text-slate-900">Operational Patterns</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Observed customer rhythm, quiet windows, and store peak cycles
              </p>
            </div>
            <div className="space-y-2.5 pt-1">
              {memoryMatrix.trafficPatterns.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No patterns detected yet.</p>
              ) : (
                memoryMatrix.trafficPatterns.map((pat) => (
                  <div
                    key={pat.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5"
                  >
                    <p className="text-xs font-medium text-slate-900 leading-relaxed">
                      {pat.content}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {pat.tags?.map((t) => (
                        <span
                          key={t}
                          className="badge-slate text-[10px] font-mono"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
