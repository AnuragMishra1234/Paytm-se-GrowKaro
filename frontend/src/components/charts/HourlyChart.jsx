import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { formatINR } from "../../utils/formatters";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium text-gray-900 mb-1">{label}</p>
      <p className="text-blue-600">{formatINR(payload[0]?.value)} revenue</p>
      <p className="text-gray-500">{payload[1]?.value || 0} transactions</p>
    </div>
  );
};

export function HourlyChart({ data = [], loading = false }) {
  if (loading) return <div className="h-52 bg-gray-100 rounded-lg animate-pulse" />;
  if (!data.length) return <div className="h-52 flex items-center justify-center text-gray-400">No hourly data</div>;

  const maxRevenue = Math.max(...data.map((d) => d.revenue));

  return (
    <ResponsiveContainer width="100%" height={210}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
          interval={2}
        />
        <YAxis
          tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 10, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f3f4f6" }} />
        <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.revenue > maxRevenue * 0.7 ? "#3b82f6" : entry.revenue > maxRevenue * 0.3 ? "#93c5fd" : "#dbeafe"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}