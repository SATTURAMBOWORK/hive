import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../components/api";
import { useAuth } from "../components/AuthContext";
import { BookmarkCheck, ChevronRight, Clock, Plus, RefreshCw, Tag, Ticket, X } from "lucide-react";

/* ─── Status config ───────────────────────────────────────────────── */
const STATUS_CFG = {
  open:        { label: "Open",        sub: "Ticket",   Icon: Ticket,        color: "#1D4ED8", bg: "#DBEAFE", border: "#93C5FD", accent: "#2563EB"  },
  in_progress: { label: "In Progress", sub: "Amber",    Icon: Clock,         color: "#92400E", bg: "#FEF3C7", border: "#FDE68A", accent: "#D97706"  },
  resolved:    { label: "Resolved",    sub: "Resolved", Icon: BookmarkCheck, color: "#14532D", bg: "#DCFCE7", border: "#86EFAC", accent: "#16A34A"  },
  closed:      { label: "Closed",      sub: "Archived", Icon: Tag,           color: "#374151", bg: "#F3F4F6", border: "#D1D5DB", accent: "#9CA3AF"  },
};

const STATUS_OPTIONS = ["open", "in_progress", "resolved", "closed"];

/* ─── Helpers ─────────────────────────────────────────────────────── */
function timeAgo(date) {
  if (!date) return "";
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60)  return "just now";
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/* ─── CSS ─────────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Cormorant+Garamond:wght@600;700&display=swap');

  .tp-root * { box-sizing: border-box; margin: 0; padding: 0; }

  .tp-root {
    min-height: calc(100vh - 64px);
    padding: 40px 24px 80px;
    background: linear-gradient(120deg, #FFE8D4 0%, #FFF5EE 28%, #EEF2FF 60%, #E3EEFF 100%);
    font-family: 'Manrope', sans-serif;
    color: #111827;
  }

  .tp-shell { max-width: 1200px; margin: 0 auto; }

  @keyframes tpRise {
    from { opacity:0; transform: translateY(14px); }
    to   { opacity:1; transform: translateY(0); }
  }
  @keyframes tpSpin { to { transform: rotate(360deg); } }
  @keyframes tpSlide {
    from { transform: translateX(100%); opacity:0; }
    to   { transform: translateX(0);   opacity:1; }
  }
  @keyframes tpShimmer {
    0%   { background-position: 200% center; }
    100% { background-position: -200% center; }
  }

  .tp-enter {
    opacity: 0;
    animation: tpRise 0.42s cubic-bezier(0.22,1,0.36,1) forwards;
  }

  /* ── Page heading ─────────────────────────────── */
  .tp-page-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    margin-bottom: 28px;
    animation: tpRise 0.46s cubic-bezier(0.22,1,0.36,1) both;
  }
  .tp-title {
    font-family: 'Manrope', sans-serif;
    font-size: clamp(1.8rem, 3.6vw, 2.6rem);
    font-weight: 400;
    letter-spacing: -0.03em;
    color: #111827;
    line-height: 1.1;
  }
  .tp-title strong { font-weight: 800; }
  .tp-title-dot { color: #E8890C; font-weight: 800; }
  .tp-subtitle {
    margin-top: 8px;
    color: #6B7280;
    font-size: 0.88rem;
    font-weight: 500;
    max-width: 520px;
  }

  /* Raise Ticket button */
  .tp-raise-btn {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    padding: 10px 10px 10px 18px;
    border-radius: 999px;
    background: #E8890C;
    border: none;
    cursor: pointer;
    font-family: 'Manrope', sans-serif;
    font-size: 0.82rem;
    font-weight: 800;
    color: #fff;
    box-shadow: 0 4px 18px rgba(232,137,12,0.32);
    transition: transform 0.2s cubic-bezier(0.22,1,0.36,1), box-shadow 0.2s;
    white-space: nowrap;
  }
  .tp-raise-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(232,137,12,0.4);
  }
  .tp-raise-icon {
    width: 30px; height: 30px; border-radius: 50%;
    background: rgba(255,255,255,0.25);
    display: inline-flex; align-items: center; justify-content: center;
    transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1);
  }
  .tp-raise-btn:hover .tp-raise-icon { transform: rotate(12deg) scale(1.1); }

  /* ── Status chips row ─────────────────────────── */
  .tp-controls {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 24px;
    animation: tpRise 0.46s 0.05s cubic-bezier(0.22,1,0.36,1) both;
  }
  .tp-status-chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    border-radius: 12px;
    border: 1.5px solid transparent;
    cursor: pointer;
    font-family: 'Manrope', sans-serif;
    transition: all 0.2s cubic-bezier(0.22,1,0.36,1);
  }
  .tp-status-chip:hover { transform: translateY(-1px); }
  .tp-chip-text { display: flex; flex-direction: column; line-height: 1.2; }
  .tp-chip-label { font-size: 0.78rem; font-weight: 800; }
  .tp-chip-sub   { font-size: 0.62rem; font-weight: 600; opacity: 0.72; }
  .tp-chip-count {
    font-size: 1rem; font-weight: 800;
    padding: 0 6px;
    border-radius: 6px;
    background: rgba(255,255,255,0.4);
    min-width: 28px; text-align: center;
  }

  /* Refresh button */
  .tp-refresh-btn {
    margin-left: auto;
    display: inline-flex; align-items: center; gap: 7px;
    padding: 9px 16px; border-radius: 12px;
    border: 1.5px solid #E5E7EB; background: #FFFFFF;
    font-family: 'Manrope', sans-serif; font-size: 0.8rem; font-weight: 700; color: #374151;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    transition: border-color 0.18s, transform 0.18s, box-shadow 0.18s;
  }
  .tp-refresh-btn:hover:not(:disabled) {
    border-color: #E8890C; color: #E8890C; transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(232,137,12,0.14);
  }
  .tp-refresh-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  /* ── Body layout (sidebar + grid) ─────────────── */
  .tp-body {
    display: grid;
    grid-template-columns: 160px 1fr;
    gap: 20px;
    animation: tpRise 0.46s 0.1s cubic-bezier(0.22,1,0.36,1) both;
  }
  @media (max-width: 720px) { .tp-body { grid-template-columns: 1fr; } }

  /* ── Sidebar ──────────────────────────────────── */
  .tp-sidebar {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .tp-sidebar-btn {
    display: block; width: 100%;
    padding: 9px 13px;
    border-radius: 10px;
    border: 1.5px solid transparent;
    background: transparent;
    font-family: 'Manrope', sans-serif;
    font-size: 0.8rem; font-weight: 700; color: #6B7280;
    cursor: pointer; text-align: left;
    transition: all 0.18s cubic-bezier(0.22,1,0.36,1);
  }
  .tp-sidebar-btn:hover { background: rgba(255,255,255,0.7); color: #111827; border-color: #E5E7EB; }
  .tp-sidebar-btn.active {
    background: #FFFFFF; color: #111827;
    border-color: #E5E7EB;
    box-shadow: 0 2px 8px rgba(0,0,0,0.07);
  }

  /* ── Card grid ────────────────────────────────── */
  .tp-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    align-content: start;
  }
  @media (max-width: 1060px) { .tp-grid { grid-template-columns: repeat(2,1fr); } }
  @media (max-width: 720px)  { .tp-grid { grid-template-columns: 1fr; } }

  /* ── Card ─────────────────────────────────────── */
  .tp-card {
    position: relative;
    background: #FFFFFF;
    border: 1.5px solid #E5E7EB;
    border-radius: 18px;
    padding: 16px;
    cursor: pointer;
    transition: transform 0.22s cubic-bezier(0.22,1,0.36,1), box-shadow 0.22s, border-color 0.2s;
    box-shadow: 0 1px 4px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.05);
    overflow: hidden;
  }
  .tp-card::after {
    content:''; position:absolute; left:0; top:0; bottom:0; width:3px;
    background: var(--accent, #E8890C);
    border-radius: 18px 0 0 18px;
    opacity:0; transition: opacity 0.2s;
  }
  .tp-card:hover { transform: translateY(-3px); box-shadow: 0 8px 28px rgba(0,0,0,0.12); border-color: #D1D5DB; }
  .tp-card:hover::after, .tp-card.active::after { opacity:1; }
  .tp-card.active { border-color: rgba(232,137,12,0.4); }

  .tp-card-top {
    display: flex; align-items: center; justify-content: space-between; gap:6px; margin-bottom:10px;
  }
  .tp-card-top-left { display:flex; align-items:center; gap:6px; }

  .tp-pill {
    display:inline-flex; align-items:center; gap:4px;
    padding: 3px 9px; border-radius:999px;
    font-size:0.65rem; font-weight:800; letter-spacing:0.02em;
    border: 1px solid;
  }
  .tp-card-time { font-size:0.68rem; font-weight:600; color:#9CA3AF; }

  .tp-card-title-row { display:flex; align-items:flex-start; justify-content:space-between; gap:8px; }
  .tp-card-title {
    font-family:'Cormorant Garamond', serif;
    font-size:1.1rem; font-weight:700; line-height:1.3; color:#111827;
    transition: color 0.18s; flex:1;
  }
  .tp-card:hover .tp-card-title { color: #E8890C; }
  .tp-card-arrow {
    color:#9CA3AF; flex-shrink:0; margin-top:2px;
    transition: color 0.18s, transform 0.22s cubic-bezier(0.34,1.56,0.64,1);
  }
  .tp-card:hover .tp-card-arrow { color:#E8890C; transform:translateX(3px); }

  .tp-card-preview {
    margin-top:8px; font-size:0.81rem; font-weight:500; color:#6B7280; line-height:1.6;
    display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;
  }

  .tp-card-footer {
    margin-top:14px; display:flex; align-items:center; justify-content:space-between; gap:8px;
  }
  .tp-card-author { display:flex; align-items:center; gap:6px; min-width:0; }
  .tp-avatar {
    width:28px; height:28px; border-radius:50%;
    background: linear-gradient(135deg,#E8890C,#C97508);
    color:#fff; font-size:0.62rem; font-weight:800;
    display:flex; align-items:center; justify-content:center; flex-shrink:0;
  }
  .tp-avatar img { width:100%; height:100%; border-radius:50%; object-fit:cover; }
  .tp-author-info { display:flex; flex-direction:column; line-height:1.2; min-width:0; }
  .tp-author-cat  { font-size:0.72rem; font-weight:800; color:#374151; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .tp-author-name { font-size:0.65rem; font-weight:600; color:#9CA3AF; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

  .tp-card-photos { display:flex; gap:4px; }
  .tp-card-photo {
    width:36px; height:36px; border-radius:6px; object-fit:cover;
    border:1px solid #E5E7EB; cursor:pointer;
    transition: transform 0.18s, box-shadow 0.18s;
  }
  .tp-card-photo:hover { transform:scale(1.06); box-shadow:0 4px 12px rgba(0,0,0,0.15); }

  .tp-view-btn {
    display:inline-flex; align-items:center; gap:3px;
    font-size:0.74rem; font-weight:800; color:#6B7280;
    background:none; border:none; cursor:pointer; white-space:nowrap;
    padding:4px 0;
    transition: color 0.18s, gap 0.18s;
  }
  .tp-card:hover .tp-view-btn { color:#E8890C; gap:6px; }

  /* ── Skeleton ─────────────────────────────────── */
  .tp-sk {
    border-radius:6px;
    background: linear-gradient(90deg,#F3F4F6 25%,#E9EBEE 50%,#F3F4F6 75%);
    background-size:200% 100%;
    animation: tpShimmer 1.4s ease-in-out infinite;
  }

  /* ── Empty ────────────────────────────────────── */
  .tp-empty {
    grid-column:1/-1; text-align:center; padding:60px 24px;
    border:1.5px dashed #D1D5DB; border-radius:18px;
    background:rgba(255,255,255,0.6);
  }
  .tp-empty-icon {
    width:52px; height:52px; border-radius:16px;
    background:#FFF3E0; color:#E8890C;
    display:inline-flex; align-items:center; justify-content:center; margin-bottom:12px;
  }
  .tp-empty h3 { font-size:1.05rem; font-weight:700; color:#111827; }
  .tp-empty p  { margin-top:6px; font-size:0.82rem; color:#9CA3AF; font-weight:500; }

  /* ── Load more ────────────────────────────────── */
  .tp-load-wrap { grid-column:1/-1; display:flex; justify-content:center; margin-top:8px; }
  .tp-load-btn {
    padding:10px 28px; border-radius:999px;
    border:1.5px solid #E5E7EB; background:#FFFFFF;
    font-family:'Manrope',sans-serif; font-size:0.82rem; font-weight:700; color:#374151;
    cursor:pointer;
    transition: border-color 0.18s, transform 0.18s, box-shadow 0.18s;
    box-shadow:0 2px 8px rgba(0,0,0,0.06);
  }
  .tp-load-btn:hover:not(:disabled) {
    border-color:#E8890C; color:#E8890C; transform:translateY(-1px);
    box-shadow:0 6px 16px rgba(232,137,12,0.14);
  }
  .tp-load-btn:disabled { opacity:0.5; cursor:not-allowed; }

  /* ── Error ────────────────────────────────────── */
  .tp-error {
    padding:10px 14px; border-radius:12px; margin-bottom:16px;
    border:1px solid #FECACA; background:#FEF2F2;
    color:#B91C1C; font-size:0.82rem; font-weight:700;
  }

  /* ── Compose form ─────────────────────────────── */
  .tp-form-wrap {
    grid-column:1/-1;
    background:#FFFFFF; border:1.5px solid #E5E7EB;
    border-radius:18px; padding:20px; margin-bottom:4px;
    box-shadow:0 4px 20px rgba(0,0,0,0.07);
    animation: tpRise 0.36s cubic-bezier(0.22,1,0.36,1) both;
  }
  .tp-form-title {
    font-family:'Cormorant Garamond',serif; font-size:1.3rem; font-weight:700; color:#111827; margin-bottom:14px;
  }
  .tp-form-row { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px; }
  @media (max-width:600px) { .tp-form-row { grid-template-columns:1fr; } }
  .tp-form-label { font-size:0.7rem; font-weight:800; color:#6B7280; letter-spacing:0.04em; text-transform:uppercase; margin-bottom:5px; }
  .tp-form-input, .tp-form-textarea {
    width:100%; border:1.5px solid #E5E7EB; border-radius:10px;
    padding:9px 12px; background:#FAFAFA;
    font-family:'Manrope',sans-serif; font-size:0.83rem; font-weight:600; color:#111827; outline:none;
    transition: border-color 0.18s, box-shadow 0.18s;
  }
  .tp-form-textarea { resize:vertical; min-height:90px; }
  .tp-form-input:focus, .tp-form-textarea:focus {
    border-color:#E8890C; box-shadow:0 0 0 3px rgba(232,137,12,0.12);
  }
  .tp-form-input::placeholder, .tp-form-textarea::placeholder { color:#9CA3AF; }
  .tp-form-actions { margin-top:12px; display:flex; align-items:center; gap:8px; flex-wrap:wrap; }

  .tp-btn-primary {
    position:relative; overflow:hidden; isolation:isolate;
    display:inline-flex; align-items:center; gap:7px;
    padding:9px 16px; border-radius:10px;
    border:1.5px solid rgba(232,137,12,0.4);
    background:rgba(255,248,240,0.9); color:#C97508;
    font-family:'Manrope',sans-serif; font-size:0.8rem; font-weight:800;
    cursor:pointer; z-index:0;
    transition: color 0.2s, border-color 0.2s, transform 0.22s cubic-bezier(0.22,1,0.36,1);
  }
  .tp-btn-primary::before {
    content:''; position:absolute; inset:0; z-index:-1;
    background:linear-gradient(135deg,#E8890C,#C97508);
    transform:scaleX(0); transform-origin:left center;
    transition: transform 0.3s cubic-bezier(0.22,1,0.36,1);
  }
  .tp-btn-primary:hover:not(:disabled) { color:#fff; border-color:#E8890C; transform:translateY(-1px); }
  .tp-btn-primary:hover:not(:disabled)::before { transform:scaleX(1); }
  .tp-btn-primary:disabled { opacity:0.5; cursor:not-allowed; }

  .tp-btn-ghost {
    display:inline-flex; align-items:center; gap:7px;
    padding:9px 16px; border-radius:10px;
    border:1.5px solid #E5E7EB; background:#FFFFFF; color:#6B7280;
    font-family:'Manrope',sans-serif; font-size:0.8rem; font-weight:700;
    cursor:pointer;
    transition: border-color 0.18s, color 0.18s, transform 0.18s;
  }
  .tp-btn-ghost:hover:not(:disabled) { border-color:#D1D5DB; color:#374151; transform:translateY(-1px); }

  /* ── Detail panel ─────────────────────────────── */
  .tp-overlay {
    position:fixed; inset:0; z-index:100;
    background:rgba(0,0,0,0.18); backdrop-filter:blur(2px);
    animation: tpRise 0.2s ease both;
  }
  .tp-detail {
    position:fixed; top:64px; right:0; bottom:0;
    width: min(440px,100vw);
    background:#FFFFFF; border-radius:24px 0 0 0;
    box-shadow: -8px 0 40px rgba(0,0,0,0.14);
    display:flex; flex-direction:column;
    animation: tpSlide 0.32s cubic-bezier(0.22,1,0.36,1) both;
    overflow:hidden; z-index:101;
  }
  .tp-detail-head {
    padding:18px 20px 14px;
    border-bottom:1px solid #F3F4F6;
    display:flex; align-items:center; gap:10px;
  }
  .tp-detail-close {
    margin-left:auto; flex-shrink:0;
    width:32px; height:32px; border-radius:50%;
    border:1.5px solid #E5E7EB; background:#F9FAFB;
    display:flex; align-items:center; justify-content:center;
    cursor:pointer; color:#6B7280;
    transition: border-color 0.18s, background 0.18s, transform 0.18s;
  }
  .tp-detail-close:hover { border-color:#E8890C; background:#FEF3C7; color:#E8890C; transform:rotate(90deg); }
  .tp-detail-body { flex:1; overflow-y:auto; padding:20px; }
  .tp-detail-title {
    font-family:'Cormorant Garamond',serif; font-size:1.45rem; font-weight:700; color:#111827; margin-bottom:10px;
  }
  .tp-detail-desc { font-size:0.86rem; color:#374151; line-height:1.75; font-weight:500; margin-bottom:14px; }
  .tp-detail-photos { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:14px; }
  .tp-detail-photo {
    width:80px; height:80px; border-radius:10px; object-fit:cover;
    border:1px solid #E5E7EB; cursor:pointer;
    transition: transform 0.18s;
  }
  .tp-detail-photo:hover { transform:scale(1.04); }
  .tp-detail-meta { font-size:0.76rem; color:#9CA3AF; font-weight:600; }
  .tp-detail-footer {
    padding:14px 20px 20px; border-top:1px solid #F3F4F6;
    display:flex; align-items:center; justify-content:space-between; gap:8px;
  }
  .tp-status-update {
    display:flex; gap:6px; flex-wrap:wrap; margin-top:14px;
  }
  .tp-status-pill-btn {
    padding:4px 10px; border-radius:999px; cursor:pointer;
    font-family:'Manrope',sans-serif; font-size:0.67rem; font-weight:800;
    border:1px solid; transition: transform 0.18s, box-shadow 0.18s;
  }
  .tp-status-pill-btn:hover { transform:translateY(-1px); box-shadow:0 4px 10px rgba(0,0,0,0.1); }

  /* ── Lightbox ─────────────────────────────────── */
  .tp-lightbox {
    position:fixed; inset:0; z-index:200;
    background:rgba(0,0,0,0.85); backdrop-filter:blur(8px);
    display:flex; align-items:center; justify-content:center;
  }
  .tp-lightbox img {
    max-height:85vh; max-width:90vw; border-radius:16px;
    box-shadow:0 24px 64px rgba(0,0,0,0.5);
  }
`;

/* ─── Pill component ──────────────────────────────────────────────── */
function StatusPill({ status }) {
  const c = STATUS_CFG[status] || STATUS_CFG.open;
  const Icon = c.Icon;
  return (
    <span className="tp-pill" style={{ color: c.color, background: c.bg, borderColor: c.border }}>
      <Icon size={10} />
      {c.label}
    </span>
  );
}

/* ─── Photo lightbox ──────────────────────────────────────────────── */
function Lightbox({ url, onClose }) {
  return (
    <div className="tp-lightbox" onClick={onClose}>
      <img src={url} alt="attachment" onClick={e => e.stopPropagation()} />
    </div>
  );
}

/* ─── Ticket card ─────────────────────────────────────────────────── */
function TCard({ item, active, onOpen, delay }) {
  const cfg = STATUS_CFG[item.status] || STATUS_CFG.open;
  return (
    <article
      className={`tp-card tp-enter${active ? " active" : ""}`}
      style={{ animationDelay: `${delay}ms`, "--accent": cfg.accent }}
      onClick={() => onOpen(item)}
    >
      <div className="tp-card-top">
        <div className="tp-card-top-left">
          <StatusPill status={item.status} />
          <span className="tp-card-time">{timeAgo(item.createdAt)}</span>
        </div>
      </div>

      <div className="tp-card-title-row">
        <h3 className="tp-card-title">{item.title}</h3>
        <ChevronRight size={16} className="tp-card-arrow" />
      </div>

      <p className="tp-card-preview">{item.description || "No description provided"}</p>

      <div className="tp-card-footer">
        <div className="tp-card-author">
          <span className="tp-avatar">{(item.createdBy?.fullName || "R")[0].toUpperCase()}</span>
          <div className="tp-author-info">
            <span className="tp-author-cat">{item.category || "General"}</span>
            <span className="tp-author-name">{item.createdBy?.fullName || "Resident"} · {timeAgo(item.createdAt)}</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {item.photos?.slice(0, 2).map((url, i) => (
            <img key={i} src={url} alt="" className="tp-card-photo" onClick={e => e.stopPropagation()} />
          ))}
          <button type="button" className="tp-view-btn" onClick={e => { e.stopPropagation(); onOpen(item); }}>
            View Details <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </article>
  );
}

/* ─── Skeleton card ───────────────────────────────────────────────── */
function SkCard({ delay }) {
  return (
    <div className="tp-card tp-enter" style={{ animationDelay: `${delay}ms`, cursor: "default" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <div className="tp-sk" style={{ width: 70, height: 20, borderRadius: 999 }} />
        <div className="tp-sk" style={{ width: 50, height: 12, marginTop: 4 }} />
      </div>
      <div className="tp-sk" style={{ width: "72%", height: 18, marginBottom: 8 }} />
      <div className="tp-sk" style={{ width: "88%", height: 12, marginBottom: 6 }} />
      <div className="tp-sk" style={{ width: "60%", height: 12 }} />
      <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
        <div className="tp-sk" style={{ width: 28, height: 28, borderRadius: "50%" }} />
        <div className="tp-sk" style={{ width: 90, height: 12, marginTop: 8 }} />
      </div>
    </div>
  );
}

/* ─── Detail panel ────────────────────────────────────────────────── */
function DetailPanel({ item, onClose, onStatusUpdate, canUpdateStatus }) {
  const [lightbox, setLightbox] = useState(null);
  const cfg = STATUS_CFG[item.status] || STATUS_CFG.open;

  return (
    <>
      <div className="tp-overlay" onClick={onClose} />
      <div className="tp-detail">
        <div className="tp-detail-head">
          <StatusPill status={item.status} />
          <span style={{ fontSize: "0.72rem", color: "#9CA3AF", fontWeight: 600 }}>{timeAgo(item.createdAt)}</span>
          <button type="button" className="tp-detail-close" onClick={onClose}><X size={14} /></button>
        </div>
        <div className="tp-detail-body">
          <h2 className="tp-detail-title">{item.title}</h2>
          <p className="tp-detail-desc">{item.description}</p>

          {item.photos?.length > 0 && (
            <div className="tp-detail-photos">
              {item.photos.map((url, i) => (
                <img key={i} src={url} alt={`photo ${i+1}`} className="tp-detail-photo" onClick={() => setLightbox(url)} />
              ))}
            </div>
          )}

          <p className="tp-detail-meta">Category: {item.category || "General"}</p>

          {canUpdateStatus && (
            <div>
              <p style={{ fontSize: "0.7rem", fontWeight: 800, color: "#9CA3AF", marginTop: 16, marginBottom: 8 }}>MOVE TO</p>
              <div className="tp-status-update">
                {STATUS_OPTIONS.filter(s => s !== item.status).map(s => {
                  const sc = STATUS_CFG[s];
                  return (
                    <button key={s} className="tp-status-pill-btn"
                      style={{ color: sc.color, background: sc.bg, borderColor: sc.border }}
                      onClick={() => onStatusUpdate(item._id, s)}
                    >
                      {sc.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="tp-detail-footer">
          <div className="tp-card-author">
            <span className="tp-avatar">{(item.createdBy?.fullName || "R")[0].toUpperCase()}</span>
            <div className="tp-author-info">
              <span className="tp-author-cat">{item.createdBy?.fullName || "Resident"}</span>
              <span className="tp-author-name">{item.category || "General"}</span>
            </div>
          </div>
        </div>
      </div>

      {lightbox && <Lightbox url={lightbox} onClose={() => setLightbox(null)} />}
    </>
  );
}

/* ─── Main page ───────────────────────────────────────────────────── */
export function TicketsPage() {
  const { token, user } = useAuth();
  const [items,       setItems]       = useState([]);
  const [title,       setTitle]       = useState("");
  const [description, setDesc]        = useState("");
  const [category,    setCategory]    = useState("General");
  const [photoFiles,  setPhotoFiles]  = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error,       setError]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [showForm,    setShowForm]    = useState(false);
  const [activeStatus,   setActiveStatus]   = useState("All");
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedItem,   setSelectedItem]   = useState(null);
  const [visibleCount,   setVisibleCount]   = useState(9);

  const canUpdateStatus = useMemo(
    () => ["committee", "staff", "super_admin"].includes(user?.role),
    [user?.role],
  );

  /* ── Counts ─────────────────────────────────── */
  const openCount     = useMemo(() => items.filter(t => t.status === "open").length,                              [items]);
  const inProgCount   = useMemo(() => items.filter(t => t.status === "in_progress").length,                       [items]);
  const resolvedCount = useMemo(() => items.filter(t => ["resolved","closed"].includes(t.status)).length,         [items]);

  /* ── Sidebar categories ──────────────────────── */
  const categories = useMemo(() => {
    const cats = [...new Set(items.map(t => t.category).filter(Boolean))];
    return ["All", ...cats];
  }, [items]);

  /* ── Filtered items ──────────────────────────── */
  const filteredItems = useMemo(() => items.filter(item => {
    const statusOk = activeStatus === "All" ||
      (activeStatus === "resolved" ? ["resolved","closed"].includes(item.status) : item.status === activeStatus);
    const catOk = activeCategory === "All" || item.category === activeCategory;
    return statusOk && catOk;
  }), [items, activeStatus, activeCategory]);

  const visibleItems = filteredItems.slice(0, visibleCount);
  const hasMore      = filteredItems.length > visibleCount;

  /* ── API calls ───────────────────────────────── */
  async function loadItems() {
    setLoading(true); setError("");
    try {
      const data = await apiRequest("/tickets", { token });
      setItems(data.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault(); setError("");
    try {
      let photos = [];
      if (photoFiles.length > 0) {
        setIsUploading(true);
        const fd = new FormData();
        photoFiles.forEach(f => fd.append("photos", f));
        const up = await apiRequest("/tickets/upload-photos", { method: "POST", token, formData: fd });
        photos = up.urls || [];
        setIsUploading(false);
      }
      const data = await apiRequest("/tickets", { method: "POST", token, body: { title, description, category, photos } });
      setItems(prev => [data.item, ...prev]);
      setTitle(""); setDesc(""); setCategory("General"); setPhotoFiles([]); setShowForm(false);
    } catch (err) {
      setIsUploading(false); setError(err.message);
    }
  }

  async function handleStatusUpdate(ticketId, status) {
    setError("");
    try {
      const data = await apiRequest(`/tickets/${ticketId}/status`, { method: "PATCH", token, body: { status } });
      setItems(prev => prev.map(i => i._id === ticketId ? { ...i, ...data.item } : i));
      if (selectedItem?._id === ticketId) setSelectedItem(prev => ({ ...prev, ...data.item }));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { loadItems(); }, []);

  /* ── Status chips config ────────────────────── */
  const STATUS_CHIPS = [
    { key: "All",         label: "All",        sub: "Tickets", Icon: Ticket,        count: items.length,  inactiveBg: "#F3F4F6", inactiveColor: "#4B5563", activeBg: "#111827", activeColor: "#fff" },
    { key: "open",        label: "Open",        sub: "Ticket",  Icon: Ticket,        count: openCount,     inactiveBg: "#DBEAFE", inactiveColor: "#1E3A8A", activeBg: "#2563EB", activeColor: "#fff" },
    { key: "in_progress", label: "In Progress", sub: "Amber",   Icon: Clock,         count: inProgCount,   inactiveBg: "#FEF3C7", inactiveColor: "#78350F", activeBg: "#D97706", activeColor: "#fff" },
    { key: "resolved",    label: "Resolved",    sub: "Resolved",Icon: BookmarkCheck, count: resolvedCount, inactiveBg: "#DCFCE7", inactiveColor: "#14532D", activeBg: "#16A34A", activeColor: "#fff" },
  ];

  return (
    <>
      <style>{CSS}</style>
      <div className="tp-root">
        <div className="tp-shell">

          {/* ── Page heading ──────────────────── */}
          <div className="tp-page-head">
            <div>
              <h1 className="tp-title">
                My Tickets<span className="tp-title-dot">.</span>
              </h1>
              <p className="tp-subtitle">
                Track ongoing complaints, see status updates, and raise new issues with photo evidence in one streamlined flow.
              </p>
            </div>

            <button type="button" className="tp-raise-btn" onClick={() => setShowForm(v => !v)}>
              {showForm ? "Cancel" : "Raise Ticket"}
              <span className="tp-raise-icon">
                {showForm ? <X size={14} /> : <Plus size={14} />}
              </span>
            </button>
          </div>

          {/* ── Controls row ──────────────────── */}
          <div className="tp-controls">
            {STATUS_CHIPS.map(({ key, label, sub, Icon, count, inactiveBg, inactiveColor, activeBg, activeColor }) => {
              const active = activeStatus === key;
              return (
                <button
                  key={key}
                  type="button"
                  className="tp-status-chip"
                  style={{
                    background:  active ? activeBg   : inactiveBg,
                    color:       active ? activeColor : inactiveColor,
                    borderColor: active ? activeBg   : "transparent",
                  }}
                  onClick={() => setActiveStatus(key)}
                >
                  <Icon size={13} />
                  <span className="tp-chip-text">
                    <span className="tp-chip-label">{label}</span>
                    <span className="tp-chip-sub">{sub}</span>
                  </span>
                  <span className="tp-chip-count">{count}</span>
                </button>
              );
            })}

            <button type="button" className="tp-refresh-btn" onClick={loadItems} disabled={loading}>
              <RefreshCw size={13} style={{ animation: loading ? "tpSpin 1s linear infinite" : "none" }} />
              Refresh Feed
            </button>
          </div>

          {error && <div className="tp-error">{error}</div>}

          {/* ── Body ──────────────────────────── */}
          <div className="tp-body">
            {/* Sidebar */}
            <aside className="tp-sidebar">
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  className={`tp-sidebar-btn${activeCategory === cat ? " active" : ""}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </aside>

            {/* Grid */}
            <div className="tp-grid">
              {/* Compose form */}
              {showForm && (
                <div className="tp-form-wrap">
                  <h2 className="tp-form-title">Raise a Complaint</h2>
                  <form onSubmit={handleCreate}>
                    <div className="tp-form-row">
                      <div>
                        <p className="tp-form-label">Title</p>
                        <input className="tp-form-input" placeholder="e.g. Leaking pipe under kitchen sink"
                          value={title} onChange={e => setTitle(e.target.value)} required />
                      </div>
                      <div>
                        <p className="tp-form-label">Category</p>
                        <input className="tp-form-input" placeholder="e.g. Plumbing, Electrical"
                          value={category} onChange={e => setCategory(e.target.value)} />
                      </div>
                    </div>
                    <div style={{ marginBottom: 10 }}>
                      <p className="tp-form-label">Description</p>
                      <textarea className="tp-form-textarea" placeholder="Describe the issue in detail..."
                        value={description} onChange={e => setDesc(e.target.value)} required />
                    </div>
                    <div>
                      <p className="tp-form-label">Photos (up to 3, max 5 MB each)</p>
                      <input className="tp-form-input" type="file" accept="image/*" multiple
                        onChange={e => setPhotoFiles(Array.from(e.target.files).slice(0, 3))} />
                      {photoFiles.length > 0 && (
                        <p style={{ fontSize: "0.74rem", color: "#9CA3AF", marginTop: 5 }}>
                          {photoFiles.length} file{photoFiles.length > 1 ? "s" : ""} selected
                        </p>
                      )}
                    </div>
                    <div className="tp-form-actions">
                      <button type="submit" className="tp-btn-primary" disabled={isUploading}>
                        <Ticket size={13} />
                        {isUploading ? "Uploading..." : "Submit Ticket"}
                      </button>
                      <button type="button" className="tp-btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                    </div>
                  </form>
                </div>
              )}

              {loading && [0,1,2,3,4,5].map(i => <SkCard key={i} delay={i * 50} />)}

              {!loading && filteredItems.length === 0 && (
                <div className="tp-empty tp-enter">
                  <div className="tp-empty-icon"><Ticket size={22} /></div>
                  <h3>No tickets found</h3>
                  <p>{activeStatus !== "All" || activeCategory !== "All" ? "Try changing your filters." : "Raise a complaint and track its progress here."}</p>
                </div>
              )}

              {!loading && visibleItems.map((item, idx) => (
                <TCard
                  key={item._id}
                  item={item}
                  active={selectedItem?._id === item._id}
                  onOpen={setSelectedItem}
                  delay={idx * 35}
                />
              ))}

              {!loading && hasMore && (
                <div className="tp-load-wrap">
                  <button type="button" className="tp-load-btn" onClick={() => setVisibleCount(v => v + 9)}>
                    Load more
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Detail panel ──────────────────── */}
        {selectedItem && (
          <DetailPanel
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            onStatusUpdate={handleStatusUpdate}
            canUpdateStatus={canUpdateStatus}
          />
        )}
      </div>
    </>
  );
}
