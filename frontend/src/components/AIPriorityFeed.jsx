import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useMerchantContext } from "../context/MerchantContext";
import { createActionDraft, approveAction, rejectAction } from "../services/api";
import { ActionReviewModal } from "./ActionReviewModal";

const categoryMeta = {
  ACT_NOW: {
    label: "Act Now",
    badge: "badge-rose",
  },
  OPPORTUNITY: {
    label: "Opportunity",
    badge: "badge-amber",
  },
  WARNING: {
    label: "Warning",
    badge: "badge-amber",
  },
  POSITIVE_TREND: {
    label: "Trend",
    badge: "badge-emerald",
  },
};

export function AIPriorityFeed({ insights = [], loading = false, dailyBrief = null, onRefresh = null }) {
  const { merchant } = useMerchantContext();
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
      <div className="card p-5 animate-pulse space-y-4">
        <div className="h-4 bg-slate-100 rounded w-36" />
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 bg-slate-50 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const topInsights = insights.slice(0, 3);

  return (
    <div className="card p-5 sm:p-6 space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            What Needs Attention
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            GrowKaro noticed patterns in recent sales
          </p>
        </div>
        <Link
          to="/insights"
          className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
        >
          All Insights →
        </Link>
      </div>

      {topInsights.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-400">
          No critical anomalies detected today. Sales volumes are operating within normal variance.
        </div>
      ) : (
        <div className="space-y-3">
          {topInsights.map((insight) => {
            const meta = categoryMeta[insight.category] || {
              label: "Notice",
              badge: "badge-neutral",
            };

            return (
              <div
                key={insight._id}
                className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 hover:border-slate-300 transition-colors space-y-2.5"
              >
                {/* Category & Title */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className={`badge text-[10px] uppercase font-bold tracking-wider ${meta.badge}`}>
                      {meta.label}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      GrowKaro noticed
                    </span>
                  </div>
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                    {insight.title}
                  </h3>
                </div>

                {/* Plain-English Explanation */}
                <p className="text-xs text-slate-600 leading-relaxed">
                  {insight.explanation}
                </p>

                {/* Recommended Action & Action Trigger */}
                {insight.recommendedAction && (
                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                    <div className="text-[11px] text-slate-500 truncate">
                      <span className="font-semibold text-slate-700">Suggestion: </span>
                      {insight.recommendedAction.title}
                    </div>

                    <button
                      onClick={() => handleTakeAction(insight)}
                      disabled={actionLoading}
                      className="shrink-0 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 rounded-md transition-colors"
                    >
                      Review →
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Action Review Modal */}
      {activeAction && (
        <ActionReviewModal
          action={activeAction}
          onClose={() => setActiveAction(null)}
          onApprove={handleApproveAction}
          onReject={handleRejectAction}
          loading={actionLoading}
        />
      )}
    </div>
  );
}