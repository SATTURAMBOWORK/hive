import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Plus, X, CheckCircle,
  Trash2, HandHelping, MapPin, CalendarDays, RefreshCw,
} from "lucide-react";
import { apiRequest } from "../components/api";
import { useAuth } from "../components/AuthContext";

/* ─── C Palette ─────────────────────────────────────────────────── */
const C = {
  bg:       "#FAFAFC",
  surface:  "#FFFFFF",
  ink:      "#1C1C1E",
  ink2:     "#3A3A3C",
  muted:    "#6B7280",
  faint:    "#9CA3AF",
  border:   "#E8E8ED",
  borderL:  "#F0F0F5",
  indigo:   "#4F46E5",
  indigoD:  "#4338CA",
  indigoL:  "#EEF2FF",
  indigoBr: "#C7D2FE",
  red:      "#DC2626",
  redL:     "#FEF2F2",
  redBr:    "#FECACA",
  amber:    "#F59E0B",
  amberD:   "#D97706",
  amberL:   "#FFFBEB",
  amberBr:  "#FCD34D",
  green:    "#16A34A",
  greenL:   "#DCFCE7",
  orange:   "#E8890C",
  orangeL:  "#FFF8F0",
};


/* ─── CSS ───────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,600&display=swap');

  .lfx-root * { box-sizing: border-box; }

  .lfx-root {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background:
      radial-gradient(860px 340px at 80% -8%, rgba(79,70,229,0.08), transparent 60%),
      radial-gradient(700px 300px at -5% 5%, rgba(232,137,12,0.07), transparent 65%),
      ${C.bg};
    min-height: calc(100vh - 64px);
    padding: 32px 32px 80px;
    position: relative;
  }

  .lfx-root::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image:
      linear-gradient(to right,  rgba(148,163,184,0.08) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(148,163,184,0.08) 1px, transparent 1px);
    background-size: 40px 40px;
    mask-image: radial-gradient(circle at 18% 8%, rgba(0,0,0,.7), transparent 62%);
  }

  .lfx-content {
    position: relative;
    z-index: 1;
    max-width: 1120px;
    margin: 0 auto;
  }

  /* ── Page heading ─────────────────────────────── */
  .lfx-page-head { margin-bottom: 20px; }

  .lfx-page-title {
    font-size: clamp(1.5rem, 2.8vw, 2.1rem);
    font-weight: 800;
    letter-spacing: -0.5px;
    color: ${C.ink};
    line-height: 1.15;
    margin: 0 0 4px;
  }

  .lfx-page-sub {
    color: ${C.muted};
    font-size: 0.82rem;
    font-weight: 500;
    line-height: 1.5;
    margin: 0;
  }

  /* ── Controls bar ──────────────────────────────── */
  .lfx-controls {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: nowrap;
    margin-bottom: 20px;
  }

  /* ── Chip rail (sliding underline tabs) ────────── */
  .lfx-chips-rail {
    display: inline-flex;
    align-items: stretch;
    gap: 0;
    border-bottom: 1.5px solid ${C.border};
    flex-shrink: 0;
  }

  .lfx-chip {
    position: relative;
    display: inline-flex;
    align-items: center;
    border: none;
    background: transparent;
    cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.78rem;
    font-weight: 700;
    line-height: 1;
    white-space: nowrap;
    outline: none;
    padding: 0;
  }

  .lfx-chip-underline {
    position: absolute;
    bottom: -1.5px;
    left: 13px; right: 13px;
    height: 2px;
    background: ${C.indigo};
    border-radius: 2px 2px 0 0;
  }

  .lfx-chip-inner {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 13px 9px;
  }

  /* ── Search box ────────────────────────────────── */
  .lfx-search-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
    border-radius: 12px;
    border: 1.5px solid ${C.border};
    background: ${C.surface};
    padding: 8px 12px;
    min-width: 200px;
    margin-left: auto;
    transition: border-color 0.18s, box-shadow 0.18s;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }
  .lfx-search-wrap:focus-within {
    border-color: ${C.orange};
    box-shadow: 0 0 0 3px rgba(232,137,12,0.12);
  }
  .lfx-search-wrap input {
    border: none; outline: none; background: transparent;
    color: ${C.ink}; font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.82rem; font-weight: 600; width: 100%;
  }
  .lfx-search-wrap input::placeholder { color: ${C.faint}; font-weight: 500; }

  /* ── Post Item button (matches amenity button style) ── */
  .lfx-compose-btn {
    position: relative;
    overflow: hidden;
    display: inline-flex; align-items: center; gap: 7px;
    background: ${C.surface};
    border: 1px solid ${C.border};
    border-radius: 10px;
    padding: 9px 14px;
    color: ${C.ink};
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.8rem; font-weight: 700;
    cursor: pointer;
    transition: border-color 0.2s, color 0.2s, transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    white-space: nowrap;
  }
  .lfx-compose-btn::after {
    content: '';
    position: absolute;
    left: 8px; right: 8px; bottom: 0;
    height: 2px; border-radius: 999px;
    background: ${C.indigo};
    transform: scaleX(0.2); opacity: 0;
    transition: transform 0.2s ease, opacity 0.2s ease;
  }
  .lfx-compose-btn:hover {
    border-color: #C7C7CC; color: ${C.ink};
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(28,28,30,0.09);
  }
  .lfx-compose-btn:hover::after { transform: scaleX(1); opacity: 1; }
  .lfx-compose-btn:active { transform: scale(0.97); }

  /* ── Inputs ───────────────────────────────────── */
  .lfx-input {
    width: 100%;
    border: 1px solid ${C.border};
    border-radius: 10px;
    background: ${C.bg};
    color: ${C.ink};
    padding: 10px 12px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.84rem;
    font-weight: 500;
    outline: none;
    transition: border-color 0.18s, box-shadow 0.18s;
  }
  .lfx-input::placeholder { color: ${C.faint}; }
  .lfx-input:focus {
    border-color: #C7C7CC;
    box-shadow: 0 0 0 3px rgba(79,70,229,0.1);
  }

  /* ── Category bar ─────────────────────────────── */
  .lfx-cat-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    margin-bottom: 18px;
    align-items: center;
  }

  .lfx-chip {
    border: 1px solid ${C.border};
    border-radius: 999px;
    padding: 6px 13px;
    background: ${C.surface};
    color: ${C.muted};
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.74rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.18s;
    white-space: nowrap;
  }
  .lfx-chip:hover {
    border-color: #C7C7CC;
    color: ${C.ink};
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(28,28,30,0.07);
  }
  .lfx-chip.active {
    background: ${C.indigo};
    border-color: ${C.indigo};
    color: #fff;
    box-shadow: 0 4px 14px rgba(79,70,229,0.28);
  }

  /* ── Form block ───────────────────────────────── */
  .lfx-block {
    background: ${C.surface};
    border: 1px solid ${C.border};
    border-radius: 18px;
    padding: 20px 22px;
    box-shadow: 0 8px 24px rgba(28,28,30,0.05);
    margin-bottom: 16px;
  }

  /* ── Grid ────────────────────────────────────── */
  .lfx-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
  }
  @media (max-width: 1060px) { .lfx-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width:  620px)  { .lfx-grid { grid-template-columns: 1fr; } }

  /* ── Card ─────────────────────────────────────── */
  .lfx-card {
    background: ${C.surface};
    border: 1px solid ${C.border};
    border-radius: 16px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transition: box-shadow 0.22s, border-color 0.22s, transform 0.22s;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }
  .lfx-card:hover {
    box-shadow: 0 8px 24px rgba(28,28,30,0.10);
    border-color: #C7C7CC;
    transform: translateY(-2px);
  }
  .lfx-card.is-resolved { opacity: 0.65; }

  /* ── Fixed image zone ─────────────────────────── */
  .lfx-card-media {
    width: 100%; height: 160px;
    flex-shrink: 0; overflow: hidden;
    background: ${C.borderL};
  }
  .lfx-card-media img {
    width: 100%; height: 100%;
    object-fit: cover; display: block;
    transition: transform 0.4s ease;
  }
  .lfx-card:hover .lfx-card-media img { transform: scale(1.04); }

  .lfx-card-placeholder {
    width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
    font-size: 2.4rem;
  }

  /* ── Card body ────────────────────────────────── */
  .lfx-card-body {
    padding: 14px 16px 16px;
    display: flex; flex-direction: column;
    flex: 1; gap: 9px;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }

  .lfx-card-top {
    display: flex; align-items: center;
    justify-content: space-between; gap: 8px;
  }

  .lfx-card-time {
    font-size: 0.67rem; font-weight: 600;
    color: ${C.faint}; white-space: nowrap;
  }

  .lfx-card-title {
    font-size: 0.92rem; font-weight: 700;
    color: ${C.ink}; line-height: 1.35;
    letter-spacing: -0.01em; margin: 0;
    display: -webkit-box; -webkit-line-clamp: 2;
    -webkit-box-orient: vertical; overflow: hidden;
  }

  .lfx-card-desc {
    font-size: 0.78rem; color: ${C.muted};
    line-height: 1.6; margin: 0; flex: 1;
    display: -webkit-box; -webkit-line-clamp: 2;
    -webkit-box-orient: vertical; overflow: hidden;
  }

  .lfx-card-meta {
    display: flex; gap: 12px; flex-wrap: wrap;
  }
  .lfx-card-meta-item {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 0.70rem; color: ${C.faint}; font-weight: 600;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    max-width: 160px;
  }

  .lfx-card-divider { height: 1px; background: ${C.borderL}; }

  .lfx-card-footer {
    display: flex; align-items: center; gap: 8px;
  }

  .lfx-card-author {
    display: flex; align-items: center;
    gap: 6px; min-width: 0; flex: 1;
  }
  .lfx-card-avatar {
    width: 22px; height: 22px; border-radius: 50%;
    background: ${C.borderL}; border: 1px solid ${C.border};
    font-size: 0.56rem; font-weight: 800; color: ${C.muted};
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .lfx-card-author-name {
    font-size: 0.70rem; font-weight: 600; color: ${C.muted};
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }

  .lfx-card-actions { display: flex; gap: 6px; flex-shrink: 0; }

  .lfx-action-btn {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 5px 10px; border-radius: 7px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.70rem; font-weight: 700;
    cursor: pointer; border: 1px solid;
    transition: background 0.15s, transform 0.15s;
    background: none;
  }
  .lfx-action-btn:hover:not(:disabled) { transform: translateY(-1px); }
  .lfx-action-btn:disabled { opacity: 0.45; cursor: not-allowed; }
  .lfx-action-btn.claim-lost  { background: ${C.orangeL}; color: ${C.orange}; border-color: #FDDCAA; }
  .lfx-action-btn.claim-lost:hover:not(:disabled)  { background: #FEE9C9; }
  .lfx-action-btn.claim-found { background: ${C.greenL};  color: ${C.green};  border-color: #BBF7D0; }
  .lfx-action-btn.claim-found:hover:not(:disabled) { background: #D1FAE5; }
  .lfx-action-btn.resolve     { background: ${C.greenL};  color: ${C.green};  border-color: #BBF7D0; }
  .lfx-action-btn.resolve:hover:not(:disabled)     { background: #D1FAE5; }
  .lfx-action-btn.delete-btn  { background: ${C.redL};    color: ${C.red};    border-color: ${C.redBr}; padding: 5px 8px; }
  .lfx-action-btn.delete-btn:hover:not(:disabled)  { background: #FECACA; }

  .lfx-claimed-notice {
    font-size: 0.70rem; font-weight: 600; color: ${C.green};
    display: inline-flex; align-items: center; gap: 4px;
  }

  /* Badges */
  .lfx-type-badge, .lfx-cat-badge, .lfx-status-badge {
    padding: 3px 9px; border-radius: 999px;
    font-size: 0.64rem; font-weight: 800;
    letter-spacing: 0.04em; text-transform: uppercase; border: 1px solid;
  }


  /* Skeleton */
  .lfx-sk {
    border-radius: 8px;
    background: linear-gradient(90deg, #F0F0F5 25%, #E8E8ED 50%, #F0F0F5 75%);
    background-size: 200% 100%;
    animation: lfx-shimmer 1.5s ease-in-out infinite;
  }

  /* Buttons */
  .lfx-btn-primary {
    border: none; border-radius: 10px; padding: 10px 18px;
    display: inline-flex; align-items: center; gap: 7px;
    background: linear-gradient(135deg, ${C.indigo}, ${C.indigoD});
    color: #fff; font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.84rem; font-weight: 700; cursor: pointer;
    box-shadow: 0 4px 14px rgba(79,70,229,0.28);
    transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
  }
  .lfx-btn-primary:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 7px 20px rgba(79,70,229,0.38);
  }
  .lfx-btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }

  .lfx-btn-soft {
    border: 1px solid ${C.border}; border-radius: 10px; padding: 9px 14px;
    display: inline-flex; align-items: center; gap: 6px;
    background: ${C.surface}; color: ${C.muted};
    font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.8rem; font-weight: 600;
    cursor: pointer; transition: all 0.18s;
  }
  .lfx-btn-soft:hover:not(:disabled) {
    border-color: #C7C7CC; color: ${C.ink};
    transform: translateY(-1px); box-shadow: 0 4px 12px rgba(28,28,30,0.07);
  }
  .lfx-btn-soft:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Photo upload */
  .lfx-upload-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 9px 14px; border-radius: 10px;
    border: 1.5px dashed ${C.border}; background: ${C.bg};
    color: ${C.muted}; font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.8rem; font-weight: 600; cursor: pointer;
    transition: border-color 0.18s, color 0.18s, background 0.18s;
    width: 100%;
  }
  .lfx-upload-btn:hover {
    border-color: ${C.indigo}; color: ${C.indigo}; background: ${C.indigoL};
  }

  .lfx-photo-preview {
    position: relative; display: inline-block;
    border-radius: 10px; overflow: hidden;
    border: 1px solid ${C.border};
    box-shadow: 0 2px 8px rgba(0,0,0,0.07);
  }
  .lfx-photo-preview img {
    display: block; width: 100%; max-height: 160px;
    object-fit: cover;
  }
  .lfx-photo-remove {
    position: absolute; top: 6px; right: 6px;
    width: 26px; height: 26px; border-radius: 50%;
    background: rgba(0,0,0,0.55); color: #fff;
    border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.15s;
  }
  .lfx-photo-remove:hover { background: ${C.red}; }

  /* Form label */
  .lfx-form-label {
    display: block; margin-bottom: 6px;
    color: ${C.muted}; font-size: 0.72rem; font-weight: 700;
    letter-spacing: 0.04em; text-transform: uppercase;
  }

  /* Error banner */
  .lfx-error {
    margin-bottom: 14px; border-radius: 12px;
    border: 1px solid ${C.redBr}; background: ${C.redL};
    color: ${C.red}; font-size: 0.82rem; font-weight: 700;
    padding: 11px 14px; display: flex; align-items: center; gap: 10px;
    overflow: hidden;
  }



  /* ── Detail panel ──────────────────────────────── */
  .lfx-lightbox-backdrop {
    position: fixed; inset: 0; z-index: 200;
    background: rgba(0,0,0,0.72);
    display: flex; align-items: center; justify-content: center;
    padding: 24px; cursor: pointer;
  }
  .lfx-detail-panel {
    position: relative;
    background: ${C.surface};
    border-radius: 20px;
    overflow: hidden;
    width: 100%; max-width: 440px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 32px 80px rgba(0,0,0,0.4);
    cursor: default;
  }
  .lfx-detail-img {
    width: 100%; max-height: 260px;
    object-fit: cover; display: block;
  }
  .lfx-detail-placeholder {
    width: 100%; height: 200px;
    display: flex; align-items: center; justify-content: center;
  }
  .lfx-detail-body {
    padding: 20px 22px 24px;
    display: flex; flex-direction: column; gap: 12px;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .lfx-detail-title {
    font-size: 1.15rem; font-weight: 800;
    color: ${C.ink}; margin: 0; line-height: 1.3;
    letter-spacing: -0.02em;
  }
  .lfx-detail-desc {
    font-size: 0.86rem; color: ${C.ink2};
    line-height: 1.65; margin: 0;
  }
  .lfx-lightbox-close {
    position: absolute; top: 12px; right: 12px;
    width: 34px; height: 34px; border-radius: 50%;
    background: rgba(0,0,0,0.45);
    border: 1px solid rgba(255,255,255,0.2);
    color: #fff; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.15s;
  }
  .lfx-lightbox-close:hover { background: rgba(0,0,0,0.65); }

  @keyframes lfx-shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes lfx-spin { to { transform: rotate(360deg); } }

  @media (max-width: 760px) {
    .lfx-root { padding: 20px 16px 60px; }
    .lfx-search-wrap { min-width: unset; width: 100%; margin-left: 0; }
    .lfx-controls { flex-direction: column; align-items: flex-start; }
  }
`;

/* ─── Helpers ───────────────────────────────────────────────────── */
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

function fmtDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/* ─── Skeleton card ─────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
      <div className="lfx-sk" style={{ width: "100%", height: 160 }} />
      <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="lfx-sk" style={{ width: 52, height: 18, borderRadius: 999 }} />
          <div className="lfx-sk" style={{ width: 36, height: 12, borderRadius: 4 }} />
        </div>
        <div className="lfx-sk" style={{ width: "80%", height: 14, borderRadius: 4 }} />
        <div className="lfx-sk" style={{ width: "55%", height: 12, borderRadius: 4 }} />
        <div style={{ height: 1, background: C.borderL }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="lfx-sk" style={{ width: 80, height: 12, borderRadius: 4 }} />
          <div className="lfx-sk" style={{ width: 72, height: 26, borderRadius: 7 }} />
        </div>
      </div>
    </div>
  );
}

/* ─── Item card — thumbnail only ───────────────────────────────── */
function ItemCard({ item, onOpen, index }) {
  const isLost     = item.type === "lost";
  const isResolved = item.status === "resolved";

  return (
    <motion.article
      className={`lfx-card${isResolved ? " is-resolved" : ""}`}
      style={{ cursor: "pointer" }}
      onClick={() => onOpen(item)}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.36, ease: [0.25, 0.46, 0.45, 0.94], delay: Math.min(index * 0.04, 0.28) }}
    >
      {/* Fixed-height image zone */}
      <div className="lfx-card-media">
        {item.photo ? (
          <img src={item.photo} alt={item.title} />
        ) : (
          <div
            className="lfx-card-placeholder"
            style={{ background: isLost ? `linear-gradient(145deg, ${C.orangeL}, #FFE4C4)` : `linear-gradient(145deg, ${C.greenL}, #C6F6D5)` }}
          >
            {isLost ? "🔍" : "📦"}
          </div>
        )}
      </div>

      {/* Badge + title + date only */}
      <div className="lfx-card-body">
        <div className="lfx-card-top">
          <span className="lfx-type-badge" style={{
            background: isLost ? C.orangeL : C.greenL,
            color: isLost ? C.orange : C.green,
            border: `1px solid ${isLost ? "#FDDCAA" : "#BBF7D0"}`,
          }}>
            {isLost ? "Lost" : "Found"}
          </span>
          <span className="lfx-card-time">{timeAgo(item.createdAt)}</span>
        </div>
        <h3 className="lfx-card-title">{item.title}</h3>
      </div>
    </motion.article>
  );
}

/* ─── Main page ─────────────────────────────────────────────────── */
export function LostFoundPage() {
  const { token, user } = useAuth();
  const userId = user?._id || user?.id || "";

  const [items,     setItems]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [filter, setFilter] = useState("lost");
  const [search,    setSearch]    = useState("");
  const [showForm,   setShowForm]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lightboxItem, setLightboxItem] = useState(null);

  const [form, setForm] = useState({
    type: "lost", title: "", description: "", location: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [photoFile,    setPhotoFile]    = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");

  /* ── API ─────────────────────────────────────── */
  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true); setError("");
    try {
      const data = await apiRequest("/lost-found", { token });
      setItems(data.items || []);
    } catch (err) {
      setError(err.message || "Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const visible = useMemo(() => items.filter((item) => {
    if (item.type !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const title = String(item.title || "").toLowerCase();
      const description = String(item.description || "").toLowerCase();
      const location = String(item.location || "").toLowerCase();
      const hit = title.includes(q) || description.includes(q) || location.includes(q);
      if (!hit) return false;
    }
    return true;
  }), [items, filter, search]);

  function onFormChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function resetForm() {
    setForm({ type: "lost", title: "", description: "", location: "", date: new Date().toISOString().split("T")[0] });
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null);
    setPhotoPreview("");
  }

  function onPhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function removePhoto() {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null);
    setPhotoPreview("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return;
    setSubmitting(true); setError("");
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (photoFile) fd.append("photo", photoFile);
      const data = await apiRequest("/lost-found", { token, method: "POST", formData: fd });
      setItems((prev) => [data.item, ...prev]);
      setShowForm(false);
      resetForm();
    } catch (err) {
      setError(err.message || "Failed to post item");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleClaim(id) {
    setError("");
    try {
      const data = await apiRequest(`/lost-found/${id}/claim`, { token, method: "PATCH" });
      setItems((prev) => prev.map((i) => (i._id === id ? data.item : i)));
    } catch (err) { setError(err.message); }
  }

  async function handleResolve(id) {
    if (!window.confirm("Mark this item as resolved?")) return;
    setError("");
    try {
      const data = await apiRequest(`/lost-found/${id}/resolve`, { token, method: "PATCH" });
      setItems((prev) => prev.map((i) => (i._id === id ? data.item : i)));
    } catch (err) { setError(err.message); }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this post permanently?")) return;
    setError("");
    try {
      await apiRequest(`/lost-found/${id}`, { token, method: "DELETE" });
      setItems((prev) => prev.filter((i) => i._id !== id));
    } catch (err) { setError(err.message); }
  }

  const ease = [0.25, 0.46, 0.45, 0.94];

  return (
    <>
      <style>{CSS}</style>
      <div className="lfx-root">
        <div className="lfx-content">

          {/* ── Page heading ────────────────────── */}
          <motion.div className="lfx-page-head" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.36, ease }}>
            <h1 className="lfx-page-title">Lost &amp; Found</h1>
            <p className="lfx-page-sub">Report missing items, post found objects, and help residents reunite quickly.</p>
          </motion.div>

          {/* ── Controls bar ─────────────────────── */}
          <motion.div className="lfx-controls" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.36, ease, delay: 0.05 }}>

            {/* Filter tabs */}
            <div className="lfx-chips-rail">
              {[
                { key: "lost",  label: "Lost"  },
                { key: "found", label: "Found" },
              ].map(({ key, label }) => {
                const isActive = filter === key;
                return (
                  <motion.button
                    key={key}
                    type="button"
                    className="lfx-chip"
                    onClick={() => setFilter(key)}
                    animate={{ color: isActive ? C.ink : C.muted }}
                    transition={{ color: { duration: 0.14 } }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="lfx-active-filter"
                        className="lfx-chip-underline"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="lfx-chip-inner">{label}</span>
                  </motion.button>
                );
              })}
            </div>

            {/* Search */}
            <div className="lfx-search-wrap">
              <Search size={14} color={C.faint} strokeWidth={2} style={{ flexShrink: 0 }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search items, location…"
              />
              {search && (
                <button onClick={() => setSearch("")} style={{ border: "none", background: "none", color: C.faint, cursor: "pointer", display: "flex", flexShrink: 0 }}>
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Post Item button */}
            <button type="button" className="lfx-compose-btn" onClick={() => setShowForm(v => !v)}>
              {showForm ? <X size={13} /> : <Plus size={13} />}
              {showForm ? "discard" : "post item"}
            </button>

            <button
              type="button"
              onClick={load}
              disabled={loading}
              aria-label="Refresh posts"
              title="Refresh"
              style={{
                width: 36,
                height: 36,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 10,
                border: `1px solid ${C.border}`,
                background: C.surface,
                color: C.muted,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.18s",
                opacity: loading ? 0.65 : 1,
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.borderColor = C.orange;
                  e.currentTarget.style.color = C.orange;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = C.border;
                e.currentTarget.style.color = C.muted;
              }}
            >
              <RefreshCw size={13} style={{ animation: loading ? "lfx-spin 1s linear infinite" : "none" }} />
            </button>
          </motion.div>

          {/* ── Error ──────────────────────────── */}
          <AnimatePresence>
            {error && (
              <motion.div
                key="lf-error"
                className="lfx-error"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
              >
                {error}
                <button onClick={() => setError("")} style={{ marginLeft: "auto", border: "none", background: "none", color: C.red, cursor: "pointer", display: "flex" }}>
                  <X size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Post Item form ──────────────────── */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                key="lf-form"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease }}
                style={{ overflow: "hidden" }}
              >
                <section className="lfx-block" style={{ position: "relative", overflow: "hidden" }}>
                  <div style={{
                    position: "absolute", top: 0, left: 0, right: 0, height: 3,
                    background: `linear-gradient(90deg, ${C.indigo}, ${C.orange})`,
                  }} />
                  <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: C.ink, margin: "0 0 16px", letterSpacing: "-0.02em" }}>
                    Report Lost or Found Item
                  </h2>

                  <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div>
                      <label className="lfx-form-label">Type *</label>
                      <select name="type" value={form.type} onChange={onFormChange} className="lfx-input">
                        <option value="lost">Lost — I'm looking for this</option>
                        <option value="found">Found — I found this</option>
                      </select>
                    </div>

                    <div>
                      <label className="lfx-form-label">Title *</label>
                      <input name="title" value={form.title} onChange={onFormChange} className="lfx-input" placeholder="e.g. Lost blue umbrella near gym" required />
                    </div>

                    <div>
                      <label className="lfx-form-label">Description *</label>
                      <textarea name="description" value={form.description} onChange={onFormChange} rows={3} className="lfx-input" placeholder="Describe color, brand, size, and key identifiers" required style={{ resize: "vertical", minHeight: 82 }} />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <label className="lfx-form-label">Location</label>
                        <input name="location" value={form.location} onChange={onFormChange} className="lfx-input" placeholder="Near Gate B, Parking Lot…" maxLength={40} />
                        {form.location.length > 30 && (
                          <p style={{ fontSize: "0.68rem", color: form.location.length >= 40 ? C.red : C.muted, fontWeight: 600, marginTop: 4, textAlign: "right" }}>
                            {form.location.length}/40
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="lfx-form-label">Date *</label>
                        <input name="date" type="date" value={form.date} onChange={onFormChange} className="lfx-input" required />
                      </div>
                    </div>

                    <div>
                      <label className="lfx-form-label">Photo (optional)</label>
                      {photoPreview ? (
                        <div className="lfx-photo-preview">
                          <img src={photoPreview} alt="preview" />
                          <button type="button" className="lfx-photo-remove" onClick={removePhoto} aria-label="Remove photo">
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                        <label className="lfx-upload-btn">
                          <Plus size={14} /> Choose image from device
                          <input
                            type="file" accept="image/*"
                            style={{ display: "none" }}
                            onChange={onPhotoChange}
                          />
                        </label>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button type="submit" className="lfx-btn-primary" disabled={submitting}>
                        {submitting ? "Posting…" : <><Plus size={13} /> Post Item</>}
                      </button>
                      <button type="button" className="lfx-btn-soft" onClick={() => { setShowForm(false); resetForm(); }}>Cancel</button>
                    </div>
                  </form>
                </section>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Masonry grid ───────────────────── */}
          {loading ? (
            <div className="lfx-grid">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : visible.length === 0 ? (
            <motion.section
              className="lfx-block"
              style={{ textAlign: "center", padding: "60px 28px", display: "grid", placeItems: "center", gap: 8 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: C.ink, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                No polls here yet
              </h3>
              <p style={{ margin: "0 0 18px", maxWidth: 440, lineHeight: 1.6, color: C.muted, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Switch filters or create the first community question to get the board moving.
              </p>
              {!showForm && filter !== "found" && (
                <button className="lfx-btn-primary" onClick={() => setShowForm(true)}>
                  <Plus size={13} /> Post Item
                </button>
              )}
            </motion.section>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${filter}-${search}`}
                className="lfx-grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
              >
                {visible.map((item, i) => (
                  <ItemCard
                    key={item._id}
                    item={item}
                    onOpen={setLightboxItem}
                    index={i}
                  />
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

      </div>

      {/* ── Detail panel ─────────────────────────── */}
      <AnimatePresence>
        {lightboxItem && (() => {
          const item      = lightboxItem;
          const isLost    = item.type === "lost";
          const isResolved = item.status === "resolved";
          const isOwner   = item.postedBy?._id === userId || item.postedBy === userId;
          const isClaimed = Boolean(item.claimedBy);
          const initials  = (item.postedBy?.fullName || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
          return (
            <motion.div
              className="lfx-lightbox-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setLightboxItem(null)}
            >
              <motion.div
                className="lfx-detail-panel"
                initial={{ scale: 0.94, opacity: 0, y: 12 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.94, opacity: 0, y: 12 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                onClick={e => e.stopPropagation()}
              >
                {/* Image */}
                {item.photo ? (
                  <img src={item.photo} alt={item.title} className="lfx-detail-img" />
                ) : (
                  <div className="lfx-detail-placeholder" style={{ background: isLost ? `linear-gradient(145deg, ${C.orangeL}, #FFE4C4)` : `linear-gradient(145deg, ${C.greenL}, #C6F6D5)` }}>
                    <span style={{ fontSize: "3.5rem" }}>{isLost ? "🔍" : "📦"}</span>
                  </div>
                )}

                {/* Content */}
                <div className="lfx-detail-body">
                  {/* Badges row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span className="lfx-type-badge" style={{ background: isLost ? C.orangeL : C.greenL, color: isLost ? C.orange : C.green, border: `1px solid ${isLost ? "#FDDCAA" : "#BBF7D0"}` }}>
                      {isLost ? "Lost" : "Found"}
                    </span>
                    {isResolved && (
                      <span style={{ fontSize: "0.62rem", fontWeight: 800, color: C.green, background: C.greenL, border: `1px solid #BBF7D0`, borderRadius: 999, padding: "2px 8px", textTransform: "uppercase" }}>
                        ✓ Resolved
                      </span>
                    )}
                    <span style={{ fontSize: "0.7rem", color: C.faint, fontWeight: 600, marginLeft: "auto" }}>{timeAgo(item.createdAt)}</span>
                  </div>

                  {/* Title */}
                  <h2 className="lfx-detail-title">{item.title}</h2>

                  {/* Description */}
                  {item.description && <p className="lfx-detail-desc">{item.description}</p>}

                  {/* Meta */}
                  {(item.location || item.date) && (
                    <div className="lfx-card-meta">
                      {item.location && <span className="lfx-card-meta-item" style={{ maxWidth: "none" }}><MapPin size={12} />{item.location}</span>}
                      {item.date     && <span className="lfx-card-meta-item" style={{ maxWidth: "none" }}><CalendarDays size={12} />{fmtDate(item.date)}</span>}
                    </div>
                  )}

                  <div className="lfx-card-divider" />

                  {/* Author + actions */}
                  <div className="lfx-card-footer">
                    <div className="lfx-card-author">
                      <div className="lfx-card-avatar">{initials}</div>
                      <span className="lfx-card-author-name">{item.postedBy?.fullName || "Unknown"}</span>
                    </div>
                    {!isResolved && (
                      <div className="lfx-card-actions">
                        {!isOwner && !isClaimed && (
                          <button className={`lfx-action-btn ${isLost ? "claim-lost" : "claim-found"}`} onClick={() => { handleClaim(item._id); setLightboxItem(null); }}>
                            <HandHelping size={11} />{isLost ? "I found this" : "This is mine"}
                          </button>
                        )}
                        {isClaimed && !isOwner && (
                          <span className="lfx-claimed-notice"><CheckCircle size={11} /> Claimed</span>
                        )}
                        {isOwner && (
                          <>
                            <button className="lfx-action-btn resolve" onClick={() => { handleResolve(item._id); setLightboxItem(null); }}>
                              <CheckCircle size={11} /> Resolve
                            </button>
                            <button className="lfx-action-btn delete-btn" onClick={() => { handleDelete(item._id); setLightboxItem(null); }}>
                              <Trash2 size={11} />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Close button */}
                <button className="lfx-lightbox-close" onClick={() => setLightboxItem(null)}>
                  <X size={18} />
                </button>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </>
  );
}
