import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  Clock,
  PartyPopper,
  Plus,
  QrCode,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "../components/AuthContext";
import { apiRequest } from "../components/api";
import { getSocket } from "../components/socket";

const C = {
  bg: "#FAFAFC",
  surface: "#FFFFFF",
  text: "#1C1C1E",
  subtext: "#6B7280",
  muted: "#9CA3AF",
  border: "#E8E8ED",
  borderStrong: "#D8D8E2",
  accent: "#4F46E5",
  accentSoft: "#EEF2FF",
  success: "#16A34A",
  danger: "#DC2626",
  warning: "#D97706",
  info: "#2563EB",
  shadow: "0 8px 24px rgba(28,28,30,0.06)",
};

const PURPOSE_OPTIONS = [
  { value: "guest", label: "Guest", emoji: "👤" },
  { value: "delivery", label: "Delivery", emoji: "📦" },
  { value: "contractor", label: "Contractor", emoji: "🔧" },
  { value: "other", label: "Other", emoji: "📋" },
];

const PASS_STATUS = {
  active: { label: "Active", color: C.success },
  used: { label: "Used", color: C.info },
  expired: { label: "Expired", color: C.muted },
  cancelled: { label: "Cancelled", color: C.danger },
};

const GROUP_STATUS = {
  active: { label: "Active", color: C.success },
  exhausted: { label: "Full", color: C.muted },
  expired: { label: "Expired", color: C.muted },
  cancelled: { label: "Cancelled", color: C.danger },
};

const RELATIONSHIPS = [
  { value: "maid", label: "Maid" },
  { value: "cook", label: "Cook" },
  { value: "driver", label: "Driver" },
  { value: "security", label: "Security" },
  { value: "nanny", label: "Nanny" },
  { value: "other", label: "Other" },
];

const ALL_DAYS = [
  { key: "sun", label: "Su" },
  { key: "mon", label: "Mo" },
  { key: "tue", label: "Tu" },
  { key: "wed", label: "We" },
  { key: "thu", label: "Th" },
  { key: "fri", label: "Fr" },
  { key: "sat", label: "Sa" },
];

const spring = { type: "spring", stiffness: 320, damping: 28, mass: 0.85 };

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,600;1,700&display=swap');

  .vp-root, .vp-root *, .vp-root *::before, .vp-root *::after { box-sizing: border-box; }

  .vp-root {
    min-height: 100%;
    padding: 28px 16px 64px;
    background:
      radial-gradient(circle at top left, rgba(79,70,229,0.08), transparent 28%),
      radial-gradient(circle at top right, rgba(79,70,229,0.05), transparent 24%),
      #FAFAFC;
    color: #1C1C1E;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }

  .vp-shell { max-width: 900px; margin: 0 auto; }

  .vp-head { margin-bottom: 22px; }

  .vp-title {
    margin: 0;
    font-size: clamp(1.6rem, 2.6vw, 2.35rem);
    line-height: 1.12;
    letter-spacing: -0.04em;
    color: #1C1C1E;
    font-weight: 800;
  }

  .vp-subtitle {
    margin-top: 8px;
    max-width: 58ch;
    color: #6B7280;
    font-size: 0.95rem;
    line-height: 1.55;
  }

  .vp-tabs {
    display: inline-flex;
    align-items: stretch;
    gap: 0;
    padding: 0;
    margin-bottom: 22px;
    border-bottom: 1.5px solid #E8E8ED;
    flex-wrap: nowrap;
    overflow: auto;
  }

  .vp-tab {
    position: relative;
    display: inline-flex;
    align-items: center;
    border: 0;
    background: transparent;
    color: #6B7280;
    font-family: inherit;
    font-size: 0.78rem;
    font-weight: 700;
    line-height: 1;
    white-space: nowrap;
    cursor: pointer;
    outline: none;
    padding: 0;
    flex-shrink: 0;
    transition: color 0.2s ease;
  }

  .vp-tab.is-active { color: #1C1C1E; }

  .vp-tab-indicator {
    position: absolute;
    bottom: -1.5px;
    left: 13px;
    right: 13px;
    height: 2px;
    background: #4F46E5;
    border-radius: 2px 2px 0 0;
  }

  .vp-chip-inner {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 13px 9px;
  }

  .vp-section { display: flex; flex-direction: column; gap: 16px; }
  .vp-toolbar { display: flex; justify-content: flex-end; }

  .vp-alert {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 14px;
    border-radius: 14px;
    border: 1px solid rgba(220,38,38,0.18);
    background: rgba(220,38,38,0.06);
    color: #B91C1C;
    font-size: 0.88rem;
    font-weight: 600;
  }

  .vp-empty {
    padding: 58px 24px;
    border-radius: 24px;
    border: 1px dashed rgba(232,232,237,1);
    background: rgba(255,255,255,0.72);
    text-align: center;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.8);
  }

  .vp-empty-icon { font-size: 2.3rem; line-height: 1; margin-bottom: 12px; }
  .vp-empty-title { font-size: 0.96rem; font-weight: 700; color: #1C1C1E; }
  .vp-empty-copy { margin-top: 6px; font-size: 0.88rem; color: #6B7280; }

  .vp-stack { display: flex; flex-direction: column; gap: 12px; }
  .vp-stack-label {
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #9CA3AF;
  }

  .vp-form-panel {
    overflow: hidden;
    border-radius: 24px;
    border: 1px solid rgba(232,232,237,0.95);
    background: #FFFFFF;
    box-shadow: 0 16px 40px rgba(28,28,30,0.06);
  }

  .vp-form-shell { padding: 24px; }
  .vp-form-title {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 800;
    letter-spacing: -0.03em;
    color: #1C1C1E;
  }

  .vp-form-subtitle {
    margin-top: 6px;
    font-size: 0.9rem;
    line-height: 1.5;
    color: #6B7280;
  }

  .vp-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-top: 20px;
  }

  .vp-grid-2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  .vp-grid-4 { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }

  .vp-field-label {
    display: block;
    margin-bottom: 6px;
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #6B7280;
  }

  .vp-input,
  .vp-select {
    width: 100%;
    height: 46px;
    padding: 0 14px;
    border-radius: 14px;
    border: 1px solid #E8E8ED;
    background: #FAFAFC;
    color: #1C1C1E;
    font: inherit;
    font-size: 0.92rem;
    outline: none;
    transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  }

  .vp-input::placeholder { color: #9CA3AF; }
  .vp-input:focus,
  .vp-select:focus {
    border-color: rgba(79,70,229,0.45);
    box-shadow: 0 0 0 4px rgba(79,70,229,0.10);
    background: #FFFFFF;
  }
  .vp-select { cursor: pointer; }

  .vp-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    min-height: 44px;
    padding: 10px 0;
    border: 1px solid #E8E8ED;
    border-radius: 11px;
    background: #FFFFFF;
    color: #1C1C1E;
    font: inherit;
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: -0.01em;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    transition: border-color 0.2s ease, color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
  }

  .vp-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    border-color: #C7C7CC;
    box-shadow: 0 7px 16px rgba(28,28,30,0.1);
  }

  .vp-btn:active:not(:disabled) { transform: scale(0.97); }
  .vp-btn:disabled { opacity: 0.6; cursor: not-allowed; box-shadow: none; }

  .vp-btn::after {
    content: '';
    position: absolute;
    left: 10px;
    right: 10px;
    bottom: 0;
    height: 2px;
    border-radius: 999px;
    background: #4F46E5;
    transform: scaleX(0.2);
    opacity: 0;
    transition: transform 0.2s ease, opacity 0.2s ease;
  }

  .vp-btn:hover:not(:disabled)::after {
    transform: scaleX(1);
    opacity: 1;
  }

  .vp-btn-secondary {
    background: #FFFFFF;
    color: #4F46E5;
    border: 1px solid rgba(79,70,229,0.16);
    box-shadow: 0 8px 20px rgba(28,28,30,0.04);
  }

  .vp-btn-secondary:hover:not(:disabled) {
    box-shadow: 0 7px 16px rgba(28,28,30,0.1);
  }

  .vp-btn-secondary::after { background: #4F46E5; }

  .vp-btn-label {
    display: inline-flex;
    align-items: center;
    gap: 7px;
  }

  .vp-btn-arrow {
    font-size: 0.95em;
    line-height: 1;
  }

  .vp-card {
    overflow: hidden;
    border-radius: 24px;
    border: 1px solid rgba(232,232,237,0.95);
    background: #FFFFFF;
    box-shadow: 0 8px 24px rgba(28,28,30,0.06);
  }

  .vp-card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 18px 20px 16px;
    border-bottom: 1px solid #F0F0F4;
  }

  .vp-card-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  .vp-card-title {
    margin: 0;
    font-size: 0.98rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: #1C1C1E;
  }

  .vp-card-copy {
    margin-top: 4px;
    font-size: 0.83rem;
    color: #6B7280;
  }

  .vp-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    border-radius: 999px;
    border: 1px solid rgba(79,70,229,0.14);
    background: rgba(79,70,229,0.06);
    color: #4F46E5;
    font-size: 0.72rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    flex-shrink: 0;
  }

  .vp-ticket-body { display: flex; align-items: stretch; }
  .vp-ticket-main { flex: 1; padding: 20px; min-width: 0; }
  .vp-ticket-side {
    width: 184px;
    flex-shrink: 0;
    padding: 20px;
    border-left: 2px dashed #E8E8ED;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    background: linear-gradient(180deg, rgba(250,250,252,0.6), rgba(255,255,255,0));
  }

  .vp-ticket-otp { display: flex; gap: 6px; flex-wrap: wrap; }
  .vp-ticket-digit {
    width: 34px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    border: 1px solid rgba(79,70,229,0.12);
    background: #EEF2FF;
    color: #4F46E5;
    font-size: 1rem;
    font-weight: 800;
    letter-spacing: 0.02em;
  }

  .vp-section-label {
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #9CA3AF;
    margin-bottom: 8px;
  }

  .vp-ticket-note {
    font-size: 0.8rem;
    color: #6B7280;
    line-height: 1.45;
  }

  .vp-status-row {
    margin-top: 14px;
    padding: 10px 20px 18px;
    display: flex;
    justify-content: flex-end;
  }

  .vp-status-action {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 12px;
    border-radius: 12px;
    border: 1px solid rgba(220,38,38,0.16);
    background: #FFFFFF;
    color: #DC2626;
    font: inherit;
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.2s ease, transform 0.2s ease, opacity 0.2s ease;
  }

  .vp-status-action:hover:not(:disabled) {
    background: rgba(220,38,38,0.06);
    transform: translateY(-1px);
  }

  .vp-status-action:disabled { opacity: 0.55; cursor: not-allowed; }

  .vp-photo-upload {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .vp-photo-btn {
    width: 88px;
    height: 88px;
    border-radius: 50%;
    border: 1px dashed #D8D8E2;
    background: #FAFAFC;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    cursor: pointer;
    transition: border-color 0.2s ease, transform 0.2s ease;
  }

  .vp-photo-btn:hover {
    border-color: #4F46E5;
    transform: translateY(-1px);
  }

  .vp-photo-caption { font-size: 0.75rem; color: #6B7280; }

  .vp-days { display: flex; gap: 6px; flex-wrap: wrap; }
  .vp-day {
    width: 40px;
    height: 36px;
    border-radius: 12px;
    border: 1px solid #E8E8ED;
    background: #FFFFFF;
    color: #6B7280;
    font: inherit;
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease, transform 0.2s ease;
  }

  .vp-day.is-active {
    border-color: rgba(79,70,229,0.22);
    background: rgba(79,70,229,0.08);
    color: #4F46E5;
  }

  .vp-day:hover { transform: translateY(-1px); }
  .vp-time-row { display: flex; align-items: center; gap: 10px; }
  .vp-help { margin-top: 6px; font-size: 0.8rem; color: #6B7280; }

  .vp-tag {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 4px 9px;
    border-radius: 999px;
    border: 1px solid rgba(79,70,229,0.14);
    background: rgba(79,70,229,0.06);
    color: #4F46E5;
    font-size: 0.72rem;
    font-weight: 700;
  }

  .vp-toasts {
    position: fixed;
    right: 24px;
    bottom: 24px;
    z-index: 50;
  }

  .vp-toast {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 16px;
    border-radius: 18px;
    background: #FFFFFF;
    border: 1px solid rgba(232,232,237,0.95);
    color: #1C1C1E;
    box-shadow: 0 18px 40px rgba(28,28,30,0.12);
    font-size: 0.88rem;
    font-weight: 700;
  }

  .vp-toast strong { color: #4F46E5; }

  @media (max-width: 760px) {
    .vp-root { padding-inline: 12px; }
    .vp-grid-2, .vp-grid-4 { grid-template-columns: 1fr; }
    .vp-card-head, .vp-ticket-body { flex-direction: column; }
    .vp-ticket-side {
      width: 100%;
      border-left: 0;
      border-top: 2px dashed #E8E8ED;
      align-items: flex-start;
      justify-content: flex-start;
    }
    .vp-toolbar { justify-content: stretch; }
    .vp-btn { width: 100%; }
  }
`;

function fmtDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function Label({ children }) {
  return <p className="vp-field-label">{children}</p>;
}

function FocusInput({ style: extraStyle = {}, ...props }) {
  return <input className="vp-input" style={extraStyle} {...props} />;
}

function FocusSelect({ children, style: extraStyle = {}, ...props }) {
  return (
    <select className="vp-select" style={extraStyle} {...props}>
      {children}
    </select>
  );
}

function PrimaryBtn({ children, disabled, type = "button", onClick, secondary = false, className = "" }) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`vp-btn ${secondary ? "vp-btn-secondary" : ""} ${className}`.trim()}
    >
      <span className="vp-btn-label">
        {children}
        <span className="vp-btn-arrow">→</span>
      </span>
    </button>
  );
}

function StatusBadge({ status, cfg }) {
  const current = cfg[status] || cfg[Object.keys(cfg)[0]];
  return <span className="vp-pill" style={{ color: current.color, borderColor: `${current.color}26`, background: `${current.color}0C` }}>{current.label}</span>;
}

function DayPicker({ selected, onChange }) {
  return (
    <div className="vp-days">
      {ALL_DAYS.map(day => {
        const active = selected.includes(day.key);
        return (
          <button
            key={day.key}
            type="button"
            className={`vp-day ${active ? "is-active" : ""}`}
            onClick={() => onChange(active ? selected.filter(key => key !== day.key) : [...selected, day.key])}
          >
            {day.label}
          </button>
        );
      })}
    </div>
  );
}

function PhotoUpload({ preview, onChange }) {
  const ref = useRef(null);

  return (
    <div className="vp-photo-upload">
      <button type="button" onClick={() => ref.current?.click()} className="vp-photo-btn">
        {preview ? <img src={preview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Upload size={22} color={C.muted} />}
      </button>
      <p className="vp-photo-caption">Tap to upload photo</p>
      <input ref={ref} type="file" accept="image/*" style={{ display: "none" }} onChange={e => onChange(e.target.files[0])} />
    </div>
  );
}

function EntryPassCard({ pass, onCancel, cancelling }) {
  const purposeEmoji = PURPOSE_OPTIONS.find(item => item.value === pass.purpose)?.emoji || "👤";
  const isActive = pass.status === "active";
  const [hovered, setHovered] = useState(false);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${pass.otp}&size=160x160&margin=10`;

  return (
    <motion.div
      layout
      className="vp-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ opacity: isActive ? 1 : 0.72, boxShadow: hovered ? "0 10px 30px rgba(28,28,30,0.08)" : C.shadow }}
      transition={{ layout: spring }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
    >
      <div className="vp-card-head" style={{ background: isActive ? "rgba(79,70,229,0.03)" : "rgba(250,250,252,0.9)" }}>
        <div className="vp-card-meta">
          <span style={{ fontSize: 20 }}>{purposeEmoji}</span>
          <div>
            <p className="vp-card-title">{pass.visitorName}</p>
            {pass.visitorPhone && <p className="vp-card-copy">{pass.visitorPhone}</p>}
          </div>
        </div>
        <StatusBadge status={pass.status} cfg={PASS_STATUS} />
      </div>

      <div className="vp-ticket-body">
        <div className="vp-ticket-main">
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: C.subtext }}>
            <Calendar size={13} color={C.accent} />
            <span>Valid on <strong style={{ color: C.text }}>{fmtDate(pass.expectedDate)}</strong></span>
          </div>

          <div style={{ marginTop: 14 }}>
            <p className="vp-section-label">Entry OTP</p>
            <div className="vp-ticket-otp" style={{ opacity: isActive ? 1 : 0.45 }}>
              {pass.otp.split("").map((digit, index) => (
                <div key={index} className="vp-ticket-digit">{digit}</div>
              ))}
            </div>
            {isActive && <p className="vp-ticket-note" style={{ marginTop: 10 }}>Share with your visitor. The guard enters it at the gate.</p>}
          </div>
        </div>

        <div className="vp-ticket-side">
          {isActive ? (
            <>
              <img src={qrUrl} alt={`QR ${pass.otp}`} style={{ height: 96, width: 96, borderRadius: 14, border: `1px solid ${C.border}` }} loading="lazy" />
              <p className="vp-ticket-note" style={{ display: "flex", alignItems: "center", gap: 4 }}><QrCode size={11} /> Scan to see OTP</p>
            </>
          ) : (
            <div style={{ display: "flex", height: 96, width: 96, alignItems: "center", justifyContent: "center", borderRadius: 14, background: C.accentSoft, border: `1px solid ${C.border}`, color: C.muted }}>
              <QrCode size={28} />
            </div>
          )}
        </div>
      </div>

      {isActive && (
        <div className="vp-status-row">
          <button
            onClick={() => onCancel(pass._id)}
            disabled={cancelling === pass._id}
            className="vp-status-action"
          >
            <Trash2 size={12} />{cancelling === pass._id ? "Cancelling…" : "Cancel Pass"}
          </button>
        </div>
      )}
    </motion.div>
  );
}

function CreatePassForm({ onCreate }) {
  const { token } = useAuth();
  const [form, setForm] = useState({ visitorName: "", visitorPhone: "", purpose: "guest", expectedDate: new Date().toISOString().split("T")[0] });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.visitorName.trim()) {
      setError("Visitor name is required.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const data = await apiRequest("/visitor-prereg", { token, method: "POST", body: form });
      onCreate(data.item);
      setForm(previous => ({ ...previous, visitorName: "", visitorPhone: "", purpose: "guest" }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="vp-form-panel">
      <div className="vp-form-shell">
        <p className="vp-form-title">Create Entry Pass</p>
        <p className="vp-form-subtitle">Generate a one-time OTP pass for an expected visitor.</p>
        <form onSubmit={handleSubmit} className="vp-form">
          {error && <div className="vp-alert"><X size={14} />{error}</div>}
          <div className="vp-grid-2">
            <div>
              <Label>Visitor Name *</Label>
              <FocusInput placeholder="e.g. Raj Kumar" value={form.visitorName} onChange={e => setForm(previous => ({ ...previous, visitorName: e.target.value }))} />
            </div>
            <div>
              <Label>Visitor Phone</Label>
              <FocusInput placeholder="e.g. 9876543210" value={form.visitorPhone} onChange={e => setForm(previous => ({ ...previous, visitorPhone: e.target.value }))} />
            </div>
          </div>
          <div>
            <Label>Purpose</Label>
            <div className="vp-grid-4">
              {PURPOSE_OPTIONS.map(option => {
                const active = form.purpose === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setForm(previous => ({ ...previous, purpose: option.value }))}
                    className="vp-btn vp-btn-secondary"
                    style={{
                      flexDirection: "column",
                      minHeight: 68,
                      gap: 4,
                      paddingBlock: 10,
                      background: active ? "rgba(79,70,229,0.08)" : "#FFFFFF",
                      color: active ? C.accent : C.subtext,
                      borderColor: active ? "rgba(79,70,229,0.18)" : C.border,
                      boxShadow: "none",
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{option.emoji}</span>
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <Label>Expected Visit Date *</Label>
            <FocusInput type="date" value={form.expectedDate} min={new Date().toISOString().split("T")[0]} onChange={e => setForm(previous => ({ ...previous, expectedDate: e.target.value }))} />
          </div>
          <div>
            <PrimaryBtn type="submit" disabled={submitting}><Plus size={15} />{submitting ? "Generating…" : "Generate Entry Pass"}</PrimaryBtn>
          </div>
        </form>
      </div>
    </div>
  );
}

function PassesTab() {
  const { token } = useAuth();
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("/visitor-prereg", { token });
      setPasses(data.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const socket = getSocket();
    function onUsed() { load(); }
    socket.on("visitor:prereg_used", onUsed);
    return () => socket.off("visitor:prereg_used", onUsed);
  }, [load]);

  async function handleCancel(id) {
    setCancelling(id);
    try {
      await apiRequest(`/visitor-prereg/${id}`, { token, method: "DELETE" });
      setPasses(previous => previous.map(pass => (pass._id === id ? { ...pass, status: "cancelled" } : pass)));
    } catch (err) {
      setError(err.message);
    } finally {
      setCancelling(null);
    }
  }

  const active = passes.filter(pass => pass.status === "active");
  const historic = passes.filter(pass => pass.status !== "active");

  return (
    <div className="vp-section">
      <div className="vp-toolbar">
        <PrimaryBtn onClick={() => setShowForm(value => !value)}><Plus size={15} /> New Pass</PrimaryBtn>
      </div>

      {error && <div className="vp-alert"><X size={14} />{error}</div>}

      <AnimatePresence initial={false}>
        {showForm && (
          <motion.div key="entry-form" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={spring} style={{ overflow: "hidden" }}>
            <CreatePassForm onCreate={item => { setPasses(previous => [item, ...previous]); setShowForm(false); }} />
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="vp-stack">
          {[1, 2].map(item => <div key={item} style={{ height: 176, borderRadius: 24, background: "rgba(255,255,255,0.8)", border: "1px solid #E8E8ED", boxShadow: C.shadow }} />)}
        </div>
      ) : (
        <>
          {active.length === 0 && !showForm && (
            <div className="vp-empty">
              <p className="vp-empty-icon">🎫</p>
              <p className="vp-empty-title">No active passes</p>
              <p className="vp-empty-copy">Click “New Pass” to pre-register a visitor.</p>
            </div>
          )}

          {active.length > 0 && (
            <div className="vp-stack">
              <p className="vp-stack-label">Active ({active.length})</p>
              <AnimatePresence initial={false} mode="popLayout">
                {active.map(pass => <EntryPassCard key={pass._id} pass={pass} onCancel={handleCancel} cancelling={cancelling} />)}
              </AnimatePresence>
            </div>
          )}

          {historic.length > 0 && (
            <div className="vp-stack">
              <p className="vp-stack-label">History</p>
              <AnimatePresence initial={false} mode="popLayout">
                {historic.map(pass => <EntryPassCard key={pass._id} pass={pass} onCancel={handleCancel} cancelling={cancelling} />)}
              </AnimatePresence>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AddFreqVisitorForm({ onAdded }) {
  const { token } = useAuth();
  const [form, setForm] = useState({ name: "", phone: "", relationship: "maid", description: "", allowedDays: ["mon", "tue", "wed", "thu", "fri"], allowedFrom: "08:00", allowedUntil: "10:00" });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handlePhotoChange(file) {
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.name.trim()) { setError("Name is required."); return; }
    if (!form.phone.trim()) { setError("Phone number is required."); return; }
    if (form.allowedDays.length === 0) { setError("Select at least one allowed day."); return; }
    setError("");
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("phone", form.phone);
      fd.append("relationship", form.relationship);
      fd.append("description", form.description);
      fd.append("allowedDays", JSON.stringify(form.allowedDays));
      fd.append("allowedFrom", form.allowedFrom);
      fd.append("allowedUntil", form.allowedUntil);
      if (photoFile) fd.append("photo", photoFile);
      const data = await apiRequest("/freq-visitors", { token, method: "POST", formData: fd });
      onAdded(data.item);
      setForm({ name: "", phone: "", relationship: "maid", description: "", allowedDays: ["mon", "tue", "wed", "thu", "fri"], allowedFrom: "08:00", allowedUntil: "10:00" });
      setPhotoFile(null);
      setPhotoPreview("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="vp-form-panel">
      <div className="vp-form-shell">
        <p className="vp-form-title">Add Frequent Visitor</p>
        <p className="vp-form-subtitle">Add someone who visits regularly. Guard finds them by phone, with no approval needed during allowed hours.</p>
        <form onSubmit={handleSubmit} className="vp-form">
          {error && <div className="vp-alert"><X size={14} />{error}</div>}

          <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
            <PhotoUpload preview={photoPreview} onChange={handlePhotoChange} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
              <div><Label>Full Name *</Label><FocusInput placeholder="e.g. Sunita Devi" value={form.name} onChange={e => setForm(previous => ({ ...previous, name: e.target.value }))} /></div>
              <div><Label>Phone Number *</Label><FocusInput placeholder="e.g. 9876543210" value={form.phone} onChange={e => setForm(previous => ({ ...previous, phone: e.target.value }))} /></div>
            </div>
          </div>

          <div className="vp-grid-2">
            <div>
              <Label>Relationship</Label>
              <FocusSelect value={form.relationship} onChange={e => setForm(previous => ({ ...previous, relationship: e.target.value }))}>
                {RELATIONSHIPS.map(rel => <option key={rel.value} value={rel.value}>{rel.label}</option>)}
              </FocusSelect>
            </div>
            <div>
              <Label>Description (optional)</Label>
              <FocusInput placeholder="e.g. Comes Mon-Sat morning" value={form.description} onChange={e => setForm(previous => ({ ...previous, description: e.target.value }))} />
            </div>
          </div>

          <div>
            <Label>Allowed Days</Label>
            <DayPicker selected={form.allowedDays} onChange={days => setForm(previous => ({ ...previous, allowedDays: days }))} />
          </div>

          <div>
            <Label>Allowed Time Window</Label>
            <div className="vp-time-row">
              <FocusInput type="time" style={{ width: 140 }} value={form.allowedFrom} onChange={e => setForm(previous => ({ ...previous, allowedFrom: e.target.value }))} />
              <span style={{ fontSize: 13, color: C.subtext, fontWeight: 600 }}>to</span>
              <FocusInput type="time" style={{ width: 140 }} value={form.allowedUntil} onChange={e => setForm(previous => ({ ...previous, allowedUntil: e.target.value }))} />
            </div>
            <p className="vp-help">Guard sees a warning if they arrive outside this window.</p>
          </div>

          <div>
            <PrimaryBtn type="submit" disabled={submitting}><Users size={15} />{submitting ? "Saving…" : "Add to Trusted List"}</PrimaryBtn>
          </div>
        </form>
      </div>
    </div>
  );
}

function FreqVisitorCard({ fv, onRemove, removing }) {
  const relLabel = RELATIONSHIPS.find(rel => rel.value === fv.relationship)?.label || fv.relationship;
  const dayLabels = fv.myLink?.allowedDays?.map(day => ALL_DAYS.find(item => item.key === day)?.label).join(" ") || "Any day";
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      layout
      className="vp-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ display: "flex", alignItems: "center", gap: 16, padding: 16, boxShadow: hovered ? "0 10px 30px rgba(28,28,30,0.08)" : C.shadow }}
      transition={{ layout: spring }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
    >
      <div style={{ flexShrink: 0 }}>
        {fv.photoUrl ? (
          <img src={fv.photoUrl} alt={fv.name} style={{ height: 56, width: 56, borderRadius: "50%", objectFit: "cover", border: `2px solid ${C.border}` }} />
        ) : (
          <div style={{ display: "flex", height: 56, width: 56, alignItems: "center", justifyContent: "center", borderRadius: "50%", background: C.accentSoft, border: `1px solid ${C.border}`, color: C.accent, fontSize: 20, fontWeight: 800 }}>{fv.name[0]?.toUpperCase()}</div>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <p style={{ fontWeight: 700, color: C.text, fontSize: 14 }}>{fv.name}</p>
          <span className="vp-tag">{relLabel}</span>
        </div>
        <p style={{ fontSize: 12, color: C.subtext, marginTop: 2 }}>{fv.phone}</p>
        {fv.description && <p style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{fv.description}</p>}
        <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.subtext }}>
          <Clock size={11} color={C.accent} />
          <span>{dayLabels} · {fv.myLink?.allowedFrom}–{fv.myLink?.allowedUntil}</span>
        </div>
      </div>

      <button
        onClick={() => onRemove(fv._id)}
        disabled={removing === fv._id}
        className="vp-status-action"
        style={{ flexShrink: 0 }}
      >
        <Trash2 size={12} />{removing === fv._id ? "…" : "Remove"}
      </button>
    </motion.div>
  );
}

function FreqVisitorsTab() {
  const { token } = useAuth();
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removing, setRemoving] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [entryToast, setEntryToast] = useState(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("/freq-visitors/mine", { token });
      setVisitors(data.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const socket = getSocket();
    function onEntry({ freqVisitor }) {
      setEntryToast(`${freqVisitor.name} (${freqVisitor.relationship}) has entered.`);
      setTimeout(() => setEntryToast(null), 6000);
    }
    socket.on("visitor:freq_entry", onEntry);
    return () => socket.off("visitor:freq_entry", onEntry);
  }, []);

  async function handleRemove(id) {
    setRemoving(id);
    try {
      await apiRequest(`/freq-visitors/${id}/my-link`, { token, method: "DELETE" });
      setVisitors(previous => previous.filter(visitor => visitor._id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setRemoving(null);
    }
  }

  return (
    <div className="vp-section">
      {entryToast && (
        <div className="vp-toasts"><div className="vp-toast">🚶 <span>{entryToast}</span></div></div>
      )}

      <div className="vp-toolbar">
        <PrimaryBtn onClick={() => setShowForm(value => !value)}><Plus size={15} /> Add Frequent Visitor</PrimaryBtn>
      </div>

      {error && <div className="vp-alert"><X size={14} />{error}</div>}

      <AnimatePresence initial={false}>
        {showForm && (
          <motion.div key="freq-form" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={spring} style={{ overflow: "hidden" }}>
            <AddFreqVisitorForm onAdded={item => { const myLink = item.links?.find(link => link.residentId); setVisitors(previous => [{ ...item, myLink }, ...previous]); setShowForm(false); }} />
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="vp-stack">
          {[1, 2, 3].map(item => <div key={item} style={{ height: 80, borderRadius: 24, background: "rgba(255,255,255,0.8)", border: "1px solid #E8E8ED", boxShadow: C.shadow }} />)}
        </div>
      ) : visitors.length === 0 && !showForm ? (
        <div className="vp-empty">
          <p className="vp-empty-icon">👥</p>
          <p className="vp-empty-title">No frequent visitors yet</p>
          <p className="vp-empty-copy">Add your maid, cook, or driver and they’ll enter without approval.</p>
        </div>
      ) : (
        <div className="vp-stack">
          <AnimatePresence initial={false} mode="popLayout">
            {visitors.map(visitor => <FreqVisitorCard key={visitor._id} fv={visitor} onRemove={handleRemove} removing={removing} />)}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function UsageBar({ used, max }) {
  const pct = Math.min(100, Math.round((used / max) * 100));
  const color = pct >= 100 ? C.danger : pct >= 75 ? C.warning : C.accent;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.subtext }}>
        <span>{used} of {max} guests used</span>
        <span>{max - used} spots left</span>
      </div>
      <div style={{ height: 6, width: "100%", borderRadius: 100, background: "rgba(79,70,229,0.10)" }}>
        <div style={{ height: 6, borderRadius: 100, background: color, width: `${pct}%`, transition: "width 0.4s ease" }} />
      </div>
    </div>
  );
}

function GroupPassCard({ pass, onCancel, cancelling }) {
  const isActive = pass.status === "active";
  const [hovered, setHovered] = useState(false);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${pass.otp}&size=160x160&margin=10`;

  return (
    <motion.div
      layout
      className="vp-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ opacity: isActive ? 1 : 0.72, boxShadow: hovered ? "0 10px 30px rgba(28,28,30,0.08)" : C.shadow }}
      transition={{ layout: spring }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
    >
      <div className="vp-card-head" style={{ background: isActive ? "rgba(79,70,229,0.03)" : "rgba(250,250,252,0.9)" }}>
        <div className="vp-card-meta">
          <span style={{ fontSize: 20 }}>🎉</span>
          <div>
            <p className="vp-card-title">{pass.eventName}</p>
            <p className="vp-card-copy" style={{ display: "flex", alignItems: "center", gap: 4 }}><Calendar size={11} color={C.accent} /> {fmtDate(pass.expectedDate)}</p>
          </div>
        </div>
        <StatusBadge status={pass.status} cfg={GROUP_STATUS} />
      </div>

      <div className="vp-ticket-body">
        <div className="vp-ticket-main">
          <UsageBar used={pass.usedCount || 0} max={pass.maxUses} />

          <div style={{ marginTop: 14 }}>
            <p className="vp-section-label">Shared Entry OTP</p>
            <div className="vp-ticket-otp" style={{ opacity: isActive ? 1 : 0.45 }}>
              {pass.otp.split("").map((digit, index) => (
                <div key={index} className="vp-ticket-digit">{digit}</div>
              ))}
            </div>
            {isActive && <p className="vp-ticket-note" style={{ marginTop: 10 }}>Share this one code with all your guests. Each person uses it once at the gate.</p>}
          </div>

          {pass.entries?.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <p className="vp-section-label">Guests who entered</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {pass.entries.map((entry, index) => (
                  <div key={index} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: C.subtext }}>
                    <span style={{ color: C.muted }}>#{index + 1}</span>
                    <span style={{ fontWeight: 500, color: C.text }}>{entry.visitorName}</span>
                    <span style={{ color: C.muted }}>{new Date(entry.entryTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="vp-ticket-side">
          {isActive ? (
            <>
              <img src={qrUrl} alt={`QR ${pass.otp}`} style={{ height: 96, width: 96, borderRadius: 14, border: `1px solid ${C.border}` }} loading="lazy" />
              <p className="vp-ticket-note" style={{ display: "flex", alignItems: "center", gap: 4 }}><QrCode size={11} /> Scan</p>
            </>
          ) : (
            <div style={{ display: "flex", height: 96, width: 96, alignItems: "center", justifyContent: "center", borderRadius: 14, background: C.accentSoft, border: `1px solid ${C.border}`, color: C.muted }}>
              <QrCode size={28} />
            </div>
          )}
        </div>
      </div>

      {isActive && (
        <div className="vp-status-row">
          <button onClick={() => onCancel(pass._id)} disabled={cancelling === pass._id} className="vp-status-action">
            <Trash2 size={12} />{cancelling === pass._id ? "Cancelling…" : "Cancel Pass"}
          </button>
        </div>
      )}
    </motion.div>
  );
}

function CreateGroupPassForm({ onCreate }) {
  const { token } = useAuth();
  const [form, setForm] = useState({ eventName: "", maxUses: 10, expectedDate: new Date().toISOString().split("T")[0] });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.eventName.trim()) { setError("Event name is required."); return; }
    if (form.maxUses < 1) { setError("At least 1 guest required."); return; }
    setError("");
    setSubmitting(true);
    try {
      const data = await apiRequest("/group-passes", { token, method: "POST", body: form });
      onCreate(data.item);
      setForm(previous => ({ ...previous, eventName: "", maxUses: 10 }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="vp-form-panel">
      <div className="vp-form-shell">
        <p className="vp-form-title">Create Group Pass</p>
        <p className="vp-form-subtitle">One shared OTP for all your guests. Guard enters it once per person with their name.</p>
        <form onSubmit={handleSubmit} className="vp-form">
          {error && <div className="vp-alert"><X size={14} />{error}</div>}
          <div><Label>Event Name *</Label><FocusInput placeholder="e.g. Birthday Party, House Warming…" value={form.eventName} onChange={e => setForm(previous => ({ ...previous, eventName: e.target.value }))} /></div>
          <div className="vp-grid-2">
            <div>
              <Label>Max Guests *</Label>
              <FocusInput type="number" min={1} max={100} value={form.maxUses} onChange={e => setForm(previous => ({ ...previous, maxUses: parseInt(e.target.value, 10) || 1 }))} />
              <p className="vp-help">OTP stops working after this many entries.</p>
            </div>
            <div><Label>Event Date *</Label><FocusInput type="date" value={form.expectedDate} min={new Date().toISOString().split("T")[0]} onChange={e => setForm(previous => ({ ...previous, expectedDate: e.target.value }))} /></div>
          </div>
          <div><PrimaryBtn type="submit" disabled={submitting}><PartyPopper size={15} />{submitting ? "Generating…" : "Generate Group Pass"}</PrimaryBtn></div>
        </form>
      </div>
    </div>
  );
}

function GroupPassesTab() {
  const { token } = useAuth();
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [guestToast, setGuestToast] = useState(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("/group-passes", { token });
      setPasses(data.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const socket = getSocket();
    function onGroupPassUsed({ visitor, groupPass }) {
      setGuestToast(`${visitor.visitorName} entered — ${groupPass.usedCount}/${groupPass.maxUses} guests`);
      setTimeout(() => setGuestToast(null), 6000);
      load();
    }
    socket.on("visitor:group_pass_used", onGroupPassUsed);
    return () => socket.off("visitor:group_pass_used", onGroupPassUsed);
  }, [load]);

  async function handleCancel(id) {
    setCancelling(id);
    try {
      await apiRequest(`/group-passes/${id}`, { token, method: "DELETE" });
      setPasses(previous => previous.map(pass => (pass._id === id ? { ...pass, status: "cancelled" } : pass)));
    } catch (err) {
      setError(err.message);
    } finally {
      setCancelling(null);
    }
  }

  const active = passes.filter(pass => pass.status === "active");
  const historic = passes.filter(pass => pass.status !== "active");

  return (
    <div className="vp-section">
      {guestToast && (
        <div className="vp-toasts"><div className="vp-toast">🎉 <span>{guestToast}</span></div></div>
      )}

      <div className="vp-toolbar">
        <PrimaryBtn onClick={() => setShowForm(value => !value)}><Plus size={15} /> New Group Pass</PrimaryBtn>
      </div>

      {error && <div className="vp-alert"><X size={14} />{error}</div>}

      <AnimatePresence initial={false}>
        {showForm && (
          <motion.div key="group-form" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={spring} style={{ overflow: "hidden" }}>
            <CreateGroupPassForm onCreate={item => { setPasses(previous => [item, ...previous]); setShowForm(false); }} />
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="vp-stack">
          {[1, 2].map(item => <div key={item} style={{ height: 208, borderRadius: 24, background: "rgba(255,255,255,0.8)", border: "1px solid #E8E8ED", boxShadow: C.shadow }} />)}
        </div>
      ) : (
        <>
          {active.length === 0 && !showForm && (
            <div className="vp-empty">
              <p className="vp-empty-icon">🎉</p>
              <p className="vp-empty-title">No group passes yet</p>
              <p className="vp-empty-copy">Hosting a party? Create a group pass — one OTP for all guests.</p>
            </div>
          )}

          {active.length > 0 && (
            <div className="vp-stack">
              <p className="vp-stack-label">Active ({active.length})</p>
              <AnimatePresence initial={false} mode="popLayout">
                {active.map(pass => <GroupPassCard key={pass._id} pass={pass} onCancel={handleCancel} cancelling={cancelling} />)}
              </AnimatePresence>
            </div>
          )}

          {historic.length > 0 && (
            <div className="vp-stack">
              <p className="vp-stack-label">History</p>
              <AnimatePresence initial={false} mode="popLayout">
                {historic.map(pass => <GroupPassCard key={pass._id} pass={pass} onCancel={handleCancel} cancelling={cancelling} />)}
              </AnimatePresence>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function VisitorPreRegPage() {
  const [activeTab, setActiveTab] = useState("passes");
  const tabs = [
    { key: "passes", label: "🎫 Entry Passes" },
    { key: "frequent", label: "👥 Frequent Visitors" },
    { key: "group", label: "🎉 Group Passes" },
  ];

  return (
    <div className="vp-root">
      <style>{CSS}</style>

      <div className="vp-shell">
        <div className="vp-head">
          <h1 className="vp-title">My Visitor Passes</h1>
          <p className="vp-subtitle">Manage entry passes, trusted visitors, and group event passes from one clean control surface.</p>
        </div>

        <div className="vp-tabs">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`vp-tab ${activeTab === tab.key ? "is-active" : ""}`}>
              <span className="vp-chip-inner">
                {tab.label}
              </span>
              {activeTab === tab.key && <motion.div layoutId="vp-tab-indicator" className="vp-tab-indicator" transition={spring} />}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {activeTab === "passes" && (
            <motion.div key="passes" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={spring}>
              <PassesTab />
            </motion.div>
          )}
          {activeTab === "frequent" && (
            <motion.div key="frequent" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={spring}>
              <FreqVisitorsTab />
            </motion.div>
          )}
          {activeTab === "group" && (
            <motion.div key="group" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={spring}>
              <GroupPassesTab />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}