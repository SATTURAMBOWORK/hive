import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, X, RefreshCw, Upload, Clock,
  Ban, Calendar, Edit2, ChevronDown, CheckCircle,
} from "lucide-react";
import { useAuth } from "../components/AuthContext";
import { apiRequest } from "../components/api";
import { getSocket } from "../components/socket";

/* ─── Design tokens ─────────────────────────────────────────────── */
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
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  .sp-root {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: ${C.bg};
    min-height: calc(100vh - 64px);
    padding: 32px 32px 80px;
    box-sizing: border-box;
    color: ${C.ink};
  }
  .sp-root * { box-sizing: border-box; }

  .sp-shell {
    max-width: 760px;
    margin: 0 auto;
  }

  /* ── Header ────────────────────────────────────── */
  .sp-page-head { margin-bottom: 20px; }
  .sp-page-title {
    font-size: clamp(1.5rem, 2.8vw, 2.1rem);
    font-weight: 800; letter-spacing: -0.5px;
    color: ${C.ink}; line-height: 1.15; margin: 0 0 4px;
  }
  .sp-page-sub {
    color: ${C.muted}; font-size: 0.82rem;
    font-weight: 500; line-height: 1.5; margin: 0;
  }

  .sp-controls {
    display: flex; align-items: center;
    justify-content: space-between; gap: 12px;
    flex-wrap: wrap; margin-bottom: 20px;
  }

  /* ── Buttons ───────────────────────────────────── */
  .sp-btn-primary, .sp-btn-ghost {
    position: relative; overflow: hidden;
    display: inline-flex; align-items: center; gap: 7px;
    background: ${C.surface}; border: 1px solid ${C.border};
    border-radius: 10px; padding: 9px 14px;
    color: ${C.ink}; font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.8rem; font-weight: 700; cursor: pointer;
    transition: border-color 0.2s, color 0.2s, transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }
  .sp-btn-primary::after, .sp-btn-ghost::after {
    content: ''; position: absolute;
    left: 8px; right: 8px; bottom: 0;
    height: 2px; border-radius: 999px;
    background: ${C.indigo};
    transform: scaleX(0.2); opacity: 0;
    transition: transform 0.2s ease, opacity 0.2s ease;
  }
  .sp-btn-primary:hover:not(:disabled),
  .sp-btn-ghost:hover:not(:disabled) {
    border-color: #C7C7CC; transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(28,28,30,0.09);
  }
  .sp-btn-primary:hover:not(:disabled)::after,
  .sp-btn-ghost:hover:not(:disabled)::after { transform: scaleX(1); opacity: 1; }
  .sp-btn-primary:active:not(:disabled),
  .sp-btn-ghost:active:not(:disabled) { transform: scale(0.97); }
  .sp-btn-primary:disabled,
  .sp-btn-ghost:disabled { opacity: 0.45; cursor: not-allowed; }

  /* ── Tabs (chip rail) ──────────────────────────── */
  .sp-chips-rail {
    display: inline-flex; align-items: stretch;
    border-bottom: 1.5px solid ${C.border}; flex-shrink: 0;
    margin-bottom: 20px;
  }
  .sp-chip {
    position: relative; display: inline-flex; align-items: center;
    border: none; background: transparent; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.78rem; font-weight: 700;
    line-height: 1; white-space: nowrap; outline: none; padding: 0;
  }
  .sp-chip-underline {
    position: absolute; bottom: -1.5px; left: 13px; right: 13px;
    height: 2px; background: ${C.indigo}; border-radius: 2px 2px 0 0;
  }
  .sp-chip-inner { display: inline-flex; align-items: center; gap: 6px; padding: 7px 13px 9px; }

  /* ── Staff card ────────────────────────────────── */
  .sp-card {
    background: ${C.surface}; border: 1px solid ${C.border};
    border-radius: 16px; overflow: hidden;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    transition: box-shadow 0.22s, border-color 0.22s, transform 0.22s;
  }
  .sp-card:hover {
    box-shadow: 0 8px 24px rgba(28,28,30,0.09);
    border-color: #C7C7CC; transform: translateY(-1px);
  }
  .sp-card.is-blocked { opacity: 0.65; }

  .sp-card-top {
    display: flex; align-items: center; gap: 14px;
    padding: 16px 20px; border-bottom: 1px solid ${C.borderL};
  }
  .sp-card-avatar {
    width: 48px; height: 48px; border-radius: 50%;
    background: ${C.borderL}; border: 1px solid ${C.border};
    display: flex; align-items: center; justify-content: center;
    font-size: 22px; flex-shrink: 0; overflow: hidden;
  }
  .sp-card-avatar img { width: 100%; height: 100%; object-fit: cover; }

  .sp-card-info { flex: 1; min-width: 0; }
  .sp-card-name {
    font-size: 0.9rem; font-weight: 700; color: ${C.ink};
    margin: 0 0 3px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  }
  .sp-card-sub { font-size: 0.76rem; color: ${C.muted}; text-transform: capitalize; }

  .sp-staff-code {
    font-size: 0.72rem; font-weight: 700; font-family: monospace;
    background: ${C.indigoL}; color: ${C.indigo};
    border: 1px solid ${C.indigoBr}; padding: 4px 10px;
    border-radius: 8px; flex-shrink: 0; letter-spacing: 0.02em;
  }

  .sp-schedule-row {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 20px; background: ${C.borderL};
    border-bottom: 1px solid ${C.border};
    font-size: 0.75rem; color: ${C.muted}; font-weight: 600;
  }

  .sp-card-actions {
    display: flex; align-items: center;
    gap: 7px; padding: 12px 20px;
  }

  /* ── Action badge buttons ──────────────────────── */
  .sp-action-btn {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 5px 11px; border-radius: 8px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.72rem; font-weight: 700; cursor: pointer;
    border: 1px solid; transition: background 0.15s, transform 0.15s;
    background: transparent;
  }
  .sp-action-btn:hover:not(:disabled) { transform: translateY(-1px); }
  .sp-action-btn:disabled { opacity: 0.45; cursor: not-allowed; }

  .sp-action-btn.indigo { color: ${C.indigo}; border-color: ${C.indigoBr}; background: ${C.indigoL}; }
  .sp-action-btn.indigo:hover:not(:disabled) { background: #E0E7FF; }
  .sp-action-btn.amber  { color: ${C.amberD}; border-color: ${C.amberBr}; background: ${C.amberL}; }
  .sp-action-btn.amber:hover:not(:disabled)  { background: #FEF3C7; }
  .sp-action-btn.green  { color: ${C.green};  border-color: #BBF7D0;       background: ${C.greenL}; }
  .sp-action-btn.green:hover:not(:disabled)  { background: #D1FAE5; }
  .sp-action-btn.red    { color: ${C.red};    border-color: ${C.redBr};    background: ${C.redL};   }
  .sp-action-btn.red:hover:not(:disabled)    { background: #FECACA; }

  /* Status badges */
  .sp-badge {
    display: inline-flex; align-items: center; gap: 4px;
    border-radius: 999px; padding: 2px 8px;
    font-size: 0.65rem; font-weight: 800;
    text-transform: uppercase; letter-spacing: 0.04em;
  }
  .sp-badge.blocked { background: ${C.redL};   color: ${C.red};   border: 1px solid ${C.redBr};   }
  .sp-badge.onleave { background: ${C.amberL}; color: ${C.amberD}; border: 1px solid ${C.amberBr}; }

  /* ── Empty state ───────────────────────────────── */
  .sp-empty {
    border: 2px dashed ${C.border}; border-radius: 18px;
    padding: 64px 24px; text-align: center;
  }

  /* ── Error banner ──────────────────────────────── */
  .sp-error {
    border-radius: 12px; border: 1px solid ${C.redBr};
    background: ${C.redL}; color: ${C.red};
    font-size: 0.82rem; font-weight: 700;
    padding: 11px 14px; margin-bottom: 16px;
  }

  /* ── Modal ─────────────────────────────────────── */
  .sp-modal-backdrop {
    position: fixed; inset: 0; z-index: 200;
    background: rgba(0,0,0,0.5);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    display: flex; align-items: center;
    justify-content: center; padding: 16px;
  }
  .sp-modal {
    width: 100%; background: ${C.surface};
    border-radius: 20px; overflow: hidden;
    box-shadow: 0 24px 64px rgba(0,0,0,0.2);
  }
  .sp-modal-head {
    display: flex; align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid ${C.border};
    padding: 16px 24px;
  }
  .sp-modal-title {
    font-size: 1rem; font-weight: 800; color: ${C.ink}; margin: 0;
  }
  .sp-modal-sub {
    font-size: 0.75rem; color: ${C.muted}; margin: 3px 0 0;
  }
  .sp-modal-close {
    background: transparent; border: none; cursor: pointer;
    color: ${C.faint}; padding: 6px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    transition: color 0.15s, background 0.15s;
  }
  .sp-modal-close:hover { color: ${C.ink}; background: ${C.borderL}; }

  .sp-modal-body {
    padding: 24px; display: flex;
    flex-direction: column; gap: 16px;
    max-height: 80vh; overflow-y: auto;
  }

  /* ── Form elements ─────────────────────────────── */
  .sp-label {
    display: block; margin-bottom: 6px;
    font-size: 0.68rem; font-weight: 800;
    color: ${C.muted}; letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .sp-input {
    width: 100%; border: 1px solid ${C.border};
    border-radius: 10px; background: ${C.bg};
    padding: 10px 14px; color: ${C.ink};
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.84rem; font-weight: 500;
    outline: none; transition: border-color 0.18s, box-shadow 0.18s;
  }
  .sp-input:focus {
    border-color: ${C.indigo};
    box-shadow: 0 0 0 3px rgba(79,70,229,0.1);
  }

  .sp-upload-zone {
    height: 64px; width: 64px; border-radius: 14px;
    border: 2px dashed ${C.border};
    display: flex; align-items: center; justify-content: center;
    overflow: hidden; cursor: pointer; flex-shrink: 0;
    transition: border-color 0.18s, background 0.18s;
  }
  .sp-upload-zone:hover { border-color: ${C.indigo}; background: ${C.indigoL}; }
  .sp-upload-zone img { width: 100%; height: 100%; object-fit: cover; }

  .sp-submit-btn {
    width: 100%; border: none; border-radius: 12px;
    padding: 13px 0; font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.88rem; font-weight: 700; color: #fff;
    background: linear-gradient(135deg, ${C.indigo}, ${C.indigoD});
    cursor: pointer; box-shadow: 0 4px 14px rgba(79,70,229,0.28);
    transition: transform 0.18s, box-shadow 0.18s, opacity 0.18s;
  }
  .sp-submit-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 7px 20px rgba(79,70,229,0.38);
  }
  .sp-submit-btn:disabled { opacity: 0.45; cursor: not-allowed; }

  /* ── Day picker ────────────────────────────────── */
  .sp-day-pill {
    height: 34px; width: 38px; border-radius: 9px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.72rem; font-weight: 700;
    cursor: pointer; transition: all 0.15s;
    border: 1.5px solid;
  }
  .sp-day-pill.active {
    background: ${C.indigo}; border-color: ${C.indigo}; color: #fff;
  }
  .sp-day-pill.inactive {
    background: ${C.borderL}; border-color: ${C.border}; color: ${C.muted};
  }
  .sp-day-pill.inactive:hover { border-color: ${C.indigo}; color: ${C.indigo}; background: ${C.indigoL}; }

  /* ── Society staff accordion ───────────────────── */
  .sp-soc-card {
    background: ${C.surface}; border: 1px solid ${C.border};
    border-radius: 16px; overflow: hidden;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    transition: box-shadow 0.22s, border-color 0.22s;
  }
  .sp-soc-card:hover { box-shadow: 0 8px 24px rgba(28,28,30,0.09); border-color: #C7C7CC; }

  .sp-soc-trigger {
    width: 100%; display: flex; align-items: center; gap: 14px;
    padding: 14px 20px; background: transparent;
    border: none; cursor: pointer; text-align: left;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .sp-soc-row {
    display: flex; align-items: center; gap: 14px;
    padding: 11px 20px; font-size: 0.82rem;
    border-top: 1px solid ${C.borderL};
  }
  .sp-soc-row:first-child { border-top: 1px solid ${C.border}; }

  /* Spin animation */
  @keyframes sp-spin { to { transform: rotate(360deg); } }
`;

/* ─── Static data ───────────────────────────────────────────────── */
const CATEGORY_OPTIONS = [
  { value: "maid",     label: "Maid",     emoji: "🧹" },
  { value: "cook",     label: "Cook",     emoji: "👨‍🍳" },
  { value: "driver",   label: "Driver",   emoji: "🚗" },
  { value: "security", label: "Security", emoji: "💂" },
  { value: "nanny",    label: "Nanny",    emoji: "👶" },
  { value: "gardener", label: "Gardener", emoji: "🌿" },
  { value: "other",    label: "Other",    emoji: "👤" },
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

function getCategoryEmoji(cat) {
  return CATEGORY_OPTIONS.find(c => c.value === cat)?.emoji || "👤";
}

/* ─── Day Picker ────────────────────────────────────────────────── */
function DayPicker({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {ALL_DAYS.map(d => {
        const active = value.includes(d.key);
        return (
          <button
            key={d.key}
            type="button"
            className={`sp-day-pill ${active ? "active" : "inactive"}`}
            onClick={() => onChange(active ? value.filter(x => x !== d.key) : [...value, d.key])}
          >
            {d.label}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Add Staff Modal ───────────────────────────────────────────── */
function AddStaffModal({ onClose, onAdded }) {
  const { token } = useAuth();
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    name: "", phone: "", category: "maid",
    allowedDays: ["mon","tue","wed","thu","fri"],
    allowedFrom: "08:00", allowedUntil: "18:00",
  });

  function set(field, value) { setForm(f => ({ ...f, [field]: value })); }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const fd = new FormData();
      fd.append("name",         form.name.trim());
      fd.append("phone",        form.phone.trim());
      fd.append("category",     form.category);
      fd.append("allowedDays",  JSON.stringify(form.allowedDays));
      fd.append("allowedFrom",  form.allowedFrom);
      fd.append("allowedUntil", form.allowedUntil);
      if (fileRef.current?.files[0]) fd.append("photo", fileRef.current.files[0]);
      const data = await apiRequest("/staff", { method: "POST", formData: fd, token });
      onAdded(data.item);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="sp-modal-backdrop" onClick={onClose}>
      <motion.div
        className="sp-modal"
        style={{ maxWidth: 440 }}
        initial={{ scale: 0.95, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 8 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        onClick={e => e.stopPropagation()}
      >
        <div className="sp-modal-head">
          <p className="sp-modal-title">Add Staff Member</p>
          <button className="sp-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="sp-modal-body">
          {/* Photo upload */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div className="sp-upload-zone" onClick={() => fileRef.current?.click()}>
              {preview
                ? <img src={preview} alt="" />
                : <Upload size={20} color={C.faint} />}
            </div>
            <div>
              <p style={{ fontSize: "0.85rem", fontWeight: 700, color: C.ink, margin: "0 0 3px" }}>Staff Photo</p>
              <p style={{ fontSize: "0.74rem", color: C.muted, margin: 0 }}>Optional — helps guard identify them</p>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
          </div>

          <div>
            <label className="sp-label">Full Name</label>
            <input required className="sp-input" placeholder="e.g. Sunita Devi" value={form.name} onChange={e => set("name", e.target.value)} />
          </div>

          <div>
            <label className="sp-label">Phone Number</label>
            <input required type="tel" className="sp-input" placeholder="10-digit mobile number" value={form.phone} onChange={e => set("phone", e.target.value)} />
          </div>

          <div>
            <label className="sp-label">Category</label>
            <select className="sp-input" style={{ cursor: "pointer" }} value={form.category} onChange={e => set("category", e.target.value)}>
              {CATEGORY_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>)}
            </select>
          </div>

          <div>
            <label className="sp-label">Working Days</label>
            <DayPicker value={form.allowedDays} onChange={v => set("allowedDays", v)} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label className="sp-label">From</label>
              <input type="time" className="sp-input" value={form.allowedFrom} onChange={e => set("allowedFrom", e.target.value)} />
            </div>
            <div>
              <label className="sp-label">Until</label>
              <input type="time" className="sp-input" value={form.allowedUntil} onChange={e => set("allowedUntil", e.target.value)} />
            </div>
          </div>

          {error && (
            <div style={{ borderRadius: 10, background: C.redL, border: `1px solid ${C.redBr}`, padding: "10px 14px", fontSize: "0.82rem", color: C.red }}>
              {error}
            </div>
          )}

          <button type="submit" className="sp-submit-btn" disabled={saving}>
            {saving ? "Saving…" : "Add Staff Member"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

/* ─── Edit Schedule Modal ───────────────────────────────────────── */
function EditScheduleModal({ staff, onClose, onUpdated }) {
  const { token } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    allowedDays:  staff.myAssignment?.allowedDays  || [],
    allowedFrom:  staff.myAssignment?.allowedFrom  || "08:00",
    allowedUntil: staff.myAssignment?.allowedUntil || "18:00",
  });

  function set(field, value) { setForm(f => ({ ...f, [field]: value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const data = await apiRequest(`/staff/${staff._id}/my-assignment`, {
        method: "PATCH",
        body: { allowedDays: JSON.stringify(form.allowedDays), allowedFrom: form.allowedFrom, allowedUntil: form.allowedUntil },
        token,
      });
      onUpdated(data.item);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="sp-modal-backdrop" onClick={onClose}>
      <motion.div
        className="sp-modal"
        style={{ maxWidth: 380 }}
        initial={{ scale: 0.95, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 8 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        onClick={e => e.stopPropagation()}
      >
        <div className="sp-modal-head">
          <div>
            <p className="sp-modal-title">Edit Schedule</p>
            <p className="sp-modal-sub">{staff.name}</p>
          </div>
          <button className="sp-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="sp-modal-body">
          <div>
            <label className="sp-label">Working Days</label>
            <DayPicker value={form.allowedDays} onChange={v => set("allowedDays", v)} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label className="sp-label">From</label>
              <input type="time" className="sp-input" value={form.allowedFrom} onChange={e => set("allowedFrom", e.target.value)} />
            </div>
            <div>
              <label className="sp-label">Until</label>
              <input type="time" className="sp-input" value={form.allowedUntil} onChange={e => set("allowedUntil", e.target.value)} />
            </div>
          </div>

          {error && (
            <div style={{ borderRadius: 10, background: C.redL, border: `1px solid ${C.redBr}`, padding: "10px 14px", fontSize: "0.82rem", color: C.red }}>
              {error}
            </div>
          )}

          <button type="submit" className="sp-submit-btn" disabled={saving}>
            {saving ? "Saving…" : "Save Schedule"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

/* ─── Staff Card (Resident view) ────────────────────────────────── */
function StaffCard({ staff, onBlock, onRemove, onEditSchedule, blocking, removing, index }) {
  const a          = staff.myAssignment;
  const isBlocked  = a?.blocked;
  const isOnLeave  = a?.onLeave;

  const activeDays = a?.allowedDays?.length
    ? ALL_DAYS.filter(d => a.allowedDays.includes(d.key)).map(d => d.label).join("  ")
    : "—";

  return (
    <motion.div
      className={`sp-card${isBlocked ? " is-blocked" : ""}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1], delay: index * 0.04 }}
      layout
    >
      {/* Top row */}
      <div className="sp-card-top">
        <div className="sp-card-avatar">
          {staff.photoUrl
            ? <img src={staff.photoUrl} alt={staff.name} />
            : getCategoryEmoji(staff.category)}
        </div>

        <div className="sp-card-info">
          <p className="sp-card-name">
            {staff.name}
            {isBlocked  && <span className="sp-badge blocked"><Ban size={9} /> Blocked</span>}
            {isOnLeave && !isBlocked && <span className="sp-badge onleave"><Clock size={9} /> On Leave</span>}
          </p>
          <p className="sp-card-sub">{staff.category} · {staff.phone}</p>
        </div>

        <span className="sp-staff-code">{staff.staffCode}</span>
      </div>

      {/* Schedule strip */}
      {a && (
        <div className="sp-schedule-row">
          <Calendar size={12} color={C.indigo} />
          <span style={{ color: C.ink2 }}>{activeDays}</span>
          <Clock size={12} color={C.indigo} style={{ marginLeft: 6 }} />
          <span style={{ color: C.ink2 }}>{a.allowedFrom} – {a.allowedUntil}</span>
        </div>
      )}

      {/* Actions */}
      <div className="sp-card-actions">
        <button
          className="sp-action-btn indigo"
          onClick={() => onEditSchedule(staff)}
        >
          <Edit2 size={11} /> Edit Schedule
        </button>

        <button
          className={`sp-action-btn ${isBlocked ? "green" : "amber"}`}
          disabled={blocking === staff._id}
          onClick={() => onBlock(staff)}
        >
          <Ban size={11} />
          {blocking === staff._id ? "…" : isBlocked ? "Unblock" : "Block"}
        </button>

        <button
          className="sp-action-btn red"
          style={{ marginLeft: "auto" }}
          disabled={removing === staff._id}
          onClick={() => onRemove(staff)}
        >
          <Trash2 size={11} />
          {removing === staff._id ? "…" : "Remove"}
        </button>
      </div>
    </motion.div>
  );
}

/* ─── Society Staff Card (Committee view) ───────────────────────── */
function SocietyStaffCard({ staff, index }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      className="sp-soc-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1], delay: index * 0.04 }}
      layout
    >
      <button className="sp-soc-trigger" onClick={() => setExpanded(v => !v)}>
        <div className="sp-card-avatar" style={{ width: 44, height: 44, fontSize: 20 }}>
          {staff.photoUrl
            ? <img src={staff.photoUrl} alt={staff.name} />
            : getCategoryEmoji(staff.category)}
        </div>

        <div className="sp-card-info">
          <p className="sp-card-name" style={{ marginBottom: 2 }}>{staff.name}</p>
          <p className="sp-card-sub">{staff.category} · {staff.phone}</p>
        </div>

        <span style={{
          fontSize: "0.72rem", fontWeight: 700,
          background: C.indigoL, color: C.indigo,
          border: `1px solid ${C.indigoBr}`,
          padding: "3px 10px", borderRadius: 999, marginRight: 8,
        }}>
          {staff.assignments?.length || 0} flat{staff.assignments?.length !== 1 ? "s" : ""}
        </span>

        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.22 }}
          style={{ display: "inline-flex", color: C.faint, flexShrink: 0 }}
        >
          <ChevronDown size={16} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {expanded && staff.assignments?.length > 0 && (
          <motion.div
            key="assignments"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: "hidden" }}
          >
            {staff.assignments.map((a, i) => (
              <div key={i} className="sp-soc-row">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, color: C.ink, fontSize: "0.82rem", margin: "0 0 2px" }}>{a.flatNumber}</p>
                  <p style={{ fontSize: "0.72rem", color: C.muted, margin: 0 }}>{a.residentId?.fullName || "Unknown resident"}</p>
                </div>
                <span style={{ fontSize: "0.72rem", color: C.muted, fontWeight: 600, whiteSpace: "nowrap" }}>
                  {ALL_DAYS.filter(d => a.allowedDays?.includes(d.key)).map(d => d.label).join(" ")}
                </span>
                <span style={{ fontSize: "0.72rem", color: C.muted, fontWeight: 600, whiteSpace: "nowrap", marginLeft: 12 }}>
                  {a.allowedFrom}–{a.allowedUntil}
                </span>
                {a.blocked  && <span className="sp-badge blocked" style={{ marginLeft: 8 }}>Blocked</span>}
                {a.onLeave  && <span className="sp-badge onleave" style={{ marginLeft: 8 }}>On Leave</span>}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────── */
export function StaffPage() {
  const { user, token } = useAuth();
  const isCommittee = user?.role === "committee" || user?.role === "super_admin";
  const [tab, setTab] = useState("mine");

  const [myStaff,    setMyStaff]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [allStaff,   setAllStaff]   = useState([]);
  const [allLoading, setAllLoading] = useState(false);
  const [showAdd,    setShowAdd]    = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [blocking,   setBlocking]   = useState(null);
  const [removing,   setRemoving]   = useState(null);

  const fetchMyStaff = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await apiRequest("/staff/mine", { token });
      setMyStaff(data.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchAllStaff = useCallback(async () => {
    setAllLoading(true);
    try {
      const data = await apiRequest("/staff/society", { token });
      setAllStaff(data.items || []);
    } catch (_err) {
    } finally {
      setAllLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchMyStaff(); }, [fetchMyStaff]);
  useEffect(() => { if (tab === "all" && isCommittee) fetchAllStaff(); }, [tab, isCommittee, fetchAllStaff]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    function onLeaveToggled({ staffId, onLeave }) {
      setMyStaff(prev => prev.map(s =>
        s._id === staffId
          ? { ...s, myAssignment: s.myAssignment ? { ...s.myAssignment, onLeave } : s.myAssignment }
          : s
      ));
    }
    socket.on("staff:leave_toggled", onLeaveToggled);
    return () => socket.off("staff:leave_toggled", onLeaveToggled);
  }, []);

  function handleAdded()   { setShowAdd(false);    fetchMyStaff(); }
  function handleUpdated() { setEditTarget(null);  fetchMyStaff(); }

  async function handleBlock(staff) {
    setBlocking(staff._id);
    try {
      await apiRequest(`/staff/${staff._id}/toggle-block`, { method: "PATCH", body: { flatNumber: staff.myAssignment?.flatNumber }, token });
      fetchMyStaff();
    } catch (err) { alert(err.message); }
    finally { setBlocking(null); }
  }

  async function handleRemove(staff) {
    if (!confirm(`Remove ${staff.name} from your flat?`)) return;
    setRemoving(staff._id);
    try {
      await apiRequest(`/staff/${staff._id}/my-assignment`, { method: "DELETE", token });
      setMyStaff(prev => prev.filter(s => s._id !== staff._id));
    } catch (err) { alert(err.message); }
    finally { setRemoving(null); }
  }

  const TABS = [
    { key: "mine", label: "My Staff" },
    ...(isCommittee ? [{ key: "all", label: "All Society Staff" }] : []),
  ];

  return (
    <>
      <style>{CSS}</style>
      <div className="sp-root">
        <div className="sp-shell">

          {/* Header */}
          <div className="sp-controls">
            <div className="sp-page-head" style={{ marginBottom: 0 }}>
              <h1 className="sp-page-title">My Staff</h1>
              <p className="sp-page-sub">Manage household staff members and their access schedules</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button className="sp-btn-ghost" onClick={fetchMyStaff} disabled={loading}>
                <RefreshCw size={13} style={{ animation: loading ? "sp-spin 1s linear infinite" : "none" }} />
                Refresh
              </button>
              <button className="sp-btn-primary" onClick={() => setShowAdd(true)}>
                <Plus size={13} /> Add Staff
              </button>
            </div>
          </div>

          {/* Tabs */}
          {isCommittee && (
            <div className="sp-chips-rail">
              {TABS.map(({ key, label }) => {
                const isActive = tab === key;
                return (
                  <motion.button
                    key={key}
                    className="sp-chip"
                    onClick={() => setTab(key)}
                    animate={{ color: isActive ? C.ink : C.muted }}
                    transition={{ color: { duration: 0.14 } }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sp-active-tab"
                        className="sp-chip-underline"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="sp-chip-inner">{label}</span>
                  </motion.button>
                );
              })}
            </div>
          )}

          {/* My Staff tab */}
          {tab === "mine" && (
            <>
              {error && <div className="sp-error">{error}</div>}

              {loading ? (
                <div style={{ textAlign: "center", padding: "64px 0", color: C.muted, fontSize: "0.88rem" }}>
                  Loading…
                </div>
              ) : myStaff.length === 0 ? (
                <div className="sp-empty">
                  <p style={{ fontSize: "2.5rem", marginBottom: 12 }}>🧹</p>
                  <p style={{ fontWeight: 800, color: C.ink, fontSize: "1rem", margin: "0 0 6px" }}>No staff added yet</p>
                  <p style={{ fontSize: "0.82rem", color: C.muted, margin: "0 0 20px" }}>Add your maid, cook, or driver to manage their access</p>
                  <button className="sp-btn-primary" onClick={() => setShowAdd(true)}>
                    <Plus size={13} /> Add First Staff
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <AnimatePresence mode="popLayout">
                    {myStaff.map((staff, i) => (
                      <StaffCard
                        key={staff._id}
                        staff={staff}
                        index={i}
                        onBlock={handleBlock}
                        onRemove={handleRemove}
                        onEditSchedule={setEditTarget}
                        blocking={blocking}
                        removing={removing}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </>
          )}

          {/* All Society Staff tab */}
          {tab === "all" && isCommittee && (
            <>
              {allLoading ? (
                <div style={{ textAlign: "center", padding: "64px 0", color: C.muted, fontSize: "0.88rem" }}>
                  Loading…
                </div>
              ) : allStaff.length === 0 ? (
                <div style={{ textAlign: "center", padding: "64px 0", color: C.muted, fontSize: "0.88rem" }}>
                  No staff registered in this society yet.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <AnimatePresence mode="popLayout">
                    {allStaff.map((staff, i) => (
                      <SocietyStaffCard key={staff._id} staff={staff} index={i} />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </>
          )}

        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showAdd    && <AddStaffModal    key="add"  onClose={() => setShowAdd(false)}    onAdded={handleAdded}    />}
        {editTarget && <EditScheduleModal key="edit" staff={editTarget} onClose={() => setEditTarget(null)} onUpdated={handleUpdated} />}
      </AnimatePresence>
    </>
  );
}
