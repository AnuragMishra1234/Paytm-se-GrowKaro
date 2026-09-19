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

  // Simulate Customer Return (e.g. Rahul returning after 3 days and spending ₹420)
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-gray-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
                1-to-1 Customer Win-Back
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  isRedeemed
                    ? "bg-purple-100 text-purple-800"
                    : isSent
                    ? "bg-emerald-100 text-emerald-800"
                    : isRejected
                    ? "bg-red-100 text-red-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {currentOffer.status}
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-gray-900">
              Personalized Offer for {currentOffer.customerName}
            </h2>
            <p className="text-xs text-gray-500">
              Strictly individual offer · Never broadcasted to group lists
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center font-bold text-sm transition-colors"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
            {error}
          </div>
        )}

        {/* Customer Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
          <div>
            <span className="block text-[11px] font-medium text-gray-400 uppercase">
              Last Visit
            </span>
            <span className="text-sm font-extrabold text-red-600">
              {trigger.daysSinceLastPurchase || 17} days ago
            </span>
          </div>

          <div>
            <span className="block text-[11px] font-medium text-gray-400 uppercase">
              Normal Interval
            </span>
            <span className="text-sm font-extrabold text-gray-800">
              every {trigger.averageVisitGapDays || 5} days
            </span>
          </div>

          <div>
            <span className="block text-[11px] font-medium text-gray-400 uppercase">
              Total Visits
            </span>
            <span className="text-sm font-extrabold text-gray-800">
              {trigger.totalVisits || 14} visits
            </span>
          </div>

          <div>
            <span className="block text-[11px] font-medium text-gray-400 uppercase">
              Total Spend
            </span>
            <span className="text-sm font-extrabold text-[#002970]">
              ₹{(trigger.totalSpent || 3240).toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* AI Explanation & Context */}
        <div className="p-4 bg-sky-50/60 border border-sky-100 rounded-2xl space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#002970] uppercase">
            <span className="w-2 h-2 rounded-full bg-[#00baf2]" />
            <span>Why GrowKaro Noticed</span>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed font-normal">
            {currentOffer.reason}
          </p>
        </div>

        {/* Offer Sizing & Configuration */}
        <div className="border border-gray-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700 uppercase">
              Recommended Comeback Incentive
            </span>
            {isPending && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs font-semibold text-[#00baf2] hover:underline"
              >
                Change Amount
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {[50, 100, 150].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDiscountAmount(amt)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                      discountAmount === amt
                        ? "bg-[#002970] text-white border-[#002970]"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    ₹{amt} OFF
                  </button>
                ))}
              </div>
              <button
                onClick={handleSaveEdit}
                disabled={loading}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-emerald-50/70 border border-emerald-200 p-3 rounded-xl">
              <div>
                <span className="text-lg font-black text-emerald-800">
                  ₹{currentOffer.discountAmount} OFF
                </span>
                <span className="ml-2 text-xs text-emerald-700 font-medium">
                  Applicable on next {merchantName} order
                </span>
              </div>
              <span className="text-xs text-gray-500 font-medium">
                Valid until {expiryFormatted}
              </span>
            </div>
          )}
        </div>

        {/* Telegram 1-to-1 Message Preview */}
        <div className="border border-sky-200 bg-gradient-to-b from-sky-50/30 to-white rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-sky-900 font-bold">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00baf2]" />
              <span>Telegram 1-to-1 Message Preview</span>
            </div>
            <span className="text-[11px] text-gray-400 font-normal">
              Target: {currentOffer.customerName} only
            </span>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-sky-100 shadow-2xs font-mono text-xs text-gray-800 whitespace-pre-line leading-relaxed">
            {`Hi ${currentOffer.customerName} 👋

We haven't seen you at ${merchantName} recently.

Here's a little comeback treat:

₹${currentOffer.discountAmount} OFF your next ${merchantName} order.

Valid until ${expiryFormatted}.

Show this message when you visit.

— ${merchantName}`}
          </div>
        </div>

        {/* Outcome / Redemption Status Banner */}
        {isRedeemed && (
          <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 space-y-2">
            <div className="flex items-center justify-between text-purple-900 font-bold text-xs uppercase">
              <span>Verified Customer Return</span>
              <span className="px-2 py-0.5 bg-purple-200 text-purple-900 rounded-md">
                Measured Lift
              </span>
            </div>
            <p className="text-sm font-bold text-purple-950">
              {currentOffer.customerName} returned after {currentOffer.outcome?.daysUntilReturn || 3} days and spent ₹{(currentOffer.outcome?.returnSpend || 420).toLocaleString("en-IN")}.
            </p>
            <div className="text-xs text-purple-700 pt-1 border-t border-purple-200/60 flex items-center justify-between">
              <span>Net Revenue Lift: +₹{(currentOffer.outcome?.incrementalRevenue || 320).toLocaleString("en-IN")}</span>
              <span className="font-bold">Recorded in Cognee Memory</span>
            </div>
          </div>
        )}

        {/* Action Buttons & Simulation Controls */}
        <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
          {isPending && (
            <>
              {showRejectInput ? (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Reason for rejecting..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs w-56"
                  />
                  <button
                    onClick={handleReject}
                    disabled={loading}
                    className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700"
                  >
                    Confirm Reject
                  </button>
                  <button
                    onClick={() => setShowRejectInput(false)}
                    className="text-xs text-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowRejectInput(true)}
                  disabled={loading}
                  className="px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-full transition-colors"
                >
                  Reject Offer
                </button>
              )}

              <button
                onClick={handleApprove}
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold text-white bg-[#002970] hover:bg-[#001f54] transition-all shadow-md shadow-[#002970]/20"
              >
                <span>{loading ? "Authorizing..." : "Approve & Dispatch via Telegram"}</span>
                <span>›</span>
              </button>
            </>
          )}

          {isSent && (
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200">
              <div className="flex items-center gap-2 text-xs text-emerald-800 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Offer Dispatched to {currentOffer.customerName} via Telegram</span>
              </div>

              <button
                onClick={handleSimulateReturn}
                disabled={simulatingReturn}
                className="px-4 py-2 rounded-full text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 transition-all shadow-xs"
              >
                {simulatingReturn ? "Recording return..." : `Simulate ${currentOffer.customerName} Return (₹420)`}
              </button>
            </div>
          )}

          {(isRedeemed || isRejected) && (
            <button
              onClick={onClose}
              className="ml-auto px-5 py-2 rounded-full text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
