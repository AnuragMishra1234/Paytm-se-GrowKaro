import React, { useState, useMemo } from "react";
import { useMerchantContext } from "../context/MerchantContext";
import { useProducts } from "../hooks/useProducts";
import { CategoryChart } from "../components/charts/CategoryChart";
import { ErrorState, EmptyState } from "../components/LoadingSpinner";
import { formatINR } from "../utils/formatters";

const trendBadge = (trend) => {
  if (trend === "growing") {
    return (
      <span className="badge-emerald inline-flex items-center gap-1 font-medium">
        <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        Growing
      </span>
    );
  }
  if (trend === "declining") {
    return (
      <span className="badge-rose inline-flex items-center gap-1 font-medium">
        <svg className="w-3 h-3 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
        </svg>
        Declining
      </span>
    );
  }
  if (trend === "stable") {
    return <span className="badge-slate inline-flex items-center font-medium">Stable</span>;
  }
  return <span className="badge-slate inline-flex items-center text-slate-400">–</span>;
};

export default function Products() {
  const { merchant } = useMerchantContext();
  const { data, loading, error, refetch } = useProducts(merchant?._id);
  const [sortBy, setSortBy] = useState("revenue");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const products = data?.products || [];
  const categories = data?.categories || [];

  const filteredAndSorted = useMemo(() => {
    return products
      .filter((p) => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === "all" || p.category.toLowerCase() === selectedCategory.toLowerCase();
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        if (sortBy === "revenue") return b.revenue - a.revenue;
        if (sortBy === "units") return b.unitsSold - a.unitsSold;
        return a.name.localeCompare(b.name);
      });
  }, [products, searchTerm, selectedCategory, sortBy]);

  const bestCategory = categories[0];
  const decliningProducts = products.filter((p) => p.trend === "declining");
  const growingProducts = products.filter((p) => p.trend === "growing");

  if (error) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <ErrorState message={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-900">
              Product Catalogue
            </h1>
            <span className="badge-slate font-mono text-xs font-semibold">
              {products.length} items
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Sales distribution, momentum trends, and category performance for {merchant?.name || "your store"}.
          </p>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <div key={i} className="card p-5 animate-pulse h-24 bg-slate-100/70" />
          ))
        ) : (
          <>
            <div className="card p-5">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-1">
                Active Catalogue
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold text-slate-900 font-mono">
                  {products.length}
                </span>
                <span className="text-xs text-slate-400">SKUs tracked</span>
              </div>
            </div>

            <div className="card p-5">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-1">
                Top Category
              </span>
              <div className="truncate">
                <span className="text-lg font-semibold text-slate-900 capitalize block truncate">
                  {bestCategory?.category || "–"}
                </span>
                <span className="text-xs text-brand-700 font-medium">
                  {bestCategory?.revenueShare || 0}% of revenue
                </span>
              </div>
            </div>

            <div className="card p-5">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-1">
                Growing Items
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold text-emerald-600 font-mono">
                  {growingProducts.length}
                </span>
                <span className="text-xs text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
                  Rising volume
                </span>
              </div>
            </div>

            <div className="card p-5">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-1">
                Needs Attention
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold text-rose-600 font-mono">
                  {decliningProducts.length}
                </span>
                <span className="text-xs text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded font-medium">
                  Declining run-rate
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Category Breakdown & Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Revenue by Category</h2>
            <p className="text-xs text-slate-500 mt-0.5">Share of aggregate store sales</p>
          </div>
          <div className="py-2">
            <CategoryChart data={categories} loading={loading} />
          </div>
          <div className="text-xs text-slate-400 border-t border-slate-100 pt-3 flex items-center justify-between">
            <span>{categories.length} active categories</span>
            <span className="font-mono text-slate-600 font-medium">100% covered</span>
          </div>
        </div>

        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Category Breakdown</h2>
              <p className="text-xs text-slate-500 mt-0.5">Ranked by volume and sales contribution</p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <EmptyState message="No category data recorded yet" />
          ) : (
            <div className="space-y-4">
              {categories.map((cat, i) => (
                <div key={cat.category} className="group">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-400 w-4 text-right">{i + 1}</span>
                      <span className="font-medium text-slate-800 capitalize text-sm">
                        {cat.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-500 font-mono">
                        {cat.unitsSold.toLocaleString()} units
                      </span>
                      <span className="font-semibold text-slate-900 font-mono w-24 text-right">
                        {formatINR(cat.revenue)}
                      </span>
                      <span className="badge-slate font-mono text-xs w-12 text-center">
                        {cat.revenueShare}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden ml-6">
                    <div
                      className="h-full bg-brand-600 rounded-full transition-all duration-300 group-hover:bg-brand-700"
                      style={{ width: `${Math.min(100, Math.max(2, cat.revenueShare))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Product Table Section */}
      <div className="card overflow-hidden">
        {/* Table Filters & Search Bar */}
        <div className="p-5 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Box */}
            <div className="relative min-w-[240px]">
              <svg
                className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter by product name..."
                className="input-text text-xs pl-9 pr-3 py-1.5 w-full bg-white"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-text text-xs py-1.5 px-3 bg-white cursor-pointer font-medium text-slate-700"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.category} value={c.category}>
                  {c.category.charAt(0).toUpperCase() + c.category.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Tabs */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-slate-400 mr-1">Sort:</span>
            <div className="inline-flex rounded-md p-0.5 bg-slate-200/70">
              {[
                ["revenue", "Revenue"],
                ["units", "Units"],
                ["name", "Name"],
              ].map(([val, lbl]) => (
                <button
                  key={val}
                  onClick={() => setSortBy(val)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                    sortBy === val
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table Body */}
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-slate-100 rounded animate-pulse" />
            ))}
          </div>
        ) : filteredAndSorted.length === 0 ? (
          <div className="py-12">
            <EmptyState
              message={
                searchTerm || selectedCategory !== "all"
                  ? "No products match your current filters"
                  : "No products found in catalogue"
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th className="w-12 text-center">#</th>
                  <th className="text-left">Product Name</th>
                  <th className="text-left">Category</th>
                  <th className="text-right">Unit Price</th>
                  <th className="text-right">Units Sold</th>
                  <th className="text-right">Total Revenue</th>
                  <th className="text-right">Performance Trend</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSorted.map((p, idx) => (
                  <tr key={p.id || p._id || idx}>
                    <td className="font-mono text-xs text-slate-400 text-center">
                      {idx + 1}
                    </td>
                    <td>
                      <div className="font-medium text-slate-900">{p.name}</div>
                      {p.sku && <div className="text-[11px] font-mono text-slate-400">SKU: {p.sku}</div>}
                    </td>
                    <td>
                      <span className="badge-slate capitalize text-xs font-medium">
                        {p.category}
                      </span>
                    </td>
                    <td className="text-right font-mono text-slate-700">
                      {formatINR(p.price)}
                    </td>
                    <td className="text-right font-mono text-slate-700">
                      {p.unitsSold.toLocaleString()}
                    </td>
                    <td className="text-right font-mono font-semibold text-slate-900">
                      {formatINR(p.revenue)}
                    </td>
                    <td className="text-right">
                      {trendBadge(p.trend)}
                    </td>
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