import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, Search, Users, FileText, Calendar, Megaphone,
  Plus, BookOpen, UserCheck, BarChart2, ChevronRight,
  CheckCircle, XCircle, RefreshCw, ArrowRight, Package,
  MapPin, Clock, Zap,
} from "lucide-react";
import { useAuth } from "../components/AuthContext";
import { apiRequest } from "../components/api";
import { getSocket } from "../components/socket";
import { SecurityDashboard } from "./SecurityDashboard";

/* ─── Design tokens ──────────────────────────────────────────── */
const T = {
  blue:    "#1456F5",
  blueD:   "#0D3EC7",
  blueL:   "#E8F0FE",
  yellow:  "#FFE600",
  yellowD: "#E5CE00",
  yellowL: "#FFFBE0",
  white:   "#FFFFFF",
  bg:      "#F0F4FF",
  surface: "#FFFFFF",
  ink:     "#0F172A",
  ink2:    "#1E293B",
  text2:   "#64748B",
  text3:   "#94A3B8",
  border:  "#E2E8F0",
  border2: "#CBD5E1",
  green:   "#16A34A",
  greenL:  "#DCFCE7",
  red:     "#DC2626",
  redL:    "#FEE2E2",
  amber:   "#E8890C",
  amberL:  "#FFF8F0",
  amberM:  "#FDECC8",
  purple:  "#7C3AED",
  purpleL: "#F3E8FF",
  sh:      "0 2px 8px rgba(0,0,0,0.06)",
  shM:     "0 8px 28px rgba(20,86,245,0.14)",
  shL:     "0 16px 48px rgba(20,86,245,0.20)",
};

/* ─── CSS ────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,500;0,600;0,700;0,800;1,700&family=Sora:wght@400;500;600;700;800&display=swap');

  .dp-root { font-family: 'Sora', sans-serif; color: ${T.ink}; background: ${T.bg}; min-height: 100%; }
  .dp-root * { box-sizing: border-box; margin: 0; padding: 0; }

  /* ── Hero ── */
  .dp-hero {
    background: linear-gradient(140deg, ${T.blue} 0%, ${T.blueD} 100%);
    border-radius: 28px;
    padding: 32px 34px 84px;
    position: relative;
    overflow: hidden;
    margin-bottom: -58px;
  }

  .dp-hero-ring1 {
    position: absolute;
    top: -70px; right: -70px;
    width: 280px; height: 280px;
    border-radius: 50%;
    background: rgba(255,255,255,0.07);
    pointer-events: none;
  }

  .dp-hero-ring2 {
    position: absolute;
    bottom: -20px; left: 38%;
    width: 200px; height: 200px;
    border-radius: 50%;
    background: rgba(255,230,0,0.09);
    pointer-events: none;
  }

  .dp-hero-ring3 {
    position: absolute;
    top: 50%; left: -40px;
    width: 140px; height: 140px;
    border-radius: 50%;
    background: rgba(255,255,255,0.04);
    pointer-events: none;
  }

  /* ── Shortcuts strip ── */
  .dp-shortcuts {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 16px 20px;
    background: ${T.white};
    border-radius: 22px;
    box-shadow: ${T.shM};
    position: relative;
    z-index: 10;
    margin: 0 4px 22px;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .dp-shortcuts::-webkit-scrollbar { display: none; }

  .dp-shortcut {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 7px;
    flex: 0 0 auto;
    padding: 6px 10px;
    border-radius: 14px;
    text-decoration: none;
    transition: background 0.18s;
  }
  .dp-shortcut:hover { background: ${T.bg}; }

  .dp-shortcut-circle {
    width: 56px; height: 56px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.22s;
  }
  .dp-shortcut:hover .dp-shortcut-circle {
    transform: translateY(-4px) scale(1.06);
    box-shadow: 0 10px 24px rgba(0,0,0,0.14);
  }

  .dp-shortcut-label {
    font-family: 'Sora', sans-serif;
    font-size: 0.66rem;
    font-weight: 700;
    color: ${T.text2};
    text-align: center;
    white-space: nowrap;
    transition: color 0.18s;
  }
  .dp-shortcut:hover .dp-shortcut-label { color: ${T.blue}; }

  /* ── Stat cards ── */
  .dp-stat {
    background: ${T.white};
    border-radius: 20px;
    padding: 20px;
    box-shadow: ${T.sh};
    border: 1px solid ${T.border};
    transition: transform 0.2s, box-shadow 0.2s;
    position: relative;
    overflow: hidden;
  }
  .dp-stat::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 3px;
    border-radius: 0 0 20px 20px;
    background: var(--stat-color, ${T.blue});
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.3s ease;
  }
  .dp-stat:hover { transform: translateY(-3px); box-shadow: ${T.shM}; }
  .dp-stat:hover::after { transform: scaleX(1); }

  /* ── Section card ── */
  .dp-section {
    background: ${T.white};
    border: 1px solid ${T.border};
    border-radius: 22px;
    padding: 22px;
    box-shadow: ${T.sh};
  }

  /* ── Activity item ── */
  .dp-act {
    display: flex; align-items: flex-start; gap: 13px;
    background: ${T.white}; border: 1px solid ${T.border};
    border-radius: 14px; padding: 13px 15px; margin-bottom: 8px;
    transition: box-shadow .2s, transform .2s, border-color .2s;
    cursor: default;
  }
  .dp-act:hover { box-shadow: ${T.shM}; border-color: ${T.border2}; transform: translateY(-1px); }
  .dp-act:last-child { margin-bottom: 0; }

  /* ── View all link ── */
  .dp-view-all {
    display: inline-flex; align-items: center; gap: 3px;
    font-family: 'Sora', sans-serif;
    font-size: .7rem; font-weight: 700; color: ${T.blue};
    text-decoration: none; padding: 5px 11px;
    border-radius: 100px;
    background: ${T.blueL};
    border: 1px solid rgba(20,86,245,0.15);
    transition: background .15s, box-shadow .15s;
  }
  .dp-view-all:hover { background: rgba(20,86,245,0.12); box-shadow: 0 2px 10px rgba(20,86,245,0.12); }

  /* ── Admin link ── */
  .dp-admin-link {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 14px; border-radius: 12px;
    background: ${T.bg}; border: 1px solid ${T.border};
    margin-bottom: 8px; text-decoration: none;
    transition: background .15s, border-color .15s, box-shadow .15s;
  }
  .dp-admin-link:hover { background: ${T.blueL}; border-color: rgba(20,86,245,0.25); box-shadow: 0 2px 10px rgba(20,86,245,0.1); }
  .dp-admin-link:last-child { margin-bottom: 0; }

  /* ── Skeleton ── */
  .dp-sk {
    background: linear-gradient(90deg, #EEF2FF 25%, #E4EAFF 50%, #EEF2FF 75%);
    background-size: 200% 100%;
    animation: dp-shimmer 1.5s ease-in-out infinite;
    border-radius: 8px;
  }
  @keyframes dp-shimmer { 0% { background-position: 200% center; } 100% { background-position: -200% center; } }
  @keyframes dp-breathe { 0%,100% { border-color: rgba(220,38,38,.2); } 50% { border-color: rgba(220,38,38,.5); } }
  .dp-visitor-wrap { animation: dp-breathe 3s ease-in-out infinite; }
  @keyframes dp-blink { 0%,100% { opacity: 1; } 50% { opacity: .2; } }
  @keyframes dp-spin { to { transform: rotate(360deg); } }

  /* ── Notification pill in hero ── */
  .dp-notif-pill {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(255,255,255,0.15);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,0.22);
    border-radius: 100px;
    padding: 6px 13px;
    margin-bottom: 16px;
    font-size: 0.72rem; font-weight: 600; color: rgba(255,255,255,0.9);
    text-decoration: none;
    transition: background 0.18s;
  }
  .dp-notif-pill:hover { background: rgba(255,255,255,0.22); }

  @media (max-width: 960px) {
    .dp-main-grid { grid-template-columns: 1fr !important; }
    .dp-stat-row  { grid-template-columns: repeat(2, 1fr) !important; }
  }
  @media (max-width: 560px) {
    .dp-stat-row { grid-template-columns: 1fr !important; }
    .dp-hero { padding: 24px 20px 80px; }
  }
`;

/* ─── Helpers ────────────────────────────────────────────────── */
function greeting(name) {
  const h = new Date().getHours();
  const w = h < 12 ? "Morning" : h < 17 ? "Afternoon" : "Evening";
  return { word: w, first: name?.split(" ")[0] || "there" };
}
function timeAgo(date) {
  if (!date) return "";
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
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

function buildFeed(announcements, tickets, events) {
  const items = [];
  announcements.slice(0, 6).forEach(a =>
    items.push({ type: "announcement", date: a.createdAt, data: a }));
  tickets.filter(t => !["resolved", "closed"].includes(t.status)).slice(0, 6)
    .forEach(t => items.push({ type: "ticket", date: t.createdAt, data: t }));
  events.filter(e => new Date(e.startAt) >= new Date()).slice(0, 3)
    .forEach(e => items.push({ type: "event", date: e.startAt, data: e }));
  return items.sort((a, b) => new Date(b.date) - new Date(a.date));
}

/* ─── Feed config ────────────────────────────────────────────── */
const FEED_CFG = {
  announcement: { label: "Notice", color: T.amber,  bg: T.amberL,  border: T.amberM,   dot: T.amber  },
  ticket:       { label: "Ticket", color: T.red,    bg: T.redL,    border: "#FECACA",  dot: T.red    },
  event:        { label: "Event",  color: T.green,  bg: T.greenL,  border: "#BBF7D0",  dot: T.green  },
};
const STATUS_CFG = {
  open:        { bg: T.blueL,   color: T.blue,  label: "Open"        },
  in_progress: { bg: T.amberL,  color: T.amber, label: "In Progress" },
  resolved:    { bg: T.greenL,  color: T.green, label: "Resolved"    },
  closed:      { bg: "#F1F5F9", color: T.text3, label: "Closed"      },
};

/* ─── Skeleton ───────────────────────────────────────────────── */
function Sk({ style = {} }) { return <div className="dp-sk" style={style} />; }

/* ─── StatCard ───────────────────────────────────────────────── */
function StatCard({ label, value, icon: Icon, iconBg, iconColor, trend, loading, index, accentColor }) {
  return (
    <motion.div
      className="dp-stat"
      style={{ "--stat-color": accentColor || T.blue }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.07, duration: 0.42, ease: [.22, 1, .36, 1] }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <p style={{ fontSize: ".63rem", fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: ".11em", lineHeight: 1.3 }}>
          {label}
        </p>
        <div style={{ width: 38, height: 38, borderRadius: 12, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={17} style={{ color: iconColor }} />
        </div>
      </div>
      {loading
        ? <Sk style={{ height: 42, width: 72, marginBottom: 10, borderRadius: 12 }} />
        : <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "2.4rem", fontWeight: 800, color: T.ink, lineHeight: 1, marginBottom: 8, letterSpacing: "-1.5px" }}>{value ?? 0}</p>
      }
      {loading
        ? <Sk style={{ height: 11, width: 110 }} />
        : trend && <p style={{ fontSize: ".7rem", color: T.text3, lineHeight: 1.4, fontWeight: 500 }}>{trend}</p>
      }
    </motion.div>
  );
}

/* ─── ActivityCard ───────────────────────────────────────────── */
function ActivityCard({ item, index }) {
  const cfg = FEED_CFG[item.type];
  const d   = item.data;
  const raw = d.createdBy?.fullName || d.organizer?.fullName || d.postedBy?.fullName || "";
  const initials = raw.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  return (
    <motion.div
      className="dp-act"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.04, duration: 0.32 }}
      style={{ borderLeft: `3px solid ${cfg.dot}` }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 7, flexWrap: "wrap" }}>
          <span style={{ padding: "3px 9px", borderRadius: 100, fontSize: ".6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
            {cfg.label}
          </span>
          {item.type === "ticket" && d.status && (() => {
            const s = STATUS_CFG[d.status] || STATUS_CFG.open;
            return <span style={{ padding: "3px 9px", borderRadius: 100, fontSize: ".6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", background: s.bg, color: s.color, border: `1px solid ${s.color}25` }}>{s.label}</span>;
          })()}
          {item.type === "ticket" && d.category && (
            <span style={{ padding: "3px 9px", borderRadius: 100, fontSize: ".6rem", fontWeight: 600, background: "#F1F5F9", color: T.text2, border: `1px solid ${T.border}` }}>{d.category}</span>
          )}
        </div>
        <p style={{ fontSize: ".86rem", fontWeight: 700, color: T.ink, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {d.title || "Untitled"}
        </p>
        {item.type !== "event" && (d.body || d.description) && (
          <p style={{ fontSize: ".76rem", color: T.text2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>
            {(d.body || d.description || "").replace(/<[^>]+>/g, "")}
          </p>
        )}
        {item.type === "event" && (
          <p style={{ fontSize: ".76rem", color: T.text2, display: "flex", alignItems: "center", gap: 5, fontWeight: 500 }}>
            <Clock size={11} /> {fmtDate(d.startAt)} · {fmtTime(d.startAt)}
            {d.location && <><MapPin size={11} style={{ marginLeft: 4 }} />{d.location}</>}
          </p>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
        <span style={{ fontSize: ".64rem", color: T.text3, whiteSpace: "nowrap", fontWeight: 500 }}>{timeAgo(item.date)}</span>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg, ${T.blue}, ${T.blueD})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".56rem", fontWeight: 800, color: "#fff" }}>
          {initials}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── EventRow ───────────────────────────────────────────────── */
function EventRow({ event, index, isLast }) {
  const diff = Math.floor((new Date(event.startAt) - new Date()) / 86400000);
  const soon = diff >= 0 && diff <= 2;
  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.12 + index * 0.08, duration: 0.35 }}
      style={{ display: "flex", gap: 12, paddingBottom: isLast ? 0 : 16, position: "relative" }}
    >
      {!isLast && <div style={{ position: "absolute", left: 17, top: 38, bottom: 0, width: 1, background: T.border }} />}
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: soon ? `linear-gradient(135deg, ${T.blue}, ${T.blueD})` : "#F1F5F9",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: ".9rem", fontWeight: 800, lineHeight: 1, color: soon ? "#fff" : T.ink2 }}>{fmtDay(event.startAt)}</span>
        <span style={{ fontSize: ".44rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: soon ? "rgba(255,255,255,0.8)" : T.text3 }}>{fmtMonth(event.startAt)}</span>
      </div>
      <div style={{ minWidth: 0, paddingTop: 2 }}>
        <p style={{ fontSize: ".84rem", fontWeight: 700, color: T.ink, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{event.title}</p>
        <p style={{ fontSize: ".7rem", color: T.text2, display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap", fontWeight: 500 }}>
          {fmtTime(event.startAt)}
          {event.location && <><span style={{ color: T.border2 }}>·</span>{event.location}</>}
          {soon && <span style={{ background: T.yellow, color: T.ink, padding: "1px 8px", borderRadius: 100, fontSize: ".58rem", fontWeight: 800 }}>{diff === 0 ? "Today!" : "Tomorrow"}</span>}
        </p>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export function DashboardPage() {
  const { token, user, membership } = useAuth();

  if (user?.role === "security") return <SecurityDashboard />;

  const isAdmin    = ["committee", "super_admin"].includes(user?.role);
  const isResident = user?.role === "resident";

  const [announcements,    setAnnouncements]    = useState([]);
  const [tickets,          setTickets]          = useState([]);
  const [events,           setEvents]           = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [visitorRequests,  setVisitorRequests]  = useState([]);
  const [respondingId,     setRespondingId]     = useState(null);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true); setError("");
    try {
      const calls = [
        apiRequest("/announcements",   { token }),
        apiRequest("/tickets",         { token }),
        apiRequest("/events",          { token }),
      ];
      if (isAdmin)    calls.push(apiRequest("/admin/pending-approvals", { token }));
      if (isResident) calls.push(apiRequest("/visitors/my-requests",   { token }));
      const results = await Promise.allSettled(calls);
      const get = r => r.status === "fulfilled" ? r.value : null;
      setAnnouncements(get(results[0])?.items || []);
      setTickets(get(results[1])?.items || []);
      setEvents(get(results[2])?.items || []);
      if (isAdmin)    setPendingApprovals((get(results[3])?.items || []).length);
      if (isResident) setVisitorRequests(get(results[isAdmin ? 4 : 3])?.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, isAdmin, isResident]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!isResident) return;
    const socket = getSocket();
    const onIncoming = ({ visitor }) =>
      setVisitorRequests(prev => [visitor, ...prev.filter(v => v._id !== visitor._id)]);
    socket.on("visitor:request_incoming", onIncoming);
    return () => socket.off("visitor:request_incoming", onIncoming);
  }, [isResident]);

  async function respondToVisitor(visitorId, decision) {
    setRespondingId(visitorId);
    try {
      await apiRequest(`/visitors/${visitorId}/respond`, { token, method: "PATCH", body: { decision } });
      setVisitorRequests(prev => prev.filter(v => v._id !== visitorId));
    } catch (err) { setError(err.message); }
    finally { setRespondingId(null); }
  }

  const { word, first } = greeting(user?.fullName);
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
  const initials = (user?.fullName || "?").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const flatLabel = membership?.wingId?.name && membership?.unitId?.unitNumber
    ? `${membership.wingId.name}-${membership.unitId.unitNumber}` : null;

  const upcomingEvents = useMemo(() =>
    events.filter(e => new Date(e.startAt) >= new Date())
          .sort((a, b) => new Date(a.startAt) - new Date(b.startAt)), [events]);

  const openTickets = useMemo(() =>
    tickets.filter(t => ["open", "in_progress"].includes(t.status)).length, [tickets]);

  const thisMonthEvents = useMemo(() => {
    const now = new Date();
    return events.filter(e => { const d = new Date(e.startAt); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).length;
  }, [events]);

  const feed = useMemo(() => buildFeed(announcements, tickets, events), [announcements, tickets, events]);

  const Spinner = (
    <span style={{ width: 12, height: 12, display: "inline-block", borderRadius: "50%", border: "2px solid rgba(255,255,255,.35)", borderTopColor: "#fff", animation: "dp-spin .7s linear infinite" }} />
  );

  /* Quick action shortcuts config */
  const SHORTCUTS = [
    { to: "/tickets",         icon: Plus,      label: "Raise Ticket", bg: "#FEE2E2", color: T.red    },
    { to: "/amenities",       icon: BookOpen,  label: "Book Amenity", bg: "#DCFCE7", color: T.green  },
    { to: "/visitors/prereg", icon: UserCheck, label: "Pre-reg",      bg: T.amberL,  color: T.amber  },
    { to: "/polls",           icon: BarChart2, label: "Polls",        bg: T.blueL,   color: T.blue   },
    { to: "/lost-found",      icon: Package,   label: "Lost & Found", bg: T.purpleL, color: T.purple },
    { to: "/announcements",   icon: Megaphone, label: "Notices",      bg: "#FFF9DB", color: "#B45309"},
  ];

  return (
    <>
      <style>{CSS}</style>
      <div className="dp-root" style={{ padding: "24px 28px 64px" }}>

        {/* ══ HERO ══ */}
        <motion.div
          className="dp-hero"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [.22, 1, .36, 1] }}
        >
          {/* Decorative rings */}
          <div className="dp-hero-ring1" />
          <div className="dp-hero-ring2" />
          <div className="dp-hero-ring3" />

          <div style={{ position: "relative", zIndex: 1 }}>
            {/* Top row: notification + user avatar */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
              <div>
                {isAdmin && pendingApprovals > 0 && (
                  <Link to="/admin/approvals" className="dp-notif-pill">
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: T.yellow, display: "inline-block", flexShrink: 0 }} />
                    {pendingApprovals} pending approval{pendingApprovals !== 1 ? "s" : ""} awaiting review
                    <ArrowRight size={12} />
                  </Link>
                )}
                {!isAdmin && flatLabel && (
                  <div className="dp-notif-pill" style={{ display: "inline-flex" }}>
                    <span style={{ fontSize: 14 }}>🏠</span>
                    Flat {flatLabel}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                <button onClick={load} disabled={loading} style={{
                  background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.22)",
                  borderRadius: "50%", width: 38, height: 38, display: "flex", alignItems: "center",
                  justifyContent: "center", cursor: "pointer", color: "#fff",
                  transition: "background 0.18s",
                }}>
                  <RefreshCw size={14} style={{ animation: loading ? "dp-spin 1s linear infinite" : "none" }} />
                </button>
                <div style={{
                  width: 42, height: 42, borderRadius: 13, flexShrink: 0,
                  background: T.yellow,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: ".78rem", fontWeight: 800, color: T.ink,
                  boxShadow: `0 4px 16px rgba(255,230,0,0.4)`,
                }}>
                  {initials}
                </div>
              </div>
            </div>

            {/* Greeting */}
            <p style={{ fontSize: ".72rem", fontWeight: 600, color: "rgba(255,255,255,0.6)", marginBottom: 6, letterSpacing: ".06em", textTransform: "uppercase" }}>
              Good {word} · {today}
            </p>
            <h1 style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: "clamp(1.75rem, 3.5vw, 2.6rem)",
              fontWeight: 800, lineHeight: 1.12,
              color: "#FFFFFF", letterSpacing: "-1px", marginBottom: 6,
            }}>
              Let&apos;s Get Started,{" "}
              <span style={{ color: T.yellow }}>{first}!</span>
            </h1>
            <p style={{ fontSize: ".82rem", color: "rgba(255,255,255,0.65)", fontWeight: 500 }}>
              Here&apos;s what&apos;s happening in your community today.
            </p>
          </div>
        </motion.div>

        {/* ══ SHORTCUTS STRIP ══ */}
        <motion.div
          className="dp-shortcuts"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.45, ease: [.22, 1, .36, 1] }}
        >
          {SHORTCUTS.map((s, i) => (
            <Link key={s.to} to={s.to} className="dp-shortcut">
              <div className="dp-shortcut-circle" style={{ background: s.bg }}>
                <s.icon size={22} style={{ color: s.color }} />
              </div>
              <span className="dp-shortcut-label">{s.label}</span>
            </Link>
          ))}
        </motion.div>

        {/* ══ ERROR ══ */}
        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 14, padding: "12px 16px", fontSize: ".84rem", color: T.red, fontWeight: 500 }}>
            <XCircle size={15} /> {error}
            <button onClick={() => setError("")} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: T.red, display: "flex" }}><XCircle size={14} /></button>
          </div>
        )}

        {/* ══ STAT CARDS ══ */}
        <div className="dp-stat-row" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 22 }}>
          <StatCard index={0} label="Active Visitors"   value={visitorRequests.length} icon={Users}    iconBg="#FFF4E6" iconColor={T.amber} accentColor={T.amber} trend={visitorRequests.length > 0 ? `${visitorRequests.length} waiting` : "No visitors now"} loading={loading} />
          <StatCard index={1} label="Open Tickets"      value={openTickets}            icon={FileText} iconBg="#FEF2F2" iconColor={T.red}   accentColor={T.red}   trend={`${tickets.length} total raised`} loading={loading} />
          <StatCard index={2} label="Events This Month" value={thisMonthEvents}        icon={Calendar} iconBg="#DCFCE7" iconColor={T.green} accentColor={T.green} trend={upcomingEvents.length > 0 ? `Next: ${fmtDate(upcomingEvents[0]?.startAt)}` : "No upcoming"} loading={loading} />
          <StatCard index={3} label="Announcements"     value={announcements.length}   icon={Megaphone} iconBg={T.blueL} iconColor={T.blue} accentColor={T.blue}  trend="Community notices" loading={loading} />
        </div>

        {/* ══ MAIN GRID ══ */}
        <div className="dp-main-grid" style={{ display: "grid", gridTemplateColumns: "1fr 310px", gap: 18, alignItems: "start" }}>

          {/* ── LEFT: Activity feed ── */}
          <div>
            <motion.div className="dp-section" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22, duration: 0.45, ease: [.22, 1, .36, 1] }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.green, display: "inline-block", animation: "dp-blink 1.8s ease-in-out infinite" }} />
                    <span style={{ fontSize: ".58rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".12em", color: T.green }}>Live</span>
                  </div>
                  <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "1.05rem", fontWeight: 800, color: T.ink }}>
                    Recent Activity
                  </h2>
                </div>
                <Link to="/announcements" className="dp-view-all">View all <ChevronRight size={11} /></Link>
              </div>

              {loading ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} style={{ marginBottom: 8, padding: "13px 15px", borderRadius: 14, border: `1px solid ${T.border}`, background: T.surface }}>
                    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}><Sk style={{ width: 58, height: 18, borderRadius: 100 }} /><Sk style={{ width: 74, height: 18, borderRadius: 100 }} /></div>
                    <Sk style={{ height: 14, width: "62%", marginBottom: 7 }} />
                    <Sk style={{ height: 11, width: "46%" }} />
                  </div>
                ))
              ) : feed.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "52px 0", textAlign: "center" }}>
                  <div style={{ width: 54, height: 54, borderRadius: 16, background: T.blueL, border: `1px solid rgba(20,86,245,0.2)`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                    <Zap size={24} style={{ color: T.blue }} />
                  </div>
                  <p style={{ fontSize: ".92rem", fontWeight: 700, color: T.ink, marginBottom: 5 }}>All caught up!</p>
                  <p style={{ fontSize: ".78rem", color: T.text2, fontWeight: 500 }}>No activity in your community yet.</p>
                </div>
              ) : (
                <AnimatePresence>
                  {feed.map((item, i) => <ActivityCard key={`${item.type}-${item.data._id}`} item={item} index={i} />)}
                </AnimatePresence>
              )}
            </motion.div>

            {/* Visitor gate requests */}
            {isResident && visitorRequests.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28, duration: 0.4 }} style={{ marginTop: 16 }}>
                <div className="dp-visitor-wrap dp-section" style={{ border: "1px solid rgba(220,38,38,.25)", background: "#FFF8F8" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: T.red, display: "inline-block", animation: "dp-blink 1s ease-in-out infinite" }} />
                    <span style={{ fontSize: ".58rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".12em", color: T.red }}>Action Required</span>
                  </div>
                  <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "1rem", fontWeight: 800, color: T.ink, marginBottom: 16 }}>Visitor at Gate</h3>
                  <AnimatePresence>
                    {visitorRequests.map(v => (
                      <motion.div key={v._id} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}
                        style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 14, marginBottom: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 13 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#FEE2E2", border: "1px solid #FECACA", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>👤</div>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: ".85rem", fontWeight: 700, color: T.ink, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.visitorName}</p>
                            <p style={{ fontSize: ".72rem", color: T.text2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>{v.purpose}{v.visitorPhone ? ` · ${v.visitorPhone}` : ""}</p>
                          </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          <button onClick={() => respondToVisitor(v._id, "rejected")} disabled={respondingId === v._id}
                            style={{ padding: "9px", borderRadius: 10, fontSize: ".76rem", fontWeight: 700, background: "#FEE2E2", color: T.red, border: "1px solid #FECACA", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontFamily: "'Sora', sans-serif", opacity: respondingId === v._id ? 0.6 : 1 }}>
                            {respondingId === v._id ? Spinner : <><XCircle size={13} /> Reject</>}
                          </button>
                          <button onClick={() => respondToVisitor(v._id, "approved")} disabled={respondingId === v._id}
                            style={{ padding: "9px", borderRadius: 10, fontSize: ".76rem", fontWeight: 700, background: `linear-gradient(135deg, ${T.blue}, ${T.blueD})`, color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontFamily: "'Sora', sans-serif", boxShadow: "0 3px 10px rgba(20,86,245,.3)", opacity: respondingId === v._id ? 0.6 : 1 }}>
                            {respondingId === v._id ? Spinner : <><CheckCircle size={13} /> Approve</>}
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </div>

          {/* ── RIGHT column ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Upcoming Events */}
            <motion.div className="dp-section" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.4, ease: [.22, 1, .36, 1] }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: ".58rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".12em", color: T.blue, marginBottom: 3 }}>Schedule</p>
                  <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "1.05rem", fontWeight: 800, color: T.ink }}>Upcoming</h2>
                </div>
                <Link to="/events" className="dp-view-all">See all <ChevronRight size={11} /></Link>
              </div>
              {loading ? <><Sk style={{ height: 54, marginBottom: 10 }} /><Sk style={{ height: 54 }} /></>
                : upcomingEvents.length === 0
                  ? <div style={{ borderRadius: 12, border: `1.5px dashed ${T.border}`, background: T.bg, padding: "18px 14px", textAlign: "center", fontSize: ".8rem", color: T.text3, fontWeight: 600 }}>No upcoming events yet.</div>
                  : upcomingEvents.slice(0, 3).map((e, i) => <EventRow key={e._id} event={e} index={i} isLast={i === Math.min(upcomingEvents.length, 3) - 1} />)
              }
            </motion.div>

            {/* Admin workspace */}
            {isAdmin && (
              <motion.div className="dp-section" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.26, duration: 0.4, ease: [.22, 1, .36, 1] }} style={{ borderTop: `3px solid ${T.blue}` }}>
                <p style={{ fontSize: ".58rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".12em", color: T.blue, marginBottom: 3 }}>Admin</p>
                <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "1.05rem", fontWeight: 800, color: T.ink, marginBottom: 14 }}>Workspace</h2>
                {[
                  { to: "/admin/approvals",     emoji: "👥", label: "Pending Approvals", badge: pendingApprovals || null },
                  { to: "/admin/society-setup", emoji: "⚙️", label: "Society Setup" },
                ].map(({ to, emoji, label, badge }) => (
                  <Link key={to} to={to} className="dp-admin-link">
                    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: ".83rem", fontWeight: 700, color: T.ink2 }}>
                      <span>{emoji}</span> {label}
                    </div>
                    {badge
                      ? <span style={{ background: T.yellow, color: T.ink, padding: "2px 10px", borderRadius: 100, fontSize: ".68rem", fontWeight: 800 }}>{badge}</span>
                      : <ChevronRight size={13} style={{ color: T.text3 }} />}
                  </Link>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
