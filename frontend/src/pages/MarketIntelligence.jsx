import React, { useState, useEffect } from "react";
import { useMerchantContext } from "../context/MerchantContext";
import {
  fetchMarketIntelligence,
  refreshMarketIntelligence,
  adoptMarketRecommendation,
} from "../services/api";
import {
  Globe,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Radio,
  BarChart3,
  Lightbulb,
  Zap,
} from "lucide-react";

export default function MarketIntelligence() {
  const { merchant } = useMerchantContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [adoptingId, setAdoptingId] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [activeFilter, setActiveFilter] = useState("ALL"); // 'ALL' | 'TRENDS' | 'SALES'

  const loadData = async (isRefresh = false) => {
    if (!merchant?._id) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = isRefresh
        ? await refreshMarketIntelligence(merchant._id)
        : await fetchMarketIntelligence(merchant._id);

      if (res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error("Failed to load market intelligence:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(false);
  }, [merchant?._id]);

  const handleAdopt = async (suggestion) => {
    if (!merchant?._id || !suggestion?.id) return;
    setAdoptingId(suggestion.id);
    setFeedback(null);

    try {
      const res = await adoptMarketRecommendation(merchant._id, suggestion.id);
      setFeedback({
        type: "success",
        message: res.message || `Successfully adopted recommendation "${suggestion.title}".`,
      });
      // Refresh market view to reflect adopted product/campaign
      await loadData(true);
      setTimeout(() => setFeedback(null), 6000);
    } catch (err) {
      console.error("Adoption failed:", err);
      setFeedback({
        type: "error",
        message: err.message || "Failed to adopt recommendation.",
      });
    } finally {
      setAdoptingId(null);
    }
  };

  const suggestions = data?.suggestions || [];
  const filteredSuggestions = suggestions.filter((s) => {
    if (activeFilter === "TRENDS") return s.type === "MARKET_EXPANSION" || s.type === "ADDON_UPCHARGE";
    if (activeFilter === "SALES") return s.type === "SALES_SLUMP_RECOVERY" || s.type === "ATTACH_RATE_IMPROVEMENT";
    return true;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-950 tracking-tight">
              Market &amp; Sales AI Intelligence
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-black rounded-full border border-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              LIVE MARKET SCAN ACTIVE
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Autonomous daily radar analyzing regional cafe trends &amp; your store's hourly sales to recommend high-impact moves
          </p>
        </div>

        <button
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="btn-primary text-xs sm:text-sm font-bold py-2.5 px-4 flex items-center gap-2 shadow-2xs self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          <span>{refreshing ? "Scanning Market & Sales..." : "Refresh Market Scan"}</span>
        </button>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-sm font-bold flex items-center justify-between gap-3 animate-in fade-in duration-200 ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-300"
              : "bg-rose-50 text-rose-900 border-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-xs underline opacity-70 hover:opacity-100">
            Dismiss
          </button>
        </div>
      )}

      {/* Market Scanning Context Card */}
      {data?.marketOverview && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-4 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 border border-blue-200 space-y-1">
            <div className="text-xs font-black uppercase text-blue-900 tracking-wider">
              Locality Monitored
            </div>
            <div className="text-base font-black text-gray-950">
              {data.marketOverview.locality}
            </div>
            <div className="text-xs text-blue-700 font-medium">
              Regional specialty cafe &amp; beverage demographic
            </div>
          </div>

          <div className="card p-4 bg-gradient-to-br from-emerald-50/80 to-teal-50/80 border border-emerald-200 space-y-1">
            <div className="text-xs font-black uppercase text-emerald-900 tracking-wider">
              Top Trending Item
            </div>
            <div className="text-base font-black text-gray-950">
              {data.marketOverview.hottestCategory}
            </div>
            <div className="text-xs text-emerald-700 font-medium">
              Fastest-growing consumer query this month
            </div>
          </div>

          <div className="card p-4 bg-gradient-to-br from-purple-50/80 to-fuchsia-50/80 border border-purple-200 space-y-1">
            <div className="text-xs font-black uppercase text-purple-900 tracking-wider">
              Observed Consumer Pattern
            </div>
            <div className="text-base font-black text-gray-950">
              {data.marketOverview.consumerShift}
            </div>
            <div className="text-xs text-purple-700 font-medium">
              Shift toward pairings and customization
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-3 text-xs sm:text-sm font-bold">
        <button
          onClick={() => setActiveFilter("ALL")}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeFilter === "ALL"
              ? "bg-[#002970] text-white shadow-2xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          All Recommendations ({suggestions.length})
        </button>
        <button
          onClick={() => setActiveFilter("TRENDS")}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            activeFilter === "TRENDS"
              ? "bg-[#002970] text-white shadow-2xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <TrendingUp className="w-4 h-4 text-amber-500" />
          <span>Market Trends (Matcha, Plant Milk)</span>
        </button>
        <button
          onClick={() => setActiveFilter("SALES")}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            activeFilter === "SALES"
              ? "bg-[#002970] text-white shadow-2xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <TrendingDown className="w-4 h-4 text-rose-500" />
          <span>Store Sales Opportunities (Evening Drop)</span>
        </button>
      </div>

      {/* Main Recommendations Grid */}
      {loading ? (
        <div className="py-16 text-center text-gray-400 animate-pulse text-sm">
          Analyzing regional cafe market &amp; checking store transactions...
        </div>
      ) : filteredSuggestions.length === 0 ? (
        <div className="py-16 text-center text-gray-500 card p-8">
          No suggestions matching this filter right now.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredSuggestions.map((sug) => (
            <div
              key={sug.id}
              className="card p-6 flex flex-col justify-between space-y-4 border-2 transition-all hover:shadow-lg hover:border-blue-300"
            >
              {/* Header & Badges */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span
                    className={`text-[11px] font-black uppercase px-2.5 py-1 rounded-full border ${sug.badgeColor}`}
                  >
                    {sug.badge}
                  </span>
                  <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    {sug.projectedImpact}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-black text-gray-950 leading-snug">
                  {sug.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  {sug.summary}
                </p>
              </div>

              {/* Side-by-Side Facts (Market vs Store) */}
              <div className="space-y-2 bg-gray-50/80 p-3.5 rounded-2xl border border-gray-200/90 text-xs">
                <div>
                  <strong className="text-blue-950 font-black flex items-center gap-1.5 mb-0.5">
                    <Radio className="w-3.5 h-3.5 text-blue-600 shrink-0" /> External Market Signal:
                  </strong>
                  <p className="text-gray-700 leading-relaxed font-medium">
                    {sug.marketSignal}
                  </p>
                </div>

                <div className="pt-2 border-t border-gray-200/70">
                  <strong className="text-purple-950 font-black flex items-center gap-1.5 mb-0.5">
                    <BarChart3 className="w-3.5 h-3.5 text-purple-600 shrink-0" /> Your Store Sales Fact:
                  </strong>
                  <p className="text-gray-700 leading-relaxed font-medium">
                    {sug.storeSalesFact}
                  </p>
                </div>
              </div>

              {/* What AI Recommends */}
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/70 text-xs space-y-1">
                <strong className="text-blue-950 font-black flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>GrowKaro Autonomous Recommendation:</span>
                </strong>
                <p className="text-blue-900 font-medium leading-relaxed">
                  {sug.recommendation}
                </p>
                {sug.suggestedItems && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] text-gray-500 font-bold uppercase">Items:</span>
                    {sug.suggestedItems.map((item, idx) => (
                      <span key={idx} className="bg-white text-gray-800 font-bold px-2 py-0.5 rounded border text-[11px]">
                        {item}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-2 flex items-center justify-between gap-3 border-t border-gray-100">
                <span className="text-[11px] text-gray-400 font-medium">
                  {sug.timing}
                </span>

                <button
                  onClick={() => handleAdopt(sug)}
                  disabled={adoptingId === sug.id}
                  className="btn-primary text-xs font-black py-2.5 px-4 shadow-2xs flex items-center gap-1.5"
                >
                  <span>
                    {adoptingId === sug.id
                      ? "Executing..."
                      : sug.actionType === "ADD_PRODUCT_MENU"
                      ? "Add to Store Menu"
                      : sug.actionType === "LAUNCH_CAMPAIGN"
                      ? "Deploy Combo Campaign"
                      : "Assign to Staff"}
                  </span>
                  <Zap className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
