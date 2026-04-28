import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "../components/api";
import { useAuth } from "../components/AuthContext";
import { BookmarkCheck, ChevronRight, Clock, Plus, RefreshCw, Tag, Ticket, X } from "lucide-react";

const C = {
  bg: "#FAFAFC",
  surface: "#FFFFFF",
  ink: "#1C1C1E",
  ink2: "#3A3A3C",
  muted: "#6B7280",
  faint: "#9CA3AF",
  border: "#E8E8ED",
  borderL: "#F0F0F5",
  indigo: "#4F46E5",
  indigoD: "#4338CA",
  indigoL: "#EEF2FF",
  indigoBr: "#C7D2FE",
  red: "#DC2626",
  redL: "#FEF2F2",
  redBr: "#FECACA",
  amber: "#F59E0B",
  amberD: "#D97706",
  amberL: "#FFFBEB",
  amberBr: "#FCD34D",
  green: "#16A34A",
  greenL: "#DCFCE7",
  greenBr: "#86EFAC",
};

/* ─── Status config ───────────────────────────────────────────────── */
const STATUS_CFG = {
  in_progress: {
    label: "In Progress",
    Icon: Clock,
    color: C.amberD,
    bg: C.amberL,
    border: C.amberBr,
    accent: C.amberD,
  },
  resolved: {
    label: "Resolved",
    Icon: BookmarkCheck,
    color: C.green,
    bg: C.greenL,
    border: C.greenBr,
    accent: C.green,
  },
};

/* ─── Helpers ─────────────────────────────────────────────────────── */
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

/* ─── Motion config ───────────────────────────────────────────────── */
const spring = { type: "spring", stiffness: 320, damping: 26, mass: 0.85 };

const pageStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const rise = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.42, ease: "easeOut" } },
};

const gridStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const cardIn = {
  hidden: { opacity: 0, y: 14, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: "easeOut" } },
};

/* ─── CSS ─────────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  .tp-root * { box-sizing: border-box; margin: 0; padding: 0; }

  .tp-root {
    min-height: calc(100vh - 64px);
    padding: 32px 24px 80px;
    background: ${C.bg};
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: ${C.ink};
  }

  .tp-shell { max-width: 1240px; margin: 0 auto; }

  .tp-page-head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    margin-bottom: 18px;
  }

  .tp-title {
    font-size: clamp(1.6rem, 2.8vw, 2.1rem);
    font-weight: 800;
    letter-spacing: -0.5px;
    color: ${C.ink};
    line-height: 1.15;
  }

  .tp-title-dot { color: ${C.indigo}; }

  .tp-subtitle {
    margin-top: 6px;
    color: ${C.muted};
    font-size: 0.82rem;
    font-weight: 500;
    max-width: 62ch;
    line-height: 1.6;
  }

  .tp-raise-btn {
    position: relative;
    overflow: hidden;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border-radius: 10px;
    border: 1px solid ${C.border};
    background: ${C.surface};
    padding: 9px 14px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.8rem;
    font-weight: 700;
    color: ${C.ink};
    cursor: pointer;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
  }

  .tp-raise-btn::after {
    content: '';
    position: absolute;
    left: 8px;
    right: 8px;
    bottom: 0;
    height: 2px;
    border-radius: 999px;
    background: ${C.indigo};
    transform: scaleX(0.2);
    opacity: 0;
    transition: transform 0.2s ease, opacity 0.2s ease;
  }

  .tp-raise-btn:hover {
    border-color: #C7C7CC;
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(28,28,30,0.09);
  }

  .tp-raise-btn:hover::after {
    transform: scaleX(1);
    opacity: 1;
  }

  .tp-raise-btn:active { transform: scale(0.97); }

  .tp-raise-icon {
    width: 24px;
    height: 24px;
    border-radius: 999px;
    background: #F3F4F6;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .tp-controls {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 20px;
  }

  .tp-chips-rail {
    display: inline-flex;
    align-items: stretch;
    border-bottom: 1.5px solid ${C.border};
  }

  .tp-status-chip {
    position: relative;
    display: inline-flex;
    align-items: center;
    border: none;
    background: transparent;
    cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.77rem;
    font-weight: 700;
    color: ${C.muted};
    padding: 0;
  }

  .tp-status-chip.active { color: ${C.ink}; }

  .tp-chip-active-bg {
    position: absolute;
    left: 12px;
    right: 12px;
    bottom: -1.5px;
    height: 2px;
    border-radius: 2px 2px 0 0;
    background: ${C.indigo};
  }

  .tp-chip-inner {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px 9px;
  }

  .tp-chip-count {
    font-size: 0.66rem;
    font-weight: 800;
    color: ${C.faint};
    background: #F3F4F6;
    border: 1px solid ${C.border};
    border-radius: 999px;
    min-width: 22px;
    text-align: center;
    padding: 1px 6px;
  }

  .tp-refresh-btn {
    margin-left: auto;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 9px 14px;
    border-radius: 10px;
    border: 1px solid ${C.border};
    background: ${C.surface};
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.8rem;
    font-weight: 700;
    color: ${C.ink};
    cursor: pointer;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
  }

  .tp-refresh-btn:hover:not(:disabled) {
    border-color: #C7C7CC;
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(28,28,30,0.09);
  }

  .tp-refresh-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .tp-body {
    display: block;
  }

  @media (max-width: 780px) {
    .tp-refresh-btn { margin-left: 0; }
  }

  .tp-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
    align-content: start;
  }

  @media (max-width: 1100px) { .tp-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 780px) { .tp-grid { grid-template-columns: 1fr; } }

  .tp-card {
    position: relative;
    background: ${C.surface};
    border: 1px solid ${C.border};
    border-radius: 16px;
    padding: 14px;
    cursor: pointer;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.04);
    overflow: hidden;
  }

  .tp-card::after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: var(--accent, ${C.indigo});
    opacity: 0;
    transition: opacity 0.2s;
  }

  .tp-card:hover::after, .tp-card.active::after { opacity: 1; }

  .tp-card-top { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }

  .tp-pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 9px;
    border-radius: 999px;
    font-size: 0.64rem;
    font-weight: 800;
    letter-spacing: 0.02em;
    border: 1px solid;
  }

  .tp-card-time { font-size: 0.67rem; font-weight: 600; color: ${C.faint}; }

  .tp-card-title-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
  }

  .tp-card-title {
    font-size: 0.92rem;
    font-weight: 700;
    line-height: 1.35;
    color: ${C.ink};
    letter-spacing: -0.2px;
    transition: color 0.18s;
    flex: 1;
  }

  .tp-card:hover .tp-card-title { color: ${C.indigo}; }

  .tp-card-arrow {
    color: ${C.faint};
    flex-shrink: 0;
    margin-top: 2px;
    transition: color 0.18s, transform 0.2s;
  }

  .tp-card:hover .tp-card-arrow { color: ${C.indigo}; transform: translateX(2px); }

  .tp-card-preview {
    margin-top: 8px;
    font-size: 0.76rem;
    font-weight: 400;
    color: ${C.muted};
    line-height: 1.6;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .tp-card-footer {
    margin-top: 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .tp-card-author { display: flex; align-items: center; gap: 7px; min-width: 0; }

  .tp-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: ${C.ink};
    color: #fff;
    font-size: 0.62rem;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .tp-author-info { display: flex; flex-direction: column; line-height: 1.2; min-width: 0; }
  .tp-author-cat { font-size: 0.72rem; font-weight: 700; color: ${C.ink2}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .tp-author-name { font-size: 0.65rem; font-weight: 400; color: ${C.faint}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .tp-card-photos { display: flex; gap: 4px; }
  .tp-card-photo {
    width: 36px;
    height: 36px;
    border-radius: 6px;
    object-fit: cover;
    border: 1px solid ${C.border};
    cursor: pointer;
    transition: transform 0.18s, box-shadow 0.18s;
  }

  .tp-card-photo:hover { transform: scale(1.05); box-shadow: 0 4px 12px rgba(0,0,0,0.14); }

  .tp-view-btn {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 0.73rem;
    font-weight: 800;
    color: ${C.muted};
    background: none;
    border: none;
    cursor: pointer;
    white-space: nowrap;
    padding: 4px 0;
    transition: color 0.18s, gap 0.18s;
  }

  .tp-card:hover .tp-view-btn { color: ${C.indigo}; gap: 6px; }

  .tp-sk {
    border-radius: 6px;
    background: #ECEFF4;
  }

  .tp-empty {
    grid-column: 1/-1;
    text-align: center;
    padding: 56px 24px;
    border: 1px dashed #D1D5DB;
    border-radius: 16px;
    background: ${C.surface};
  }

  .tp-empty-icon {
    width: 52px;
    height: 52px;
    border-radius: 16px;
    background: ${C.indigoL};
    color: ${C.indigo};
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 12px;
  }

  .tp-empty h3 { font-size: 1.02rem; font-weight: 700; color: ${C.ink}; }
  .tp-empty p { margin-top: 6px; font-size: 0.82rem; color: ${C.faint}; font-weight: 500; }

  .tp-load-wrap { grid-column: 1/-1; display: flex; justify-content: center; margin-top: 8px; }

  .tp-load-btn {
    padding: 10px 24px;
    border-radius: 999px;
    border: 1px solid ${C.border};
    background: ${C.surface};
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.8rem;
    font-weight: 700;
    color: ${C.ink2};
    cursor: pointer;
    transition: border-color 0.18s, transform 0.18s, box-shadow 0.18s;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }

  .tp-load-btn:hover:not(:disabled) {
    border-color: #C7C7CC;
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(28,28,30,0.09);
  }

  .tp-load-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .tp-error {
    padding: 10px 14px;
    border-radius: 12px;
    margin-bottom: 16px;
    border: 1px solid ${C.redBr};
    background: ${C.redL};
    color: #B91C1C;
    font-size: 0.82rem;
    font-weight: 700;
  }

  .tp-form-wrap {
    grid-column: 1/-1;
    background: ${C.surface};
    border: 1px solid ${C.border};
    border-radius: 16px;
    padding: 18px;
    margin-bottom: 4px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.06);
  }

  .tp-form-title {
    font-size: 1.03rem;
    font-weight: 800;
    color: ${C.ink};
    margin-bottom: 12px;
    letter-spacing: -0.02em;
  }

  .tp-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
  @media (max-width: 600px) { .tp-form-row { grid-template-columns: 1fr; } }

  .tp-form-label {
    font-size: 0.7rem;
    font-weight: 800;
    color: ${C.faint};
    letter-spacing: 0.04em;
    text-transform: uppercase;
    margin-bottom: 5px;
  }

  .tp-form-input, .tp-form-textarea {
    width: 100%;
    border: 1px solid ${C.border};
    border-radius: 10px;
    padding: 9px 12px;
    background: #FAFAFA;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.83rem;
    font-weight: 600;
    color: ${C.ink};
    outline: none;
    transition: border-color 0.18s, box-shadow 0.18s;
  }

  .tp-form-textarea { resize: vertical; min-height: 90px; }

  .tp-form-input:focus, .tp-form-textarea:focus {
    border-color: ${C.indigoBr};
    box-shadow: 0 0 0 3px rgba(79,70,229,0.12);
  }

  .tp-form-input::placeholder, .tp-form-textarea::placeholder { color: ${C.faint}; }

  .tp-form-actions { margin-top: 12px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

  .tp-btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 9px 16px;
    border-radius: 10px;
    border: 1.5px solid #E8890C;
    background: #E8890C;
    color: #fff;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.8rem;
    font-weight: 800;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 2px 8px rgba(232,137,12,0.28);
  }

  .tp-btn-primary:hover:not(:disabled) {
    background: #C97508;
    border-color: #C97508;
    transform: translateY(-1px);
    box-shadow: 0 4px 14px rgba(232,137,12,0.36);
  }

  .tp-btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }

  .tp-btn-ghost {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 9px 16px;
    border-radius: 10px;
    border: 1px solid ${C.border};
    background: ${C.surface};
    color: ${C.muted};
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    transition: border-color 0.18s, color 0.18s, transform 0.18s;
  }

  .tp-btn-ghost:hover:not(:disabled) { border-color: #D1D5DB; color: ${C.ink2}; transform: translateY(-1px); }

  .tp-modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 100;
    background: rgba(15,23,42,0.34);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
  }

  .tp-modal-shell {
    position: fixed;
    inset: 0;
    z-index: 101;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    pointer-events: none;
  }

  .tp-modal {
    width: min(760px, 96vw);
    max-height: min(88vh, 860px);
    background: ${C.surface};
    border: 1px solid ${C.border};
    border-radius: 18px;
    box-shadow: 0 28px 80px rgba(15,23,42,0.25);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    pointer-events: auto;
  }

  .tp-modal-head {
    padding: 16px 18px;
    border-bottom: 1px solid ${C.borderL};
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .tp-modal-close {
    margin-left: auto;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: 1px solid ${C.border};
    background: #F9FAFB;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: ${C.muted};
    transition: all 0.18s;
  }

  .tp-modal-close:hover { border-color: #C7C7CC; color: ${C.ink}; transform: rotate(90deg); }

  .tp-modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 18px;
  }

  .tp-detail-title {
    font-size: 1.24rem;
    font-weight: 800;
    color: ${C.ink};
    margin-bottom: 10px;
    letter-spacing: -0.02em;
  }

  .tp-detail-desc {
    font-size: 0.86rem;
    color: ${C.ink2};
    line-height: 1.72;
    font-weight: 500;
    margin-bottom: 14px;
  }

  .tp-detail-photos { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }

  .tp-detail-photo {
    width: 80px;
    height: 80px;
    border-radius: 10px;
    object-fit: cover;
    border: 1px solid ${C.border};
    cursor: pointer;
    transition: transform 0.18s;
  }

  .tp-detail-photo:hover { transform: scale(1.04); }

  .tp-detail-meta { font-size: 0.76rem; color: ${C.faint}; font-weight: 600; }

  .tp-status-update { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 14px; }

  .tp-status-pill-btn {
    padding: 4px 10px;
    border-radius: 999px;
    cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.67rem;
    font-weight: 800;
    border: 1px solid;
    transition: transform 0.18s, box-shadow 0.18s;
  }

  .tp-status-pill-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 10px rgba(0,0,0,0.1); }

  .tp-modal-foot {
    padding: 14px 18px 18px;
    border-top: 1px solid ${C.borderL};
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .tp-lightbox {
    position: fixed;
    inset: 0;
    z-index: 200;
    background: rgba(0,0,0,0.85);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .tp-lightbox img {
    max-height: 85vh;
    max-width: 90vw;
    border-radius: 16px;
    box-shadow: 0 24px 64px rgba(0,0,0,0.5);
  }
`;

/* ─── Pill component ──────────────────────────────────────────────── */
function StatusPill({ status }) {
  const c = STATUS_CFG[status] || STATUS_CFG.in_progress;
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
      <img src={url} alt="attachment" onClick={(e) => e.stopPropagation()} />
    </div>
  );
}

/* ─── Ticket card ─────────────────────────────────────────────────── */
function TCard({ item, active, onOpen }) {
  const cfg = STATUS_CFG[item.status] || STATUS_CFG.in_progress;

  return (
    <motion.article
      layoutId={`ticket-${item._id}`}
      className={`tp-card${active ? " active" : ""}`}
      style={{ "--accent": cfg.accent }}
      onClick={() => onOpen(item)}
      variants={cardIn}
      whileHover={{ y: -3, boxShadow: "0 10px 24px rgba(0,0,0,0.12)", borderColor: "#D1D5DB" }}
      whileTap={{ scale: 0.98 }}
      transition={spring}
    >
      <div className="tp-card-top">
        <StatusPill status={item.status} />
        <span className="tp-card-time">{timeAgo(item.createdAt)}</span>
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
            <span className="tp-author-cat">{item.createdBy?.fullName || "Resident"}</span>
            <span className="tp-author-name">{timeAgo(item.createdAt)}</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {item.photos?.slice(0, 2).map((url, i) => (
            <img key={i} src={url} alt="" className="tp-card-photo" onClick={(e) => e.stopPropagation()} />
          ))}
          <button type="button" className="tp-view-btn" onClick={(e) => { e.stopPropagation(); onOpen(item); }}>
            View Details <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </motion.article>
  );
}

/* ─── Skeleton card ───────────────────────────────────────────────── */
function SkCard() {
  return (
    <div className="tp-card" style={{ cursor: "default" }}>
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

/* ─── Smart modal detail ─────────────────────────────────────────── */
function DetailPanel({ item, onClose, onStatusUpdate, canUpdateStatus }) {
  const [lightbox,        setLightbox]        = useState(null);
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [resolutionDesc,  setResolutionDesc]  = useState("");
  const [resPhotos,       setResPhotos]       = useState([]);
  const [resPhotoUrls,    setResPhotoUrls]    = useState([]);
  const [uploading,       setUploading]       = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <motion.div
        className="tp-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        onClick={onClose}
      />

      <div className="tp-modal-shell">
        <motion.section
          layoutId={`ticket-${item._id}`}
          className="tp-modal"
          transition={spring}
        >
          <div className="tp-modal-head">
            <StatusPill status={item.status} />
            <span style={{ fontSize: "0.72rem", color: C.faint, fontWeight: 600 }}>{timeAgo(item.createdAt)}</span>
            <button type="button" className="tp-modal-close" onClick={onClose}><X size={14} /></button>
          </div>

          <div className="tp-modal-body">
            <h2 className="tp-detail-title">{item.title}</h2>
            <p className="tp-detail-desc">{item.description}</p>

            {item.photos?.length > 0 && (
              <div className="tp-detail-photos">
                {item.photos.map((url, i) => (
                  <img key={i} src={url} alt={`photo ${i + 1}`} className="tp-detail-photo" onClick={() => setLightbox(url)} />
                ))}
              </div>
            )}


            {/* Resolution display for resolved tickets */}
            {item.status === "resolved" && item.resolution?.description && (
              <div style={{ marginTop: 16, padding: "12px 14px", background: C.greenL, border: `1px solid ${C.greenBr}`, borderRadius: 12 }}>
                <p style={{ margin: "0 0 6px", fontSize: "0.68rem", fontWeight: 800, color: C.green, textTransform: "uppercase", letterSpacing: "0.06em" }}>Resolution</p>
                <p style={{ margin: 0, fontSize: "0.83rem", color: C.ink, fontWeight: 500, lineHeight: 1.55 }}>{item.resolution.description}</p>
                {item.resolution.photos?.length > 0 && (
                  <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                    {item.resolution.photos.map((url, i) => (
                      <img key={i} src={url} alt="" onClick={() => setLightbox(url)}
                        style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8, border: `1px solid ${C.greenBr}`, cursor: "pointer" }} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Resolve button */}
            {canUpdateStatus && item.status === "in_progress" && (
              <div style={{ marginTop: 16 }}>
                <button
                  onClick={() => setShowResolveForm(true)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "8px 13px", borderRadius: 10,
                    background: C.indigo, color: "#fff", border: "none",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: "0.76rem", fontWeight: 800, cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(79,70,229,0.3)",
                    transition: "background 0.18s, transform 0.18s, box-shadow 0.18s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = C.indigoD; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 16px rgba(79,70,229,0.38)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = C.indigo; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 12px rgba(79,70,229,0.3)"; }}
                >
                  <BookmarkCheck size={13} /> Mark as Resolved
                </button>
              </div>
            )}

            {/* Resolution popup */}
            <AnimatePresence>
              {showResolveForm && (
                <>
                  <motion.div
                    key="resolve-backdrop"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => { setShowResolveForm(false); setResolutionDesc(""); setResPhotos([]); }}
                    style={{ position: "fixed", inset: 0, background: "rgba(28,28,30,0.45)", backdropFilter: "blur(6px)", zIndex: 600 }}
                  />
                  <div
                    key="resolve-popup-wrap"
                    style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 610, pointerEvents: "none" }}
                  >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.94, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.94, y: 16 }}
                    transition={{ type: "spring", stiffness: 340, damping: 28 }}
                    style={{
                      width: "min(480px, 92vw)",
                      background: "#fff", borderRadius: 20,
                      boxShadow: "0 24px 64px rgba(28,28,30,0.18)",
                      padding: "28px",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      pointerEvents: "all",
                    }}
                  >
                    {/* Header */}
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: C.ink, letterSpacing: "-0.02em" }}>Mark as Resolved</h3>
                        <p style={{ margin: "4px 0 0", fontSize: "0.78rem", color: C.muted, fontWeight: 500 }}>{item.title}</p>
                      </div>
                      <button
                        onClick={() => { setShowResolveForm(false); setResolutionDesc(""); setResPhotos([]); }}
                        style={{ width: 32, height: 32, borderRadius: "50%", border: `1px solid ${C.border}`, background: C.bg, color: C.muted, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
                      ><X size={13} /></button>
                    </div>

                    {/* Description */}
                    <div style={{ marginBottom: 14 }}>
                      <p style={{ margin: "0 0 6px", fontSize: "0.68rem", fontWeight: 800, color: C.faint, textTransform: "uppercase", letterSpacing: "0.07em" }}>What was done</p>
                      <textarea
                        style={{ width: "100%", minHeight: 100, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "0.85rem", color: C.ink, outline: "none", resize: "vertical", boxSizing: "border-box", transition: "border-color 0.18s" }}
                        placeholder="Description"
                        value={resolutionDesc}
                        onChange={e => setResolutionDesc(e.target.value)}
                        onFocus={e => e.target.style.borderColor = C.indigoBr}
                        onBlur={e => e.target.style.borderColor = C.border}
                      />
                    </div>

                    {/* Photos */}
                    <div style={{ marginBottom: 20 }}>
                      <p style={{ margin: "0 0 6px", fontSize: "0.68rem", fontWeight: 800, color: C.faint, textTransform: "uppercase", letterSpacing: "0.07em" }}>Photos (optional)</p>
                      <input type="file" accept="image/*" multiple style={{ fontSize: "0.78rem", width: "100%" }}
                        onChange={e => setResPhotos(Array.from(e.target.files).slice(0, 5))} />
                      {resPhotos.length > 0 && <p style={{ fontSize: "0.7rem", color: C.muted, marginTop: 5, fontWeight: 600 }}>{resPhotos.length} photo{resPhotos.length > 1 ? "s" : ""} selected</p>}
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        disabled={uploading}
                        onClick={async () => {
                          setUploading(true);
                          try {
                            let photoUrls = [];
                            if (resPhotos.length > 0) {
                              const fd = new FormData();
                              resPhotos.forEach(f => fd.append("photos", f));
                              const up = await apiRequest("/tickets/upload-photos", { method: "POST", token, formData: fd });
                              photoUrls = up.urls || [];
                            }
                            await onStatusUpdate(item._id, "resolved", {
                              resolutionDescription: resolutionDesc,
                              resolutionPhotos: photoUrls
                            });
                            setShowResolveForm(false);
                            setResolutionDesc(""); setResPhotos([]);
                          } catch { /* error handled upstream */ }
                          finally { setUploading(false); }
                        }}
                        style={{
                          flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                          padding: "10px 16px", borderRadius: 10,
                          background: uploading ? C.muted : C.indigo, color: "#fff", border: "none",
                          fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "0.82rem", fontWeight: 800,
                          cursor: uploading ? "not-allowed" : "pointer",
                          boxShadow: "0 4px 12px rgba(79,70,229,0.3)",
                        }}
                      >
                        <BookmarkCheck size={14} /> {uploading ? "Saving…" : "Confirm Resolved"}
                      </button>
                      <button
                        onClick={() => { setShowResolveForm(false); setResolutionDesc(""); setResPhotos([]); }}
                        style={{ padding: "10px 16px", borderRadius: 10, border: `1px solid ${C.border}`, background: "#fff", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", color: C.ink }}
                      >Cancel</button>
                    </div>
                  </motion.div>
                  </div>
                </>
              )}
            </AnimatePresence>
          </div>

          <div className="tp-modal-foot">
            <div className="tp-card-author">
              <span className="tp-avatar">{(item.createdBy?.fullName || "R")[0].toUpperCase()}</span>
              <div className="tp-author-info">
                <span className="tp-author-cat">{item.createdBy?.fullName || "Resident"}</span>
              </div>
            </div>
          </div>
        </motion.section>
      </div>

      {lightbox && <Lightbox url={lightbox} onClose={() => setLightbox(null)} />}
    </>
  );
}

/* ─── Main page ───────────────────────────────────────────────────── */
export function TicketsPage() {
  const { token, user } = useAuth();
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDesc] = useState("");
  const [photoFiles, setPhotoFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [activeStatus, setActiveStatus] = useState("All");
  const [selectedItem, setSelectedItem] = useState(null);
  const [visibleCount, setVisibleCount] = useState(9);

  const canUpdateStatus = useMemo(() => ["committee", "staff", "super_admin"].includes(user?.role), [user?.role]);

  /* ── Counts ─────────────────────────────────── */
  const inProgCount = useMemo(() => items.filter((t) => t.status === "in_progress").length, [items]);
  const resolvedCount = useMemo(() => items.filter((t) => t.status === "resolved").length, [items]);

  /* ── Filtered items ──────────────────────────── */
  const filteredItems = useMemo(
    () =>
      items.filter((item) => activeStatus === "All" || item.status === activeStatus),
    [items, activeStatus]
  );

  const visibleItems = filteredItems.slice(0, visibleCount);
  const hasMore = filteredItems.length > visibleCount;

  /* ── API calls ───────────────────────────────── */
  async function loadItems() {
    setLoading(true);
    setError("");
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
    e.preventDefault();
    setError("");
    try {
      let photos = [];
      if (photoFiles.length > 0) {
        setIsUploading(true);
        const fd = new FormData();
        photoFiles.forEach((f) => fd.append("photos", f));
        const up = await apiRequest("/tickets/upload-photos", { method: "POST", token, formData: fd });
        photos = up.urls || [];
        setIsUploading(false);
      }
      const data = await apiRequest("/tickets", { method: "POST", token, body: { title, description, photos } });
      setItems((prev) => [data.item, ...prev]);
      setTitle("");
      setDesc("");
      setPhotoFiles([]);
      setShowForm(false);
    } catch (err) {
      setIsUploading(false);
      setError(err.message);
    }
  }

  async function handleStatusUpdate(ticketId, status, resolution = {}) {
    setError("");
    try {
      const data = await apiRequest(`/tickets/${ticketId}/status`, { method: "PATCH", token, body: { status, ...resolution } });
      setItems((prev) => prev.map((i) => (i._id === ticketId ? { ...i, ...data.item } : i)));
      if (selectedItem?._id === ticketId) setSelectedItem((prev) => ({ ...prev, ...data.item }));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  const STATUS_CHIPS = [
    { key: "All",         label: "All",         Icon: Ticket,        count: items.length  },
    { key: "in_progress", label: "In Progress", Icon: Clock,         count: inProgCount   },
    { key: "resolved",    label: "Resolved",    Icon: BookmarkCheck, count: resolvedCount },
  ];

  return (
    <>
      <style>{CSS}</style>
      <div className="tp-root">
        <motion.div className="tp-shell" variants={pageStagger} initial="hidden" animate="visible">
          <motion.div className="tp-page-head" variants={rise}>
            <div>
              <h1 className="tp-title">
                My Tickets<span className="tp-title-dot">.</span>
              </h1>
              <p className="tp-subtitle">
                Track ongoing complaints, see status updates, and raise new issues with photo evidence in one streamlined flow.
              </p>
            </div>

            <button type="button" className="tp-raise-btn" onClick={() => setShowForm((v) => !v)}>
              {showForm ? "Cancel" : "Raise Ticket"}
              <span className="tp-raise-icon">{showForm ? <X size={14} /> : <Plus size={14} />}</span>
            </button>
          </motion.div>

          <motion.div className="tp-controls" variants={rise}>
            <div className="tp-chips-rail">
              {STATUS_CHIPS.map(({ key, label, Icon, count }) => {
                const active = activeStatus === key;
                return (
                  <motion.button
                    key={key}
                    type="button"
                    className={`tp-status-chip${active ? " active" : ""}`}
                    onClick={() => setActiveStatus(key)}
                    whileTap={{ scale: 0.96 }}
                    transition={{ duration: 0.14 }}
                  >
                    {active && (
                      <motion.div
                        layoutId="tp-active-status-bg"
                        className="tp-chip-active-bg"
                        transition={{ type: "spring", stiffness: 420, damping: 32 }}
                      />
                    )}

                    <span className="tp-chip-inner">
                      <Icon size={12} strokeWidth={2.5} />
                      {label}
                      <span className="tp-chip-count">{count}</span>
                    </span>
                  </motion.button>
                );
              })}
            </div>

            <button type="button" className="tp-refresh-btn" onClick={loadItems} disabled={loading}>
              <motion.span animate={loading ? { rotate: 360 } : { rotate: 0 }} transition={loading ? { repeat: Infinity, duration: 1, ease: "linear" } : { duration: 0 }}>
                <RefreshCw size={13} />
              </motion.span>
              Refresh Feed
            </button>
          </motion.div>

          {error && <div className="tp-error">{error}</div>}

          <motion.div className="tp-body" variants={rise}>

            <motion.div className="tp-grid" layout variants={gridStagger} initial="hidden" animate="visible">
              <AnimatePresence initial={false}>
                {showForm && (
                  <motion.div
                    key="tp-form"
                    className="tp-form-wrap"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={spring}
                    style={{ overflow: "hidden" }}
                  >
                    <h2 className="tp-form-title">Raise a Complaint</h2>
                    <form onSubmit={handleCreate}>
                      <div className="tp-form-row">
                        <div>
                          <p className="tp-form-label">Title</p>
                          <input
                            className="tp-form-input"
                            placeholder="Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <p className="tp-form-label">Description</p>
                        <textarea
                          className="tp-form-textarea"
                          placeholder="Description"
                          value={description}
                          onChange={(e) => setDesc(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <p className="tp-form-label">Photos (up to 3, max 5 MB each)</p>
                        <input
                          className="tp-form-input"
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => setPhotoFiles(Array.from(e.target.files).slice(0, 3))}
                        />
                        {photoFiles.length > 0 && (
                          <p style={{ fontSize: "0.74rem", color: C.faint, marginTop: 5 }}>
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
                  </motion.div>
                )}
              </AnimatePresence>

              {loading && [0, 1, 2, 3, 4, 5].map((i) => (
                <motion.div key={`sk-${i}`} variants={cardIn}>
                  <SkCard />
                </motion.div>
              ))}

              {!loading && filteredItems.length === 0 && (
                <motion.div className="tp-empty" key="tp-empty" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
                  <div className="tp-empty-icon"><Ticket size={22} /></div>
                  <h3>No tickets found</h3>
                  <p>{activeStatus !== "All" ? "Try changing your filters." : "Raise a complaint and track its progress here."}</p>
                </motion.div>
              )}

              {!loading && visibleItems.map((item) => (
                <TCard
                  key={item._id}
                  item={item}
                  active={selectedItem?._id === item._id}
                  onOpen={setSelectedItem}
                />
              ))}

              {!loading && hasMore && (
                <div className="tp-load-wrap">
                  <button type="button" className="tp-load-btn" onClick={() => setVisibleCount((v) => v + 9)}>
                    Load more
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        </motion.div>

        <AnimatePresence>
          {selectedItem && (
            <DetailPanel
              key={selectedItem._id}
              item={selectedItem}
              onClose={() => setSelectedItem(null)}
              onStatusUpdate={handleStatusUpdate}
              canUpdateStatus={canUpdateStatus}
            />
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
