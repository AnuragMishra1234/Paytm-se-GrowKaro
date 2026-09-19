import React from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { formatINR, formatDate } from "../../utils/formatters";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-card p-2.5 text-xs">
      <p className="text-slate-500 mb-1 font-medium">{formatDate(label, "long")}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-slate-600 capitalize">{p.name === "revenue" ? "Revenue" : "Transactions"}:</span>
          <span className="font-semibold text-slate-900 font-mono">
            {p.name === "revenue" ? formatINR(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export function RevenueChart({ data = [], loading = false }) {
  if (loading) {
    return <div className="h-64 bg-slate-100/70 rounded-lg animate-pulse" />;
  }

  if (!data.length) {
    return <div className="h-64 flex items-center justify-center text-xs text-slate-400">No revenue data available</div>;
  }

  // Label every 5th date for readability
  const formatted = data.map((d, i) => ({
    ...d,
    label: i % Math.max(1, Math.floor(data.length / 8)) === 0 ? formatDate(d.date) : "",
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={formatted} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.16} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
        <YAxis
          tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
          width={46}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#10b981"
          strokeWidth={2}
          fill="url(#revenueGrad)"
          dot={false}
          activeDot={{ r: 4, fill: "#059669", stroke: "#ffffff", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}