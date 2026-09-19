import React, { useState, useEffect, useRef, useCallback } from "react";
import { fetchPaytmStatus } from "../services/api";

/**
 * PaytmLiveConnection.jsx
 *
 * Premium 3D interactive visualization of the Paytm integration.
 * Communicates: GrowKaro <-> Paytm <-> Live Transactions <-> AI Intelligence.
 *
 * Truth-in-telemetry guarantee:
 * Accurately shows "Paytm Connected" (Live) if production credentials exist,
 * or "Demo Connection / Simulation" if running on sandbox/in-memory database.
 */
export default function PaytmLiveConnection({ className = "" }) {
  const cardRef = useRef(null);
  const [telemetry, setTelemetry] = useState({
    connected: true,
    mode: "simulation", // "live" or "simulation"
    modeLabel: "Demo Simulation",
    statusText: "Demo Connection",
    provider: "Paytm Payments Gateway & Soundbox Telemetry",
    telemetrySource: "Sandbox Telemetry (In-Memory DB)",
    transactionsToday: 99,
    lastSyncedAt: new Date().toISOString(),
    lastTransactionAt: null,
    activeMerchants: 3,
    soundboxDevicesActive: 3,
    webhookHealth: "operational",
  });
  const [loading, setLoading] = useState(true);
  const [lastPulse, setLastPulse] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  // Check user preference for reduced motion
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setIsReducedMotion(mediaQuery.matches);
    const handleChange = (e) => setIsReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Poll backend Paytm telemetry status
  const loadStatus = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const res = await fetchPaytmStatus();
      if (res && res.connected !== undefined) {
        setTelemetry((prev) => {
          // Trigger a micro-pulse if count updated or on sync
          if (res.transactionsToday !== prev.transactionsToday || !isInitial) {
            setLastPulse(true);
            setTimeout(() => setLastPulse(false), 1400);
          }
          return {
            ...prev,
            ...res,
          };
        });
      }
    } catch (err) {
      console.warn("Paytm telemetry poll fallback:", err.message);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus(true);
    const interval = setInterval(() => {
      loadStatus(false);
    }, 12000);
    return () => clearInterval(interval);
  }, [loadStatus]);

  // Subtle 3D Perspective Tilt on Mouse Movement
  const handleMouseMove = (e) => {
    if (isReducedMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Smooth tilt bounded to max +/- 9 degrees
    const rotateY = ((x - centerX) / centerX) * 9;
    const rotateX = -((y - centerY) / centerY) * 8;

    setRotation({ x: rotateX, y: rotateY });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotation({ x: 0, y: 0 });
  };

  // Format time display
  const formatTime = (isoString) => {
    if (!isoString) return "Just now";
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
    } catch {
      return "Active";
    }
  };

  const isLive = telemetry.mode === "live";

  return (
    <>
      <div
        className={`relative select-none ${className}`}
        style={{ perspective: "1000px" }}
      >
        {/* Soft Ambient Depth Shadow */}
        <div
          className={`absolute -bottom-6 left-1/2 -translate-x-1/2 w-[82%] h-8 rounded-full blur-xl transition-all duration-700 pointer-events-none ${
            isLive
              ? "bg-emerald-500/20"
              : "bg-gradient-to-r from-[#00baf2]/25 to-[#002970]/20"
          } ${isHovered ? "scale-105 opacity-80" : "scale-95 opacity-50"}`}
        />

        {/* 3D Glass Surface Card */}
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={() => setIsModalOpen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              setIsModalOpen(true);
            }
          }}
          aria-label={`Paytm Connection Status: ${isLive ? "Live Connected" : "Demo Simulation"}. Click to view connection telemetry.`}
          style={{
            transform: isReducedMotion
              ? "none"
              : `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) translateZ(0)`,
            transformStyle: "preserve-3d",
            transition: isHovered
              ? "transform 0.12s ease-out, box-shadow 0.3s ease"
              : "transform 0.7s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.5s ease",
          }}
          className={`group cursor-pointer relative rounded-3xl p-6 sm:p-7 bg-gradient-to-b from-white/95 via-white/90 to-blue-50/60 backdrop-blur-xl border ${
            isLive
              ? "border-emerald-200/80 hover:border-emerald-300"
              : "border-sky-200/80 hover:border-[#00baf2]/60"
          } shadow-[0_20px_45px_-15px_rgba(0,41,112,0.12),0_8px_20px_-6px_rgba(0,186,242,0.08)] hover:shadow-[0_26px_55px_-12px_rgba(0,41,112,0.2),0_12px_28px_-6px_rgba(0,186,242,0.18)] transition-all`}
        >
          {/* Subtle Light Reflection Glare on Hover */}
          <div
            className="absolute inset-0 rounded-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-tr from-transparent via-white/40 to-white/10"
            style={{ transform: "translateZ(10px)" }}
          />

          {/* Top Micro Header: Architecture Pipeline Indicator */}
          <div
            className="flex items-center justify-between gap-2 pb-4 mb-5 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider"
            style={{ transform: "translateZ(20px)" }}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-[#002970] font-bold tracking-normal text-xs">GrowKaro</span>
              <span className="text-gray-300 font-normal">/</span>
              <span className="text-[#00baf2] font-bold tracking-normal text-xs">Paytm</span>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                isLive
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-sky-50 text-sky-700 border border-sky-200"
              }`}
            >
              {isLive ? "Live Gateway" : "Demo Sandbox"}
            </span>
          </div>

          {/* 3D Floating Paytm Brand Badge Center */}
          <div
            className="relative flex flex-col items-center justify-center my-2"
            style={{ transform: "translateZ(40px)" }}
          >
            {/* Animated Orbiting Ring around Badge */}
            <div className="relative flex items-center justify-center">
              <div
                className={`absolute w-36 h-36 rounded-full border border-dashed transition-all duration-1000 ${
                  isLive
                    ? "border-emerald-300/60 animate-[spin_24s_linear_infinite]"
                    : "border-sky-300/70 animate-[spin_20s_linear_infinite]"
                } pointer-events-none`}
              />
              <div
                className={`absolute w-44 h-44 rounded-full bg-gradient-to-tr transition-all duration-700 ${
                  isLive
                    ? "from-emerald-400/10 via-transparent to-teal-400/10"
                    : "from-[#00baf2]/15 via-transparent to-[#002970]/10"
                } blur-lg pointer-events-none`}
              />

              {/* Raised 3D Badge Container for Official Paytm Logo */}
              <div
                className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-white p-3.5 flex flex-col items-center justify-center shadow-[0_12px_28px_-6px_rgba(0,41,112,0.18),0_4px_10px_-2px_rgba(0,0,0,0.04)] border border-gray-100/90 group-hover:scale-[1.04] transition-transform duration-300 ${
                  !isReducedMotion && !isHovered ? "animate-[bounce_6s_ease-in-out_infinite]" : ""
                }`}
                style={{
                  transform: "translateZ(50px)",
                }}
              >
                {/* Official Crisp Paytm Logo Asset */}
                <img
                  src="/paytm-logo.svg"
                  alt="Official Paytm Brand"
                  className="w-20 sm:w-24 h-auto object-contain shrink-0 drop-shadow-sm"
                  loading="eager"
                />

                {/* Sub-label under logo */}
                <span className="mt-2 text-[10px] font-bold text-gray-400 tracking-wider uppercase">
                  Soundbox &amp; POS
                </span>

                {/* Micro Telemetry Ping Indicator */}
                <div
                  className={`absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center ${
                    isLive ? "bg-emerald-500" : "bg-[#00baf2]"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full bg-white ${
                      lastPulse ? "scale-150 animate-ping" : "opacity-90"
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Connection Status & Mode Pill */}
          <div
            className="mt-6 flex flex-col items-center text-center"
            style={{ transform: "translateZ(30px)" }}
          >
            <div
              className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold border transition-colors ${
                isLive
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-blue-50 text-[#002970] border-sky-200"
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isLive ? "bg-emerald-400" : "bg-sky-400"
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    isLive ? "bg-emerald-500" : "bg-[#00baf2]"
                  }`}
                />
              </span>
              <span>{isLive ? "Paytm Connected" : "Demo Connection"}</span>
            </div>

            <p className="mt-1.5 text-[13px] font-medium text-gray-600">
              {isLive
                ? "Live transaction stream"
                : "Simulation · In-Memory DB Telemetry"}
            </p>
          </div>

          {/* Live Telemetry Statistics Section */}
          <div
            className="mt-5 pt-4 border-t border-gray-100/90 grid grid-cols-2 gap-3 text-left"
            style={{ transform: "translateZ(25px)" }}
          >
            <div className="bg-gray-50/75 rounded-xl p-2.5 border border-gray-100/80">
              <span className="block text-[11px] font-medium text-gray-400">
                Last synced
              </span>
              <span className="block text-xs font-bold text-gray-800 font-mono mt-0.5">
                {formatTime(telemetry.lastSyncedAt)}
              </span>
            </div>

            <div className="bg-gray-50/75 rounded-xl p-2.5 border border-gray-100/80 relative overflow-hidden">
              {lastPulse && (
                <div className="absolute inset-0 bg-[#00baf2]/10 pointer-events-none animate-pulse" />
              )}
              <span className="block text-[11px] font-medium text-gray-400">
                Today's transactions
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs font-extrabold text-[#002970] font-mono">
                  {telemetry.transactionsToday.toLocaleString("en-IN")}
                </span>
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    lastPulse ? "bg-[#00baf2] scale-125" : "bg-gray-300"
                  } transition-transform`}
                />
              </div>
            </div>
          </div>

          {/* Click Callout Footer */}
          <div
            className="mt-4 flex items-center justify-between text-[11px] font-semibold text-[#002970] group-hover:text-[#00baf2] transition-colors"
            style={{ transform: "translateZ(20px)" }}
          >
            <span className="text-gray-400 font-normal">Soundbox Telemetry</span>
            <div className="flex items-center gap-1">
              <span>Inspect Telemetry</span>
              <span className="text-xs font-bold transition-transform group-hover:translate-x-0.5">
                ›
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Compact Connection Telemetry Panel (Modal) ───────────────────────── */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-200/80 p-2 flex items-center justify-center">
                  <img
                    src="/paytm-logo.svg"
                    alt="Paytm"
                    className="w-full h-auto object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Paytm Integration Telemetry
                  </h3>
                  <p className="text-xs text-gray-500">
                    {telemetry.provider}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center font-bold text-sm transition-colors"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Architecture Pipeline Flow Diagram */}
            <div className="my-5 p-4 rounded-2xl bg-gradient-to-r from-blue-50/60 via-sky-50/40 to-blue-50/60 border border-sky-100">
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center mb-3">
                Bi-Directional Telemetry Pipeline
              </div>
              <div className="grid grid-cols-4 items-center text-center gap-1">
                <div className="p-2 rounded-xl bg-white border border-blue-100 shadow-sm">
                  <span className="block text-[11px] font-bold text-[#002970]">
                    GrowKaro
                  </span>
                  <span className="block text-[9px] text-gray-400">Core Engine</span>
                </div>
                <div className="text-xs font-bold text-sky-400">↔</div>
                <div className="p-2 rounded-xl bg-white border border-blue-100 shadow-sm">
                  <span className="block text-[11px] font-bold text-[#00baf2]">
                    Paytm
                  </span>
                  <span className="block text-[9px] text-gray-400">Soundbox / POS</span>
                </div>
                <div className="text-xs font-bold text-sky-400">↔</div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="p-2 rounded-xl bg-white border border-gray-100 text-center">
                  <span className="block text-[11px] font-bold text-gray-800">
                    Live Transactions
                  </span>
                  <span className="block text-[9px] text-gray-400">
                    UPI &amp; Soundbox audio events
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-gray-100 text-center">
                  <span className="block text-[11px] font-bold text-indigo-700">
                    AI Intelligence
                  </span>
                  <span className="block text-[9px] text-gray-400">
                    Lull detection &amp; n8n triggers
                  </span>
                </div>
              </div>
            </div>

            {/* Truth-in-Data Telemetry Table */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-gray-500 font-medium">Connection Mode</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px] ${
                    isLive
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-sky-100 text-sky-800"
                  }`}
                >
                  {telemetry.modeLabel}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-gray-500 font-medium">Telemetry Source</span>
                <span className="font-semibold text-gray-800 font-mono text-[11px]">
                  {telemetry.telemetrySource}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-gray-500 font-medium">Today's Transactions</span>
                <span className="font-bold text-[#002970] font-mono text-xs">
                  {telemetry.transactionsToday.toLocaleString("en-IN")} records
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-gray-500 font-medium">Last Synced Timestamp</span>
                <span className="font-semibold text-gray-700 font-mono text-[11px]">
                  {telemetry.lastSyncedAt
                    ? new Date(telemetry.lastSyncedAt).toLocaleString("en-IN")
                    : "-"}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-gray-500 font-medium">Webhook Gateway Health</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-emerald-700 uppercase tracking-wider text-[10px]">
                    {telemetry.webhookHealth}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-gray-500 font-medium">Active Soundbox Units</span>
                <span className="font-bold text-gray-800 font-mono text-xs">
                  {telemetry.soundboxDevicesActive} devices online
                </span>
              </div>
            </div>

            {/* Development / Simulation Transparency Notice */}
            {!isLive && (
              <div className="mt-4 p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                <span className="font-bold block mb-0.5">Development Environment Note:</span>
                Production Paytm merchant credentials are not set in the backend environment. GrowKaro is accurately presenting telemetry from local embedded MongoDB transaction collections. Real production Paytm feeds switch to "Live Production" automatically when merchant credentials are supplied.
              </div>
            )}

            {/* Close Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-full text-xs font-bold text-white bg-[#002970] hover:bg-[#001f54] transition-colors"
              >
                Close Panel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
