import React, { useState } from "react";
import { useMerchantContext } from "../context/MerchantContext";
import { useAnalytics } from "../hooks/useAnalytics";
import { RevenueChart } from "../components/charts/RevenueChart";
import { HourlyChart } from "../components/charts/HourlyChart";
import { WeekdayChart } from "../components/charts/WeekdayChart";
import { ErrorState } from "../components/LoadingSpinner";
import { formatINR } from "../utils/formatters";

const PERIOD_OPTIONS = [
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
];

export default function Analytics() {
  const { merchant } = useMerchantContext();
  const [days, setDays] = useState(30);
  const { data, loading, error, refetch } = useAnalytics(merchant?._id, days);

  if (error) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <ErrorState message={error} onRetry={refetch} />
      </div>
    );
  }

  // Summary stats
  const totalRevenue = data?.revenueTrend?.reduce((s, d) => s + d.revenue, 0) || 0;
  const totalTx = data?.revenueTrend?.reduce((s, d) => s + d.transactions, 0) || 0;
  const peakHour = data?.hourlySales?.reduce((max, h) => (h.revenue > (max?.revenue || 0) ? h : max), null);
  const peakDay = data?.weekdaySales?.reduce((max, d) => (d.revenue > (max?.revenue || 0) ? d : max), null);
  const avgOrderValue = totalTx > 0 ? Math.round(totalRevenue / totalTx) : 0;

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-900">
            Sales &amp; Business Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Temporal patterns, revenue velocity, and store traffic dynamics.
          </p>
        </div>

        {/* Time Window Switcher */}
        <div className="inline-flex rounded-lg p-1 bg-slate-200/70 self-start sm:self-auto">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDays(opt.value)}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                days === opt.value
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Sales",
            value: formatINR(totalRevenue),
            sub: `Across last ${days} days`,
            color: "text-slate-900",
          },
          {
            label: "Transaction Count",
            value: totalTx.toLocaleString("en-IN"),
            sub: avgOrderValue ? `Avg. ₹${avgOrderValue} / ticket` : "–",
            color: "text-slate-900",
          },
          {
            label: "Peak Traffic Hour",
            value: peakHour?.label || "–",
            sub: peakHour ? `${formatINR(peakHour.revenue)} peak volume` : "–",
            color: "text-emerald-700",
          },
          {
            label: "Strongest Day",
            value: peakDay?.day || "–",
            sub: peakDay ? `${formatINR(peakDay.revenue)} total sales` : "–",
            color: "text-brand-700",
          },
        ].map((stat, i) => (
          <div key={i} className="card p-5 space-y-1">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
              {stat.label}
            </span>
            {loading ? (
              <div className="h-7 bg-slate-100 rounded animate-pulse w-28 my-1" />
            ) : (
              <p className={`text-2xl font-semibold font-mono tracking-tight ${stat.color}`}>
                {stat.value}
              </p>
            )}
            <p className="text-xs text-slate-400 truncate">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Revenue Trend Over Time */}
      <div className="card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Revenue Velocity</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Daily settlement volume reported across the trailing {days}-day period
            </p>
          </div>
          <span className="badge-emerald text-xs self-start sm:self-auto font-medium">
            Daily Trend
          </span>
        </div>
        <RevenueChart data={data?.revenueTrend} loading={loading} />
      </div>

      {/* Hourly & Day-of-Week Patterns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Sales by Hour of Day</h2>
              <p className="text-xs text-slate-500 mt-0.5">Identifies rush and quiet operational windows</p>
            </div>
            {peakHour && (
              <span className="badge-slate font-mono text-xs font-medium">
                Peak: {peakHour.label}
              </span>
            )}
          </div>
          <HourlyChart data={data?.hourlySales} loading={loading} />
        </div>

        <div className="card p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Sales by Day of Week</h2>
              <p className="text-xs text-slate-500 mt-0.5">Aggregated recurring weekday performance</p>
            </div>
            {peakDay && (
              <span className="badge-slate font-mono text-xs font-medium">
                Best: {peakDay.day}
              </span>
            )}
          </div>
          <WeekdayChart data={data?.weekdaySales} loading={loading} />
        </div>
      </div>

      {/* Top Hourly Windows Table */}
      {!loading && data?.hourlySales && (
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-slate-200/80 bg-slate-50/50">
            <h2 className="text-sm font-semibold text-slate-900">Top Revenue Time Windows</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ranked by transaction volume and settlement value
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th className="w-16 text-center">Rank</th>
                  <th className="text-left">Operating Window</th>
                  <th className="text-right">Settled Revenue</th>
                  <th className="text-right">Transaction Count</th>
                  <th className="text-right">Avg. Ticket Value</th>
                </tr>
              </thead>
              <tbody>
                {data.hourlySales
                  .filter((h) => h.revenue > 0)
                  .sort((a, b) => b.revenue - a.revenue)
                  .slice(0, 8)
                  .map((h, index) => {
                    const avgTicket = h.transactions > 0 ? Math.round(h.revenue / h.transactions) : 0;
                    return (
                      <tr key={h.hour}>
                        <td className="font-mono text-xs text-slate-400 text-center font-medium">
                          #{index + 1}
                        </td>
                        <td className="font-medium text-slate-900">
                          {h.label}
                        </td>
                        <td className="text-right font-mono font-semibold text-slate-900">
                          {formatINR(h.revenue)}
                        </td>
                        <td className="text-right font-mono text-slate-600">
                          {h.transactions.toLocaleString()}
                        </td>
                        <td className="text-right font-mono text-slate-600">
                          {formatINR(avgTicket)}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}