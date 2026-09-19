import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useMerchantContext } from "../context/MerchantContext";
import { useTeam } from "../context/TeamContext";
import {
  fetchMerchantTasks,
  startTask,
  completeTask,
  createManualTask,
  deleteTask,
} from "../services/api";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { formatDate } from "../utils/formatters";

const PRIORITY_BADGES = {
  URGENT: "bg-rose-50 text-rose-800 border-rose-200",
  HIGH: "bg-amber-50 text-amber-800 border-amber-200",
  MEDIUM: "bg-blue-50 text-blue-800 border-blue-200",
  LOW: "bg-gray-50 text-gray-700 border-gray-200",
};

const STATUS_BADGES = {
  TODO: {
    label: "To Do",
    bg: "bg-gray-100 text-gray-700 border-gray-200",
    dot: "bg-gray-400",
  },
  IN_PROGRESS: {
    label: "In Progress",
    bg: "bg-blue-50 text-[#002970] border-blue-200",
    dot: "bg-[#002970] animate-pulse",
  },
  COMPLETED: {
    label: "Completed",
    bg: "bg-emerald-50 text-emerald-800 border-emerald-200",
    dot: "bg-emerald-500",
  },
  CANCELLED: {
    label: "Cancelled",
    bg: "bg-gray-100 text-gray-500 border-gray-200",
    dot: "bg-gray-400",
  },
};

const QUICK_PRESETS = [
  {
    title: "Batch Cold Brew Kegs (20L)",
    description: "Brew and refrigerate 20L fresh cold brew batch at counter tap before the 2:00 PM afternoon lull window.",
    type: "INVENTORY",
    priority: "HIGH",
    assignedToRole: "STAFF",
    assigneeName: "Ananya Das",
    suggestedRole: "Ananya (Floor & Barista)",
    icon: "☕",
  },
  {
    title: "Weekend Special WhatsApp Promo",
    description: "Draft and schedule broadcast copy for 15% off Cold Brew + Croissant combo targeting lapsed regulars.",
    type: "MARKETING",
    priority: "HIGH",
    assignedToRole: "MARKETING",
    assigneeName: "Rahul Verma",
    suggestedRole: "Rahul (Marketing Lead)",
    icon: "📣",
  },
  {
    title: "Front Display Pastry Restock",
    description: "Verify counter showcase: 15 Butter Croissants, 10 Blueberry Muffins, and ensure fresh napkins and billing receipts are stocked.",
    type: "OPERATIONS",
    priority: "MEDIUM",
    assignedToRole: "STAFF",
    assigneeName: "Ananya Das",
    suggestedRole: "Ananya (Floor & Barista)",
    icon: "🥐",
  },
  {
    title: "VIP Loyalty Comeback Outreach",
    description: "Review customer opportunities for churn-risk regulars and dispatch personalized comeback WhatsApp offers.",
    type: "CUSTOMER",
    priority: "URGENT",
    assignedToRole: "MARKETING",
    assigneeName: "Rahul Verma",
    suggestedRole: "Rahul (Marketing Lead)",
    icon: "⭐",
  },
];

export default function Tasks() {
  const { merchant } = useMerchantContext();
  const { currentRole, teamMembers, canManageTeam } = useTeam();

  const isManager = currentRole === "MANAGER" || currentRole === "OWNER" || canManageTeam;

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL"); // ALL, MY_ROLE, IN_PROGRESS, COMPLETED
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusMessage, setStatusMessage] = useState(null);
  const [error, setError] = useState(null);

  // Completion modal state
  const [completingTask, setCompletingTask] = useState(null);
  const [completionNote, setCompletionNote] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  // Manual task creation modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    type: "OPERATIONS",
    priority: "HIGH",
    assignedToRole: "STAFF",
    assignedTo: "",
    assignedToName: "Ananya Das",
    duePreset: "2h",
  });

  const loadTasks = useCallback(async () => {
    if (!merchant?._id) return;
    try {
      setLoading(true);
      const res = await fetchMerchantTasks(merchant._id);
      if (res?.success) {
        setTasks(res.data);
      }
    } catch (err) {
      setError(err.message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [merchant?._id]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Actions
  const handleStartTask = async (taskId) => {
    try {
      setSubmittingAction(true);
      await startTask(taskId);
      setStatusMessage("Task is now in progress.");
      await loadTasks();
    } catch (err) {
      setError(err.message || "Failed to start task");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleCompleteTask = async (e) => {
    e.preventDefault();
    if (!completingTask) return;

    try {
      setSubmittingAction(true);
      await completeTask(completingTask._id, { completionNote });
      setStatusMessage(`Task "${completingTask.title}" marked as completed!`);
      setCompletingTask(null);
      setCompletionNote("");
      await loadTasks();
    } catch (err) {
      setError(err.message || "Failed to complete task");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleDeleteTask = async (task) => {
    if (!window.confirm(`Are you sure you want to remove the task "${task.title}"?`)) {
      return;
    }
    try {
      setSubmittingAction(true);
      await deleteTask(task._id);
      setStatusMessage(`Task "${task.title}" deleted.`);
      await loadTasks();
    } catch (err) {
      setError(err.message || "Failed to delete task");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!createForm.title?.trim() || !createForm.description?.trim()) {
      setError("Task title and description are required.");
      return;
    }

    try {
      setSubmittingAction(true);
      setError(null);

      // Resolve assignee from team members if possible
      let assignee = teamMembers.find((m) => m._id === createForm.assignedTo);
      if (!assignee) {
        assignee = teamMembers.find((m) => m.role === createForm.assignedToRole);
      }

      // Compute dueAt from duePreset
      let dueAt = new Date();
      if (createForm.duePreset === "1h") {
        dueAt.setHours(dueAt.getHours() + 1);
      } else if (createForm.duePreset === "2h") {
        dueAt.setHours(dueAt.getHours() + 2);
      } else if (createForm.duePreset === "shift") {
        dueAt.setHours(dueAt.getHours() + 4);
      } else if (createForm.duePreset === "tomorrow") {
        dueAt.setDate(dueAt.getDate() + 1);
        dueAt.setHours(9, 0, 0, 0);
      } else {
        dueAt.setHours(dueAt.getHours() + 2);
      }

      const payload = {
        title: createForm.title.trim(),
        description: createForm.description.trim(),
        type: createForm.type,
        priority: createForm.priority,
        assignedToRole: createForm.assignedToRole,
        assignedTo: assignee ? assignee._id : undefined,
        assignedToName: assignee ? assignee.name : createForm.assignedToName,
        dueAt,
      };

      await createManualTask(merchant._id, payload);
      setStatusMessage(`Task "${payload.title}" assigned to ${payload.assignedToName || payload.assignedToRole}!`);
      setShowCreateModal(false);
      setCreateForm({
        title: "",
        description: "",
        type: "OPERATIONS",
        priority: "HIGH",
        assignedToRole: "STAFF",
        assignedTo: "",
        assignedToName: "Ananya Das",
        duePreset: "2h",
      });
      await loadTasks();
    } catch (err) {
      setError(err.message || "Failed to create task");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleSelectPreset = (preset) => {
    const matchingMember = teamMembers.find((m) => m.role === preset.assignedToRole);
    setCreateForm({
      title: preset.title,
      description: preset.description,
      type: preset.type,
      priority: preset.priority,
      assignedToRole: preset.assignedToRole,
      assignedTo: matchingMember ? matchingMember._id : "",
      assignedToName: matchingMember ? matchingMember.name : preset.assigneeName,
      duePreset: "2h",
    });
    setShowCreateModal(true);
  };

  // Filter logic
  const filteredTasks = tasks.filter((task) => {
    if (activeTab === "MY_ROLE" && task.assignedToRole !== currentRole) {
      return false;
    }
    if (activeTab === "IN_PROGRESS" && task.status !== "IN_PROGRESS") {
      return false;
    }
    if (activeTab === "COMPLETED" && task.status !== "COMPLETED") {
      return false;
    }
    if (roleFilter !== "ALL" && task.assignedToRole !== roleFilter) {
      return false;
    }
    return true;
  });

  const todoCount = tasks.filter((t) => t.status === "TODO").length;
  const inProgressCount = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const completedCount = tasks.filter((t) => t.status === "COMPLETED").length;
  const myRoleCount = tasks.filter((t) => t.assignedToRole === currentRole && t.status !== "COMPLETED").length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-black text-gray-900">Team Workflows &amp; Tasks</h1>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-[#002970] border border-blue-200">
              {tasks.length} Total
            </span>
          </div>
          <p className="text-gray-600 text-sm mt-1">
            Track operational checklists and assign work directly to floor staff and marketing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadTasks}
            className="px-3.5 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-2xs transition-all flex items-center gap-1.5"
            title="Refresh tasks"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>

          {isManager && (
            <button
              onClick={() => {
                const defaultMember = teamMembers.find((m) => m.role === "STAFF");
                setCreateForm({
                  title: "",
                  description: "",
                  type: "OPERATIONS",
                  priority: "HIGH",
                  assignedToRole: "STAFF",
                  assignedTo: defaultMember ? defaultMember._id : "",
                  assignedToName: defaultMember ? defaultMember.name : "Ananya Das",
                  duePreset: "2h",
                });
                setShowCreateModal(true);
              }}
              className="px-4 py-2.5 text-xs md:text-sm font-bold text-white bg-[#002970] hover:bg-[#001f56] rounded-xl shadow-xs transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              + Assign Task to Employee
            </button>
          )}
        </div>
      </div>

      {/* Status Alerts */}
      {statusMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs md:text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-emerald-700 hover:text-emerald-950 text-xs font-bold">
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs md:text-sm font-medium flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-700 hover:text-rose-950 text-xs font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-3">
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { id: "ALL", label: "All Tasks", count: tasks.length },
            { id: "MY_ROLE", label: `My Role (${currentRole})`, count: myRoleCount },
            { id: "IN_PROGRESS", label: "In Progress", count: inProgressCount },
            { id: "COMPLETED", label: "Completed", count: completedCount },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab.id
                  ? "bg-[#002970] text-white shadow-2xs"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-black ${
                  activeTab === tab.id ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Role Selector Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500 whitespace-nowrap">Filter Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#002970]/20"
          >
            <option value="ALL">All Roles</option>
            <option value="STAFF">Floor Staff (Ananya)</option>
            <option value="MARKETING">Marketing Lead (Rahul)</option>
            <option value="MANAGER">Store Manager (Priya)</option>
          </select>
        </div>
      </div>

      {/* Task List / Grid */}
      {loading && tasks.length === 0 ? (
        <div className="py-16">
          <LoadingSpinner message="Loading team tasks..." />
        </div>
      ) : filteredTasks.length === 0 ? (
        /* Enhanced Empty State for Manager */
        <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-12 text-center space-y-6 shadow-2xs">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 text-[#002970] mx-auto flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-xl font-black text-gray-900">No tasks currently dispatched</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              As Store Manager (Priya Sharma), you can directly assign operational tasks to your team (Rahul or Ananya), or approve AI business recommendations to auto-dispatch checklists.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {isManager && (
              <button
                onClick={() => {
                  const defaultMember = teamMembers.find((m) => m.role === "STAFF");
                  setCreateForm({
                    title: "",
                    description: "",
                    type: "OPERATIONS",
                    priority: "HIGH",
                    assignedToRole: "STAFF",
                    assignedTo: defaultMember ? defaultMember._id : "",
                    assignedToName: defaultMember ? defaultMember.name : "Ananya Das",
                    duePreset: "2h",
                  });
                  setShowCreateModal(true);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-[#002970] hover:bg-[#001f56] rounded-xl shadow-xs transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                </svg>
                + Assign Task to Employee
              </button>
            )}
            <Link
              to="/campaigns"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold text-[#002970] bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-all"
            >
              View AI Recommendations &amp; Approvals ›
            </Link>
          </div>

          {/* Quick Presets Section */}
          <div className="pt-6 border-t border-gray-100 text-left">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <span>⚡</span> Quick Task Presets (Click to Auto-fill &amp; Dispatch)
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {QUICK_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className="p-3.5 rounded-xl border border-gray-200 hover:border-[#002970] hover:bg-blue-50/40 text-left transition-all group flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xl">{preset.icon}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 group-hover:bg-blue-100 group-hover:text-[#002970]">
                        {preset.priority}
                      </span>
                    </div>
                    <div className="text-xs sm:text-sm font-black text-gray-900 group-hover:text-[#002970] leading-snug mb-1">
                      {preset.title}
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                      {preset.description}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="text-gray-400 font-medium">Assign:</span>
                    <span className="font-bold text-gray-700 truncate">{preset.suggestedRole}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => {
            const statusConfig = STATUS_BADGES[task.status] || STATUS_BADGES.TODO;
            const priorityClass = PRIORITY_BADGES[task.priority] || PRIORITY_BADGES.MEDIUM;
            const isAssignedToMe = task.assignedToRole === currentRole;

            return (
              <div
                key={task._id}
                className={`bg-white rounded-2xl border transition-all p-5 flex flex-col justify-between shadow-2xs relative ${
                  task.status === "COMPLETED"
                    ? "border-emerald-200 bg-emerald-50/20"
                    : isAssignedToMe
                    ? "border-[#002970] ring-2 ring-[#002970]/10"
                    : "border-gray-200/80 hover:border-gray-300"
                }`}
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider border ${priorityClass}`}>
                        {task.priority} Priority
                      </span>
                      {task.type && (
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs font-semibold">
                          {task.type}
                        </span>
                      )}
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusConfig.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                      {statusConfig.label}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-bold text-gray-900 leading-snug mb-1.5">
                    {task.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-4 whitespace-pre-line">
                    {task.description}
                  </p>

                  {/* Linked Action Notice */}
                  {task.relatedActionId && (
                    <div className="mb-4 p-2.5 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-[#002970] flex items-center justify-between">
                      <span className="font-semibold truncate">
                        Linked: {task.relatedActionId.title || "Business Action"}
                      </span>
                      <Link to="/campaigns" className="font-bold shrink-0 ml-1 hover:underline">
                        View ›
                      </Link>
                    </div>
                  )}

                  {/* Assignee & Meta */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#002970] text-white flex items-center justify-center text-xs font-black shrink-0">
                        {task.assignedToName
                          ? task.assignedToName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
                          : task.assignedToRole?.slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-gray-900 text-xs sm:text-sm truncate">
                          {task.assignedToName || task.assignedToRole}
                        </div>
                        <div className="text-xs text-gray-500 font-medium">
                          Role: {task.assignedToRole}
                        </div>
                      </div>
                    </div>

                    <div className="text-right text-xs text-gray-400">
                      <div>Created: {formatDate(task.createdAt)}</div>
                      {task.dueAt && (
                        <div className="font-semibold text-gray-700">Due: {formatDate(task.dueAt)}</div>
                      )}
                    </div>
                  </div>

                  {/* Attributed Creator */}
                  <div className="mb-3 text-xs text-gray-500 flex items-center justify-between">
                    <span>Assigned by: <strong className="text-gray-700">{task.createdByName || "Store Manager"}</strong></span>
                    {isManager && (
                      <button
                        onClick={() => handleDeleteTask(task)}
                        className="text-xs text-gray-400 hover:text-rose-600 transition-colors"
                        title="Delete task"
                      >
                        Delete
                      </button>
                    )}
                  </div>

                  {/* Completion Note if completed */}
                  {task.status === "COMPLETED" && (
                    <div className="mb-4 p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-emerald-800">
                      <div className="font-bold flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Completed by {task.assignedToName || "Team"}
                      </div>
                      {task.completionNote && (
                        <p className="mt-0.5 text-gray-600 italic">"{task.completionNote}"</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                  {task.status === "TODO" && (
                    <button
                      onClick={() => handleStartTask(task._id)}
                      disabled={submittingAction}
                      className="w-full py-2 px-3 rounded-xl text-xs sm:text-sm font-bold text-[#002970] bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all flex items-center justify-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      </svg>
                      Start Work
                    </button>
                  )}

                  {task.status === "IN_PROGRESS" && (
                    <button
                      onClick={() => {
                        setCompletingTask(task);
                        setCompletionNote("");
                      }}
                      disabled={submittingAction}
                      className="w-full py-2 px-3 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-2xs transition-all flex items-center justify-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Mark as Completed
                    </button>
                  )}

                  {task.status === "COMPLETED" && (
                    <div className="w-full py-1 text-center text-xs font-bold text-emerald-700 uppercase tracking-wider">
                      ✓ Ready for Execution
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Complete Task Modal */}
      {completingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-gray-900">Confirm Task Completion</h3>
              <button
                onClick={() => setCompletingTask(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="text-sm font-bold text-gray-900">{completingTask.title}</div>
              <div className="text-xs text-gray-600 mt-0.5 font-medium">{completingTask.description}</div>
            </div>

            <form onSubmit={handleCompleteTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Completion Note (Optional)
                </label>
                <textarea
                  rows={2}
                  value={completionNote}
                  onChange={(e) => setCompletionNote(e.target.value)}
                  placeholder="e.g. Cold brew brewed, croissants stocked at front display."
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002970]/20 focus:border-[#002970]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setCompletingTask(null)}
                  className="px-3.5 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-4 py-2 text-xs md:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  {submittingAction ? "Saving..." : "Confirm Done"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Task to Employee Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-200 space-y-4 animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-gray-900">Assign Task to Employee</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Directly dispatch operational, inventory, or marketing work to your store staff.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              {/* Assignee Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Assign To Employee *
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    {
                      name: "Ananya Das",
                      role: "STAFF",
                      title: "Floor & Barista",
                      icon: "☕",
                      avatar: "AD",
                      desc: "Inventory prep & floor rush",
                    },
                    {
                      name: "Rahul Verma",
                      role: "MARKETING",
                      title: "Marketing Lead",
                      icon: "📣",
                      avatar: "RV",
                      desc: "WhatsApp & campaign copy",
                    },
                  ].map((emp) => {
                    const isSelected = createForm.assignedToRole === emp.role;
                    const matchingMember = teamMembers.find((m) => m.role === emp.role);

                    return (
                      <button
                        key={emp.role}
                        type="button"
                        onClick={() =>
                          setCreateForm({
                            ...createForm,
                            assignedToRole: emp.role,
                            assignedTo: matchingMember ? matchingMember._id : "",
                            assignedToName: matchingMember ? matchingMember.name : emp.name,
                          })
                        }
                        className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                          isSelected
                            ? "border-[#002970] bg-blue-50/50 ring-2 ring-[#002970]/10"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-black shrink-0 ${
                            isSelected ? "bg-[#002970] text-white" : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {emp.avatar}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-black text-gray-900 truncate">
                            {emp.name}
                          </div>
                          <div className="text-xs font-bold text-[#002970]">
                            {emp.title}
                          </div>
                          <div className="text-xs text-gray-500 truncate mt-0.5">
                            {emp.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Task Title */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder="e.g. Cold Brew Batching (20L) & Tap Refrigeration"
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002970]/20 focus:border-[#002970]"
                />
              </div>

              {/* Category & Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={createForm.type}
                    onChange={(e) => setCreateForm({ ...createForm, type: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-200 rounded-xl bg-white font-medium text-gray-800"
                  >
                    <option value="OPERATIONS">Operations / Counter</option>
                    <option value="INVENTORY">Inventory / Stocking</option>
                    <option value="MARKETING">Marketing &amp; Promo</option>
                    <option value="CUSTOMER">Customer Care / VIP</option>
                    <option value="GENERAL">General Store Task</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Priority *
                  </label>
                  <select
                    value={createForm.priority}
                    onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-200 rounded-xl bg-white font-medium text-gray-800"
                  >
                    <option value="URGENT">URGENT (Action Now)</option>
                    <option value="HIGH">HIGH (Before Rush)</option>
                    <option value="MEDIUM">MEDIUM (Standard Shift)</option>
                    <option value="LOW">LOW (When Free)</option>
                  </select>
                </div>
              </div>

              {/* Due Time Presets */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Due Time
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: "1h", label: "In 1 Hour" },
                    { id: "2h", label: "In 2 Hours" },
                    { id: "shift", label: "Today's Shift" },
                    { id: "tomorrow", label: "Tomorrow" },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setCreateForm({ ...createForm, duePreset: preset.id })}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border text-center transition-all cursor-pointer ${
                        createForm.duePreset === preset.id
                          ? "bg-[#002970] text-white border-[#002970]"
                          : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description & Step-by-Step Instructions */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Instructions &amp; Checklist *
                </label>
                <textarea
                  rows={3}
                  required
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Specific instructions for the employee on what needs to be prepped or reviewed..."
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002970]/20 focus:border-[#002970]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs sm:text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-[#002970] hover:bg-[#001f56] rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  {submittingAction ? "Assigning..." : "Assign Task & Dispatch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
