import React, { useState } from "react";
import { useMerchantContext } from "../context/MerchantContext";
import { useCustomers } from "../hooks/useCustomers";
import { ErrorState } from "../components/LoadingSpinner";
import { formatINR, formatRelativeTime } from "../utils/formatters";

function segmentBadgeClass(segment) {
  switch (segment) {
    case "vip":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "repeat":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "inactive":
      return "bg-amber-50 text-amber-700 border-amber-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

export default function Customers() {
  const { merchant } = useMerchantContext();
  const { data, loading, error, refetch } = useCustomers(merchant?._id);
  const [search, setSearch] = useState("");
  const [segmentFilter, setSegmentFilter] = useState("ALL");
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  if (error) {
    return (
      <div className="p-8">
        <ErrorState message={error} onRetry={refetch} />
      </div>
    );
  }

  const segments = data?.segments || {};
  const topCustomers = data?.topCustomers || [];

  // Filter customers based on search and segment filter
  const filteredCustomers = topCustomers.filter((c) => {
    const matchesSearch = c.displayName?.toLowerCase().includes(search.toLowerCase());
    const matchesSegment = segmentFilter === "ALL" || c.customerSegment === segmentFilter;
    return matchesSearch && matchesSegment;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* ─── 1. Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Customers
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Understand who keeps coming back and spot retention opportunities.
          </p>
        </div>

        <button
          onClick={refetch}
          className="btn-secondary text-xs font-semibold self-start sm:self-auto"
        >
          Refresh Directory
        </button>
      </div>

      {/* ─── 2. CRM Summary Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 space-y-1">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Total Customers
          </span>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            {segments.total || 0}
          </p>
          <p className="text-xs text-slate-400">All recorded patrons</p>
        </div>

        <div className="card p-5 space-y-1 border-l-4 border-l-emerald-500">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Repeat Customers
          </span>
          <p className="text-2xl sm:text-3xl font-bold text-emerald-700 mt-1">
            {segments.repeat || 0}
          </p>
          <p className="text-xs text-slate-400">2+ lifetime visits</p>
        </div>

        <div className="card p-5 space-y-1 border-l-4 border-l-purple-500">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            VIP Customers
          </span>
          <p className="text-2xl sm:text-3xl font-bold text-purple-700 mt-1">
            {segments.vip || 0}
          </p>
          <p className="text-xs text-slate-400">Repeat + ₹5,000+ spend</p>
        </div>

        <div className="card p-5 space-y-1 border-l-4 border-l-amber-500">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            At Risk / Inactive
          </span>
          <p className="text-2xl sm:text-3xl font-bold text-amber-700 mt-1">
            {segments.inactive || 0}
          </p>
          <p className="text-xs text-slate-400">No visit in 14+ days</p>
        </div>
      </div>

      {/* ─── 3. Segment Distribution Bar ──────────────────────────────────── */}
      {!loading && segments.total > 0 && (
        <div className="card p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-400">
              Customer Retention Breakdown
            </span>
            <span>{Math.round(((segments.repeat || 0) / segments.total) * 100)}% Repeat Rate</span>
          </div>

          <div className="flex h-3 rounded-full overflow-hidden bg-slate-100 gap-0.5">
            {[
              { key: "vip", count: segments.vip || 0, color: "bg-purple-500" },
              { key: "repeat", count: Math.max(0, (segments.repeat || 0) - (segments.vip || 0)), color: "bg-emerald-500" },
              { key: "new", count: segments.new || 0, color: "bg-sky-400" },
              { key: "inactive", count: segments.inactive || 0, color: "bg-amber-400" },
            ].map(
              (seg) =>
                seg.count > 0 && (
                  <div
                    key={seg.key}
                    className={`${seg.color} transition-all`}
                    style={{ width: `${(seg.count / segments.total) * 100}%` }}
                    title={`${seg.key}: ${seg.count}`}
                  />
                )
            )}
          </div>

          <div className="flex flex-wrap gap-4 text-xs text-slate-500 pt-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              VIP ({segments.vip || 0})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Repeat ({segments.repeat || 0})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              New ({segments.new || 0})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Inactive ({segments.inactive || 0})
            </span>
          </div>
        </div>
      )}

      {/* ─── 4. Customer Directory & Table ─────────────────────────────────── */}
      <div className="card space-y-4 p-5">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              placeholder="Search customer by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-text text-xs py-2 pl-8"
            />
            <svg
              className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Segment Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start sm:self-auto text-xs font-medium">
            {["ALL", "repeat", "vip", "new", "inactive"].map((seg) => (
              <button
                key={seg}
                onClick={() => setSegmentFilter(seg)}
                className={`px-2.5 py-1 rounded-md capitalize transition-colors ${
                  segmentFilter === seg
                    ? "bg-white text-slate-900 font-semibold shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {seg === "ALL" ? "All" : seg}
              </button>
            ))}
          </div>
        </div>

        {/* Modern Table */}
        <div className="table-container">
          <table className="table-base">
            <thead>
              <tr className="table-head-row">
                <th className="table-head-cell">Customer</th>
                <th className="table-head-cell">Segment</th>
                <th className="table-head-cell">Last Visit</th>
                <th className="table-head-cell text-right">Total Visits</th>
                <th className="table-head-cell text-right">Lifetime Spend</th>
                <th className="table-head-cell text-right">Avg Order</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="animate-pulse border-b border-slate-100">
                    <td className="table-cell"><div className="h-4 bg-slate-100 rounded w-28" /></td>
                    <td className="table-cell"><div className="h-4 bg-slate-100 rounded w-16" /></td>
                    <td className="table-cell"><div className="h-4 bg-slate-100 rounded w-20" /></td>
                    <td className="table-cell text-right"><div className="h-4 bg-slate-100 rounded w-12 ml-auto" /></td>
                    <td className="table-cell text-right"><div className="h-4 bg-slate-100 rounded w-16 ml-auto" /></td>
                    <td className="table-cell text-right"><div className="h-4 bg-slate-100 rounded w-14 ml-auto" /></td>
                  </tr>
                ))
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-xs text-slate-400">
                    No customers found matching the search criteria.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => {
                  const initials = c.displayName
                    ? c.displayName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()
                    : "CU";

                  return (
                    <tr
                      key={c._id}
                      onClick={() => setSelectedCustomer(c)}
                      className="table-row cursor-pointer"
                    >
                      <td className="table-cell">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">
                            {initials}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 block text-xs">
                              {c.displayName}
                            </span>
                            {c.phone && (
                              <span className="text-[10px] text-slate-400 block font-mono">
                                {c.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="table-cell">
                        <span
                          className={`badge text-[11px] capitalize border ${segmentBadgeClass(
                            c.customerSegment
                          )}`}
                        >
                          {c.customerSegment}
                        </span>
                      </td>

                      <td className="table-cell text-slate-600 text-xs font-normal">
                        {formatRelativeTime(c.lastTransactionAt)}
                      </td>

                      <td className="table-cell text-right font-semibold text-slate-800 text-xs">
                        {c.totalTransactions} visits
                      </td>

                      <td className="table-cell text-right font-bold text-slate-900 text-xs font-mono">
                        {formatINR(c.totalSpend)}
                      </td>

                      <td className="table-cell text-right text-slate-600 text-xs font-mono">
                        {formatINR(c.averageOrderValue || 0)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Customer Details Modal / Drawer ──────────────────────────────── */}
      {selectedCustomer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-fade-in"
          onClick={() => setSelectedCustomer(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl border border-slate-200 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Customer Profile
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  {selectedCustomer.displayName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                <span className="text-[10px] text-slate-400 uppercase font-medium">Segment</span>
                <p className="font-bold text-slate-900 mt-0.5 capitalize">{selectedCustomer.customerSegment}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                <span className="text-[10px] text-slate-400 uppercase font-medium">Last Visit</span>
                <p className="font-bold text-slate-900 mt-0.5">{formatRelativeTime(selectedCustomer.lastTransactionAt)}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                <span className="text-[10px] text-slate-400 uppercase font-medium">Total Visits</span>
                <p className="font-bold text-slate-900 mt-0.5">{selectedCustomer.totalTransactions}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                <span className="text-[10px] text-slate-400 uppercase font-medium">Lifetime Spend</span>
                <p className="font-bold text-emerald-700 font-mono mt-0.5">{formatINR(selectedCustomer.totalSpend)}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="btn-secondary text-xs font-semibold px-4 py-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}