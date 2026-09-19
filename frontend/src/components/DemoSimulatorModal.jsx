import React, { useState } from "react";
import { useMerchantContext } from "../context/MerchantContext";
import { triggerSimulationScenario } from "../services/api";

export default function DemoSimulatorModal({ isOpen, onClose, onScenarioSuccess }) {
  const { merchant } = useMerchantContext();
  const [runningScenario, setRunningScenario] = useState(null);
  const [resultLog, setResultLog] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen || !merchant) return null;

  const scenarios = [
    {
      id: "sales-drop",
      title: "Simulate Afternoon Sales Drop",
      badge: "Act Now",
      badgeColor: "bg-rose-100 text-rose-800 border-rose-200",
      description:
        "Simulates a 38% revenue dip during 2:00 PM – 5:00 PM. Triggers deterministic detector, AI recommendation, drafts a flash campaign, and fires an Action Required notification.",
      pipeline: "Observe → Detect Sales Drop → AI Recommendation → Action Draft → Push Notification",
    },
    {
      id: "weather-rain",
      title: "Simulate Monsoon Rain Opportunity",
      badge: "Opportunity",
      badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
      description:
        "Injects real-time monsoon rainfall weather context for the merchant's city. Detects delivery boost opportunity, drafts weather-tailored campaign, and sends notification.",
      pipeline: "External Context (Weather) → Opportunity Insight → Action Draft → Notification",
    },
    {
      id: "measure-outcome",
      title: "Simulate Campaign Outcome & Learning",
      badge: "Measure & Learn",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
      description:
        "Measures post-campaign baseline vs observed metrics for an approved action. Computes deterministic revenue delta, updates Cognee business memory, and notifies merchant.",
      pipeline: "Approved Action → Deterministic Delta Calculation → Memory Update → Notification",
    },
    {
      id: "daily-brief",
      title: "Trigger Morning Business Brief",
      badge: "Daily Intelligence",
      badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
      description:
        "Synthesizes 24-hour revenue, morning weather forecast, high-priority actions, and merchant memories into an executive morning briefing.",
      pipeline: "Multi-Source Analytics + Weather + Memory → Daily Brief → Notification",
    },
  ];

  const handleRun = async (scenarioId) => {
    try {
      setRunningScenario(scenarioId);
      setError(null);
      setResultLog(null);

      const res = await triggerSimulationScenario(merchant._id, scenarioId);

      if (res.success) {
        setResultLog({
          scenario: scenarioId,
          timestamp: new Date().toLocaleTimeString(),
          data: res.data,
        });
        if (onScenarioSuccess) {
          onScenarioSuccess(res.data);
        }
      }
    } catch (err) {
      setError(err.message || "Failed to execute scenario");
    } finally {
      setRunningScenario(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-200/90 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="font-extrabold text-gray-900 text-lg">
                Merchant Scenario Simulator
              </h3>
              <p className="text-xs text-gray-500">
                Evaluation & live testing tool · Runs the real GrowKaro agentic pipeline
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-200/70 hover:bg-gray-300 text-gray-600 flex items-center justify-center text-sm font-bold transition-all"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-200/70 text-xs text-blue-900">
            <strong>Active Target:</strong> {merchant.businessName} ({merchant.businessType}) in{" "}
            {merchant.location?.city || "India"}. Clicking a scenario will execute real backend logic, update MongoDB, and notify the merchant center.
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium">
              {error}
            </div>
          )}

          {/* Scenario Cards */}
          <div className="space-y-3">
            {scenarios.map((sc) => {
              const isRunning = runningScenario === sc.id;
              return (
                <div
                  key={sc.id}
                  className="p-4 rounded-2xl border border-gray-200/90 hover:border-gray-300 bg-white transition-all shadow-2xs hover:shadow-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sc.badgeColor}`}
                        >
                          {sc.badge}
                        </span>
                        <h4 className="font-bold text-sm text-gray-900">{sc.title}</h4>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">{sc.description}</p>
                      <p className="text-[11px] font-mono text-gray-400">
                        ↳ Pipeline: {sc.pipeline}
                      </p>
                    </div>

                    <button
                      onClick={() => handleRun(sc.id)}
                      disabled={!!runningScenario}
                      className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ${
                        isRunning
                          ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                          : "bg-[#002970] text-white hover:bg-blue-800 hover:shadow-md active:scale-95"
                      }`}
                    >
                      {isRunning ? (
                        <>
                          <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Running...</span>
                        </>
                      ) : (
                        <>
                          <span>Run Scenario</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Live Output Console */}
          {resultLog && (
            <div className="mt-4 p-4 rounded-2xl bg-gray-900 text-emerald-400 font-mono text-xs overflow-x-auto shadow-inner">
              <div className="flex items-center justify-between text-gray-400 border-b border-gray-800 pb-2 mb-2">
                <span>Console Output · {resultLog.timestamp}</span>
                <span className="text-emerald-400 font-bold">SCENARIO EXECUTED</span>
              </div>
              <pre className="whitespace-pre-wrap text-[11px] leading-relaxed">
                {JSON.stringify(resultLog.data, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>Close this window to check notifications or dashboard</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
