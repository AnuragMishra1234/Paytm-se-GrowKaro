import React from "react";
import { formatINR, formatPercent, changeColor } from "../utils/formatters";

function renderKPIIcon(icon) {
  if (!icon) return null;
  if (React.isValidElement(icon)) return icon;

  // Clean, crisp enterprise vector SVG icons
  if (icon === "💰" || icon === "currency" || icon === "revenue") {
    return (
      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center justify-center shrink-0">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    );
  }

  if (icon === "↩️" || icon === "refund") {
    return (
      <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 border border-rose-200/80 flex items-center justify-center shrink-0">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
        </svg>
      </div>
    );
  }

  if (icon === "📈" || icon === "net" || icon === "trend") {
    return (
      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 border border-blue-200/80 flex items-center justify-center shrink-0">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
        </svg>
      </div>
    );
  }

  if (icon === "🔄" || icon === "repeat" || icon === "cycle") {
    return (
      <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 border border-purple-200/80 flex items-center justify-center shrink-0">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
        </svg>
      </div>
    );
  }

  if (icon === "🧾" || icon === "number" || icon === "orders") {
    return (
      <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-700 border border-gray-200 flex items-center justify-center shrink-0">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
    );
  }

  if (icon === "🎯" || icon === "aov") {
    return (
      <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200/80 flex items-center justify-center shrink-0">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.5 12a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-600 border border-gray-200 flex items-center justify-center font-bold text-xs shrink-0">
      KPI
    </div>
  );
}

/**
 * KPICard — displays a single business KPI metric with modern SVG vector badge
 */
export function KPICard({ title, value, change, changeLabel = "vs yesterday", icon, format = "raw", loading = false }) {
  if (loading) {
    return (
      <div className="card p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
        <div className="h-8 bg-gray-200 rounded w-32 mb-2" />
        <div className="h-3 bg-gray-200 rounded w-20" />
      </div>
    );
  }

  const formatted =
    format === "currency" ? formatINR(value) :
    format === "percent" ? `${value}%` :
    format === "number" ? new Intl.NumberFormat("en-IN").format(value) :
    value;

  const hasChange = change != null && !isNaN(change);

  return (
    <div className="card p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-sm md:text-base font-bold text-gray-600 tracking-tight">{title}</span>
        {icon && renderKPIIcon(icon)}
      </div>
      <div className="text-3xl font-black text-gray-950 mb-2">{formatted}</div>
      {hasChange && (
        <div className={`flex items-center gap-1.5 text-sm md:text-base font-bold ${changeColor(change)}`}>
          <span>{change >= 0 ? "↑" : "↓"}</span>
          <span>{formatPercent(Math.abs(change), false)}</span>
          <span className="text-gray-500 font-medium text-xs md:text-sm">{changeLabel}</span>
        </div>
      )}
    </div>
  );
}
export default KPICard;