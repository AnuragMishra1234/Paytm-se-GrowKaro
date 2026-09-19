import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMerchantContext } from "../context/MerchantContext";
import { createActionDraft, approveAction, rejectAction } from "../services/api";
import { ActionReviewModal } from "./ActionReviewModal";

const categoryMeta = {
  ACT_NOW: {
    label: "ACT NOW",
    badge: "bg-red-100 text-red-800 border-red-200",
    border: "border-red-300 bg-red-50/40",
    icon: "🔴",
  },
  OPPORTUNITY: {
    label: "OPPORTUNITY",
    badge: "bg-amber-100 text-amber-800 border-amber-200",
    border: "border-amber-300 bg-amber-50/40",
    icon: "🟡",
  },
  WARNING: {
    label: "WARNING",
    badge: "bg-orange-100 text-orange-800 border-orange-200",
    border: "border-orange-300 bg-orange-50/40",
    icon: "🟠",
  },
  POSITIVE_TREND: {
    label: "POSITIVE TREND",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
    border: "border-emerald-300 bg-emerald-50/40",
    icon: "🟢",
  },
};

export function AIPriorityFeed({ insights = [], loading = false, dailyBrief = null, onRefresh = null }) {
  const { merchant } = useMerchantContext();
  const navigate = useNavigate();
  const [selectedInsight, setSelectedInsight] = useState(null);
  const [activeAction, setActiveAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const handleTakeAction = async (insight) => {
    if (!merchant?._id || !insight?._id) return;
    setActionLoading(true);
    try {
      const res = await createActionDraft({
        merchantId: merchant._id,
        insightId: insight._id,
      });
      setActiveAction(res.data);
      setSelectedInsight(null); // close detail modal if open
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
          <div className="h-5 bg-gray-200 rounded w-40" />
          <div className="h-5 bg-gray-200 rounded w-20" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base md:text-lg font-black text-gray-950">AI Priority Feed</h2>
            <span className="badge bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5">Phase 3 Action Engine</span>
          </div>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5 font-medium">Autonomous detections ready for merchant approval</p>
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="text-xs md:text-sm text-blue-700 hover:text-blue-900 font-bold px-2.5 py-1 rounded-lg bg-blue-50"
            >
              Analyze ⚡
            </button>
          )}
          <Link to="/insights" className="text-xs md:text-sm text-gray-600 hover:text-gray-900 font-bold">
            View all →
          </Link>
        </div>
      </div>

      {/* Daily Brief Highlight Banner */}
      {dailyBrief && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 text-xs md:text-sm text-blue-950 space-y-1">
          <div className="flex items-center justify-between font-bold mb-1">
            <span>{dailyBrief.greeting}</span>
            <span className="text-blue-700 font-medium">{dailyBrief.externalContextNote}</span>
          </div>
          <p className="text-blue-900 leading-relaxed font-normal">
            <span className="font-bold">Focus:</span> {dailyBrief.whatMatters} ·{" "}
            <span className="font-bold">Opportunity:</span> {dailyBrief.topOpportunity}
          </p>
        </div>
      )}

      {/* Feed Cards */}
      {insights.length === 0 ? (
        <div className="py-8 text-center text-gray-400 text-sm">
          <p className="font-semibold text-gray-700">No critical business anomalies detected right now.</p>
          <p className="text-xs md:text-sm text-gray-500 mt-1">Your business metrics are operating steadily within normal baseline.</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {insights.slice(0, 4).map((item) => {
            const meta = categoryMeta[item.category] || categoryMeta.OPPORTUNITY;
            return (
              <div
                key={item._id || item.title}
                className={`p-4 sm:p-5 rounded-2xl border transition-all hover:shadow-sm ${meta.border}`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`badge border text-xs font-bold py-0.5 px-2.5 rounded-md ${meta.badge}`}>
                      {meta.icon} {meta.label}
                    </span>
                    <span className="text-sm md:text-base font-bold text-gray-950 leading-snug">{item.title}</span>
                  </div>
                  {item.priorityScore && (
                    <span className="text-xs font-extrabold text-gray-500 shrink-0 bg-white/80 px-2 py-0.5 rounded border border-gray-200/60">
                      Score: {item.priorityScore}
                    </span>
                  )}
                </div>

                {/* Evidence summary */}
                {item.evidence?.[0] && (
                  <p className="text-xs md:text-sm text-gray-700 mb-2 leading-relaxed">
                    {item.evidence[0]}
                  </p>
                )}

                {/* AI Recommendation Box */}
                {item.recommendation?.action && (
                  <div className="bg-white/90 border border-gray-200/90 rounded-xl p-3 text-xs md:text-sm space-y-1 mb-2.5">
                    <div className="flex items-center gap-1.5 text-blue-800 font-bold">
                      <span>💡 AI Recommendation:</span>
                    </div>
                    <p className="text-gray-800 font-medium leading-relaxed">
                      {item.recommendation.action}
                    </p>
                  </div>
                )}

                {/* Action CTA & Detail link */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-200/60 mt-2 text-xs md:text-sm">
                  <button
                    onClick={() => setSelectedInsight(item)}
                    className="text-gray-600 hover:text-gray-950 font-bold"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleTakeAction(item)}
                    disabled={actionLoading}
                    className="btn-primary text-xs md:text-sm font-bold py-2 px-3.5 flex items-center gap-1.5 shadow-sm"
                  >
                    <span>Take Action</span>
                    <span>⚡</span>
                  </button>
                </div>
              </div>
            );
          })}
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

            {/* Explanation */}
            {selectedInsight.explanation && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Why It Matters (AI Reasoning)</h4>
                <p className="text-xs text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg border">
                  {selectedInsight.explanation}
                </p>
              </div>
            )}

            {/* Recommended Action */}
            {selectedInsight.recommendation && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 space-y-2">
                <h4 className="text-xs font-bold text-blue-900 uppercase">Recommended Next Step</h4>
                <p className="text-xs text-blue-950 font-medium leading-relaxed">
                  {selectedInsight.recommendation.action}
                </p>
                {selectedInsight.recommendation.goal && (
                  <p className="text-[11px] text-blue-700">
                    <span className="font-semibold">Goal:</span> {selectedInsight.recommendation.goal}
                  </p>
                )}
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