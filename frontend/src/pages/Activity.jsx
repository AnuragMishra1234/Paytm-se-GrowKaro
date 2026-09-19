import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useMerchantContext } from "../context/MerchantContext";
import { fetchMerchantActivity } from "../services/api";
import { LoadingSpinner, ErrorState } from "../components/LoadingSpinner";
import { formatDate } from "../utils/formatters";

const STAGES = [
  { id: "ALL", label: "All Events" },
  { id: "DETECT", label: "1. Observe & Detect", icon: "🔍" },
  { id: "RECOMMEND", label: "2. Recommend", icon: "💡" },
  { id: "APPROVE", label: "3. Merchant Gate", icon: "🛡️" },
  { id: "ACT", label: "4. n8n Execution", icon: "🚀" },
  { id: "MEASURE", label: "5. Outcome", icon: "📈" },
  { id: "LEARN", label: "6. Memory & Learn", icon: "🧠" },
];

function resolveActivityLink(link, category) {
  if (!link) {
    if (category === "RECOMMEND" || category === "APPROVE" || category === "ACT") return "/campaigns";
    if (category === "MEASURE" || category === "LEARN") return "/performance";
    if (category === "DETECT") return "/insights";
    return "/activity";
  }
  if (link === "/actions" || link === "/recommendations") return "/campaigns";
  if (link === "/outcomes" || link === "/memory") return "/performance";
  return link;
}

function getCategoryTheme(category) {
  switch (category) {
    case "DETECT":
      return {
        bg: "bg-purple-50 text-purple-800 border-purple-200",
        dot: "bg-purple-600 ring-purple-100",
        icon: "🔍",
        label: "DETECT",
      };
    case "RECOMMEND":
      return {
        bg: "bg-amber-50 text-amber-800 border-amber-200",
        dot: "bg-amber-500 ring-amber-100",
        icon: "💡",
        label: "RECOMMEND",
      };
    case "APPROVE":
      return {
        bg: "bg-blue-50 text-blue-800 border-blue-200",
        dot: "bg-blue-600 ring-blue-100",
        icon: "🛡️",
        label: "APPROVE",
      };
    case "ACT":
      return {
        bg: "bg-indigo-50 text-indigo-800 border-indigo-200",
        dot: "bg-indigo-600 ring-indigo-100",
        icon: "🚀",
        label: "ACT",
      };
    case "MEASURE":
      return {
        bg: "bg-emerald-50 text-emerald-800 border-emerald-200",
        dot: "bg-emerald-600 ring-emerald-100",
        icon: "📈",
        label: "MEASURE",
      };
    case "LEARN":
      return {
        bg: "bg-rose-50 text-rose-800 border-rose-200",
        dot: "bg-rose-600 ring-rose-100",
        icon: "🧠",
        label: "LEARN",
      };
    default:
      return {
        bg: "bg-gray-100 text-gray-800 border-gray-200",
        dot: "bg-gray-500 ring-gray-100",
        icon: "📋",
        label: category,
      };
  }
}

export default function Activity() {
  const { merchant } = useMerchantContext();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeStage, setActiveStage] = useState("ALL");

  const loadActivity = useCallback(async () => {
    if (!merchant?._id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetchMerchantActivity(merchant._id, 60);
      if (res.success) {
        setEvents(res.data || []);
      }
    } catch (err) {
      setError(err.message || "Failed to load merchant activity");
    } finally {
      setLoading(false);
    }
  }, [merchant?._id]);

  useEffect(() => {
    loadActivity();
  }, [loadActivity]);

  if (loading && events.length === 0) {
    return (
      <div className="p-8 flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error && events.length === 0) {
    return (
      <div className="p-8">
        <ErrorState message={error} onRetry={loadActivity} />
      </div>
    );
  }

  // Filter events
  const filteredEvents = events.filter((ev) => {
    if (activeStage === "ALL") return true;
    return ev.category === activeStage;
  });

  // Calculate stage summary counts
  const detectCount = events.filter((e) => e.category === "DETECT").length;
  const recommendCount = events.filter((e) => e.category === "RECOMMEND").length;
  const approveCount = events.filter((e) => e.category === "APPROVE").length;
  const actCount = events.filter((e) => e.category === "ACT").length;
  const measureCount = events.filter((e) => e.category === "MEASURE").length;
  const learnCount = events.filter((e) => e.category === "LEARN").length;

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs md:text-sm font-black uppercase tracking-wider px-3 py-1 rounded-full bg-[#002970]/10 text-[#002970]">
              Lifecycle Log
            </span>
            <span className="text-xs md:text-sm text-gray-500 font-semibold">
              Observe → Understand → Detect → Recommend → Approve → Act → Measure → Learn
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-950 mt-1.5">
            Activity &amp; Agentic Timeline
          </h1>
          <p className="text-sm md:text-base text-gray-600 mt-1 font-medium">
            Full chronological audit trail for {merchant.businessName}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadActivity}
            disabled={loading}
            className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 text-sm font-bold rounded-xl transition-all shadow-2xs flex items-center gap-2"
          >
            <span>{loading ? "Refreshing..." : "↻ Refresh Log"}</span>
          </button>
        </div>
      </div>

      {/* Metric Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-2xs">
          <p className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-wider">Total Events</p>
          <p className="text-2xl md:text-3xl font-black text-gray-950 mt-1">{events.length}</p>
        </div>
        <div className="p-4 bg-purple-50/70 rounded-2xl border border-purple-100 shadow-2xs">
          <p className="text-xs md:text-sm font-bold text-purple-800 uppercase tracking-wider">Detected</p>
          <p className="text-2xl md:text-3xl font-black text-purple-950 mt-1">{detectCount}</p>
        </div>
        <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-100 shadow-2xs">
          <p className="text-xs md:text-sm font-bold text-amber-800 uppercase tracking-wider">Proposed</p>
          <p className="text-2xl md:text-3xl font-black text-amber-950 mt-1">{recommendCount}</p>
        </div>
        <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-100 shadow-2xs">
          <p className="text-xs md:text-sm font-bold text-blue-800 uppercase tracking-wider">Merchant Gate</p>
          <p className="text-2xl md:text-3xl font-black text-blue-950 mt-1">{approveCount}</p>
        </div>
        <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-100 shadow-2xs">
          <p className="text-xs md:text-sm font-bold text-indigo-800 uppercase tracking-wider">Executed</p>
          <p className="text-2xl md:text-3xl font-black text-indigo-950 mt-1">{actCount}</p>
        </div>
        <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-100 shadow-2xs">
          <p className="text-xs md:text-sm font-bold text-emerald-800 uppercase tracking-wider">Measured</p>
          <p className="text-2xl md:text-3xl font-black text-emerald-950 mt-1">{measureCount}</p>
        </div>
      </div>

      {/* Stage Filter Tabs */}
      <div className="flex flex-wrap gap-2 p-2 bg-white rounded-2xl border border-gray-200/80 shadow-2xs">
        {STAGES.map((st) => (
          <button
            key={st.id}
            onClick={() => setActiveStage(st.id)}
            className={`px-3.5 py-2 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-1.5 ${
              activeStage === st.id
                ? "bg-[#002970] text-white shadow-xs"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {st.icon && <span>{st.icon}</span>}
            <span>{st.label}</span>
          </button>
        ))}
      </div>

      {/* Vertical Timeline Card */}
      <div className="bg-white rounded-3xl border border-gray-200/90 shadow-sm p-6 sm:p-8">
        {filteredEvents.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3 text-2xl">
              📋
            </div>
            <h3 className="text-lg font-bold text-gray-900">No events found for this filter</h3>
            <p className="text-sm text-gray-500 mt-1">
              Select "All Events" or trigger a scenario from the Demo Simulator to generate events.
            </p>
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-gray-200">
            {filteredEvents.map((ev) => {
              const theme = getCategoryTheme(ev.category);
              return (
                <div key={ev.id} className="relative group">
                  {/* Timeline Dot */}
                  <span
                    className={`absolute -left-6 sm:-left-8 top-2 w-4 h-4 rounded-full ${theme.dot} ring-4 transition-transform group-hover:scale-125`}
                  />

                  {/* Card Content */}
                  <div className="p-5 sm:p-6 rounded-2xl border border-gray-200 bg-gray-50/50 hover:bg-white hover:border-gray-300 hover:shadow-xs transition-all space-y-3">
                    {/* Top row */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-black uppercase px-3 py-1 rounded-md border flex items-center gap-1.5 ${theme.bg}`}
                        >
                          <span>{theme.icon}</span>
                          <span>{theme.label}</span>
                        </span>
                        {ev.status && (
                          <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-white border border-gray-200 text-gray-800">
                            Status: {ev.status}
                          </span>
                        )}
                      </div>

                      <span className="text-xs md:text-sm font-semibold text-gray-500">
                        {formatDate(ev.timestamp)}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-black text-lg md:text-xl text-gray-950 leading-snug">
                      {ev.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm md:text-base text-gray-700 leading-relaxed font-normal">
                      {ev.description}
                    </p>

                    {/* Metadata chips */}
                    {ev.metadata && Object.keys(ev.metadata).length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {Object.entries(ev.metadata).map(([k, v]) => {
                          if (v === null || v === undefined || typeof v === "object") return null;
                          return (
                            <span
                              key={k}
                              className="text-xs font-mono px-3 py-1 rounded-lg bg-white border border-gray-200 text-gray-700"
                            >
                              <span className="text-gray-400 font-semibold">{k}:</span> {String(v)}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Deep Link */}
                    {ev.link && (
                      <div className="pt-2">
                        <Link
                          to={resolveActivityLink(ev.link, ev.category)}
                          className="inline-flex items-center gap-1.5 text-sm font-bold text-[#002970] hover:underline"
                        >
                          <span>Go to details</span>
                          <span className="text-base font-bold">›</span>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
