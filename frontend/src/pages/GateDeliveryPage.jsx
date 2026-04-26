import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarClock,
  CheckCircle2,
  Package,
  Plus,
  RefreshCw,
  Clock3, ShieldCheck, ArrowDownToLine, RotateCcw,
  Truck,
  User,
  Phone,
  CalendarDays,
  Hourglass,
  X,
} from "lucide-react";
import { apiRequest } from "../components/api";
import { useAuth } from "../components/AuthContext";
import { getSocket } from "../components/socket";

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
  amber:    "#E8890C",
  amberD:   "#D97706",
  amberL:   "#FFFBEB",
  amberBr:  "#FCD34D",
  green:    "#16A34A",
  greenL:   "#DCFCE7",
  greenBr:  "#BBF7D0",
};

const STATUS_META = {
  awaiting_approval: { label: "Awaiting Approval", color: "#B45309", bg: "#FFF7ED", border: "#FED7AA", accent: C.amber  },
  approved_auto:     { label: "Auto-Approved",     color: C.indigo,  bg: C.indigoL, border: C.indigoBr, accent: C.indigo },
  approved_manual:   { label: "Approved",          color: C.indigo,  bg: C.indigoL, border: C.indigoBr, accent: C.indigo },
  delivered:         { label: "Delivered",         color: C.green,   bg: C.greenL,  border: C.greenBr,  accent: C.green  },
  rejected:          { label: "Rejected",          color: C.red,     bg: C.redL,    border: C.redBr,    accent: C.red    },
  returned:          { label: "Returned",          color: C.muted,   bg: "#F9FAFB", border: C.borderL,  accent: C.muted  },
  created:           { label: "Created",           color: C.muted,   bg: "#F9FAFB", border: C.borderL,  accent: C.muted  },
};

const PACKAGE_TYPES = {
  parcel: "Parcel", food: "Food", grocery: "Grocery",
  medicine: "Medicine", documents: "Documents", other: "Other",
};

const FULFILLMENT_LABEL = {
  keep_at_gate: "Keep at gate",
  doorstep: "Doorstep",
  neighbour: "With neighbour",
};

const VIEW_TABS = [
  { key: "live", label: "Live Queue", Icon: Truck },
  { key: "expected", label: "Expected Today", Icon: CalendarClock },
];

const EASE = [0.22, 1, 0.36, 1];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800&display=swap');

  .gd-root * { box-sizing: border-box; }

  .gd-root {
    font-family: 'Plus Jakarta Sans', sans-serif;
    min-height: calc(100vh - 64px);
    padding: 22px 18px 80px;
    background:
      radial-gradient(800px 320px at 82% -6%, rgba(79,70,229,0.08), transparent 60%),
      radial-gradient(640px 280px at -8% 2%, rgba(232,137,12,0.07), transparent 65%),
      ${C.bg};
    color: ${C.ink};
    position: relative;
  }

  .gd-root::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image:
      linear-gradient(to right, rgba(148,163,184,0.08) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(148,163,184,0.08) 1px, transparent 1px);
    background-size: 38px 38px;
    mask-image: radial-gradient(circle at 18% 8%, rgba(0,0,0,0.75), transparent 68%);
  }

  .gd-shell {
    max-width: 1100px;
    margin: 0 auto;
    position: relative;
    z-index: 1;
  }

  /* ── Header ─────────────────────────────── */
  .gd-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;
    flex-wrap: wrap;
    margin-bottom: 14px;
  }

  .gd-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    border-radius: 999px;
    border: 1px solid ${C.amberBr};
    background: ${C.amberL};
    color: ${C.amberD};
    padding: 5px 11px;
    font-size: 0.7rem;
    font-weight: 800;
    letter-spacing: 0.04em;
    margin-bottom: 8px;
  }

  .gd-title {
    font-size: clamp(1.6rem, 3.6vw, 2.2rem);
    font-weight: 800;
    color: ${C.ink};
    letter-spacing: -0.03em;
    line-height: 1.1;
    margin: 0;
  }

  .gd-title span { color: ${C.indigo}; }

  .gd-sub {
    margin: 7px 0 0;
    font-size: 0.86rem;
    color: ${C.muted};
    font-weight: 500;
    line-height: 1.6;
    max-width: 52ch;
  }

  .gd-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  /* ── Buttons ─────────────────────────────── */
  .gd-btn, .gd-btn-danger, .gd-btn-ghost {
    border-radius: 10px;
    padding: 9px 15px;
    border: 1px solid transparent;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.79rem;
    font-weight: 700;
    transition: transform 0.18s, box-shadow 0.18s, opacity 0.18s;
  }

  .gd-btn {
    background: linear-gradient(135deg, ${C.indigo}, ${C.indigoD});
    color: #fff;
    box-shadow: 0 6px 16px rgba(79,70,229,0.24);
  }
  .gd-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 10px 22px rgba(79,70,229,0.32); }

  .gd-btn-amber {
    background: linear-gradient(135deg, ${C.amber}, ${C.amberD});
    color: #fff;
    box-shadow: 0 6px 16px rgba(232,137,12,0.24);
    border-radius: 10px;
    padding: 9px 15px;
    border: none;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.79rem;
    font-weight: 700;
    transition: transform 0.18s, box-shadow 0.18s;
  }
  .gd-btn-amber:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 10px 22px rgba(232,137,12,0.32); }

  .gd-btn-ghost {
    border-color: ${C.border};
    background: ${C.surface};
    color: ${C.ink2};
    box-shadow: 0 4px 12px rgba(28,28,30,0.06);
  }
  .gd-btn-ghost:hover:not(:disabled) { border-color: #C7C7CC; color: ${C.ink}; transform: translateY(-1px); }

  .gd-btn-danger {
    border-color: ${C.redBr};
    background: ${C.redL};
    color: #B91C1C;
  }
  .gd-btn-danger:hover:not(:disabled) { border-color: #FCA5A5; transform: translateY(-1px); box-shadow: 0 6px 14px rgba(220,38,38,0.14); }

  .gd-btn:disabled, .gd-btn-amber:disabled, .gd-btn-ghost:disabled, .gd-btn-danger:disabled {
    opacity: 0.5; cursor: not-allowed; transform: none !important;
  }

  .gd-btn-main {
    position: relative;
    overflow: hidden;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    background: ${C.surface};
    border: 1px solid ${C.border};
    border-radius: 10px;
    padding: 9px 14px;
    color: ${C.ink};
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    transition: border-color 0.2s, color 0.2s, transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }

  .gd-btn-main::after {
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

  .gd-btn-main:hover {
    border-color: #C7C7CC;
    color: ${C.ink};
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(28,28,30,0.09);
  }

  .gd-btn-main:hover::after {
    transform: scaleX(1);
    opacity: 1;
  }

  .gd-btn-main:active {
    transform: scale(0.97);
  }

  /* ── Metrics ─────────────────────────────── */
  .gd-metrics {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    align-items: center;
    margin-bottom: 14px;
  }

  /* ── Main grid ───────────────────────────── */
  .gd-main {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .gd-tab-rail {
    display: inline-flex;
    align-items: stretch;
    gap: 0;
    border-bottom: 1.5px solid ${C.border};
    flex-shrink: 0;
  }

  .gd-tab {
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

  .gd-tab-inner {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 13px 9px;
  }

  .gd-tab-underline {
    position: absolute;
    bottom: -1.5px;
    left: 13px;
    right: 13px;
    height: 2px;
    background: ${C.indigo};
    border-radius: 2px 2px 0 0;
  }

  /* ── Panel ───────────────────────────────── */
  .gd-panel {
    border-radius: 20px;
    border: 1px solid ${C.border};
    background: ${C.surface};
    box-shadow: 0 8px 22px rgba(28,28,30,0.06);
    padding: 16px;
  }

  .gd-panel-title {
    font-size: 1.1rem;
    font-weight: 800;
    color: ${C.ink};
    letter-spacing: -0.02em;
    margin: 0 0 4px;
  }

  .gd-panel-sub {
    font-size: 0.78rem;
    color: ${C.muted};
    font-weight: 500;
    margin: 0 0 14px;
  }

  .gd-panel-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 12px;
  }

  /* ── Filter chips ────────────────────────── */
  .gd-chips {
    display: flex;
    gap: 7px;
    flex-wrap: wrap;
    margin-bottom: 12px;
  }

  .gd-chip {
    border: 1px solid ${C.border};
    border-radius: 999px;
    padding: 5px 12px;
    background: ${C.surface};
    color: ${C.muted};
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.72rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.16s;
  }
  .gd-chip:hover { border-color: #C7C7CC; color: ${C.ink}; }
  .gd-chip.active { background: ${C.ink}; border-color: ${C.ink}; color: #fff; }

  /* ── Delivery card ───────────────────────── */
  .gd-card {
    position: relative;
    overflow: hidden;
    border-radius: 14px;
    border: 1px solid ${C.border};
    background: ${C.surface};
    padding: 13px;
    transition: transform 0.18s, box-shadow 0.18s, border-color 0.18s;
  }

  .gd-card::before {
    content: '';
    position: absolute;
    left: 0; top: 10px; bottom: 10px;
    width: 3px;
    border-radius: 0 3px 3px 0;
    background: var(--accent, ${C.amber});
    opacity: 0.7;
  }

  .gd-card.pending { border-color: #FED7AA; background: #FFFDF9; }
  .gd-card.approved { border-color: ${C.indigoBr}; background: #FAFAFE; }
  .gd-card:hover { transform: translateY(-1px); box-shadow: 0 10px 22px rgba(28,28,30,0.1); }

  .gd-card-top {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 10px;
  }

  .gd-badge {
    padding: 3px 9px;
    border-radius: 999px;
    border: 1px solid;
    font-size: 0.63rem;
    font-weight: 800;
    letter-spacing: 0.03em;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .gd-time {
    margin-left: auto;
    font-size: 0.68rem;
    font-weight: 700;
    color: ${C.faint};
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .gd-card-title {
    font-size: 0.98rem;
    font-weight: 800;
    color: ${C.ink};
    letter-spacing: -0.01em;
    margin: 0 0 8px;
  }

  .gd-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin-bottom: 10px;
  }

  .gd-meta-item {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-width: 0;
    color: ${C.ink2};
    font-size: 0.77rem;
    font-weight: 700;
    line-height: 1.2;
    white-space: nowrap;
  }

  .gd-meta-badge {
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    padding: 4px 9px;
    background: ${C.ink};
    color: #FFFFFF;
    font-size: 0.7rem;
    font-weight: 800;
    letter-spacing: -0.01em;
    flex-shrink: 0;
  }

  .gd-meta-sep {
    color: ${C.faint};
    font-weight: 700;
  }

  .gd-card-actions {
    display: flex;
    gap: 7px;
    flex-wrap: wrap;
  }

  .gd-inline-box {
    margin-top: 8px;
    border-radius: 11px;
    border: 1px solid ${C.borderL};
    background: ${C.bg};
    padding: 10px;
  }

  /* ── Form ────────────────────────────────── */
  .gd-input, .gd-select, .gd-textarea {
    width: 100%;
    border-radius: 10px;
    border: none;
    background: ${C.borderL};
    padding: 9px 11px;
    color: ${C.ink};
    font-size: 0.82rem;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 600;
    outline: none;
    box-shadow: inset 0 0 0 1px transparent;
    transition: box-shadow 0.18s, background 0.18s;
    box-sizing: border-box;
  }
  .gd-textarea { resize: vertical; min-height: 68px; }
  .gd-input::placeholder, .gd-textarea::placeholder { color: ${C.faint}; font-weight: 400; }
  .gd-input:focus, .gd-select:focus, .gd-textarea:focus {
    background: ${C.surface};
    box-shadow: inset 0 0 0 1px ${C.indigoBr}, 0 0 0 3px rgba(79,70,229,0.1);
  }

  .gd-label {
    display: block;
    font-size: 0.68rem;
    font-weight: 800;
    color: ${C.muted};
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 5px;
  }

  .gd-form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .gd-tile-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .gd-tile {
    border: 1px solid ${C.border};
    background: ${C.surface};
    color: ${C.ink2};
    border-radius: 11px;
    min-height: 42px;
    padding: 8px 10px;
    font-size: 0.77rem;
    font-weight: 700;
    font-family: 'Plus Jakarta Sans', sans-serif;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    cursor: pointer;
    transition: border-color 0.16s, color 0.16s, background 0.16s, transform 0.16s;
  }

  .gd-tile:hover {
    border-color: #C7C7CC;
    color: ${C.ink};
    transform: translateY(-1px);
  }

  .gd-tile.active {
    border-color: ${C.indigoBr};
    background: ${C.indigoL};
    color: ${C.indigoD};
  }

  .gd-form-group { margin-bottom: 10px; }

  /* ── Skeleton ────────────────────────────── */
  .gd-sk {
    border-radius: 7px;
    background: linear-gradient(90deg, #F0F0F5 25%, #E8E8ED 50%, #F0F0F5 75%);
    background-size: 200% 100%;
    animation: gd-shimmer 1.4s ease-in-out infinite;
  }

  /* ── Empty ───────────────────────────────── */
  .gd-empty {
    border-radius: 13px;
    border: 1.5px dashed ${C.border};
    background: #FCFCFE;
    text-align: center;
    padding: 32px 16px;
  }
  .gd-empty-icon {
    width: 44px; height: 44px; border-radius: 14px;
    background: ${C.indigoL}; color: ${C.indigo};
    margin: 0 auto 10px;
    display: inline-flex; align-items: center; justify-content: center;
  }
  .gd-empty h3 { margin: 0; font-size: 0.96rem; font-weight: 800; color: ${C.ink}; }
  .gd-empty p  { margin: 5px 0 0; font-size: 0.76rem; color: ${C.muted}; }

  /* ── Error ───────────────────────────────── */
  .gd-error {
    border-radius: 11px;
    border: 1px solid ${C.redBr};
    background: ${C.redL};
    color: #B91C1C;
    padding: 10px 13px;
    font-size: 0.81rem;
    font-weight: 700;
    margin-bottom: 12px;
  }

  .gd-list { display: flex; flex-direction: column; gap: 9px; }

  /* ── Pre-reg section ─────────────────────── */
  .gd-prereg-switch-rail {
    display: inline-flex;
    align-items: stretch;
    gap: 0;
    border-bottom: 1.5px solid ${C.border};
    flex-shrink: 0;
  }

  .gd-prereg-toggle {
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

  .gd-prereg-toggle-inner {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 13px 9px;
  }

  .gd-prereg-underline {
    position: absolute;
    left: 13px;
    right: 13px;
    bottom: -1.5px;
    height: 2px;
    border-radius: 2px 2px 0 0;
    background: ${C.indigo};
  }

  .gd-toggle-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 32px;
    height: 24px;
    padding: 0 9px;
    border-radius: 999px;
    background: ${C.indigoL};
    color: ${C.indigoD};
    font-size: 0.7rem;
    font-weight: 800;
    flex-shrink: 0;
  }

  .gd-modal-backdrop {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: rgba(17, 24, 39, 0.38);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    z-index: 80;
  }

  .gd-modal {
    position: relative;
    z-index: 81;
    width: min(100%, 520px);
    max-width: 520px;
    max-height: 88vh;
    background: ${C.surface};
    border: 1px solid ${C.border};
    border-radius: 24px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.12), 0 32px 64px rgba(0,0,0,0.18);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .gd-modal-head {
    padding: 14px 14px 12px;
    border-bottom: 1px solid ${C.border};
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
  }

  .gd-modal-body {
    padding: 12px 14px 16px;
    overflow: auto;
  }

  .gd-modal-form {
    width: 100%;
    max-width: 460px;
    margin: 0 auto;
  }

  .gd-icon-btn {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    border: 1px solid ${C.border};
    background: ${C.surface};
    color: ${C.ink2};
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: border-color 0.16s, color 0.16s, background 0.16s;
  }

  .gd-icon-btn:hover {
    border-color: #C7C7CC;
    color: ${C.ink};
  }

  @keyframes gd-shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes gd-spin { to { transform: rotate(360deg); } }

  @media (max-width: 960px) {
    .gd-modal-backdrop { padding: 10px; }
    .gd-modal {
      width: min(100%, 500px);
      max-height: 94vh;
    }
  }
  @media (max-width: 640px) {
    .gd-metrics { gap: 6px; }
    .gd-form-row { grid-template-columns: 1fr; }
    .gd-tile-grid { grid-template-columns: 1fr 1fr; }
    .gd-modal-backdrop {
      padding: 8px;
      align-items: center;
      justify-content: center;
    }
    .gd-modal {
      width: 100%;
      max-width: 100%;
      border-radius: 16px;
      max-height: calc(100vh - 16px);
    }
    .gd-modal-head {
      padding: 12px 12px 10px;
    }
    .gd-modal-body {
      padding: 10px 12px 14px;
    }
  }
`;

/* ── Helpers ──────────────────────────────────────────────────────────────── */
function relTime(val) {
  if (!val) return "now";
  const s = Math.floor((Date.now() - new Date(val)) / 1000);
  if (s < 60)  return "just now";
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmtTime(val) {
  if (!val) return "-";
  return new Date(val).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

/* ── Skeleton ─────────────────────────────────────────────────────────────── */
function GdSkeleton() {
  return (
    <div className="gd-card" style={{ cursor: "default" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <div className="gd-sk" style={{ width: 120, height: 20, borderRadius: 999 }} />
        <div className="gd-sk" style={{ width: 60, height: 12, marginTop: 4 }} />
      </div>
      <div className="gd-sk" style={{ width: "55%", height: 18, marginBottom: 8 }} />
      <div className="gd-sk" style={{ width: "88%", height: 12, marginBottom: 6 }} />
    </div>
  );
}

/* ── Gate delivery card ───────────────────────────────────────────────────── */
function GateCard({ item, busyAction, onHandover, onReturn }) {
  const meta      = STATUS_META[item.status] || STATUS_META.created;
  const isPending  = item.status === "awaiting_approval";
  const isApproved = ["approved_auto", "approved_manual"].includes(item.status);

  const [showHandover, setShowHandover] = useState(false);
  const [receiverName, setReceiverName] = useState("");

  const busy = (suffix) => busyAction === `${item._id}:${suffix}`;

  function cardClass() {
    if (isPending)  return "gd-card pending";
    if (isApproved) return "gd-card approved";
    return "gd-card";
  }

  async function submitHandover() {
    await onHandover(item._id, receiverName.trim());
    setShowHandover(false);
    setReceiverName("");
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.28, ease: EASE }}
      className={cardClass()}
      style={{ "--accent": meta.accent }}
    >
      {/* Top row */}
      <div className="gd-card-top">
        <span className="gd-badge" style={{ color: meta.color, background: meta.bg, borderColor: meta.border }}>
          <ShieldCheck size={10} /> {meta.label}
        </span>
        <span className="gd-badge" style={{ color: C.muted, background: C.bg, borderColor: C.borderL }}>
          {PACKAGE_TYPES[item.packageType] || "Package"}
        </span>
        <span className="gd-time"><Clock3 size={11} />{relTime(item.createdAt)}</span>
      </div>

      <div className="gd-card-title" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <h3 style={{ margin: 0, font: "inherit", color: "inherit" }}>{item.courierName || "Unknown courier"}</h3>
        <span className="gd-meta-badge">Flat {item.flatNumber || "—"}</span>
      </div>

      <div className="gd-meta" aria-label="Delivery details">
        <span className="gd-meta-item"><Package size={12} /> Flat {item.flatNumber || "—"}</span>
        <span className="gd-meta-sep">•</span>
        <span className="gd-meta-item"><User size={12} /> {item.agentName || "—"}</span>
        <span className="gd-meta-sep">•</span>
        <span className="gd-meta-item"><Phone size={12} /> {item.agentPhone || "—"}</span>
        <span className="gd-meta-sep">•</span>
        <span className="gd-meta-item"><Clock3 size={12} /> {fmtTime(item.entryTime || item.createdAt)}</span>
        <span className="gd-meta-sep">•</span>
        <span className="gd-meta-item"><Truck size={12} /> {FULFILLMENT_LABEL[item.fulfillmentMode] || "Keep at gate"}</span>
      </div>

      {/* Pending — waiting for resident to approve from their dashboard */}
      {isPending && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "9px 12px", borderRadius: 10,
          background: "#FFFBEB", border: "1px solid #FCD34D",
          fontSize: "0.76rem", fontWeight: 600, color: "#B45309",
        }}>
          <Hourglass size={13} />
          Resident has been notified — waiting for their approval
        </div>
      )}

      {/* Approved — ready for handover */}
      {isApproved && (
        <>
          <div className="gd-card-actions">
            <button className="gd-btn" disabled={busy("handover") || busy("return")} onClick={() => setShowHandover(v => !v)}>
              <ArrowDownToLine size={14} />
              {busy("handover") ? "Marking…" : "Mark Handover"}
            </button>
            <button className="gd-btn-ghost" disabled={busy("handover") || busy("return")} onClick={() => onReturn(item._id)}>
              <RotateCcw size={13} />
              {busy("return") ? "Marking…" : "Return"}
            </button>
          </div>

          <AnimatePresence initial={false}>
            {showHandover && (
              <motion.div key="handover-box" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.26, ease: EASE }} style={{ overflow: "hidden" }}>
                <div className="gd-inline-box">
                  <label className="gd-label">Who collected it? (optional)</label>
                  <input className="gd-input" placeholder="e.g. Priya Sharma (resident)" value={receiverName} onChange={e => setReceiverName(e.target.value)} />
                  <div style={{ display: "flex", gap: 7, marginTop: 8 }}>
                    <button className="gd-btn" disabled={busy("handover")} onClick={submitHandover}>
                      {busy("handover") ? (
                        <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }} style={{ display: "inline-flex" }}>
                          <RefreshCw size={13} />
                        </motion.span>
                      ) : (
                        <CheckCircle2 size={13} />
                      )}
                      Confirm handover
                    </button>
                    <button className="gd-btn-ghost" disabled={busy("handover")} onClick={() => setShowHandover(false)}>Cancel</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {item.rejectionReason && (
        <div style={{ marginTop: 8, borderRadius: 9, border: `1px solid ${C.redBr}`, background: C.redL, padding: "7px 9px" }}>
          <p style={{ margin: 0, fontSize: "0.72rem", color: "#B91C1C", fontWeight: 700 }}>
            Reason: {item.rejectionReason}
          </p>
        </div>
      )}
    </motion.article>
  );
}

function PreRegCard({ item }) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.25, ease: EASE }}
      className="gd-card"
      style={{ "--accent": C.green }}
    >
      <div className="gd-card-top">
        <span className="gd-badge" style={{ color: C.green, background: C.greenL, borderColor: C.greenBr }}>
          <CalendarDays size={10} /> Expected
        </span>
        <span className="gd-time"><Clock3 size={11} />{fmtTime(item.expectedDate)}</span>
      </div>

      <div className="gd-card-title" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <h3 style={{ margin: 0, font: "inherit", color: "inherit" }}>{item.expectedCourier || "Any courier"}</h3>
        <span className="gd-meta-badge">Flat {item.flatNumber || "—"}</span>
      </div>

      <div className="gd-meta" aria-label="Expected delivery details">
        <span className="gd-meta-item"><Package size={12} /> {PACKAGE_TYPES[item.packageType] || "Parcel"}</span>
        <span className="gd-meta-sep">•</span>
        <span className="gd-meta-item"><Truck size={12} /> {item.packageCount || 1} pkg</span>
        <span className="gd-meta-sep">•</span>
        <span className="gd-meta-item"><Clock3 size={12} /> {new Date(item.expectedDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>
        <span className="gd-meta-sep">•</span>
        <span className="gd-meta-item"><ShieldCheck size={12} /> Auto-approve</span>
      </div>
    </motion.article>
  );
}

/* ── Main page ────────────────────────────────────────────────────────────── */
export function GateDeliveryPage() {
  const { token, user } = useAuth();

  const [active,        setActive]        = useState([]);
  const [preRegs,       setPreRegs]       = useState([]);
  const [occupiedFlats, setOccupiedFlats] = useState([]); // [{ label, value }]
  const [loading,       setLoading]       = useState(false);
  const [refreshing,    setRefreshing]    = useState(false);
  const [busyAction,    setBusyAction]    = useState("");
  const [error,         setError]         = useState("");
  const [filter,        setFilter]        = useState("all");
  const [submitting,    setSubmitting]    = useState(false);
  const [showPreRegs,   setShowPreRegs]   = useState(false);
  const [showLogDrawer, setShowLogDrawer] = useState(false);
  const [activeView,    setActiveView]    = useState("live");
  const [flatSearch,    setFlatSearch]    = useState("");
  const [flatDropOpen,  setFlatDropOpen]  = useState(false);

  const [form, setForm] = useState({
    flatNumber: "", courierName: "", agentName: "",
    agentPhone: "", packageCount: "", gateId: "", notes: "",
  });

  /* ── Load ──────────────────────────────── */
  const loadData = useCallback(async ({ soft = false } = {}) => {
    if (soft) setRefreshing(true); else setLoading(true);
    setError("");
    try {
      const [activeResult, preRegResult] = await Promise.allSettled([
        apiRequest("/delivery/active", { token }),
        apiRequest("/delivery-prereg/upcoming", { token }),
      ]);
      if (activeResult.status === "fulfilled")  setActive(activeResult.value.items || []);
      else setError(activeResult.reason?.message || "Failed to load deliveries");
      if (preRegResult.status === "fulfilled")  setPreRegs(preRegResult.value.items || []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { loadData(); }, [loadData]);

  // Fetch occupied flats once on mount for the flat dropdown
  useEffect(() => {
    if (!token || !user?.tenantId) return;
    apiRequest(`/societies/${user.tenantId}/units`, { token, notifyError: false })
      .then(data => {
        const allUnits  = data.allUnits || [];
        const vacantIds = new Set((data.items || []).map(u => String(u._id)));
        const occupied  = allUnits
          .filter(u => !vacantIds.has(String(u._id)))
          .map(u => ({
            label: u.wing ? `${u.wing.name}-${u.unitNumber}` : u.unitNumber,
            value: u.wing ? `${u.wing.name}-${u.unitNumber}` : u.unitNumber,
          }))
          .sort((a, b) => a.label.localeCompare(b.label));
        setOccupiedFlats(occupied);
      })
      .catch(() => {});
  }, [token, user?.tenantId]);

  /* ── Derived ───────────────────────────── */
  const pendingCount  = useMemo(() => active.filter(d => d.status === "awaiting_approval").length, [active]);
  const approvedCount = useMemo(() => active.filter(d => ["approved_auto", "approved_manual"].includes(d.status)).length, [active]);

  const filtered = useMemo(() => {
    if (filter === "pending")  return active.filter(d => d.status === "awaiting_approval");
    if (filter === "approved") return active.filter(d => ["approved_auto", "approved_manual"].includes(d.status));
    return active;
  }, [active, filter]);

  const sortedPreRegs = useMemo(
    () => [...preRegs].sort((a, b) => new Date(a.expectedDate) - new Date(b.expectedDate)),
    [preRegs],
  );

  /* ── Handlers ──────────────────────────── */
  function setField(key, val) { setForm(p => ({ ...p, [key]: val })); }

  async function handleLog(e) {
    e.preventDefault();
    if (!form.flatNumber || !form.courierName.trim()) {
      setError("Flat number and courier name are required.");
      return;
    }
    setSubmitting(true); setError("");
    try {
      const data = await apiRequest("/delivery", {
        method: "POST", token,
        body: {
          flatNumber:   form.flatNumber,
          courierName:  form.courierName.trim(),
          agentName:    form.agentName.trim(),
          agentPhone:   form.agentPhone.trim(),
          packageCount: Number(form.packageCount) || 1,
          gateId:       form.gateId.trim(),
          notes:        form.notes.trim(),
        },
      });
      setActive(prev => [data.item, ...prev]);
      setForm({ flatNumber: "", courierName: "", agentName: "", agentPhone: "", packageCount: "", gateId: "", notes: "" });
      setFlatSearch("");
      setShowLogDrawer(false);
    } catch (err) {
      setError(err.message || "Failed to log delivery");
    } finally {
      setSubmitting(false);
    }
  }

  // Real-time: resident approved or rejected from their dashboard
  useEffect(() => {
    const socket = getSocket();
    function onApproved({ delivery }) {
      setActive(prev => prev.map(d => d._id === delivery._id ? delivery : d));
    }
    function onRejected({ delivery }) {
      setActive(prev => prev.filter(d => d._id !== delivery._id));
    }
    socket.on("delivery:approved", onApproved);
    socket.on("delivery:rejected", onRejected);
    return () => {
      socket.off("delivery:approved", onApproved);
      socket.off("delivery:rejected", onRejected);
    };
  }, []);

  async function handleHandover(id, receiverName) {
    setBusyAction(`${id}:handover`); setError("");
    try {
      await apiRequest(`/delivery/${id}/handover`, { method: "POST", token, body: { receiverName } });
      setActive(prev => prev.filter(d => d._id !== id));
    } catch (err) { setError(err.message || "Failed to mark handover"); }
    finally { setBusyAction(""); }
  }

  async function handleReturn(id) {
    setBusyAction(`${id}:return`); setError("");
    try {
      await apiRequest(`/delivery/${id}/return`, { method: "POST", token });
      setActive(prev => prev.filter(d => d._id !== id));
    } catch (err) { setError(err.message || "Failed to mark return"); }
    finally { setBusyAction(""); }
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="gd-root">
        <div className="gd-shell">

          {/* ── Header ── */}
          <motion.div className="gd-header" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.42, ease: EASE }}>
            <div>
              
              <h1 className="gd-title">Delivery <span>Gate</span></h1>
              <p className="gd-sub">Log arriving agents, approve or reject deliveries, and confirm handovers — all from one screen.</p>
            </div>
            <div className="gd-actions">
              <button className="gd-btn-main" onClick={() => setShowLogDrawer(true)}>
                <Plus size={14} /> Log Delivery
              </button>
              <button className="gd-btn-ghost" onClick={() => loadData({ soft: true })} disabled={refreshing}>
                <RefreshCw size={13} style={{ animation: refreshing ? "gd-spin 1s linear infinite" : "none" }} />
                {refreshing ? "Refreshing…" : "Refresh"}
              </button>
            </div>
          </motion.div>

          {/* ── Error ── */}
          <AnimatePresence>
            {error && (
              <motion.div key="err" className="gd-error" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }}>
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <section className="gd-main">
            <div className="gd-tab-rail" role="tablist" aria-label="Gate workspace views">
              {VIEW_TABS.map(({ key, label, Icon }) => {
                const isActive = activeView === key;
                const count = key === "live" ? filtered.length : sortedPreRegs.length;

                return (
                  <motion.button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className="gd-tab"
                    onClick={() => setActiveView(key)}
                    animate={{ color: isActive ? C.ink : C.muted }}
                    whileHover={{ color: isActive ? C.ink : C.ink2 }}
                    whileTap={{ scale: 0.96 }}
                    transition={{ color: { duration: 0.14 } }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="gate-active-tab"
                        className="gd-tab-underline"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="gd-tab-inner">
                      <Icon size={12} />
                      <span>{label}</span>
                      <span>({count})</span>
                    </span>
                  </motion.button>
                );
              })}
            </div>

            <motion.div className="gd-panel" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14, duration: 0.4, ease: EASE }}>
              <div className="gd-panel-head">
                <div>
                  <h2 className="gd-panel-title">{activeView === "live" ? "Active Queue" : "Expected Deliveries"}</h2>
                  <p className="gd-panel-sub">
                    {activeView === "live" ? "Deliveries needing action at the gate right now" : "Pre-registered deliveries expected today and upcoming"}
                  </p>
                </div>
              </div>

              {activeView === "live" && (
                <div className="gd-chips">
                  {[
                    { key: "all",      label: `All (${active.length})`       },
                    { key: "pending",  label: `Pending (${pendingCount})`    },
                    { key: "approved", label: `Approved (${approvedCount})`  },
                  ].map(({ key, label }) => (
                    <button key={key} className={`gd-chip${filter === key ? " active" : ""}`} onClick={() => setFilter(key)}>
                      {label}
                    </button>
                  ))}
                </div>
              )}

              <motion.div layout className="gd-list">
                {loading && [0, 1, 2].map(i => <GdSkeleton key={i} />)}

                <AnimatePresence mode="popLayout">
                  {!loading && activeView === "live" && filtered.length === 0 && (
                    <motion.div key="empty" className="gd-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <div className="gd-empty-icon"><Package size={20} /></div>
                      <h3>Nothing here</h3>
                      <p>{filter !== "all" ? "No deliveries in this category." : "Log an incoming delivery using the form."}</p>
                    </motion.div>
                  )}

                  {!loading && activeView === "live" && filtered.map(item => (
                    <GateCard
                      key={item._id}
                      item={item}
                      busyAction={busyAction}
                      onHandover={handleHandover}
                      onReturn={handleReturn}
                    />
                  ))}

                  {!loading && activeView === "expected" && sortedPreRegs.length === 0 && (
                    <motion.div key="empty-prereg" className="gd-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <div className="gd-empty-icon"><CalendarDays size={20} /></div>
                      <h3>No expected deliveries</h3>
                      <p>Pre-registrations will appear here once residents submit them.</p>
                    </motion.div>
                  )}

                  {!loading && activeView === "expected" && sortedPreRegs.map((item) => (
                    <PreRegCard key={item._id} item={item} />
                  ))}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          </section>

          <AnimatePresence>
            {showLogDrawer && (
              <motion.div
                className="gd-modal-backdrop"
                onClick={() => setShowLogDrawer(false)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <motion.div
                  className="gd-modal"
                  onClick={(event) => event.stopPropagation()}
                  initial={{ opacity: 0, scale: 0.96, y: 18 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 18 }}
                  transition={{ duration: 0.24, ease: EASE }}
                >
                  <div className="gd-modal-head">
                    <div>
                      <h2 className="gd-panel-title" style={{ marginBottom: 2 }}>Log Delivery</h2>
                      <p className="gd-panel-sub" style={{ marginBottom: 0 }}>Tap-select, type minimal details, submit.</p>
                    </div>
                    <button type="button" className="gd-icon-btn" onClick={() => setShowLogDrawer(false)}>
                      <X size={15} />
                    </button>
                  </div>

                  <div className="gd-modal-body">
                    <form className="gd-modal-form" onSubmit={handleLog}>
                      <div className="gd-form-group">
                        <label className="gd-label">Courier Name</label>
                        <input
                          className="gd-input"
                          placeholder="Type courier name (e.g. Amazon, DTDC)"
                          value={form.courierName}
                          onChange={(e) => setField("courierName", e.target.value)}
                        />
                      </div>

                      {/* Flat dropdown — occupied flats only */}
                      <div className="gd-form-group" style={{ position: "relative" }}>
                        <label className="gd-label">Flat </label>
                        <input
                          className="gd-input"
                          placeholder={occupiedFlats.length ? "Search flat… e.g. A-101" : "Loading flats…"}
                          value={flatSearch || form.flatNumber}
                          onFocus={() => { setFlatSearch(""); setFlatDropOpen(true); }}
                          onChange={e => { setFlatSearch(e.target.value); setField("flatNumber", ""); setFlatDropOpen(true); }}
                          autoComplete="off"
                        />
                        {form.flatNumber && !flatDropOpen && (
                          <span style={{ position: "absolute", right: 10, top: "calc(50% + 8px)", transform: "translateY(-50%)", fontSize: "0.7rem", fontWeight: 700, color: C.green }}>
                            ✓ {form.flatNumber}
                          </span>
                        )}
                        {flatDropOpen && (
                          <>
                            <div
                              style={{ position: "fixed", inset: 0, zIndex: 49 }}
                              onClick={() => { setFlatDropOpen(false); setFlatSearch(""); }}
                            />
                            <div style={{
                              position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
                              background: C.surface, border: `1.5px solid ${C.indigoBr}`,
                              borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                              maxHeight: 200, overflowY: "auto", marginTop: 3,
                            }}>
                              {occupiedFlats
                                .filter(f => !flatSearch || f.label.toLowerCase().includes(flatSearch.toLowerCase()))
                                .slice(0, 40)
                                .map(f => (
                                  <button
                                    key={f.value}
                                    type="button"
                                    onMouseDown={() => {
                                      setField("flatNumber", f.value);
                                      setFlatSearch("");
                                      setFlatDropOpen(false);
                                    }}
                                    style={{
                                      display: "block", width: "100%", textAlign: "left",
                                      padding: "9px 13px", border: "none", background: "transparent",
                                      fontSize: "0.82rem", fontWeight: 600, color: C.ink,
                                      cursor: "pointer", fontFamily: "inherit",
                                      borderBottom: `1px solid ${C.borderL}`,
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = C.indigoL}
                                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                  >
                                    Flat {f.label}
                                  </button>
                                ))}
                              {occupiedFlats.filter(f => !flatSearch || f.label.toLowerCase().includes(flatSearch.toLowerCase())).length === 0 && (
                                <p style={{ padding: "10px 13px", fontSize: "0.78rem", color: C.faint, margin: 0 }}>No flats found</p>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      <div className="gd-form-row" style={{ marginBottom: 10 }}>
                        <div>
                          <label className="gd-label">Agent Name</label>
                          <input className="gd-input" placeholder="Ravi Kumar" value={form.agentName} onChange={(e) => setField("agentName", e.target.value)} />
                        </div>
                        <div>
                          <label className="gd-label">Agent Phone</label>
                          <input className="gd-input" placeholder="9876543210" value={form.agentPhone} onChange={(e) => setField("agentPhone", e.target.value)} />
                        </div>
                      </div>

                      <div className="gd-form-row" style={{ marginBottom: 10 }}>
                        <div>
                          <label className="gd-label">Package Count</label>
                          <input className="gd-input" type="number" min="1" placeholder="1" value={form.packageCount} onChange={(e) => setField("packageCount", e.target.value)} />
                        </div>
                        <div>
                          <label className="gd-label">Gate ID</label>
                          <input className="gd-input" placeholder="Gate 1" value={form.gateId} onChange={(e) => setField("gateId", e.target.value)} />
                        </div>
                      </div>

                      <button type="submit" className="gd-btn" style={{ width: "100%", justifyContent: "center", marginTop: 8 }} disabled={submitting}>
                        <Truck size={14} />
                        {submitting ? "Logging…" : "Log Delivery"}
                      </button>
                    </form>

                    <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
                      <div className="gd-prereg-switch-rail">
                        <motion.button
                          type="button"
                          className="gd-prereg-toggle"
                          onClick={() => setShowPreRegs((value) => !value)}
                          animate={{ color: showPreRegs ? C.ink : C.muted }}
                          whileHover={{ color: showPreRegs ? C.ink : C.ink2 }}
                          whileTap={{ scale: 0.96 }}
                          transition={{ color: { duration: 0.14 } }}
                        >
                          {showPreRegs && <motion.span layoutId="gd-prereg-toggle-line" className="gd-prereg-underline" />}
                          <span className="gd-prereg-toggle-inner">
                            <CalendarDays size={12} style={{ flexShrink: 0 }} />
                            <span>Expected today and upcoming</span>
                          </span>
                        </motion.button>
                      </div>

                      <AnimatePresence initial={false}>
                        {showPreRegs && (
                          <motion.div
                            key="drawer-prereg"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.22, ease: EASE }}
                            style={{ overflow: "hidden" }}
                          >
                            <div style={{ display: "flex", flexDirection: "column", gap: 7, paddingTop: 10 }}>
                              {sortedPreRegs.slice(0, 5).map((item) => (
                                <PreRegCard key={`drawer-${item._id}`} item={item} />
                              ))}
                              {sortedPreRegs.length === 0 && (
                                <div className="gd-empty" style={{ padding: "18px 12px" }}>
                                  <h3 style={{ fontSize: "0.84rem" }}>No expected deliveries</h3>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </>
  );
}
