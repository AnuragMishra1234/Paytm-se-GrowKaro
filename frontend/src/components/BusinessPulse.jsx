import React from "react";

/**
 * BusinessPulse — Phase 1 placeholder for what Phase 2 will replace
 * with AI-generated priority feed (Growth Detector + Groq).
 *
 * Shows deterministic business pattern flags calculated from analytics data.
 * No AI / LLM involved. Phase 2 will replace this with intelligent insights.
 */
export function BusinessPulse({ dashboardData, loading = false }) {
  if (loading) {
    return (
      <div className="card p-6 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-36 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!dashboardData) return null;

  const { kpis, hourlySales, weekdaySales } = dashboardData;

  const flags = [];

  // Revenue change flag
  if (kpis?.changes?.revenue != null) {
    const change = kpis.changes.revenue;
    if (change <= -10) {
      flags.push({
        type: "warning",
        icon: "📉",
        title: "Revenue is down today",
        detail: `${Math.abs(change).toFixed(1)}% below yesterday`,
        color: "border-red-200 bg-red-50",
        textColor: "text-red-700",
      });
    } else if (change >= 15) {
      flags.push({
        type: "positive",
        icon: "📈",
        title: "Strong revenue today",
        detail: `${change.toFixed(1)}% above yesterday`,
        color: "border-green-200 bg-green-50",
        textColor: "text-green-700",
      });
    }
  }

  // Detect weak hour window
  if (hourlySales?.length) {
    const maxRevenue = Math.max(...hourlySales.map((h) => h.revenue));
    const threshold = maxRevenue * 0.15;
    const afternoonWeak = hourlySales.slice(14, 17).every((h) => h.revenue < threshold);
    if (afternoonWeak && maxRevenue > 0) {
      flags.push({
        type: "opportunity",
        icon: "💡",
        title: "Weak afternoon window",
        detail: "2–5 PM shows consistently lower activity",
        color: "border-blue-200 bg-blue-50",
        textColor: "text-blue-700",
      });
    }
  }

  // Detect strongest weekday
  if (weekdaySales?.length) {
    const sorted = [...weekdaySales].sort((a, b) => b.revenue - a.revenue);
    if (sorted[0]?.revenue > 0) {
      flags.push({
        type: "info",
        icon: "🗓️",
        title: `${sorted[0].day} is your strongest day`,
        detail: `Followed by ${sorted[1]?.day || "–"}`,
        color: "border-gray-200 bg-gray-50",
        textColor: "text-gray-700",
      });
    }
  }

  // Repeat customer flag
  if (kpis?.repeatCustomerPct > 50) {
    flags.push({
      type: "positive",
      icon: "🔄",
      title: "Strong repeat customer base",
      detail: `${kpis.repeatCustomerPct}% of recent customers returned`,
      color: "border-green-200 bg-green-50",
      textColor: "text-green-700",
    });
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">Business Pulse</h3>
          <p className="text-xs text-gray-400 mt-0.5">Pattern-based flags · AI insights coming in Phase 2</p>
        </div>
        <span className="badge bg-blue-100 text-blue-700">Phase 1</span>
      </div>

      {flags.length === 0 ? (
        <div className="text-center py-6 text-gray-400 text-sm">
          No notable patterns detected. Check back after more data accumulates.
        </div>
      ) : (
        <div className="space-y-3">
          {flags.map((flag, i) => (
            <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${flag.color}`}>
              <span className="text-xl">{flag.icon}</span>
              <div>
                <p className={`text-sm font-medium ${flag.textColor}`}>{flag.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{flag.detail}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}