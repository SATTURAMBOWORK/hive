import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Truck,
  XCircle,
} from "lucide-react";
import { apiRequest } from "../components/api";
import { useAuth } from "../components/AuthContext";

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
  amber: "#E8890C",
  amberD: "#D97706",
  amberL: "#FFFBEB",
  amberBr: "#FCD34D",
  green: "#16A34A",
  greenL: "#DCFCE7",
  shadow: "0 14px 32px rgba(28,28,30,0.08)",
  shadowSoft: "0 8px 22px rgba(28,28,30,0.06)",
};

const DELIVERY_STATUS_META = {
  awaiting_approval: { label: "Awaiting Approval", color: "#B45309", bg: "#FFF7ED", border: "#FED7AA", tone: "action" },
  approved_auto: { label: "Approved (Auto)", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", tone: "active" },
  approved_manual: { label: "Approved", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", tone: "active" },
  rejected: { label: "Rejected", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", tone: "done" },
  delivered: { label: "Delivered", color: "#166534", bg: "#F0FDF4", border: "#BBF7D0", tone: "done" },
  returned: { label: "Returned", color: "#7C2D12", bg: "#FFF7ED", border: "#FDBA74", tone: "done" },
  expired: { label: "Expired", color: "#6B7280", bg: "#F9FAFB", border: "#E5E7EB", tone: "done" },
  created: { label: "Created", color: "#6B7280", bg: "#F9FAFB", border: "#E5E7EB", tone: "active" },
};

const PRE_REG_STATUS_META = {
  active: { label: "Active", color: "#166534", bg: "#F0FDF4", border: "#BBF7D0" },
  used: { label: "Used", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE" },
  expired: { label: "Expired", color: "#6B7280", bg: "#F9FAFB", border: "#E5E7EB" },
  cancelled: { label: "Cancelled", color: "#B91C1C", bg: "#FEF2F2", border: "#FECACA" },
};

const PACKAGE_TYPE_LABEL = {
  parcel: "Parcel",
  food: "Food",
  grocery: "Grocery",
  medicine: "Medicine",
  documents: "Documents",
  other: "Other",
};

const FULFILLMENT_LABEL = {
  keep_at_gate: "Keep at gate",
  doorstep: "Doorstep",
  neighbour: "With neighbour",
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "action", label: "Action Needed" },
  { key: "active", label: "In Progress" },
  { key: "done", label: "Completed" },
];

const MOTION_EASE = [0.22, 1, 0.36, 1];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  .dlv-root * { box-sizing: border-box; }

  .dlv-root {
    min-height: calc(100vh - 64px);
    padding: 22px 18px 80px;
    background: ${C.bg};
    color: ${C.ink};
    font-family: 'Plus Jakarta Sans', sans-serif;
    position: relative;
  }

  .dlv-root::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image:
      linear-gradient(to right, rgba(148,163,184,0.08) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(148,163,184,0.08) 1px, transparent 1px);
    background-size: 38px 38px;
    mask-image: radial-gradient(circle at 20% 8%, rgba(0,0,0,0.8), transparent 70%);
  }

  .dlv-shell {
    max-width: 1120px;
    margin: 0 auto;
    position: relative;
    z-index: 1;
  }

  .dlv-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    flex-wrap: wrap;
    margin-bottom: 14px;
  }

  .dlv-header-main {
    max-width: 690px;
  }

  .dlv-pill {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    border-radius: 999px;
    border: 1px solid ${C.indigoBr};
    background: ${C.indigoL};
    color: ${C.indigoD};
    padding: 6px 11px;
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.02em;
  }

  .dlv-pill-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: ${C.indigo};
  }

  .dlv-title {
    margin: 10px 0 0;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: clamp(1.7rem, 3.8vw, 2.35rem);
    line-height: 1.08;
    font-weight: 800;
    color: ${C.ink};
    letter-spacing: -0.03em;
  }

  .dlv-title span { color: ${C.indigo}; }

  .dlv-sub {
    margin: 8px 0 0;
    font-size: 0.88rem;
    line-height: 1.65;
    color: ${C.muted};
    max-width: 66ch;
    font-weight: 600;
  }

  .dlv-header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    align-self: flex-start;
    padding-top: 6px;
  }

  .dlv-btn-primary,
  .dlv-btn-ghost,
  .dlv-btn-danger {
    border-radius: 11px;
    padding: 9px 14px;
    border: 1px solid transparent;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.79rem;
    font-weight: 700;
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, color 0.2s ease;
  }

  .dlv-btn-primary {
    background: linear-gradient(135deg, ${C.indigo}, ${C.indigoD});
    color: #FFFFFF;
    box-shadow: 0 8px 18px rgba(79,70,229,0.26);
  }

  .dlv-btn-primary:hover:not(:disabled),
  .dlv-btn-ghost:hover:not(:disabled),
  .dlv-btn-danger:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  .dlv-btn-primary:hover:not(:disabled) {
    box-shadow: 0 12px 22px rgba(79,70,229,0.33);
  }

  .dlv-btn-ghost {
    border-color: ${C.border};
    background: ${C.surface};
    color: ${C.ink2};
    box-shadow: 0 6px 14px rgba(28,28,30,0.06);
  }

  .dlv-btn-ghost:hover:not(:disabled) {
    border-color: #C7C7CC;
    box-shadow: ${C.shadowSoft};
    color: ${C.ink};
  }

  .dlv-btn-danger {
    border-color: ${C.redBr};
    background: ${C.redL};
    color: #B91C1C;
  }

  .dlv-btn-danger:hover:not(:disabled) {
    border-color: #FCA5A5;
    box-shadow: 0 10px 18px rgba(220,38,38,0.16);
  }

  .dlv-btn-primary:disabled,
  .dlv-btn-ghost:disabled,
  .dlv-btn-danger:disabled {
    opacity: 0.58;
    cursor: not-allowed;
    transform: none;
  }

  .dlv-error {
    margin: 10px 0 0;
    border-radius: 12px;
    border: 1px solid ${C.redBr};
    background: ${C.redL};
    color: #B91C1C;
    padding: 10px 12px;
    font-size: 0.82rem;
    font-weight: 700;
  }

  .dlv-metrics {
    margin: 10px 0 0;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
  }

  .dlv-metric {
    border-radius: 16px;
    border: 1px solid ${C.border};
    background: ${C.surface};
    padding: 12px;
    box-shadow: 0 8px 20px rgba(28,28,30,0.06);
    min-height: 92px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .dlv-metric-value {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 1.45rem;
    line-height: 1;
    font-weight: 800;
    letter-spacing: -0.04em;
  }

  .dlv-metric-label {
    margin-top: 6px;
    color: ${C.muted};
    font-size: 0.72rem;
    font-weight: 700;
  }

  .dlv-grid {
    margin-top: 14px;
    display: grid;
    grid-template-columns: minmax(0, 1.6fr) minmax(320px, 1fr);
    gap: 24px;
    align-items: start;
  }

  .dlv-panel {
    position: relative;
    border-radius: 22px;
    border: 1px solid ${C.border};
    background: ${C.surface};
    box-shadow: ${C.shadowSoft};
    padding: 24px;
  }

  .dlv-sidebar {
    position: sticky;
    top: 22px;
    align-self: start;
  }

  .dlv-panel-title {
    margin: 0;
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: ${C.ink};
    font-size: 1.2rem;
    font-weight: 800;
    letter-spacing: -0.02em;
  }

  .dlv-panel-sub {
    margin: 4px 0 0;
    font-size: 0.8rem;
    color: ${C.muted};
    font-weight: 600;
  }

  .dlv-feed-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 12px;
  }

  .dlv-chip-row {
    display: flex;
    align-items: center;
    gap: 7px;
    flex-wrap: wrap;
  }

  .dlv-chip {
    border: 1px solid ${C.border};
    border-radius: 999px;
    background: ${C.surface};
    color: ${C.ink2};
    font-size: 0.72rem;
    font-weight: 800;
    font-family: 'Plus Jakarta Sans', sans-serif;
    padding: 5px 11px;
    cursor: pointer;
    transition: border-color 0.18s ease, background 0.18s ease, color 0.18s ease;
  }

  .dlv-chip:hover {
    color: ${C.ink};
    border-color: #C7C7CC;
  }

  .dlv-chip.active {
    border-color: ${C.indigoBr};
    background: ${C.indigoL};
    color: ${C.indigoD};
  }

  .dlv-search {
    display: flex;
    align-items: center;
    gap: 8px;
    border-radius: 12px;
    border: 1px solid ${C.border};
    background: ${C.surface};
    min-width: 240px;
    padding: 8px 11px;
  }

  .dlv-search:focus-within {
    border-color: ${C.indigoBr};
    box-shadow: 0 0 0 3px rgba(79,70,229,0.12);
  }

  .dlv-search input {
    width: 100%;
    border: none;
    outline: none;
    background: transparent;
    color: ${C.ink};
    font-size: 0.82rem;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 600;
  }

  .dlv-search input::placeholder {
    color: ${C.faint};
    font-weight: 500;
  }

  .dlv-list {
    display: flex;
    flex-direction: column;
    gap: 9px;
  }

  .dlv-card {
    position: relative;
    overflow: hidden;
    border-radius: 16px;
    border: 1px solid ${C.border};
    background: ${C.surface};
    padding: 12px;
    transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
  }

  .dlv-card::before {
    content: '';
    position: absolute;
    left: 0;
    top: 10px;
    bottom: 10px;
    width: 3px;
    border-radius: 0 4px 4px 0;
    background: var(--accent);
    opacity: 0.56;
    transition: opacity 0.18s ease;
  }

  .dlv-card:hover {
    border-color: #C7C7CC;
    transform: translateY(-1px);
    box-shadow: 0 12px 22px rgba(28,28,30,0.1);
  }

  .dlv-card:hover::before { opacity: 1; }

  .dlv-top {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .dlv-badge {
    border-radius: 999px;
    border: 1px solid;
    padding: 3px 9px;
    font-size: 0.65rem;
    font-weight: 800;
    letter-spacing: 0.02em;
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }

  .dlv-time {
    margin-left: auto;
    color: ${C.muted};
    font-size: 0.7rem;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }

  .dlv-card-title {
    margin: 10px 0 0;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 1rem;
    font-weight: 800;
    color: ${C.ink};
    letter-spacing: -0.01em;
  }

  .dlv-meta {
    margin-top: 7px;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 7px;
  }

  .dlv-meta-item {
    border-radius: 10px;
    border: 1px solid ${C.borderL};
    background: #FCFCFE;
    padding: 7px 8px;
    min-width: 0;
  }

  .dlv-meta-key {
    color: ${C.muted};
    font-size: 0.66rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .dlv-meta-value {
    margin-top: 3px;
    color: ${C.ink2};
    font-size: 0.79rem;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .dlv-action-row {
    margin-top: 10px;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .dlv-reject-box {
    margin-top: 8px;
    border-radius: 12px;
    border: 1px solid #FECACA;
    background: #FFFAFA;
    padding: 9px;
  }

  .dlv-input,
  .dlv-select,
  .dlv-textarea {
    width: 100%;
    border-radius: 11px;
    border: 1px solid ${C.border};
    background: ${C.surface};
    padding: 10px 11px;
    color: ${C.ink};
    font-size: 0.82rem;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 600;
    outline: none;
    transition: border-color 0.18s ease, box-shadow 0.18s ease;
  }

  .dlv-textarea {
    resize: vertical;
    min-height: 74px;
  }

  .dlv-input::placeholder,
  .dlv-textarea::placeholder { color: ${C.faint}; font-weight: 500; }

  .dlv-input:focus,
  .dlv-select:focus,
  .dlv-textarea:focus {
    border-color: ${C.indigoBr};
    box-shadow: 0 0 0 3px rgba(79,70,229,0.12);
  }

  .dlv-form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .dlv-label {
    margin: 0 0 5px;
    color: ${C.ink2};
    font-size: 0.71rem;
    font-weight: 800;
    letter-spacing: 0.02em;
  }

  .dlv-form-block + .dlv-form-block { margin-top: 8px; }

  .dlv-suggest {
    margin-top: 8px;
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  .dlv-suggest button {
    border-radius: 999px;
    border: 1px solid ${C.border};
    background: ${C.surface};
    color: ${C.ink2};
    font-size: 0.67rem;
    font-weight: 800;
    font-family: 'Plus Jakarta Sans', sans-serif;
    padding: 4px 8px;
    cursor: pointer;
    transition: border-color 0.18s ease, color 0.18s ease;
  }

  .dlv-suggest button:hover {
    border-color: ${C.indigoBr};
    color: ${C.indigoD};
  }

  .dlv-prereg-list {
    margin-top: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .dlv-empty {
    border-radius: 14px;
    border: 1px dashed ${C.border};
    background: #FCFCFE;
    text-align: center;
    padding: 30px 14px;
  }

  .dlv-empty-mark {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    background: ${C.indigoL};
    color: ${C.indigo};
    margin: 0 auto 10px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .dlv-empty h3 {
    margin: 0;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 1rem;
    color: ${C.ink};
  }

  .dlv-empty p {
    margin: 5px 0 0;
    font-size: 0.78rem;
    color: ${C.muted};
    font-weight: 600;
  }

  .dlv-sk {
    border-radius: 7px;
    background: #EEF0F7;
  }

  @media (max-width: 980px) {
    .dlv-grid { grid-template-columns: 1fr; }
    .dlv-sidebar {
      position: static;
      top: auto;
    }
    .dlv-header-main {
      max-width: 100%;
    }
  }

  @media (max-width: 760px) {
    .dlv-root { padding: 16px 12px 72px; }
    .dlv-metrics { grid-template-columns: 1fr; }
    .dlv-form-grid { grid-template-columns: 1fr; }
    .dlv-meta { grid-template-columns: 1fr; }
    .dlv-search { width: 100%; min-width: 0; }
  }
`;

function toInputDate(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function relativeTime(value) {
  if (!value) return "now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "now";
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function toneColor(tone) {
  if (tone === "action") return C.amber;
  if (tone === "active") return C.indigo;
  return C.green;
}

function StatusBadge({ status }) {
  const meta = DELIVERY_STATUS_META[status] || DELIVERY_STATUS_META.created;
  return (
    <span className="dlv-badge" style={{ color: meta.color, background: meta.bg, borderColor: meta.border }}>
      <ShieldCheck size={11} />
      {meta.label}
    </span>
  );
}

function PreRegStatusBadge({ status }) {
  const meta = PRE_REG_STATUS_META[status] || PRE_REG_STATUS_META.expired;
  return (
    <span className="dlv-badge" style={{ color: meta.color, background: meta.bg, borderColor: meta.border }}>
      {meta.label}
    </span>
  );
}

function DeliverySkeleton() {
  return (
    <div className="dlv-card">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <div className="dlv-sk" style={{ width: 124, height: 20, borderRadius: 999 }} />
        <div className="dlv-sk" style={{ width: 74, height: 12 }} />
      </div>
      <div className="dlv-sk" style={{ marginTop: 10, width: "50%", height: 20 }} />
      <div className="dlv-sk" style={{ marginTop: 8, width: "92%", height: 12 }} />
      <div className="dlv-sk" style={{ marginTop: 6, width: "72%", height: 12 }} />
    </div>
  );
}

function DeliveryCard({ item }) {
  const statusMeta = DELIVERY_STATUS_META[item.status] || DELIVERY_STATUS_META.created;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{
        layout: { duration: 0.32, ease: MOTION_EASE },
        opacity: { duration: 0.28, ease: MOTION_EASE },
        y: { duration: 0.28, ease: MOTION_EASE },
      }}
      className="dlv-card"
      style={{ "--accent": toneColor(statusMeta.tone) }}
    >
      <div className="dlv-top">
        <StatusBadge status={item.status} />
        <span className="dlv-badge" style={{ color: C.ink2, background: C.bg, borderColor: C.border }}>
          {PACKAGE_TYPE_LABEL[item.packageType] || "Package"}
        </span>
        <span className="dlv-time">
          <Clock3 size={12} />
          {relativeTime(item.createdAt)}
        </span>
      </div>

      <h3 className="dlv-card-title">{item.courierName || "Unknown courier"}</h3>

      <div className="dlv-meta">
        <div className="dlv-meta-item">
          <p className="dlv-meta-key">Agent</p>
          <p className="dlv-meta-value">{item.agentName || "Not available"}</p>
        </div>
        <div className="dlv-meta-item">
          <p className="dlv-meta-key">Flat</p>
          <p className="dlv-meta-value">{item.flatNumber || "-"}</p>
        </div>
        <div className="dlv-meta-item">
          <p className="dlv-meta-key">Arrival</p>
          <p className="dlv-meta-value">{formatDateTime(item.entryTime || item.createdAt)}</p>
        </div>
        <div className="dlv-meta-item">
          <p className="dlv-meta-key">Handover mode</p>
          <p className="dlv-meta-value">{FULFILLMENT_LABEL[item.fulfillmentMode] || "-"}</p>
        </div>
      </div>

      {item.status === "awaiting_approval" && (
        <p style={{ marginTop: 10, fontSize: "0.76rem", color: C.amber, fontWeight: 700 }}>
          ⏳ Waiting for gate approval
        </p>
      )}

      {!!item.rejectionReason && (
        <div style={{ marginTop: 9, borderRadius: 10, border: `1px solid ${C.redBr}`, background: C.redL, padding: "8px 9px" }}>
          <p style={{ margin: 0, fontSize: "0.72rem", color: "#B91C1C", fontWeight: 700 }}>
            Reason: {item.rejectionReason}
          </p>
        </div>
      )}
    </motion.article>
  );
}


function PreRegCard({ item, busyAction, onCancel }) {
  const cancelBusy = busyAction === `${item._id}:cancel-prereg`;

  return (
    <article className="dlv-card" style={{ "--accent": C.green }}>
      <div className="dlv-top">
        <PreRegStatusBadge status={item.status} />
        <span className="dlv-time">
          <CalendarDays size={12} />
          {formatDate(item.expectedDate)}
        </span>
      </div>

      <h3 className="dlv-card-title">{item.expectedCourier || "Any courier"}</h3>

      <div className="dlv-meta" style={{ marginTop: 8 }}>
        <div className="dlv-meta-item">
          <p className="dlv-meta-key">Package</p>
          <p className="dlv-meta-value">
            {PACKAGE_TYPE_LABEL[item.packageType] || "Package"} x {item.packageCount || 1}
          </p>
        </div>
        <div className="dlv-meta-item">
          <p className="dlv-meta-key">Drop mode</p>
          <p className="dlv-meta-value">{FULFILLMENT_LABEL[item.fulfillmentMode] || "-"}</p>
        </div>
      </div>

      {!!item.instructions && (
        <p style={{ margin: "9px 0 0", fontSize: "0.77rem", color: C.ink2, fontWeight: 600 }}>
          {item.instructions}
        </p>
      )}

      {item.status === "active" && (
        <div className="dlv-action-row">
          <button
            type="button"
            className="dlv-btn-danger"
            disabled={cancelBusy}
            onClick={() => onCancel(item._id)}
          >
            <XCircle size={13} />
            {cancelBusy ? "Cancelling..." : "Cancel"}
          </button>
        </div>
      )}
    </article>
  );
}

export function DeliveriesPage() {
  const { token, user } = useAuth();

  const [deliveries, setDeliveries] = useState([]);
  const [preRegs, setPreRegs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [busyAction, setBusyAction] = useState("");
  const [error, setError] = useState(""); // busyAction kept for pre-reg cancel only
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showPreRegForm, setShowPreRegForm] = useState(false);
  const [submittingPreReg, setSubmittingPreReg] = useState(false);
  const [preRegForm, setPreRegForm] = useState({
    expectedDate: toInputDate(),
    expectedCourier: "",
    packageType: "parcel",
    packageCount: 1,
    fulfillmentMode: "keep_at_gate",
    instructions: "",
  });

  const canPreRegister = useMemo(
    () => ["resident", "committee", "super_admin"].includes(user?.role),
    [user?.role],
  );

  const loadData = useCallback(async ({ soft = false } = {}) => {
    if (soft) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");
    try {
      const [deliveryResult, preRegResult] = await Promise.allSettled([
        apiRequest("/delivery/my", { token }),
        apiRequest("/delivery-prereg", { token }),
      ]);

      if (deliveryResult.status === "fulfilled") {
        setDeliveries(deliveryResult.value.items || []);
      } else {
        setError(deliveryResult.reason?.message || "Failed to load deliveries");
      }

      if (preRegResult.status === "fulfilled") {
        setPreRegs(preRegResult.value.items || []);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchInput.trim().toLowerCase()), 240);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const summary = useMemo(() => {
    const awaiting = deliveries.filter((item) => item.status === "awaiting_approval").length;
    const deliveredThisMonth = deliveries.filter((item) => {
      if (item.status !== "delivered") return false;
      const date = new Date(item.handoverTime || item.updatedAt || item.createdAt);
      if (Number.isNaN(date.getTime())) return false;
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;
    const activePreRegs = preRegs.filter((item) => item.status === "active").length;
    return { awaiting, deliveredThisMonth, activePreRegs };
  }, [deliveries, preRegs]);

  const filteredDeliveries = useMemo(() => {
    let next = deliveries;

    if (statusFilter === "action") {
      next = next.filter((item) => item.status === "awaiting_approval");
    }

    if (statusFilter === "active") {
      next = next.filter((item) => {
        const tone = (DELIVERY_STATUS_META[item.status] || DELIVERY_STATUS_META.created).tone;
        return tone === "active";
      });
    }

    if (statusFilter === "done") {
      next = next.filter((item) => {
        const tone = (DELIVERY_STATUS_META[item.status] || DELIVERY_STATUS_META.created).tone;
        return tone === "done";
      });
    }

    if (!searchQuery) return next;

    return next.filter((item) => {
      const haystack = [
        item.courierName,
        item.agentName,
        item.flatNumber,
        item.packageType,
        item.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(searchQuery);
    });
  }, [deliveries, statusFilter, searchQuery]);

  const sortedPreRegs = useMemo(
    () => [...preRegs].sort((a, b) => new Date(b.expectedDate) - new Date(a.expectedDate)),
    [preRegs],
  );

  async function handleCancelPreReg(id) {
    setBusyAction(`${id}:cancel-prereg`);
    setError("");
    try {
      const data = await apiRequest(`/delivery-prereg/${id}`, { method: "DELETE", token });
      setPreRegs((prev) => prev.map((item) => (item._id === id ? data.item : item)));
    } catch (err) {
      setError(err.message || "Unable to cancel pre-registration");
    } finally {
      setBusyAction("");
    }
  }

  async function handleCreatePreReg(event) {
    event.preventDefault();
    if (!preRegForm.expectedDate) {
      setError("Expected date is required");
      return;
    }

    setSubmittingPreReg(true);
    setError("");
    try {
      const data = await apiRequest("/delivery-prereg", {
        method: "POST",
        token,
        body: {
          expectedDate: preRegForm.expectedDate,
          expectedCourier: preRegForm.expectedCourier,
          packageType: preRegForm.packageType,
          packageCount: Number(preRegForm.packageCount) || 1,
          fulfillmentMode: preRegForm.fulfillmentMode,
          instructions: preRegForm.instructions,
        },
      });

      setPreRegs((prev) => [data.item, ...prev]);
      setPreRegForm({
        expectedDate: toInputDate(),
        expectedCourier: "",
        packageType: "parcel",
        packageCount: 1,
        fulfillmentMode: "keep_at_gate",
        instructions: "",
      });
      setShowPreRegForm(false);
    } catch (err) {
      setError(err.message || "Unable to create pre-registration");
    } finally {
      setSubmittingPreReg(false);
    }
  }

  function updatePreRegField(field, value) {
    setPreRegForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="dlv-root">
        <div className="dlv-shell">
          <motion.section
            className="dlv-header"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: MOTION_EASE }}
          >
            <div className="dlv-header-main">
              {summary.awaiting > 0 && (
                <span className="dlv-pill">
                  <span className="dlv-pill-dot" />
                  {`${summary.awaiting} delivery action${summary.awaiting > 1 ? "s" : ""} pending`}
                </span>
              )}

              <h1 className="dlv-title">
                Deliveries, but <span>smarter.</span>
              </h1>
              <p className="dlv-sub">
                Track every package, pre-register expected arrivals, and take instant actions with minimal effort.
              </p>
            </div>

            <div className="dlv-header-actions">
              <button
                type="button"
                className="dlv-btn-ghost"
                onClick={() => loadData({ soft: true })}
                disabled={refreshing}
              >
                <motion.span
                  animate={refreshing ? { rotate: 360 } : { rotate: 0 }}
                  transition={refreshing ? { repeat: Infinity, duration: 0.9, ease: "linear" } : { duration: 0.2 }}
                  style={{ display: "inline-flex" }}
                >
                  <RefreshCw size={14} />
                </motion.span>
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>

              {canPreRegister && (
                <button
                  type="button"
                  className="dlv-btn-primary"
                  onClick={() => setShowPreRegForm((value) => !value)}
                >
                  <Plus size={14} />
                  {showPreRegForm ? "Close pre-registration" : "Pre-register delivery"}
                </button>
              )}
            </div>
          </motion.section>

          {error && <div className="dlv-error">{error}</div>}

          <div className="dlv-metrics">
            <motion.div
              className="dlv-metric"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.4, ease: MOTION_EASE }}
            >
              <p className="dlv-metric-value" style={{ color: C.amber }}>{summary.awaiting}</p>
              <p className="dlv-metric-label">Awaiting approvals</p>
            </motion.div>
            <motion.div
              className="dlv-metric"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4, ease: MOTION_EASE }}
            >
              <p className="dlv-metric-value" style={{ color: C.green }}>{summary.deliveredThisMonth}</p>
              <p className="dlv-metric-label">Delivered this month</p>
            </motion.div>
            <motion.div
              className="dlv-metric"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4, ease: MOTION_EASE }}
            >
              <p className="dlv-metric-value" style={{ color: C.indigo }}>{summary.activePreRegs}</p>
              <p className="dlv-metric-label">Active pre-registrations</p>
            </motion.div>
          </div>

          <section className="dlv-grid">
            <motion.div
              className="dlv-panel"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.42, ease: MOTION_EASE }}
            >
              <div className="dlv-feed-head">
                <div>
                  <h2 className="dlv-panel-title">My delivery stream</h2>
                  <p className="dlv-panel-sub">Quickly filter and act on deliveries</p>
                </div>

                <div className="dlv-search">
                  <Search size={14} color={C.muted} />
                  <input
                    type="search"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Search courier or agent"
                  />
                </div>
              </div>

              <div className="dlv-chip-row" style={{ marginBottom: 10 }}>
                {FILTERS.map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    className={`dlv-chip${statusFilter === filter.key ? " active" : ""}`}
                    onClick={() => setStatusFilter(filter.key)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              <motion.div layout className="dlv-list">
                {loading && [0, 1, 2].map((index) => (
                  <DeliverySkeleton key={index} />
                ))}

                <AnimatePresence mode="popLayout">
                  {!loading && filteredDeliveries.length === 0 && (
                    <motion.div
                      key="empty-deliveries"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.28, ease: MOTION_EASE }}
                      className="dlv-empty"
                    >
                      <div className="dlv-empty-mark">
                        <Package size={20} />
                      </div>
                      <h3>No deliveries found</h3>
                      <p>Try a different filter or search keyword.</p>
                    </motion.div>
                  )}

                  {!loading && filteredDeliveries.map((item) => (
                    <DeliveryCard key={item._id} item={item} />
                  ))}
                </AnimatePresence>
              </motion.div>
            </motion.div>

            <motion.aside
              className="dlv-panel dlv-sidebar"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.4, ease: MOTION_EASE }}
            >
              <div>
                <h2 className="dlv-panel-title">Expected deliveries</h2>
                <p className="dlv-panel-sub">Pre-register to speed up gate handling</p>
              </div>

              <AnimatePresence initial={false}>
                {canPreRegister && showPreRegForm && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: MOTION_EASE }}
                  style={{ overflow: "hidden" }}
                >
                <form onSubmit={handleCreatePreReg} style={{ marginTop: 12 }}>
                  <div className="dlv-form-grid">
                    <div className="dlv-form-block">
                      <p className="dlv-label">Expected date</p>
                      <input
                        className="dlv-input"
                        type="date"
                        value={preRegForm.expectedDate}
                        onChange={(event) => updatePreRegField("expectedDate", event.target.value)}
                        required
                      />
                    </div>

                    <div className="dlv-form-block">
                      <p className="dlv-label">Package type</p>
                      <select
                        className="dlv-select"
                        value={preRegForm.packageType}
                        onChange={(event) => updatePreRegField("packageType", event.target.value)}
                      >
                        {Object.entries(PACKAGE_TYPE_LABEL).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="dlv-form-block">
                    <p className="dlv-label">Courier</p>
                    <input
                      className="dlv-input"
                      placeholder="Amazon, Blinkit, Swiggy, etc."
                      value={preRegForm.expectedCourier}
                      onChange={(event) => updatePreRegField("expectedCourier", event.target.value)}
                    />
                    <div className="dlv-suggest">
                      {["Amazon", "Blinkit", "Swiggy", "Zepto"].map((name) => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => updatePreRegField("expectedCourier", name)}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="dlv-form-grid">
                    <div className="dlv-form-block">
                      <p className="dlv-label">Count</p>
                      <input
                        className="dlv-input"
                        type="number"
                        min="1"
                        value={preRegForm.packageCount}
                        onChange={(event) => updatePreRegField("packageCount", event.target.value)}
                      />
                    </div>

                    <div className="dlv-form-block">
                      <p className="dlv-label">Handover</p>
                      <select
                        className="dlv-select"
                        value={preRegForm.fulfillmentMode}
                        onChange={(event) => updatePreRegField("fulfillmentMode", event.target.value)}
                      >
                        {Object.entries(FULFILLMENT_LABEL).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="dlv-form-block">
                    <p className="dlv-label">Instructions</p>
                    <textarea
                      className="dlv-textarea"
                      placeholder="Optional handling instructions"
                      value={preRegForm.instructions}
                      onChange={(event) => updatePreRegField("instructions", event.target.value)}
                    />
                  </div>

                  <div className="dlv-action-row" style={{ marginTop: 10 }}>
                    <button type="submit" className="dlv-btn-primary" disabled={submittingPreReg}>
                      <Truck size={14} />
                      {submittingPreReg ? "Creating..." : "Create pre-registration"}
                    </button>
                    <button
                      type="button"
                      className="dlv-btn-ghost"
                      disabled={submittingPreReg}
                      onClick={() => setShowPreRegForm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
                </motion.div>
                )}
              </AnimatePresence>

              <div className="dlv-prereg-list">
                {!loading && sortedPreRegs.length === 0 && (
                  <div className="dlv-empty">
                    <div className="dlv-empty-mark" style={{ background: C.amberL, color: C.amber }}>
                      <CalendarDays size={20} />
                    </div>
                    <h3>No pre-registrations</h3>
                    <p>Create one to reduce approval friction at the gate.</p>
                  </div>
                )}

                {sortedPreRegs.map((item) => (
                  <PreRegCard
                    key={item._id}
                    item={item}
                    busyAction={busyAction}
                    onCancel={handleCancelPreReg}
                  />
                ))}
              </div>
            </motion.aside>
          </section>
        </div>
      </div>
    </>
  );
}
