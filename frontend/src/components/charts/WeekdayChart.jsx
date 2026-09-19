import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { formatINR } from "../../utils/formatters";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-card p-2.5 text-xs">
      <p className="font-semibold text-slate-900 mb-1">{label}</p>
      <p className="text-emerald-700 font-mono font-medium">{formatINR(payload[0]?.value)}</p>
      <p className="text-slate-500 font-mono">{payload[1]?.value || 0} transactions</p>
    </div>
  );
};

export function WeekdayChart({ data = [], loading = false }) {
  if (loading) return <div className="h-52 bg-slate-100/70 rounded-lg animate-pulse" />;
  if (!data.length) return <div className="h-52 flex items-center justify-center text-xs text-slate-400">No weekday data</div>;

  const maxRevenue = Math.max(...data.map((d) => d.revenue));

  return (
    <ResponsiveContainer width="100%" height={210}>
      <BarChart data={data} margin={{ top: 8, right: 5, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
        <YAxis
          tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 10, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
          width={38}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
        <Bar dataKey="revenue" radius={[3, 3, 0, 0]}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={
                entry.revenue === maxRevenue
                  ? "#10b981"
                  : entry.revenue > maxRevenue * 0.75
                  ? "#34d399"
                  : "#cbd5e1"
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}