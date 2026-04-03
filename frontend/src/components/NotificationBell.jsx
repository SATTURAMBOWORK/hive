import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, X } from "lucide-react";
import { useAuth } from "./AuthContext";
import { apiRequest } from "./api";
import { getSocket } from "./socket";

export function NotificationBell() {
  const { token, isLoggedIn } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  async function load() {
    try {
      const data = await apiRequest("/notifications", { token });
      setNotifications(data.notifications || []);
    } catch (_) {}
  }

  async function markOne(id) {
    try {
      await apiRequest(`/notifications/${id}/read`, { method: "PATCH", token });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (_) {}
  }

  async function markAll() {
    try {
      await apiRequest("/notifications/read-all", { method: "PATCH", token });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (_) {}
  }

  // Load on mount and socket push
  useEffect(() => {
    if (!isLoggedIn) return;
    load();

    const socket = getSocket();
    function onNew({ notification }) {
      setNotifications((prev) => [notification, ...prev]);
    }
    socket.on("notification:created", onNew);
    return () => socket.off("notification:created", onNew);
  }, [isLoggedIn]);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!isLoggedIn) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-extrabold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-extrabold text-slate-900">
              Notifications {unreadCount > 0 && (
                <span className="ml-1.5 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                  {unreadCount} new
                </span>
              )}
            </p>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAll}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                  title="Mark all as read"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  All read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <ul className="max-h-80 overflow-y-auto divide-y divide-slate-50">
            {!notifications.length && (
              <li className="px-4 py-8 text-center text-sm text-slate-400">
                No notifications yet
              </li>
            )}
            {notifications.map((n) => (
              <li
                key={n._id}
                onClick={() => !n.isRead && markOne(n._id)}
                className={`flex cursor-pointer gap-3 px-4 py-3.5 transition hover:bg-slate-50 ${
                  !n.isRead ? "bg-emerald-50/50" : ""
                }`}
              >
                {/* Unread dot */}
                <div className="mt-1.5 shrink-0">
                  <div className={`h-2 w-2 rounded-full ${!n.isRead ? "bg-emerald-500" : "bg-transparent"}`} />
                </div>
                <div className="min-w-0">
                  <p className={`text-sm ${!n.isRead ? "font-semibold text-slate-900" : "font-medium text-slate-700"}`}>
                    {n.title}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{n.message}</p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {new Date(n.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                    })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
