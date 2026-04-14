import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell, CalendarDays, Ticket, ArrowRight,
  MapPin, XCircle, Wrench, Megaphone,
  RefreshCw, Plus, BookOpen, ChevronRight,
  CheckCircle, Zap, Users,
} from "lucide-react";
import { useAuth } from "../components/AuthContext";
import { apiRequest } from "../components/api";
import { getSocket } from "../components/socket";
import { SecurityDashboard } from "./SecurityDashboard";

/* ─── Design tokens ──────────────────────────────────────────── */
const T = {
  bg:           "#0a0907",
  surface:      "#111008",
  surfaceRaised:"#181510",
  border:       "rgba(200,145,74,0.12)",
  borderHover:  "rgba(200,145,74,0.28)",
  gold:         "#c8914a",
  goldLight:    "#e8c47a",
  textPrimary:  "#f5f0e8",
  textSecondary:"rgba(245,240,232,0.55)",
  textMuted:    "rgba(245,240,232,0.3)",
  green:        "#3d9e6e",
  red:          "#e85d5d",
  amber:        "#d4a843",
  blue:         "#4d8dd4",
};

/* ─── Injected CSS ───────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;600&display=swap');

  .dash-root * { box-sizing: border-box; }
  .dash-root { font-family: 'DM Sans', sans-serif; }
  .dash-display { font-family: 'Cormorant Garamond', serif !important; }

  /* Staggered widget entrance */
  @keyframes wFadeUp {
    from { opacity: 0; transform: translateY(22px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .w-enter {
    opacity: 0;
    animation: wFadeUp 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }

  /* Skeleton shimmer */
  @keyframes skShimmer {
    0%   { background-position:  200% center; }
    100% { background-position: -200% center; }
  }
  .sk {
    background: linear-gradient(90deg,
      rgba(255,255,255,0.04) 25%,
      rgba(255,255,255,0.07) 50%,
      rgba(255,255,255,0.04) 75%
    );
    background-size: 200% 100%;
    animation: skShimmer 1.6s ease-in-out infinite;
    border-radius: 8px;
  }

  /* Spin */
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Gold shimmer text */
  @keyframes goldShimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  .gold-shimmer {
    background: linear-gradient(90deg, #c8914a 0%, #f0d49a 40%, #c8914a 60%, #e8c47a 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: goldShimmer 3s linear infinite;
  }

  /* Announcement item hover */
  .ann-item {
    position: relative;
    padding: 14px 16px 14px 20px;
    border-radius: 12px;
    border: 1px solid rgba(200,145,74,0.08);
    background: rgba(255,255,255,0.02);
    transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
    cursor: default;
  }
  .ann-item::before {
    content: '';
    position: absolute;
    left: 0; top: 12px; bottom: 12px;
    width: 3px;
    border-radius: 2px;
    background: linear-gradient(180deg, #c8914a, #e8c47a);
    opacity: 0.6;
    transition: opacity 0.2s, height 0.2s;
  }
  .ann-item:hover {
    transform: translateY(-2px);
    border-color: rgba(200,145,74,0.22);
    box-shadow: 0 6px 24px rgba(200,145,74,0.08);
  }
  .ann-item:hover::before { opacity: 1; }

  /* Quick action tile */
  .qa-tile {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 18px 12px;
    border-radius: 14px;
    border: 1px solid rgba(200,145,74,0.1);
    background: rgba(255,255,255,0.025);
    text-decoration: none;
    transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
  }
  .qa-tile:hover {
    transform: scale(1.04) translateY(-2px);
    border-color: rgba(200,145,74,0.28);
    background: rgba(200,145,74,0.06);
    box-shadow: 0 8px 24px rgba(200,145,74,0.1);
  }

  /* Event row hover */
  .ev-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    border-radius: 12px;
    border: 1px solid rgba(200,145,74,0.08);
    background: rgba(255,255,255,0.02);
    margin-bottom: 8px;
    transition: transform 0.2s, border-color 0.2s, background 0.2s;
  }
  .ev-row:hover {
    transform: translateX(4px);
    border-color: rgba(200,145,74,0.22);
    background: rgba(200,145,74,0.04);
  }

  /* Stat card */
  .stat-card {
    flex: 1;
    border-radius: 16px;
    padding: 20px 22px 18px;
    border: 1px solid rgba(200,145,74,0.1);
    background: #111008;
    position: relative;
    overflow: hidden;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .stat-card:hover {
    border-color: rgba(200,145,74,0.22);
    box-shadow: 0 8px 32px rgba(0,0,0,0.35);
  }

  /* Sync button */
  .sync-btn {
    display: flex; align-items: center; gap: 6px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.76rem; font-weight: 500;
    color: rgba(245,240,232,0.4);
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(200,145,74,0.1);
    padding: 6px 13px; border-radius: 100px;
    cursor: pointer;
    transition: color 0.2s, border-color 0.2s, background 0.2s;
  }
  .sync-btn:hover {
    color: #c8914a;
    border-color: rgba(200,145,74,0.28);
    background: rgba(200,145,74,0.06);
  }
  .sync-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Admin workspace link */
  .admin-link {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 14px; border-radius: 11px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.06);
    margin-bottom: 7px; text-decoration: none;
    transition: background 0.2s, border-color 0.2s;
  }
  .admin-link:hover {
    background: rgba(200,145,74,0.08);
    border-color: rgba(200,145,74,0.2);
  }

  /* Visitor card */
  .visitor-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(200,145,74,0.15);
    border-radius: 14px;
    padding: 14px;
    margin-bottom: 10px;
  }

  @media (max-width: 860px) {
    .dash-grid { grid-template-columns: 1fr !important; }
    .stats-row { flex-wrap: wrap; }
    .stats-row .stat-card { min-width: calc(50% - 6px); }
  }
`;

/* ─── Helpers ─────────────────────────────────────────────────── */
function greeting(name) {
  const h = new Date().getHours();
  const word = h < 12 ? "Morning" : h < 17 ? "Afternoon" : "Evening";
  return { word, first: name?.split(" ")[0] || "there" };
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
function fmtDate(d) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
function fmtTime(d) {
  if (!d) return "";
  return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}
function fmtDay(d)   { return new Date(d).toLocaleDateString("en-IN", { day: "numeric" }); }
function fmtMonth(d) { return new Date(d).toLocaleDateString("en-IN", { month: "short" }); }

/* Feed builder — unchanged from original */
function buildFeed(announcements, tickets, events) {
  const items = [];
  announcements.slice(0, 5).forEach(a =>
    items.push({ type: "announcement", date: a.createdAt, data: a }));
  tickets
    .filter(t => !["resolved", "closed"].includes(t.status))
    .slice(0, 5)
    .forEach(t => items.push({ type: "ticket", date: t.createdAt, data: t }));
  events
    .filter(e => new Date(e.startAt) >= new Date())
    .slice(0, 3)
    .forEach(e => items.push({ type: "event", date: e.startAt, data: e }));
  return items.sort((a, b) => new Date(b.date) - new Date(a.date));
}

/* ─── Count-up hook ───────────────────────────────────────────── */
function useCountUp(target, duration = 900) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!target) { setCount(0); return; }
    let current = 0;
    const step = Math.max(1, Math.ceil(target / (duration / 16)));
    const id = setInterval(() => {
      current = Math.min(current + step, target);
      setCount(current);
      if (current >= target) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [target, duration]);
  return count;
}

/* ─── Skeleton ────────────────────────────────────────────────── */
function Sk({ style = {} }) {
  return <div className="sk" style={style} />;
}

/* ─── Dark card wrapper ───────────────────────────────────────── */
function Card({ children, style = {} }) {
  return (
    <div
      style={{
        background:   T.surface,
        border:       `1px solid ${T.border}`,
        borderRadius: 20,
        padding:      "24px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ─── Section header ──────────────────────────────────────────── */
function SectionHeader({ eyebrow, title, linkTo, linkLabel }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 20 }}>
      <div>
        <p style={{ fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: T.gold, marginBottom: 4, opacity: 0.75 }}>
          {eyebrow}
        </p>
        <h2
          className="dash-display"
          style={{ fontSize: "1.35rem", color: T.textPrimary, fontWeight: 600, lineHeight: 1.15, margin: 0 }}
        >
          {title}
        </h2>
      </div>
      {linkTo && (
        <Link
          to={linkTo}
          style={{
            fontFamily:    "'DM Sans', sans-serif",
            fontSize:      "0.72rem", fontWeight: 500,
            color:         T.textMuted,
            textDecoration:"none",
            padding:       "5px 12px",
            borderRadius:  "100px",
            border:        `1px solid ${T.border}`,
            background:    "rgba(255,255,255,0.03)",
            transition:    "color 0.2s, border-color 0.2s",
            display:       "flex", alignItems: "center", gap: 4,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = T.gold; e.currentTarget.style.borderColor = T.borderHover; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = T.textMuted; e.currentTarget.style.borderColor = T.border; }}
        >
          {linkLabel || "View all"} <ChevronRight size={11} />
        </Link>
      )}
    </div>
  );
}

/* ─── Stat card ───────────────────────────────────────────────── */
function StatCard({ label, value, accentColor, icon: Icon, loading, delay }) {
  const count = useCountUp(loading ? 0 : value);
  return (
    <div className="stat-card w-enter" style={{ animationDelay: delay }}>
      {/* Coloured top strip */}
      <div
        style={{
          position: "absolute", top: 0, left: 0, right: 0,
          height: "3px",
          background: `linear-gradient(90deg, ${accentColor}cc, ${accentColor}44)`,
          borderRadius: "16px 16px 0 0",
        }}
      />
      {/* Icon + label row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <p style={{ fontSize: "0.72rem", fontWeight: 500, color: T.textMuted, letterSpacing: "0.05em", textTransform: "uppercase", margin: 0 }}>
          {label}
        </p>
        <div
          style={{
            width: 28, height: 28, borderRadius: 8,
            background: `${accentColor}18`,
            border: `1px solid ${accentColor}30`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <Icon size={13} style={{ color: accentColor }} />
        </div>
      </div>
      {/* Count */}
      {loading
        ? <Sk style={{ width: 48, height: 36 }} />
        : (
          <span
            className="dash-display"
            style={{ fontSize: "2.5rem", lineHeight: 1, color: T.textPrimary, fontWeight: 600 }}
          >
            {count}
          </span>
        )
      }
    </div>
  );
}

/* ─── Status chip ─────────────────────────────────────────────── */
const STATUS_COLORS = {
  open:        { bg: "rgba(77,141,212,0.12)", color: T.blue,  border: "rgba(77,141,212,0.25)" },
  in_progress: { bg: "rgba(212,168,67,0.12)", color: T.amber, border: "rgba(212,168,67,0.25)" },
  resolved:    { bg: "rgba(61,158,110,0.12)", color: T.green, border: "rgba(61,158,110,0.25)" },
  closed:      { bg: "rgba(245,240,232,0.06)", color: T.textMuted, border: "rgba(245,240,232,0.1)" },
};

function StatusChip({ status }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.open;
  return (
    <span
      style={{
        padding:       "3px 9px",
        borderRadius:  "100px",
        fontSize:      "0.65rem", fontWeight: 700,
        textTransform: "uppercase", letterSpacing: "0.07em",
        background:    s.bg, color: s.color, border: `1px solid ${s.border}`,
      }}
    >
      {status?.replace("_", " ")}
    </span>
  );
}

/* ─── Feed type config ────────────────────────────────────────── */
const FEED_CFG = {
  announcement: { label: "Notice", color: T.blue,  emoji: "📢" },
  ticket:       { label: "Ticket", color: T.red,   emoji: "🎫" },
  event:        { label: "Event",  color: T.green,  emoji: "📅" },
};

function TypeChip({ type }) {
  const cfg = FEED_CFG[type];
  return (
    <span
      style={{
        display:       "inline-flex", alignItems: "center", gap: 4,
        padding:       "3px 9px", borderRadius: "100px",
        fontSize:      "0.62rem", fontWeight: 700,
        textTransform: "uppercase", letterSpacing: "0.08em",
        background:    `${cfg.color}14`,
        color:         cfg.color,
        border:        `1px solid ${cfg.color}28`,
      }}
    >
      {cfg.emoji} {cfg.label}
    </span>
  );
}

function MetaPill({ children }) {
  return (
    <span
      style={{
        display:    "inline-flex", alignItems: "center", gap: 4,
        padding:    "3px 9px", borderRadius: 7,
        background: "rgba(255,255,255,0.04)", border: `1px solid ${T.border}`,
        fontSize:   "0.7rem", fontWeight: 500, color: T.textMuted,
      }}
    >
      {children}
    </span>
  );
}

/* ─── Feed item ───────────────────────────────────────────────── */
function FeedItem({ item, isLast }) {
  const cfg = FEED_CFG[item.type];
  const d   = item.data;
  return (
    <div
      className="ann-item"
      style={{ marginBottom: isLast ? 0 : 8 }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
        <TypeChip type={item.type} />
        <span style={{ fontSize: "0.68rem", color: T.textMuted, whiteSpace: "nowrap" }}>
          {timeAgo(item.date)}
        </span>
      </div>
      <p style={{ fontSize: "0.9rem", fontWeight: 500, color: T.textPrimary, lineHeight: 1.4, margin: "0 0 6px" }}>
        {d.title || d.amenityName || "—"}
      </p>
      {item.type === "announcement" && d.body && (
        <p style={{ fontSize: "0.8rem", color: T.textSecondary, lineHeight: 1.5, margin: 0 }}>
          {d.body.length > 100 ? d.body.slice(0, 100) + "…" : d.body}
        </p>
      )}
      {item.type === "ticket" && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
          {d.category && <MetaPill>{d.category}</MetaPill>}
          {d.status && <StatusChip status={d.status} />}
        </div>
      )}
      {item.type === "event" && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
          <MetaPill>📅 {fmtDate(d.startAt)} · {fmtTime(d.startAt)}</MetaPill>
          {d.location && <MetaPill>📍 {d.location}</MetaPill>}
        </div>
      )}
    </div>
  );
}

/* ─── Quick action tile ───────────────────────────────────────── */
function QuickAction({ to, Icon, label, accentColor }) {
  return (
    <Link to={to} className="qa-tile">
      <div
        style={{
          width: 40, height: 40, borderRadius: 12,
          background: `${accentColor}15`,
          border: `1px solid ${accentColor}28`,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.2s",
        }}
      >
        <Icon size={18} style={{ color: accentColor }} />
      </div>
      <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.75rem", fontWeight: 500, color: T.textSecondary, textAlign: "center", lineHeight: 1.3 }}>
        {label}
      </span>
    </Link>
  );
}

/* ─── Event row ───────────────────────────────────────────────── */
function EventRow({ event }) {
  return (
    <div className="ev-row">
      {/* Gold date badge */}
      <div
        style={{
          display:        "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center",
          width:          44, height: 44, borderRadius: 12, flexShrink: 0,
          background:     "rgba(200,145,74,0.1)",
          border:         "1px solid rgba(200,145,74,0.22)",
        }}
      >
        <span
          className="dash-display"
          style={{ fontSize: "1.1rem", lineHeight: 1, color: T.gold, fontWeight: 700 }}
        >
          {fmtDay(event.startAt)}
        </span>
        <span style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.gold, opacity: 0.7 }}>
          {fmtMonth(event.startAt)}
        </span>
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: "0.86rem", fontWeight: 500, color: T.textPrimary, margin: "0 0 3px", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {event.title}
        </p>
        <p style={{ fontSize: "0.72rem", color: T.textMuted, margin: 0 }}>
          {event.location ? `📍 ${event.location} · ` : ""}{fmtTime(event.startAt)}
        </p>
      </div>
    </div>
  );
}

/* ─── Booking status config ───────────────────────────────────── */
const BK_STATUS = {
  approved: { bg: "rgba(61,158,110,0.12)",  color: T.green, border: "rgba(61,158,110,0.25)"  },
  pending:  { bg: "rgba(212,168,67,0.12)",  color: T.amber, border: "rgba(212,168,67,0.25)"  },
  rejected: { bg: "rgba(232,93,93,0.12)",   color: T.red,   border: "rgba(232,93,93,0.25)"   },
};

function BookingRow({ b }) {
  const ss = BK_STATUS[b.status] || BK_STATUS.pending;
  return (
    <div
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
        padding: "11px 14px", borderRadius: 12, marginBottom: 8,
        background: "rgba(255,255,255,0.025)", border: `1px solid ${T.border}`,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: "0.85rem", fontWeight: 500, color: T.textPrimary, margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {b.amenityName}
        </p>
        <p style={{ fontSize: "0.7rem", color: T.textMuted, margin: 0 }}>
          {b.date} · {b.startTime}–{b.endTime}
        </p>
      </div>
      <span
        style={{
          padding:       "3px 9px", borderRadius: "100px", flexShrink: 0,
          fontSize:      "0.62rem", fontWeight: 700,
          textTransform: "uppercase", letterSpacing: "0.06em",
          background:    ss.bg, color: ss.color, border: `1px solid ${ss.border}`,
        }}
      >
        {b.status}
      </span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════════════════════════════ */
export function DashboardPage() {
  const { token, user, membership } = useAuth();

  /* Route security staff to their own dashboard */
  if (user?.role === "security") return <SecurityDashboard />;

  const isAdmin    = ["committee", "super_admin"].includes(user?.role);
  const isResident = user?.role === "resident";

  /* ── State — identical to original ── */
  const [announcements,    setAnnouncements]    = useState([]);
  const [tickets,          setTickets]          = useState([]);
  const [events,           setEvents]           = useState([]);
  const [bookings,         setBookings]         = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [visitorRequests,  setVisitorRequests]  = useState([]);
  const [respondingId,     setRespondingId]     = useState(null);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState("");

  /* ── Data load — identical to original ── */
  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true); setError("");
    try {
      const calls = [
        apiRequest("/announcements",      { token }),
        apiRequest("/tickets",            { token }),
        apiRequest("/events",             { token }),
        apiRequest("/amenities/bookings", { token }),
      ];
      if (isAdmin)    calls.push(apiRequest("/admin/pending-approvals", { token }));
      if (isResident) calls.push(apiRequest("/visitors/my-requests",   { token }));

      const results = await Promise.all(calls);
      setAnnouncements(results[0].items || []);
      setTickets(results[1].items || []);
      setEvents(results[2].items || []);
      setBookings(results[3].items || []);
      if (isAdmin)    setPendingApprovals((results[4].items || []).length);
      if (isResident) setVisitorRequests(results[isAdmin ? 5 : 4]?.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, isAdmin, isResident]);

  useEffect(() => { load(); }, [load]);

  /* ── Real-time socket — identical to original ── */
  useEffect(() => {
    if (!isResident) return;
    const socket = getSocket();
    function onIncoming({ visitor }) {
      setVisitorRequests(prev => [visitor, ...prev.filter(v => v._id !== visitor._id)]);
    }
    socket.on("visitor:request_incoming", onIncoming);
    return () => socket.off("visitor:request_incoming", onIncoming);
  }, [isResident]);

  /* ── Visitor response — identical to original ── */
  async function respondToVisitor(visitorId, decision) {
    setRespondingId(visitorId);
    try {
      await apiRequest(`/visitors/${visitorId}/respond`, { token, method: "PATCH", body: { decision } });
      setVisitorRequests(prev => prev.filter(v => v._id !== visitorId));
    } catch (err) {
      setError(err.message);
    } finally {
      setRespondingId(null);
    }
  }

  /* ── Derived data — identical to original ── */
  const userId         = user?._id || user?.id || "";
  const { word, first }= greeting(user?.fullName);
  const openTickets    = useMemo(() => tickets.filter(t => !["resolved","closed"].includes(t.status)), [tickets]);
  const upcomingEvents = useMemo(() =>
    events.filter(e => new Date(e.startAt) >= new Date())
          .sort((a, b) => new Date(a.startAt) - new Date(b.startAt)),
    [events]);
  const myBookings = useMemo(() =>
    bookings.filter(b => (b.requestedBy?._id || b.requestedBy) === userId).slice(0, 3),
    [bookings, userId]);
  const feed = useMemo(() => buildFeed(announcements, tickets, events), [announcements, tickets, events]);

  const flatLabel = membership?.wingId?.name && membership?.unitId?.unitNumber
    ? `${membership.wingId.name}-${membership.unitId.unitNumber}` : null;

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" });

  return (
    <>
      <style>{CSS}</style>
      <div
        className="dash-root"
        style={{ background: T.bg, minHeight: "100vh", padding: "28px 0 64px" }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 4px" }}>

          {/* ── Error banner ──────────────────────────────── */}
          {error && (
            <div
              style={{
                display: "flex", alignItems: "center", gap: 12,
                background: "rgba(232,93,93,0.08)", border: `1px solid rgba(232,93,93,0.25)`,
                borderRadius: 14, padding: "13px 18px",
                fontSize: "0.87rem", color: T.red, marginBottom: 20,
              }}
            >
              <XCircle size={16} /> {error}
            </div>
          )}

          {/* ══ HERO — Greeting ══════════════════════════════ */}
          <div
            className="w-enter"
            style={{
              position: "relative", overflow: "hidden",
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: 24, padding: "32px 36px",
              marginBottom: 16,
              display: "flex", alignItems: "flex-end", justifyContent: "space-between",
              gap: 20, flexWrap: "wrap",
              animationDelay: "0ms",
            }}
          >
            {/* Decorative radial glow */}
            <div
              style={{
                position: "absolute", top: -60, right: -60,
                width: 280, height: 280, borderRadius: "50%",
                background: "radial-gradient(circle, rgba(200,145,74,0.08) 0%, transparent 70%)",
                pointerEvents: "none",
              }}
            />

            {/* Greeting text */}
            <div style={{ position: "relative", zIndex: 1 }}>
              <p style={{ fontSize: "0.72rem", fontWeight: 500, color: T.gold, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6, opacity: 0.8 }}>
                Good {word} · {today}
              </p>
              <h1
                className="dash-display"
                style={{
                  fontSize:    "clamp(2rem, 4vw, 3rem)",
                  lineHeight:  1.05,
                  color:       T.textPrimary,
                  fontWeight:  600,
                  marginBottom: 16,
                }}
              >
                Welcome back,{" "}
                <span className="gold-shimmer" style={{ fontStyle: "italic" }}>{first}.</span>
              </h1>
              {/* Role + flat pills */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "5px 13px", borderRadius: "100px",
                    fontSize: "0.75rem", fontWeight: 500,
                    background: "rgba(200,145,74,0.1)",
                    border: "1px solid rgba(200,145,74,0.2)",
                    color: T.gold,
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.gold, display: "inline-block" }} />
                  {user?.role?.replace("_", " ")}
                </span>
                {flatLabel && (
                  <span
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "5px 13px", borderRadius: "100px",
                      fontSize: "0.75rem", fontWeight: 500,
                      background: "rgba(255,255,255,0.04)",
                      border: `1px solid ${T.border}`,
                      color: T.textSecondary,
                    }}
                  >
                    🏠 {flatLabel}
                  </span>
                )}
              </div>
            </div>

            {/* Sync button + position: top-right */}
            <button
              onClick={load}
              disabled={loading}
              className="sync-btn"
              style={{ position: "absolute", top: 24, right: 28 }}
            >
              <RefreshCw
                size={12}
                style={{ animation: loading ? "spin 1s linear infinite" : "none" }}
              />
              Sync
            </button>
          </div>

          {/* ══ STATS ROW ════════════════════════════════════ */}
          <div
            className="stats-row w-enter"
            style={{ display: "flex", gap: 12, marginBottom: 16, animationDelay: "80ms" }}
          >
            <StatCard label="Notices"   value={announcements.length} accentColor={T.blue}  icon={Bell}         loading={loading} delay="80ms"  />
            <StatCard label="Open Tickets" value={openTickets.length} accentColor={T.red}  icon={Ticket}       loading={loading} delay="140ms" />
            <StatCard label="Events"    value={upcomingEvents.length} accentColor={T.green} icon={CalendarDays} loading={loading} delay="200ms" />
            <StatCard label="Bookings"  value={myBookings.length}     accentColor={T.amber} icon={BookOpen}     loading={loading} delay="260ms" />
          </div>

          {/* ══ ADMIN ALERT ══════════════════════════════════ */}
          {isAdmin && pendingApprovals > 0 && (
            <Link
              to="/admin/approvals"
              className="w-enter"
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
                background: "rgba(212,168,67,0.08)", border: "1px solid rgba(212,168,67,0.25)",
                borderRadius: 14, padding: "14px 20px", marginBottom: 16,
                textDecoration: "none", animationDelay: "300ms",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: "rgba(212,168,67,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16, flexShrink: 0,
                  }}
                >
                  ⚠️
                </div>
                <div>
                  <p style={{ fontSize: "0.88rem", fontWeight: 600, color: T.amber, margin: "0 0 2px" }}>
                    {pendingApprovals} membership {pendingApprovals === 1 ? "request" : "requests"} pending
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "rgba(212,168,67,0.6)", margin: 0 }}>
                    Action required to approve new residents
                  </p>
                </div>
              </div>
              <ArrowRight size={16} style={{ color: T.amber, flexShrink: 0 }} />
            </Link>
          )}

          {/* ══ BENTO GRID ═══════════════════════════════════ */}
          <div
            className="dash-grid"
            style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 16 }}
          >
            {/* ── LEFT: Activity Feed ── */}
            <Card style={{ animationDelay: "120ms" }} className="w-enter">
              <div className="w-enter" style={{ animationDelay: "120ms" }}>
                <SectionHeader
                  eyebrow="Live Updates"
                  title="Recent Activity"
                  linkTo="/announcements"
                  linkLabel="View all"
                />
                {loading ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[...Array(4)].map((_, i) => (
                      <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8, padding: "14px 0" }}>
                        <Sk style={{ height: 14, width: "30%" }} />
                        <Sk style={{ height: 16, width: "70%" }} />
                        <Sk style={{ height: 12, width: "50%" }} />
                      </div>
                    ))}
                  </div>
                ) : feed.length === 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "52px 0", textAlign: "center" }}>
                    <div
                      style={{
                        width: 52, height: 52, borderRadius: 15,
                        background: "rgba(200,145,74,0.08)", border: `1px solid ${T.border}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 22, marginBottom: 12,
                      }}
                    >
                      🔔
                    </div>
                    <p style={{ fontSize: "0.92rem", fontWeight: 500, color: T.textPrimary, margin: "0 0 4px" }}>All caught up</p>
                    <p style={{ fontSize: "0.8rem", color: T.textMuted, margin: 0 }}>No new activity in your community.</p>
                  </div>
                ) : (
                  feed.map((item, i) => (
                    <FeedItem
                      key={`${item.type}-${item.data._id}-${i}`}
                      item={item}
                      isLast={i === feed.length - 1}
                    />
                  ))
                )}
              </div>
            </Card>

            {/* ── RIGHT column ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Visitor requests — residents only */}
              {isResident && visitorRequests.length > 0 && (
                <div
                  className="w-enter"
                  style={{
                    background:   "rgba(232,93,93,0.06)",
                    border:       "1px solid rgba(232,93,93,0.2)",
                    borderRadius: 18, padding: 20,
                    animationDelay: "180ms",
                  }}
                >
                  <p style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: T.red, marginBottom: 4, opacity: 0.8 }}>
                    Action Required
                  </p>
                  <h3 className="dash-display" style={{ fontSize: "1.2rem", color: T.textPrimary, margin: "0 0 14px" }}>
                    Visitor at Gate
                  </h3>
                  {visitorRequests.map(v => (
                    <div key={v._id} className="visitor-card">
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                        <div
                          style={{
                            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                            background: "rgba(232,93,93,0.1)", border: "1px solid rgba(232,93,93,0.2)",
                            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
                          }}
                        >
                          👤
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: "0.87rem", fontWeight: 600, color: T.textPrimary, margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {v.visitorName}
                          </p>
                          <p style={{ fontSize: "0.7rem", color: T.textMuted, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {v.purpose}
                            {v.visitorPhone ? ` · ${v.visitorPhone}` : ""}
                            {v.loggedBy?.fullName ? ` · ${v.loggedBy.fullName}` : ""}
                          </p>
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        <button
                          onClick={() => respondToVisitor(v._id, "rejected")}
                          disabled={respondingId === v._id}
                          style={{
                            padding: "9px 0", borderRadius: 10,
                            fontSize: "0.78rem", fontWeight: 700,
                            background: "rgba(232,93,93,0.1)", color: T.red,
                            border: "1px solid rgba(232,93,93,0.25)",
                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                            opacity: respondingId === v._id ? 0.5 : 1,
                            transition: "background 0.2s",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(232,93,93,0.18)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(232,93,93,0.1)")}
                        >
                          <XCircle size={13} /> Reject
                        </button>
                        <button
                          onClick={() => respondToVisitor(v._id, "approved")}
                          disabled={respondingId === v._id}
                          style={{
                            padding: "9px 0", borderRadius: 10,
                            fontSize: "0.78rem", fontWeight: 700,
                            background: "rgba(61,158,110,0.12)", color: T.green,
                            border: "1px solid rgba(61,158,110,0.25)",
                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                            opacity: respondingId === v._id ? 0.5 : 1,
                            transition: "background 0.2s",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(61,158,110,0.2)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(61,158,110,0.12)")}
                        >
                          <CheckCircle size={13} /> Approve
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick Actions */}
              <div className="w-enter" style={{ animationDelay: "200ms" }}>
                <Card>
                  <SectionHeader eyebrow="Shortcuts" title="Quick Actions" />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <QuickAction to="/tickets"       Icon={Plus}       label="Raise Ticket"  accentColor={T.blue}  />
                    <QuickAction to="/amenities"     Icon={BookOpen}   label="Book Amenity"  accentColor={T.green} />
                    <QuickAction to="/visitors/prereg" Icon={Users}    label="Pre-reg Visitor" accentColor={T.amber} />
                    <QuickAction to="/polls"         Icon={Zap}        label="View Polls"    accentColor={T.gold}  />
                  </div>
                </Card>
              </div>

              {/* Upcoming Events */}
              <div className="w-enter" style={{ animationDelay: "260ms" }}>
                <Card>
                  <SectionHeader eyebrow="Schedule" title="Upcoming" linkTo="/events" linkLabel="See all" />
                  {loading ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <Sk style={{ height: 60 }} />
                      <Sk style={{ height: 60 }} />
                    </div>
                  ) : upcomingEvents.length === 0 ? (
                    <div
                      style={{
                        borderRadius: 12, border: `1px dashed rgba(200,145,74,0.15)`,
                        background: "rgba(200,145,74,0.04)", padding: "22px 16px", textAlign: "center",
                        fontSize: "0.82rem", color: T.textMuted, fontWeight: 500,
                      }}
                    >
                      No upcoming events yet.
                    </div>
                  ) : (
                    upcomingEvents.slice(0, 3).map(e => <EventRow key={e._id} event={e} />)
                  )}
                </Card>
              </div>

              {/* My Bookings */}
              {!loading && myBookings.length > 0 && (
                <div className="w-enter" style={{ animationDelay: "320ms" }}>
                  <Card>
                    <SectionHeader eyebrow="Reservations" title="My Bookings" linkTo="/amenities" linkLabel="Manage" />
                    {myBookings.map(b => <BookingRow key={b._id} b={b} />)}
                  </Card>
                </div>
              )}

              {/* Admin workspace */}
              {isAdmin && (
                <div
                  className="w-enter"
                  style={{
                    background: T.surface, border: `1px solid ${T.border}`,
                    borderRadius: 18, padding: 22,
                    position: "relative", overflow: "hidden",
                    animationDelay: "340ms",
                  }}
                >
                  {/* Decorative gold glow */}
                  <div
                    style={{
                      position: "absolute", top: -50, right: -50,
                      width: 160, height: 160, borderRadius: "50%",
                      background: "radial-gradient(circle, rgba(200,145,74,0.1) 0%, transparent 70%)",
                      pointerEvents: "none",
                    }}
                  />
                  {/* Top gold strip */}
                  <div
                    style={{
                      position: "absolute", top: 0, left: 0, right: 0, height: "2px",
                      background: "linear-gradient(90deg, #c8914a, #e8c47a44)",
                      borderRadius: "18px 18px 0 0",
                    }}
                  />
                  <p style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: T.gold, marginBottom: 4, opacity: 0.7, position: "relative" }}>
                    Admin
                  </p>
                  <h3 className="dash-display" style={{ fontSize: "1.25rem", color: T.textPrimary, margin: "0 0 16px", position: "relative" }}>
                    Workspace
                  </h3>
                  <div style={{ position: "relative", zIndex: 1 }}>
                    {[
                      { to: "/admin/approvals",     emoji: "👥", label: "Pending Approvals", badge: pendingApprovals > 0 ? pendingApprovals : null },
                      { to: "/admin/society-setup", emoji: "⚙️", label: "Society Setup" },
                    ].map(({ to, emoji, label, badge }) => (
                      <Link
                        key={to}
                        to={to}
                        className="admin-link"
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.85rem", fontWeight: 500, color: T.textSecondary }}>
                          <span style={{ fontSize: "0.95rem" }}>{emoji}</span> {label}
                        </div>
                        {badge ? (
                          <span
                            style={{
                              background: "rgba(200,145,74,0.18)", color: T.gold,
                              border: "1px solid rgba(200,145,74,0.3)",
                              padding: "2px 9px", borderRadius: "100px",
                              fontSize: "0.7rem", fontWeight: 700,
                            }}
                          >
                            {badge}
                          </span>
                        ) : (
                          <ChevronRight size={14} style={{ color: T.textMuted }} />
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
