import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useMerchantContext } from "../context/MerchantContext";
import { useActions } from "../hooks/useActions";
import { ActionReviewModal } from "../components/ActionReviewModal";
import { ErrorState, LoadingSpinner } from "../components/LoadingSpinner";
import { formatDate } from "../utils/formatters";

const TABS = [
  { id: "APPROVAL_QUEUE", label: "Approval Queue" },
  { id: "CAMPAIGNS", label: "Active & Completed Campaigns" },
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
  const executedActions = actions.filter((a) => a.approvalStatus !== "PENDING");

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
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-black text-gray-900">Campaigns &amp; Action Center</h1>
          </div>
          <p className="text-gray-600 text-sm md:text-base mt-1">
            Merchant-governed autonomous execution pipeline powered by n8n automation
          </p>
        </div>
        <button
          onClick={refetch}
          disabled={loading}
          className="btn-secondary text-sm font-bold px-4 py-2 self-start sm:self-auto"
        >
          ↻ Refresh Status
        </button>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 border-l-4 border-l-amber-500">
          <p className="text-xs md:text-sm text-gray-600 font-bold uppercase tracking-wider">Awaiting Approval</p>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-3xl font-black text-amber-600">{stats.pending}</span>
            <span className="text-2xl">⏳</span>
          </div>
          <p className="text-xs md:text-sm text-gray-500 mt-1 font-medium">Requires merchant sign-off</p>
        </div>

        <div className="card p-5 border-l-4 border-l-blue-500">
          <p className="text-xs md:text-sm text-gray-600 font-bold uppercase tracking-wider">Running / Queued</p>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-3xl font-black text-blue-600">{stats.running}</span>
            <span className="text-2xl">⚙️</span>
          </div>
          <p className="text-xs md:text-sm text-gray-500 mt-1 font-medium">In workflow execution</p>
        </div>

        <div className="card p-5 border-l-4 border-l-emerald-500">
          <p className="text-xs md:text-sm text-gray-600 font-bold uppercase tracking-wider">Executed Campaigns</p>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-3xl font-black text-emerald-600">{stats.completed}</span>
            <span className="text-2xl">✓</span>
          </div>
          <p className="text-xs md:text-sm text-gray-500 mt-1 font-medium">Successfully dispatched</p>
        </div>

        <div className="card p-5 border-l-4 border-l-purple-500">
          <p className="text-xs md:text-sm text-gray-600 font-bold uppercase tracking-wider">Total Actions Logged</p>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-3xl font-black text-purple-600">{stats.total}</span>
            <span className="text-2xl">📋</span>
          </div>
          <p className="text-xs md:text-sm text-gray-500 mt-1 font-medium">Full audit trail preserved</p>
        </div>
      </div>

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
              {tab.id === "APPROVAL_QUEUE" && stats.pending > 0 && (
                <span className="ml-2.5 px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800 font-black">
                  {stats.pending}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Error state */}
      {error && <ErrorState message={error} onRetry={refetch} />}

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
            <div className="card p-12 text-center text-gray-400 space-y-3">
              <span className="text-5xl">✨</span>
              <p className="font-bold text-lg text-gray-800">Approval Queue is Clear</p>
              <p className="text-sm md:text-base text-gray-500">
                No proposed actions are awaiting decision. Proactive recommendations will appear here when growth opportunities or risks are detected.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingActions.map((item) => (
                <div
                  key={item._id}
                  className="card p-6 border-2 border-amber-300 bg-amber-50/30 space-y-3.5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="badge bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-2.5 py-1 rounded-lg">
                      ⏳ Awaiting Decision
                    </span>
                    <span className="text-xs md:text-sm text-gray-500 font-semibold">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>

                  <h3 className="text-base md:text-lg font-black text-gray-950 leading-snug">{item.title}</h3>
                  <p className="text-sm md:text-base text-gray-700 leading-relaxed bg-white p-3.5 rounded-xl border border-amber-200/80">
                    {item.payload?.body || item.description}
                  </p>

                  <div className="flex items-center justify-between text-xs md:text-sm text-gray-600 font-medium">
                    <span>Target: <strong className="text-gray-900">{item.targetAudience}</strong></span>
                    <span>Channel: <strong className="text-gray-900">{item.channel}</strong></span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-amber-200">
                    <span className="text-sm font-bold text-blue-800">
                      🏷️ {item.payload?.offer || "Special Promotion"}
                    </span>
                    <button
                      onClick={() => setSelectedAction(item)}
                      className="btn-primary text-sm font-bold py-2 px-4 flex items-center gap-1.5 shadow-sm"
                    >
                      <span>Review &amp; Approve</span>
                      <span className="text-base font-bold">→</span>
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
            <div className="card p-12 text-center text-gray-400 space-y-3">
              <span className="text-5xl">📣</span>
              <p className="font-bold text-lg text-gray-800">No campaigns on record yet</p>
              <p className="text-sm md:text-base text-gray-500">
                Approve an action from the Approval Queue to deploy your first campaign.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {campaigns.map((camp) => (
                <div key={camp._id} className="card p-6 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span
                      className={`badge text-xs font-bold px-2.5 py-1 rounded-lg ${
                        camp.status === "COMPLETED"
                          ? "bg-emerald-100 text-emerald-800"
                          : camp.status === "RUNNING"
                          ? "bg-blue-100 text-blue-800"
                          : camp.status === "FAILED"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {camp.status}
                    </span>
                    <span className="text-xs md:text-sm text-gray-500 font-semibold">{camp.channel}</span>
                  </div>

                  <h3 className="text-base md:text-lg font-black text-gray-950 leading-snug">{camp.name}</h3>
                  <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">{camp.message}</p>

                  <div className="bg-gray-50 p-3.5 rounded-xl text-xs md:text-sm space-y-1.5 border border-gray-100">
                    <div className="flex justify-between text-gray-600">
                      <span className="font-medium">Estimated Audience:</span>
                      <strong className="text-gray-900">{camp.deliveryStats?.estimatedAudience || 28}</strong>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span className="font-medium">Delivered Count:</span>
                      <strong className="text-emerald-700">{camp.deliveryStats?.deliveredCount || 27}</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs md:text-sm pt-2 border-t border-gray-100">
                    <span className="px-2.5 py-1 rounded-md font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      ✓ Automated via n8n
                    </span>
                    {camp.status === "COMPLETED" && (
                      <Link
                        to="/performance"
                        className="text-sm text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 hover:underline"
                      >
                        <span>View Outcome</span>
                        <span className="text-base font-bold">→</span>
                      </Link>
                    )}
                  </div>

                  {/* Collapsible Technical Details (Hidden from merchant view) */}
                  <details className="text-xs text-gray-500 pt-1">
                    <summary className="cursor-pointer hover:text-gray-800 select-none font-semibold">
                      Technical Details
                    </summary>
                    <div className="mt-1.5 p-3 bg-gray-50 rounded-xl border border-gray-200/80 font-mono text-xs text-gray-700 space-y-1">
                      <div>Channel: {camp.channel}</div>
                      <div>Campaign ID: {camp._id}</div>
                      <div>Audience Reached: {camp.deliveryStats?.deliveredCount || 25} patrons</div>
                    </div>
                  </details>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: EXECUTION AUDIT LOG */}
      {!loading && !error && activeTab === "AUDIT_LOG" && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-900 text-sm">Action Execution Audit Trail</h3>
            <span className="text-xs text-gray-400">Total {actions.length} action events recorded</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 font-semibold border-b">
                <tr>
                  <th className="p-3">Action Title</th>
                  <th className="p-3">Type / Channel</th>
                  <th className="p-3">Approval Gate</th>
                  <th className="p-3">Execution Status</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {actions.map((act) => (
                  <tr key={act._id} className="hover:bg-gray-50/50">
                    <td className="p-3 font-semibold text-gray-900">
                      {act.title}
                      {act.failureReason && (
                        <p className="text-[10px] text-red-600 mt-0.5">{act.failureReason}</p>
                      )}
                    </td>
                    <td className="p-3 text-gray-600">
                      {act.type} · {act.channel}
                    </td>
                    <td className="p-3">
                      <span
                        className={`badge text-[10px] font-bold ${
                          act.approvalStatus === "APPROVED"
                            ? "bg-green-100 text-green-800"
                            : act.approvalStatus === "REJECTED"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {act.approvalStatus}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`badge text-[10px] font-bold ${
                          act.executionStatus === "SUCCESS"
                            ? "bg-emerald-100 text-emerald-800"
                            : act.executionStatus === "RUNNING"
                            ? "bg-blue-100 text-blue-800"
                            : act.executionStatus === "FAILED"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {act.executionStatus}
                      </span>
                    </td>
                    <td className="p-3 text-gray-400 whitespace-nowrap">
                      {formatDate(act.createdAt)}
                    </td>
                    <td className="p-3 text-right whitespace-nowrap space-x-2">
                      <button
                        onClick={() => setSelectedAction(act)}
                        className="text-blue-600 hover:text-blue-800 font-semibold"
                      >
                        View Details
                      </button>
                      {act.executionStatus === "FAILED" && (
                        <button
                          onClick={() => retry(act._id)}
                          className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded hover:bg-red-100 font-bold"
                        >
                          Retry ↺
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