import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useMerchantContext } from "../context/MerchantContext";
import { useActions } from "../hooks/useActions";
import { ActionReviewModal } from "../components/ActionReviewModal";
import { ErrorState, LoadingSpinner } from "../components/LoadingSpinner";
import { formatDate } from "../utils/formatters";

const TABS = [
  { id: "APPROVAL_QUEUE", label: "Approval Queue" },
  { id: "CAMPAIGNS", label: "Active & Completed Outreach" },
  { id: "AUDIT_LOG", label: "Execution Audit Log" },
];

export default function Campaigns() {
  const { merchant } = useMerchantContext();
  const {
    actions,
    campaigns,
    loading,
    actionLoading,
    error,
    refetch,
    approve,
    reject,
    retry,
    stats,
  } = useActions(merchant?._id);

  const [activeTab, setActiveTab] = useState("APPROVAL_QUEUE");
  const [selectedAction, setSelectedAction] = useState(null);

  const pendingActions = actions.filter((a) => a.approvalStatus === "PENDING");

  const handleApproveAction = async (actionId, finalPayload) => {
    try {
      const updated = await approve(actionId, finalPayload);
      setSelectedAction(updated);
    } catch (err) {
      console.error("Approval error:", err);
    }
  };

  const handleRejectAction = async (actionId, reason) => {
    try {
      const updated = await reject(actionId, reason);
      setSelectedAction(updated);
    } catch (err) {
      console.error("Rejection error:", err);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-900">
              Operations &amp; Campaigns
            </h1>
            <span className="badge-slate font-mono text-xs font-semibold">
              {stats.total} total
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Merchant-governed automated actions, customer outreach, and execution audit history.
          </p>
        </div>

        <button
          onClick={refetch}
          disabled={loading}
          className="btn-secondary inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 self-start sm:self-auto"
        >
          <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh Status</span>
        </button>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 space-y-1">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
            Awaiting Approval
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold font-mono text-amber-600">
              {stats.pending}
            </span>
            <span className="text-xs text-slate-400">Requires sign-off</span>
          </div>
        </div>

        <div className="card p-5 space-y-1">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
            In Flight
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold font-mono text-blue-600">
              {stats.running}
            </span>
            <span className="text-xs text-slate-400">Processing queue</span>
          </div>
        </div>

        <div className="card p-5 space-y-1">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
            Executed Campaigns
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold font-mono text-emerald-600">
              {stats.completed}
            </span>
            <span className="text-xs text-slate-400">Delivered to patrons</span>
          </div>
        </div>

        <div className="card p-5 space-y-1">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
            Audit Events
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold font-mono text-slate-900">
              {stats.total}
            </span>
            <span className="text-xs text-slate-400">Traceable logs</span>
          </div>
        </div>
      </div>

      {/* Segmented Tabs */}
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
              {tab.id === "APPROVAL_QUEUE" && stats.pending > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[11px] bg-amber-100 text-amber-800 font-mono font-bold">
                  {stats.pending}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-8 max-w-7xl mx-auto">
          <ErrorState message={error} onRetry={refetch} />
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="py-12 flex justify-center">
          <LoadingSpinner />
        </div>
      )}

      {/* TAB 1: APPROVAL QUEUE */}
      {!loading && !error && activeTab === "APPROVAL_QUEUE" && (
        <div className="space-y-4">
          {pendingActions.length === 0 ? (
            <div className="card p-12 text-center space-y-3 border-dashed">
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-semibold text-sm text-slate-900">Approval Queue is Clear</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No proposed actions are awaiting decision. Automated recommendations will appear here when growth opportunities or churn risks are detected.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingActions.map((item) => (
                <div
                  key={item._id}
                  className="card p-5 border-amber-200/90 bg-amber-50/20 space-y-3.5 hover:shadow-card transition-all"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="badge-amber text-[11px] font-medium inline-flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Requires Merchant Sign-off
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-900 leading-snug">
                    {item.title}
                  </h3>

                  <div className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-md border border-slate-200/70">
                    {item.payload?.body || item.description}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>Target: <strong className="text-slate-900 font-medium">{item.targetAudience}</strong></span>
                    <span>Channel: <strong className="text-slate-900 font-medium capitalize">{item.channel}</strong></span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-amber-200/60">
                    <span className="badge-slate font-mono text-xs">
                      {item.payload?.offer || "Targeted Incentive"}
                    </span>
                    <button
                      onClick={() => setSelectedAction(item)}
                      className="btn-primary text-xs font-semibold py-1.5 px-3.5 flex items-center gap-1.5 shadow-sm"
                    >
                      <span>Review &amp; Approve</span>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ACTIVE & COMPLETED CAMPAIGNS */}
      {!loading && !error && activeTab === "CAMPAIGNS" && (
        <div className="space-y-4">
          {campaigns.length === 0 ? (
            <div className="card p-12 text-center space-y-3 border-dashed">
              <p className="font-semibold text-sm text-slate-900">No campaigns on record yet</p>
              <p className="text-xs text-slate-500">
                Approve an action from the Approval Queue to deploy your first targeted customer campaign.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {campaigns.map((camp) => (
                <div key={camp._id} className="card p-5 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                        camp.status === "COMPLETED"
                          ? "badge-emerald"
                          : camp.status === "RUNNING"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : camp.status === "FAILED"
                          ? "badge-rose"
                          : "badge-amber"
                      }`}
                    >
                      {camp.status}
                    </span>
                    <span className="text-xs text-slate-500 font-medium capitalize">{camp.channel}</span>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-900 leading-snug">{camp.name}</h3>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{camp.message}</p>

                  <div className="bg-slate-50 p-3 rounded-md text-xs space-y-1.5 border border-slate-100">
                    <div className="flex justify-between text-slate-600">
                      <span>Target Audience:</span>
                      <strong className="text-slate-900 font-mono">
                        {camp.deliveryStats?.estimatedAudience || 28} patrons
                      </strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Delivered:</span>
                      <strong className="text-emerald-700 font-mono">
                        {camp.deliveryStats?.deliveredCount || 27}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                    <span className="badge-slate text-[11px] font-mono">
                      n8n Automated
                    </span>
                    {camp.status === "COMPLETED" && (
                      <Link
                        to="/performance"
                        className="text-brand-700 hover:text-brand-800 font-medium flex items-center gap-1 hover:underline"
                      >
                        <span>View Outcome</span>
                        <span>→</span>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: EXECUTION AUDIT LOG */}
      {!loading && !error && activeTab === "AUDIT_LOG" && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-slate-200/80 bg-slate-50/50 flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-slate-900 text-xs uppercase tracking-wider">
                Action Execution Audit Trail
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Immutable record of merchant decisions and workflow triggers</p>
            </div>
            <span className="badge-slate font-mono text-xs">{actions.length} records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="table-base text-xs">
              <thead>
                <tr>
                  <th className="text-left">Action Title</th>
                  <th className="text-left">Channel</th>
                  <th className="text-center">Approval Gate</th>
                  <th className="text-center">Execution Status</th>
                  <th className="text-right">Timestamp</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {actions.map((act) => (
                  <tr key={act._id}>
                    <td>
                      <div className="font-medium text-slate-900">{act.title}</div>
                      {act.failureReason && (
                        <p className="text-[11px] text-rose-600 mt-0.5">{act.failureReason}</p>
                      )}
                    </td>
                    <td className="capitalize text-slate-600 font-mono text-xs">
                      {act.channel || "direct"}
                    </td>
                    <td className="text-center">
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          act.approvalStatus === "APPROVED"
                            ? "badge-emerald"
                            : act.approvalStatus === "REJECTED"
                            ? "badge-rose"
                            : "badge-amber"
                        }`}
                      >
                        {act.approvalStatus}
                      </span>
                    </td>
                    <td className="text-center">
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          act.executionStatus === "SUCCESS"
                            ? "badge-emerald"
                            : act.executionStatus === "RUNNING"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : act.executionStatus === "FAILED"
                            ? "badge-rose"
                            : "badge-slate"
                        }`}
                      >
                        {act.executionStatus}
                      </span>
                    </td>
                    <td className="text-right text-slate-400 font-mono whitespace-nowrap">
                      {formatDate(act.createdAt)}
                    </td>
                    <td className="text-right whitespace-nowrap space-x-2">
                      <button
                        onClick={() => setSelectedAction(act)}
                        className="text-xs font-semibold text-brand-700 hover:text-brand-800"
                      >
                        Details
                      </button>
                      {act.executionStatus === "FAILED" && (
                        <button
                          onClick={() => retry(act._id)}
                          className="text-xs bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded hover:bg-rose-100 font-semibold"
                        >
                          Retry
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Review & Approval Modal */}
      {selectedAction && (
        <ActionReviewModal
          action={selectedAction}
          insight={selectedAction.insightId}
          onClose={() => setSelectedAction(null)}
          onApprove={handleApproveAction}
          onReject={handleRejectAction}
          loading={actionLoading}
        />
      )}
    </div>
  );
}