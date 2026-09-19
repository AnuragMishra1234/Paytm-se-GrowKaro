import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, Navigate, Link } from "react-router-dom";
import { useMerchantContext } from "../context/MerchantContext";
import { useTeam } from "../context/TeamContext";
import { getBusinessTypeInfo } from "../utils/formatters";
import NotificationCenter from "../components/NotificationCenter";
import { fetchN8nStatus } from "../services/api";

const ClockIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.9"
      d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

// ─── Crisp Modern Vector SVG Icons (No Emojis) ──────────────────────────────
const HomeIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.9"
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />
  </svg>
);

const SparklesIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.9"
      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"
    />
  </svg>
);

const LightbulbIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.9"
      d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.516 0c.85.493 1.509 1.333 1.509 2.316V18"
    />
  </svg>
);

const MegaphoneIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.9"
      d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
    />
  </svg>
);

const TargetIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.9"
      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const ChartBarIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.9"
      d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
    />
  </svg>
);

const PackageIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.9"
      d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
    />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.9"
      d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
    />
  </svg>
);

const ClipboardCheckIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.9"
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
    />
  </svg>
);

const UserGroupIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.9"
      d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.999-3.199a3 3 0 116 0 3 3 0 01-6 0zm12-3a3 3 0 100-6 3 3 0 000 6zm-12-3a3 3 0 100-6 3 3 0 000 6z"
    />
  </svg>
);

// ─── Role-Adaptive Navigation Categorized Sections ───────────────────────────
const getNavSections = (role) => {
  if (role === "MARKETING") {
    return [
      {
        title: "Employee Console (Rahul)",
        items: [
          { to: "/employee", icon: SparklesIcon, label: "Employee Dashboard", badge: "Marketing" },
          { to: "/tasks", icon: ClipboardCheckIcon, label: "My Tasks", badge: "Tasks" },
          { to: "/campaigns", icon: MegaphoneIcon, label: "Campaigns Assigned", badge: "Active" },
        ],
      },
      {
        title: "Intelligence & Results",
        items: [
          { to: "/performance", icon: TargetIcon, label: "Campaign Results", badge: "ROI" },
          { to: "/ai-copilot", icon: SparklesIcon, label: "Marketing Copilot", badge: "AI" },
          { to: "/activity", icon: ClockIcon, label: "Activity Timeline" },
        ],
      },
      {
        title: "Testing & Validation",
        items: [
          { to: "/test-real-data", icon: ChartBarIcon, label: "Test With Real Data", badge: "New" },
        ],
      },
    ];
  }

  if (role === "STAFF") {
    return [
      {
        title: "Employee Console (Ananya)",
        items: [
          { to: "/employee", icon: SparklesIcon, label: "Employee Dashboard", badge: "Staff" },
          { to: "/tasks", icon: ClipboardCheckIcon, label: "Floor Tasks", badge: "Tasks" },
          { to: "/activity", icon: ClockIcon, label: "Store Activity" },
        ],
      },
      {
        title: "Testing & Validation",
        items: [
          { to: "/test-real-data", icon: ChartBarIcon, label: "Test With Real Data", badge: "New" },
        ],
      },
    ];
  }

  // Manager: Full strategic, executive & store operations visibility (No employee console link)
  return [
    {
      title: null,
      items: [
        { to: "/dashboard", icon: HomeIcon, label: "Dashboard" },
        { to: "/ai-copilot", icon: SparklesIcon, label: "AI Copilot", badge: "AI" },
      ],
    },
    {
      title: "Agentic Intelligence",
      items: [
        { to: "/insights", icon: LightbulbIcon, label: "Insights", badge: "Live" },
        { to: "/campaigns", icon: MegaphoneIcon, label: "Actions & Campaigns", badge: "Action" },
        { to: "/performance", icon: TargetIcon, label: "Performance & Outcomes", badge: "ROI" },
        { to: "/activity", icon: ClockIcon, label: "Activity Timeline", badge: "Log" },
      ],
    },
    {
      title: "Store Operations & Team",
      items: [
        { to: "/tasks", icon: ClipboardCheckIcon, label: "Team Tasks", badge: "Tasks" },
        { to: "/team", icon: UserGroupIcon, label: "Merchant Team", badge: "Team" },
        { to: "/analytics", icon: ChartBarIcon, label: "Business Analytics" },
        { to: "/products", icon: PackageIcon, label: "Products" },
        { to: "/customers", icon: UsersIcon, label: "Customers" },
      ],
    },
    {
      title: "Testing & Validation",
      items: [
        { to: "/test-real-data", icon: ChartBarIcon, label: "Test With Real Data", badge: "Dataset" },
      ],
    },
  ];
};

function NavItem({ to, icon: Icon, label, badge }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm md:text-base font-semibold transition-all group ${
          isActive
            ? "bg-[#002970] text-white shadow-sm"
            : "text-gray-700 hover:bg-gray-100/90 hover:text-gray-950"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={`transition-colors ${
              isActive ? "text-white" : "text-gray-500 group-hover:text-gray-900"
            }`}
          >
            <Icon />
          </span>
          <span className="flex-1 truncate">{label}</span>
          {badge && (
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full tracking-wide transition-all ${
                isActive
                  ? "bg-white/20 text-white"
                  : badge === "Live"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : badge === "AI"
                  ? "bg-blue-50 text-[#002970] border border-blue-200"
                  : badge === "Action"
                  ? "bg-amber-50 text-amber-800 border border-amber-200"
                  : "bg-purple-50 text-purple-800 border border-purple-200"
              }`}
            >
              {badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

// Sidebar Toggle Icon (Gemini style [ | ])
const SidebarToggleIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <rect x="3" y="3" width="18" height="18" rx="4" strokeWidth="1.9" />
    <path d="M9 3v18" strokeWidth="1.9" />
  </svg>
);

export default function AppLayout() {
  const { merchant, clearMerchant } = useMerchantContext();
  const { currentRole, switchRole, personas } = useTeam();
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

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      {/* Mobile backdrop for drawer overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-20 md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ─── Modern Closable / Openable Sidebar ─────────────────────────────── */}
      <aside
        className={`fixed md:static inset-y-0 left-0 bg-white border-r border-gray-200/80 flex flex-col shrink-0 shadow-sm z-30 transition-all duration-300 ease-in-out ${
          sidebarOpen
            ? "w-72 translate-x-0 opacity-100"
            : "w-0 -translate-x-full md:translate-x-0 md:w-0 opacity-0 pointer-events-none border-r-0 overflow-hidden"
        }`}
      >
        {/* Brand Header with Close / Collapse Toggle */}
        <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <img
              src="/logo-transparent.png"
              alt="GrowKaro"
              className="h-11 sm:h-12 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </Link>
          <div className="flex items-center gap-1">
            <Link
              to="/"
              className="text-xs font-bold text-gray-400 hover:text-[#002970] px-2 py-1 rounded-lg hover:bg-gray-100 transition-all"
              title="Back to Landing Page"
            >
              Website
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <SidebarToggleIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Merchant Profile Badge (YouTube Channel Style) */}
        <div className="mx-3.5 mt-3.5 mb-2 p-3 bg-gray-50/90 hover:bg-gray-100/80 rounded-2xl border border-gray-200/80 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white border border-gray-200 p-1 flex items-center justify-center shadow-xs shrink-0 overflow-hidden">
              <img
                src={logo}
                alt={merchant.businessName}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-black text-gray-950 text-base truncate leading-tight">
                {merchant.businessName}
              </h4>
              <p className="text-xs text-gray-500 truncate mt-0.5 font-medium">
                {label} · {merchant.location?.city || "India"}
              </p>
            </div>
          </div>
          <button
            onClick={handleSwitchMerchant}
            className="mt-2.5 w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs md:text-sm font-bold text-[#002970] bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all shadow-2xs"
          >
            <span>Switch business profile</span>
            <span className="text-sm font-bold">›</span>
          </button>
        </div>

        {/* Nav Sections with YouTube-Style Headers & Dividers */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto space-y-3">
          {getNavSections(currentRole).map((section, sIdx, allSections) => (
            <div key={sIdx} className="space-y-1">
              {section.title && (
                <div className="px-3.5 pt-2 pb-1 flex items-center justify-between text-xs font-black text-gray-400 uppercase tracking-wider select-none">
                  <span>{section.title}</span>
                  <span className="text-gray-400 text-xs font-bold">›</span>
                </div>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavItem key={item.to} {...item} />
                ))}
              </div>
              {sIdx < allSections.length - 1 && (
                <div className="pt-2 border-b border-gray-100" />
              )}
            </div>
          ))}
        </nav>

        {/* Footer info */}
        <div className="p-3.5 border-t border-gray-100 bg-gray-50/50">
          <p className="text-xs text-gray-500 text-center font-medium">
            GrowKaro · Autonomous Intelligence
          </p>
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 overflow-y-auto flex flex-col bg-gray-50 min-w-0 transition-all duration-300">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-gray-200/80 px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-2xs z-10">
          {/* Left: Sidebar Toggle Button + Merchant badge & environment status */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Sidebar Open/Close Toggle Button */}
            <button
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="p-2 rounded-xl text-gray-600 hover:text-gray-950 hover:bg-gray-100 transition-all focus:outline-none"
              title={sidebarOpen ? "Collapse sidebar" : "Open sidebar"}
              aria-label="Toggle navigation sidebar"
            >
              <SidebarToggleIcon className="w-5 h-5 text-gray-700" />
            </button>

            <span className="text-xs md:text-sm font-bold text-gray-500 hidden sm:inline">
              Workspace:
            </span>
            <span className="inline-flex items-center gap-2 text-xs md:text-sm font-black text-gray-900 bg-gray-100 px-3 py-1 rounded-lg truncate max-w-[180px] sm:max-w-none">
              <img src={logo} alt="" className="w-4 h-4 object-contain rounded-xs" />
              <span className="truncate">{merchant.businessName}</span>
            </span>

            {/* Subtle Environment Status Pill */}
            {n8nStatus && (
              <div
                className={`hidden xs:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                  n8nStatus.mode === "real"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                    : "bg-gray-100 text-gray-700 border-gray-200"
                }`}
                title={n8nStatus.mode === "real" ? "Connected to live n8n instance" : "Controlled demo presentation environment"}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    n8nStatus.mode === "real" ? "bg-emerald-500 animate-pulse" : "bg-gray-400"
                  }`}
                />
                <span>
                  {n8nStatus.mode === "real" ? "Live n8n Automation" : "Demo Environment"}
                </span>
              </div>
            )}
          </div>

          {/* Right: Mode Switcher (MANAGER DASHBOARD vs EMPLOYEE DASHBOARD) & Notification Center */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Direct Quick Link to Test With Real Data */}
            <Link
              to="/test-real-data"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold text-[#002970] bg-blue-50/80 border border-blue-200/80 hover:bg-blue-100 hover:border-blue-300 transition-all shadow-2xs shrink-0"
              title="Upload CSV dataset to test GrowKaro analytics and AI loyalty"
            >
              <span className="text-sm">📊</span>
              <span className="hidden sm:inline">Test With Real Data</span>
            </Link>

            {/* Primary Product / Workspace Switcher: MANAGER DASHBOARD vs EMPLOYEE DASHBOARD */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200/90 shadow-2xs">
              {/* Manager Dashboard Button */}
              <button
                onClick={() => {
                  switchRole("MANAGER");
                  navigate("/dashboard");
                }}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                  currentRole === "MANAGER"
                    ? "bg-[#002970] text-white shadow-xs"
                    : "text-gray-700 hover:text-gray-950 hover:bg-white/80"
                }`}
                title="Full Manager Dashboard: Business Pulse, Copilot, Insights, Actions & Analytics"
              >
                <span>👔</span>
                <span>MANAGER DASHBOARD</span>
              </button>

              {/* Employee Dashboard Button */}
              <button
                onClick={() => {
                  if (currentRole === "MANAGER") {
                    switchRole("MARKETING");
                  }
                  navigate("/employee");
                }}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                  currentRole === "MARKETING" || currentRole === "STAFF"
                    ? "bg-[#002970] text-white shadow-xs"
                    : "text-gray-700 hover:text-gray-950 hover:bg-white/80"
                }`}
                title="Employee Prototype: Rahul Verma (Marketing) & Ananya Das (Staff)"
              >
                <span>👥</span>
                <span>EMPLOYEE DASHBOARD</span>
                <span className={`text-xs font-semibold ${currentRole === "MARKETING" || currentRole === "STAFF" ? "text-blue-200" : "text-gray-500"}`}>
                  (Rahul &amp; Ananya)
                </span>
              </button>
            </div>

            {/* When in Employee mode, show sub-employee toggle right here in header */}
            {(currentRole === "MARKETING" || currentRole === "STAFF") && (
              <div className="hidden lg:flex items-center bg-white p-0.5 rounded-xl border border-gray-200 shadow-2xs text-xs">
                <button
                  onClick={() => switchRole("MARKETING")}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                    currentRole === "MARKETING"
                      ? "bg-[#002970] text-white shadow-2xs"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                  title="Switch view to Rahul Verma (Marketing Lead)"
                >
                  <span>📣</span>
                  <span>Rahul (Marketing)</span>
                </button>
                <button
                  onClick={() => switchRole("STAFF")}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                    currentRole === "STAFF"
                      ? "bg-[#002970] text-white shadow-2xs"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                  title="Switch view to Ananya Das (Floor Operations & Barista)"
                >
                  <span>☕</span>
                  <span>Ananya (Staff)</span>
                </button>
              </div>
            )}

            <NotificationCenter />
          </div>
        </header>

        {/* Dynamic Page Content */}
        <div className="flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
}