import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, Search, Users, FileText, Calendar, Megaphone,
  Plus, BookOpen, UserCheck, BarChart2, ChevronRight,
  CheckCircle, XCircle, RefreshCw, ArrowRight, Package,
  MapPin, Clock,
} from "lucide-react";
import { useAuth } from "../components/AuthContext";
import { apiRequest } from "../components/api";
import { getSocket } from "../components/socket";
import { SecurityDashboard } from "./SecurityDashboard";

/* ─── Design tokens — warm amber SaaS palette ───────────────── */
const T = {
  bg:      "#F7F8FA",
  surface: "#FFFFFF",
  border:  "#F0F0F0",
  border2: "#E5E7EB",
  ink:     "#111827",
  ink2:    "#374151",
  text2:   "#6B7280",
  text3:   "#9CA3AF",
  amber:   "#E8890C",
  amberH:  "#C97508",
  amberL:  "#FFF8F0",
  amberM:  "#FDECC8",
  green:   "#16A34A",
  greenL:  "#DCFCE7",
  red:     "#DC2626",
  redL:    "#FEE2E2",
  blue:    "#2563EB",
  blueL:   "#EFF6FF",
  purple:  "#7C3AED",
  purpleL: "#F3E8FF",
  sh:      "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)",
  sh2:     "0 4px 16px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)",
};

/* ─── CSS ────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');

  .dp-root { font-family: 'DM Sans', sans-serif; color: ${T.ink}; background: ${T.bg}; min-height: 100%; }
  .dp-root * { box-sizing: border-box; margin: 0; padding: 0; }

  .dp-stat {
    background: ${T.surface}; border: 1px solid ${T.border};
    border-radius: 16px; padding: 22px; box-shadow: ${T.sh};
    transition: box-shadow .2s, transform .2s;
  }
  .dp-stat:hover { box-shadow: ${T.sh2}; transform: translateY(-2px); }

  .dp-act {
    display: flex; align-items: flex-start; gap: 14px;
    background: ${T.surface}; border: 1px solid ${T.border};
    border-radius: 12px; padding: 14px 16px; margin-bottom: 8px;
    transition: box-shadow .18s, border-color .18s, transform .18s;
    cursor: default; overflow: hidden;
  }
  .dp-act:hover { box-shadow: ${T.sh2}; border-color: ${T.border2}; transform: translateY(-1px); }

  .dp-qa {
    display: flex; align-items: center; gap: 11px;
    padding: 12px 14px; border-radius: 12px;
    border: 1px solid ${T.border}; background: ${T.surface};
    text-decoration: none; box-shadow: ${T.sh}; margin-bottom: 8px;
    transition: box-shadow .18s, border-color .18s, background .18s, transform .15s;
  }
  .dp-qa:hover { box-shadow: ${T.sh2}; border-color: ${T.border2}; background: ${T.bg}; transform: translateY(-1px); }
  .dp-qa:last-child { margin-bottom: 0; }

  .dp-admin-link {
    display: flex; align-items: center; justify-content: space-between;
    padding: 11px 14px; border-radius: 10px;
    background: ${T.surface}; border: 1px solid ${T.border};
    margin-bottom: 7px; text-decoration: none; box-shadow: ${T.sh};
    transition: background .15s, border-color .15s, box-shadow .15s;
  }
  .dp-admin-link:hover { background: ${T.amberL}; border-color: ${T.amberM}; box-shadow: ${T.sh2}; }
  .dp-admin-link:last-child { margin-bottom: 0; }

  .dp-search {
    background: ${T.surface}; border: 1.5px solid ${T.border};
    border-radius: 10px; padding: 9px 14px 9px 36px;
    font-family: 'DM Sans', sans-serif; font-size: .84rem; color: ${T.ink};
    width: 210px; outline: none; transition: border-color .15s, box-shadow .15s;
  }
  .dp-search:focus { border-color: ${T.amber}; box-shadow: 0 0 0 3px ${T.amberL}; }

  .dp-sync {
    display: flex; align-items: center; gap: 5px;
    background: ${T.surface}; border: 1.5px solid ${T.border};
    border-radius: 9px; padding: 8px 13px;
    font-family: 'DM Sans', sans-serif; font-size: .78rem; font-weight: 600; color: ${T.text2};
    cursor: pointer; box-shadow: ${T.sh}; transition: border-color .15s, color .15s;
  }
  .dp-sync:hover { border-color: ${T.border2}; color: ${T.ink}; }
  .dp-sync:disabled { opacity: .5; cursor: not-allowed; }

  .dp-icon-btn {
    width: 38px; height: 38px; border-radius: 10px;
    background: ${T.surface}; border: 1.5px solid ${T.border};
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; box-shadow: ${T.sh}; transition: border-color .15s, background .15s;
    position: relative;
  }
  .dp-icon-btn:hover { background: ${T.bg}; border-color: ${T.border2}; }

  .dp-section {
    background: ${T.surface}; border: 1px solid ${T.border};
    border-radius: 18px; padding: 22px; box-shadow: ${T.sh};
  }

  .dp-view-all {
    display: inline-flex; align-items: center; gap: 3px;
    font-size: .72rem; font-weight: 600; color: ${T.text3};
    text-decoration: none; padding: 5px 10px;
    border-radius: 8px; border: 1px solid ${T.border}; background: ${T.bg};
    transition: color .15s, border-color .15s;
  }
  .dp-view-all:hover { color: ${T.amber}; border-color: ${T.amberM}; }

  .dp-sk {
    background: linear-gradient(90deg, #F3F4F6 25%, #E9EAEC 50%, #F3F4F6 75%);
    background-size: 200% 100%;
    animation: dp-shimmer 1.5s ease-in-out infinite;
    border-radius: 7px;
  }
  @keyframes dp-shimmer { 0% { background-position: 200% center; } 100% { background-position: -200% center; } }
  @keyframes dp-breathe { 0%,100% { border-color: rgba(220,38,38,.2); } 50% { border-color: rgba(220,38,38,.5); } }
  .dp-visitor-wrap { animation: dp-breathe 3s ease-in-out infinite; }
  @keyframes dp-blink { 0%,100% { opacity: 1; } 50% { opacity: .2; } }
  @keyframes dp-spin { to { transform: rotate(360deg); } }

  @media (max-width: 940px) {
    .dp-main-grid { grid-template-columns: 1fr !important; }
    .dp-stat-row  { grid-template-columns: repeat(2, 1fr) !important; }
  }
  @media (max-width: 520px) {
    .dp-stat-row { grid-template-columns: 1fr !important; }
    .dp-topbar   { flex-direction: column; align-items: flex-start !important; }
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
  announcement: { label: "Notice", color: T.amber, bg: T.amberL, border: T.amberM, dot: T.amber },
  ticket:       { label: "Ticket", color: T.red,   bg: T.redL,   border: "#FECACA", dot: T.red  },
  event:        { label: "Event",  color: T.green,  bg: T.greenL, border: "#BBF7D0", dot: T.green },
};
const STATUS_CFG = {
  open:        { bg: T.blueL,   color: T.blue,  label: "Open"        },
  in_progress: { bg: T.amberL,  color: T.amber, label: "In Progress" },
  resolved:    { bg: T.greenL,  color: T.green, label: "Resolved"    },
  closed:      { bg: "#F3F4F6", color: T.text3, label: "Closed"      },
};

/* ─── Skeleton ───────────────────────────────────────────────── */
function Sk({ style = {} }) { return <div className="dp-sk" style={style} />; }

/* ─── StatCard ───────────────────────────────────────────────── */
function StatCard({ label, value, icon: Icon, iconBg, iconColor, trend, loading, index }) {
  return (
    <motion.div
      className="dp-stat"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 + index * 0.07, duration: 0.4, ease: [.22, 1, .36, 1] }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <p style={{ fontSize: ".68rem", fontWeight: 700, color: T.text2, textTransform: "uppercase", letterSpacing: ".09em", lineHeight: 1.3 }}>
          {label}
        </p>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={16} style={{ color: iconColor }} />
        </div>
      </div>
      {loading
        ? <Sk style={{ height: 40, width: 80, marginBottom: 10 }} />
        : <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "2.2rem", fontWeight: 800, color: T.ink, lineHeight: 1, marginBottom: 10 }}>{value ?? 0}</p>
      }
      {loading
        ? <Sk style={{ height: 12, width: 120 }} />
        : trend && <p style={{ fontSize: ".72rem", color: T.text3, lineHeight: 1.4 }}>{trend}</p>
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
      transition={{ delay: 0.1 + index * 0.045, duration: 0.32 }}
      style={{ borderLeft: `3px solid ${cfg.dot}` }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
          <span style={{ padding: "3px 9px", borderRadius: 100, fontSize: ".63rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
            {cfg.label}
          </span>
          {item.type === "ticket" && d.status && (() => {
            const s = STATUS_CFG[d.status] || STATUS_CFG.open;
            return <span style={{ padding: "3px 9px", borderRadius: 100, fontSize: ".63rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", background: s.bg, color: s.color, border: `1px solid ${s.color}25` }}>{s.label}</span>;
          })()}
          {item.type === "ticket" && d.category && (
            <span style={{ padding: "3px 9px", borderRadius: 100, fontSize: ".63rem", fontWeight: 600, background: "#F3F4F6", color: T.text2, border: `1px solid ${T.border}` }}>{d.category}</span>
          )}
        </div>
        <p style={{ fontSize: ".88rem", fontWeight: 700, color: T.ink, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {d.title || "Untitled"}
        </p>
        {item.type !== "event" && (d.body || d.description) && (
          <p style={{ fontSize: ".78rem", color: T.text2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {(d.body || d.description || "").replace(/<[^>]+>/g, "")}
          </p>
        )}
        {item.type === "event" && (
          <p style={{ fontSize: ".78rem", color: T.text2, display: "flex", alignItems: "center", gap: 5 }}>
            <Clock size={11} /> {fmtDate(d.startAt)} · {fmtTime(d.startAt)}
            {d.location && <><MapPin size={11} style={{ marginLeft: 4 }} />{d.location}</>}
          </p>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 9, flexShrink: 0 }}>
        <span style={{ fontSize: ".67rem", color: T.text3, whiteSpace: "nowrap" }}>{timeAgo(item.date)}</span>
        <div style={{ width: 29, height: 29, borderRadius: "50%", background: `linear-gradient(135deg, ${T.amber}, ${T.amberH})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".58rem", fontWeight: 800, color: "#fff" }}>
          {initials}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── QuickAction ────────────────────────────────────────────── */
function QuickAction({ to, icon: Icon, label, iconBg, iconColor, delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay, duration: 0.35, ease: [.22, 1, .36, 1] }}>
      <Link to={to} className="dp-qa">
        <div style={{ width: 34, height: 34, borderRadius: 9, background: iconBg, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={15} style={{ color: iconColor }} />
        </div>
        <span style={{ fontSize: ".83rem", fontWeight: 600, color: T.ink2, flex: 1 }}>{label}</span>
        <ChevronRight size={14} style={{ color: T.text3, flexShrink: 0 }} />
      </Link>
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
      <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: soon ? T.amberL : "#F5F5F5", border: `1px solid ${soon ? T.amberM : T.border}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: ".92rem", fontWeight: 800, lineHeight: 1, color: soon ? T.amber : T.ink2 }}>{fmtDay(event.startAt)}</span>
        <span style={{ fontSize: ".46rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: soon ? T.amber : T.text3 }}>{fmtMonth(event.startAt)}</span>
      </div>
      <div style={{ minWidth: 0, paddingTop: 2 }}>
        <p style={{ fontSize: ".85rem", fontWeight: 700, color: T.ink, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{event.title}</p>
        <p style={{ fontSize: ".72rem", color: T.text2, display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
          {fmtTime(event.startAt)}
          {event.location && <><span style={{ color: T.border2 }}>·</span>{event.location}</>}
          {soon && <span style={{ background: T.amberL, color: T.amber, border: `1px solid ${T.amberM}`, padding: "1px 7px", borderRadius: 100, fontSize: ".6rem", fontWeight: 700 }}>{diff === 0 ? "Today!" : "Tomorrow"}</span>}
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
  const flatLabel = membership?.wingId?.name && membership?.unitId?.unitNumber
    ? `${membership.wingId.name}-${membership.unitId.unitNumber}` : null;

  const Spinner = (
    <span style={{ width: 12, height: 12, display: "inline-block", borderRadius: "50%", border: "2px solid rgba(255,255,255,.35)", borderTopColor: "#fff", animation: "dp-spin .7s linear infinite" }} />
  );

  return (
    <>
      <style>{CSS}</style>
      <div className="dp-root" style={{ padding: "28px 32px 60px" }}>

        {/* ══ TOPBAR ══ */}
        <div className="dp-topbar" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, marginBottom: 32, flexWrap: "wrap" }}>
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [.22, 1, .36, 1] }}>
            <p style={{ fontSize: ".82rem", color: T.text3, marginBottom: 5, fontWeight: 500 }}>
              Good {word} · {today}
            </p>
            <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "clamp(1.7rem,3vw,2.4rem)", fontWeight: 800, color: T.ink, letterSpacing: "-1.2px", lineHeight: 1.1, marginBottom: 6 }}>
              Hello, <span style={{ color: T.amber }}>{first}.</span>
            </h1>
            <p style={{ fontSize: ".8rem", color: T.text2 }}>
              {flatLabel ? `🏠 Flat ${flatLabel} · ` : ""}Let's get things done!
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }} style={{ display: "flex", alignItems: "center", gap: 9, flexShrink: 0, flexWrap: "wrap" }}>
            <div style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: T.text3, pointerEvents: "none" }} />
              <input className="dp-search" placeholder="Search…" />
            </div>
            <button className="dp-icon-btn">
              <Bell size={15} style={{ color: T.text2 }} />
              {pendingApprovals > 0 && <span style={{ position: "absolute", top: 8, right: 8, width: 7, height: 7, borderRadius: "50%", background: T.red, border: "2px solid #fff" }} />}
            </button>
            <button onClick={load} disabled={loading} className="dp-sync">
              <RefreshCw size={12} style={{ animation: loading ? "dp-spin 1s linear infinite" : "none" }} /> Sync
            </button>
            <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: `linear-gradient(135deg, ${T.amber} 0%, ${T.amberH} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".72rem", fontWeight: 800, color: "#fff", boxShadow: `0 2px 10px ${T.amberM}` }}>
              {initials}
            </div>
          </motion.div>
        </div>

        {/* ══ ERROR ══ */}
        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, background: T.redL, border: "1px solid #FECACA", borderRadius: 12, padding: "12px 16px", fontSize: ".85rem", color: T.red }}>
            <XCircle size={15} /> {error}
            <button onClick={() => setError("")} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: T.red, display: "flex" }}><XCircle size={14} /></button>
          </div>
        )}

        {/* ══ ADMIN ALERT ══ */}
        {isAdmin && pendingApprovals > 0 && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            <Link to="/admin/approvals" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, background: T.amberL, border: `1px solid ${T.amberM}`, borderRadius: 14, padding: "13px 18px", marginBottom: 22, textDecoration: "none", boxShadow: T.sh }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: T.amberM, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>⚠️</div>
                <div>
                  <p style={{ fontSize: ".87rem", fontWeight: 700, color: T.amberH, margin: "0 0 2px" }}>
                    {pendingApprovals} membership {pendingApprovals === 1 ? "request" : "requests"} awaiting your approval
                  </p>
                  <p style={{ fontSize: ".73rem", color: T.amber, margin: 0 }}>Click to review and approve new residents</p>
                </div>
              </div>
              <ArrowRight size={16} style={{ color: T.amber, flexShrink: 0 }} />
            </Link>
          </motion.div>
        )}

        {/* ══ STAT CARDS ══ */}
        <div className="dp-stat-row" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
          <StatCard index={0} label="Active Visitors"    value={visitorRequests.length} icon={Users}    iconBg={T.amberL} iconColor={T.amber} trend={visitorRequests.length > 0 ? `${visitorRequests.length} waiting at gate` : "No visitors right now"} loading={loading} />
          <StatCard index={1} label="Open Tickets"       value={openTickets}            icon={FileText} iconBg={T.redL}   iconColor={T.red}   trend={`${tickets.length} total raised`}                                                                        loading={loading} />
          <StatCard index={2} label="Events This Month"  value={thisMonthEvents}        icon={Calendar} iconBg={T.greenL} iconColor={T.green} trend={upcomingEvents.length > 0 ? `Next: ${fmtDate(upcomingEvents[0]?.startAt)}` : "No upcoming events"}        loading={loading} />
          <StatCard index={3} label="Announcements"      value={announcements.length}   icon={Megaphone} iconBg={T.blueL} iconColor={T.blue}  trend="Community notices"                                                                                        loading={loading} />
        </div>

        {/* ══ MAIN GRID ══ */}
        <div className="dp-main-grid" style={{ display: "grid", gridTemplateColumns: "1fr 310px", gap: 18, alignItems: "start" }}>

          {/* ── LEFT: Activity feed ── */}
          <div>
            <motion.div className="dp-section" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.45, ease: [.22, 1, .36, 1] }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.green, display: "inline-block", animation: "dp-blink 1.8s ease-in-out infinite" }} />
                    <span style={{ fontSize: ".6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: T.amber }}>Live Feed</span>
                  </div>
                  <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "1.05rem", fontWeight: 800, color: T.ink }}>Recent Activity</h2>
                </div>
                <Link to="/announcements" className="dp-view-all">View all <ChevronRight size={11} /></Link>
              </div>

              {loading ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} style={{ marginBottom: 8, padding: "14px 16px", borderRadius: 12, border: `1px solid ${T.border}`, background: T.surface }}>
                    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}><Sk style={{ width: 58, height: 18, borderRadius: 100 }} /><Sk style={{ width: 74, height: 18, borderRadius: 100 }} /></div>
                    <Sk style={{ height: 15, width: "64%", marginBottom: 7 }} />
                    <Sk style={{ height: 12, width: "48%" }} />
                  </div>
                ))
              ) : feed.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "52px 0", textAlign: "center" }}>
                  <div style={{ width: 52, height: 52, borderRadius: 15, background: T.amberL, border: `1px solid ${T.amberM}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 14 }}>🔔</div>
                  <p style={{ fontSize: ".92rem", fontWeight: 700, color: T.ink, marginBottom: 5 }}>All caught up!</p>
                  <p style={{ fontSize: ".8rem", color: T.text2 }}>No activity in your community yet.</p>
                </div>
              ) : (
                <AnimatePresence>
                  {feed.map((item, i) => <ActivityCard key={`${item.type}-${item.data._id}`} item={item} index={i} />)}
                </AnimatePresence>
              )}
            </motion.div>

            {/* Visitor requests */}
            {isResident && visitorRequests.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.4 }} style={{ marginTop: 16 }}>
                <div className="dp-visitor-wrap dp-section" style={{ border: "1px solid rgba(220,38,38,.25)", background: "#FFF8F8" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: T.red, display: "inline-block", animation: "dp-blink 1s ease-in-out infinite" }} />
                    <span style={{ fontSize: ".6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: T.red }}>Action Required</span>
                  </div>
                  <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "1rem", fontWeight: 800, color: T.ink, marginBottom: 16 }}>Visitor at Gate</h3>
                  <AnimatePresence>
                    {visitorRequests.map(v => (
                      <motion.div key={v._id} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}
                        style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 14, marginBottom: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 13 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: T.redL, border: "1px solid #FECACA", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>👤</div>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: ".86rem", fontWeight: 700, color: T.ink, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.visitorName}</p>
                            <p style={{ fontSize: ".72rem", color: T.text2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.purpose}{v.visitorPhone ? ` · ${v.visitorPhone}` : ""}</p>
                          </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          <button onClick={() => respondToVisitor(v._id, "rejected")} disabled={respondingId === v._id}
                            style={{ padding: "9px", borderRadius: 9, fontSize: ".78rem", fontWeight: 700, background: T.redL, color: T.red, border: "1px solid #FECACA", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontFamily: "'DM Sans', sans-serif", opacity: respondingId === v._id ? 0.6 : 1 }}>
                            {respondingId === v._id ? Spinner : <><XCircle size={13} /> Reject</>}
                          </button>
                          <button onClick={() => respondToVisitor(v._id, "approved")} disabled={respondingId === v._id}
                            style={{ padding: "9px", borderRadius: 9, fontSize: ".78rem", fontWeight: 700, background: T.green, color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontFamily: "'DM Sans', sans-serif", boxShadow: "0 2px 8px rgba(22,163,74,.3)", opacity: respondingId === v._id ? 0.6 : 1 }}>
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

            {/* Quick Actions */}
            <motion.div className="dp-section" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15, duration: 0.4, ease: [.22, 1, .36, 1] }}>
              <div style={{ marginBottom: 14 }}>
                <p style={{ fontSize: ".6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: T.amber, marginBottom: 3 }}>Shortcuts</p>
                <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "1.05rem", fontWeight: 800, color: T.ink }}>Quick Actions</h2>
              </div>
              <QuickAction delay={0.18} to="/tickets"         icon={Plus}      label="Raise a Ticket"  iconBg={T.redL}    iconColor={T.red}    />
              <QuickAction delay={0.21} to="/amenities"       icon={BookOpen}  label="Book Amenity"    iconBg={T.greenL}  iconColor={T.green}  />
              <QuickAction delay={0.24} to="/visitors/prereg" icon={UserCheck} label="Pre-reg Visitor" iconBg={T.amberL}  iconColor={T.amber}  />
              <QuickAction delay={0.27} to="/polls"           icon={BarChart2} label="View Polls"      iconBg={T.blueL}   iconColor={T.blue}   />
              <QuickAction delay={0.30} to="/lost-found"      icon={Package}   label="Lost & Found"    iconBg={T.purpleL} iconColor={T.purple} />
            </motion.div>

            {/* Upcoming Events */}
            <motion.div className="dp-section" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.22, duration: 0.4, ease: [.22, 1, .36, 1] }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: ".6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: T.amber, marginBottom: 3 }}>Schedule</p>
                  <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "1.05rem", fontWeight: 800, color: T.ink }}>Upcoming</h2>
                </div>
                <Link to="/events" className="dp-view-all">See all <ChevronRight size={11} /></Link>
              </div>
              {loading ? <><Sk style={{ height: 54, marginBottom: 10 }} /><Sk style={{ height: 54 }} /></>
                : upcomingEvents.length === 0
                  ? <div style={{ borderRadius: 10, border: `1.5px dashed ${T.border}`, background: T.bg, padding: "18px 14px", textAlign: "center", fontSize: ".82rem", color: T.text3, fontWeight: 500 }}>No upcoming events yet.</div>
                  : upcomingEvents.slice(0, 3).map((e, i) => <EventRow key={e._id} event={e} index={i} isLast={i === Math.min(upcomingEvents.length, 3) - 1} />)
              }
            </motion.div>

            {/* Admin workspace */}
            {isAdmin && (
              <motion.div className="dp-section" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.28, duration: 0.4, ease: [.22, 1, .36, 1] }} style={{ borderTop: `3px solid ${T.amber}` }}>
                <p style={{ fontSize: ".6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: T.amber, marginBottom: 3 }}>Admin</p>
                <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "1.05rem", fontWeight: 800, color: T.ink, marginBottom: 14 }}>Workspace</h2>
                {[
                  { to: "/admin/approvals",     emoji: "👥", label: "Pending Approvals", badge: pendingApprovals || null },
                  { to: "/admin/society-setup", emoji: "⚙️", label: "Society Setup" },
                ].map(({ to, emoji, label, badge }) => (
                  <Link key={to} to={to} className="dp-admin-link">
                    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: ".84rem", fontWeight: 600, color: T.ink2 }}>
                      <span>{emoji}</span> {label}
                    </div>
                    {badge
                      ? <span style={{ background: T.amberL, color: T.amber, border: `1px solid ${T.amberM}`, padding: "2px 9px", borderRadius: 100, fontSize: ".7rem", fontWeight: 700 }}>{badge}</span>
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
