import React, { useState } from "react";
import { useMerchantContext } from "../context/MerchantContext";
import { useOutcomes } from "../hooks/useOutcomes";
import { useActions } from "../hooks/useActions";
import { LoadingSpinner, ErrorState } from "../components/LoadingSpinner";
import { formatDate } from "../utils/formatters";

const TABS = [
  { id: "OUTCOMES", label: "Measured Outcomes & Attribution" },
  { id: "LEARNED", label: "What GrowKaro Has Learned (Memory)" },
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
      <div className="p-8">
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
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl md:text-3xl font-black text-gray-900">Performance &amp; Outcome Learning</h1>
            <span className="badge bg-purple-100 text-purple-800 text-xs md:text-sm font-bold px-2.5 py-0.5">Phase 4 Loop</span>
          </div>
          <p className="text-gray-600 text-sm md:text-base mt-1">
            Deterministic before/after attribution and persistent merchant intelligence
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* n8n Status Pill */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border bg-white text-sm font-medium shadow-2xs">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                n8nStatus?.mode === "real" ? "bg-emerald-500 animate-pulse" : "bg-blue-500"
              }`}
            />
            <span className="font-bold text-gray-800">
              {n8nStatus?.mode === "real" ? "n8n Live Automation" : "n8n Simulation Sandbox"}
            </span>
          </div>

          <button
            onClick={refetch}
            className="btn-secondary text-sm font-bold px-4 py-2"
          >
            ↻ Refresh Metrics
          </button>
        </div>
      </div>

      {/* High-Level Impact Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 border-l-4 border-l-emerald-500">
          <p className="text-xs md:text-sm text-gray-600 font-bold uppercase tracking-wider">Campaigns Measured</p>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-3xl font-black text-emerald-600">{totalMeasured}</span>
            <span className="text-2xl">📊</span>
          </div>
          <p className="text-xs md:text-sm text-gray-500 mt-1 font-medium">Deterministic before/after evaluation</p>
        </div>

        <div className="card p-5 border-l-4 border-l-blue-500">
          <p className="text-xs md:text-sm text-gray-600 font-bold uppercase tracking-wider">Avg Observed Lift</p>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-3xl font-black text-blue-600">+{avgLift}%</span>
            <span className="text-2xl">📈</span>
          </div>
          <p className="text-xs md:text-sm text-gray-500 mt-1 font-medium">Observed post-action change</p>
        </div>

        <div className="card p-5 border-l-4 border-l-purple-500">
          <p className="text-xs md:text-sm text-gray-600 font-bold uppercase tracking-wider">Learned Memory Facts</p>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-3xl font-black text-purple-600">
              {memoryMatrix.provenTactics.length +
                memoryMatrix.merchantPreferences.length +
                memoryMatrix.trafficPatterns.length}
            </span>
            <span className="text-2xl">🧠</span>
          </div>
          <p className="text-xs md:text-sm text-gray-500 mt-1 font-medium">Active in Cognee / MongoDB</p>
        </div>

        <div className="card p-5 border-l-4 border-l-amber-500">
          <p className="text-xs md:text-sm text-gray-600 font-bold uppercase tracking-wider">Learning Loop</p>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-sm md:text-base font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
              Active &amp; Adapting
            </span>
            <span className="text-2xl">⚡</span>
          </div>
          <p className="text-xs md:text-sm text-gray-500 mt-1 font-medium">Grounded in Groq reasoning</p>
        </div>
      </div>

      {/* Pending Actions Ready for Outcome Measurement */}
      {unmeasuredActions.length > 0 && (
        <div className="card p-6 border-2 border-dashed border-blue-300 bg-blue-50/40 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">⚡</span>
              <h3 className="font-bold text-base md:text-lg text-blue-950">
                Executed Campaigns Awaiting Measurement ({unmeasuredActions.length})
              </h3>
            </div>
            <span className="text-xs font-bold text-blue-800 bg-blue-100 px-2.5 py-1 rounded-lg">
              Ready for evaluation
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {unmeasuredActions.map((act) => (
              <div
                key={act._id}
                className="bg-white p-4 rounded-xl border border-blue-200 flex items-center justify-between gap-3 shadow-2xs"
              >
                <div>
                  <p className="font-bold text-sm md:text-base text-gray-900">{act.title}</p>
                  <p className="text-xs md:text-sm text-gray-600 mt-0.5 font-medium">
                    Executed: {formatDate(act.completedAt || act.createdAt)} · {act.channel}
                  </p>
                </div>
                <button
                  onClick={() => handleMeasureAction(act._id)}
                  disabled={measuring || measuringId === act._id}
                  className="btn-primary text-sm py-2 px-4 whitespace-nowrap shadow-sm font-bold"
                >
                  {measuringId === act._id ? "Calculating..." : "Measure Outcome 📊"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3.5 text-base md:text-lg font-bold transition-colors relative ${
                activeTab === tab.id
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {tab.label}
              {tab.id === "OUTCOMES" && (
                <span className="ml-2.5 px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-800 font-extrabold">
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
            <div className="card p-12 text-center text-gray-400 space-y-3">
              <span className="text-5xl">📈</span>
              <p className="font-bold text-lg text-gray-800">No measured outcomes yet</p>
              <p className="text-sm md:text-base text-gray-500">
                Run an approved action and click "Measure Outcome" to see before/after impact.
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
                    className="card p-6 space-y-4 border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    {/* Card Top */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="badge bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold px-2.5 py-1">
                          {item.metric}
                        </span>
                        <h3 className="text-base md:text-lg font-black text-gray-950 mt-1.5 leading-snug">
                          {item.actionId?.title || "Business Action Campaign"}
                        </h3>
                      </div>
                      <div className="text-right">
                        <span
                          className={`badge text-sm font-extrabold px-3 py-1 rounded-lg ${
                            isPositive
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {sign}
                          {item.changePercentage}% Observed
                        </span>
                        <p className="text-xs text-gray-500 mt-1 font-medium">
                          {formatDate(item.measuredAt)}
                        </p>
                      </div>
                    </div>

                    {/* Before vs After Metric Strip */}
                    <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-3 divide-x divide-gray-200 text-center">
                      <div>
                        <span className="text-xs md:text-sm text-gray-500 block font-semibold">
                          Pre-Campaign Baseline
                        </span>
                        <span className="font-black text-gray-800 text-base md:text-lg mt-1 block">
                          {formatVal(item.baselineValue)}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs md:text-sm text-gray-500 block font-semibold">
                          Post-Campaign Observed
                        </span>
                        <span className="font-black text-gray-950 text-base md:text-lg mt-1 block">
                          {formatVal(item.postActionValue)}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs md:text-sm text-gray-500 block font-semibold">
                          Observed Difference
                        </span>
                        <span
                          className={`font-black text-base md:text-lg mt-1 block ${
                            isPositive ? "text-emerald-700" : "text-red-600"
                          }`}
                        >
                          {sign}
                          {formatVal(item.changeValue)}
                        </span>
                      </div>
                    </div>

                    {/* Interpretation & Non-causal Attribution */}
                    <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 text-sm md:text-base space-y-2">
                      <p className="text-emerald-950 font-medium leading-relaxed">
                        {item.interpretation}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs md:text-sm text-emerald-900 font-semibold pt-2 border-t border-emerald-200/80">
                        <span>🛡️ Non-Causal Attribution Standard:</span>
                        <span className="font-normal text-emerald-800">
                          Calculated directly from merchant transaction delta over {item.measurementWindow}.
                        </span>
                      </div>
                    </div>

                    {/* Evidence Points */}
                    {item.evidence && item.evidence.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                          Measurement Evidence
                        </span>
                        <ul className="text-sm text-gray-700 space-y-1">
                          {item.evidence.map((ev, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-blue-500 font-bold">•</span>
                              <span>{ev}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Footer / Status */}
                    <div className="flex items-center justify-between pt-3 border-t text-xs md:text-sm text-gray-500 font-medium">
                      <span>Window: {item.measurementWindow}</span>
                      <span className="text-purple-700 font-bold flex items-center gap-1.5">
                        <span>🧠 Stored in Business Memory</span>
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
          <div className="card p-6 space-y-4">
            <div className="flex items-center gap-2.5 border-b pb-3">
              <span className="text-2xl">🏆</span>
              <h3 className="font-black text-base md:text-lg text-gray-900">Proven Tactics</h3>
            </div>
            <p className="text-sm text-gray-600 font-medium leading-relaxed">
              Actions and campaign patterns verified to have positive observed volume lift.
            </p>
            <div className="space-y-3 pt-1">
              {memoryMatrix.provenTactics.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No tactics verified yet.</p>
              ) : (
                memoryMatrix.provenTactics.map((tac) => (
                  <div
                    key={tac.id}
                    className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2 shadow-2xs"
                  >
                    <p className="text-sm md:text-base font-bold text-emerald-950 leading-relaxed">
                      {tac.content}
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {tac.tags?.map((t) => (
                        <span
                          key={t}
                          className="badge bg-emerald-100 text-emerald-800 text-xs font-semibold px-2 py-0.5"
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
          <div className="card p-6 space-y-4">
            <div className="flex items-center gap-2.5 border-b pb-3">
              <span className="text-2xl">⚙️</span>
              <h3 className="font-black text-base md:text-lg text-gray-900">Merchant Preferences</h3>
            </div>
            <p className="text-sm text-gray-600 font-medium leading-relaxed">
              Rules and feedback extracted from your approvals, edits, and rejections.
            </p>
            <div className="space-y-3 pt-1">
              {memoryMatrix.merchantPreferences.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No preferences recorded yet.</p>
              ) : (
                memoryMatrix.merchantPreferences.map((pref) => (
                  <div
                    key={pref.id}
                    className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-2 shadow-2xs"
                  >
                    <p className="text-sm md:text-base font-bold text-blue-950 leading-relaxed">
                      {pref.content}
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {pref.tags?.map((t) => (
                        <span
                          key={t}
                          className="badge bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5"
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
          <div className="card p-6 space-y-4">
            <div className="flex items-center gap-2.5 border-b pb-3">
              <span className="text-2xl">⏱️</span>
              <h3 className="font-black text-base md:text-lg text-gray-900">Operational Patterns</h3>
            </div>
            <p className="text-sm text-gray-600 font-medium leading-relaxed">
              Recurring transaction densities, quiet windows, and seasonal demand traits.
            </p>
            <div className="space-y-3 pt-1">
              {memoryMatrix.trafficPatterns.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No patterns detected yet.</p>
              ) : (
                memoryMatrix.trafficPatterns.map((pat) => (
                  <div
                    key={pat.id}
                    className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-2 shadow-2xs"
                  >
                    <p className="text-sm md:text-base font-bold text-purple-950 leading-relaxed">
                      {pat.content}
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {pat.tags?.map((t) => (
                        <span
                          key={t}
                          className="badge bg-purple-100 text-purple-800 text-xs font-semibold px-2 py-0.5"
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
