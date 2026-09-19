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

  if (error) return <div className="p-8"><ErrorState message={error} onRetry={refetch} /></div>;

  // Summary stats
  const totalRevenue = data?.revenueTrend?.reduce((s, d) => s + d.revenue, 0) || 0;
  const totalTx = data?.revenueTrend?.reduce((s, d) => s + d.transactions, 0) || 0;
  const peakHour = data?.hourlySales?.reduce((max, h) => h.revenue > (max?.revenue || 0) ? h : max, null);
  const peakDay = data?.weekdaySales?.reduce((max, d) => d.revenue > (max?.revenue || 0) ? d : max, null);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900">Business Analytics</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">Detailed sales patterns and trends</p>
        </div>
        <div className="flex gap-1.5 bg-gray-100 rounded-xl p-1.5">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDays(opt.value)}
              className={`px-3.5 py-2 rounded-lg text-sm font-bold transition-colors ${
                days === opt.value ? "bg-white text-gray-950 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: formatINR(totalRevenue), loading },
          { label: "Total Transactions", value: totalTx.toLocaleString("en-IN"), loading },
          { label: "Peak Hour", value: peakHour ? `${peakHour.label} (${formatINR(peakHour.revenue)})` : "–", loading },
          { label: "Best Day", value: peakDay ? `${peakDay.day} (${formatINR(peakDay.revenue)})` : "–", loading },
        ].map((stat, i) => (
          <div key={i} className="card p-5 space-y-1">
            <p className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-wider">{stat.label}</p>
            {loading ? (
              <div className="h-7 bg-gray-200 rounded animate-pulse w-28" />
            ) : (
              <p className="text-xl md:text-2xl font-black text-gray-950">{stat.value}</p>
            )}
          </div>
        ))}
      </div>

      {/* Revenue Trend */}
      <div className="card p-6">
        <h2 className="font-black text-lg text-gray-950 mb-4">Revenue Trend — Last {days} Days</h2>
        <RevenueChart data={data?.revenueTrend} loading={loading} />
      </div>

      {/* Hourly + Weekday */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="font-black text-lg text-gray-950 mb-1">Sales by Hour of Day</h2>
          <p className="text-xs md:text-sm text-gray-500 mb-4 font-medium">Identifies peak and weak time windows</p>
          <HourlyChart data={data?.hourlySales} loading={loading} />
        </div>
        <div className="card p-6">
          <h2 className="font-black text-lg text-gray-950 mb-1">Sales by Day of Week</h2>
          <p className="text-xs md:text-sm text-gray-500 mb-4 font-medium">Based on last 8 weeks</p>
          <WeekdayChart data={data?.weekdaySales} loading={loading} />
        </div>
      </div>

      {/* Hourly table */}
      {!loading && data?.hourlySales && (
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Hourly Breakdown</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 pr-4 text-gray-500 font-medium">Hour</th>
                  <th className="text-right py-2 pr-4 text-gray-500 font-medium">Revenue</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Transactions</th>
                </tr>
              </thead>
              <tbody>
                {data.hourlySales
                  .filter((h) => h.revenue > 0)
                  .sort((a, b) => b.revenue - a.revenue)
                  .slice(0, 10)
                  .map((h) => (
                    <tr key={h.hour} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2 pr-4 text-gray-700">{h.label}</td>
                      <td className="py-2 pr-4 text-right font-medium text-gray-900">{formatINR(h.revenue)}</td>
                      <td className="py-2 text-right text-gray-500">{h.transactions}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}