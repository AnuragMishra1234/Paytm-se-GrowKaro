import React, { useState, useEffect } from "react";

export function ActionReviewModal({ action, insight, onClose, onApprove, onReject, loading = false }) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(action?.title || "");
  const [channel, setChannel] = useState(action?.channel || "WHATSAPP");
  const [targetAudience, setTargetAudience] = useState(action?.targetAudience || "Repeat & nearby customers");
  const [timing, setTiming] = useState(action?.timing || "Immediate window");

  const [headline, setHeadline] = useState(action?.payload?.headline || "");
  const [body, setBody] = useState(action?.payload?.body || "");
  const [cta, setCta] = useState(action?.payload?.cta || "");
  const [offer, setOffer] = useState(action?.payload?.offer || "");

  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  useEffect(() => {
    if (action) {
      setTitle(action.title || "");
      setChannel(action.channel || "WHATSAPP");
      setTargetAudience(action.targetAudience || "Repeat & nearby customers");
      setTiming(action.timing || "Immediate window");
      setHeadline(action.payload?.headline || "");
      setBody(action.payload?.body || "");
      setCta(action.payload?.cta || "");
      setOffer(action.payload?.offer || "");
    }
  }, [action]);

  if (!action) return null;

  const isExecuted = action.approvalStatus === "APPROVED" && action.executionStatus === "SUCCESS";
  const isPending = action.approvalStatus === "PENDING";

  const handleApprove = () => {
    const finalPayload = {
      title,
      channel,
      targetAudience,
      timing,
      payload: {
        headline,
        body,
        cta,
        offer,
      },
    };
    onApprove(action._id, finalPayload);
  };

  const handleConfirmReject = () => {
    onReject(action._id, rejectionReason || "Merchant declined recommendation");
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 space-y-5 my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3.5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Review Action Proposal
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Merchant sign-off gate before dispatching automated customer outreach
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center font-bold text-sm"
          >
            ✕
          </button>
        </div>

        {/* Approval & Execution Status Pill */}
        <div className="flex items-center justify-between bg-slate-50 rounded-lg p-3 border border-slate-200/80 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-500">Approval State:</span>
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                action.approvalStatus === "APPROVED"
                  ? "badge-emerald"
                  : action.approvalStatus === "REJECTED"
                  ? "badge-rose"
                  : "badge-amber"
              }`}
            >
              {action.approvalStatus}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-500">Execution:</span>
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                action.executionStatus === "SUCCESS"
                  ? "badge-emerald"
                  : action.executionStatus === "RUNNING"
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : action.executionStatus === "FAILED"
                  ? "badge-rose"
                  : "badge-slate"
              }`}
            >
              {action.executionStatus}
            </span>
          </div>
        </div>

        {/* 1. Observation Context */}
        <div className="bg-amber-50/40 border border-amber-200/70 rounded-lg p-4 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-900 uppercase tracking-wider">
              Trigger Rationale
            </span>
            {insight?.category && (
              <span className="badge-slate font-mono text-[10px]">
                Priority: {insight.severity || "HIGH"}
              </span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-slate-900 leading-snug">
            {insight?.title || action.title}
          </h3>
          <p className="text-xs text-slate-700 leading-relaxed">
            {insight?.explanation || action.description}
          </p>
        </div>

        {/* 2. Grounded Evidence */}
        {insight?.evidence && insight.evidence.length > 0 && (
          <div className="bg-slate-50 rounded-lg p-4 space-y-2 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Observed Data Points
            </span>
            <ul className="space-y-1 text-xs text-slate-700">
              {insight.evidence.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-slate-400 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
              {insight.externalContext?.summary && (
                <li className="flex items-start gap-2 text-slate-900 font-medium">
                  <span className="text-slate-400 font-bold">•</span>
                  <span>Context: {insight.externalContext.summary}</span>
                </li>
              )}
            </ul>
          </div>
        )}

        {/* 3. Strategic Proposal */}
        <div className="bg-brand-50/40 border border-brand-200/60 rounded-lg p-4 space-y-1.5">
          <span className="text-[11px] font-semibold text-brand-900 uppercase tracking-wider block">
            Recommended Action
          </span>
          <p className="text-sm font-semibold text-slate-900">
            {insight?.recommendation?.action || "Launch Afternoon Promotion"}
          </p>
          <p className="text-xs text-slate-600 leading-relaxed">
            <strong className="text-slate-800">Objective:</strong> {insight?.recommendation?.goal || "Recover quiet hours footfall and stabilize mid-day revenue."}
          </p>
        </div>

        {/* 4. Action Configuration & Copy */}
        <div className="space-y-3 bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
              Outreach Configuration
            </span>
            {isPending && (
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className="text-xs font-semibold text-brand-700 hover:text-brand-800 hover:underline"
              >
                {isEditing ? "Done Editing" : "Edit Message"}
              </button>
            )}
          </div>

          {/* Configuration Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div>
              <label className="text-[11px] font-medium text-slate-500 block mb-1">Channel</label>
              {isEditing ? (
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  className="input-text text-xs py-1.5 w-full bg-white"
                >
                  <option value="WHATSAPP">WhatsApp Business</option>
                  <option value="SMS">SMS Broadcast</option>
                  <option value="NOTIFICATION">Push Notification</option>
                  <option value="IN_STORE_DISPLAY">In-Store Display</option>
                </select>
              ) : (
                <div className="p-2 bg-slate-50 border border-slate-200 rounded text-xs font-medium text-slate-800">
                  {channel === "WHATSAPP" ? "WhatsApp Business" : channel}
                </div>
              )}
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-500 block mb-1">Audience</label>
              {isEditing ? (
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="input-text text-xs py-1.5 w-full"
                />
              ) : (
                <div className="p-2 bg-slate-50 border border-slate-200 rounded text-xs font-medium text-slate-800 truncate">
                  {targetAudience}
                </div>
              )}
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-500 block mb-1">Timing Window</label>
              {isEditing ? (
                <input
                  type="text"
                  value={timing}
                  onChange={(e) => setTiming(e.target.value)}
                  className="input-text text-xs py-1.5 w-full"
                />
              ) : (
                <div className="p-2 bg-slate-50 border border-slate-200 rounded text-xs font-medium text-slate-800">
                  {timing}
                </div>
              )}
            </div>
          </div>

          {/* Editable Copy or Channel Mockup */}
          {isEditing ? (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div>
                <label className="text-[11px] font-medium text-slate-700 block mb-1">Headline</label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="input-text text-xs py-1.5 w-full font-semibold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-700 block mb-1">Offer Tag</label>
                  <input
                    type="text"
                    value={offer}
                    onChange={(e) => setOffer(e.target.value)}
                    className="input-text text-xs py-1.5 w-full font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-700 block mb-1">Call to Action</label>
                  <input
                    type="text"
                    value={cta}
                    onChange={(e) => setCta(e.target.value)}
                    className="input-text text-xs py-1.5 w-full"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-700 block mb-1">Message Body</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={3}
                  className="input-text text-xs py-1.5 w-full leading-relaxed"
                />
              </div>
            </div>
          ) : (
            <div className="pt-2">
              <label className="text-[11px] font-medium text-slate-500 block mb-1">
                Notification Preview ({channel})
              </label>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-200/60 pb-1.5">
                  <span className="font-semibold text-slate-800">Direct Broadcast</span>
                  <span className="font-mono text-[11px]">{timing}</span>
                </div>
                <p className="font-semibold text-slate-900 text-sm">
                  {headline || action.title}
                </p>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{body}</p>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                  <span className="badge-slate font-mono text-[10px]">
                    {offer || "Special Incentive"}
                  </span>
                  <span className="font-medium text-brand-700">{cta}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Clean Execution Result (if already completed) */}
        {isExecuted && (
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-lg p-4 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-slate-900">
                Campaign Executed via n8n
              </p>
              <span className="badge-emerald font-mono text-[10px]">
                CONFIRMED
              </span>
            </div>
            <p className="text-slate-600">
              Delivered to <strong>{action.executionResult?.deliveryStats?.estimatedAudience || 25} customers</strong> via {action.channel}.
            </p>
          </div>
        )}

        {/* Rejection input drawer */}
        {showRejectInput && (
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-3.5 space-y-2 text-xs">
            <label className="font-semibold text-rose-900 block">Reason for declining this recommendation:</label>
            <input
              type="text"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Stock low, promotion not aligned with strategy..."
              className="input-text text-xs py-1.5 w-full bg-white"
            />
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowRejectInput(false)}
                className="btn-secondary text-xs px-3 py-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="btn-danger text-xs px-3 py-1"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div>
            {isPending && !showRejectInput && (
              <button
                type="button"
                onClick={() => setShowRejectInput(true)}
                disabled={loading}
                className="btn-ghost text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1.5"
              >
                Decline
              </button>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs px-3.5 py-1.5"
            >
              {isExecuted ? "Close" : "Cancel"}
            </button>
            {isPending && (
              <button
                type="button"
                onClick={handleApprove}
                disabled={loading}
                className="btn-primary text-xs font-semibold px-4 py-2 flex items-center gap-1.5 shadow-sm"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Executing...</span>
                  </>
                ) : (
                  <>
                    <span>Approve &amp; Launch</span>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}