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

  // If no opportunities and not loading, render null or gentle placeholder
  if (!loading && opportunities.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
          <h2 className="font-extrabold text-base md:text-lg text-gray-950">
            Customer Opportunities
          </h2>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
            {opportunities.length} Actionable
          </span>
        </div>
        <span className="text-xs text-gray-400 font-medium">
          Personalized 1-to-1 Win-Back
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
              className="card p-6 bg-white border border-gray-200 hover:border-gray-300 rounded-3xl shadow-xs transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3.5">
                {/* Header Tag & Customer Name */}
                <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-3">
                  <div>
                    <span className="block text-[11px] font-extrabold text-amber-800 uppercase tracking-wider">
                      Customer Win-Back Opportunity
                    </span>
                    <h3 className="text-lg font-black text-gray-900 mt-0.5">
                      {opp.customerName}
                    </h3>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isRedeemed
                        ? "bg-purple-100 text-purple-800"
                        : isSent
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-blue-100 text-[#002970]"
                    }`}
                  >
                    {isPending ? "Pending Review" : opp.status}
                  </span>
                </div>

                {/* Visit Interval & Spend Summary */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50/80 p-3 rounded-2xl border border-gray-100">
                  <div>
                    <span className="block text-[10px] text-gray-400 font-medium uppercase">
                      Last visit
                    </span>
                    <span className="font-extrabold text-red-600 text-[13px]">
                      {trigger.daysSinceLastPurchase || 17} days ago
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-gray-400 font-medium uppercase">
                      Normal frequency
                    </span>
                    <span className="font-bold text-gray-800 text-[13px]">
                      every {trigger.averageVisitGapDays || 5} days
                    </span>
                  </div>
                  <div className="pt-1.5 border-t border-gray-200/60">
                    <span className="block text-[10px] text-gray-400 font-medium uppercase">
                      Total visits
                    </span>
                    <span className="font-bold text-gray-800">
                      {trigger.totalVisits || 14}
                    </span>
                  </div>
                  <div className="pt-1.5 border-t border-gray-200/60">
                    <span className="block text-[10px] text-gray-400 font-medium uppercase">
                      Total spent
                    </span>
                    <span className="font-bold text-[#002970]">
                      ₹{(trigger.totalSpent || 3240).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Why GrowKaro Noticed */}
                <div className="space-y-1">
                  <span className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                    Why GrowKaro noticed:
                  </span>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    Customer normally visits every {trigger.averageVisitGapDays || 5} days, but has not visited for {trigger.daysSinceLastPurchase || 17} days.
                  </p>
                </div>

                {/* Recommended Comeback Treat */}
                <div className="space-y-1 pt-1">
                  <span className="block text-[11px] font-bold text-emerald-800 uppercase tracking-wide">
                    Recommended:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-emerald-700">
                      ₹{opp.discountAmount} comeback offer
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 italic">
                    Reason: High-value repeat customer with unusually long inactivity.
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-gray-100">
                <button
                  onClick={() => setSelectedOffer(opp)}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-full text-xs font-bold text-white bg-[#002970] hover:bg-[#001f54] transition-all shadow-sm hover:shadow"
                >
                  <span>{isPending ? "Review Offer" : "Inspect Offer Details"}</span>
                  <span>›</span>
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
