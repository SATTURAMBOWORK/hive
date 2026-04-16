import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import {
  Bell, CalendarDays, Ticket, BookOpen,
  XCircle, RefreshCw, Plus, ChevronRight,
  CheckCircle, Zap, Users, ArrowRight,
  Shield, BarChart3, MapPin,
} from "lucide-react";
import { useAuth } from "../components/AuthContext";
import { apiRequest } from "../components/api";
import { getSocket } from "../components/socket";
import { SecurityDashboard } from "./SecurityDashboard";

/* ─── Design tokens — matching LandingPage exactly ────────────── */
const T = {
  bg:          "#F7F9FF",
  bgCard:      "#FFFFFF",
  bgSubtle:    "#EEF2FF",
  bgSubtle2:   "#F1F5F9",
  border:      "#E2E8F0",
  border2:     "#CBD5E1",
  text:        "#0F172A",
  text2:       "#64748B",
  text3:       "#94A3B8",
  blue:        "#2563EB",
  blueH:       "#1D4ED8",
  blueL:       "#EFF6FF",
  blueM:       "#DBEAFE",
  green:       "#16A34A",
  greenL:      "#DCFCE7",
  amber:       "#D97706",
  amberL:      "#FEF9C3",
  red:         "#DC2626",
  redL:        "#FEE2E2",
  purple:      "#7C3AED",
  purpleL:     "#F5F3FF",
  sh:          "0 1px 2px rgba(15,23,42,.04), 0 4px 16px rgba(15,23,42,.06)",
  sh2:         "0 4px 20px rgba(15,23,42,.08), 0 20px 48px rgba(15,23,42,.08)",
  sh3:         "0 8px 32px rgba(37,99,235,.14), 0 24px 56px rgba(15,23,42,.08)",
};

/* ─── CSS — mirrors LandingPage's lp class system ─────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap');

.dp-root {
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  background: ${T.bg};
  min-height: 100vh;
  color: ${T.text};
}
.dp-root * { box-sizing: border-box; margin: 0; padding: 0; }

/* ── Dot grid ── */
.dp-dot-grid {
  background-image: radial-gradient(circle, ${T.border} 1px, transparent 1px);
  background-size: 26px 26px;
}

/* ── Animations (same names as landing page) ── */
@keyframes dp-pulse {
  0%,100% { box-shadow: 0 0 0 0 rgba(37,99,235,.4); }
  70%     { box-shadow: 0 0 0 10px rgba(37,99,235,0); }
}
@keyframes dp-live {
  0%,100% { opacity: 1; transform: scale(1); }
  50%     { opacity: .3; transform: scale(1.5); }
}
@keyframes dp-float {
  0%,100% { transform: translateY(0); }
  50%     { transform: translateY(-6px); }
}
@keyframes dp-float2 {
  0%,100% { transform: translateY(0) rotate(-.3deg); }
  50%     { transform: translateY(-8px) rotate(.6deg); }
}
@keyframes dp-shimmer {
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
}
@keyframes dp-bar {
  from { transform: scaleY(0); opacity: 0; }
  to   { transform: scaleY(1); opacity: 1; }
}
@keyframes dp-scan {
  0%   { left: -25%; opacity: 0; }
  8%   { opacity: 1; }
  92%  { opacity: 1; }
  100% { left: 125%; opacity: 0; }
}
@keyframes dp-spin { to { transform: rotate(360deg); } }
@keyframes dp-pulse-ring {
  0%   { transform: scale(1); opacity: .7; }
  100% { transform: scale(2.6); opacity: 0; }
}
@keyframes dp-breathe {
  0%,100% { border-color: rgba(220,38,38,.25); box-shadow: 0 0 0 0 rgba(220,38,38,0); }
  50%     { border-color: rgba(220,38,38,.45); box-shadow: 0 0 18px rgba(220,38,38,.08); }
}
@keyframes dp-window {
  0%,100% { opacity: 1; }
  45%,55% { opacity: .1; }
}
@keyframes dp-skshimmer {
  0%   { background-position:  200% center; }
  100% { background-position: -200% center; }
}
@keyframes dp-bar-progress {
  from { width: 0; }
}

/* ── Skeleton ── */
.dp-sk {
  background: linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%);
  background-size: 200% 100%;
  animation: dp-skshimmer 1.6s ease-in-out infinite;
  border-radius: 6px;
}

/* ── Card ── */
.dp-card {
  background: ${T.bgCard};
  border: 1px solid ${T.border};
  border-radius: 20px;
  box-shadow: ${T.sh};
}

/* ── Feed item ── */
.dp-feed-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 14px 14px 18px;
  border-radius: 14px;
  border: 1px solid ${T.border};
  background: ${T.bgCard};
  position: relative;
  transition: box-shadow .2s, border-color .2s, transform .2s;
  cursor: default;
}
.dp-feed-item:hover {
  transform: translateY(-2px);
  box-shadow: ${T.sh2};
  border-color: ${T.border2};
}

/* ── Quick action tile ── */
.dp-qa-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 20px 12px;
  border-radius: 16px;
  border: 1.5px solid ${T.border};
  background: ${T.bgCard};
  text-decoration: none;
  box-shadow: ${T.sh};
  transition: transform .2s, box-shadow .2s, border-color .2s, background .2s;
  cursor: pointer;
}
.dp-qa-tile:hover {
  transform: translateY(-3px) scale(1.03);
  box-shadow: ${T.sh2};
  border-color: rgba(37,99,235,.3);
  background: ${T.blueL};
}

/* ── Admin link ── */
.dp-admin-link {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 14px; border-radius: 12px;
  background: ${T.bgSubtle2}; border: 1px solid ${T.border};
  margin-bottom: 8px; text-decoration: none;
  transition: background .2s, border-color .2s, box-shadow .2s;
}
.dp-admin-link:hover {
  background: ${T.blueL};
  border-color: rgba(37,99,235,.25);
  box-shadow: ${T.sh};
}

/* ── Section "view all" ── */
.dp-view-all {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: .72rem; font-weight: 600;
  color: ${T.text3};
  text-decoration: none;
  padding: 5px 12px;
  border-radius: 100px;
  border: 1px solid ${T.border};
  background: ${T.bgSubtle2};
  display: flex; align-items: center; gap: 4px;
  transition: color .2s, border-color .2s, background .2s;
}
.dp-view-all:hover {
  color: ${T.blue};
  border-color: rgba(37,99,235,.3);
  background: ${T.blueL};
}

/* ── Sync button ── */
.dp-sync {
  display: flex; align-items: center; gap: 6px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: .76rem; font-weight: 600;
  color: ${T.text2};
  background: ${T.bgCard};
  border: 1.5px solid ${T.border};
  padding: 7px 14px; border-radius: 100px;
  cursor: pointer;
  box-shadow: ${T.sh};
  transition: color .2s, border-color .2s, box-shadow .2s;
}
.dp-sync:hover {
  color: ${T.blue};
  border-color: rgba(37,99,235,.35);
  box-shadow: 0 0 0 3px rgba(37,99,235,.08);
}
.dp-sync:disabled { opacity: .5; cursor: not-allowed; }

/* ── Booking row ── */
.dp-booking {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  padding: 12px 14px; border-radius: 12px; margin-bottom: 8px;
  background: ${T.bgSubtle2}; border: 1px solid ${T.border};
  transition: background .2s, border-color .2s;
}
.dp-booking:hover {
  background: ${T.blueL};
  border-color: rgba(37,99,235,.2);
}

/* ── Timeline connector ── */
.dp-tl-line {
  width: 2px;
  background: linear-gradient(to bottom, ${T.border2}, transparent);
  flex-shrink: 0;
  animation: dp-skshimmer 0s; /* forces repaint */
}

/* ── Live hero scan ── */
.dp-hero-scan {
  position: absolute;
  top: 0; bottom: 0;
  width: 20%;
  background: linear-gradient(90deg, transparent, rgba(37,99,235,.04), rgba(37,99,235,.07), rgba(37,99,235,.04), transparent);
  animation: dp-scan 11s ease-in-out infinite;
  pointer-events: none;
  z-index: 2;
}

/* ── Visitor breathe ── */
.dp-visitor-card {
  animation: dp-breathe 3s ease-in-out infinite;
}

@media (max-width: 860px) {
  .dp-grid { grid-template-columns: 1fr !important; }
  .dp-stats { flex-wrap: wrap; }
  .dp-stats > * { min-width: calc(50% - 6px); }
  .dp-hero-right { display: none !important; }
}
@media (max-width: 520px) {
  .dp-stats > * { min-width: 100%; }
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
    let startTime = null, rafId;
    function step(ts) {
      if (!startTime) startTime = ts;
      const p = Math.min((ts - startTime) / duration, 1);
      setCount(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) rafId = requestAnimationFrame(step);
    }
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration]);
  return count;
}

/* ─── Skeleton ────────────────────────────────────────────────── */
function Sk({ style = {} }) {
  return <div className="dp-sk" style={style} />;
}

/* ─── Live dot (matches landing page) ────────────────────────── */
function LiveDot({ label = "LIVE" }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 9px", borderRadius: 100,
      background: T.greenL, border: `1px solid rgba(22,163,74,.3)`,
      fontSize: ".6rem", fontWeight: 700, letterSpacing: ".1em",
      color: T.green,
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: "50%", background: T.green,
        display: "inline-block", animation: "dp-live 1.6s ease-in-out infinite",
      }} />
      {label}
    </span>
  );
}

/* ─── Pulse ring (visitor alert) ─────────────────────────────── */
function PulseRing({ color }) {
  return (
    <div style={{ position: "relative", width: 10, height: 10, flexShrink: 0 }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: color, animation: "dp-pulse-ring 2s ease-out infinite" }} />
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: color, animation: "dp-pulse-ring 2s ease-out infinite .7s" }} />
      <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: color }} />
    </div>
  );
}

/* ─── Sparkline ───────────────────────────────────────────────── */
function Sparkline({ color, seed }) {
  const bars = Array.from({ length: 7 }, (_, i) => {
    return Math.round(Math.abs(Math.sin(seed * 13 + i * 2.1)) * 60 + 25);
  });
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 24 }}>
      {bars.map((h, i) => (
        <div key={i} style={{
          flex: 1, borderRadius: 2,
          background: i === 6 ? color : `${color}40`,
          height: `${h}%`,
          animation: `dp-bar .5s ease-out ${i * .05}s both`,
          transformOrigin: "bottom",
        }} />
      ))}
    </div>
  );
}

/* ─── Mini window grid (hero decoration, referencing login scene) */
const WIN_DATA = Array.from({ length: 20 }, (_, i) => ({
  lit:   (i * 7 + 3) % 5 !== 0,
  blue:  i % 7 === 0,
  delay: `${((i * 1.37) % 3.5).toFixed(1)}s`,
  dur:   `${(2 + (i % 3) * .7).toFixed(1)}s`,
}));

function MiniWindowGrid() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gridTemplateRows: "repeat(4,1fr)", gap: 5 }}>
      {WIN_DATA.map((w, i) => (
        <div key={i} style={{
          width: 15, height: 11, borderRadius: 2,
          background: !w.lit ? "#E2E8F0" : w.blue ? "#DBEAFE" : "#FEF9C3",
          border: `1px solid ${!w.lit ? "#F1F5F9" : w.blue ? "rgba(37,99,235,.2)" : "rgba(234,179,8,.2)"}`,
          boxShadow: w.lit ? (w.blue ? "0 0 5px rgba(37,99,235,.25)" : "0 0 5px rgba(234,179,8,.3)") : "none",
          animation: w.lit ? `dp-window ${w.dur} ease-in-out infinite ${w.delay}` : "none",
        }} />
      ))}
    </div>
  );
}

/* ─── Section header ──────────────────────────────────────────── */
function SectionHeader({ eyebrow, title, linkTo, linkLabel, live = false }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 18 }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
          <p style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: T.blue, margin: 0 }}>
            {eyebrow}
          </p>
          {live && <LiveDot />}
        </div>
        <h2 style={{ fontSize: "1.15rem", color: T.text, fontWeight: 800, lineHeight: 1.2, margin: 0 }}>
          {title}
        </h2>
      </div>
      {linkTo && (
        <Link to={linkTo} className="dp-view-all">
          {linkLabel || "View all"} <ChevronRight size={11} />
        </Link>
      )}
    </div>
  );
}

/* ─── Stat card (styled like landing page security hub stats) ─── */
function StatCard({ label, value, accent, icon: Icon, loading, delay, seed }) {
  const count = useCountUp(loading ? 0 : value);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: .97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: delay / 1000, duration: .5, ease: [.22, 1, .36, 1] }}
      className="dp-card"
      style={{ flex: 1, padding: "20px 22px 18px", position: "relative", overflow: "hidden" }}
    >
      {/* Colored top bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, ${accent}, ${accent}44)`,
        borderRadius: "20px 20px 0 0",
      }} />
      {/* Corner bg */}
      <div style={{
        position: "absolute", bottom: -20, right: -20,
        width: 80, height: 80, borderRadius: "50%",
        background: `radial-gradient(circle, ${accent}12 0%, transparent 70%)`,
      }} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <p style={{ fontSize: ".72rem", fontWeight: 600, color: T.text3, letterSpacing: ".05em", textTransform: "uppercase" }}>
          {label}
        </p>
        <motion.div
          initial={{ rotate: -15, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ delay: delay / 1000 + .2, type: "spring", stiffness: 200 }}
          style={{
            width: 30, height: 30, borderRadius: 9,
            background: `${accent}15`, border: `1px solid ${accent}30`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <Icon size={14} style={{ color: accent }} />
        </motion.div>
      </div>

      {loading
        ? <Sk style={{ width: 52, height: 32 }} />
        : <span style={{ fontSize: "2.2rem", fontWeight: 800, lineHeight: 1, color: accent }}>{count}</span>
      }
      {!loading && <Sparkline color={accent} seed={seed} />}
    </motion.div>
  );
}

/* ─── Status chip ─────────────────────────────────────────────── */
const STATUS_CFG = {
  open:        { bg: T.blueL,   color: T.blue,   border: "rgba(37,99,235,.25)"  },
  in_progress: { bg: T.amberL,  color: T.amber,  border: "rgba(217,119,6,.25)"  },
  resolved:    { bg: T.greenL,  color: T.green,  border: "rgba(22,163,74,.25)"  },
  closed:      { bg: T.bgSubtle2, color: T.text3, border: T.border },
};

function StatusChip({ status }) {
  const s = STATUS_CFG[status] || STATUS_CFG.open;
  return (
    <span style={{
      padding: "3px 9px", borderRadius: 100,
      fontSize: ".62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em",
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>
      {status?.replace("_", " ")}
    </span>
  );
}

/* ─── Feed type config ────────────────────────────────────────── */
const FEED_CFG = {
  announcement: { label: "Notice", color: T.blue,   bg: T.blueL,   borderL: T.blue,   emoji: "📢" },
  ticket:       { label: "Ticket", color: T.red,    bg: T.redL,    borderL: T.red,    emoji: "🎫" },
  event:        { label: "Event",  color: T.green,  bg: T.greenL,  borderL: T.green,  emoji: "📅" },
};

function TypeBadge({ type }) {
  const cfg = FEED_CFG[type];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 9px", borderRadius: 100,
      fontSize: ".6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em",
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30`,
    }}>
      {cfg.emoji} {cfg.label}
    </span>
  );
}

function MetaPill({ children }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 9px", borderRadius: 8,
      background: T.bgSubtle2, border: `1px solid ${T.border}`,
      fontSize: ".7rem", fontWeight: 500, color: T.text2,
    }}>
      {children}
    </span>
  );
}

/* ─── Feed item ───────────────────────────────────────────────── */
function FeedItem({ item, isLast, index }) {
  const cfg = FEED_CFG[item.type];
  const d   = item.data;
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * .07, duration: .4, ease: [.22, 1, .36, 1] }}
      className="dp-feed-item"
      style={{
        marginBottom: isLast ? 0 : 8,
        borderLeft: `3px solid ${cfg.borderL}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <TypeBadge type={item.type} />
        <span style={{ fontSize: ".67rem", color: T.text3, whiteSpace: "nowrap", flexShrink: 0 }}>
          {timeAgo(item.date)}
        </span>
      </div>
      <p style={{ fontSize: ".9rem", fontWeight: 700, color: T.text, lineHeight: 1.4 }}>
        {d.title || d.amenityName || "—"}
      </p>
      {item.type === "announcement" && d.body && (
        <p style={{ fontSize: ".8rem", color: T.text2, lineHeight: 1.55 }}>
          {d.body.length > 100 ? d.body.slice(0, 100) + "…" : d.body}
        </p>
      )}
      {item.type === "ticket" && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {d.category && <MetaPill>{d.category}</MetaPill>}
          {d.status && <StatusChip status={d.status} />}
        </div>
      )}
      {item.type === "event" && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <MetaPill>📅 {fmtDate(d.startAt)} · {fmtTime(d.startAt)}</MetaPill>
          {d.location && <MetaPill>📍 {d.location}</MetaPill>}
        </div>
      )}
    </motion.div>
  );
}

/* ─── Magnetic quick action (framer-motion magnetic pull) ─────── */
function MagneticQuickAction({ to, Icon, label, accent }) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 250, damping: 25 });
  const sy = useSpring(my, { stiffness: 250, damping: 25 });

  function onMove(e) {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - (r.left + r.width  / 2)) * .25);
    my.set((e.clientY - (r.top  + r.height / 2)) * .25);
  }
  function onLeave() { mx.set(0); my.set(0); }

  return (
    <Link to={to} className="dp-qa-tile" onMouseMove={onMove} onMouseLeave={onLeave} style={{ textDecoration: "none" }}>
      <motion.div style={{ x: sx, y: sy, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <motion.div
          whileHover={{ scale: 1.18, rotate: 8 }}
          transition={{ type: "spring", stiffness: 300, damping: 18 }}
          style={{
            width: 44, height: 44, borderRadius: 13,
            background: `${accent}15`, border: `1.5px solid ${accent}30`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <Icon size={19} style={{ color: accent }} />
        </motion.div>
        <span style={{ fontSize: ".73rem", fontWeight: 700, color: T.text2, textAlign: "center", lineHeight: 1.3 }}>
          {label}
        </span>
      </motion.div>
    </Link>
  );
}

/* ─── Timeline event (matches landing page's event card style) ── */
function TimelineEvent({ event, index, isLast }) {
  const now = new Date();
  const diff = Math.floor((new Date(event.startAt) - now) / 86400000);
  const isSoon = diff >= 0 && diff <= 2;

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * .1, duration: .4, ease: [.22, 1, .36, 1] }}
      style={{ display: "flex", gap: 0 }}
    >
      {/* Spine */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 22, flexShrink: 0, marginRight: 12 }}>
        <div style={{
          width: 10, height: 10, borderRadius: "50%", marginTop: 6,
          background: isSoon ? T.blue : T.border2,
          border: `2px solid ${isSoon ? T.blue : T.border}`,
          boxShadow: isSoon ? `0 0 10px ${T.blue}55` : "none",
          animation: isSoon ? "dp-live 2s ease-in-out infinite" : "none",
          flexShrink: 0,
        }} />
        {!isLast && (
          <div className="dp-tl-line" style={{ flex: 1, minHeight: 26, marginTop: 4 }} />
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, paddingBottom: isLast ? 0 : 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
            background: isSoon ? T.blueL : T.bgSubtle2,
            border: `1px solid ${isSoon ? "rgba(37,99,235,.25)" : T.border}`,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: ".95rem", fontWeight: 800, lineHeight: 1, color: isSoon ? T.blue : T.text }}>
              {fmtDay(event.startAt)}
            </span>
            <span style={{ fontSize: ".5rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: isSoon ? T.blue : T.text3 }}>
              {fmtMonth(event.startAt)}
            </span>
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: ".86rem", fontWeight: 700, color: T.text, margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {event.title}
            </p>
            <p style={{ fontSize: ".7rem", color: T.text2, margin: 0 }}>
              {event.location ? `📍 ${event.location} · ` : ""}{fmtTime(event.startAt)}
              {isSoon && (
                <span style={{ marginLeft: 6, background: T.blueL, color: T.blue, padding: "1px 7px", borderRadius: 100, fontSize: ".6rem", fontWeight: 700 }}>
                  {diff === 0 ? "Today!" : "Tomorrow"}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Booking row ─────────────────────────────────────────────── */
const BK_CFG = {
  approved: { bg: T.greenL,  color: T.green,  border: "rgba(22,163,74,.25)"  },
  pending:  { bg: T.amberL,  color: T.amber,  border: "rgba(217,119,6,.25)"  },
  rejected: { bg: T.redL,    color: T.red,    border: "rgba(220,38,38,.25)"  },
};

function BookingRow({ b, index }) {
  const s = BK_CFG[b.status] || BK_CFG.pending;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * .08, duration: .35 }}
      className="dp-booking"
    >
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: ".85rem", fontWeight: 700, color: T.text, margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {b.amenityName}
        </p>
        <p style={{ fontSize: ".7rem", color: T.text2, margin: 0 }}>
          {b.date} · {b.startTime}–{b.endTime}
        </p>
      </div>
      <span style={{
        padding: "3px 9px", borderRadius: 100, flexShrink: 0,
        fontSize: ".62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em",
        background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      }}>
        {b.status}
      </span>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════════════════════════════ */
export function DashboardPage() {
  const { token, user, membership } = useAuth();

  if (user?.role === "security") return <SecurityDashboard />;

  const isAdmin    = ["committee", "super_admin"].includes(user?.role);
  const isResident = user?.role === "resident";

  /* ── State ── */
  const [announcements,    setAnnouncements]    = useState([]);
  const [tickets,          setTickets]          = useState([]);
  const [events,           setEvents]           = useState([]);
  const [bookings,         setBookings]         = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [visitorRequests,  setVisitorRequests]  = useState([]);
  const [respondingId,     setRespondingId]     = useState(null);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState("");

  /* ── Data load ── */
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

      const results = await Promise.allSettled(calls);
      const get = r => r.status === "fulfilled" ? r.value : null;
      setAnnouncements(get(results[0])?.items || []);
      setTickets(get(results[1])?.items || []);
      setEvents(get(results[2])?.items || []);
      setBookings(get(results[3])?.items || []);
      if (isAdmin)    setPendingApprovals((get(results[4])?.items || []).length);
      if (isResident) setVisitorRequests(get(results[isAdmin ? 5 : 4])?.items || []);
      const failed = results.filter(r => r.status === "rejected");
      if (failed.length) setError(`${failed.length} section(s) failed to load — showing partial data`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, isAdmin, isResident]);

  useEffect(() => { load(); }, [load]);

  /* ── Socket ── */
  useEffect(() => {
    if (!isResident) return;
    const socket = getSocket();
    const onIncoming = ({ visitor }) =>
      setVisitorRequests(prev => [visitor, ...prev.filter(v => v._id !== visitor._id)]);
    socket.on("visitor:request_incoming", onIncoming);
    return () => socket.off("visitor:request_incoming", onIncoming);
  }, [isResident]);

  /* ── Visitor respond ── */
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

  /* ── Derived ── */
  const userId         = user?._id || user?.id || "";
  const { word, first } = greeting(user?.fullName);
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

  /* ── Spinner for submit buttons ── */
  const Spinner = (
    <span style={{ width: 13, height: 13, border: "2px solid rgba(255,255,255,.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "dp-spin .7s linear infinite", display: "inline-block" }} />
  );

  return (
    <>
      <style>{CSS}</style>

      <div className="dp-root dp-dot-grid" style={{ position: "relative" }}>

        {/* ── Ambient orb — top right (matches landing page) ── */}
        <div style={{
          position: "fixed", width: 700, height: 700, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(37,99,235,.07) 0%, transparent 65%)",
          top: -250, right: -150, pointerEvents: "none", zIndex: 0,
        }} />
        <div style={{
          position: "fixed", width: 450, height: 450, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124,58,237,.04) 0%, transparent 65%)",
          bottom: -100, left: -100, pointerEvents: "none", zIndex: 0,
        }} />

        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px 80px", position: "relative", zIndex: 1 }}>

          {/* ── Error ── */}
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              style={{
                display: "flex", alignItems: "center", gap: 12, marginBottom: 20,
                background: T.redL, border: `1px solid rgba(220,38,38,.25)`,
                borderRadius: 14, padding: "13px 18px",
                fontSize: ".87rem", color: T.red,
              }}>
              <XCircle size={16} /> {error}
            </motion.div>
          )}

          {/* ══ HERO ══════════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: .65, ease: [.22, 1, .36, 1] }}
            className="dp-card"
            style={{
              position: "relative", overflow: "hidden",
              marginBottom: 16,
              padding: "36px 40px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: 24,
              /* Subtle blue gradient inside card */
              background: "linear-gradient(135deg, #ffffff 0%, #F0F5FF 100%)",
              boxShadow: T.sh3,
            }}
          >
            {/* Scan line */}
            <div className="dp-hero-scan" />

            {/* Blue top accent bar */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 4,
              background: `linear-gradient(90deg, ${T.blue}, #7C3AED)`,
              borderRadius: "20px 20px 0 0",
            }} />

            {/* LEFT */}
            <div style={{ position: "relative", zIndex: 3 }}>
              {/* Top row: live badge + date */}
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: .15, duration: .4 }}
                style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}
              >
                <LiveDot label="APTHIVE LIVE" />
                <span style={{ fontSize: ".72rem", fontWeight: 500, color: T.text3 }}>
                  {today}
                </span>
              </motion.div>

              {/* Greeting */}
              <motion.div
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: .22, duration: .55, ease: [.22, 1, .36, 1] }}
              >
                <p style={{ fontSize: ".9rem", fontWeight: 600, color: T.text2, marginBottom: 4 }}>
                  Good {word},
                </p>
                <h1 style={{ fontSize: "clamp(1.8rem,3.5vw,2.8rem)", fontWeight: 800, color: T.text, lineHeight: 1.08, letterSpacing: "-1.5px", marginBottom: 18 }}>
                  Welcome back,{" "}
                  <span style={{
                    background: `linear-gradient(90deg, ${T.blue} 0%, #7C3AED 50%, ${T.blue} 100%)`,
                    backgroundSize: "200% auto",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    animation: "dp-shimmer 3s linear infinite",
                  }}>
                    {first}.
                  </span>
                </h1>
              </motion.div>

              {/* Pills */}
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: .35, duration: .4 }}
                style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
              >
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "6px 14px", borderRadius: 100,
                  fontSize: ".75rem", fontWeight: 700,
                  background: T.blueL, border: `1px solid rgba(37,99,235,.25)`,
                  color: T.blue,
                }}>
                  <Shield size={12} />
                  {user?.role?.replace("_", " ")}
                </span>
                {flatLabel && (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "6px 14px", borderRadius: 100,
                    fontSize: ".75rem", fontWeight: 600,
                    background: T.bgSubtle2, border: `1px solid ${T.border}`,
                    color: T.text2,
                  }}>
                    🏠 {flatLabel}
                  </span>
                )}
                {/* Community pulse pill */}
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "6px 14px", borderRadius: 100,
                  fontSize: ".75rem", fontWeight: 600,
                  background: T.greenL, border: `1px solid rgba(22,163,74,.25)`,
                  color: T.green,
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.green, display: "inline-block", animation: "dp-live 1.6s ease-in-out infinite" }} />
                  Gate Secured
                </span>
              </motion.div>
            </div>

            {/* RIGHT: Mini window grid — references login page's apartment scene */}
            <motion.div
              className="dp-hero-right"
              initial={{ opacity: 0, scale: .88, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: .45, duration: .6, ease: [.22, 1, .36, 1] }}
              style={{ animation: "dp-float2 6s ease-in-out infinite", flexShrink: 0 }}
            >
              <div style={{
                background: "#0B1426",
                border: "1px solid rgba(37,99,235,.2)",
                borderRadius: 18, padding: "16px 18px",
                boxShadow: T.sh3,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.green, animation: "dp-live 1.6s ease-in-out infinite" }} />
                  <p style={{ fontSize: ".62rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(255,255,255,.5)", margin: 0 }}>
                    Green Heights
                  </p>
                </div>
                <MiniWindowGrid />
                <div style={{
                  marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "6px 8px", borderRadius: 8,
                  background: "rgba(37,99,235,.15)", border: "1px solid rgba(37,99,235,.25)",
                }}>
                  <span style={{ fontSize: ".58rem", color: "rgba(255,255,255,.6)", fontWeight: 500 }}>Residents online</span>
                  <span style={{ fontSize: ".72rem", color: "#93C5FD", fontWeight: 800 }}>248</span>
                </div>
              </div>
            </motion.div>

            {/* Sync button */}
            <button onClick={load} disabled={loading} className="dp-sync"
              style={{ position: "absolute", top: 20, right: 24, zIndex: 4 }}>
              <RefreshCw size={12} style={{ animation: loading ? "dp-spin 1s linear infinite" : "none" }} />
              Sync
            </button>
          </motion.div>

          {/* ══ STATS ═════════════════════════════════════════════ */}
          <div className="dp-stats" style={{ display: "flex", gap: 12, marginBottom: 14 }}>
            <StatCard label="Notices"      value={announcements.length}  accent={T.blue}   icon={Bell}         loading={loading} delay={80}  seed={1} />
            <StatCard label="Open Tickets" value={openTickets.length}    accent={T.red}    icon={Ticket}       loading={loading} delay={140} seed={2} />
            <StatCard label="Events"       value={upcomingEvents.length} accent={T.green}  icon={CalendarDays} loading={loading} delay={200} seed={3} />
            <StatCard label="Bookings"     value={myBookings.length}     accent={T.amber}  icon={BookOpen}     loading={loading} delay={260} seed={4} />
          </div>

          {/* ══ ADMIN ALERT ═══════════════════════════════════════ */}
          {isAdmin && pendingApprovals > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .3 }}>
              <Link to="/admin/approvals" style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
                background: T.amberL, border: `1px solid rgba(217,119,6,.3)`,
                borderRadius: 14, padding: "14px 20px", marginBottom: 14,
                textDecoration: "none",
                boxShadow: T.sh,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(217,119,6,.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                    ⚠️
                  </div>
                  <div>
                    <p style={{ fontSize: ".88rem", fontWeight: 700, color: T.amber, margin: "0 0 2px" }}>
                      {pendingApprovals} membership {pendingApprovals === 1 ? "request" : "requests"} pending
                    </p>
                    <p style={{ fontSize: ".75rem", color: "rgba(217,119,6,.7)", margin: 0 }}>
                      Action required to approve new residents
                    </p>
                  </div>
                </div>
                <ArrowRight size={16} style={{ color: T.amber, flexShrink: 0 }} />
              </Link>
            </motion.div>
          )}

          {/* ══ MAIN GRID ══════════════════════════════════════════ */}
          <div className="dp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 14 }}>

            {/* ── LEFT: Activity Feed ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: .12, duration: .55, ease: [.22, 1, .36, 1] }}
            >
              <div className="dp-card" style={{ padding: 24 }}>
                <SectionHeader
                  eyebrow="Live Updates"
                  title="Recent Activity"
                  linkTo="/announcements"
                  linkLabel="View all"
                  live={true}
                />
                {loading ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[...Array(4)].map((_, i) => (
                      <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8, padding: "14px 0", borderBottom: `1px solid ${T.border}` }}>
                        <Sk style={{ height: 13, width: "28%" }} />
                        <Sk style={{ height: 16, width: "65%" }} />
                        <Sk style={{ height: 11, width: "45%" }} />
                      </div>
                    ))}
                  </div>
                ) : feed.length === 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "52px 0", textAlign: "center" }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: 15,
                      background: T.blueL, border: `1px solid rgba(37,99,235,.2)`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 22, marginBottom: 12,
                    }}>
                      🔔
                    </div>
                    <p style={{ fontSize: ".92rem", fontWeight: 700, color: T.text, margin: "0 0 4px" }}>All caught up</p>
                    <p style={{ fontSize: ".8rem", color: T.text2, margin: 0 }}>No new activity in your community.</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {feed.map((item, i) => (
                      <FeedItem
                        key={`${item.type}-${item.data._id}-${i}`}
                        item={item}
                        isLast={i === feed.length - 1}
                        index={i}
                      />
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </motion.div>

            {/* ── RIGHT column ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Visitor requests */}
              {isResident && visitorRequests.length > 0 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .18, duration: .5 }}>
                  <div
                    className="dp-visitor-card dp-card"
                    style={{ padding: 20, background: T.redL, border: `1px solid rgba(220,38,38,.25)` }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <PulseRing color={T.red} />
                      <p style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: T.red, margin: 0 }}>
                        Action Required
                      </p>
                    </div>
                    <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: T.text, margin: "0 0 14px" }}>
                      Visitor at Gate
                    </h3>
                    <AnimatePresence>
                      {visitorRequests.map(v => (
                        <motion.div
                          key={v._id}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: .35 }}
                          style={{
                            background: T.bgCard, border: `1px solid ${T.border}`,
                            borderRadius: 14, padding: 14, marginBottom: 10,
                            boxShadow: T.sh,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                            <div style={{
                              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                              background: T.redL, border: `1px solid rgba(220,38,38,.2)`,
                              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
                            }}>
                              👤
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <p style={{ fontSize: ".87rem", fontWeight: 700, color: T.text, margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {v.visitorName}
                              </p>
                              <p style={{ fontSize: ".7rem", color: T.text2, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {v.purpose}{v.visitorPhone ? ` · ${v.visitorPhone}` : ""}
                              </p>
                            </div>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                            <button
                              onClick={() => respondToVisitor(v._id, "rejected")}
                              disabled={respondingId === v._id}
                              style={{
                                minHeight: 40, borderRadius: 10, fontSize: ".78rem", fontWeight: 700,
                                background: T.redL, color: T.red, border: `1px solid rgba(220,38,38,.3)`,
                                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                                opacity: respondingId === v._id ? .5 : 1,
                                transition: "background .2s",
                                fontFamily: "'Plus Jakarta Sans', sans-serif",
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = "rgba(220,38,38,.2)"}
                              onMouseLeave={e => e.currentTarget.style.background = T.redL}
                            >
                              {respondingId === v._id ? Spinner : <><XCircle size={13}/> Reject</>}
                            </button>
                            <button
                              onClick={() => respondToVisitor(v._id, "approved")}
                              disabled={respondingId === v._id}
                              style={{
                                minHeight: 40, borderRadius: 10, fontSize: ".78rem", fontWeight: 700,
                                background: T.green, color: "#fff", border: "none",
                                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                                opacity: respondingId === v._id ? .5 : 1,
                                boxShadow: "0 4px 12px rgba(22,163,74,.3)",
                                transition: "background .2s, box-shadow .2s",
                                fontFamily: "'Plus Jakarta Sans', sans-serif",
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = "#15803D"; e.currentTarget.style.boxShadow = "0 6px 18px rgba(22,163,74,.4)"; }}
                              onMouseLeave={e => { e.currentTarget.style.background = T.green; e.currentTarget.style.boxShadow = "0 4px 12px rgba(22,163,74,.3)"; }}
                            >
                              {respondingId === v._id ? Spinner : <><CheckCircle size={13}/> Approve</>}
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}

              {/* Quick Actions */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .2, duration: .5 }}>
                <div className="dp-card" style={{ padding: 24 }}>
                  <SectionHeader eyebrow="Shortcuts" title="Quick Actions" />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <MagneticQuickAction to="/tickets"         Icon={Plus}     label="Raise Ticket"    accent={T.blue}   />
                    <MagneticQuickAction to="/amenities"       Icon={BookOpen} label="Book Amenity"    accent={T.green}  />
                    <MagneticQuickAction to="/visitors/prereg" Icon={Users}    label="Pre-reg Visitor" accent={T.amber}  />
                    <MagneticQuickAction to="/polls"           Icon={Zap}      label="View Polls"      accent={T.purple} />
                  </div>
                </div>
              </motion.div>

              {/* Upcoming Events */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .26, duration: .5 }}>
                <div className="dp-card" style={{ padding: 24 }}>
                  <SectionHeader eyebrow="Schedule" title="Upcoming" linkTo="/events" linkLabel="See all" />
                  {loading ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <Sk style={{ height: 58 }} />
                      <Sk style={{ height: 58 }} />
                    </div>
                  ) : upcomingEvents.length === 0 ? (
                    <div style={{
                      borderRadius: 12, border: `1.5px dashed ${T.border}`,
                      background: T.bgSubtle2, padding: "22px 16px", textAlign: "center",
                      fontSize: ".82rem", color: T.text3, fontWeight: 500,
                    }}>
                      No upcoming events yet.
                    </div>
                  ) : (
                    <div style={{ paddingLeft: 2 }}>
                      {upcomingEvents.slice(0, 3).map((e, i) => (
                        <TimelineEvent
                          key={e._id} event={e} index={i}
                          isLast={i === Math.min(upcomingEvents.length, 3) - 1}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>

              {/* My Bookings */}
              {!loading && myBookings.length > 0 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .32, duration: .5 }}>
                  <div className="dp-card" style={{ padding: 24 }}>
                    <SectionHeader eyebrow="Reservations" title="My Bookings" linkTo="/amenities" linkLabel="Manage" />
                    {myBookings.map((b, i) => <BookingRow key={b._id} b={b} index={i} />)}
                  </div>
                </motion.div>
              )}

              {/* Admin workspace */}
              {isAdmin && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .36, duration: .5 }}>
                  <div className="dp-card" style={{ padding: 22, overflow: "hidden", position: "relative" }}>
                    {/* Blue top accent */}
                    <div style={{
                      position: "absolute", top: 0, left: 0, right: 0, height: 3,
                      background: `linear-gradient(90deg, ${T.blue}, ${T.purple})`,
                      borderRadius: "20px 20px 0 0",
                    }} />
                    {/* Ambient bg orb */}
                    <div style={{
                      position: "absolute", top: -40, right: -40, width: 140, height: 140,
                      borderRadius: "50%",
                      background: `radial-gradient(circle, rgba(37,99,235,.06) 0%, transparent 70%)`,
                      pointerEvents: "none",
                    }} />
                    <p style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: T.blue, marginBottom: 3, position: "relative" }}>
                      Admin
                    </p>
                    <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: T.text, margin: "0 0 16px", position: "relative" }}>
                      Workspace
                    </h3>
                    <div style={{ position: "relative", zIndex: 1 }}>
                      {[
                        { to: "/admin/approvals",     emoji: "👥", label: "Pending Approvals", badge: pendingApprovals > 0 ? pendingApprovals : null },
                        { to: "/admin/society-setup", emoji: "⚙️", label: "Society Setup" },
                      ].map(({ to, emoji, label, badge }) => (
                        <Link key={to} to={to} className="dp-admin-link">
                          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: ".85rem", fontWeight: 600, color: T.text2 }}>
                            <span style={{ fontSize: "1rem" }}>{emoji}</span> {label}
                          </div>
                          {badge ? (
                            <span style={{
                              background: T.blueL, color: T.blue,
                              border: `1px solid rgba(37,99,235,.3)`,
                              padding: "2px 9px", borderRadius: 100,
                              fontSize: ".7rem", fontWeight: 700,
                            }}>
                              {badge}
                            </span>
                          ) : (
                            <ChevronRight size={14} style={{ color: T.text3 }} />
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
