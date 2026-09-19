import React from "react";

export function BusinessPulseWidget({ pulse, lastUpdatedText = "Just now" }) {
  if (!pulse) {
    return (
      <div className="card p-5 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-28 mb-3" />
        <div className="h-7 bg-gray-200 rounded w-48 mb-2" />
        <div className="h-3 bg-gray-100 rounded w-full" />
      </div>
    );
  }

  const { score = 75, status = "HEALTHY", label = "Healthy", summary, factors = [] } = pulse;

  const barColor =
    score >= 75 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-rose-500";

  const isHealthy = score >= 75;
  const isWarning = score >= 50 && score < 75;

  return (
    <div className="card p-5 sm:p-6 space-y-3.5 border-2 transition-all hover:shadow-md">
      {/* Top row: Header & LIVE Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M2.25 12h3.75l2.25-6 4.5 12 2.25-6h5.25" />
            </svg>
          </div>
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-gray-950 leading-tight">
              Business Pulse &amp; Health
            </h3>
            <p className="text-[11px] text-gray-400">Deterministic real-time vitality index</p>
          </div>
        </div>

        {/* Live Indicator Badge */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs font-bold text-gray-700 shadow-2xs">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-extrabold text-emerald-700 text-[11px] tracking-wide">LIVE</span>
          <span className="text-[10px] text-gray-400">· {lastUpdatedText}</span>
        </div>
      </div>

      {/* Main Status & Gauge */}
      <div className="flex items-center justify-between gap-4 pt-1">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center border shrink-0 ${
              isHealthy
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : isWarning
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-rose-50 text-rose-700 border-rose-200"
            }`}
          >
            {isHealthy ? (
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : isWarning ? (
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-gray-950">{label}</span>
              <span
                className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md border ${
                  isHealthy
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                    : isWarning
                    ? "bg-amber-50 text-amber-800 border-amber-300"
                    : "bg-rose-50 text-rose-800 border-rose-300"
                }`}
              >
                {status.replace("_", " ")}
              </span>
            </div>
            <div className="text-xs text-gray-500 font-medium mt-0.5">
              Confidence score: <strong>{score}</strong> / 100
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-2xl sm:text-3xl font-black text-gray-950">{score}%</div>
          <div className="text-[10px] uppercase font-bold text-gray-400">Operational Health</div>
        </div>
      </div>

      {/* Visual meter bar */}
      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${barColor}`}
          style={{ width: `${Math.min(100, Math.max(10, score))}%` }}
        />
      </div>

      {/* Operational summary */}
      <p className="text-xs text-gray-700 leading-relaxed font-normal bg-gray-50 p-2.5 rounded-xl border border-gray-200/80">
        {summary || "Telemetry signals reflect normal operating velocity with standard transaction metrics."}
      </p>

      {/* Contributing Factor Chips */}
      {factors.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <div className="text-[10px] font-black uppercase tracking-wider text-gray-400">
            Real-Time Deterministic Drivers:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {factors.map((f, i) => (
              <span
                key={i}
                className={`text-[11px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                  f.type === "POSITIVE"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-rose-50 text-rose-800 border-rose-200"
                }`}
              >
                <span>{f.type === "POSITIVE" ? "↑" : "↓"}</span>
                <span>{f.label}</span>
                <span className="opacity-75 font-mono text-[10px]">{f.impact}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
export default BusinessPulseWidget;
