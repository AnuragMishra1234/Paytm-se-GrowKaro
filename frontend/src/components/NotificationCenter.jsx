import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useMerchantContext } from "../context/MerchantContext";
import { useTeam } from "../context/TeamContext";
import {
  fetchMerchantNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../services/api";
import {
  isBrowserNotificationSupported,
  isNotificationEnabled,
  enableNotifications,
  disableNotifications,
  sendDesktopNotification,
  getNotificationPermission,
} from "../utils/browserNotifications";

// Icon components for clean vector look
const BellIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.9"
      d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
    />
  </svg>
);

const CheckDoubleIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M4.5 12.75l6 6 9-13.5M19.5 12.75l-4.5 4.5"
    />
  </svg>
);

const DesktopPushIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3"
    />
  </svg>
);

function formatRelativeTime(dateString) {
  if (!dateString) return "";
  const now = new Date();
  const date = new Date(dateString);
  const diffSecs = Math.floor((now - date) / 1000);

  if (diffSecs < 60) return "Just now";
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function getNotificationBadge(type, priority, category) {
  // Check category or type
  const c = category || type;
  switch (c) {
    case "ACT_NOW":
    case "LOSS_SIGNAL":
      return {
        icon: "🚨",
        bg: "bg-rose-100 text-rose-900 border-rose-300 font-black",
        label: "ACT NOW",
      };
    case "WARNING":
    case "REFUND_INCREASE":
    case "AOV_DECLINE":
    case "ACTION_FAILED":
      return {
        icon: "⚠️",
        bg: "bg-amber-100 text-amber-900 border-amber-300 font-bold",
        label: "WARNING",
      };
    case "OPPORTUNITY":
      return {
        icon: "💡",
        bg: "bg-cyan-100 text-cyan-900 border-cyan-300 font-bold",
        label: "OPPORTUNITY",
      };
    case "BUSINESS_UPDATE":
    case "DAILY_BRIEF":
      return {
        icon: "📊",
        bg: "bg-blue-100 text-[#002970] border-blue-300 font-bold",
        label: "BUSINESS UPDATE",
      };
    case "CONTEXT":
      return {
        icon: "🌦",
        bg: "bg-purple-100 text-purple-900 border-purple-300 font-bold",
        label: "CONTEXT",
      };
    case "POSITIVE_TREND":
    case "OUTCOME_MEASURED":
    case "OUTCOME_READY":
    case "HIGH_VALUE_CUSTOMER_ACTIVITY":
      return {
        icon: "✅",
        bg: "bg-emerald-100 text-emerald-900 border-emerald-300 font-bold",
        label: "POSITIVE TREND",
      };
    case "ACTION_REQUIRED":
      return {
        icon: "⚡",
        bg: "bg-amber-100 text-amber-900 border-amber-300",
        label: "Requires Approval",
      };
    case "ACTION_COMPLETED":
      return {
        icon: "🚀",
        bg: "bg-blue-100 text-blue-900 border-blue-300",
        label: "Dispatched",
      };
    case "TASK_ASSIGNED":
      return {
        icon: "📋",
        bg: "bg-blue-100 text-[#002970] border-blue-300",
        label: "Task Assigned",
      };
    case "TASK_COMPLETED":
      return {
        icon: "✅",
        bg: "bg-emerald-100 text-emerald-900 border-emerald-300",
        label: "Task Completed",
      };
    case "OUTCOME_AVAILABLE":
      return {
        icon: "🎯",
        bg: "bg-purple-100 text-purple-900 border-purple-300",
        label: "Campaign Result Ready",
      };
    default:
      return {
        icon: "🔔",
        bg: "bg-gray-100 text-gray-800 border-gray-200",
        label: priority || "Notice",
      };
  }
}

export default function NotificationCenter() {
  const { merchant } = useMerchantContext();
  const { currentRole } = useTeam();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState("all"); // 'all' | 'actions' | 'tasks' | 'unread'
  const [pushActive, setPushActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const popoverRef = useRef(null);
  const lastKnownCountRef = useRef(0);

  // Sync desktop push permission status
  useEffect(() => {
    setPushActive(isNotificationEnabled());
  }, []);

  const loadNotifications = useCallback(
    async (isBackground = false) => {
      if (!merchant?._id) return;
      try {
        if (!isBackground) setLoading(true);
        const res = await fetchMerchantNotifications(merchant._id, { role: currentRole });
        if (res.success) {
          const list = res.data || [];
          setNotifications(list);
          const unread = res.unreadCount ?? list.filter((n) => !n.read).length;
          setUnreadCount(unread);

          // If background check detected new unread items, trigger desktop push
          if (isBackground && unread > lastKnownCountRef.current && pushActive) {
            const newest = list.find((n) => !n.read);
            if (newest && (newest.priority === "CRITICAL" || newest.priority === "HIGH")) {
              sendDesktopNotification(`GrowKaro: ${newest.title}`, {
                body: newest.message,
                tag: `notif-${newest._id}`,
                onClick: () => {
                  if (newest.actionUrl) navigate(newest.actionUrl);
                },
              });
            }
          }
          lastKnownCountRef.current = unread;
        }
      } catch (err) {
        console.warn("Failed to load notifications:", err.message);
      } finally {
        if (!isBackground) setLoading(false);
      }
    },
    [merchant?._id, currentRole, pushActive, navigate]
  );

  // Load on mount or merchant change
  useEffect(() => {
    loadNotifications(false);
  }, [loadNotifications]);

  // Polling every 20 seconds
  useEffect(() => {
    if (!merchant?._id) return;
    const interval = setInterval(() => {
      loadNotifications(true);
    }, 20000);
    return () => clearInterval(interval);
  }, [merchant?._id, loadNotifications]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleMarkRead = async (notification) => {
    if (notification.read) return;
    try {
      await markNotificationRead(notification._id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notification._id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    if (!merchant?._id) return;
    try {
      await markAllNotificationsRead(merchant._id);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all read:", err);
    }
  };

  const handleTogglePush = async () => {
    if (pushActive) {
      disableNotifications();
      setPushActive(false);
    } else {
      const granted = await enableNotifications();
      setPushActive(granted);
    }
  };

  const handleActionClick = (notification) => {
    handleMarkRead(notification);
    setIsOpen(false);
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    } else if (
      notification.category === "TASK" ||
      notification.type === "TASK_ASSIGNED" ||
      notification.type === "TASK_COMPLETED"
    ) {
      navigate("/tasks");
    } else if (notification.requiresApproval) {
      navigate("/campaigns");
    } else if (notification.category === "OUTCOME") {
      navigate("/performance");
    }
  };

  // Filter list
  const filteredNotifications = notifications.filter((n) => {
    if (filter === "actions") return n.requiresApproval || n.type === "ACTION_REQUIRED";
    if (filter === "tasks") return n.category === "TASK" || n.type === "TASK_ASSIGNED" || n.type === "TASK_COMPLETED";
    if (filter === "unread") return !n.read;
    return true;
  });

  const requiresActionCount = notifications.filter(
    (n) => n.requiresApproval && !n.read
  ).length;

  const taskNotifsCount = notifications.filter(
    (n) => (n.category === "TASK" || n.type === "TASK_ASSIGNED" || n.type === "TASK_COMPLETED") && !n.read
  ).length;

  return (
    <div className="relative" ref={popoverRef}>
      {/* Header Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl text-gray-600 hover:text-gray-950 hover:bg-gray-100 transition-all focus:outline-none focus:ring-2 focus:ring-[#002970]/20"
        title="Notifications & Approval Alerts"
        aria-label="Open notifications"
      >
        <BellIcon className="w-5 h-5 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover / Slide-over Drawer */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 sm:w-[440px] max-w-[95vw] bg-white rounded-2xl shadow-2xl border border-gray-200/90 z-50 overflow-hidden flex flex-col max-h-[85vh] transition-all animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
            <div className="flex items-center gap-2.5">
              <h3 className="font-black text-gray-950 text-lg">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-xs md:text-sm font-extrabold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700">
                  {unreadCount} unread
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs md:text-sm font-bold text-[#002970] hover:text-blue-800 flex items-center gap-1.5 hover:underline"
                >
                  <CheckDoubleIcon />
                  <span>Mark all read</span>
                </button>
              )}
            </div>
          </div>

          {/* Desktop Push Opt-in Strip */}
          {isBrowserNotificationSupported() && (
            <div className="px-4 py-2.5 bg-blue-50/70 border-b border-blue-100 flex items-center justify-between text-xs md:text-sm">
              <div className="flex items-center gap-2 text-blue-950 font-bold">
                <DesktopPushIcon />
                <span>Desktop Alerts</span>
              </div>
              <button
                onClick={handleTogglePush}
                className={`text-xs font-bold px-3 py-1 rounded-lg transition-all ${
                  pushActive
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "bg-white text-blue-700 border border-blue-200 hover:bg-blue-50"
                }`}
              >
                {pushActive ? "✓ Active" : "Enable Alerts"}
              </button>
            </div>
          )}

          {/* Filter Tabs */}
          <div className="flex border-b border-gray-100 px-3 pt-2 bg-white gap-1.5 text-xs md:text-sm font-bold">
            <button
              onClick={() => setFilter("all")}
              className={`px-3.5 py-2 rounded-xl transition-all ${
                filter === "all"
                  ? "bg-gray-100 text-gray-950 font-black"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter("actions")}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                filter === "actions"
                  ? "bg-amber-100 text-amber-950 font-black"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <span>Requires Approval</span>
              {requiresActionCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-xs font-black flex items-center justify-center">
                  {requiresActionCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilter("tasks")}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                filter === "tasks"
                  ? "bg-blue-100 text-[#002970] font-black"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <span>Tasks</span>
              {taskNotifsCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center">
                  {taskNotifsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-3.5 py-2 rounded-xl transition-all ${
                filter === "unread"
                  ? "bg-gray-100 text-gray-950 font-black"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notifications Scroll Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100 max-h-[480px]">
            {loading && notifications.length === 0 ? (
              <div className="py-12 text-center text-sm md:text-base text-gray-400">Loading alerts...</div>
            ) : filteredNotifications.length === 0 ? (
              <div className="py-14 text-center px-6">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3 text-xl">
                  🔔
                </div>
                <h4 className="text-base font-bold text-gray-800">All caught up!</h4>
                <p className="text-sm text-gray-500 mt-1">
                  {filter === "actions"
                    ? "No pending approvals requiring merchant review."
                    : "No notifications to display right now."}
                </p>
              </div>
            ) : (
              filteredNotifications.map((n) => {
                const badge = getNotificationBadge(n.type, n.priority, n.category);
                return (
                  <div
                    key={n._id}
                    onClick={() => handleMarkRead(n)}
                    className={`p-4 transition-all cursor-pointer flex gap-3.5 hover:bg-gray-50/90 ${
                      !n.read ? "bg-blue-50/30 font-medium" : "bg-white text-gray-600"
                    }`}
                  >
                    {/* Icon */}
                    <div className="text-2xl shrink-0 mt-0.5">{badge.icon}</div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span
                          className={`text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-md border ${badge.bg}`}
                        >
                          {badge.label}
                        </span>
                        <span className="text-xs md:text-sm text-gray-500 font-medium shrink-0">
                          {formatRelativeTime(n.createdAt)}
                        </span>
                      </div>

                      <h4
                        className={`text-sm md:text-base leading-snug ${
                          !n.read ? "font-black text-gray-950" : "font-bold text-gray-800"
                        }`}
                      >
                        {n.title}
                      </h4>

                      <p className="text-xs md:text-sm text-gray-700 mt-1 line-clamp-2 leading-relaxed font-normal">
                        {n.message}
                      </p>

                      {/* Action Required Quick Trigger */}
                      {n.requiresApproval && (
                        <div className="mt-3 flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleActionClick(n);
                            }}
                            className="px-3.5 py-2 rounded-xl text-xs md:text-sm font-bold bg-[#002970] text-white hover:bg-blue-800 transition-all shadow-2xs flex items-center gap-1.5"
                          >
                            <span>Review &amp; Approve</span>
                            <span className="text-base leading-none">›</span>
                          </button>
                        </div>
                      )}

                      {n.category === "OUTCOME" && (
                        <div className="mt-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleActionClick(n);
                            }}
                            className="px-3.5 py-2 rounded-xl text-xs md:text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-2xs flex items-center gap-1.5"
                          >
                            <span>View Performance Impact</span>
                            <span className="text-base leading-none">›</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Unread indicator dot */}
                    {!n.read && (
                      <div className="shrink-0 self-center">
                        <span className="block w-2.5 h-2.5 rounded-full bg-blue-600 ring-2 ring-blue-100" />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs md:text-sm text-gray-600 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Real-time polling active</span>
            </span>
            <button
              onClick={() => {
                setIsOpen(false);
                navigate("/activity");
              }}
              className="text-[#002970] font-bold hover:underline"
            >
              Full Activity Timeline ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
