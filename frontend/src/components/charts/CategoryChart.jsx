import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatINR } from "../../utils/formatters";

// Curated calm palette: Emerald, Blue, Indigo, Amber, Teal, Slate
const COLORS = ["#10b981", "#3b82f6", "#6366f1", "#f59e0b", "#14b8a6", "#64748b", "#ec4899", "#8b5cf6"];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-card p-2.5 text-xs">
      <p className="font-semibold text-slate-900 capitalize mb-0.5">{d.category}</p>
      <p className="text-emerald-700 font-mono font-medium">{formatINR(d.revenue)}</p>
      <p className="text-slate-500 font-mono">{d.revenueShare}% of total</p>
    </div>
  );
};

export function CategoryChart({ data = [], loading = false }) {
  if (loading) return <div className="h-52 bg-slate-100/70 rounded-lg animate-pulse" />;
  if (!data.length) return <div className="h-52 flex items-center justify-center text-xs text-slate-400">No category data</div>;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          dataKey="revenue"
          nameKey="category"
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={78}
          paddingAngle={2}
          stroke="#ffffff"
          strokeWidth={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => <span className="text-[11px] text-slate-600 font-medium capitalize">{value}</span>}
          iconSize={8}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}