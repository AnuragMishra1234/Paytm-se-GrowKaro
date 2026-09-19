import React, { useState } from "react";
import { triggerSimulationScenario } from "../services/api";
import {
  SlidersHorizontal,
  Zap,
  RotateCcw,
  TrendingDown,
  Brain,
  FileText,
  Rocket,
  AlertTriangle,
  X,
} from "lucide-react";

export function LiveGrowKaroDemo({ merchantId, onActionComplete }) {
  const [loadingAction, setLoadingAction] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSimulate = async (scenario, label) => {
    if (!merchantId) return;
    setLoadingAction(scenario);
    setFeedback(null);

    try {
      const res = await triggerSimulationScenario(merchantId, scenario);
      setFeedback({
        type: "success",
        message: res.message || `${label} executed successfully.`,
      });
      if (onActionComplete) {
        onActionComplete(res.data);
      }
      setTimeout(() => setFeedback(null), 5000);
    } catch (err) {
      console.error(`Simulation ${scenario} failed:`, err);
      setFeedback({
        type: "error",
        message: err.message || `Failed to execute ${label}.`,
      });
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="card p-5 sm:p-6 bg-gradient-to-br from-indigo-900 via-[#002970] to-blue-950 text-white rounded-3xl space-y-4 shadow-xl border border-blue-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl bg-white/10 text-amber-300 flex items-center justify-center text-lg font-black shrink-0">
            ⚖️
          </span>
          <div>
            <h3 className="font-black text-sm sm:text-base text-white tracking-wide uppercase flex items-center gap-2">
              <span>Live GrowKaro Demo</span>
              <span className="text-[10px] bg-amber-400 text-gray-950 font-black px-2 py-0.5 rounded-full uppercase">
                Judge Controls
              </span>
            </h3>
            <p className="text-xs text-blue-200">
              One-click simulation loop: Transaction → Ledger → Pulse → AI Trigger → Daily Brief
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-blue-200 hover:text-white font-bold underline self-start sm:self-auto"
        >
          {showAdvanced ? "Hide Advanced Controls" : "More Demo Controls ▾"}
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3 rounded-xl text-xs font-bold animate-in fade-in flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-emerald-500/20 border border-emerald-400/50 text-emerald-200"
              : "bg-rose-500/20 border border-rose-400/50 text-rose-200"
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-white/60 hover:text-white font-bold">
            ✕
          </button>
        </div>
      )}

      {/* 5 Core Judge Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {/* 1. Simulate Sale */}
        <button
          onClick={() => handleSimulate("simulate-sale", "1. Simulate Sale")}
          disabled={Boolean(loadingAction)}
          className="p-3 bg-emerald-600/90 hover:bg-emerald-600 active:scale-98 rounded-2xl border border-emerald-400/40 text-left transition-all shadow-sm group"
        >
          <div className="text-base mb-1 group-hover:scale-110 transition-transform">⚡ 💰</div>
          <div className="text-xs font-black text-white leading-tight">1. Simulate Sale</div>
          <div className="text-[10px] text-emerald-200 mt-0.5">+₹450 Cold Brew combo</div>
        </button>

        {/* 2. Simulate Refund */}
        <button
          onClick={() => handleSimulate("simulate-refund", "2. Simulate Refund")}
          disabled={Boolean(loadingAction)}
          className="p-3 bg-rose-600/90 hover:bg-rose-600 active:scale-98 rounded-2xl border border-rose-400/40 text-left transition-all shadow-sm group"
        >
          <div className="text-base mb-1 group-hover:scale-110 transition-transform">↩️ 💸</div>
          <div className="text-xs font-black text-white leading-tight">2. Simulate Refund</div>
          <div className="text-[10px] text-rose-200 mt-0.5">-₹1,200 Cake return</div>
        </button>

        {/* 3. Simulate Sales Drop */}
        <button
          onClick={() => handleSimulate("sales-drop", "3. Simulate Sales Drop")}
          disabled={Boolean(loadingAction)}
          className="p-3 bg-amber-600/90 hover:bg-amber-600 active:scale-98 rounded-2xl border border-amber-400/40 text-left transition-all shadow-sm group"
        >
          <div className="text-base mb-1 group-hover:scale-110 transition-transform">📉 ⏱️</div>
          <div className="text-xs font-black text-white leading-tight">3. Sales Drop</div>
          <div className="text-[10px] text-amber-200 mt-0.5">2–4:30 PM Lull Alert</div>
        </button>

        {/* 4. Run AI Analysis */}
        <button
          onClick={() => handleSimulate("run-analysis", "4. Run AI Analysis")}
          disabled={Boolean(loadingAction)}
          className="p-3 bg-blue-600/90 hover:bg-blue-600 active:scale-98 rounded-2xl border border-blue-400/40 text-left transition-all shadow-sm group"
        >
          <div className="text-base mb-1 group-hover:scale-110 transition-transform">🧠 🔍</div>
          <div className="text-xs font-black text-white leading-tight">4. Run AI Analysis</div>
          <div className="text-[10px] text-blue-200 mt-0.5">Groq Anomaly Pipeline</div>
        </button>

        {/* 5. Generate Daily Brief */}
        <button
          onClick={() => handleSimulate("daily-brief", "5. Daily Brief")}
          disabled={Boolean(loadingAction)}
          className="p-3 bg-purple-600/90 hover:bg-purple-600 active:scale-98 rounded-2xl border border-purple-400/40 text-left transition-all shadow-sm group col-span-2 sm:col-span-1"
        >
          <div className="text-base mb-1 group-hover:scale-110 transition-transform">🌅 📋</div>
          <div className="text-xs font-black text-white leading-tight">5. Daily Brief</div>
          <div className="text-[10px] text-purple-200 mt-0.5">Morning facts summary</div>
        </button>
      </div>

      {/* Advanced Collapsible Scenarios */}
      {showAdvanced && (
        <div className="pt-2 border-t border-white/10 space-y-2">
          <div className="text-[11px] font-bold text-blue-200 uppercase tracking-wider">
            Extended Real-Data Scenarios:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => handleSimulate("boost-product", "Boost Cold Brew")}
              disabled={Boolean(loadingAction)}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-left text-xs font-bold transition-all border border-white/10"
            >
              🚀 Boost Cold Brew (+4 sales)
            </button>
            <button
              onClick={() => handleSimulate("decline-product", "Decline Cake Demand")}
              disabled={Boolean(loadingAction)}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-left text-xs font-bold transition-all border border-white/10"
            >
              🔻 Flag Item Decline (3 cycles)
            </button>
            <button
              onClick={() => handleSimulate("customer-return", "VIP Customer Return")}
              disabled={Boolean(loadingAction)}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-left text-xs font-bold transition-all border border-white/10"
            >
              🔄 VIP Return Visit (+₹1,450)
            </button>
            <button
              onClick={() => handleSimulate("customer-risk", "Customer Churn Risk")}
              disabled={Boolean(loadingAction)}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-left text-xs font-bold transition-all border border-white/10"
            >
              ⚠️ VIP Churn Interval (18d)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
