import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../components/api";
import { useAuth } from "../components/AuthContext";
import {
  CalendarDays, ChevronRight, Check, Clock, HelpCircle,
  MapPin, Plus, RefreshCw, X,
} from "lucide-react";

/* ─── Cover images ────────────────────────────────────────────── */
const COVERS = [
  "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80",
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80",
  "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80",
  "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80",
  "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80",
];

function coverFor(id) {
  const h = (id || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return COVERS[h % COVERS.length];
}
function thumbsFor(id) {
  const h = (id || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return COVERS.filter((_, i) => i !== h % COVERS.length).slice(0, 4);
}

/* ─── Helpers ─────────────────────────────────────────────────── */
function fmtTime(d) {
  if (!d) return "";
  return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}
function fmtDay(d)   { return new Date(d).toLocaleDateString("en-IN", { day: "numeric" }); }
function fmtMonth(d) { return new Date(d).toLocaleDateString("en-IN", { month: "short" }); }
function fmtDatePill(d) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
function fmtFull(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
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
  if (hrs < 3)    return "Starting soon!";
  if (hrs < 24)   return "Today";
  if (days === 1) return "Tomorrow";
  if (days < 7)   return `In ${days} days`;
  return `In ${Math.ceil(days / 7)} weeks`;
}
function isSameDay(d1, d2) {
  const a = new Date(d1), b = new Date(d2);
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate();
}
function dateKey(d) {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`;
}

const RSVP_OPTS = [
  { key: "going",     label: "Going",  Icon: Check      },
  { key: "maybe",     label: "Maybe",  Icon: HelpCircle },
  { key: "not_going", label: "Can't",  Icon: X          },
];

function eventStatusPill(item, rsvpMap) {
  const isPast = new Date(item.startAt) < new Date();
  if (isPast) return { label: "Past", color: "#6B7280", bg: "#F3F4F6", border: "#D1D5DB" };
  const cat = item.category || "";
  if (cat === "Workshop")  return { label: "Workshop",  color: "#14532D", bg: "#DCFCE7", border: "#86EFAC" };
  if (cat === "Cultural")  return { label: "Cultural",  color: "#6D28D9", bg: "#EDE9FE", border: "#C4B5FD" };
  if (cat === "Amenities") return { label: "Amenities", color: "#1D4ED8", bg: "#DBEAFE", border: "#93C5FD" };
  if (cat === "Social")    return { label: "Social",    color: "#0F766E", bg: "#CCFBF1", border: "#5EEAD4" };
  if (rsvpMap[item._id])   return { label: "RSVP Open", color: "#92400E", bg: "#FEF3C7", border: "#FDE68A" };
  if (inNextDays(item.startAt, 3)) return { label: "RSVP Open", color: "#92400E", bg: "#FEF3C7", border: "#FDE68A" };
  return { label: "Upcoming", color: "#1D4ED8", bg: "#DBEAFE", border: "#93C5FD" };
}

const SIDEBAR_CATS = ["Cultural", "Amenities", "Workshop", "Social"];
const CATEGORY_OPTS = ["Cultural", "Amenities", "Workshop", "Social", "General"];

/* ─── CSS ─────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Cormorant+Garamond:wght@600;700&display=swap');

  .ev-root * { box-sizing: border-box; margin:0; padding:0; }

  .ev-root {
    min-height: calc(100vh - 64px);
    padding: 40px 24px 80px;
    background: linear-gradient(120deg, #FFE8D4 0%, #FFF5EE 28%, #EEF2FF 60%, #E3EEFF 100%);
    font-family: 'Manrope', sans-serif;
    color: #111827;
  }
  .ev-shell { max-width: 1300px; margin: 0 auto; }

  @keyframes evRise {
    from { opacity:0; transform:translateY(14px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes evSpin  { to { transform:rotate(360deg); } }
  @keyframes evSlide {
    from { transform:translateX(100%); opacity:0; }
    to   { transform:translateX(0);    opacity:1; }
  }
  @keyframes evShimmer {
    0%   { background-position:200% center; }
    100% { background-position:-200% center; }
  }

  .ev-enter {
    opacity:0;
    animation: evRise 0.44s cubic-bezier(0.22,1,0.36,1) forwards;
  }

  /* ── Page heading ───────────────────────────── */
  .ev-page-head {
    display:flex; align-items:flex-start; justify-content:space-between;
    gap:16px; flex-wrap:wrap; margin-bottom:28px;
    animation: evRise 0.46s cubic-bezier(0.22,1,0.36,1) both;
  }
  .ev-title {
    font-family:'Manrope',sans-serif;
    font-size: clamp(1.8rem,3.6vw,2.6rem);
    font-weight:400; letter-spacing:-0.03em; color:#111827; line-height:1.1;
  }
  .ev-title strong { font-weight:800; }
  .ev-title-dot   { color:#E8890C; font-weight:800; }
  .ev-subtitle { margin-top:8px; color:#6B7280; font-size:0.88rem; font-weight:500; max-width:520px; }

  /* RSVP Now button */
  .ev-rsvp-btn {
    display:inline-flex; align-items:center; gap:9px;
    padding:10px 10px 10px 18px; border-radius:999px;
    background:#E8890C; border:none; cursor:pointer;
    font-family:'Manrope',sans-serif; font-size:0.82rem; font-weight:800; color:#fff;
    box-shadow:0 4px 18px rgba(232,137,12,0.32);
    transition: transform 0.2s cubic-bezier(0.22,1,0.36,1), box-shadow 0.2s;
    white-space:nowrap;
  }
  .ev-rsvp-btn:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(232,137,12,0.42); }
  .ev-rsvp-icon {
    width:30px; height:30px; border-radius:50%;
    background:rgba(255,255,255,0.25);
    display:inline-flex; align-items:center; justify-content:center;
    transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1);
  }
  .ev-rsvp-btn:hover .ev-rsvp-icon { transform:rotate(12deg) scale(1.1); }

  /* ── Timeline strip ─────────────────────────── */
  .ev-timeline-wrap {
    position:relative; margin-bottom:28px; overflow-x:auto; overflow-y:visible;
    padding-bottom:4px;
    animation: evRise 0.46s 0.05s cubic-bezier(0.22,1,0.36,1) both;
    scrollbar-width:none;
  }
  .ev-timeline-wrap::-webkit-scrollbar { display:none; }
  .ev-timeline-row {
    display:flex; align-items:center; gap:0;
    position:relative; min-width:max-content;
  }
  .ev-timeline-line {
    position:absolute; top:50%; left:0; right:0; height:2px;
    background:#E5E7EB; transform:translateY(-50%); z-index:0; pointer-events:none;
  }
  .ev-timeline-line-fill {
    position:absolute; top:50%; left:0; height:2px;
    background:linear-gradient(90deg,#E8890C,#FDE68A);
    transform:translateY(-50%); z-index:1; pointer-events:none;
    transition: width 0.3s ease;
  }

  /* Today chip */
  .ev-today-chip {
    display:inline-flex; align-items:center; gap:8px;
    padding:8px 14px; border-radius:12px;
    border:1.5px solid #2563EB; background:#DBEAFE;
    cursor:pointer; z-index:2; position:relative; flex-shrink:0;
    transition: all 0.2s;
    font-family:'Manrope',sans-serif;
    margin-right:8px;
  }
  .ev-today-chip.active { background:#2563EB; border-color:#2563EB; }
  .ev-today-text { display:flex; flex-direction:column; line-height:1.2; }
  .ev-today-label { font-size:0.78rem; font-weight:800; color:#1D4ED8; }
  .ev-today-sub   { font-size:0.62rem; font-weight:600; color:#1D4ED8; opacity:0.72; }
  .ev-today-chip.active .ev-today-label,
  .ev-today-chip.active .ev-today-sub { color:#fff; opacity:1; }
  .ev-today-count {
    font-size:0.9rem; font-weight:800; color:#1D4ED8;
    background:rgba(255,255,255,0.4); border-radius:6px; padding:0 6px;
  }
  .ev-today-chip.active .ev-today-count { color:#fff; }

  /* Date pill */
  .ev-date-pill {
    padding:8px 16px; border-radius:10px;
    border:1.5px solid #E5E7EB; background:#FFFFFF;
    font-size:0.78rem; font-weight:700; color:#374151;
    cursor:pointer; z-index:2; position:relative;
    flex-shrink:0; margin:0 4px;
    transition: all 0.2s cubic-bezier(0.22,1,0.36,1);
    box-shadow:0 1px 4px rgba(0,0,0,0.07);
  }
  .ev-date-pill:hover { border-color:#E8890C; color:#E8890C; transform:translateY(-1px); }
  .ev-date-pill.active { border-color:#E8890C; background:#FEF3C7; color:#C97508; font-weight:800; }

  /* ── Body ───────────────────────────────────── */
  .ev-body {
    display:grid; grid-template-columns:160px 1fr; gap:20px;
    animation: evRise 0.46s 0.1s cubic-bezier(0.22,1,0.36,1) both;
  }
  @media (max-width:720px) { .ev-body { grid-template-columns:1fr; } }

  /* ── Sidebar ─────────────────────────────────── */
  .ev-sidebar { display:flex; flex-direction:column; gap:4px; }
  .ev-sidebar-btn {
    display:block; width:100%; padding:9px 13px;
    border-radius:10px; border:1.5px solid transparent;
    background:transparent; font-family:'Manrope',sans-serif;
    font-size:0.8rem; font-weight:700; color:#6B7280;
    cursor:pointer; text-align:left;
    transition: all 0.18s cubic-bezier(0.22,1,0.36,1);
  }
  .ev-sidebar-btn:hover { background:rgba(255,255,255,0.7); color:#111827; border-color:#E5E7EB; }
  .ev-sidebar-btn.active { background:#FFFFFF; color:#111827; border-color:#E5E7EB; box-shadow:0 2px 8px rgba(0,0,0,0.07); }

  /* ── Masonry grid ───────────────────────────── */
  .ev-masonry {
    columns: 4;
    column-gap: 16px;
  }
  @media (max-width:1100px) { .ev-masonry { columns:3; } }
  @media (max-width:800px)  { .ev-masonry { columns:2; } }
  @media (max-width:520px)  { .ev-masonry { columns:1; } }

  /* ── Card ───────────────────────────────────── */
  .ev-card {
    break-inside: avoid;
    margin-bottom: 16px;
    background:#FFFFFF;
    border:1.5px solid #E5E7EB; border-radius:18px;
    padding:16px; cursor:pointer;
    transition: transform 0.22s cubic-bezier(0.22,1,0.36,1), box-shadow 0.22s, border-color 0.2s;
    box-shadow:0 1px 4px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.05);
    position:relative; overflow:hidden;
  }
  .ev-card::after {
    content:''; position:absolute; left:0; top:0; bottom:0; width:3px;
    background: var(--accent,#E8890C); border-radius:18px 0 0 18px;
    opacity:0; transition:opacity 0.2s;
  }
  .ev-card:hover { transform:translateY(-3px); box-shadow:0 8px 28px rgba(0,0,0,0.12); border-color:#D1D5DB; }
  .ev-card:hover::after, .ev-card.active::after { opacity:1; }
  .ev-card.active { border-color:rgba(232,137,12,0.4); }
  .ev-card.past   { opacity:0.75; }

  .ev-card-top {
    display:flex; align-items:center; gap:7px; margin-bottom:10px; flex-wrap:wrap;
  }
  .ev-status-pill {
    display:inline-flex; align-items:center; gap:4px;
    padding:3px 9px; border-radius:999px;
    font-size:0.65rem; font-weight:800; letter-spacing:0.02em; border:1px solid;
  }
  .ev-starts-at { font-size:0.68rem; font-weight:700; color:#9CA3AF; }

  .ev-card-title {
    font-family:'Cormorant Garamond',serif;
    font-size:1.1rem; font-weight:700; line-height:1.3; color:#111827;
    margin-bottom:8px; transition:color 0.18s;
  }
  .ev-card:hover .ev-card-title { color:#E8890C; }

  .ev-card-desc {
    font-size:0.8rem; font-weight:500; color:#6B7280; line-height:1.6;
    display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;
    margin-bottom:10px;
  }

  /* Cover image */
  .ev-cover-wrap {
    border-radius:12px; overflow:hidden; margin-bottom:10px;
    position:relative;
  }
  .ev-cover-img {
    width:100%; height:160px; object-fit:cover; display:block;
    transition: transform 0.5s cubic-bezier(0.22,1,0.36,1);
  }
  .ev-card:hover .ev-cover-img { transform:scale(1.06); }

  /* Below image row */
  .ev-below-img {
    display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin-bottom:8px;
  }
  .ev-cat-chip {
    display:inline-flex; align-items:center; gap:4px;
    padding:3px 9px; border-radius:999px;
    font-size:0.65rem; font-weight:800; border:1px solid;
  }
  .ev-thumb {
    width:28px; height:28px; border-radius:6px; object-fit:cover;
    border:1px solid #E5E7EB;
  }

  .ev-card-desc-2 {
    font-size:0.78rem; font-weight:500; color:#6B7280; line-height:1.6;
    display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;
    margin-bottom:12px;
  }

  /* Card footer */
  .ev-card-footer {
    display:flex; align-items:center; justify-content:space-between; gap:8px; margin-top:4px;
  }
  .ev-card-author { display:flex; align-items:center; gap:6px; min-width:0; }
  .ev-avatar {
    width:28px; height:28px; border-radius:50%;
    background:linear-gradient(135deg,#E8890C,#C97508);
    color:#fff; font-size:0.62rem; font-weight:800;
    display:flex; align-items:center; justify-content:center; flex-shrink:0;
  }
  .ev-avatar img { width:100%; height:100%; border-radius:50%; object-fit:cover; }
  .ev-author-info { display:flex; flex-direction:column; line-height:1.2; min-width:0; }
  .ev-author-cat  { font-size:0.72rem; font-weight:800; color:#374151; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .ev-author-name { font-size:0.65rem; font-weight:600; color:#9CA3AF; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .ev-view-btn {
    display:inline-flex; align-items:center; gap:3px;
    font-size:0.74rem; font-weight:800; color:#6B7280;
    background:none; border:none; cursor:pointer; white-space:nowrap; padding:4px 0;
    transition: color 0.18s, gap 0.18s;
  }
  .ev-card:hover .ev-view-btn { color:#E8890C; gap:6px; }

  /* ── Skeleton ───────────────────────────────── */
  .ev-sk {
    border-radius:6px;
    background:linear-gradient(90deg,#F3F4F6 25%,#E9EBEE 50%,#F3F4F6 75%);
    background-size:200% 100%;
    animation: evShimmer 1.4s ease-in-out infinite;
  }

  /* ── Empty ──────────────────────────────────── */
  .ev-empty {
    text-align:center; padding:60px 24px;
    border:1.5px dashed #D1D5DB; border-radius:18px;
    background:rgba(255,255,255,0.6);
  }
  .ev-empty-icon {
    width:52px; height:52px; border-radius:16px;
    background:#FFF3E0; color:#E8890C;
    display:inline-flex; align-items:center; justify-content:center; margin-bottom:12px;
  }
  .ev-empty h3 { font-size:1.05rem; font-weight:700; color:#111827; }
  .ev-empty p  { margin-top:6px; font-size:0.82rem; color:#9CA3AF; font-weight:500; }

  /* ── Load more ──────────────────────────────── */
  .ev-load-wrap { display:flex; justify-content:center; margin-top:8px; }
  .ev-load-btn {
    padding:10px 28px; border-radius:999px;
    border:1.5px solid #E5E7EB; background:#FFFFFF;
    font-family:'Manrope',sans-serif; font-size:0.82rem; font-weight:700; color:#374151;
    cursor:pointer;
    transition: border-color 0.18s, transform 0.18s, box-shadow 0.18s;
    box-shadow:0 2px 8px rgba(0,0,0,0.06);
  }
  .ev-load-btn:hover { border-color:#E8890C; color:#E8890C; transform:translateY(-1px); box-shadow:0 6px 16px rgba(232,137,12,0.14); }

  /* ── Error ──────────────────────────────────── */
  .ev-error {
    padding:10px 14px; border-radius:12px; margin-bottom:16px;
    border:1px solid #FECACA; background:#FEF2F2;
    color:#B91C1C; font-size:0.82rem; font-weight:700;
  }

  /* ── Form ───────────────────────────────────── */
  .ev-form-wrap {
    background:#FFFFFF; border:1.5px solid #E5E7EB;
    border-radius:18px; padding:20px; margin-bottom:20px;
    box-shadow:0 4px 20px rgba(0,0,0,0.07);
    animation: evRise 0.36s cubic-bezier(0.22,1,0.36,1) both;
  }
  .ev-form-title { font-family:'Cormorant Garamond',serif; font-size:1.3rem; font-weight:700; color:#111827; margin-bottom:14px; }
  .ev-form-row   { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px; }
  .ev-form-row3  { display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-bottom:10px; }
  @media (max-width:640px) { .ev-form-row,.ev-form-row3 { grid-template-columns:1fr; } }
  .ev-form-label { font-size:0.7rem; font-weight:800; color:#6B7280; letter-spacing:0.04em; text-transform:uppercase; margin-bottom:5px; }
  .ev-form-input, .ev-form-select, .ev-form-textarea {
    width:100%; border:1.5px solid #E5E7EB; border-radius:10px;
    padding:9px 12px; background:#FAFAFA;
    font-family:'Manrope',sans-serif; font-size:0.83rem; font-weight:600; color:#111827; outline:none;
    transition: border-color 0.18s, box-shadow 0.18s;
  }
  .ev-form-textarea { resize:vertical; min-height:80px; }
  .ev-form-input:focus,.ev-form-select:focus,.ev-form-textarea:focus {
    border-color:#E8890C; box-shadow:0 0 0 3px rgba(232,137,12,0.12);
  }
  .ev-form-input::placeholder,.ev-form-textarea::placeholder { color:#9CA3AF; }
  .ev-form-actions { margin-top:12px; display:flex; align-items:center; gap:8px; flex-wrap:wrap; }

  .ev-btn-primary {
    position:relative; overflow:hidden; isolation:isolate;
    display:inline-flex; align-items:center; gap:7px;
    padding:9px 16px; border-radius:10px;
    border:1.5px solid rgba(232,137,12,0.4);
    background:rgba(255,248,240,0.9); color:#C97508;
    font-family:'Manrope',sans-serif; font-size:0.8rem; font-weight:800;
    cursor:pointer; z-index:0;
    transition: color 0.2s, border-color 0.2s, transform 0.22s cubic-bezier(0.22,1,0.36,1);
  }
  .ev-btn-primary::before {
    content:''; position:absolute; inset:0; z-index:-1;
    background:linear-gradient(135deg,#E8890C,#C97508);
    transform:scaleX(0); transform-origin:left center;
    transition: transform 0.3s cubic-bezier(0.22,1,0.36,1);
  }
  .ev-btn-primary:hover:not(:disabled) { color:#fff; border-color:#E8890C; transform:translateY(-1px); }
  .ev-btn-primary:hover:not(:disabled)::before { transform:scaleX(1); }
  .ev-btn-primary:disabled { opacity:0.5; cursor:not-allowed; }
  .ev-btn-ghost {
    display:inline-flex; align-items:center; gap:7px;
    padding:9px 16px; border-radius:10px;
    border:1.5px solid #E5E7EB; background:#FFFFFF; color:#6B7280;
    font-family:'Manrope',sans-serif; font-size:0.8rem; font-weight:700;
    cursor:pointer; transition: border-color 0.18s, color 0.18s, transform 0.18s;
  }
  .ev-btn-ghost:hover { border-color:#D1D5DB; color:#374151; transform:translateY(-1px); }

  /* ── Detail panel ───────────────────────────── */
  .ev-overlay {
    position:fixed; inset:0; z-index:100;
    background:rgba(0,0,0,0.18); backdrop-filter:blur(2px);
    animation: evRise 0.2s ease both;
  }
  .ev-detail {
    position:fixed; top:64px; right:0; bottom:0;
    width:min(460px,100vw);
    background:#FFFFFF; border-radius:24px 0 0 0;
    box-shadow:-8px 0 40px rgba(0,0,0,0.14);
    display:flex; flex-direction:column;
    animation: evSlide 0.32s cubic-bezier(0.22,1,0.36,1) both;
    overflow:hidden; z-index:101;
  }
  .ev-detail-head {
    padding:18px 20px 14px; border-bottom:1px solid #F3F4F6;
    display:flex; align-items:center; gap:10px;
  }
  .ev-detail-close {
    margin-left:auto; flex-shrink:0;
    width:32px; height:32px; border-radius:50%;
    border:1.5px solid #E5E7EB; background:#F9FAFB;
    display:flex; align-items:center; justify-content:center;
    cursor:pointer; color:#6B7280;
    transition: border-color 0.18s, background 0.18s, transform 0.18s;
  }
  .ev-detail-close:hover { border-color:#E8890C; background:#FEF3C7; color:#E8890C; transform:rotate(90deg); }
  .ev-detail-body { flex:1; overflow-y:auto; padding:20px; }
  .ev-detail-cover { width:100%; height:180px; object-fit:cover; border-radius:14px; margin-bottom:16px; }
  .ev-detail-title { font-family:'Cormorant Garamond',serif; font-size:1.5rem; font-weight:700; color:#111827; margin-bottom:12px; line-height:1.3; }
  .ev-detail-meta { display:flex; align-items:center; gap:7px; font-size:0.8rem; color:#6B7280; font-weight:600; margin-bottom:8px; }
  .ev-detail-desc { font-size:0.86rem; color:#374151; line-height:1.75; font-weight:500; margin-bottom:16px; }
  .ev-rsvp-row { display:flex; gap:8px; flex-wrap:wrap; }
  .ev-rsvp-opt {
    flex:1; display:inline-flex; align-items:center; justify-content:center; gap:6px;
    padding:9px 10px; border-radius:10px;
    border:1.5px solid #E5E7EB; background:#FFFFFF;
    font-family:'Manrope',sans-serif; font-size:0.78rem; font-weight:800; color:#6B7280;
    cursor:pointer; transition: all 0.22s cubic-bezier(0.22,1,0.36,1);
  }
  .ev-rsvp-opt:hover { border-color:#E8890C; color:#E8890C; transform:translateY(-1px); }
  .ev-rsvp-opt.going-a    { background:#DCFCE7; border-color:#86EFAC; color:#15803D; }
  .ev-rsvp-opt.maybe-a    { background:#FEF3C7; border-color:#FDE68A; color:#92400E; }
  .ev-rsvp-opt.not_going-a{ background:#FEE2E2; border-color:#FECACA; color:#B91C1C; }
  .ev-detail-footer { padding:14px 20px 20px; border-top:1px solid #F3F4F6; }
  .ev-refresh-btn {
    margin-left:auto;
    display:inline-flex; align-items:center; gap:7px;
    padding:9px 16px; border-radius:12px;
    border:1.5px solid #E5E7EB; background:#FFFFFF;
    font-family:'Manrope',sans-serif; font-size:0.8rem; font-weight:700; color:#374151;
    cursor:pointer; box-shadow:0 2px 8px rgba(0,0,0,0.06);
    transition: border-color 0.18s, transform 0.18s, box-shadow 0.18s;
  }
  .ev-refresh-btn:hover { border-color:#E8890C; color:#E8890C; transform:translateY(-1px); }
  .ev-refresh-btn:disabled { opacity:0.5; cursor:not-allowed; }
`;

/* ─── Category chip colors ────────────────────────────────────── */
const CAT_STYLE = {
  Cultural:  { color:"#6D28D9", bg:"#EDE9FE", border:"#C4B5FD" },
  Amenities: { color:"#1D4ED8", bg:"#DBEAFE", border:"#93C5FD" },
  Workshop:  { color:"#14532D", bg:"#DCFCE7", border:"#86EFAC" },
  Social:    { color:"#0F766E", bg:"#CCFBF1", border:"#5EEAD4" },
  General:   { color:"#6B7280", bg:"#F3F4F6", border:"#D1D5DB" },
};
function catStyle(cat) { return CAT_STYLE[cat] || CAT_STYLE.General; }

/* ─── Event card ──────────────────────────────────────────────── */
function EvCard({ item, active, rsvp, onOpen, delay }) {
  const isPast  = new Date(item.startAt) < new Date();
  const status  = eventStatusPill(item, { [item._id]: rsvp });
  const cover   = item.coverImage || coverFor(item._id);
  const thumbs  = thumbsFor(item._id);
  const cs      = catStyle(item.category);

  return (
    <article
      className={`ev-card ev-enter${active ? " active" : ""}${isPast ? " past" : ""}`}
      style={{ animationDelay: `${delay}ms`, "--accent": status.color }}
      onClick={() => onOpen(item)}
    >
      <div className="ev-card-top">
        <span className="ev-status-pill" style={{ color: status.color, background: status.bg, borderColor: status.border }}>
          <CalendarDays size={9} />
          {status.label}
        </span>
        {item.startAt && (
          <span className="ev-starts-at">Starts: {fmtDay(item.startAt)} {fmtMonth(item.startAt)}</span>
        )}
      </div>

      <h3 className="ev-card-title">{item.title}</h3>
      <p className="ev-card-desc">{item.description || "No description provided"}</p>

      {/* Cover image */}
      <div className="ev-cover-wrap">
        <img src={cover} alt={item.title} className="ev-cover-img" loading="lazy" />
      </div>

      {/* Below image: category chip + thumbnails */}
      <div className="ev-below-img">
        {item.category && (
          <span className="ev-cat-chip" style={{ color: cs.color, background: cs.bg, borderColor: cs.border }}>
            <CalendarDays size={9} />
            {item.category}
          </span>
        )}
        {thumbs.slice(0, 3).map((url, i) => (
          <img key={i} src={url} alt="" className="ev-thumb" />
        ))}
      </div>

      <p className="ev-card-desc-2">{item.description || "No description provided"}</p>

      <div className="ev-card-footer">
        <div className="ev-card-author">
          <span className="ev-avatar">{(item.createdBy?.fullName || "C")[0].toUpperCase()}</span>
          <div className="ev-author-info">
            <span className="ev-author-cat">{item.category || "General"}</span>
            <span className="ev-author-name">{item.createdBy?.fullName || "Committee Member"} · {fmtDay(item.startAt)} {fmtMonth(item.startAt)}</span>
          </div>
        </div>
        <button type="button" className="ev-view-btn" onClick={e => { e.stopPropagation(); onOpen(item); }}>
          View Details <ChevronRight size={12} />
        </button>
      </div>
    </article>
  );
}

/* ─── Skeleton card ───────────────────────────────────────────── */
function SkCard({ delay }) {
  return (
    <div className="ev-card ev-enter" style={{ animationDelay: `${delay}ms`, cursor: "default" }}>
      <div style={{ display:"flex", gap:8, marginBottom:10 }}>
        <div className="ev-sk" style={{ width:70, height:20, borderRadius:999 }} />
        <div className="ev-sk" style={{ width:60, height:12, marginTop:4 }} />
      </div>
      <div className="ev-sk" style={{ width:"72%", height:18, marginBottom:8 }} />
      <div className="ev-sk" style={{ width:"88%", height:12, marginBottom:4 }} />
      <div className="ev-sk" style={{ width:"60%", height:12, marginBottom:10 }} />
      <div className="ev-sk" style={{ width:"100%", height:150, borderRadius:12, marginBottom:10 }} />
      <div style={{ marginTop:12, display:"flex", gap:8 }}>
        <div className="ev-sk" style={{ width:28, height:28, borderRadius:"50%" }} />
        <div className="ev-sk" style={{ width:90, height:12, marginTop:8 }} />
      </div>
    </div>
  );
}

/* ─── Detail panel ────────────────────────────────────────────── */
function DetailPanel({ item, rsvp, onClose, onRsvp }) {
  const isPast = new Date(item.startAt) < new Date();
  const cover  = item.coverImage || coverFor(item._id);

  return (
    <>
      <div className="ev-overlay" onClick={onClose} />
      <div className="ev-detail">
        <div className="ev-detail-head">
          <span className="ev-status-pill" style={(() => { const s = eventStatusPill(item, { [item._id]: rsvp }); return { color:s.color, background:s.bg, borderColor:s.border }; })()}>
            <CalendarDays size={9} />
            {eventStatusPill(item, { [item._id]: rsvp }).label}
          </span>
          <button type="button" className="ev-detail-close" onClick={onClose}><X size={14} /></button>
        </div>
        <div className="ev-detail-body">
          <img src={cover} alt={item.title} className="ev-detail-cover" />
          <h2 className="ev-detail-title">{item.title}</h2>
          {item.location && (
            <div className="ev-detail-meta"><MapPin size={13} />{item.location}</div>
          )}
          <div className="ev-detail-meta">
            <Clock size={13} />
            {fmtFull(item.startAt)} {fmtTime(item.startAt)}
            {item.endAt ? ` — ${fmtTime(item.endAt)}` : ""}
          </div>
          <p className="ev-detail-desc">{item.description}</p>

          {!isPast && (
            <>
              <p style={{ fontSize:"0.7rem", fontWeight:800, color:"#9CA3AF", marginBottom:8, letterSpacing:"0.04em" }}>YOUR RSVP</p>
              <div className="ev-rsvp-row">
                {RSVP_OPTS.map(({ key, label, Icon }) => (
                  <button
                    key={key}
                    type="button"
                    className={`ev-rsvp-opt${rsvp === key ? ` ${key}-a` : ""}`}
                    onClick={() => onRsvp(item._id, key)}
                  >
                    <Icon size={13} /> {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="ev-detail-footer">
          <div className="ev-card-author">
            <span className="ev-avatar">{(item.createdBy?.fullName || "C")[0].toUpperCase()}</span>
            <div className="ev-author-info">
              <span className="ev-author-cat">{item.createdBy?.fullName || "Committee Member"}</span>
              <span className="ev-author-name">{item.category || "General"}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ═══ EVENTS PAGE ════════════════════════════════════════════════ */
export function EventsPage() {
  const { token, user } = useAuth();
  const [items,       setItems]       = useState([]);
  const [title,       setTitle]       = useState("");
  const [description, setDesc]        = useState("");
  const [location,    setLocation]    = useState("Club House");
  const [category,    setCategory]    = useState("Cultural");
  const [startAt,     setStartAt]     = useState("");
  const [endAt,       setEndAt]       = useState("");
  const [error,       setError]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [submitting,  setSubmit]      = useState(false);
  const [showForm,    setShowForm]    = useState(false);
  const [rsvpMap,     setRsvpMap]     = useState({});
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeDateKey,  setActiveDateKey]  = useState("all");
  const [selectedItem,   setSelectedItem]   = useState(null);
  const [visibleCount,   setVisibleCount]   = useState(12);

  const canCreate = useMemo(() => ["committee", "super_admin"].includes(user?.role), [user?.role]);

  function handleRsvp(eventId, key) {
    setRsvpMap(prev => ({ ...prev, [eventId]: prev[eventId] === key ? null : key }));
  }

  /* ── Sorted items ────────────────────────────── */
  const upcoming = useMemo(() =>
    items.filter(e => new Date(e.startAt) >= new Date())
         .sort((a, b) => new Date(a.startAt) - new Date(b.startAt)),
    [items]);

  const stats = useMemo(() => ({
    totalUpcoming: upcoming.length,
    thisWeek: upcoming.filter(e => inNextDays(e.startAt, 7)).length,
    todayCount: upcoming.filter(e => isSameDay(e.startAt, new Date())).length,
  }), [upcoming]);

  /* ── Date pills from upcoming events ────────── */
  const datePills = useMemo(() => {
    const seen = new Set();
    const pills = [];
    upcoming.forEach(e => {
      const k = dateKey(e.startAt);
      if (!seen.has(k)) { seen.add(k); pills.push(e.startAt); }
    });
    if (pills.length === 0) {
      for (let i = 0; i < 7; i++) {
        const d = new Date(); d.setDate(d.getDate() + i);
        pills.push(d.toISOString());
      }
    }
    return pills.slice(0, 8);
  }, [upcoming]);

  /* ── Filtered + paginated items ─────────────── */
  const filteredItems = useMemo(() => {
    return upcoming.filter(item => {
      const catOk  = activeCategory === "All" || activeCategory === "rsvped"
        ? (activeCategory === "rsvped" ? Boolean(rsvpMap[item._id]) : true)
        : (item.category || "General") === activeCategory;
      const dateOk = activeDateKey === "all" || dateKey(item.startAt) === activeDateKey;
      return catOk && dateOk;
    });
  }, [upcoming, activeCategory, activeDateKey, rsvpMap]);

  const visibleItems = filteredItems.slice(0, visibleCount);
  const hasMore      = filteredItems.length > visibleCount;

  /* ── Timeline fill width ─────────────────────── */
  const fillPct = useMemo(() => {
    if (activeDateKey === "all") return 0;
    const idx = datePills.findIndex(d => dateKey(d) === activeDateKey);
    return idx < 0 ? 0 : Math.round(((idx + 1) / datePills.length) * 100);
  }, [activeDateKey, datePills]);

  /* ── API ─────────────────────────────────────── */
  async function loadItems() {
    setLoading(true); setError("");
    try {
      const data = await apiRequest("/events", { token });
      setItems(data.items || []);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function handleCreate(e) {
    e.preventDefault(); setSubmit(true); setError("");
    try {
      const data = await apiRequest("/events", {
        method: "POST", token,
        body: { title, description, location, category, startAt, endAt },
      });
      setItems(prev => [...prev, data.item]);
      setTitle(""); setDesc(""); setLocation("Club House"); setCategory("Cultural"); setStartAt(""); setEndAt("");
      setShowForm(false);
    } catch (err) { setError(err.message); }
    finally { setSubmit(false); }
  }

  useEffect(() => { loadItems(); }, []);

  return (
    <>
      <style>{CSS}</style>
      <div className="ev-root">
        <div className="ev-shell">

          {/* ── Page heading ──────────────────── */}
          <div className="ev-page-head">
            <div>
              <h1 className="ev-title">
                Upcoming Events<span className="ev-title-dot">.</span>
              </h1>
              <p className="ev-subtitle">
                Discover and RSVP for upcoming community gatherings, workshops, and celebrations in your society.
              </p>
            </div>

            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              {canCreate && (
                <button type="button" className="ev-rsvp-btn" onClick={() => setShowForm(v => !v)}>
                  {showForm ? "Cancel" : "RSVP Now"}
                  <span className="ev-rsvp-icon">{showForm ? <X size={14} /> : <Plus size={14} />}</span>
                </button>
              )}
              <button type="button" className="ev-refresh-btn" onClick={loadItems} disabled={loading}>
                <RefreshCw size={13} style={{ animation: loading ? "evSpin 1s linear infinite" : "none" }} />
              </button>
            </div>
          </div>

          {/* ── Timeline strip ────────────────── */}
          <div className="ev-timeline-wrap">
            <div className="ev-timeline-row">
              <div className="ev-timeline-line" />
              <div className="ev-timeline-line-fill" style={{ width: `${fillPct}%` }} />

              {/* Today chip */}
              <div
                className={`ev-today-chip${activeDateKey === "today" ? " active" : ""}`}
                onClick={() => setActiveDateKey(activeDateKey === "today" ? "all" : "today")}
              >
                <CalendarDays size={13} style={{ color: activeDateKey === "today" ? "#fff" : "#2563EB" }} />
                <span className="ev-today-text">
                  <span className="ev-today-label">Events</span>
                  <span className="ev-today-sub">Today</span>
                </span>
                <span className="ev-today-count">{stats.todayCount}</span>
              </div>

              {/* Date pills */}
              {datePills.map(d => {
                const k = dateKey(d);
                return (
                  <div
                    key={k}
                    className={`ev-date-pill${activeDateKey === k ? " active" : ""}`}
                    onClick={() => setActiveDateKey(activeDateKey === k ? "all" : k)}
                  >
                    {fmtDatePill(d)}
                  </div>
                );
              })}
            </div>
          </div>

          {error && <div className="ev-error">{error}</div>}

          {/* ── Create form ───────────────────── */}
          {canCreate && showForm && (
            <div className="ev-form-wrap">
              <h2 className="ev-form-title">Host a New Event</h2>
              <form onSubmit={handleCreate}>
                <div className="ev-form-row">
                  <div>
                    <p className="ev-form-label">Title</p>
                    <input className="ev-form-input" placeholder="e.g. Rooftop Diwali Celebration"
                      value={title} onChange={e => setTitle(e.target.value)} required />
                  </div>
                  <div>
                    <p className="ev-form-label">Category</p>
                    <select className="ev-form-select" value={category} onChange={e => setCategory(e.target.value)}>
                      {CATEGORY_OPTS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom:10 }}>
                  <p className="ev-form-label">Description</p>
                  <textarea className="ev-form-textarea" placeholder="What should residents expect?"
                    value={description} onChange={e => setDesc(e.target.value)} />
                </div>
                <div className="ev-form-row3">
                  <div>
                    <p className="ev-form-label">Location</p>
                    <input className="ev-form-input" placeholder="Club House"
                      value={location} onChange={e => setLocation(e.target.value)} />
                  </div>
                  <div>
                    <p className="ev-form-label">Starts</p>
                    <input className="ev-form-input" type="datetime-local"
                      value={startAt} onChange={e => setStartAt(e.target.value)} required />
                  </div>
                  <div>
                    <p className="ev-form-label">Ends</p>
                    <input className="ev-form-input" type="datetime-local"
                      value={endAt} onChange={e => setEndAt(e.target.value)} />
                  </div>
                </div>
                <div className="ev-form-actions">
                  <button type="submit" className="ev-btn-primary" disabled={submitting}>
                    <CalendarDays size={13} />
                    {submitting ? "Creating..." : "Publish Event"}
                  </button>
                  <button type="button" className="ev-btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* ── Body: sidebar + masonry ───────── */}
          <div className="ev-body">
            {/* Sidebar */}
            <aside className="ev-sidebar">
              <button type="button" className={`ev-sidebar-btn${activeCategory === "All" ? " active" : ""}`} onClick={() => setActiveCategory("All")}>All</button>
              {SIDEBAR_CATS.map(cat => (
                <button key={cat} type="button"
                  className={`ev-sidebar-btn${activeCategory === cat ? " active" : ""}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              ))}
              <button type="button"
                className={`ev-sidebar-btn${activeCategory === "rsvped" ? " active" : ""}`}
                onClick={() => setActiveCategory(activeCategory === "rsvped" ? "All" : "rsvped")}
              >
                RSVPed Events
              </button>
            </aside>

            {/* Masonry grid */}
            <div>
              {loading ? (
                <div className="ev-masonry">
                  {[0,1,2,3,4,5].map(i => <SkCard key={i} delay={i * 50} />)}
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="ev-empty ev-enter">
                  <div className="ev-empty-icon"><CalendarDays size={22} /></div>
                  <h3>No events found</h3>
                  <p>{activeCategory !== "All" ? "Try a different category." : "Check back soon for community events."}</p>
                </div>
              ) : (
                <>
                  <div className="ev-masonry">
                    {visibleItems.map((item, idx) => (
                      <EvCard
                        key={item._id}
                        item={item}
                        active={selectedItem?._id === item._id}
                        rsvp={rsvpMap[item._id] || null}
                        onOpen={setSelectedItem}
                        delay={idx * 35}
                      />
                    ))}
                  </div>
                  {hasMore && (
                    <div className="ev-load-wrap">
                      <button type="button" className="ev-load-btn" onClick={() => setVisibleCount(v => v + 12)}>
                        Load more
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Detail panel ──────────────────── */}
        {selectedItem && (
          <DetailPanel
            item={selectedItem}
            rsvp={rsvpMap[selectedItem._id] || null}
            onClose={() => setSelectedItem(null)}
            onRsvp={handleRsvp}
          />
        )}
      </div>
    </>
  );
}
