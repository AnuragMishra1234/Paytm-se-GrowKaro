import React from "react";
import { formatINR, formatPercent } from "../utils/formatters";

/**
 * KPICard — displays a single business KPI metric with clear hierarchy
 * Styled like Stripe/Square merchant overview cards.
 */
export function KPICard({
  title,
  value,
  change,
  changeLabel = "vs yesterday",
  format = "raw",
  loading = false,
}) {
  if (loading) {
    return (
      <div className="card p-5 animate-pulse space-y-3">
        <div className="h-3.5 bg-slate-100 rounded w-24" />
        <div className="h-7 bg-slate-100 rounded w-32" />
        <div className="h-3 bg-slate-100 rounded w-20" />
      </div>
    );
  }

  const formatted =
    format === "currency"
      ? formatINR(value)
      : format === "percent"
      ? `${value}%`
      : format === "number"
      ? new Intl.NumberFormat("en-IN").format(value || 0)
      : value;

  const hasChange = change != null && !isNaN(change);
  const isPositive = change >= 0;

  return (
    <div className="card p-5 hover:border-slate-300 transition-colors">
      <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
        {title}
      </div>

      <div className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
        {formatted}
      </div>

      {hasChange && (
        <div className="mt-2.5 flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-semibold ${
              isPositive
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-700"
            }`}
          >
            <span>{isPositive ? "↑" : "↓"}</span>
            <span>{formatPercent(Math.abs(change), false)}</span>
          </span>
          <span className="text-xs text-slate-400 font-normal">
            {changeLabel}
          </span>
        </div>
      )}
    </div>
  );
}