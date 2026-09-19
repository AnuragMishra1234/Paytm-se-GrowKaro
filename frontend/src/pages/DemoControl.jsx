import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  resetDemoEnvironment,
  fetchDemoStatus,
  triggerSimulationScenario,
} from "../services/api";

export default function DemoControl() {
  const [status, setStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [runningAction, setRunningAction] = useState(null);
  const [consoleLog, setConsoleLog] = useState([]);
  const [error, setError] = useState(null);

  const loadStatus = async () => {
    try {
      setLoadingStatus(true);
      setError(null);
      const res = await fetchDemoStatus();
      if (res.success) {
        setStatus(res.data);
      }
    } catch (err) {
      setError(err.message || "Failed to load demo status");
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const addLog = (title, data) => {
    setConsoleLog((prev) => [
      {
        id: Date.now(),
        time: new Date().toLocaleTimeString(),
        title,
        data,
      },
      ...prev.slice(0, 15),
    ]);
  };

  const handleResetDemo = async () => {
    try {
      setRunningAction("reset");
      setError(null);
      const res = await resetDemoEnvironment();
      if (res.success) {
        addLog("DEMO RESET COMPLETE", res.data);
        await loadStatus();
      }
    } catch (err) {
      setError(err.message || "Reset failed");
    } finally {
      setRunningAction(null);
    }
  };

  const handleRunScenario = async (scenarioId, label) => {
    if (!status?.merchant?.id) return;
    try {
      setRunningAction(scenarioId);
      setError(null);
      const res = await triggerSimulationScenario(status.merchant.id, scenarioId);
      if (res.success) {
        addLog(`SCENARIO: ${label}`, res.data);
        await loadStatus();
      }
    } catch (err) {
      setError(err.message || `Scenario ${scenarioId} failed`);
    } finally {
      setRunningAction(null);
    }
  };

  const scenarios = [
    {
      id: "sales-drop",
      title: "Simulate Afternoon Sales Drop",
      badge: "Act Now",
      badgeColor: "bg-rose-100 text-rose-800 border-rose-300",
      description:
        "Simulates a 31% revenue dip during 2:00 PM – 4:30 PM. Deterministic detector flags the lull, Groq crafts the ₹199 Cold Brew Combo, and an Action Required alert is sent to the bell.",
      buttonText: "⚡ Trigger Sales Drop",
      buttonColor: "bg-rose-600 hover:bg-rose-700 text-white",
    },
    {
      id: "weather-rain",
      title: "Simulate Monsoon Rain Context",
      badge: "Opportunity",
      badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
      description:
        "Injects real-time Bengaluru monsoon drizzle telemetry (21°C, 88% humidity). AI crafts a warm beverage & snack promotion and drafts a WhatsApp campaign.",
      buttonText: "🌧️ Trigger Monsoon Rain",
      buttonColor: "bg-blue-600 hover:bg-blue-700 text-white",
    },
    {
      id: "measure-outcome",
      title: "Simulate Outcome Measurement & Learning",
      badge: "Measure & Learn",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
      description:
        "Calculates pre vs. post campaign revenue delta (+37.4% observed change). Persists honest non-causal attribution to MongoDB and stores learned strategy into Cognee memory.",
      buttonText: "📈 Measure Outcome",
      buttonColor: "bg-emerald-600 hover:bg-emerald-700 text-white",
    },
    {
      id: "daily-brief",
      title: "Trigger Morning Business Brief",
      badge: "Daily Intelligence",
      badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
      description:
        "Synthesizes weather forecast, today's revenue pulse, and priority action items into an executive morning briefing, creating a DAILY_BRIEF alert.",
      buttonText: "☀️ Trigger Daily Brief",
      buttonColor: "bg-purple-600 hover:bg-purple-700 text-white",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-6 sm:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Navbar */}
        <div className="flex items-center justify-between bg-white p-4 sm:p-5 rounded-3xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-700 text-white font-black flex items-center justify-center text-lg shadow-sm">
              🛠️
            </div>
            <div>
              <h1 className="font-extrabold text-gray-900 text-lg sm:text-xl leading-tight">
                Developer Demo Controller &amp; Reset Panel
              </h1>
              <p className="text-xs text-gray-500 font-medium">
                Presentation tooling · Isolated from merchant navigation
              </p>
            </div>
          </div>

          <Link
            to="/dashboard"
            className="px-4 py-2 bg-[#002970] text-white hover:bg-blue-900 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
          >
            <span>← Return to Merchant Workspace</span>
          </Link>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 font-bold">
            ⚠️ {error}
          </div>
        )}

        {/* Status Dashboard Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-2xs">
            <p className="text-[11px] font-bold text-gray-400 uppercase">Target Merchant</p>
            <p className="text-base font-extrabold text-gray-900 mt-0.5 truncate">
              {status?.merchant?.name || "Cafe Aroma"}
            </p>
            <p className="text-[11px] text-gray-400">{status?.merchant?.city || "Bengaluru"}</p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-2xs">
            <p className="text-[11px] font-bold text-gray-400 uppercase">n8n Execution Mode</p>
            <p className="text-base font-extrabold text-emerald-700 mt-0.5">
              {status?.n8nMode === "real" ? "Live n8n" : "Demo Sandbox"}
            </p>
            <p className="text-[11px] text-gray-400 truncate">{status?.n8nLabel || "Sandbox active"}</p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-2xs">
            <p className="text-[11px] font-bold text-gray-400 uppercase">Pending Approvals</p>
            <p className="text-2xl font-black text-amber-600 mt-0.5">
              {loadingStatus ? "..." : status?.counts?.pendingActions ?? 0}
            </p>
            <p className="text-[11px] text-gray-400">Clean baseline = 1</p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-2xs">
            <p className="text-[11px] font-bold text-gray-400 uppercase">Unread Notifications</p>
            <p className="text-2xl font-black text-rose-600 mt-0.5">
              {loadingStatus ? "..." : status?.counts?.unreadNotifications ?? 0}
            </p>
            <p className="text-[11px] text-gray-400">Clean baseline = 1</p>
          </div>
        </div>

        {/* Primary Reset Card */}
        <div className="p-6 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-white rounded-3xl border border-amber-300 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-500 text-white shadow-2xs">
                Essential for Live Presentations
              </span>
              <span className="text-xs font-bold text-amber-950">
                Safe Presentation Reset
              </span>
            </div>
            <h3 className="text-lg font-black text-gray-950">
              Reset Cafe Aroma to Pristine Clean Baseline
            </h3>
            <p className="text-xs text-gray-600 max-w-2xl leading-relaxed">
              Clears accumulated test actions, duplicate campaigns, and old clutter notifications while preserving historical transactions (~5,234), products, and customers. Leaves exactly <strong>1 pending action</strong>, <strong>1 unread notification</strong>, and <strong>1 completed past campaign</strong>.
            </p>
          </div>

          <button
            onClick={handleResetDemo}
            disabled={runningAction === "reset"}
            className="shrink-0 px-6 py-3.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-extrabold rounded-2xl text-xs sm:text-sm shadow-md transition-all flex items-center gap-2"
          >
            {runningAction === "reset" ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Resetting Demo...</span>
              </>
            ) : (
              <>
                <span>🔄 Reset Demo to Clean Baseline</span>
              </>
            )}
          </button>
        </div>

        {/* Scenario Simulator Triggers */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 space-y-4">
          <div>
            <h3 className="text-base font-extrabold text-gray-950">
              Autonomous Pipeline Scenarios
            </h3>
            <p className="text-xs text-gray-500">
              Click any scenario to execute the real GrowKaro backend pipeline (Analytics ➔ Growth Detector ➔ Groq AI ➔ Notification)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scenarios.map((sc) => {
              const isRunning = runningAction === sc.id;
              return (
                <div
                  key={sc.id}
                  className="p-4 rounded-2xl border border-gray-200 bg-gray-50/40 hover:bg-white hover:border-gray-300 hover:shadow-2xs transition-all space-y-2.5 flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sc.badgeColor}`}
                      >
                        {sc.badge}
                      </span>
                      {isRunning && (
                        <span className="text-[10px] font-bold text-blue-600 animate-pulse">
                          Running pipeline...
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-sm text-gray-900">{sc.title}</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">{sc.description}</p>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => handleRunScenario(sc.id, sc.title)}
                      disabled={!!runningAction}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all shadow-2xs active:scale-98 flex items-center justify-center gap-1.5 ${
                        isRunning
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : sc.buttonColor
                      }`}
                    >
                      {isRunning ? (
                        <>
                          <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Executing...</span>
                        </>
                      ) : (
                        <span>{sc.buttonText}</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Interactive Console Log */}
        <div className="bg-gray-900 rounded-3xl p-6 shadow-md text-emerald-400 font-mono text-xs space-y-3">
          <div className="flex items-center justify-between border-b border-gray-800 pb-2 text-gray-400">
            <span className="font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Real-Time Pipeline Console Log</span>
            </span>
            {consoleLog.length > 0 && (
              <button
                onClick={() => setConsoleLog([])}
                className="text-[10px] text-gray-500 hover:text-gray-300"
              >
                Clear Log
              </button>
            )}
          </div>

          {consoleLog.length === 0 ? (
            <p className="text-gray-500 text-xs py-4 text-center">
              No actions triggered yet. Click "Reset Demo" or run any scenario above to see live pipeline execution data.
            </p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {consoleLog.map((item) => (
                <div key={item.id} className="p-3 bg-gray-950/80 rounded-xl border border-gray-800">
                  <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                    <span className="font-bold text-white">{item.title}</span>
                    <span>{item.time}</span>
                  </div>
                  <pre className="text-[11px] text-emerald-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {JSON.stringify(item.data, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
