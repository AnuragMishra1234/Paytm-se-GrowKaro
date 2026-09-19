import React from "react";
import { formatINR, formatPercent, changeColor } from "../utils/formatters";

/**
 * KPICard — displays a single business KPI metric
 * Props:
 *   title: string
 *   value: string | number
 *   change: number (percent, positive or negative)
 *   changeLabel: string (e.g. "vs yesterday")
 *   icon: string (emoji)
 *   format: "currency" | "number" | "percent" | "raw"
 *   loading: boolean
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
        {icon && <span className="text-2xl">{icon}</span>}
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