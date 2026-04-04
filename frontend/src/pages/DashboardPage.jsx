import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell, CalendarDays, Wrench, Key, Ticket,
  ArrowRight, Clock, MapPin, AlertTriangle,
  CheckCircle2, XCircle, Loader2, Users, RefreshCw
} from "lucide-react";
import { useAuth } from "../components/AuthContext";
import { apiRequest } from "../components/api";

/* ── Helpers ─────────────────────────────────────────────── */
function greeting(name) {
  const h = new Date().getHours();
  const salutation = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  const first = name?.split(" ")[0] || "there";
  return `${salutation}, ${first}.`;
}

function timeAgo(date) {
  if (!date) return "";
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmtDate(date) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric"
  });
}

function fmtTime(date) {
  if (!date) return "";
  return new Date(date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

const TICKET_BADGE = {
  open:        "bg-sky-100 text-sky-700",
  in_progress: "bg-amber-100 text-amber-700",
  resolved:    "bg-emerald-100 text-emerald-700",
  closed:      "bg-slate-100 text-slate-600",
};

const BOOKING_BADGE = {
  pending:  "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
};

/* ── Sub-components ──────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, iconCls, loading }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconCls}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        {loading
          ? <div className="mt-1 h-7 w-10 animate-pulse rounded-lg bg-slate-100" />
          : <p className="mt-0.5 text-2xl font-black text-slate-900">{value}</p>
        }
      </div>
    </div>
  );
}

function SectionCard({ title, to, linkLabel = "View all", children, empty }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-extrabold text-slate-900">{title}</h3>
        {to && (
          <Link to={to} className="flex items-center gap-1 text-xs font-semibold text-emerald-600 transition hover:text-emerald-700">
            {linkLabel} <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
      {empty
        ? <p className="py-4 text-center text-sm text-slate-400">{empty}</p>
        : children
      }
    </div>
  );
}

function Divider() {
  return <div className="border-t border-slate-50" />;
}

/* ── Main Component ──────────────────────────────────────── */
export function DashboardPage() {
  const { token, user } = useAuth();
  const isAdmin = ["committee", "super_admin"].includes(user?.role);

  const [announcements, setAnnouncements]       = useState([]);
  const [tickets, setTickets]                   = useState([]);
  const [events, setEvents]                     = useState([]);
  const [bookings, setBookings]                 = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [loading, setLoading]                   = useState(true);
  const [error, setError]                       = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const calls = [
        apiRequest("/announcements", { token }),
        apiRequest("/tickets", { token }),
        apiRequest("/events", { token }),
        apiRequest("/amenities/bookings", { token }),
      ];
      if (isAdmin) calls.push(apiRequest("/admin/pending-approvals", { token }));

      const results = await Promise.all(calls);
      setAnnouncements(results[0].items || []);
      setTickets(results[1].items || []);
      setEvents(results[2].items || []);
      setBookings(results[3].items || []);
      if (isAdmin) setPendingApprovals((results[4].items || []).length);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, isAdmin]);

  useEffect(() => { load(); }, [load]);

  const userId = user?._id || user?.id || "";

  const stats = useMemo(() => ({
    announcements: announcements.length,
    openTickets:   tickets.filter(t => !["resolved", "closed"].includes(t.status)).length,
    upcomingEvents:events.filter(e => new Date(e.startAt) >= new Date()).length,
    myBookings:    bookings.filter(b => (b.requestedBy?._id || b.requestedBy) === userId).length,
  }), [announcements, tickets, events, bookings, userId]);

  const recentAnnouncements = announcements.slice(0, 4);
  const openTickets         = tickets.filter(t => !["resolved", "closed"].includes(t.status)).slice(0, 4);
  const upcomingEvents      = events
    .filter(e => new Date(e.startAt) >= new Date())
    .sort((a, b) => new Date(a.startAt) - new Date(b.startAt))
    .slice(0, 3);
  const myBookings          = bookings
    .filter(b => (b.requestedBy?._id || b.requestedBy) === userId)
    .slice(0, 3);

  return (
    <div className="pb-12">
      <div className="space-y-6 pt-4">

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
            <XCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        {/* Welcome banner */}
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              {greeting(user?.fullName)}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 capitalize">
              {user?.role?.replace("_", " ")}
            </span>
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Admin: pending approvals alert */}
        {isAdmin && pendingApprovals > 0 && (
          <Link
            to="/admin/approvals"
            className="flex items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-4 transition hover:bg-amber-100"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
              <div>
                <p className="font-bold text-amber-900">
                  {pendingApprovals} membership {pendingApprovals === 1 ? "request" : "requests"} awaiting your approval
                </p>
                <p className="text-sm text-amber-700">Residents are waiting to join the society</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-amber-600" />
          </Link>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={Bell}        label="Announcements"  value={stats.announcements}  iconCls="bg-amber-50 text-amber-500"   loading={loading} />
          <StatCard icon={Ticket}      label="Open Tickets"   value={stats.openTickets}    iconCls="bg-rose-50 text-rose-500"     loading={loading} />
          <StatCard icon={CalendarDays}label="Upcoming Events"value={stats.upcomingEvents} iconCls="bg-violet-50 text-violet-500" loading={loading} />
          <StatCard icon={Key}         label="My Bookings"    value={stats.myBookings}     iconCls="bg-sky-50 text-sky-500"       loading={loading} />
        </div>

        {/* Main content grid */}
        <div className="grid gap-6 lg:grid-cols-5">

          {/* Left col — Announcements + Tickets */}
          <div className="space-y-6 lg:col-span-3">

            <SectionCard
              title="Recent Announcements"
              to="/announcements"
              empty={!loading && !recentAnnouncements.length ? "No announcements yet." : ""}
            >
              {loading
                ? <LoadingRows n={3} />
                : recentAnnouncements.map((a, i) => (
                  <div key={a._id}>
                    {i > 0 && <Divider />}
                    <div className="py-3">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-semibold text-slate-800 leading-snug">{a.title}</p>
                        <span className="shrink-0 text-xs text-slate-400">{timeAgo(a.createdAt)}</span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500 line-clamp-2">{a.body}</p>
                      <p className="mt-1.5 text-xs text-slate-400">
                        By {a.createdBy?.fullName || "Committee"}
                      </p>
                    </div>
                  </div>
                ))
              }
            </SectionCard>

            <SectionCard
              title="Open Tickets"
              to="/tickets"
              empty={!loading && !openTickets.length ? "No open tickets. All good!" : ""}
            >
              {loading
                ? <LoadingRows n={3} />
                : openTickets.map((t, i) => (
                  <div key={t._id}>
                    {i > 0 && <Divider />}
                    <div className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 truncate">{t.title}</p>
                        <p className="mt-0.5 text-xs text-slate-400 capitalize">{t.category || "General"}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${TICKET_BADGE[t.status] || "bg-slate-100 text-slate-600"}`}>
                        {t.status?.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                ))
              }
            </SectionCard>
          </div>

          {/* Right col — Events + Bookings */}
          <div className="space-y-6 lg:col-span-2">

            <SectionCard
              title="Upcoming Events"
              to="/events"
              empty={!loading && !upcomingEvents.length ? "No upcoming events." : ""}
            >
              {loading
                ? <LoadingRows n={2} />
                : upcomingEvents.map((e, i) => (
                  <div key={e._id}>
                    {i > 0 && <Divider />}
                    <div className="py-3">
                      <p className="font-semibold text-slate-800 leading-snug">{e.title}</p>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Clock className="h-3.5 w-3.5" />
                          {fmtDate(e.startAt)} · {fmtTime(e.startAt)}
                        </div>
                        {e.location && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <MapPin className="h-3.5 w-3.5" />
                            {e.location}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              }
            </SectionCard>

            <SectionCard
              title="My Bookings"
              to="/amenities"
              empty={!loading && !myBookings.length ? "No bookings yet." : ""}
            >
              {loading
                ? <LoadingRows n={2} />
                : myBookings.map((b, i) => (
                  <div key={b._id}>
                    {i > 0 && <Divider />}
                    <div className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 truncate">{b.amenityName || "Amenity"}</p>
                        <p className="mt-0.5 text-xs text-slate-400">{b.date} · {b.startTime}–{b.endTime}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${BOOKING_BADGE[b.status] || "bg-slate-100 text-slate-600"}`}>
                        {b.status}
                      </span>
                    </div>
                  </div>
                ))
              }
            </SectionCard>

            {/* Admin quick links */}
            {isAdmin && (
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <h3 className="mb-4 font-extrabold text-slate-900">Admin</h3>
                <div className="space-y-2">
                  <Link to="/admin/approvals"
                    className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                    <div className="flex items-center gap-2.5">
                      <Users className="h-4 w-4 text-emerald-600" />
                      Pending Approvals
                    </div>
                    {pendingApprovals > 0 && (
                      <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white">
                        {pendingApprovals}
                      </span>
                    )}
                  </Link>
                  <Link to="/admin/society-setup"
                    className="flex items-center gap-2.5 rounded-xl border border-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                    <Wrench className="h-4 w-4 text-emerald-600" />
                    Society Setup
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingRows({ n = 3 }) {
  return (
    <div className="space-y-4">
      {[...Array(n)].map((_, i) => (
        <div key={i} className="space-y-2 py-1">
          <div className="h-4 w-3/4 animate-pulse rounded-lg bg-slate-100" />
          <div className="h-3 w-1/2 animate-pulse rounded-lg bg-slate-100" />
        </div>
      ))}
    </div>
  );
}
