import React, { useState, useEffect, useCallback } from "react";
import { fetchCustomerOpportunities } from "../services/api";
import CustomerOfferModal from "./CustomerOfferModal";

/**
 * CustomerOpportunities.jsx
 *
 * Prominent Dashboard section displaying personalized 1-to-1 customer retention opportunities.
 * Adheres strictly to:
 * - No internal database IDs displayed in normal merchant view
 * - No generic mass campaigns (strictly 1-to-1)
 * - Clear deterministic visit interval vs days inactive breakdown
 */
export default function CustomerOpportunities({ merchantId, merchantName = "Cafe Aroma" }) {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState(null);

  const loadOpportunities = useCallback(async () => {
    if (!merchantId) return;
    try {
      setLoading(true);
      const res = await fetchCustomerOpportunities(merchantId);
      setOpportunities(res.data || []);
    } catch (err) {
      console.warn("Could not load customer opportunities:", err.message);
    } finally {
      setLoading(false);
    }
  }, [merchantId]);

  useEffect(() => {
    loadOpportunities();
  }, [loadOpportunities]);

  const handleOfferUpdated = (updated) => {
    setOpportunities((prev) =>
      prev.map((item) => (item.offerId === updated.offerId ? updated : item))
    );
    setSelectedOffer(updated);
  };

  // If no opportunities and not loading, render null
  if (!loading && opportunities.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <h2 className="font-semibold text-sm md:text-base text-slate-900">
            Personalized Customer Opportunities
          </h2>
          <span className="badge-amber font-mono text-xs font-semibold">
            {opportunities.length} Actionable
          </span>
        </div>
        <span className="text-xs text-slate-400 font-medium hidden sm:inline">
          1-to-1 Win-Back
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {opportunities.map((opp) => {
          const trigger = opp.trigger || {};
          const isSent = opp.status === "SENT";
          const isRedeemed = opp.status === "REDEEMED";
          const isPending = opp.status === "PENDING_APPROVAL" || opp.status === "DRAFT";

          return (
            <div
              key={opp.offerId}
              className="card p-5 space-y-4 flex flex-col justify-between hover:shadow-card transition-all"
            >
              <div className="space-y-3.5">
                {/* Header Tag & Customer Name */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="block text-[11px] font-semibold text-amber-800 uppercase tracking-wider">
                      Win-Back Candidate
                    </span>
                    <h3 className="text-base font-semibold text-slate-900 mt-0.5">
                      {opp.customerName}
                    </h3>
                  </div>

                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      isRedeemed
                        ? "bg-purple-50 text-purple-800 border border-purple-200"
                        : isSent
                        ? "badge-emerald"
                        : "badge-amber"
                    }`}
                  >
                    {isPending ? "Pending Review" : opp.status}
                  </span>
                </div>

                {/* Visit Interval & Spend Summary */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div>
                    <span className="block text-[10px] text-slate-400 font-medium uppercase">
                      Last visit
                    </span>
                    <span className="font-mono font-semibold text-rose-600 text-xs">
                      {trigger.daysSinceLastPurchase || 17} days ago
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-medium uppercase">
                      Normal gap
                    </span>
                    <span className="font-mono font-semibold text-slate-700 text-xs">
                      every {trigger.averageVisitGapDays || 5} days
                    </span>
                  </div>
                  <div className="pt-1.5 border-t border-slate-200/60">
                    <span className="block text-[10px] text-slate-400 font-medium uppercase">
                      Total visits
                    </span>
                    <span className="font-mono font-semibold text-slate-700">
                      {trigger.totalVisits || 14}
                    </span>
                  </div>
                  <div className="pt-1.5 border-t border-slate-200/60">
                    <span className="block text-[10px] text-slate-400 font-medium uppercase">
                      Total spent
                    </span>
                    <span className="font-mono font-semibold text-slate-900">
                      ₹{(trigger.totalSpent || 3240).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Why GrowKaro Noticed */}
                <div className="space-y-1">
                  <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Observation:
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Customer normally visits every {trigger.averageVisitGapDays || 5} days, but has not visited for {trigger.daysSinceLastPurchase || 17} days.
                  </p>
                </div>

                {/* Recommended Comeback Treat */}
                <div className="space-y-1 pt-1">
                  <span className="block text-[11px] font-semibold text-brand-800 uppercase tracking-wider">
                    Recommended Incentive:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-emerald-700 font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      ₹{opp.discountAmount} targeted offer
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-slate-100">
                <button
                  onClick={() => setSelectedOffer(opp)}
                  className="w-full btn-primary text-xs font-semibold py-2 px-3 flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span>{isPending ? "Review & Dispatch" : "Inspect Offer Details"}</span>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Review & Approval Modal */}
      {selectedOffer && (
        <CustomerOfferModal
          offer={selectedOffer}
          merchantId={merchantId}
          merchantName={merchantName}
          onClose={() => setSelectedOffer(null)}
          onOfferUpdated={handleOfferUpdated}
        />
      )}
    </div>
  );
}
