import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, Navigate, Link } from "react-router-dom";
import { useMerchantContext } from "../context/MerchantContext";
import { getBusinessTypeInfo } from "../utils/formatters";
import NotificationCenter from "../components/NotificationCenter";
import { fetchN8nStatus } from "../services/api";

// ─── Crisp, Purposeful Icons (No Emojis) ────────────────────────────────────

const HomeIcon = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const LightbulbIcon = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const SparklesIcon = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const PackageIcon = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const ChartBarIcon = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const InboxIcon = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
  </svg>
);

const TargetIcon = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const SlidersIcon = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

const SidebarToggleIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <rect x="3" y="3" width="18" height="18" rx="3" strokeWidth="1.8" />
    <path d="M9 3v18" strokeWidth="1.8" />
  </svg>
);

// ─── Professional Navigation Grouping ──────────────────────────────────────

const navSections = [
  {
    title: "MAIN",
    items: [
      { to: "/dashboard", icon: HomeIcon, label: "Dashboard" },
      { to: "/insights", icon: LightbulbIcon, label: "Daily Insights" },
      { to: "/ai-copilot", icon: SparklesIcon, label: "AI Copilot" },
    ],
  },
  {
    title: "BUSINESS",
    items: [
      { to: "/products", icon: PackageIcon, label: "Products" },
      { to: "/customers", icon: UsersIcon, label: "Customers" },
      { to: "/analytics", icon: ChartBarIcon, label: "Analytics" },
    ],
  },
  {
    title: "ACTIVITY",
    items: [
      { to: "/campaigns", icon: InboxIcon, label: "Actions & Campaigns" },
      { to: "/performance", icon: TargetIcon, label: "Measured ROI" },
      { to: "/activity", icon: ClockIcon, label: "Audit Timeline" },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      { to: "/demo-control", icon: SlidersIcon, label: "Demo Controls" },
    ],
  },
];

function NavItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors group ${
          isActive
            ? "bg-emerald-50/80 text-emerald-900 font-semibold border-l-2 border-emerald-600 pl-2"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={`transition-colors ${
              isActive ? "text-emerald-700" : "text-slate-400 group-hover:text-slate-600"
            }`}
          >
            <Icon />
          </span>
          <span className="truncate">{label}</span>
        </>
      )}
    </NavLink>
  );
}

export default function AppLayout() {
  const { merchant, clearMerchant } = useMerchantContext();
  const navigate = useNavigate();
  const [n8nStatus, setN8nStatus] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    fetchN8nStatus()
      .then((res) => {
        if (res.success) setN8nStatus(res.data);
      })
      .catch(() => {});
  }, []);

  if (!merchant) {
    return <Navigate to="/" replace />;
  }

  const { label, logo } = getBusinessTypeInfo(merchant.businessType, merchant.businessName);

  const handleSwitchMerchant = () => {
    clearMerchant();
    navigate("/select-merchant");
  };

  // Formatted date context e.g. "Saturday, 19 Sep 2026"
  const formattedToday = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* Mobile backdrop for drawer overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-20 md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ─── Compact, Polished Commercial Sidebar (248px) ────────────────── */}
      <aside
        className={`fixed md:static inset-y-0 left-0 bg-white border-r border-slate-200/90 flex flex-col shrink-0 z-30 transition-all duration-200 ease-in-out ${
          sidebarOpen
            ? "w-64 translate-x-0 opacity-100"
            : "w-0 -translate-x-full md:translate-x-0 md:w-0 opacity-0 pointer-events-none border-r-0 overflow-hidden"
        }`}
      >
        {/* Brand Header */}
        <div className="h-14 px-4 border-b border-slate-100 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <img
              src="/logo-transparent.png"
              alt="GrowKaro"
              className="h-9 w-auto object-contain"
            />
          </Link>
          <div className="flex items-center gap-1">
            <Link
              to="/"
              className="text-[11px] font-semibold text-slate-400 hover:text-slate-700 px-1.5 py-1 rounded hover:bg-slate-100 transition-colors flex items-center gap-1"
              title="View Homepage"
            >
              <span>Site</span>
              <ExternalLinkIcon />
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <SidebarToggleIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Compact Merchant Workspace Selector */}
        <div className="p-3 border-b border-slate-100">
          <div className="p-2.5 bg-slate-50/80 rounded-lg border border-slate-200/80 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-md bg-white border border-slate-200 p-0.5 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                <img
                  src={logo}
                  alt={merchant.businessName}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-slate-900 text-xs truncate leading-tight">
                  {merchant.businessName}
                </h4>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  {label} · {merchant.location?.city || "India"}
                </p>
              </div>
            </div>

            <button
              onClick={handleSwitchMerchant}
              className="shrink-0 p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded text-[11px] font-semibold transition-colors"
              title="Switch business"
            >
              Switch
            </button>
          </div>
        </div>

        {/* Categorized Navigation */}
        <nav className="flex-1 px-3 py-2.5 overflow-y-auto space-y-4">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-0.5">
              <div className="px-2 pt-1 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">
                {section.title}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavItem key={item.to} {...item} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Subtle Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>GrowKaro v1.0</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </div>
        </div>
      </aside>

      {/* ─── Main Content Shell ──────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto flex flex-col bg-slate-50 min-w-0 transition-all duration-200">
        {/* Top Header Bar (56px) */}
        <header className="h-14 bg-white border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between shrink-0 z-10">
          {/* Left: Sidebar Toggle + Current Context */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none"
              title={sidebarOpen ? "Collapse sidebar" : "Open sidebar"}
              aria-label="Toggle navigation sidebar"
            >
              <SidebarToggleIcon className="w-4 h-4 text-slate-600" />
            </button>

            <div className="h-4 w-px bg-slate-200" />

            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-800 truncate max-w-[140px] sm:max-w-none">
                {merchant.businessName}
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500 hidden sm:inline">
                {formattedToday}
              </span>
            </div>
          </div>

          {/* Right: Environment Status + Notifications */}
          <div className="flex items-center gap-3">
            {/* Restrained Environment Pill */}
            {n8nStatus && (
              <div
                className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border ${
                  n8nStatus.mode === "real"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-slate-50 text-slate-600 border-slate-200"
                }`}
                title={n8nStatus.mode === "real" ? "Connected to production n8n" : "Running in sandbox simulation"}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    n8nStatus.mode === "real" ? "bg-emerald-500" : "bg-slate-400"
                  }`}
                />
                <span>{n8nStatus.mode === "real" ? "Live Automation" : "Sandbox Telemetry"}</span>
              </div>
            )}

            <NotificationCenter />
          </div>
        </header>

        {/* Dynamic Page Outlet */}
        <div className="flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
}