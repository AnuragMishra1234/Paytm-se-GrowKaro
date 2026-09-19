import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatINR } from "../../utils/formatters";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium text-gray-900 capitalize">{d.category}</p>
      <p className="text-blue-600">{formatINR(d.revenue)}</p>
      <p className="text-gray-500">{d.revenueShare}% of total</p>
    </div>
  );
};

export function CategoryChart({ data = [], loading = false }) {
  if (loading) return <div className="h-52 bg-gray-100 rounded-lg animate-pulse" />;
  if (!data.length) return <div className="h-52 flex items-center justify-center text-gray-400">No category data</div>;

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
          outerRadius={80}
          paddingAngle={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => <span className="text-xs text-gray-600 capitalize">{value}</span>}
          iconSize={10}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}