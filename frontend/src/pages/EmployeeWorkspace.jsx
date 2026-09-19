import React, { useState, useEffect } from "react";
import { useMerchantContext } from "../context/MerchantContext";
import { useTeam } from "../context/TeamContext";
import {
  fetchEmployeeDashboard,
  startEmployeeTask,
  completeEmployeeTask,
} from "../services/api";
import CustomerOpportunityModal from "../components/CustomerOpportunityModal";

export default function EmployeeWorkspace() {
  const { merchant } = useMerchantContext();
  const { currentRole, switchRole } = useTeam();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected opportunity for modal review
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);

  // Task completion modal / prompt state
  const [activeTaskToComplete, setActiveTaskToComplete] = useState(null);
  const [completionNote, setCompletionNote] = useState("");
  const [taskSubmitting, setTaskSubmitting] = useState(false);
  const [checklistOverrides, setChecklistOverrides] = useState({});

  const targetRole = currentRole === "STAFF" ? "STAFF" : "MARKETING";

  const loadData = async () => {
    if (!merchant?._id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetchEmployeeDashboard(merchant._id, targetRole);
      if (res.success) {
        setDashboardData(res.data);
      }
    } catch (err) {
      setError(err.message || "Failed to load employee workspace.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [merchant?._id, targetRole]);

  const handleStartTask = async (taskId) => {
    try {
      await startEmployeeTask(merchant._id, taskId);
      loadData();
    } catch (err) {
      alert(err.message || "Failed to start task");
    }
  };

  const handleCompleteTask = async (e) => {
    e.preventDefault();
    if (!activeTaskToComplete) return;
    setTaskSubmitting(true);
    try {
      await completeEmployeeTask(merchant._id, activeTaskToComplete._id, completionNote);
      setActiveTaskToComplete(null);
      setCompletionNote("");
      loadData();
    } catch (err) {
      alert(err.message || "Failed to complete task");
    } finally {
      setTaskSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#002970] border-t-transparent rounded-full animate-spin" />
          <p className="text-base font-semibold text-gray-600">
            Loading Employee Workspace ({targetRole === "STAFF" ? "Ananya" : "Rahul"})...
          </p>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800">
          <h3 className="font-bold text-base mb-1">Error Loading Employee Console</h3>
          <p className="text-sm">{error || "Data unavailable"}</p>
          <button
            onClick={loadData}
            className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-bold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const {
    employee,
    summary,
    tasks = [],
    campaigns = [],
    customerOpportunities = [],
    notifications = [],
    outcomes = [],
    checklist = [],
  } = dashboardData;

  const isStaffView = employee.role === "STAFF";

  const toggleChecklistItem = (id) => {
    setChecklistOverrides((prev) => ({
      ...prev,
      [id]: prev[id] === "COMPLETED" ? "IN_PROGRESS" : "COMPLETED",
    }));
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto font-sans">
      {/* ─── Top Sub-Persona Switcher Header (Rahul vs Ananya) ─────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-xl shrink-0">
            {isStaffView ? "☕" : "📣"}
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-gray-950 leading-tight">
              GrowKaro Employee Prototype
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 font-medium">
              Switch between merchant team personas to preview dedicated employee workflows.
            </p>
          </div>
        </div>

        {/* Persona Switcher Buttons */}
        <div className="flex items-center bg-gray-100 p-1.5 rounded-xl border border-gray-200 self-start sm:self-auto shrink-0">
          <button
            onClick={() => switchRole("MARKETING")}
            className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              !isStaffView
                ? "bg-[#002970] text-white shadow-xs"
                : "text-gray-700 hover:text-gray-950 hover:bg-white"
            }`}
          >
            <span>📣</span>
            <span>Rahul Verma · Marketing Lead</span>
          </button>
          <button
            onClick={() => switchRole("STAFF")}
            className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              isStaffView
                ? "bg-[#002970] text-white shadow-xs"
                : "text-gray-700 hover:text-gray-950 hover:bg-white"
            }`}
          >
            <span>☕</span>
            <span>Ananya Das · Floor Operations &amp; Barista</span>
          </button>
        </div>
      </div>

      {/* ─── Top Workspace Greeting Banner ─────────────────────────────────── */}
      <div className="bg-gradient-to-r from-[#002970] via-[#00225e] to-[#001845] rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 transform skew-x-12 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-bold tracking-wide uppercase text-blue-100 mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {isStaffView ? "Store Floor Operations Console" : "Marketing Lead Console"} · Cafe Aroma
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              {employee.greeting}
            </h1>
            <p className="text-sm sm:text-base text-blue-100 font-medium mt-1.5 max-w-2xl leading-relaxed">
              {employee.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-xs border border-white/20 px-4 py-3 rounded-2xl text-right">
              <span className="text-xs uppercase tracking-wider text-blue-200 block font-bold">
                Active Employee
              </span>
              <span className="text-base font-black text-white">{employee.name}</span>
              <span className="text-xs text-blue-200 block">{employee.title}</span>
            </div>
          </div>
        </div>

        {/* Quick KPI Stat Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3.5 border border-white/10">
            <span className="text-xs uppercase tracking-wider text-blue-200 font-bold block mb-1">
              Pending Tasks
            </span>
            <span className="text-2xl font-black text-white">{summary.pendingTasks}</span>
          </div>

          {isStaffView ? (
            <>
              <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3.5 border border-white/10">
                <span className="text-xs uppercase tracking-wider text-blue-200 font-bold block mb-1">
                  Completed Today
                </span>
                <span className="text-2xl font-black text-white">{summary.completedTasks || 0}</span>
              </div>
              <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3.5 border border-white/10">
                <span className="text-xs uppercase tracking-wider text-blue-200 font-bold block mb-1">
                  Shift Checklist
                </span>
                <span className="text-2xl font-black text-emerald-300">
                  {checklist.length} Active Items
                </span>
              </div>
              <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3.5 border border-white/10">
                <span className="text-xs uppercase tracking-wider text-blue-200 font-bold block mb-1">
                  Floor Readiness
                </span>
                <span className="text-2xl font-black text-emerald-300">
                  100% On Track
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3.5 border border-white/10">
                <span className="text-xs uppercase tracking-wider text-blue-200 font-bold block mb-1">
                  Customer Opportunities
                </span>
                <span className="text-2xl font-black text-white">
                  {summary.customerOpportunitiesCount}
                </span>
              </div>
              <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3.5 border border-white/10">
                <span className="text-xs uppercase tracking-wider text-blue-200 font-bold block mb-1">
                  Active Campaigns
                </span>
                <span className="text-2xl font-black text-white">{summary.activeCampaigns}</span>
              </div>
              <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3.5 border border-white/10">
                <span className="text-xs uppercase tracking-wider text-blue-200 font-bold block mb-1">
                  Recent Campaign Lift
                </span>
                <span className="text-2xl font-black text-emerald-300">
                  +{outcomes[0]?.changePercentage || 23.8}%{" "}
                  <span className="text-xs font-normal text-blue-200">observed</span>
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ─── STAFF VIEW (Ananya Das): Floor Checklist & Store Floor Tasks ─── */}
      {isStaffView ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Store Floor Operational Checklist & Tasks (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Operational Shift Checklist */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-600" />
                  <h2 className="text-lg font-black text-gray-950">
                    Store Floor Shift Checklist
                  </h2>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Daily Operations
                </span>
              </div>
              <p className="text-sm text-gray-600 font-medium">
                Verify physical counter readiness, beverage batch refrigeration, and billing shortcuts before promotional rush hours.
              </p>

              <div className="space-y-3 pt-1">
                {checklist.map((item) => {
                  const currentStatus = checklistOverrides[item.id] || item.status;
                  const isDone = currentStatus === "COMPLETED" || currentStatus === "READY";
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleChecklistItem(item.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                        isDone
                          ? "bg-emerald-50/40 border-emerald-200"
                          : "bg-gray-50 border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isDone}
                          onChange={() => {}}
                          className="mt-1 w-4 h-4 text-[#002970] rounded-sm focus:ring-[#002970]"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-gray-900 text-sm sm:text-base">
                              {item.task}
                            </h4>
                            <span className="text-xs font-bold text-gray-500 bg-white px-2 py-0.5 rounded-md border border-gray-200">
                              Due {item.time}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600 font-medium mt-1 leading-relaxed">
                            {item.detail}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full border shrink-0 uppercase ${
                          isDone
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                        }`}
                      >
                        {isDone ? "VERIFIED ✓" : "PENDING"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Floor Tasks Assigned */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#002970]" />
                  <h2 className="text-lg font-black text-gray-950">Floor Tasks Assigned to Me</h2>
                </div>
                <span className="text-xs font-bold text-gray-500">
                  Staff Role ({tasks.length})
                </span>
              </div>

              {tasks.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200/80 p-8 text-center text-gray-500 text-sm font-medium">
                  No floor tasks currently assigned. You're ready for the shift!
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div
                      key={task._id}
                      className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-2xs hover:shadow-xs transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span
                              className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                                task.priority === "URGENT" || task.priority === "HIGH"
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : "bg-amber-50 text-amber-800 border-amber-200"
                              }`}
                            >
                              {task.priority}
                            </span>
                            <span
                              className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                                task.status === "COMPLETED"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : task.status === "IN_PROGRESS"
                                  ? "bg-blue-50 text-[#002970] border-blue-200"
                                  : "bg-gray-100 text-gray-700 border-gray-200"
                              }`}
                            >
                              {task.status}
                            </span>
                          </div>
                          <h3 className="font-black text-gray-950 text-base leading-snug">
                            {task.title}
                          </h3>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 font-medium leading-relaxed">
                        {task.description}
                      </p>

                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2 text-xs sm:text-sm">
                        <span className="text-gray-500 font-medium">
                          Target Completion: <strong className="text-gray-800">Before 2:00 PM</strong>
                        </span>

                        <div className="flex items-center gap-2">
                          {task.status === "TODO" && (
                            <button
                              onClick={() => handleStartTask(task._id)}
                              className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold transition-all text-xs sm:text-sm"
                            >
                              Start Task ⚙️
                            </button>
                          )}
                          {task.status !== "COMPLETED" && (
                            <button
                              onClick={() => setActiveTaskToComplete(task)}
                              className="px-4 py-1.5 bg-[#002970] hover:bg-[#001f54] text-white rounded-xl font-bold transition-all shadow-xs text-xs sm:text-sm"
                            >
                              Mark Complete ✓
                            </button>
                          )}
                          {task.status === "COMPLETED" && (
                            <span className="text-xs sm:text-sm font-bold text-emerald-700 flex items-center gap-1">
                              ✓ Completed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Floor Protocols & Shift Notifications (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Operational Floor Guide Card */}
            <div className="bg-gradient-to-br from-amber-50/70 to-white rounded-2xl border border-amber-200/80 p-5 sm:p-6 space-y-3 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="text-xl">📋</span>
                <h3 className="font-black text-amber-950 text-base">
                  Floor Shift Protocol: Afternoon Rush
                </h3>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed font-medium">
                Store Manager Priya has approved the Monsoon Afternoon Combo campaign. Expect customer spike between 2:00 PM - 5:00 PM.
              </p>
              <div className="p-3 bg-white rounded-xl border border-amber-100 text-xs text-amber-900 space-y-1">
                <div>• Keep 10 takeaway cups pre-staged near the espresso machine.</div>
                <div>• Restock pastry display with fresh butter croissants at 1:45 PM.</div>
                <div>• Ring orders via POS Shortcut #4 (₹199 Combo).</div>
              </div>
            </div>

            {/* Shift Notifications */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                  Store Floor Notifications
                </h3>
                <span className="text-xs font-bold text-gray-400">Live</span>
              </div>

              {notifications.length === 0 ? (
                <p className="text-xs text-gray-500">No shift notifications yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {notifications.slice(0, 4).map((notif) => (
                    <div
                      key={notif._id}
                      className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs sm:text-sm space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <strong className="text-gray-900 font-bold truncate">
                          {notif.title}
                        </strong>
                        <span className="text-xs text-gray-400 shrink-0">Today</span>
                      </div>
                      <p className="text-gray-600 leading-snug">{notif.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ─── MARKETING VIEW (Rahul Verma): Tasks, Loyalty Opportunities, Campaigns ─── */
        <>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: My Tasks (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#002970]" />
                  <h2 className="text-lg font-black text-gray-900">My Tasks</h2>
                </div>
                <span className="text-xs sm:text-sm font-bold text-gray-500">
                  Assigned to Marketing ({tasks.length})
                </span>
              </div>

              {tasks.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200/80 p-8 text-center text-gray-500 text-sm font-medium">
                  No tasks currently pending. You're completely caught up!
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div
                      key={task._id}
                      className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-2xs hover:shadow-xs transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span
                              className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                                task.priority === "URGENT" || task.priority === "HIGH"
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : "bg-amber-50 text-amber-800 border-amber-200"
                              }`}
                            >
                              {task.priority}
                            </span>
                            <span
                              className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                                task.status === "COMPLETED"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : task.status === "IN_PROGRESS"
                                  ? "bg-blue-50 text-[#002970] border-blue-200"
                                  : "bg-gray-100 text-gray-700 border-gray-200"
                              }`}
                            >
                              {task.status}
                            </span>
                          </div>
                          <h3 className="font-black text-gray-950 text-base leading-snug">
                            {task.title}
                          </h3>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 font-medium leading-relaxed">
                        {task.description}
                      </p>

                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2 text-xs sm:text-sm">
                        <span className="text-gray-500 font-medium">
                          Due: <strong className="text-gray-700">Today, 2:00 PM</strong>
                        </span>

                        <div className="flex items-center gap-2">
                          {task.status === "TODO" && (
                            <button
                              onClick={() => handleStartTask(task._id)}
                              className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold transition-all text-xs sm:text-sm"
                            >
                              Start Task ⚙️
                            </button>
                          )}
                          {task.status !== "COMPLETED" && (
                            <button
                              onClick={() => setActiveTaskToComplete(task)}
                              className="px-4 py-1.5 bg-[#002970] hover:bg-[#001f54] text-white rounded-xl font-bold transition-all shadow-xs text-xs sm:text-sm"
                            >
                              Mark Complete ✓
                            </button>
                          )}
                          {task.status === "COMPLETED" && (
                            <span className="text-xs sm:text-sm font-bold text-emerald-700 flex items-center gap-1">
                              ✓ Completed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Customer Opportunities (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-purple-600" />
                  <h2 className="text-lg font-black text-gray-900">Customer Opportunities</h2>
                </div>
                <span className="text-xs sm:text-sm font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                  AI Loyalty
                </span>
              </div>

              {customerOpportunities.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200/80 p-6 text-center text-gray-500 text-sm">
                  No customer opportunities flagged today.
                </div>
              ) : (
                <div className="space-y-3">
                  {customerOpportunities.slice(0, 3).map((opp) => (
                    <div
                      key={opp.id}
                      className="bg-white rounded-2xl border border-purple-100 p-5 shadow-2xs hover:border-purple-300 transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full uppercase">
                            {opp.urgency} Urgency
                          </span>
                          <h4 className="font-black text-gray-950 text-base mt-1.5">
                            {opp.customerName}
                          </h4>
                          <p className="text-xs sm:text-sm text-gray-500 font-medium">
                            {opp.customerSummary.visits} visits · ₹
                            {opp.customerSummary.totalSpend.toLocaleString("en-IN")} lifetime spend
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs uppercase font-bold text-gray-400 block">
                            Favorite
                          </span>
                          <span className="text-sm font-black text-[#002970]">
                            {opp.customerSummary.favoriteProduct}
                          </span>
                        </div>
                      </div>

                      <div className="p-3 bg-gray-50 rounded-xl text-xs sm:text-sm space-y-1 text-gray-700 border border-gray-100">
                        <p className="leading-snug">
                          <strong className="text-gray-900">Observed Behavior:</strong> {opp.customerName} hasn't visited in{" "}
                          <strong className="text-rose-600">{opp.customerSummary.lastVisitDaysAgo} days</strong>.
                        </p>
                        <p className="text-xs text-gray-500">
                          Suggested offer: {opp.suggestedOffer?.title} ({opp.suggestedOffer?.discount})
                        </p>
                      </div>

                      <div className="pt-2 flex items-center justify-between">
                        <button
                          onClick={() => setSelectedOpportunity(opp)}
                          className="text-xs sm:text-sm font-bold text-[#002970] hover:underline"
                        >
                          View Evidence ›
                        </button>
                        <button
                          onClick={() => setSelectedOpportunity(opp)}
                          className="px-4 py-2 bg-[#002970] hover:bg-[#001f54] text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs"
                        >
                          Prepare Offer ✉
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* AI Marketing Assistant Context Card */}
              <div className="bg-gradient-to-br from-blue-50/80 to-white rounded-2xl border border-blue-200/80 p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">💡</span>
                  <h3 className="font-black text-[#002970] text-sm sm:text-base">
                    AI Marketing Assistant: Today's Brief
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-medium">
                  Bengaluru weather is cool & overcast (21°C). Afternoon lull typically begins at 2:00 PM.
                  Launching the Cold Brew Combo and reaching out to at-risk patrons like Ananya Das captures high-intent traffic.
                </p>
              </div>
            </div>
          </div>

          {/* Grid: Section 3 (Campaigns Assigned) & Section 4 (Notifications & Results) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
            {/* Campaigns (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-gray-900">Campaigns Assigned to Me</h2>
                <span className="text-xs sm:text-sm font-bold text-gray-500">
                  Channel: WhatsApp
                </span>
              </div>

              {campaigns.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200/80 p-6 text-center text-gray-500 text-sm">
                  No campaigns scheduled.
                </div>
              ) : (
                <div className="space-y-3">
                  {campaigns.map((camp) => (
                    <div
                      key={camp._id}
                      className="bg-white rounded-2xl border border-gray-200/80 p-5 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase">
                            {camp.status}
                          </span>
                          <h4 className="font-black text-gray-900 text-base mt-1.5">{camp.name}</h4>
                          <p className="text-xs sm:text-sm text-gray-500">
                            Audience: {camp.targetAudience}
                          </p>
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-gray-400">
                          {camp.channel}
                        </span>
                      </div>

                      <div className="p-3.5 bg-emerald-50/40 border border-emerald-100 rounded-xl text-xs sm:text-sm text-gray-700 font-mono">
                        "{camp.message}"
                      </div>

                      {camp.deliveryStats && (
                        <div className="grid grid-cols-3 gap-2 text-center text-xs sm:text-sm pt-1">
                          <div className="bg-gray-50 p-2.5 rounded-xl">
                            <span className="text-gray-400 block text-xs uppercase font-bold">
                              Sent
                            </span>
                            <strong className="text-gray-900 text-sm">
                              {camp.deliveryStats.sentCount}
                            </strong>
                          </div>
                          <div className="bg-gray-50 p-2.5 rounded-xl">
                            <span className="text-gray-400 block text-xs uppercase font-bold">
                              Delivered
                            </span>
                            <strong className="text-gray-900 text-sm">
                              {camp.deliveryStats.deliveredCount}
                            </strong>
                          </div>
                          <div className="bg-gray-50 p-2.5 rounded-xl">
                            <span className="text-gray-400 block text-xs uppercase font-bold">
                              Read
                            </span>
                            <strong className="text-gray-900 text-sm">
                              {camp.deliveryStats.openedCount || 24}
                            </strong>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Results & Notifications (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-gray-900">Recent Campaign Results</h2>
                <span className="text-xs sm:text-sm font-bold text-emerald-700">
                  Observed Lift
                </span>
              </div>

              {outcomes.length > 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200/80 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-700">Monsoon Chai &amp; Samosa</span>
                    <span className="text-base font-black text-emerald-600">
                      +{outcomes[0]?.changePercentage}%
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    {outcomes[0]?.interpretation ||
                      "Observed +23.8% increase in afternoon revenue following campaign dispatch."}
                  </p>
                  <div className="p-2.5 bg-gray-50 rounded-xl text-xs text-gray-500">
                    Measurement Window: 3-day post-campaign performance vs prior baseline.
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-200/80 p-5 text-sm text-gray-500">
                  No historical outcomes measured yet.
                </div>
              )}

              {/* Recent Marketing Notifications */}
              <div className="space-y-2 pt-2">
                <h3 className="text-xs sm:text-sm font-black uppercase text-gray-500 tracking-wider">
                  Marketing Notifications
                </h3>
                {notifications.slice(0, 3).map((notif) => (
                  <div
                    key={notif._id}
                    className="p-3 bg-white rounded-xl border border-gray-200/80 text-xs sm:text-sm space-y-1 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-gray-900 font-bold truncate">{notif.title}</strong>
                      <span className="text-xs text-gray-400 shrink-0">Just now</span>
                    </div>
                    <p className="text-gray-600 leading-tight">{notif.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ─── Modal: Customer Opportunity & Personalized Offer ─────────────── */}
      <CustomerOpportunityModal
        isOpen={Boolean(selectedOpportunity)}
        opportunity={selectedOpportunity}
        merchantId={merchant._id}
        memberId={employee._id}
        onClose={() => setSelectedOpportunity(null)}
        onSubmitted={() => {
          setSelectedOpportunity(null);
          loadData();
        }}
      />

      {/* ─── Modal: Complete Task ─────────────────────────────────────────── */}
      {activeTaskToComplete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <h3 className="text-lg font-black text-gray-950">
              Complete Task: {activeTaskToComplete.title}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Record completion notes for the store manager and automated execution log.
            </p>

            <form onSubmit={handleCompleteTask} className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">
                  Completion Notes
                </label>
                <textarea
                  rows={3}
                  value={completionNote}
                  onChange={(e) => setCompletionNote(e.target.value)}
                  placeholder="e.g., Cold Brew keg tapped, display verified, POS combo tested."
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#002970] outline-hidden font-medium"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTaskToComplete(null)}
                  className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={taskSubmitting}
                  className="px-5 py-2.5 bg-[#002970] text-white rounded-xl text-sm font-bold hover:bg-[#001f54] transition-all"
                >
                  {taskSubmitting ? "Completing..." : "Submit Completion ✓"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
