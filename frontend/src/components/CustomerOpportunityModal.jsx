import React, { useState } from "react";
import { submitPersonalizedOffer } from "../services/api";

export default function CustomerOpportunityModal({
  opportunity,
  merchantId,
  memberId,
  isOpen,
  onClose,
  onSubmitted,
}) {
  if (!isOpen || !opportunity) return null;

  const [activeTab, setActiveTab] = useState("rationale"); // 'rationale' | 'preview'
  const [offerTitle, setOfferTitle] = useState(opportunity.suggestedOffer?.title || "");
  const [message, setMessage] = useState(opportunity.suggestedOffer?.message || "");
  const [discount, setDiscount] = useState(opportunity.suggestedOffer?.discount || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const { customerSummary, rationale, suggestedOffer, customerName } = opportunity;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await submitPersonalizedOffer(merchantId, {
        customerId: opportunity.customerId,
        offerTitle,
        message,
        discount,
        channel: suggestedOffer?.channel || "WHATSAPP",
        memberId,
      });
      setSuccessMessage("Offer submitted! Sent to Store Manager for approval.");
      setTimeout(() => {
        if (onSubmitted) onSubmitted();
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.message || "Failed to submit personalized offer.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#002970] font-black text-sm">
              {customerName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900 leading-tight">
                Personalized Loyalty Opportunity: {customerName}
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                Grounded 1-to-1 Customer Offer Recommendation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-all text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Customer Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-6 py-3 bg-gray-50/80 border-b border-gray-100 text-xs">
          <div>
            <span className="text-gray-500 block font-medium">Lifetime Visits</span>
            <span className="text-sm font-black text-gray-900">{customerSummary?.visits || 12}</span>
          </div>
          <div>
            <span className="text-gray-500 block font-medium">Total Spend</span>
            <span className="text-sm font-black text-gray-900">₹{(customerSummary?.totalSpend || 8450).toLocaleString("en-IN")}</span>
          </div>
          <div>
            <span className="text-gray-500 block font-medium">Avg Order (AOV)</span>
            <span className="text-sm font-black text-gray-900">₹{Math.round(customerSummary?.aov || 704)}</span>
          </div>
          <div>
            <span className="text-gray-500 block font-medium">Last Visit</span>
            <span className="text-sm font-black text-rose-600">{customerSummary?.lastVisitDaysAgo || 10} days ago</span>
          </div>
        </div>

        {/* Tags */}
        <div className="px-6 py-2.5 bg-white border-b border-gray-100 flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-gray-400 mr-1">Tags:</span>
          {customerSummary?.segmentTags?.map((tag) => (
            <span
              key={tag}
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                tag === "AT RISK"
                  ? "bg-rose-50 text-rose-700 border-rose-200"
                  : tag === "LOYAL CUSTOMER"
                  ? "bg-purple-50 text-purple-700 border-purple-200"
                  : tag === "HIGH VALUE"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-blue-50 text-[#002970] border-blue-200"
              }`}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-gray-100 px-6 gap-4 text-xs font-bold pt-2">
          <button
            type="button"
            onClick={() => setActiveTab("rationale")}
            className={`pb-2 transition-all border-b-2 ${
              activeTab === "rationale"
                ? "border-[#002970] text-[#002970]"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            1. Grounded Rationales (AI Evidence)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`pb-2 transition-all border-b-2 ${
              activeTab === "preview"
                ? "border-[#002970] text-[#002970]"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            2. Prepare & Dispatch Offer
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-sm">
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-semibold text-xs flex items-center gap-2">
              <span className="text-base">✓</span>
              <span>{successMessage}</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl font-semibold text-xs flex items-center gap-2">
              <span className="text-base">⚠</span>
              <span>{error}</span>
            </div>
          )}

          {activeTab === "rationale" ? (
            <div className="space-y-3">
              <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl">
                <span className="text-xs font-black text-[#002970] uppercase tracking-wider block mb-1">
                  1. Why This Customer?
                </span>
                <p className="text-gray-700 leading-relaxed text-xs sm:text-sm">
                  {rationale?.whyThisCustomer}
                </p>
              </div>

              <div className="p-3.5 bg-amber-50/50 border border-amber-100 rounded-xl">
                <span className="text-xs font-black text-amber-800 uppercase tracking-wider block mb-1">
                  2. Why This Product? ({customerSummary?.favoriteProduct})
                </span>
                <p className="text-gray-700 leading-relaxed text-xs sm:text-sm">
                  {rationale?.whyThisProduct}
                </p>
              </div>

              <div className="p-3.5 bg-rose-50/50 border border-rose-100 rounded-xl">
                <span className="text-xs font-black text-rose-700 uppercase tracking-wider block mb-1">
                  3. Why Now? (Urgency: {opportunity.urgency})
                </span>
                <p className="text-gray-700 leading-relaxed text-xs sm:text-sm">
                  {rationale?.whyNow}
                </p>
              </div>

              <div className="p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                <span className="text-xs font-black text-emerald-800 uppercase tracking-wider block mb-1">
                  4. Why This Offer?
                </span>
                <p className="text-gray-700 leading-relaxed text-xs sm:text-sm">
                  {rationale?.whyThisOffer}
                </p>
              </div>

              <div className="pt-2 text-right">
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  className="px-4 py-2 bg-[#002970] text-white rounded-xl text-xs font-bold hover:bg-[#001f54] transition-all shadow-xs"
                >
                  Configure Offer Copy & Dispatch ›
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Offer Title / Internal Reference
                </label>
                <input
                  type="text"
                  value={offerTitle}
                  onChange={(e) => setOfferTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#002970] focus:border-transparent outline-hidden font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  WhatsApp Personal Message Copy
                </label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#002970] focus:border-transparent outline-hidden font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Discount Incentive
                  </label>
                  <input
                    type="text"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#002970] focus:border-transparent outline-hidden font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Target Channel
                  </label>
                  <select
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-xl bg-gray-50 text-gray-700 font-bold outline-hidden"
                    disabled
                  >
                    <option>WhatsApp (Direct 1-to-1)</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 text-xs text-gray-500">
                <span className="font-bold text-gray-700 block mb-0.5">Scientific Measurement Standard:</span>
                Outcomes will record observed return visits and spend within a 7-day measurement window without claiming unsubstantiated causation.
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveTab("rationale")}
                  className="text-xs font-bold text-gray-500 hover:text-gray-800"
                >
                  ‹ Back to Evidence
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-[#002970] text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-[#001f54] transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting ? "Submitting to Manager..." : "Submit to Manager for Approval ✓"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
