import React from "react";
import { useMerchantContext } from "../context/MerchantContext";
import { useCustomers } from "../hooks/useCustomers";
import { ErrorState, EmptyState } from "../components/LoadingSpinner";
import { formatINR, formatRelativeTime, segmentStyle } from "../utils/formatters";

function SegmentCard({ label, count, description, color, loading }) {
  if (loading) return <div className="card p-5 animate-pulse h-24" />;
  return (
    <div className={`card p-5 border-l-4 ${color}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-500">{label}</span>
      </div>
      <p className="text-3xl font-bold text-gray-900">{count}</p>
      <p className="text-xs text-gray-400 mt-1">{description}</p>
    </div>
  );
}

export default function Customers() {
  const { merchant } = useMerchantContext();
  const { data, loading, error, refetch } = useCustomers(merchant?._id);

  if (error) return <div className="p-8"><ErrorState message={error} onRetry={refetch} /></div>;

  const segments = data?.segments || {};
  const topCustomers = data?.topCustomers || [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <p className="text-gray-500 text-sm">Customer segments and top spenders</p>
      </div>

      {/* Segment cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SegmentCard
          label="Total Customers"
          count={segments.total || 0}
          description="All-time unique customers"
          color="border-blue-500"
          loading={loading}
        />
        <SegmentCard
          label="Repeat Customers"
          count={segments.repeat || 0}
          description="2+ transactions"
          color="border-green-500"
          loading={loading}
        />
        <SegmentCard
          label="VIP Customers"
          count={segments.vip || 0}
          description="Repeat + spend ₹5,000+"
          color="border-purple-500"
          loading={loading}
        />
        <SegmentCard
          label="Inactive"
          count={segments.inactive || 0}
          description="No visit in 30+ days"
          color="border-gray-300"
          loading={loading}
        />
      </div>

      {/* Segment definitions note */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
        <span className="font-medium">Segment definitions: </span>
        <span>New = 1 transaction · Repeat = 2+ transactions · VIP = repeat + ₹5,000+ spend · Inactive = no visit in 30 days</span>
      </div>

      {/* Repeat rate visual */}
      {!loading && segments.total > 0 && (
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Customer Breakdown</h2>
          <div className="flex gap-2 h-6 rounded-full overflow-hidden">
            {[
              { key: "vip", count: segments.vip || 0, color: "bg-purple-500" },
              { key: "repeat", count: (segments.repeat || 0) - (segments.vip || 0), color: "bg-blue-500" },
              { key: "new", count: segments.new || 0, color: "bg-green-400" },
              { key: "inactive", count: segments.inactive || 0, color: "bg-gray-200" },
            ].map((seg) => (
              seg.count > 0 && (
                <div
                  key={seg.key}
                  className={`${seg.color}`}
                  style={{ width: `${(seg.count / segments.total) * 100}%` }}
                  title={`${seg.key}: ${seg.count}`}
                />
              )
            ))}
          </div>
          <div className="flex gap-6 mt-3">
            {[
              { label: "VIP", color: "bg-purple-500", count: segments.vip || 0 },
              { label: "Repeat", color: "bg-blue-500", count: (segments.repeat || 0) },
              { label: "New", color: "bg-green-400", count: segments.new || 0 },
              { label: "Inactive", color: "bg-gray-200", count: segments.inactive || 0 },
            ].map((seg) => (
              <div key={seg.label} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded-full ${seg.color}`} />
                <span className="text-xs text-gray-600">{seg.label} ({seg.count})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top customers table */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Top Customers by Spend</h2>
        {loading ? (
          <div className="space-y-2">
            {[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}
          </div>
        ) : topCustomers.length === 0 ? (
          <EmptyState message="No customer data available" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 text-gray-500 font-medium">#</th>
                  <th className="text-left py-3 text-gray-500 font-medium">Customer</th>
                  <th className="text-center py-3 text-gray-500 font-medium">Segment</th>
                  <th className="text-right py-3 pr-4 text-gray-500 font-medium">Transactions</th>
                  <th className="text-right py-3 pr-4 text-gray-500 font-medium">Total Spend</th>
                  <th className="text-right py-3 pr-4 text-gray-500 font-medium">Avg Order</th>
                  <th className="text-right py-3 text-gray-500 font-medium">Last Visit</th>
                </tr>
              </thead>
              <tbody>
                {topCustomers.map((c, i) => (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 text-gray-400 text-xs">{i + 1}</td>
                    <td className="py-3 font-medium text-gray-900">{c.displayName}</td>
                    <td className="py-3 text-center">
                      <span className={`badge ${segmentStyle(c.customerSegment)} capitalize`}>
                        {c.customerSegment}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-right text-gray-700">{c.totalTransactions}</td>
                    <td className="py-3 pr-4 text-right font-semibold text-gray-900">{formatINR(c.totalSpend)}</td>
                    <td className="py-3 pr-4 text-right text-gray-600">{formatINR(c.averageOrderValue)}</td>
                    <td className="py-3 text-right text-gray-400 text-xs">{formatRelativeTime(c.lastTransactionAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}