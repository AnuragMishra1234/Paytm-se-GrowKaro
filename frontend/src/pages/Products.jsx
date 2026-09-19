import React, { useState } from "react";
import { useMerchantContext } from "../context/MerchantContext";
import { useProducts } from "../hooks/useProducts";
import { CategoryChart } from "../components/charts/CategoryChart";
import { ErrorState, EmptyState } from "../components/LoadingSpinner";
import { formatINR } from "../utils/formatters";

const trendBadge = (trend) => {
  const map = {
    growing: "bg-green-100 text-green-700",
    declining: "bg-red-100 text-red-700",
    stable: "bg-gray-100 text-gray-600",
    unknown: "bg-gray-100 text-gray-400",
  };
  const labels = { growing: "↑ Growing", declining: "↓ Declining", stable: "→ Stable", unknown: "–" };
  return (
    <span className={`badge ${map[trend] || map.unknown}`}>{labels[trend] || "–"}</span>
  );
};

export default function Products() {
  const { merchant } = useMerchantContext();
  const { data, loading, error, refetch } = useProducts(merchant?._id);
  const [sortBy, setSortBy] = useState("revenue");

  if (error) return <div className="p-8"><ErrorState message={error} onRetry={refetch} /></div>;

  const products = data?.products || [];
  const categories = data?.categories || [];

  const sorted = [...products].sort((a, b) => {
    if (sortBy === "revenue") return b.revenue - a.revenue;
    if (sortBy === "units") return b.unitsSold - a.unitsSold;
    return a.name.localeCompare(b.name);
  });

  const bestCategory = categories[0];
  const decliningProducts = products.filter((p) => p.trend === "declining");
  const growingProducts = products.filter((p) => p.trend === "growing");

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <p className="text-gray-500 text-sm">Performance across your product catalogue</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          [1,2,3,4].map(i => <div key={i} className="card p-5 animate-pulse h-20" />)
        ) : (
          <>
            <div className="card p-5">
              <p className="text-xs text-gray-500 mb-1">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{products.length}</p>
            </div>
            <div className="card p-5">
              <p className="text-xs text-gray-500 mb-1">Best Category</p>
              <p className="font-bold text-gray-900 capitalize">{bestCategory?.category || "–"}</p>
              <p className="text-xs text-gray-400">{bestCategory?.revenueShare || 0}% of revenue</p>
            </div>
            <div className="card p-5">
              <p className="text-xs text-gray-500 mb-1">Growing Products</p>
              <p className="text-2xl font-bold text-green-600">{growingProducts.length}</p>
            </div>
            <div className="card p-5">
              <p className="text-xs text-gray-500 mb-1">Declining Products</p>
              <p className="text-2xl font-bold text-red-500">{decliningProducts.length}</p>
            </div>
          </>
        )}
      </div>

      {/* Category chart + declining alert */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Revenue by Category</h2>
          <CategoryChart data={categories} loading={loading} />
        </div>

        <div className="lg:col-span-2 card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Category Breakdown</h2>
          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}
            </div>
          ) : categories.length === 0 ? (
            <EmptyState message="No category data" />
          ) : (
            <div className="space-y-3">
              {categories.map((cat, i) => (
                <div key={cat.category} className="flex items-center gap-3">
                  <div className="w-6 text-xs text-gray-400 text-right">{i + 1}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 capitalize">{cat.category}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">{cat.unitsSold} units</span>
                        <span className="text-sm font-semibold text-gray-900">{formatINR(cat.revenue)}</span>
                        <span className="text-xs text-gray-400 w-10 text-right">{cat.revenueShare}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${cat.revenueShare}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Product table */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">All Products</h2>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {[["revenue", "By Revenue"], ["units", "By Units"], ["name", "By Name"]].map(([val, lbl]) => (
              <button
                key={val}
                onClick={() => setSortBy(val)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  sortBy === val ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}
          </div>
        ) : sorted.length === 0 ? (
          <EmptyState message="No products found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 text-gray-500 font-medium">Product</th>
                  <th className="text-left py-3 text-gray-500 font-medium">Category</th>
                  <th className="text-right py-3 pr-4 text-gray-500 font-medium">Price</th>
                  <th className="text-right py-3 pr-4 text-gray-500 font-medium">Units Sold</th>
                  <th className="text-right py-3 pr-4 text-gray-500 font-medium">Revenue</th>
                  <th className="text-right py-3 text-gray-500 font-medium">Trend</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((p, i) => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 font-medium text-gray-900">{p.name}</td>
                    <td className="py-3 text-gray-500 capitalize">{p.category}</td>
                    <td className="py-3 pr-4 text-right text-gray-700">{formatINR(p.price)}</td>
                    <td className="py-3 pr-4 text-right text-gray-700">{p.unitsSold}</td>
                    <td className="py-3 pr-4 text-right font-semibold text-gray-900">{formatINR(p.revenue)}</td>
                    <td className="py-3 text-right">{trendBadge(p.trend)}</td>
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