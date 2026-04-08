import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell, CalendarDays, Ticket, ArrowRight, Clock,
  MapPin, AlertTriangle, XCircle, Users, Wrench,
  Megaphone, RefreshCw, Home, Plus, BookOpen,
  ChevronRight, Activity, Zap, CheckCircle
} from "lucide-react";
import { useAuth } from "../components/AuthContext";
import { apiRequest } from "../components/api";
import { getSocket } from "../components/socket";
import { SecurityDashboard } from "./SecurityDashboard";

/* ── Google Fonts injected once ─────────────────────────────── */
if (!document.getElementById("dash-fonts")) {
  const l = document.createElement("link");
  l.id = "dash-fonts";
  l.rel = "stylesheet";
  l.href =
    "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=DM+Serif+Display:ital@0;1&display=swap";
  document.head.appendChild(l);
}

/* ── Design Tokens ──────────────────────────────────────────── */
const tok = {
  cream:         "#FDFCF9",
  stone50:       "#F7F5F0",
  stone100:      "#EDEBE4",
  stone200:      "#D9D6CC",
  stone400:      "#9E9B91",
  stone600:      "#6B6860",
  stone800:      "#2E2D29",
  gold:          "#C9A84C",
  goldLight:     "#F5EDD6",
  indigo:        "#3D52A0",
  indigoLight:   "#EEF1FA",
  indigoBorder:  "#C7D0EE",
  emerald:       "#1A7A5E",
  emeraldLight:  "#E6F5F0",
  emeraldBorder: "#B2DECE",
  rose:          "#C0392B",
  roseLight:     "#FBF0EE",
  roseBorder:    "#F5C6C2",
  amber:         "#B5620D",
  amberLight:    "#FEF5E7",
  amberBorder:   "#FDE68A",
};

/* ── Helpers ────────────────────────────────────────────────── */
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

/* ── Feed builder ───────────────────────────────────────────── */
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

/* ── Skeleton ───────────────────────────────────────────────── */
function Sk({ style = {} }) {
  return (
    <div
      style={{
        borderRadius: 12,
        background: tok.stone100,
        animation: "pulse 1.5s ease-in-out infinite",
        ...style,
      }}
    />
  );
}

/* ── MiniStat ───────────────────────────────────────────────── */
function MiniStat({ label, value, loading }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center",
      background: tok.stone50, border: `1px solid ${tok.stone100}`,
      borderRadius: 20, padding: "20px 28px", minWidth: 90,
    }}>
      {loading
        ? <Sk style={{ width: 48, height: 40, marginBottom: 4 }} />
        : <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 40, lineHeight: 1, color: tok.stone800 }}>{value}</span>
      }
      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: tok.stone400, marginTop: 4 }}>
        {label}
      </span>
    </div>
  );
}

/* ── Feed Item ──────────────────────────────────────────────── */
const FEED_CFG = {
  announcement: {
    bg: tok.indigoLight, iconColor: tok.indigo,
    chipBg: tok.indigoLight, chipColor: tok.indigo, chipBorder: tok.indigoBorder,
    label: "Notice", emoji: "📢",
  },
  ticket: {
    bg: tok.roseLight, iconColor: tok.rose,
    chipBg: tok.roseLight, chipColor: tok.rose, chipBorder: tok.roseBorder,
    label: "Ticket", emoji: "🎫",
  },
  event: {
    bg: tok.emeraldLight, iconColor: tok.emerald,
    chipBg: tok.emeraldLight, chipColor: tok.emerald, chipBorder: tok.emeraldBorder,
    label: "Event", emoji: "📅",
  },
};

const STATUS_STYLE = {
  open:        { bg: tok.indigoLight, color: tok.indigo, border: tok.indigoBorder },
  in_progress: { bg: tok.amberLight,  color: tok.amber,  border: tok.amberBorder  },
  resolved:    { bg: tok.emeraldLight,color: tok.emerald,border: tok.emeraldBorder},
  closed:      { bg: tok.stone50,     color: tok.stone600,border: tok.stone200    },
};

function FeedItem({ item, isLast }) {
  const cfg = FEED_CFG[item.type];
  const d   = item.data;
  const [hov, setHov] = useState(false);

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", gap: 16,
        padding: "18px 0",
        borderBottom: isLast ? "none" : `1px solid ${tok.stone100}`,
        transition: "all .2s",
      }}
    >
      {/* Icon */}
      <div style={{
        width: 44, height: 44, borderRadius: 14, flexShrink: 0,
        background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18, transition: "transform .2s",
        transform: hov ? "scale(1.08)" : "scale(1)",
      }}>
        {cfg.emoji}
      </div>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Chip + time */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", padding: "3px 10px",
            borderRadius: 100, fontSize: 10, fontWeight: 700,
            letterSpacing: "0.07em", textTransform: "uppercase",
            background: cfg.chipBg, color: cfg.chipColor, border: `1px solid ${cfg.chipBorder}`,
          }}>
            {cfg.label}
          </span>
          <span style={{ fontSize: 11, color: tok.stone400 }}>🕐 {timeAgo(item.date)}</span>
        </div>

        {/* Title */}
        <p style={{
          fontSize: 15, fontWeight: 500, color: hov ? tok.indigo : tok.stone800,
          lineHeight: 1.3, transition: "color .2s",
        }}>
          {d.title || d.amenityName || "—"}
        </p>

        {/* Subtext */}
        {item.type === "announcement" && d.body && (
          <p style={{ fontSize: 13, color: tok.stone400, marginTop: 3, lineHeight: 1.45 }}>
            {d.body}
          </p>
        )}

        {item.type === "ticket" && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 7 }}>
            <MetaPill>{d.category}</MetaPill>
            {d.status && (() => {
              const ss = STATUS_STYLE[d.status] || STATUS_STYLE.open;
              return (
                <span style={{
                  padding: "4px 10px", borderRadius: 100, fontSize: 10, fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: "0.06em",
                  background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`,
                }}>
                  {d.status.replace("_", " ")}
                </span>
              );
            })()}
          </div>
        )}

        {item.type === "event" && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 7 }}>
            <MetaPill>📅 {fmtDate(d.startAt)} · {fmtTime(d.startAt)}</MetaPill>
            {d.location && <MetaPill>📍 {d.location}</MetaPill>}
          </div>
        )}
      </div>
    </div>
  );
}

function MetaPill({ children }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "4px 10px", borderRadius: 8,
      background: tok.stone50, border: `1px solid ${tok.stone100}`,
      fontSize: 11, fontWeight: 500, color: tok.stone600,
    }}>
      {children}
    </span>
  );
}

/* ── Quick Action ───────────────────────────────────────────── */
function QuickAction({ to, emoji, label, hoverColor, hoverBg, hoverBorder }) {
  const [hov, setHov] = useState(false);
  return (
    <Link
      to={to}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", gap: 10,
        padding: "20px 12px", borderRadius: 16,
        border: `1px solid ${hov ? hoverBorder : tok.stone100}`,
        background: hov ? hoverBg : "#fff",
        fontSize: 12, fontWeight: 600,
        color: hov ? hoverColor : tok.stone600,
        textDecoration: "none",
        transform: hov ? "translateY(-2px)" : "none",
        transition: "all .2s",
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 14, fontSize: 20,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: hov ? "#fff" : tok.stone50,
        border: `1px solid ${hov ? hoverBorder : tok.stone100}`,
        transition: "all .2s",
      }}>
        {emoji}
      </div>
      {label}
    </Link>
  );
}

/* ── Upcoming Event Row ─────────────────────────────────────── */
function EventRow({ event }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "13px 14px", borderRadius: 14,
        border: `1px solid ${hov ? tok.stone200 : tok.stone100}`,
        background: hov ? "#fff" : tok.stone50,
        marginBottom: 8, cursor: "pointer",
        transform: hov ? "translateX(3px)" : "none",
        transition: "all .2s",
      }}
    >
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", width: 44, height: 44, borderRadius: 12,
        background: tok.indigoLight, flexShrink: 0,
      }}>
        <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, lineHeight: 1, color: tok.indigo, fontWeight: 700 }}>
          {fmtDay(event.startAt)}
        </span>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: tok.indigo }}>
          {fmtMonth(event.startAt)}
        </span>
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: tok.stone800 }}>{event.title}</div>
        <div style={{ fontSize: 11, color: tok.stone400, marginTop: 2 }}>
          {event.location ? `📍 ${event.location} · ` : ""}{fmtTime(event.startAt)}
        </div>
      </div>
    </div>
  );
}

/* ── Booking Row ────────────────────────────────────────────── */
const BK_STATUS = {
  approved: { bg: tok.emeraldLight, color: tok.emerald, border: tok.emeraldBorder },
  pending:  { bg: tok.amberLight,   color: tok.amber,   border: tok.amberBorder   },
  rejected: { bg: tok.roseLight,    color: tok.rose,    border: tok.roseBorder    },
};
function BookingRow({ b }) {
  const ss = BK_STATUS[b.status] || BK_STATUS.pending;
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
      padding: "12px 14px", borderRadius: 14,
      border: `1px solid ${tok.stone100}`, background: tok.stone50, marginBottom: 8,
    }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: tok.stone800 }}>{b.amenityName}</div>
        <div style={{ fontSize: 11, color: tok.stone400, marginTop: 2 }}>
          {b.date} · {b.startTime}–{b.endTime}
        </div>
      </div>
      <span style={{
        padding: "4px 10px", borderRadius: 100, fontSize: 10, fontWeight: 700,
        letterSpacing: "0.06em", textTransform: "uppercase",
        background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`,
        flexShrink: 0,
      }}>
        {b.status}
      </span>
    </div>
  );
}

/* ── Section Header ─────────────────────────────────────────── */
function SectionHeader({ eyebrow, title, linkTo, linkLabel }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 22 }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: tok.stone400, marginBottom: 2 }}>
          {eyebrow}
        </div>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: tok.stone800 }}>
          {title}
        </div>
      </div>
      {linkTo && (
        <Link to={linkTo} style={{
          fontSize: 12, fontWeight: 600, color: tok.stone400, textDecoration: "none",
          letterSpacing: "0.04em", textTransform: "uppercase",
          padding: "6px 14px", borderRadius: 100,
          border: `1px solid ${tok.stone100}`, background: tok.stone50,
        }}>
          {linkLabel || "View all"}
        </Link>
      )}
    </div>
  );
}

/* ── Card ───────────────────────────────────────────────────── */
function Card({ children, style = {} }) {
  return (
    <div style={{
      background: "#fff", border: `1px solid ${tok.stone100}`,
      borderRadius: 24, padding: "28px",
      ...style,
    }}>
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════════════════════════════ */
export function DashboardPage() {
  const { token, user, membership } = useAuth();

  // Route to role-specific dashboard
  if (user?.role === "security") return <SecurityDashboard />;

  const isAdmin    = ["committee", "super_admin"].includes(user?.role);
  const isResident = user?.role === "resident";

  const [announcements,      setAnnouncements]      = useState([]);
  const [tickets,            setTickets]            = useState([]);
  const [events,             setEvents]             = useState([]);
  const [bookings,           setBookings]           = useState([]);
  const [pendingApprovals,   setPendingApprovals]   = useState(0);
  const [visitorRequests,    setVisitorRequests]    = useState([]);
  const [respondingId,       setRespondingId]       = useState(null);
  const [loading,            setLoading]            = useState(true);
  const [error,              setError]              = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true); setError("");
    try {
      const calls = [
        apiRequest("/announcements",     { token }),
        apiRequest("/tickets",           { token }),
        apiRequest("/events",            { token }),
        apiRequest("/amenities/bookings",{ token }),
      ];
      if (isAdmin)   calls.push(apiRequest("/admin/pending-approvals",  { token }));
      if (isResident) calls.push(apiRequest("/visitors/my-requests",    { token }));

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
  }, [token, isAdmin]);

  useEffect(() => { load(); }, [load]);

  // Real-time: new visitor request arrives → add to the list
  useEffect(() => {
    if (!isResident) return;
    const socket = getSocket();
    function onIncoming({ visitor }) {
      setVisitorRequests(prev => [visitor, ...prev.filter(v => v._id !== visitor._id)]);
    }
    socket.on("visitor:request_incoming", onIncoming);
    return () => socket.off("visitor:request_incoming", onIncoming);
  }, [isResident]);

  async function respondToVisitor(visitorId, decision) {
    setRespondingId(visitorId);
    try {
      await apiRequest(`/visitors/${visitorId}/respond`, { token, method: "PATCH", body: { decision } });
      // Remove from pending list after responding
      setVisitorRequests(prev => prev.filter(v => v._id !== visitorId));
    } catch (err) {
      setError(err.message);
    } finally {
      setRespondingId(null);
    }
  }

  const userId        = user?._id || user?.id || "";
  const { word, first }= greeting(user?.fullName);
  const openTickets   = useMemo(() => tickets.filter(t => !["resolved","closed"].includes(t.status)), [tickets]);
  const upcomingEvents= useMemo(() =>
    events.filter(e => new Date(e.startAt) >= new Date())
          .sort((a,b) => new Date(a.startAt)-new Date(b.startAt)),
    [events]);
  const myBookings    = useMemo(() =>
    bookings.filter(b=>(b.requestedBy?._id||b.requestedBy)===userId).slice(0,3),
    [bookings, userId]);
  const feed          = useMemo(() => buildFeed(announcements, tickets, events), [announcements,tickets,events]);

  const flatLabel = membership?.wingId?.name && membership?.unitId?.unitNumber
    ? `${membership.wingId.name}-${membership.unitId.unitNumber}` : null;

  const today = new Date().toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"short" });

  return (
    <div style={{
      fontFamily: "'DM Sans', sans-serif",
      background: tok.cream,
      minHeight: "calc(100vh - 90px)",
      padding: "32px 24px 64px",
      margin: "-16px -24px",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* ── Error ─────────────────────────────────── */}
        {error && (
          <div style={{
            display:"flex", alignItems:"center", gap:12,
            background:"#FBF0EE", border:`1px solid ${tok.roseBorder}`,
            borderRadius:16, padding:"14px 20px",
            fontSize:14, fontWeight:500, color:tok.rose, marginBottom:20,
          }}>
            <XCircle size={18} /> {error}
          </div>
        )}

        {/* ── HERO ──────────────────────────────────── */}
        <div style={{
          background:"#fff", border:`1px solid ${tok.stone100}`,
          borderRadius: 32, padding:"36px 40px",
          display:"flex", alignItems:"flex-end", justifyContent:"space-between",
          gap:24, position:"relative", overflow:"hidden", marginBottom:20,
        }}>
          {/* Decorative blob */}
          <div style={{
            position:"absolute", top:-60, right:-60,
            width:280, height:280, borderRadius:"50%",
            background:tok.goldLight, opacity:0.55,
            pointerEvents:"none",
          }} />

          {/* Greeting */}
          <div style={{ position:"relative", zIndex:1 }}>
            <div style={{ fontSize:13, fontWeight:500, color:tok.stone400, letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:6 }}>
              Good {word} · {today}
            </div>
            <div style={{ fontFamily:"'DM Serif Display', serif", fontSize:48, lineHeight:1, color:tok.stone800, marginBottom:18 }}>
              Welcome back,{" "}
              <em style={{ fontStyle:"italic", color:tok.gold }}>{first}.</em>
            </div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              <span style={{
                display:"inline-flex", alignItems:"center", gap:6,
                padding:"6px 14px", borderRadius:100, fontSize:12, fontWeight:500,
                border:`1px solid ${tok.stone100}`, background:tok.stone50, color:tok.stone600,
              }}>
                <span style={{ width:6, height:6, borderRadius:"50%", background:tok.gold, display:"inline-block" }} />
                {user?.role?.replace("_"," ")}
              </span>
              {flatLabel && (
                <span style={{
                  display:"inline-flex", alignItems:"center", gap:6,
                  padding:"6px 14px", borderRadius:100, fontSize:12, fontWeight:500,
                  border:`1px solid ${tok.stone100}`, background:tok.stone50, color:tok.stone600,
                }}>
                  🏠 {flatLabel}
                </span>
              )}
            </div>
          </div>

          {/* Stats */}
          <div style={{ display:"flex", gap:12, position:"relative", zIndex:1, flexShrink:0 }}>
            <MiniStat label="Notices" value={announcements.length} loading={loading} />
            <MiniStat label="Tickets" value={openTickets.length}   loading={loading} />
            <MiniStat label="Events"  value={upcomingEvents.length}loading={loading} />
          </div>

          {/* Sync button */}
          <button
            onClick={load}
            disabled={loading}
            style={{
              position:"absolute", top:28, right:32,
              display:"flex", alignItems:"center", gap:6,
              fontSize:12, fontWeight:500, color:tok.stone400,
              background:tok.stone50, border:`1px solid ${tok.stone100}`,
              padding:"7px 14px", borderRadius:100, cursor:"pointer",
              transition:"all .2s", zIndex:2,
            }}
          >
            <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            Sync
          </button>
        </div>

        {/* ── Admin Alert ────────────────────────────── */}
        {isAdmin && pendingApprovals > 0 && (
          <Link
            to="/admin/approvals"
            style={{
              display:"flex", alignItems:"center", justifyContent:"space-between", gap:16,
              background:tok.amberLight, border:`1px solid #FBBF24`,
              borderRadius:16, padding:"16px 22px", marginBottom:20,
              textDecoration:"none",
            }}
          >
            <div style={{ display:"flex", alignItems:"center", gap:14 }}>
              <div style={{
                width:36, height:36, borderRadius:10, background:"#FDE68A",
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:16,
              }}>⚠️</div>
              <div>
                <p style={{ fontSize:14, fontWeight:600, color:"#92400E" }}>
                  {pendingApprovals} membership {pendingApprovals===1?"request":"requests"} pending
                </p>
                <span style={{ fontSize:12, color:"#B45309" }}>Action required to approve new residents</span>
              </div>
            </div>
            <ArrowRight size={18} color="#D97706" />
          </Link>
        )}

        {/* ── BENTO GRID ─────────────────────────────── */}
        <div style={{
          display:"grid",
          gridTemplateColumns:"1fr 360px",
          gap:20,
        }}>
          {/* LEFT: Feed */}
          <Card>
            <SectionHeader
              eyebrow="Live Updates"
              title="Recent Activity"
              linkTo="/announcements"
              linkLabel="View all"
            />

            {loading ? (
              <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
                {[...Array(4)].map((_,i) => (
                  <div key={i} style={{ display:"flex", gap:16 }}>
                    <Sk style={{ width:44, height:44, flexShrink:0 }} />
                    <div style={{ flex:1, display:"flex", flexDirection:"column", gap:8 }}>
                      <Sk style={{ height:16, width:"30%" }} />
                      <Sk style={{ height:14, width:"70%" }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : feed.length === 0 ? (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"48px 0", textAlign:"center" }}>
                <div style={{ width:56, height:56, borderRadius:16, background:tok.stone50, border:`1px solid ${tok.stone100}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, marginBottom:12 }}>
                  🔔
                </div>
                <p style={{ fontSize:15, fontWeight:500, color:tok.stone800 }}>All caught up</p>
                <p style={{ fontSize:13, color:tok.stone400, marginTop:4 }}>No new activity in your community.</p>
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
          </Card>

          {/* RIGHT column */}
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

            {/* Pending Visitor Requests — residents only */}
            {isResident && visitorRequests.length > 0 && (
              <div style={{
                background:"#FFF7ED", border:"1px solid #FED7AA",
                borderRadius:24, padding:24,
              }}>
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:"#C2500A", marginBottom:4 }}>
                  Action Required
                </div>
                <div style={{ fontFamily:"'DM Serif Display', serif", fontSize:20, color:tok.stone800, marginBottom:16 }}>
                  Visitor at Gate
                </div>
                {visitorRequests.map(v => (
                  <div key={v._id} style={{
                    background:"#fff", border:"1px solid #FED7AA",
                    borderRadius:16, padding:"14px 16px", marginBottom:10,
                  }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                      <div style={{ width:38, height:38, borderRadius:12, background:"#FFF7ED", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>
                        👤
                      </div>
                      <div>
                        <p style={{ fontSize:14, fontWeight:600, color:tok.stone800 }}>{v.visitorName}</p>
                        <p style={{ fontSize:11, color:tok.stone400 }}>
                          {v.purpose} {v.visitorPhone ? `· ${v.visitorPhone}` : ""}
                          {v.loggedBy?.fullName ? ` · Guard: ${v.loggedBy.fullName}` : ""}
                        </p>
                      </div>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                      <button
                        onClick={() => respondToVisitor(v._id, "rejected")}
                        disabled={respondingId === v._id}
                        style={{
                          padding:"9px 0", borderRadius:10, fontSize:12, fontWeight:700,
                          border:"1.5px solid #FCA5A5", background:"#FEF2F2", color:"#B91C1C",
                          cursor:"pointer", opacity: respondingId === v._id ? 0.6 : 1,
                          display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                        }}
                      >
                        <XCircle size={13} /> Reject
                      </button>
                      <button
                        onClick={() => respondToVisitor(v._id, "approved")}
                        disabled={respondingId === v._id}
                        style={{
                          padding:"9px 0", borderRadius:10, fontSize:12, fontWeight:700,
                          border:"none", background:"#16A34A", color:"#fff",
                          cursor:"pointer", opacity: respondingId === v._id ? 0.6 : 1,
                          display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                        }}
                      >
                        <CheckCircle size={13} /> Approve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Actions */}
            <Card style={{ padding:24 }}>
              <SectionHeader eyebrow="Shortcuts" title="Quick Actions" />
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <QuickAction to="/tickets"       emoji="➕" label="Raise Ticket"  hoverColor={tok.indigo}  hoverBg={tok.indigoLight}  hoverBorder={tok.indigoBorder}  />
                <QuickAction to="/amenities"     emoji="📋" label="Book Amenity"  hoverColor={tok.emerald} hoverBg={tok.emeraldLight} hoverBorder={tok.emeraldBorder} />
                <QuickAction to="/announcements" emoji="🔔" label="Notices"       hoverColor={tok.amber}   hoverBg={tok.amberLight}   hoverBorder={tok.amberBorder}   />
                <QuickAction to="/events"        emoji="🗓" label="Events"        hoverColor={tok.rose}    hoverBg={tok.roseLight}    hoverBorder={tok.roseBorder}    />
              </div>
            </Card>

            {/* Upcoming Events */}
            <Card style={{ padding:24 }}>
              <SectionHeader eyebrow="Schedule" title="Upcoming" linkTo="/events" linkLabel="See all" />
              {loading ? (
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  <Sk style={{ height:68 }} />
                  <Sk style={{ height:68 }} />
                </div>
              ) : upcomingEvents.length === 0 ? (
                <div style={{
                  borderRadius:14, border:`1px dashed ${tok.stone200}`,
                  background:tok.stone50, padding:24, textAlign:"center",
                  fontSize:13, color:tok.stone400, fontWeight:500,
                }}>
                  No upcoming events yet.
                </div>
              ) : (
                upcomingEvents.slice(0,3).map(e => <EventRow key={e._id} event={e} />)
              )}
            </Card>

            {/* My Bookings */}
            {!loading && myBookings.length > 0 && (
              <Card style={{ padding:24 }}>
                <SectionHeader eyebrow="Reservations" title="My Bookings" linkTo="/amenities" linkLabel="Manage" />
                {myBookings.map(b => <BookingRow key={b._id} b={b} />)}
              </Card>
            )}

            {/* Admin Workspace */}
            {isAdmin && (
              <div style={{
                background:tok.stone800, borderRadius:24, padding:24,
                position:"relative", overflow:"hidden",
              }}>
                {/* Decorative blob */}
                <div style={{
                  position:"absolute", top:-40, right:-40,
                  width:160, height:160, borderRadius:"50%",
                  background:"rgba(201,168,76,0.12)", pointerEvents:"none",
                }} />
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:tok.stone400, marginBottom:4 }}>
                  Admin
                </div>
                <div style={{ fontFamily:"'DM Serif Display', serif", fontSize:22, color:"#fff", marginBottom:18 }}>
                  Workspace
                </div>
                <div style={{ position:"relative", zIndex:1 }}>
                  {[
                    { to:"/admin/approvals",    emoji:"👥", label:"Pending Approvals", badge: pendingApprovals > 0 ? pendingApprovals : null },
                    { to:"/admin/society-setup",emoji:"⚙️", label:"Society Setup"       },
                    { to:"/admin/reports",      emoji:"📊", label:"Maintenance Reports" },
                  ].map(({ to, emoji, label, badge }) => (
                    <Link
                      key={to}
                      to={to}
                      style={{
                        display:"flex", alignItems:"center", justifyContent:"space-between",
                        padding:"12px 16px", borderRadius:12,
                        background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.08)",
                        marginBottom:8, textDecoration:"none", transition:"all .2s",
                      }}
                      onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.1)"}
                      onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.06)"}
                    >
                      <div style={{ display:"flex", alignItems:"center", gap:10, fontSize:13, fontWeight:500, color:"rgba(255,255,255,0.8)" }}>
                        <span style={{ fontSize:15 }}>{emoji}</span> {label}
                      </div>
                      {badge ? (
                        <span style={{
                          background:tok.gold, color:tok.stone800,
                          padding:"2px 9px", borderRadius:100, fontSize:11, fontWeight:700,
                        }}>
                          {badge}
                        </span>
                      ) : (
                        <ChevronRight size={15} color="rgba(255,255,255,0.3)" />
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @media(max-width:860px){
          .dash-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}