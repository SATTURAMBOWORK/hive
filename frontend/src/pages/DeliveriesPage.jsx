import { useCallback, useEffect, useMemo, useState } from "react";
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

const T = {
  bg: "#F8FAFF",
  panel: "#FFFFFF",
  border: "#E3EAFB",
  borderSoft: "#EEF3FF",
  ink: "#0F1C3C",
  inkSoft: "#3A4E7A",
  muted: "#7E8EAF",
  orange: "#E8890C",
  orangeDeep: "#C97508",
  orangePale: "#FFF8F0",
  orangeLine: "#FDECC8",
  blue: "#2563EB",
  bluePale: "#EAF1FF",
  green: "#16A34A",
  greenPale: "#DCFCE7",
  red: "#DC2626",
  redPale: "#FEE2E2",
  violet: "#7C3AED",
  violetPale: "#F3E8FF",
  shadow: "0 14px 34px rgba(17,24,39,0.09)",
  shadowSoft: "0 8px 22px rgba(17,24,39,0.07)",
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

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800&family=Manrope:wght@400;500;600;700;800&display=swap');

  .dlv-root * { box-sizing: border-box; }

  .dlv-root {
    min-height: calc(100vh - 64px);
    padding: 22px 18px 80px;
    background:
      radial-gradient(780px 320px at 84% -8%, rgba(232,137,12,0.16), transparent 64%),
      radial-gradient(680px 320px at -12% 0%, rgba(37,99,235,0.1), transparent 66%),
      ${T.bg};
    color: ${T.ink};
    font-family: 'Manrope', sans-serif;
    position: relative;
    overflow: hidden;
  }

  .dlv-root::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image:
      linear-gradient(to right, rgba(148,163,184,0.11) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(148,163,184,0.11) 1px, transparent 1px);
    background-size: 34px 34px;
    mask-image: radial-gradient(circle at 15% 8%, rgba(0,0,0,0.95), transparent 72%);
  }

  .dlv-shell {
    max-width: 1080px;
    margin: 0 auto;
    position: relative;
    z-index: 1;
  }

  @keyframes dlvRise {
    from { opacity: 0; transform: translateY(14px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes dlvPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(232,137,12,0.38); }
    50% { box-shadow: 0 0 0 8px rgba(232,137,12,0); }
  }

  @keyframes dlvShimmer {
    0% { background-position: 200% center; }
    100% { background-position: -200% center; }
  }

  @keyframes dlvSpin { to { transform: rotate(360deg); } }

  .dlv-enter {
    opacity: 0;
    animation: dlvRise 0.46s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }

  .dlv-hero {
    position: relative;
    border-radius: 28px;
    border: 1px solid rgba(255,255,255,0.58);
    background: linear-gradient(135deg, #FFFFFF 0%, #FFF9F3 44%, #FFF3E2 100%);
    padding: 18px;
    box-shadow: ${T.shadow};
    overflow: hidden;
  }

  .dlv-hero::before {
    content: '';
    position: absolute;
    top: -90px;
    right: -80px;
    width: 220px;
    height: 220px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(232,137,12,0.2), rgba(232,137,12,0));
    pointer-events: none;
  }

  .dlv-hero::after {
    content: '';
    position: absolute;
    left: 34%;
    bottom: -70px;
    width: 160px;
    height: 160px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(37,99,235,0.12), rgba(37,99,235,0));
    pointer-events: none;
  }

  .dlv-hero-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    position: relative;
    z-index: 2;
  }

  .dlv-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border-radius: 999px;
    border: 1px solid ${T.orangeLine};
    background: ${T.orangePale};
    color: ${T.orangeDeep};
    padding: 6px 11px;
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.02em;
  }

  .dlv-pill-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: ${T.orange};
    animation: dlvPulse 2.2s ease-in-out infinite;
  }

  .dlv-title {
    margin: 10px 0 0;
    font-family: 'Outfit', sans-serif;
    font-size: clamp(1.8rem, 4.2vw, 2.6rem);
    line-height: 1.06;
    font-weight: 800;
    color: ${T.ink};
    letter-spacing: -0.03em;
  }

  .dlv-title span { color: ${T.orange}; }

  .dlv-sub {
    margin: 8px 0 0;
    font-size: 0.88rem;
    line-height: 1.7;
    color: ${T.inkSoft};
    max-width: 66ch;
    font-weight: 600;
  }

  .dlv-hero-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 16px;
    position: relative;
    z-index: 2;
  }

  .dlv-btn-primary,
  .dlv-btn-ghost,
  .dlv-btn-danger {
    position: relative;
    isolation: isolate;
    overflow: hidden;
    border-radius: 12px;
    padding: 10px 15px;
    border: 1px solid transparent;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    cursor: pointer;
    font-family: 'Manrope', sans-serif;
    font-size: 0.81rem;
    font-weight: 800;
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, color 0.2s ease;
  }

  .dlv-btn-primary {
    background: linear-gradient(135deg, ${T.orange}, ${T.orangeDeep});
    color: #FFFFFF;
    box-shadow: 0 9px 20px rgba(232,137,12,0.28);
  }

  .dlv-btn-primary::before,
  .dlv-btn-ghost::before,
  .dlv-btn-danger::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(120deg, rgba(255,255,255,0) 34%, rgba(255,255,255,0.34) 52%, rgba(255,255,255,0) 68%);
    transform: translateX(-130%);
    transition: transform 0.55s ease;
    z-index: -1;
  }

  .dlv-btn-primary:hover:not(:disabled),
  .dlv-btn-ghost:hover:not(:disabled),
  .dlv-btn-danger:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  .dlv-btn-primary:hover:not(:disabled) {
    box-shadow: 0 13px 24px rgba(232,137,12,0.34);
  }

  .dlv-btn-primary:hover:not(:disabled)::before,
  .dlv-btn-ghost:hover:not(:disabled)::before,
  .dlv-btn-danger:hover:not(:disabled)::before {
    transform: translateX(130%);
  }

  .dlv-btn-ghost {
    border-color: #D8E2FB;
    background: #FFFFFF;
    color: ${T.inkSoft};
    box-shadow: 0 6px 16px rgba(17,24,39,0.08);
  }

  .dlv-btn-ghost:hover:not(:disabled) {
    border-color: #C7D5F8;
    box-shadow: ${T.shadowSoft};
    color: ${T.ink};
  }

  .dlv-btn-danger {
    border-color: #FECACA;
    background: #FEF2F2;
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
    margin-top: 12px;
    border-radius: 14px;
    border: 1px solid #FECACA;
    background: #FEF2F2;
    color: #B91C1C;
    padding: 10px 13px;
    font-size: 0.84rem;
    font-weight: 700;
  }

  .dlv-metrics {
    margin-top: 14px;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }

  .dlv-metric {
    border-radius: 15px;
    border: 1px solid ${T.border};
    background: rgba(255,255,255,0.92);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    padding: 11px 12px;
  }

  .dlv-metric-value {
    font-family: 'Outfit', sans-serif;
    font-size: 1.52rem;
    line-height: 1;
    font-weight: 800;
    letter-spacing: -0.04em;
  }

  .dlv-metric-label {
    margin-top: 5px;
    color: ${T.muted};
    font-size: 0.73rem;
    font-weight: 700;
  }

  .dlv-grid {
    margin-top: 14px;
    display: grid;
    grid-template-columns: minmax(0, 1.15fr) minmax(300px, 0.85fr);
    gap: 12px;
    align-items: start;
  }

  .dlv-panel {
    border-radius: 22px;
    border: 1px solid ${T.border};
    background: rgba(255,255,255,0.95);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    box-shadow: ${T.shadowSoft};
    padding: 14px;
  }

  .dlv-panel-title {
    margin: 0;
    font-family: 'Outfit', sans-serif;
    color: ${T.ink};
    font-size: 1.2rem;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  .dlv-panel-sub {
    margin: 4px 0 0;
    font-size: 0.8rem;
    color: ${T.muted};
    font-weight: 600;
  }

  .dlv-feed-head {
    display: flex;
    align-items: flex-end;
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
    border: 1px solid #DCE5FB;
    border-radius: 999px;
    background: #FFFFFF;
    color: ${T.inkSoft};
    font-size: 0.72rem;
    font-weight: 800;
    font-family: 'Manrope', sans-serif;
    padding: 5px 11px;
    cursor: pointer;
    transition: border-color 0.18s ease, background 0.18s ease, color 0.18s ease;
  }

  .dlv-chip:hover {
    color: ${T.ink};
    border-color: #C8D7FC;
  }

  .dlv-chip.active {
    border-color: ${T.orangeLine};
    background: ${T.orangePale};
    color: ${T.orangeDeep};
  }

  .dlv-search {
    display: flex;
    align-items: center;
    gap: 8px;
    border-radius: 12px;
    border: 1px solid #DCE5FB;
    background: #FFFFFF;
    min-width: 215px;
    padding: 8px 11px;
  }

  .dlv-search:focus-within {
    border-color: #BFD2FF;
    box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
  }

  .dlv-search input {
    width: 100%;
    border: none;
    outline: none;
    background: transparent;
    color: ${T.ink};
    font-size: 0.82rem;
    font-family: 'Manrope', sans-serif;
    font-weight: 600;
  }

  .dlv-search input::placeholder {
    color: ${T.muted};
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
    border: 1px solid ${T.border};
    background: #FFFFFF;
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
    border-color: #CFDAFA;
    transform: translateY(-1px);
    box-shadow: 0 12px 22px rgba(17,24,39,0.1);
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
    color: ${T.muted};
    font-size: 0.7rem;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }

  .dlv-card-title {
    margin: 10px 0 0;
    font-family: 'Outfit', sans-serif;
    font-size: 1rem;
    font-weight: 700;
    color: ${T.ink};
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
    border: 1px solid ${T.borderSoft};
    background: #FBFDFF;
    padding: 7px 8px;
    min-width: 0;
  }

  .dlv-meta-key {
    color: ${T.muted};
    font-size: 0.66rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .dlv-meta-value {
    margin-top: 3px;
    color: ${T.inkSoft};
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
    border: 1px solid ${T.border};
    background: #FFFFFF;
    padding: 10px 11px;
    color: ${T.ink};
    font-size: 0.82rem;
    font-family: 'Manrope', sans-serif;
    font-weight: 600;
    outline: none;
    transition: border-color 0.18s ease, box-shadow 0.18s ease;
  }

  .dlv-textarea {
    resize: vertical;
    min-height: 74px;
  }

  .dlv-input::placeholder,
  .dlv-textarea::placeholder { color: ${T.muted}; font-weight: 500; }

  .dlv-input:focus,
  .dlv-select:focus,
  .dlv-textarea:focus {
    border-color: #BFD2FF;
    box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
  }

  .dlv-form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .dlv-label {
    margin: 0 0 5px;
    color: ${T.inkSoft};
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
    border: 1px solid ${T.border};
    background: #FFFFFF;
    color: ${T.inkSoft};
    font-size: 0.67rem;
    font-weight: 800;
    font-family: 'Manrope', sans-serif;
    padding: 4px 8px;
    cursor: pointer;
    transition: border-color 0.18s ease, color 0.18s ease;
  }

  .dlv-suggest button:hover {
    border-color: ${T.orangeLine};
    color: ${T.orangeDeep};
  }

  .dlv-prereg-list {
    margin-top: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .dlv-empty {
    border-radius: 14px;
    border: 1px dashed #CDD9FA;
    background: #FBFDFF;
    text-align: center;
    padding: 30px 14px;
  }

  .dlv-empty-mark {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    background: ${T.bluePale};
    color: ${T.blue};
    margin: 0 auto 10px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .dlv-empty h3 {
    margin: 0;
    font-family: 'Outfit', sans-serif;
    font-size: 1rem;
    color: ${T.ink};
  }

  .dlv-empty p {
    margin: 5px 0 0;
    font-size: 0.78rem;
    color: ${T.muted};
    font-weight: 600;
  }

  .dlv-sk {
    border-radius: 7px;
    background: linear-gradient(90deg, #EEF3FF 25%, #E4ECFF 50%, #EEF3FF 75%);
    background-size: 200% 100%;
    animation: dlvShimmer 1.5s ease-in-out infinite;
  }

  @media (max-width: 980px) {
    .dlv-grid { grid-template-columns: 1fr; }
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
  if (tone === "action") return T.orange;
  if (tone === "active") return T.blue;
  return T.green;
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

function DeliverySkeleton({ delay }) {
  return (
    <div className="dlv-card dlv-enter" style={{ animationDelay: `${delay}ms` }}>
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

function DeliveryCard({ item, busyAction, onApprove, onReject }) {
  const statusMeta = DELIVERY_STATUS_META[item.status] || DELIVERY_STATUS_META.created;
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");

  const isAwaiting = item.status === "awaiting_approval";
  const approveBusy = busyAction === `${item._id}:approve`;
  const rejectBusy = busyAction === `${item._id}:reject`;

  async function submitReject() {
    await onReject(item._id, reason.trim());
    setShowReject(false);
    setReason("");
  }

  return (
    <article className="dlv-card dlv-enter" style={{ "--accent": toneColor(statusMeta.tone) }}>
      <div className="dlv-top">
        <StatusBadge status={item.status} />
        <span className="dlv-badge" style={{ color: T.inkSoft, background: "#F8FAFF", borderColor: T.border }}>
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

      {isAwaiting && (
        <>
          <div className="dlv-action-row">
            <button
              type="button"
              className="dlv-btn-primary"
              disabled={approveBusy || rejectBusy}
              onClick={() => onApprove(item._id)}
            >
              <CheckCircle2 size={14} />
              {approveBusy ? "Approving..." : "Approve"}
            </button>
            <button
              type="button"
              className="dlv-btn-danger"
              disabled={approveBusy || rejectBusy}
              onClick={() => setShowReject((value) => !value)}
            >
              <XCircle size={14} />
              Reject
            </button>
          </div>

          {showReject && (
            <div className="dlv-reject-box">
              <p style={{ margin: "0 0 6px", fontSize: "0.73rem", fontWeight: 800, color: "#B91C1C" }}>
                Add reason (optional)
              </p>
              <textarea
                className="dlv-textarea"
                placeholder="Example: Not expecting this delivery today"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
              <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="dlv-btn-danger"
                  disabled={rejectBusy || approveBusy}
                  onClick={submitReject}
                >
                  {rejectBusy ? "Rejecting..." : "Confirm reject"}
                </button>
                <button
                  type="button"
                  className="dlv-btn-ghost"
                  disabled={rejectBusy || approveBusy}
                  onClick={() => setShowReject(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {!!item.rejectionReason && (
        <div style={{ marginTop: 9, borderRadius: 10, border: "1px solid #FECACA", background: "#FEF2F2", padding: "8px 9px" }}>
          <p style={{ margin: 0, fontSize: "0.72rem", color: "#B91C1C", fontWeight: 700 }}>
            Reason: {item.rejectionReason}
          </p>
        </div>
      )}
    </article>
  );
}

function PreRegCard({ item, busyAction, onCancel }) {
  const cancelBusy = busyAction === `${item._id}:cancel-prereg`;

  return (
    <article className="dlv-card" style={{ "--accent": T.green }}>
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
        <p style={{ margin: "9px 0 0", fontSize: "0.77rem", color: T.inkSoft, fontWeight: 600 }}>
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
  const [error, setError] = useState("");
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
      const [deliveryData, preRegData] = await Promise.all([
        apiRequest("/delivery/my", { token }),
        apiRequest("/delivery-prereg", { token }),
      ]);
      setDeliveries(deliveryData.items || []);
      setPreRegs(preRegData.items || []);
    } catch (err) {
      setError(err.message || "Failed to load deliveries");
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

  async function handleApprove(id) {
    setBusyAction(`${id}:approve`);
    setError("");
    try {
      const data = await apiRequest(`/delivery/${id}/approve`, { method: "POST", token });
      setDeliveries((prev) => prev.map((item) => (item._id === id ? data.item : item)));
    } catch (err) {
      setError(err.message || "Unable to approve delivery");
    } finally {
      setBusyAction("");
    }
  }

  async function handleReject(id, reason) {
    setBusyAction(`${id}:reject`);
    setError("");
    try {
      const data = await apiRequest(`/delivery/${id}/reject`, {
        method: "POST",
        token,
        body: { rejectionReason: reason || "" },
      });
      setDeliveries((prev) => prev.map((item) => (item._id === id ? data.item : item)));
    } catch (err) {
      setError(err.message || "Unable to reject delivery");
    } finally {
      setBusyAction("");
    }
  }

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
          <section className="dlv-hero dlv-enter" style={{ animationDelay: "0ms" }}>
            <div className="dlv-hero-head">
              <span className="dlv-pill">
                <span className="dlv-pill-dot" />
                {summary.awaiting > 0
                  ? `${summary.awaiting} delivery action${summary.awaiting > 1 ? "s" : ""} pending`
                  : "Everything is under control"}
              </span>
            </div>

            <h1 className="dlv-title">
              Deliveries, but <span>smarter.</span>
            </h1>
            <p className="dlv-sub">
              Track every package, pre-register expected arrivals, and take instant actions with minimal effort.
            </p>

            <div className="dlv-hero-actions">
              <button
                type="button"
                className="dlv-btn-ghost"
                onClick={() => loadData({ soft: true })}
                disabled={refreshing}
              >
                <RefreshCw size={14} style={{ animation: refreshing ? "dlvSpin 1s linear infinite" : "none" }} />
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

            {error && <div className="dlv-error">{error}</div>}

            <div className="dlv-metrics">
              <div className="dlv-metric">
                <p className="dlv-metric-value" style={{ color: T.orange }}>{summary.awaiting}</p>
                <p className="dlv-metric-label">Awaiting approvals</p>
              </div>
              <div className="dlv-metric">
                <p className="dlv-metric-value" style={{ color: T.green }}>{summary.deliveredThisMonth}</p>
                <p className="dlv-metric-label">Delivered this month</p>
              </div>
              <div className="dlv-metric">
                <p className="dlv-metric-value" style={{ color: T.blue }}>{summary.activePreRegs}</p>
                <p className="dlv-metric-label">Active pre-registrations</p>
              </div>
            </div>
          </section>

          <section className="dlv-grid">
            <div className="dlv-panel dlv-enter" style={{ animationDelay: "60ms" }}>
              <div className="dlv-feed-head">
                <div>
                  <h2 className="dlv-panel-title">My delivery stream</h2>
                  <p className="dlv-panel-sub">Quickly filter and act on deliveries</p>
                </div>

                <div className="dlv-search">
                  <Search size={14} color={T.muted} />
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

              <div className="dlv-list">
                {loading && [0, 1, 2].map((index) => (
                  <DeliverySkeleton key={index} delay={index * 60} />
                ))}

                {!loading && filteredDeliveries.length === 0 && (
                  <div className="dlv-empty">
                    <div className="dlv-empty-mark">
                      <Package size={20} />
                    </div>
                    <h3>No deliveries found</h3>
                    <p>Try a different filter or search keyword.</p>
                  </div>
                )}

                {!loading && filteredDeliveries.map((item, index) => (
                  <div key={item._id} className="dlv-enter" style={{ animationDelay: `${index * 38}ms` }}>
                    <DeliveryCard
                      item={item}
                      busyAction={busyAction}
                      onApprove={handleApprove}
                      onReject={handleReject}
                    />
                  </div>
                ))}
              </div>
            </div>

            <aside className="dlv-panel dlv-enter" style={{ animationDelay: "95ms" }}>
              <div>
                <h2 className="dlv-panel-title">Expected deliveries</h2>
                <p className="dlv-panel-sub">Pre-register to speed up gate handling</p>
              </div>

              {canPreRegister && showPreRegForm && (
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
              )}

              <div className="dlv-prereg-list">
                {!loading && sortedPreRegs.length === 0 && (
                  <div className="dlv-empty">
                    <div className="dlv-empty-mark" style={{ background: T.orangePale, color: T.orange }}>
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
            </aside>
          </section>
        </div>
      </div>
    </>
  );
}
