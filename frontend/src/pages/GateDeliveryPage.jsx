import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, XCircle, Package, Truck, RefreshCw,
  Clock3, ShieldCheck, ArrowDownToLine, RotateCcw,
  User, Hash, Phone, CalendarDays,
} from "lucide-react";
import { apiRequest } from "../components/api";
import { useAuth } from "../components/AuthContext";

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

const COURIERS = ["Amazon", "Blinkit", "Swiggy", "Zepto", "Flipkart", "Zomato", "DTDC", "BlueDart"];

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

  /* ── Metrics ─────────────────────────────── */
  .gd-metrics {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-bottom: 14px;
  }

  .gd-metric {
    border-radius: 16px;
    border: 1px solid ${C.border};
    background: ${C.surface};
    padding: 13px;
    box-shadow: 0 6px 18px rgba(28,28,30,0.05);
  }

  .gd-metric-val {
    font-size: 1.55rem;
    font-weight: 800;
    letter-spacing: -0.04em;
    line-height: 1;
  }

  .gd-metric-lbl {
    margin-top: 5px;
    font-size: 0.71rem;
    font-weight: 700;
    color: ${C.muted};
  }

  /* ── Main grid ───────────────────────────── */
  .gd-grid {
    display: grid;
    grid-template-columns: 1fr 380px;
    gap: 14px;
    align-items: start;
  }

  /* ── Panel ───────────────────────────────── */
  .gd-panel {
    border-radius: 20px;
    border: 1px solid ${C.border};
    background: ${C.surface};
    box-shadow: 0 8px 22px rgba(28,28,30,0.06);
    padding: 16px;
  }

  .gd-panel-sticky {
    position: sticky;
    top: 24px;
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
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    margin-bottom: 10px;
  }

  .gd-meta-item {
    border-radius: 9px;
    border: 1px solid ${C.borderL};
    background: ${C.bg};
    padding: 6px 8px;
    min-width: 0;
  }

  .gd-meta-key {
    font-size: 0.62rem;
    font-weight: 700;
    color: ${C.faint};
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .gd-meta-val {
    font-size: 0.78rem;
    font-weight: 700;
    color: ${C.ink2};
    margin-top: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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
    border: 1px solid ${C.border};
    background: ${C.surface};
    padding: 9px 11px;
    color: ${C.ink};
    font-size: 0.82rem;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 600;
    outline: none;
    transition: border-color 0.18s, box-shadow 0.18s;
    box-sizing: border-box;
  }
  .gd-textarea { resize: vertical; min-height: 68px; }
  .gd-input::placeholder, .gd-textarea::placeholder { color: ${C.faint}; font-weight: 400; }
  .gd-input:focus, .gd-select:focus, .gd-textarea:focus {
    border-color: ${C.indigoBr};
    box-shadow: 0 0 0 3px rgba(79,70,229,0.1);
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

  .gd-form-group { margin-bottom: 10px; }

  .gd-courier-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-top: 6px;
  }

  .gd-courier-pill {
    border: 1px solid ${C.border};
    border-radius: 999px;
    padding: 3px 9px;
    font-size: 0.65rem;
    font-weight: 800;
    background: ${C.surface};
    color: ${C.muted};
    cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    transition: all 0.15s;
  }
  .gd-courier-pill:hover { border-color: ${C.amberBr}; color: ${C.amberD}; }
  .gd-courier-pill.selected { background: ${C.amberL}; border-color: ${C.amberBr}; color: ${C.amberD}; }

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
  .gd-prereg-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 11px 13px;
    border-radius: 12px;
    border: 1px solid ${C.borderL};
    background: ${C.bg};
    transition: border-color 0.18s, box-shadow 0.18s;
  }
  .gd-prereg-item:hover {
    border-color: #C7C7CC;
    box-shadow: 0 4px 12px rgba(28,28,30,0.07);
  }
  .gd-prereg-date {
    width: 38px; flex-shrink: 0;
    background: ${C.green};
    border-radius: 9px;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 6px 4px;
    box-shadow: 0 2px 8px rgba(22,163,74,0.26);
  }
  .gd-prereg-day   { font-size: 1rem; font-weight: 800; color: #fff; line-height: 1; }
  .gd-prereg-month { font-size: 0.44rem; font-weight: 700; color: rgba(255,255,255,0.75); text-transform: uppercase; letter-spacing: 0.06em; margin-top: 2px; }

  @keyframes gd-shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes gd-spin { to { transform: rotate(360deg); } }

  @media (max-width: 960px) {
    .gd-grid { grid-template-columns: 1fr; }
    .gd-panel-sticky { position: static; }
  }
  @media (max-width: 640px) {
    .gd-metrics { grid-template-columns: 1fr; }
    .gd-form-row { grid-template-columns: 1fr; }
    .gd-meta { grid-template-columns: 1fr; }
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
      <div className="gd-sk" style={{ width: "66%", height: 12 }} />
    </div>
  );
}

/* ── Gate delivery card ───────────────────────────────────────────────────── */
function GateCard({ item, busyAction, onApprove, onReject, onHandover, onReturn }) {
  const meta      = STATUS_META[item.status] || STATUS_META.created;
  const isPending  = item.status === "awaiting_approval";
  const isApproved = ["approved_auto", "approved_manual"].includes(item.status);

  const [showReject,   setShowReject]   = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showHandover, setShowHandover] = useState(false);
  const [receiverName, setReceiverName] = useState("");

  const busy = (suffix) => busyAction === `${item._id}:${suffix}`;

  function cardClass() {
    if (isPending)  return "gd-card pending";
    if (isApproved) return "gd-card approved";
    return "gd-card";
  }

  async function submitReject() {
    await onReject(item._id, rejectReason.trim());
    setShowReject(false);
    setRejectReason("");
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

      <h3 className="gd-card-title">{item.courierName || "Unknown courier"}</h3>

      {/* Meta grid */}
      <div className="gd-meta">
        <div className="gd-meta-item">
          <p className="gd-meta-key">Flat</p>
          <p className="gd-meta-val">{item.flatNumber || "—"}</p>
        </div>
        <div className="gd-meta-item">
          <p className="gd-meta-key">Agent</p>
          <p className="gd-meta-val">{item.agentName || "—"}</p>
        </div>
        <div className="gd-meta-item">
          <p className="gd-meta-key">Arrived</p>
          <p className="gd-meta-val">{fmtTime(item.entryTime || item.createdAt)}</p>
        </div>
        <div className="gd-meta-item">
          <p className="gd-meta-key">Agent phone</p>
          <p className="gd-meta-val">{item.agentPhone || "—"}</p>
        </div>
      </div>

      {/* Pending actions */}
      {isPending && (
        <>
          <div className="gd-card-actions">
            <button className="gd-btn-amber" disabled={busy("approve") || busy("reject")} onClick={() => onApprove(item._id)}>
              <CheckCircle2 size={14} />
              {busy("approve") ? "Approving…" : "Approve"}
            </button>
            <button className="gd-btn-danger" disabled={busy("approve") || busy("reject")} onClick={() => setShowReject(v => !v)}>
              <XCircle size={14} /> Reject
            </button>
          </div>

          <AnimatePresence initial={false}>
            {showReject && (
              <motion.div key="reject-box" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.26, ease: EASE }} style={{ overflow: "hidden" }}>
                <div className="gd-inline-box">
                  <label className="gd-label" style={{ color: "#B91C1C" }}>Rejection reason (optional)</label>
                  <textarea className="gd-textarea" placeholder="e.g. Not expecting this delivery" value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
                  <div style={{ display: "flex", gap: 7, marginTop: 8 }}>
                    <button className="gd-btn-danger" disabled={busy("reject")} onClick={submitReject}>
                      {busy("reject") ? "Rejecting…" : "Confirm reject"}
                    </button>
                    <button className="gd-btn-ghost" disabled={busy("reject")} onClick={() => setShowReject(false)}>Cancel</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
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
                      <CheckCircle2 size={13} />
                      {busy("handover") ? "Saving…" : "Confirm handover"}
                    </button>
                    <button className="gd-btn-ghost" disabled={busy("handover")} onClick={() => setShowHandover(false)}>Cancel</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Rejection reason display */}
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

/* ── Main page ────────────────────────────────────────────────────────────── */
export function GateDeliveryPage() {
  const { token } = useAuth();

  const [active,      setActive]      = useState([]);
  const [preRegs,     setPreRegs]     = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [refreshing,  setRefreshing]  = useState(false);
  const [busyAction,  setBusyAction]  = useState("");
  const [error,       setError]       = useState("");
  const [filter,      setFilter]      = useState("all");
  const [submitting,  setSubmitting]  = useState(false);

  const [form, setForm] = useState({
    flatNumber: "", courierName: "", agentName: "",
    agentPhone: "", packageType: "parcel", packageCount: 1,
    gateId: "", notes: "",
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

  /* ── Derived ───────────────────────────── */
  const pendingCount  = useMemo(() => active.filter(d => d.status === "awaiting_approval").length, [active]);
  const approvedCount = useMemo(() => active.filter(d => ["approved_auto", "approved_manual"].includes(d.status)).length, [active]);

  const filtered = useMemo(() => {
    if (filter === "pending")  return active.filter(d => d.status === "awaiting_approval");
    if (filter === "approved") return active.filter(d => ["approved_auto", "approved_manual"].includes(d.status));
    return active;
  }, [active, filter]);

  /* ── Handlers ──────────────────────────── */
  function setField(key, val) { setForm(p => ({ ...p, [key]: val })); }

  async function handleLog(e) {
    e.preventDefault();
    if (!form.flatNumber.trim() || !form.courierName.trim() || !form.agentName.trim()) {
      setError("Flat number, courier name, and agent name are required.");
      return;
    }
    setSubmitting(true); setError("");
    try {
      const data = await apiRequest("/delivery", {
        method: "POST", token,
        body: {
          flatNumber:   form.flatNumber.trim(),
          courierName:  form.courierName.trim(),
          agentName:    form.agentName.trim(),
          agentPhone:   form.agentPhone.trim(),
          packageType:  form.packageType,
          packageCount: Number(form.packageCount) || 1,
          gateId:       form.gateId.trim(),
          notes:        form.notes.trim(),
        },
      });
      setActive(prev => [data.item, ...prev]);
      setForm({ flatNumber: "", courierName: "", agentName: "", agentPhone: "", packageType: "parcel", packageCount: 1, gateId: "", notes: "" });
    } catch (err) {
      setError(err.message || "Failed to log delivery");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleApprove(id) {
    setBusyAction(`${id}:approve`); setError("");
    try {
      const data = await apiRequest(`/delivery/${id}/approve`, { method: "POST", token });
      setActive(prev => prev.map(d => d._id === id ? data.item : d));
    } catch (err) { setError(err.message || "Failed to approve"); }
    finally { setBusyAction(""); }
  }

  async function handleReject(id, reason) {
    setBusyAction(`${id}:reject`); setError("");
    try {
      const data = await apiRequest(`/delivery/${id}/reject`, { method: "POST", token, body: { rejectionReason: reason } });
      setActive(prev => prev.filter(d => d._id !== data.item._id));
    } catch (err) { setError(err.message || "Failed to reject"); }
    finally { setBusyAction(""); }
  }

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
              <div className="gd-eyebrow">
                <Truck size={12} /> Gate Console
              </div>
              <h1 className="gd-title">Delivery <span>Gate</span></h1>
              <p className="gd-sub">Log arriving agents, approve or reject deliveries, and confirm handovers — all from one screen.</p>
            </div>
            <div className="gd-actions">
              <button className="gd-btn-ghost" onClick={() => loadData({ soft: true })} disabled={refreshing}>
                <RefreshCw size={13} style={{ animation: refreshing ? "gd-spin 1s linear infinite" : "none" }} />
                {refreshing ? "Refreshing…" : "Refresh"}
              </button>
            </div>
          </motion.div>

          {/* ── Metrics ── */}
          <div className="gd-metrics">
            {[
              { val: pendingCount,  label: "Awaiting approval", color: C.amber  },
              { val: approvedCount, label: "Ready for handover", color: C.indigo },
              { val: active.length, label: "Total active",       color: C.ink    },
            ].map(({ val, label, color }, i) => (
              <motion.div key={label} className="gd-metric" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 * i, duration: 0.38, ease: EASE }}>
                <p className="gd-metric-val" style={{ color }}>{val}</p>
                <p className="gd-metric-lbl">{label}</p>
              </motion.div>
            ))}
          </div>

          {/* ── Error ── */}
          <AnimatePresence>
            {error && (
              <motion.div key="err" className="gd-error" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }}>
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Main grid ── */}
          <div className="gd-grid">

            {/* Left: active queue */}
            <motion.div className="gd-panel" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14, duration: 0.4, ease: EASE }}>
              <h2 className="gd-panel-title">Active Queue</h2>
              <p className="gd-panel-sub">Deliveries needing action at the gate right now</p>

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

              <motion.div layout className="gd-list">
                {loading && [0, 1, 2].map(i => <GdSkeleton key={i} />)}

                <AnimatePresence mode="popLayout">
                  {!loading && filtered.length === 0 && (
                    <motion.div key="empty" className="gd-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <div className="gd-empty-icon"><Package size={20} /></div>
                      <h3>Nothing here</h3>
                      <p>{filter !== "all" ? "No deliveries in this category." : "Log an incoming delivery using the form."}</p>
                    </motion.div>
                  )}

                  {!loading && filtered.map(item => (
                    <GateCard
                      key={item._id}
                      item={item}
                      busyAction={busyAction}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      onHandover={handleHandover}
                      onReturn={handleReturn}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            </motion.div>

            {/* Right: log delivery form */}
            <motion.aside className="gd-panel gd-panel-sticky" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4, ease: EASE }}>
              <h2 className="gd-panel-title">Log Delivery</h2>
              <p className="gd-panel-sub">Record a new delivery agent at the gate</p>

              <form onSubmit={handleLog}>
                {/* Flat + Courier */}
                <div className="gd-form-row" style={{ marginBottom: 10 }}>
                  <div>
                    <label className="gd-label"><Hash size={10} style={{ display: "inline" }} /> Flat *</label>
                    <input className="gd-input" placeholder="A-101" value={form.flatNumber} onChange={e => setField("flatNumber", e.target.value)} required />
                  </div>
                  <div>
                    <label className="gd-label"><Package size={10} style={{ display: "inline" }} /> Type</label>
                    <select className="gd-select" value={form.packageType} onChange={e => setField("packageType", e.target.value)}>
                      {Object.entries(PACKAGE_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                </div>

                <div className="gd-form-group">
                  <label className="gd-label"><Truck size={10} style={{ display: "inline" }} /> Courier *</label>
                  <input className="gd-input" placeholder="e.g. Amazon" value={form.courierName} onChange={e => setField("courierName", e.target.value)} required />
                  <div className="gd-courier-pills">
                    {COURIERS.map(c => (
                      <button key={c} type="button" className={`gd-courier-pill${form.courierName === c ? " selected" : ""}`} onClick={() => setField("courierName", c)}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="gd-form-row" style={{ marginBottom: 10 }}>
                  <div>
                    <label className="gd-label"><User size={10} style={{ display: "inline" }} /> Agent name *</label>
                    <input className="gd-input" placeholder="Ravi Kumar" value={form.agentName} onChange={e => setField("agentName", e.target.value)} required />
                  </div>
                  <div>
                    <label className="gd-label"><Phone size={10} style={{ display: "inline" }} /> Agent phone</label>
                    <input className="gd-input" placeholder="9876543210" value={form.agentPhone} onChange={e => setField("agentPhone", e.target.value)} />
                  </div>
                </div>

                <div className="gd-form-row" style={{ marginBottom: 10 }}>
                  <div>
                    <label className="gd-label">Count</label>
                    <input className="gd-input" type="number" min="1" value={form.packageCount} onChange={e => setField("packageCount", e.target.value)} />
                  </div>
                  <div>
                    <label className="gd-label">Gate ID</label>
                    <input className="gd-input" placeholder="Gate 1" value={form.gateId} onChange={e => setField("gateId", e.target.value)} />
                  </div>
                </div>

                <div className="gd-form-group">
                  <label className="gd-label">Notes</label>
                  <textarea className="gd-textarea" style={{ minHeight: 58 }} placeholder="Optional notes" value={form.notes} onChange={e => setField("notes", e.target.value)} />
                </div>

                <button type="submit" className="gd-btn-amber" style={{ width: "100%", justifyContent: "center" }} disabled={submitting}>
                  <Truck size={14} />
                  {submitting ? "Logging…" : "Log Delivery →"}
                </button>
              </form>

              {/* ── Upcoming pre-registrations ── */}
              {preRegs.length > 0 && (
                <div style={{ marginTop: 20, paddingTop: 18, borderTop: `1px solid ${C.border}` }}>
                  <p style={{ fontSize: "0.68rem", fontWeight: 800, color: C.indigo, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 10px" }}>
                    <CalendarDays size={11} style={{ display: "inline", marginRight: 5 }} />
                    Expected today &amp; upcoming
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {preRegs.map(pr => (
                      <div key={pr._id} className="gd-prereg-item">
                        <div className="gd-prereg-date">
                          <span className="gd-prereg-day">
                            {new Date(pr.expectedDate).toLocaleDateString("en-IN", { day: "numeric" })}
                          </span>
                          <span className="gd-prereg-month">
                            {new Date(pr.expectedDate).toLocaleDateString("en-IN", { month: "short" })}
                          </span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: "0.84rem", fontWeight: 700, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {pr.expectedCourier || "Any courier"}
                          </p>
                          <p style={{ margin: "2px 0 0", fontSize: "0.72rem", color: C.muted, fontWeight: 500 }}>
                            Flat {pr.flatNumber} · {PACKAGE_TYPES[pr.packageType] || "Parcel"}
                            {pr.packageCount > 1 ? ` ×${pr.packageCount}` : ""}
                          </p>
                        </div>
                        <span style={{ fontSize: "0.62rem", fontWeight: 800, color: C.green, background: C.greenL, border: `1px solid ${C.greenBr}`, borderRadius: 999, padding: "2px 8px", flexShrink: 0 }}>
                          Auto-approve
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.aside>
          </div>

        </div>
      </div>
    </>
  );
}
