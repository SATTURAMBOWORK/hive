import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../components/api";
import { useAuth } from "../components/AuthContext";
import { MapPin, Clock, Plus, RefreshCw, CalendarDays, Users2, ChevronRight } from "lucide-react";

/* ─── Cover images ───────────────────────────────────────────── */
const COVERS = [
  "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=700&q=80",
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=700&q=80",
  "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=700&q=80",
  "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=700&q=80",
  "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=700&q=80",
  "https://images.unsplash.com/photo-1493836512294-502baa1986e2?w=700&q=80",
  "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=700&q=80",
  "https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=700&q=80",
];
function coverFor(id) {
  const h = (id || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return COVERS[h % COVERS.length];
}

/* ─── Helpers ────────────────────────────────────────────────── */
function fmtTime(d) {
  if (!d) return "";
  return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}
function fmtDay(d)   { return new Date(d).toLocaleDateString("en-IN", { day: "numeric" }); }
function fmtMonth(d) { return new Date(d).toLocaleDateString("en-IN", { month: "short" }); }
function fmtFull(d) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long" });
}
function inNextDays(d, days) {
  const ms = new Date(d).getTime() - Date.now();
  return ms > 0 && ms <= days * 24 * 60 * 60 * 1000;
}
function timeUntil(d) {
  const ms = new Date(d) - Date.now();
  if (ms <= 0) return null;
  const hrs  = Math.floor(ms / 3_600_000);
  const days = Math.floor(ms / 86_400_000);
  if (hrs < 3)    return "Starting soon";
  if (hrs < 24)   return "Today";
  if (days === 1) return "Tomorrow";
  if (days < 7)   return `In ${days} days`;
  return `In ${Math.ceil(days / 7)}w`;
}
function ribbonColor(label) {
  if (!label) return null;
  if (label === "Starting soon" || label === "Today")
    return { bg: "rgba(22,163,74,0.88)", text: "#fff" };
  if (label === "Tomorrow")
    return { bg: "rgba(232,137,12,0.88)", text: "#fff" };
  return { bg: "rgba(0,0,0,0.45)", text: "rgba(255,255,255,0.85)" };
}

const RSVP_OPTS = [
  { key: "going",     label: "Going"    },
  { key: "maybe",     label: "Maybe"    },
  { key: "not_going", label: "Can't go" },
];

const T = {
  bg: "#F7F9FF",
  surface: "#FFFFFF",
  border: "#DCE5F3",
  borderHover: "#D1D5DB",
  ink: "#111827",
  text2: "#6B7280",
  text3: "#9CA3AF",
  blue: "#2563EB",
  blueLight: "#EFF6FF",
  blueBorder: "#BFDBFE",
  green: "#16A34A",
  greenLight: "#DCFCE7",
  greenBorder: "#BBF7D0",
  amber: "#E8890C",
  amberH: "#C97508",
  amberLight: "#FFF8F0",
  amberBorder: "#FDECC8",
  red: "#DC2626",
  redLight: "#FEE2E2",
  redBorder: "#FECACA",
};

/* ─── CSS ────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap');

  .ev-root * { box-sizing: border-box; }

  .ev-root {
    font-family: 'Manrope', sans-serif;
    background:
      radial-gradient(900px 380px at 85% -12%, rgba(37,99,235,0.11), transparent 64%),
      radial-gradient(760px 340px at -10% 0%, rgba(232,137,12,0.10), transparent 68%),
      ${T.bg};
    min-height: calc(100vh - 64px);
    padding: 22px 20px 70px;
    position: relative;
  }

  .ev-root::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image:
      linear-gradient(to right, rgba(148,163,184,0.11) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(148,163,184,0.11) 1px, transparent 1px);
    background-size: 40px 40px;
    mask-image: radial-gradient(circle at 20% 10%, rgba(0,0,0,0.9), transparent 72%);
  }

  .ev-content {
    position: relative;
    z-index: 1;
    max-width: 1120px;
    margin: 0 auto;
  }

  .ev-display { font-family: 'Cormorant Garamond', serif; }

  /* ── Hero Panel ── */
  .ev-hero {
    border: 1px solid #D8E3F5;
    border-radius: 24px;
    background: linear-gradient(140deg, rgba(255,255,255,0.96), rgba(243,247,255,0.95));
    box-shadow: 0 24px 50px rgba(17,24,39,0.09);
    padding: 20px;
    display: grid;
    grid-template-columns: 1.2fr 0.8fr;
    gap: 16px;
    margin-bottom: 18px;
    overflow: hidden;
    position: relative;
  }

  .ev-hero::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(120deg, rgba(255,255,255,0) 38%, rgba(255,255,255,0.34) 52%, rgba(255,255,255,0) 66%);
    transform: translateX(-130%);
    animation: ev-sheen 4.6s ease-in-out infinite;
  }

  @keyframes ev-sheen {
    0%, 40% { transform: translateX(-130%); }
    60%, 100% { transform: translateX(130%); }
  }

  .ev-hero-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(2rem, 4vw, 2.8rem);
    font-weight: 700;
    color: ${T.ink};
    line-height: 1;
    margin: 0 0 8px;
    letter-spacing: -0.5px;
  }

  .ev-hero-sub {
    color: ${T.text2};
    font-size: 0.88rem;
    line-height: 1.65;
    max-width: 52ch;
    margin-bottom: 16px;
  }

  .ev-hero-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  /* ── Stat boxes ── */
  .ev-stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    align-content: start;
  }

  .ev-stat-box {
    border: 1px solid #D8E3F5;
    border-radius: 14px;
    padding: 12px 14px;
    background: #FFFFFF;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .ev-stat-box:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(17,24,39,0.08);
  }

  .ev-stat-num {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.65rem;
    font-weight: 700;
    line-height: 1;
    color: ${T.ink};
  }

  .ev-stat-num.hi { color: ${T.amber}; }

  .ev-stat-lbl {
    margin-top: 4px;
    font-size: 0.62rem;
    font-weight: 700;
    color: ${T.text3};
    text-transform: uppercase;
    letter-spacing: 0.13em;
  }

  /* ── Buttons ── */
  .ev-btn-primary {
    position: relative;
    isolation: isolate;
    overflow: hidden;
    border: none;
    border-radius: 10px;
    padding: 10px 18px;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    background: linear-gradient(135deg, ${T.amber}, ${T.amberH});
    color: #FFFFFF;
    font-family: 'Manrope', sans-serif;
    font-size: 0.84rem;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(232,137,12,.25);
    transition: transform 0.2s, box-shadow 0.2s, filter 0.2s;
  }

  .ev-btn-primary::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(120deg, rgba(255,255,255,0) 36%, rgba(255,255,255,0.34) 52%, rgba(255,255,255,0) 68%);
    transform: translateX(-130%);
    transition: transform 0.5s ease;
    z-index: 0;
  }

  .ev-btn-primary > * { position: relative; z-index: 1; transition: transform 0.2s ease; }

  .ev-btn-primary:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(232,137,12,.32);
    filter: saturate(1.05);
  }

  .ev-btn-primary:hover:not(:disabled)::before { transform: translateX(130%); }
  .ev-btn-primary:hover:not(:disabled) svg { transform: translateX(1px); }
  .ev-btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }

  .ev-btn-soft {
    position: relative;
    overflow: hidden;
    border: 1px solid ${T.border};
    border-radius: 10px;
    padding: 9px 14px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #FFFFFF;
    color: ${T.text2};
    font-family: 'Manrope', sans-serif;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s, color 0.2s;
  }

  .ev-btn-soft::after {
    content: '';
    position: absolute;
    left: 8px; right: 8px; bottom: 0;
    height: 2px;
    border-radius: 999px;
    background: linear-gradient(90deg, ${T.blue}, ${T.amber});
    transform: scaleX(0.2);
    opacity: 0;
    transition: transform 0.22s ease, opacity 0.22s ease;
  }

  .ev-btn-soft:hover:not(:disabled) {
    border-color: ${T.borderHover};
    color: ${T.ink};
    transform: translateY(-1px);
    box-shadow: 0 8px 16px rgba(17,24,39,0.08);
  }

  .ev-btn-soft:hover:not(:disabled)::after { transform: scaleX(1); opacity: 1; }
  .ev-btn-soft:disabled { opacity: 0.5; cursor: not-allowed; }

  /* ── Section heading ── */
  .ev-sec-hd {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
  }

  /* ── Block container ── */
  .ev-block {
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 18px;
    padding: 18px;
    box-shadow: 0 10px 24px rgba(17,24,39,0.06);
    margin-bottom: 16px;
  }

  /* ── Event card grid ── */
  .ev-card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
    gap: 14px;
  }

  /* ── Event card ── */
  .ev-card {
    border: 1px solid #E2E8F0;
    border-radius: 18px;
    background: #FFFFFF;
    overflow: hidden;
    box-shadow: 0 8px 20px rgba(17,24,39,0.06);
    transition: transform 0.22s cubic-bezier(0.22,1,0.36,1), box-shadow 0.22s, border-color 0.22s;
    position: relative;
  }

  .ev-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 18px 36px rgba(17,24,39,0.13);
    border-color: ${T.borderHover};
  }

  .ev-card-topbar {
    height: 3px;
    background: linear-gradient(90deg, ${T.amber}, ${T.amberH});
  }

  .ev-card-topbar.past {
    background: linear-gradient(90deg, ${T.text3}, #D1D5DB);
  }

  .ev-card-cover {
    width: 100%;
    height: 148px;
    object-fit: cover;
    display: block;
    transition: transform 0.55s cubic-bezier(0.22,1,0.36,1);
  }

  .ev-card:hover .ev-card-cover { transform: scale(1.05); }

  .ev-card-cover-wrap {
    overflow: hidden;
    position: relative;
  }

  .ev-card-cover-wrap::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.15) 100%);
    pointer-events: none;
  }

  .ev-card-body {
    padding: 14px 16px 16px;
  }

  /* Date badge */
  .ev-date-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 999px;
    background: ${T.amberLight};
    border: 1px solid ${T.amberBorder};
    margin-bottom: 10px;
  }

  .ev-date-badge-day {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.1rem;
    font-weight: 700;
    color: ${T.amber};
    line-height: 1;
  }

  .ev-date-badge-sep {
    width: 1px;
    height: 12px;
    background: ${T.amberBorder};
  }

  .ev-date-badge-mon {
    font-size: 0.62rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: ${T.amberH};
  }

  /* Time ribbon on past cards */
  .ev-ribbon-pill {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 2;
    padding: 4px 10px;
    border-radius: 100px;
    font-size: 0.6rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }

  .ev-card-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.18rem;
    font-weight: 700;
    color: ${T.ink};
    margin: 0 0 8px;
    line-height: 1.25;
    transition: color 0.2s;
  }

  .ev-card:hover .ev-card-title { color: ${T.amber}; }

  .ev-card-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.72rem;
    color: ${T.text3};
    font-weight: 500;
    margin-bottom: 4px;
  }

  /* RSVP drawer */
  .ev-card-rsvp {
    max-height: 0;
    overflow: hidden;
    opacity: 0;
    transition:
      max-height 0.42s cubic-bezier(0.22,1,0.36,1),
      opacity 0.28s ease,
      margin-top 0.3s ease;
    margin-top: 0;
  }

  .ev-card:hover .ev-card-rsvp {
    max-height: 80px;
    opacity: 1;
    margin-top: 12px;
  }

  .ev-rsvp-row { display: flex; gap: 6px; }

  .ev-rsvp-btn {
    flex: 1;
    padding: 7px 4px;
    border-radius: 8px;
    border: 1px solid ${T.border};
    background: ${T.bg};
    color: ${T.text2};
    font-family: 'Manrope', sans-serif;
    font-size: 0.68rem;
    font-weight: 700;
    cursor: pointer;
    text-align: center;
    transition: background 0.18s, border-color 0.18s, color 0.18s, transform 0.14s;
  }

  .ev-rsvp-btn:hover {
    border-color: ${T.borderHover};
    color: ${T.ink};
    transform: translateY(-1px);
  }

  .ev-rsvp-btn.going-active    { background: ${T.greenLight}; border-color: ${T.greenBorder}; color: ${T.green}; }
  .ev-rsvp-btn.maybe-active    { background: ${T.amberLight}; border-color: ${T.amberBorder}; color: ${T.amberH}; }
  .ev-rsvp-btn.not_going-active { background: ${T.redLight}; border-color: ${T.redBorder}; color: ${T.red}; }

  /* Past badge overlay */
  .ev-past-overlay {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 2;
    padding: 4px 10px;
    border-radius: 100px;
    font-size: 0.6rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    background: rgba(255,255,255,0.9);
    border: 1px solid #E2E8F0;
    color: ${T.text3};
    backdrop-filter: blur(6px);
  }

  /* Past card dimmed */
  .ev-card.past { opacity: 0.72; }
  .ev-card.past:hover { opacity: 0.9; }
  .ev-card.past .ev-card-cover { filter: grayscale(0.4) brightness(0.9); }
  .ev-card.past .ev-date-badge { background: #F1F5F9; border-color: #E2E8F0; }
  .ev-card.past .ev-date-badge-day { color: ${T.text3}; }
  .ev-card.past .ev-date-badge-mon { color: ${T.text3}; }

  /* ── Past events list ── */
  .ev-past-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .ev-past-row {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px 16px;
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 12px;
    transition: border-color 0.2s, box-shadow 0.18s, transform 0.2s;
  }

  .ev-past-row:hover {
    border-color: ${T.borderHover};
    box-shadow: 0 6px 18px rgba(17,24,39,0.08);
    transform: translateX(5px);
  }

  .ev-past-date {
    flex-shrink: 0;
    width: 38px;
    text-align: center;
  }

  .ev-past-day {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.3rem;
    font-weight: 700;
    color: #D1D5DB;
    line-height: 1;
  }

  .ev-past-mon {
    font-size: 0.5rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #D1D5DB;
  }

  .ev-past-vr {
    width: 1px;
    height: 30px;
    background: ${T.border};
    flex-shrink: 0;
  }

  .ev-past-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.05rem;
    font-weight: 600;
    color: ${T.text2};
    margin: 0;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ev-past-meta {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 0.7rem;
    color: ${T.text3};
    flex-shrink: 0;
  }

  /* ── Create form ── */
  .ev-form-wrap {
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 12px 32px rgba(17,24,39,0.08);
    animation: evFormIn 0.32s cubic-bezier(0.22,1,0.36,1) forwards;
    margin-bottom: 18px;
  }

  @keyframes evFormIn {
    from { opacity: 0; transform: translateY(-10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .ev-form-body { padding: 22px 24px 24px; }

  .ev-input {
    width: 100%;
    background: ${T.bg};
    border: 1px solid ${T.border};
    border-radius: 10px;
    padding: 11px 14px;
    color: ${T.ink};
    font-family: 'Manrope', sans-serif;
    font-size: 0.875rem;
    outline: none;
    resize: vertical;
    transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
  }

  .ev-input::placeholder { color: ${T.text3}; }

  .ev-input:focus {
    background: #FFFFFF;
    border-color: ${T.borderHover};
    box-shadow: 0 0 0 3px rgba(232,137,12,0.1);
  }

  input[type="datetime-local"].ev-input::-webkit-calendar-picker-indicator {
    opacity: 0.5; cursor: pointer;
  }

  /* ── Skeleton ── */
  @keyframes skShimmer {
    0%   { background-position:  200% center; }
    100% { background-position: -200% center; }
  }

  .ev-sk {
    background: linear-gradient(90deg, #F0F4FF 25%, #E4ECFF 50%, #F0F4FF 75%);
    background-size: 200% 100%;
    animation: skShimmer 1.6s ease-in-out infinite;
    border-radius: 18px;
  }

  /* ── Entrance animations ── */
  @keyframes evFadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .ev-enter {
    opacity: 0;
    animation: evFadeUp 0.48s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  @keyframes todayPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(22,163,74,0.45); }
    50%       { box-shadow: 0 0 0 5px rgba(22,163,74,0); }
  }

  /* ── Toolbar ── */
  .ev-toolbar {
    position: sticky;
    top: 64px;
    z-index: 10;
    margin-bottom: 16px;
    border: 1px solid #DAE4F6;
    border-radius: 16px;
    padding: 10px 14px;
    background: rgba(255,255,255,0.88);
    backdrop-filter: blur(12px);
    box-shadow: 0 12px 26px rgba(17,24,39,0.08);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .ev-filter-row {
    display: flex;
    gap: 7px;
    flex-wrap: wrap;
  }

  .ev-chip {
    border: 1px solid ${T.border};
    border-radius: 999px;
    padding: 6px 13px;
    background: #FFFFFF;
    color: ${T.text2};
    font-family: 'Manrope', sans-serif;
    font-size: 0.74rem;
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.16s, border-color 0.16s, color 0.16s, box-shadow 0.16s;
    white-space: nowrap;
  }

  .ev-chip:hover {
    border-color: ${T.borderHover};
    color: ${T.ink};
    transform: translateY(-1px);
    box-shadow: 0 6px 14px rgba(17,24,39,0.07);
  }

  .ev-chip.active {
    border-color: ${T.amber};
    color: #FFFFFF;
    background: linear-gradient(135deg, ${T.amber}, ${T.amberH});
    box-shadow: 0 8px 18px rgba(232,137,12,0.28);
  }
`;

/* ─── Skeleton card ──────────────────────────────────────────── */
function SkCard() {
  return (
    <div className="ev-card" style={{ overflow: "hidden" }}>
      <div className="ev-sk" style={{ height: 3, borderRadius: 0 }} />
      <div className="ev-sk" style={{ height: 148, borderRadius: 0 }} />
      <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        <div className="ev-sk" style={{ height: 22, width: "55%", borderRadius: 999 }} />
        <div className="ev-sk" style={{ height: 18, width: "80%", borderRadius: 8 }} />
        <div className="ev-sk" style={{ height: 14, width: "60%", borderRadius: 8 }} />
      </div>
    </div>
  );
}

/* ─── Event card ─────────────────────────────────────────────── */
function EventCard({ item, rsvp, onRsvp, delay }) {
  const isPast  = new Date(item.startAt) < new Date();
  const ribbon  = !isPast ? timeUntil(item.startAt) : null;
  const rc      = ribbonColor(ribbon);
  const cover   = item.coverImage || coverFor(item._id);
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <article
      className={`ev-card ev-enter${isPast ? " past" : ""}`}
      style={{ animationDelay: delay }}
    >
      <div className={`ev-card-topbar${isPast ? " past" : ""}`} />

      {/* Cover image */}
      <div className="ev-card-cover-wrap">
        {!imgLoaded && (
          <div className="ev-sk" style={{ height: 148, borderRadius: 0 }} />
        )}
        <img
          src={cover}
          alt={item.title}
          className="ev-card-cover"
          style={{ display: imgLoaded ? "block" : "none" }}
          onLoad={() => setImgLoaded(true)}
        />

        {/* Time ribbon */}
        {ribbon && rc && (
          <div
            className="ev-ribbon-pill"
            style={{
              background: rc.bg,
              color: rc.text,
              animation: (ribbon === "Today" || ribbon === "Starting soon")
                ? "todayPulse 2s infinite" : "none",
            }}
          >
            {ribbon}
          </div>
        )}

        {/* Past overlay */}
        {isPast && (
          <div className="ev-past-overlay">Past Event</div>
        )}
      </div>

      {/* Card body */}
      <div className="ev-card-body">
        <div className="ev-date-badge">
          <span className="ev-date-badge-day">{fmtDay(item.startAt)}</span>
          <div className="ev-date-badge-sep" />
          <span className="ev-date-badge-mon">{fmtMonth(item.startAt)}</span>
        </div>

        <h3 className="ev-card-title">{item.title}</h3>

        <div className="ev-card-meta">
          <Clock size={11} color={T.text3} style={{ flexShrink: 0 }} />
          <span>{fmtTime(item.startAt)}{item.endAt ? ` – ${fmtTime(item.endAt)}` : ""}</span>
        </div>
        {item.location && (
          <div className="ev-card-meta">
            <MapPin size={11} color={T.text3} style={{ flexShrink: 0 }} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {item.location}
            </span>
          </div>
        )}

        {/* RSVP drawer — slides down on hover, only upcoming */}
        {!isPast && (
          <div className="ev-card-rsvp">
            <div className="ev-rsvp-row">
              {RSVP_OPTS.map(opt => (
                <button
                  key={opt.key}
                  className={`ev-rsvp-btn${rsvp === opt.key ? ` ${opt.key}-active` : ""}`}
                  onClick={() => onRsvp(item._id, opt.key)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

/* ═══════════════════════════════════════════════════════════════
   EVENTS PAGE
═══════════════════════════════════════════════════════════════ */
export function EventsPage() {
  const { token, user } = useAuth();
  const [items,       setItems]       = useState([]);
  const [title,       setTitle]       = useState("");
  const [description, setDesc]        = useState("");
  const [location,    setLocation]    = useState("Club House");
  const [startAt,     setStartAt]     = useState("");
  const [endAt,       setEndAt]       = useState("");
  const [error,       setError]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [submitting,  setSubmit]      = useState(false);
  const [showForm,    setShowForm]    = useState(false);
  const [rsvpMap,     setRsvpMap]     = useState({});
  const [filter,      setFilter]      = useState("upcoming");

  function handleRsvp(eventId, key) {
    setRsvpMap(prev => ({ ...prev, [eventId]: prev[eventId] === key ? null : key }));
  }

  const canCreate = useMemo(() =>
    ["committee", "super_admin"].includes(user?.role), [user?.role]);

  const upcoming = items
    .filter(e => new Date(e.startAt) >= new Date())
    .sort((a, b) => new Date(a.startAt) - new Date(b.startAt));

  const past = items
    .filter(e => new Date(e.startAt) < new Date())
    .sort((a, b) => new Date(b.startAt) - new Date(a.startAt));

  const stats = useMemo(() => {
    const soon = upcoming.filter(e => inNextDays(e.startAt, 7)).length;
    const venues = new Set(
      upcoming.map(e => (e.location || "").trim()).filter(Boolean).map(v => v.toLowerCase())
    ).size;
    return { totalUpcoming: upcoming.length, thisWeek: soon, locations: venues };
  }, [upcoming]);

  async function loadItems() {
    setLoading(true); setError("");
    try {
      const data = await apiRequest("/events", { token });
      setItems(data.items || []);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setSubmit(true); setError("");
    try {
      const data = await apiRequest("/events", {
        method: "POST", token,
        body: { title, description, location, startAt, endAt },
      });
      setItems(prev => [...prev, data.item]);
      setTitle(""); setDesc(""); setLocation("Club House"); setStartAt(""); setEndAt("");
      setShowForm(false);
    } catch (err) { setError(err.message); }
    finally { setSubmit(false); }
  }

  useEffect(() => { loadItems(); }, []);

  const displayItems = filter === "upcoming" ? upcoming : past;

  return (
    <>
      <style>{CSS}</style>
      <div className="ev-root">
        <div className="ev-content">

          {/* ── Hero Panel ── */}
          <div className="ev-hero ev-enter" style={{ animationDelay: "0ms" }}>
            <div>
              <h1 className="ev-hero-title">Community Events</h1>
              <p className="ev-hero-sub">
                Discover what's happening in your building — from festive celebrations
                to workshops and social mixers.
              </p>
              <div className="ev-hero-actions">
                {canCreate && (
                  <button className="ev-btn-primary" onClick={() => setShowForm(v => !v)}>
                    <Plus size={14} />
                    {showForm ? "Cancel" : "Create Event"}
                  </button>
                )}
                <button className="ev-btn-soft" onClick={loadItems} disabled={loading}>
                  <RefreshCw
                    size={13}
                    style={{ animation: loading ? "spin 1s linear infinite" : "none" }}
                  />
                  Refresh
                </button>
              </div>
            </div>

            {/* Stats grid */}
            <div className="ev-stats-grid">
              {[
                { num: stats.totalUpcoming, lbl: "Upcoming", hi: stats.totalUpcoming > 0 },
                { num: stats.thisWeek,      lbl: "This Week", hi: stats.thisWeek > 0 },
                { num: stats.locations,     lbl: "Venues",    hi: false },
                { num: past.length,         lbl: "Past",      hi: false },
              ].map(s => (
                <div key={s.lbl} className="ev-stat-box">
                  <div className={`ev-stat-num${s.hi ? " hi" : ""}`}>{s.num}</div>
                  <div className="ev-stat-lbl">{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Error ── */}
          {error && (
            <div style={{
              marginBottom: 14, padding: "11px 16px",
              background: T.redLight, border: `1px solid ${T.redBorder}`,
              borderRadius: 12, fontSize: "0.84rem", color: T.red,
              fontWeight: 500,
            }}>
              {error}
            </div>
          )}

          {/* ── Create form ── */}
          {canCreate && showForm && (
            <div className="ev-form-wrap ev-enter">
              <div style={{ height: 3, background: `linear-gradient(90deg, ${T.amber}, ${T.amberH})` }} />
              <div className="ev-form-body">
                <h2 className="ev-display" style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "1.5rem", fontWeight: 700,
                  color: T.ink, margin: "0 0 18px",
                }}>
                  Create Event
                </h2>
                <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <input
                    className="ev-input"
                    placeholder="Event title — e.g. Rooftop Diwali Celebration"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    required
                  />
                  <textarea
                    className="ev-input"
                    style={{ minHeight: 76 }}
                    placeholder="What should residents expect?"
                    value={description}
                    onChange={e => setDesc(e.target.value)}
                  />
                  <input
                    className="ev-input"
                    placeholder="Location — e.g. Club House, Rooftop, Pool Deck"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                  />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={{
                        display: "block",
                        fontFamily: "'Manrope', sans-serif",
                        fontSize: "0.63rem", fontWeight: 800, letterSpacing: "0.1em",
                        textTransform: "uppercase", color: T.text3, marginBottom: 6,
                      }}>Starts</label>
                      <input
                        className="ev-input"
                        type="datetime-local"
                        value={startAt}
                        onChange={e => setStartAt(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label style={{
                        display: "block",
                        fontFamily: "'Manrope', sans-serif",
                        fontSize: "0.63rem", fontWeight: 800, letterSpacing: "0.1em",
                        textTransform: "uppercase", color: T.text3, marginBottom: 6,
                      }}>Ends</label>
                      <input
                        className="ev-input"
                        type="datetime-local"
                        value={endAt}
                        onChange={e => setEndAt(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    <button className="ev-btn-primary" type="submit" disabled={submitting}>
                      {submitting ? "Creating…" : <><CalendarDays size={14} /> Create Event</>}
                    </button>
                    <button type="button" className="ev-btn-soft" onClick={() => setShowForm(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ── Toolbar ── */}
          <div className="ev-toolbar ev-enter" style={{ animationDelay: "40ms" }}>
            <div className="ev-filter-row">
              <button
                className={`ev-chip${filter === "upcoming" ? " active" : ""}`}
                onClick={() => setFilter("upcoming")}
              >
                Upcoming ({upcoming.length})
              </button>
              <button
                className={`ev-chip${filter === "past" ? " active" : ""}`}
                onClick={() => setFilter("past")}
              >
                Past ({past.length})
              </button>
            </div>
          </div>

          {/* ── Cards ── */}
          <div className="ev-block ev-enter" style={{ animationDelay: "60ms" }}>
            <div className="ev-sec-hd" style={{ marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: T.ink }}>
                {filter === "upcoming" ? "Upcoming Events" : "Past Events"}
              </h3>
              {displayItems.length > 0 && (
                <span style={{ fontSize: "0.65rem", color: T.text3, fontWeight: 700 }}>
                  {displayItems.length} event{displayItems.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {loading ? (
              <div className="ev-card-grid">
                {[0, 1, 2, 3].map(i => <SkCard key={i} />)}
              </div>
            ) : displayItems.length === 0 ? (
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                padding: "48px 24px", textAlign: "center",
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: T.amberLight, border: `1px solid ${T.amberBorder}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 14,
                }}>
                  <CalendarDays size={22} color={T.amber} strokeWidth={1.8} />
                </div>
                <p style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "1.3rem", fontWeight: 700,
                  color: T.text2, margin: "0 0 6px",
                }}>
                  {filter === "upcoming" ? "Nothing on the calendar yet." : "No past events yet."}
                </p>
                <p style={{ fontSize: "0.83rem", color: T.text3, margin: 0 }}>
                  {filter === "upcoming" && canCreate
                    ? "Create your first community event above."
                    : "Check back soon for upcoming events."}
                </p>
              </div>
            ) : (
              <div className="ev-card-grid">
                {displayItems.map((item, i) => (
                  <EventCard
                    key={item._id}
                    item={item}
                    rsvp={rsvpMap[item._id] || null}
                    onRsvp={handleRsvp}
                    delay={`${80 + i * 40}ms`}
                  />
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
