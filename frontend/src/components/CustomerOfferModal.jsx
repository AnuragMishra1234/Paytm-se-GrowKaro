import React, { useState } from "react";
import {
  approveCustomerOffer,
  rejectCustomerOffer,
  editCustomerOffer,
  recordCustomerOfferOutcome,
} from "../services/api";

/**
 * CustomerOfferModal.jsx
 *
 * Merchant Review & Approval Modal for 1-to-1 Customer Win-Back Offers.
 *
 * Strict targeting: Tied exclusively to one customer (e.g. Rahul).
 * Enforces mandatory merchant sign-off before dispatch.
 * Includes interactive simulation trigger for customer return & outcome measurement.
 */
export default function CustomerOfferModal({
  offer,
  merchantId,
  merchantName = "Cafe Aroma",
  onClose,
  onOfferUpdated,
}) {
  const [currentOffer, setCurrentOffer] = useState(offer);
  const [discountAmount, setDiscountAmount] = useState(offer?.discountAmount || 100);
  const [isEditing, setIsEditing] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [simulatingReturn, setSimulatingReturn] = useState(false);
  const [outcomeResult, setOutcomeResult] = useState(null);
  const [error, setError] = useState(null);

  if (!currentOffer) return null;

  const trigger = currentOffer.trigger || {};
  const isApproved = currentOffer.status === "APPROVED";
  const isSent = currentOffer.status === "SENT";
  const isRedeemed = currentOffer.status === "REDEEMED";
  const isRejected = currentOffer.status === "REJECTED";
  const isPending = currentOffer.status === "PENDING_APPROVAL" || currentOffer.status === "DRAFT";

  // Handle Approve & Dispatch
  const handleApprove = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await approveCustomerOffer(currentOffer.offerId, merchantId);
      setCurrentOffer(res.data);
      if (onOfferUpdated) onOfferUpdated(res.data);
    } catch (err) {
      setError(err.message || "Failed to approve offer");
    } finally {
      setLoading(false);
    }
  };

  // Handle Reject
  const handleReject = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await rejectCustomerOffer(
        currentOffer.offerId,
        merchantId,
        rejectReason || "Merchant declined opportunity"
      );
      setCurrentOffer(res.data);
      if (onOfferUpdated) onOfferUpdated(res.data);
    } catch (err) {
      setError(err.message || "Failed to reject offer");
    } finally {
      setLoading(false);
    }
  };

  // Handle Edit Amount
  const handleSaveEdit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await editCustomerOffer(currentOffer.offerId, merchantId, {
        discountAmount: Number(discountAmount),
      });
      setCurrentOffer(res.data);
      setIsEditing(false);
      if (onOfferUpdated) onOfferUpdated(res.data);
    } catch (err) {
      setError(err.message || "Failed to update offer");
    } finally {
      setLoading(false);
    }
  };

  // Simulate Customer Return
  const handleSimulateReturn = async () => {
    setSimulatingReturn(true);
    setError(null);
    try {
      const res = await recordCustomerOfferOutcome(currentOffer.offerId, {
        returnSpend: 420,
        daysUntilReturn: 3,
      });
      setCurrentOffer(res.data.offer);
      setOutcomeResult(res.data);
      if (onOfferUpdated) onOfferUpdated(res.data.offer);
    } catch (err) {
      setError(err.message || "Failed to record return outcome");
    } finally {
      setSimulatingReturn(false);
    }
  };

  const expiryFormatted = currentOffer.expiresAt
    ? new Date(currentOffer.expiresAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "7 days";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-xl p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="badge-amber font-mono text-[11px]">
                1-to-1 Customer Win-Back
              </span>
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                  isRedeemed
                    ? "bg-purple-50 text-purple-800 border border-purple-200"
                    : isSent
                    ? "badge-emerald"
                    : isRejected
                    ? "badge-rose"
                    : "badge-slate"
                }`}
              >
                {currentOffer.status}
              </span>
            </div>
            <h2 className="text-base font-semibold text-slate-900">
              Personalized Offer for {currentOffer.customerName}
            </h2>
            <p className="text-xs text-slate-500">
              Strictly individual offer · Governed merchant review
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center font-bold text-sm transition-colors"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
            {error}
          </div>
        )}

        {/* Customer Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-100">
          <div>
            <span className="block text-[10px] font-medium text-slate-400 uppercase">
              Last Visit
            </span>
            <span className="text-xs font-mono font-semibold text-rose-600">
              {trigger.daysSinceLastPurchase || 17} days ago
            </span>
          </div>

          <div>
            <span className="block text-[10px] font-medium text-slate-400 uppercase">
              Normal Interval
            </span>
            <span className="text-xs font-mono font-semibold text-slate-800">
              every {trigger.averageVisitGapDays || 5} days
            </span>
          </div>

          <div>
            <span className="block text-[10px] font-medium text-slate-400 uppercase">
              Total Visits
            </span>
            <span className="text-xs font-mono font-semibold text-slate-800">
              {trigger.totalVisits || 14} visits
            </span>
          </div>

          <div>
            <span className="block text-[10px] font-medium text-slate-400 uppercase">
              Total Spend
            </span>
            <span className="text-xs font-mono font-semibold text-slate-900">
              ₹{(trigger.totalSpent || 3240).toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* AI Observation & Context */}
        <div className="p-3.5 bg-brand-50/40 border border-brand-200/60 rounded-lg space-y-1">
          <div className="text-[11px] font-semibold text-brand-900 uppercase tracking-wider">
            Observation Rationale
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            {currentOffer.reason}
          </p>
        </div>

        {/* Offer Sizing & Configuration */}
        <div className="border border-slate-200 rounded-lg p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Recommended Comeback Incentive
            </span>
            {isPending && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs font-medium text-brand-700 hover:text-brand-800 hover:underline"
              >
                Change Amount
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                {[50, 100, 150].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDiscountAmount(amt)}
                    className={`px-2.5 py-1 rounded text-xs font-mono font-medium border ${
                      discountAmount === amt
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    ₹{amt} OFF
                  </button>
                ))}
              </div>
              <button
                onClick={handleSaveEdit}
                disabled={loading}
                className="btn-primary text-xs py-1 px-2.5 shadow-sm"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="text-xs text-slate-400 hover:text-slate-600 px-1"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-emerald-50/60 border border-emerald-200/70 p-3 rounded-lg">
              <div>
                <span className="text-sm font-semibold font-mono text-emerald-800">
                  ₹{currentOffer.discountAmount} OFF
                </span>
                <span className="ml-2 text-xs text-emerald-700">
                  Applicable on next {merchantName} purchase
                </span>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                Valid until {expiryFormatted}
              </span>
            </div>
          )}
        </div>

        {/* Telegram 1-to-1 Message Preview */}
        <div className="border border-slate-200 bg-slate-50/50 rounded-lg p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-700 font-semibold">
            <span>Direct Notification Preview</span>
            <span className="text-[11px] text-slate-400 font-normal">
              Target: {currentOffer.customerName} only
            </span>
          </div>

          <div className="p-3 bg-white rounded-md border border-slate-200/80 font-mono text-xs text-slate-800 whitespace-pre-line leading-relaxed">
            {`Hi ${currentOffer.customerName},

We haven't seen you at ${merchantName} recently.

Here's a little comeback treat:

₹${currentOffer.discountAmount} OFF your next ${merchantName} visit.

Valid until ${expiryFormatted}.

Show this note when you visit.

— ${merchantName}`}
          </div>
        </div>

        {/* Outcome / Redemption Status Banner */}
        {isRedeemed && (
          <div className="p-3.5 rounded-lg bg-purple-50/60 border border-purple-200 space-y-1.5">
            <div className="flex items-center justify-between text-purple-900 font-semibold text-xs uppercase tracking-wider">
              <span>Verified Customer Return</span>
              <span className="badge-purple font-mono text-[10px]">
                Measured
              </span>
            </div>
            <p className="text-xs font-semibold text-purple-950">
              {currentOffer.customerName} returned after {currentOffer.outcome?.daysUntilReturn || 3} days and spent ₹{(currentOffer.outcome?.returnSpend || 420).toLocaleString("en-IN")}.
            </p>
            <div className="text-[11px] text-purple-700 pt-1 border-t border-purple-200/60 flex items-center justify-between font-mono">
              <span>Net Lift: +₹{(currentOffer.outcome?.incrementalRevenue || 320).toLocaleString("en-IN")}</span>
              <span>Logged to Store Memory</span>
            </div>
          </div>
        )}

        {/* Action Buttons & Simulation Controls */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          {isPending && (
            <>
              {showRejectInput ? (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Reason for rejecting..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="input-text text-xs py-1.5 px-3 w-56"
                  />
                  <button
                    onClick={handleReject}
                    disabled={loading}
                    className="btn-danger text-xs py-1.5 px-3"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setShowRejectInput(false)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowRejectInput(true)}
                  disabled={loading}
                  className="btn-ghost text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                >
                  Reject Offer
                </button>
              )}

              <button
                onClick={handleApprove}
                disabled={loading}
                className="btn-primary text-xs font-semibold py-2 px-4 inline-flex items-center gap-1.5 shadow-sm ml-auto"
              >
                <span>{loading ? "Authorizing..." : "Approve & Dispatch"}</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {isSent && (
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 bg-emerald-50/60 p-3 rounded-lg border border-emerald-200">
              <div className="flex items-center gap-2 text-xs text-emerald-800 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Offer Dispatched to {currentOffer.customerName} via Direct Message</span>
              </div>

              <button
                onClick={handleSimulateReturn}
                disabled={simulatingReturn}
                className="text-xs font-semibold py-1.5 px-3 rounded-md bg-purple-700 hover:bg-purple-800 text-white transition-colors shadow-2xs"
              >
                {simulatingReturn ? "Recording return..." : `Simulate ${currentOffer.customerName} Return (₹420)`}
              </button>
            </div>
          )}

          {(isRedeemed || isRejected) && (
            <button
              onClick={onClose}
              className="btn-secondary text-xs px-4 py-1.5 ml-auto"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
