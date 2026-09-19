import React, { useState } from "react";
import { useMerchantContext } from "../context/MerchantContext";
import { useInsights } from "../hooks/useInsights";
import { ErrorState } from "../components/LoadingSpinner";
import { createActionDraft, approveAction, rejectAction } from "../services/api";
import { ActionReviewModal } from "../components/ActionReviewModal";

const FILTERS = [
  { id: "ALL", label: "All Insights" },
  { id: "ACT_NOW", label: "Act Now" },
  { id: "OPPORTUNITY", label: "Opportunities" },
  { id: "WARNING", label: "Warnings" },
  { id: "POSITIVE_TREND", label: "Positive Trends" },
];

const categoryMeta = {
  ACT_NOW: {
    label: "ACT NOW",
    badge: "bg-red-100 text-red-800 border-red-200",
    border: "border-red-300 bg-red-50/30",
  },
  OPPORTUNITY: {
    label: "OPPORTUNITY",
    badge: "bg-amber-100 text-amber-800 border-amber-200",
    border: "border-amber-300 bg-amber-50/30",
  },
  WARNING: {
    label: "WARNING",
    badge: "bg-orange-100 text-orange-800 border-orange-200",
    border: "border-orange-300 bg-orange-50/30",
  },
  POSITIVE_TREND: {
    label: "POSITIVE TREND",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
    border: "border-emerald-300 bg-emerald-50/30",
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
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl md:text-3xl font-black text-gray-900">Proactive Insights Feed</h1>
            <span className="badge bg-blue-100 text-blue-800 text-xs md:text-sm font-bold px-2.5 py-0.5">Phase 3 Action Engine</span>
          </div>
          <p className="text-gray-600 text-sm md:text-base mt-1">
            Real-time business anomalies, growth windows, and actionable agentic proposals
          </p>
        </div>
        <button
          onClick={runAnalysis}
          disabled={analyzing}
          className="btn-primary flex items-center gap-2 self-start sm:self-auto text-sm font-bold py-2.5 px-5 shadow-sm"
        >
          {analyzing ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Diagnosing Business...</span>
            </>
          ) : (
            <>
              <span>Run Diagnosis</span>
            </>
          )}
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3.5">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-3.5 py-2 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition-colors ${
                activeFilter === f.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter insights..."
          className="w-full sm:w-72 px-3.5 py-2 text-sm bg-white rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Error state */}
      {error && filtered.length === 0 && <ErrorState message={error} onRetry={refetch} />}
      {error && filtered.length > 0 && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs md:text-sm font-medium flex items-center justify-between">
          <span>{error}. Displaying latest recorded proactive insights.</span>
          <button onClick={refetch} className="font-bold underline text-amber-900 hover:text-amber-950">Refresh</button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card p-6 animate-pulse space-y-3.5">
              <div className="h-5 bg-gray-200 rounded w-28" />
              <div className="h-7 bg-gray-200 rounded w-64" />
              <div className="h-20 bg-gray-100 rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filtered.length === 0 && (
        <div className="card p-12 text-center text-gray-500 space-y-3">
          <p className="font-bold text-lg text-gray-800">No matching insights found</p>
          <p className="text-sm md:text-base text-gray-400">
            {activeFilter !== "ALL"
              ? "No events found in this category. Try switching filters or click Run Diagnosis."
              : "Your business metrics are operating steadily within normal baseline."}
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
                className={`card p-6 border-2 space-y-3.5 transition-all hover:shadow-md ${meta.border}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`badge border text-xs font-bold py-0.5 px-2.5 rounded-md ${meta.badge}`}>
                      {meta.label}
                    </span>
                    {item.priorityScore && (
                      <span className="text-xs font-extrabold text-gray-500 bg-white/80 px-2 py-0.5 rounded border border-gray-200/60">
                        Priority: {item.priorityScore}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => dismiss(item._id)}
                    title="Dismiss"
                    className="text-gray-400 hover:text-gray-600 text-sm px-2 py-0.5 rounded font-bold"
                  >
                    &times;
                  </button>
                </div>

                <h3 className="text-base md:text-lg font-black text-gray-950 leading-snug">{item.title}</h3>

                {/* Evidence snippet */}
                {item.evidence?.[0] && (
                  <p className="text-sm md:text-base text-gray-700 leading-relaxed bg-white/80 p-3 rounded-xl border border-gray-200/60">
                    {item.evidence[0]}
                  </p>
                )}

                {/* AI Recommendation */}
                {item.recommendation?.action && (
                  <div className="bg-blue-50/90 border border-blue-200/80 rounded-xl p-3.5 text-sm space-y-1.5">
                    <p className="text-blue-900 font-bold flex items-center gap-1.5">
                      <span>Recommended Action</span>
                    </p>
                    <p className="text-blue-950 font-medium leading-relaxed">
                      {item.recommendation.action}
                    </p>
                  </div>
                )}

                {/* Footer with Take Action CTA */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200/60 text-sm">
                  <button
                    onClick={() => setSelectedInsight(item)}
                    className="text-sm text-gray-600 hover:text-gray-950 font-bold"
                  >
                    Deep Dive
                  </button>
                  <button
                    onClick={() => handleTakeAction(item)}
                    disabled={actionLoading}
                    className="btn-primary text-sm font-bold py-2 px-4 flex items-center gap-1.5 shadow-sm"
                  >
                    <span>Take Action</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Deep-Dive Modal */}
      {selectedInsight && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <span className={`badge text-[10px] font-semibold ${categoryMeta[selectedInsight.category]?.badge}`}>
                  {selectedInsight.category}
                </span>
                <h3 className="text-base font-bold text-gray-900 mt-1">{selectedInsight.title}</h3>
              </div>
              <button
                onClick={() => setSelectedInsight(null)}
                className="text-gray-400 hover:text-gray-600 text-lg p-1"
              >
                &times;
              </button>
            </div>

            {/* Observed Evidence */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Grounded Evidence</h4>
              <ul className="list-disc pl-4 text-xs text-gray-700 space-y-1">
                {selectedInsight.evidence?.map((ev, i) => (
                  <li key={i}>{ev}</li>
                ))}
              </ul>
            </div>

            {/* AI Explanation */}
            {selectedInsight.explanation && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Why It Matters (AI Reasoning)</h4>
                <p className="text-xs text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg border">
                  {selectedInsight.explanation}
                </p>
              </div>
            )}

            {/* Action */}
            {selectedInsight.recommendation && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 space-y-2">
                <h4 className="text-xs font-bold text-blue-900 uppercase">Recommended Next Action</h4>
                <p className="text-xs text-blue-950 font-medium leading-relaxed">
                  {selectedInsight.recommendation.action}
                </p>
                {selectedInsight.recommendation.goal && (
                  <p className="text-[11px] text-blue-700">
                    <span className="font-semibold">Business Goal:</span> {selectedInsight.recommendation.goal}
                  </p>
                )}
              </div>
            )}

            {/* Phase 3 Action Trigger */}
            <div className="border border-blue-200 rounded-xl p-3.5 bg-blue-50/50 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-900">
                  {selectedInsight.recommendation?.suggestedAction?.title || "Draft Promotional Offer"}
                </p>
                <p className="text-[11px] text-gray-500">Prepares action draft for merchant review &amp; execution</p>
              </div>
              <button
                onClick={() => handleTakeAction(selectedInsight)}
                disabled={actionLoading}
                className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 shadow-sm"
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