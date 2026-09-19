import React, { useState } from "react";
import { useMerchantContext } from "../context/MerchantContext";
import { useInsights } from "../hooks/useInsights";
import { ErrorState } from "../components/LoadingSpinner";
import { createActionDraft, approveAction, rejectAction } from "../services/api";
import { ActionReviewModal } from "../components/ActionReviewModal";

const FILTERS = [
  { id: "ALL", label: "All Insights" },
  { id: "ACT_NOW", label: "Needs Immediate Action" },
  { id: "OPPORTUNITY", label: "Opportunities" },
  { id: "WARNING", label: "Warnings" },
  { id: "POSITIVE_TREND", label: "Positive Trends" },
];

const categoryMeta = {
  ACT_NOW: {
    label: "Act Now",
    badge: "badge-rose",
    indicator: "bg-rose-500",
    border: "border-rose-200/80 hover:border-rose-300",
  },
  OPPORTUNITY: {
    label: "Opportunity",
    badge: "badge-amber",
    indicator: "bg-amber-500",
    border: "border-amber-200/80 hover:border-amber-300",
  },
  WARNING: {
    label: "Attention",
    badge: "badge-amber",
    indicator: "bg-amber-500",
    border: "border-amber-200/80 hover:border-amber-300",
  },
  POSITIVE_TREND: {
    label: "Positive Trend",
    badge: "badge-emerald",
    indicator: "bg-emerald-500",
    border: "border-emerald-200/80 hover:border-emerald-300",
  },
};

export default function Insights() {
  const { merchant } = useMerchantContext();
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedInsight, setSelectedInsight] = useState(null);
  const [activeAction, setActiveAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const { insights, loading, analyzing, error, refetch, runAnalysis, dismiss } = useInsights(
    merchant?._id,
    activeFilter
  );

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
      refetch();
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
      refetch();
    } catch (err) {
      console.error("Failed to reject action:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = insights.filter((i) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      i.title?.toLowerCase().includes(term) ||
      i.explanation?.toLowerCase().includes(term) ||
      i.recommendation?.action?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-900">
              Intelligence &amp; Daily Insights
            </h1>
            <span className="badge-slate font-mono text-xs font-semibold">
              {filtered.length} active
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Automated operational diagnosis, detected patterns, and merchant growth actions.
          </p>
        </div>

        <button
          onClick={runAnalysis}
          disabled={analyzing}
          className="btn-primary inline-flex items-center gap-2 self-start sm:self-auto text-xs font-semibold py-2 px-4 shadow-sm"
        >
          {analyzing ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Diagnosing Store...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Run Store Diagnosis</span>
            </>
          )}
        </button>
      </div>

      {/* Filter Tabs & Search Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                activeFilter === f.id
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <svg
            className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search insights & actions..."
            className="input-text text-xs pl-9 pr-3 py-1.5 w-full bg-white"
          />
        </div>
      </div>

      {/* Error state */}
      {error && filtered.length === 0 && (
        <div className="p-8">
          <ErrorState message={error} onRetry={refetch} />
        </div>
      )}
      {error && filtered.length > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs flex items-center justify-between">
          <span>{error}. Displaying latest recorded insights.</span>
          <button onClick={refetch} className="font-semibold underline text-amber-900 hover:text-amber-950">
            Refresh
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card p-6 animate-pulse space-y-3 bg-slate-100/60 h-48" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filtered.length === 0 && (
        <div className="card p-12 text-center space-y-3 border-dashed">
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="font-semibold text-sm text-slate-900">No active insights in this category</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {activeFilter !== "ALL"
              ? "No alerts found under this filter. Try selecting 'All Insights' or trigger a fresh store diagnosis."
              : "All store metrics are operating stably within normal expected baselines."}
          </p>
        </div>
      )}

      {/* Insight Grid */}
      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((item) => {
            const meta = categoryMeta[item.category] || categoryMeta.OPPORTUNITY;
            return (
              <div
                key={item._id}
                className={`card p-5 space-y-4 transition-all duration-200 ${meta.border}`}
              >
                {/* Header: Category Badge + Priority + Dismiss */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`${meta.badge} text-[11px] font-medium inline-flex items-center gap-1.5`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${meta.indicator}`} />
                      {meta.label}
                    </span>
                    {item.priorityScore && (
                      <span className="badge-slate font-mono text-[11px]">
                        Priority: {item.priorityScore}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => dismiss(item._id)}
                    title="Dismiss"
                    className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Insight Title */}
                <h3 className="text-sm font-semibold text-slate-900 leading-snug">
                  {item.title}
                </h3>

                {/* Grounded Evidence Box */}
                {item.evidence?.[0] && (
                  <div className="bg-slate-50 border border-slate-100 rounded-md p-3 text-xs text-slate-700 leading-relaxed">
                    <span className="font-semibold text-slate-900 block mb-1">Observed Evidence:</span>
                    {item.evidence[0]}
                  </div>
                )}

                {/* Recommended Action */}
                {item.recommendation?.action && (
                  <div className="bg-brand-50/50 border border-brand-200/60 rounded-md p-3 text-xs space-y-1">
                    <span className="font-semibold text-brand-900 block">Proposed Next Step:</span>
                    <p className="text-slate-700 leading-relaxed">
                      {item.recommendation.action}
                    </p>
                  </div>
                )}

                {/* Card Actions Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  <button
                    onClick={() => setSelectedInsight(item)}
                    className="font-medium text-slate-600 hover:text-slate-900"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleTakeAction(item)}
                    disabled={actionLoading}
                    className="btn-primary text-xs font-semibold py-1.5 px-3.5 flex items-center gap-1.5 shadow-sm"
                  >
                    <span>Take Action</span>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Deep-Dive Modal */}
      {selectedInsight && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className={`${categoryMeta[selectedInsight.category]?.badge} text-[11px] font-medium`}>
                  {categoryMeta[selectedInsight.category]?.label || selectedInsight.category}
                </span>
                <h3 className="text-base font-semibold text-slate-900 mt-1">
                  {selectedInsight.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedInsight(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Observed Evidence */}
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Grounded Evidence
              </h4>
              <ul className="list-disc pl-4 text-xs text-slate-700 space-y-1.5">
                {selectedInsight.evidence?.map((ev, i) => (
                  <li key={i}>{ev}</li>
                ))}
              </ul>
            </div>

            {/* Explanation */}
            {selectedInsight.explanation && (
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Why It Matters
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-md border border-slate-200/80">
                  {selectedInsight.explanation}
                </p>
              </div>
            )}

            {/* Action */}
            {selectedInsight.recommendation && (
              <div className="bg-brand-50/50 border border-brand-200 rounded-md p-3.5 space-y-2">
                <h4 className="text-xs font-semibold text-brand-900 uppercase tracking-wider">
                  Recommended Action
                </h4>
                <p className="text-xs text-slate-800 leading-relaxed font-medium">
                  {selectedInsight.recommendation.action}
                </p>
                {selectedInsight.recommendation.goal && (
                  <p className="text-[11px] text-brand-700">
                    <span className="font-semibold">Goal:</span> {selectedInsight.recommendation.goal}
                  </p>
                )}
              </div>
            )}

            {/* Action Proposal Trigger */}
            <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/70 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-slate-900">
                  {selectedInsight.recommendation?.suggestedAction?.title || "Draft Targeted Offer"}
                </p>
                <p className="text-[11px] text-slate-500">
                  Prepares action draft for merchant approval &amp; execution
                </p>
              </div>
              <button
                onClick={() => handleTakeAction(selectedInsight)}
                disabled={actionLoading}
                className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1 shadow-sm whitespace-nowrap"
              >
                <span>Take Action</span>
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