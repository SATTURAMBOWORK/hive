import { useCallback, useEffect, useRef, useState } from "react";
import {
  Plus, Trash2, X, RefreshCw, Upload, Clock,
  Ban, Calendar, Edit2, ChevronDown
} from "lucide-react";
import { useAuth } from "../components/AuthContext";
import { apiRequest } from "../components/api";
import { getSocket } from "../components/socket";

// ── Design tokens ────────────────────────────────────────────────
const T = {
  bg:        "#0a0907",
  surface:   "#111008",
  surfaceHi: "#181510",
  border:    "rgba(200,145,74,0.15)",
  borderHov: "rgba(200,145,74,0.35)",
  gold:      "#c8914a",
  goldLight: "#e8c47a",
  text:      "#f5f0e8",
  textSub:   "rgba(245,240,232,0.55)",
  textMuted: "rgba(245,240,232,0.3)",
  green:     "#3d9e6e",
  red:       "#e85d5d",
  amber:     "#d4a843",
};

const CATEGORY_OPTIONS = [
  { value: "maid",      label: "Maid",      emoji: "🧹" },
  { value: "cook",      label: "Cook",      emoji: "👨‍🍳" },
  { value: "driver",    label: "Driver",    emoji: "🚗" },
  { value: "security",  label: "Security",  emoji: "💂" },
  { value: "nanny",     label: "Nanny",     emoji: "👶" },
  { value: "gardener",  label: "Gardener",  emoji: "🌿" },
  { value: "other",     label: "Other",     emoji: "👤" },
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

const inputStyle = {
  width: "100%", borderRadius: 12,
  border: `1px solid ${T.border}`,
  background: "#0f0e0b",
  padding: "10px 14px",
  color: T.text, fontSize: 14,
  outline: "none", transition: "border-color 0.2s, box-shadow 0.2s",
};

function getCategoryEmoji(cat) {
  return CATEGORY_OPTIONS.find(c => c.value === cat)?.emoji || "👤";
}

// ── Day Picker Pills ─────────────────────────────────────────────
function DayPicker({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {ALL_DAYS.map(d => {
        const active = value.includes(d.key);
        return (
          <button
            key={d.key}
            type="button"
            onClick={() => onChange(active ? value.filter(x => x !== d.key) : [...value, d.key])}
            style={{
              height: 34, width: 38, borderRadius: 10, fontSize: 12, fontWeight: 700,
              border: `1.5px solid ${active ? T.gold : T.border}`,
              background: active ? `${T.gold}22` : "transparent",
              color: active ? T.gold : T.textMuted,
              cursor: "pointer", transition: "all 0.15s",
            }}
          >
            {d.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Label ────────────────────────────────────────────────────────
function Label({ children }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
      {children}
    </p>
  );
}

// ── Gold Button ──────────────────────────────────────────────────
function GoldBtn({ children, disabled, type = "button", onClick, style = {} }) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{
        width: "100%", borderRadius: 12, padding: "12px 0",
        background: disabled ? "rgba(200,145,74,0.3)" : `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`,
        color: "#0a0907", fontSize: 14, fontWeight: 700,
        border: "none", cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.2s", ...style,
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
    >
      {children}
    </button>
  );
}

// ── Add Staff Modal ──────────────────────────────────────────────
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
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 440, borderRadius: 24, background: T.surface, border: `1px solid ${T.border}`, overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${T.border}`, padding: "16px 24px" }}>
          <p style={{ fontWeight: 800, color: T.text, fontSize: 16 }}>Add Staff Member</p>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: T.textMuted, padding: 4, borderRadius: 8 }}
            onMouseEnter={e => e.currentTarget.style.color = T.text}
            onMouseLeave={e => e.currentTarget.style.color = T.textMuted}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, maxHeight: "80vh", overflowY: "auto" }}>

          {/* Photo */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div onClick={() => fileRef.current?.click()}
              style={{ height: 64, width: 64, borderRadius: 16, border: `2px dashed ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", cursor: "pointer", flexShrink: 0, transition: "border-color 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = T.gold}
              onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
              {preview
                ? <img src={preview} alt="" style={{ height: "100%", width: "100%", objectFit: "cover" }} />
                : <Upload size={20} color={T.textMuted} />}
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: T.text }}>Staff Photo</p>
              <p style={{ fontSize: 12, color: T.textMuted }}>Optional — helps guard identify them</p>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
          </div>

          {/* Name */}
          <div>
            <Label>Full Name</Label>
            <input required style={inputStyle} placeholder="e.g. Sunita Devi" value={form.name} onChange={e => set("name", e.target.value)}
              onFocus={e => { e.target.style.borderColor = T.gold; e.target.style.boxShadow = `0 0 0 3px ${T.gold}22`; }}
              onBlur={e => { e.target.style.borderColor = T.border; e.target.style.boxShadow = "none"; }} />
          </div>

          {/* Phone */}
          <div>
            <Label>Phone Number</Label>
            <input required type="tel" style={inputStyle} placeholder="10-digit mobile number" value={form.phone} onChange={e => set("phone", e.target.value)}
              onFocus={e => { e.target.style.borderColor = T.gold; e.target.style.boxShadow = `0 0 0 3px ${T.gold}22`; }}
              onBlur={e => { e.target.style.borderColor = T.border; e.target.style.boxShadow = "none"; }} />
          </div>

          {/* Category */}
          <div>
            <Label>Category</Label>
            <select style={{ ...inputStyle, cursor: "pointer" }} value={form.category} onChange={e => set("category", e.target.value)}
              onFocus={e => { e.target.style.borderColor = T.gold; e.target.style.boxShadow = `0 0 0 3px ${T.gold}22`; }}
              onBlur={e => { e.target.style.borderColor = T.border; e.target.style.boxShadow = "none"; }}>
              {CATEGORY_OPTIONS.map(c => <option key={c.value} value={c.value} style={{ background: T.surface }}>{c.emoji} {c.label}</option>)}
            </select>
          </div>

          {/* Allowed Days */}
          <div>
            <Label>Working Days</Label>
            <DayPicker value={form.allowedDays} onChange={v => set("allowedDays", v)} />
          </div>

          {/* Time */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <Label>From</Label>
              <input type="time" style={inputStyle} value={form.allowedFrom} onChange={e => set("allowedFrom", e.target.value)}
                onFocus={e => { e.target.style.borderColor = T.gold; e.target.style.boxShadow = `0 0 0 3px ${T.gold}22`; }}
                onBlur={e => { e.target.style.borderColor = T.border; e.target.style.boxShadow = "none"; }} />
            </div>
            <div>
              <Label>Until</Label>
              <input type="time" style={inputStyle} value={form.allowedUntil} onChange={e => set("allowedUntil", e.target.value)}
                onFocus={e => { e.target.style.borderColor = T.gold; e.target.style.boxShadow = `0 0 0 3px ${T.gold}22`; }}
                onBlur={e => { e.target.style.borderColor = T.border; e.target.style.boxShadow = "none"; }} />
            </div>
          </div>

          {error && (
            <div style={{ borderRadius: 10, background: `${T.red}18`, border: `1px solid ${T.red}44`, padding: "10px 14px", fontSize: 13, color: T.red }}>
              {error}
            </div>
          )}

          <GoldBtn type="submit" disabled={saving}>{saving ? "Saving…" : "Add Staff Member"}</GoldBtn>
        </form>
      </div>
    </div>
  );
}

// ── Edit Schedule Modal ──────────────────────────────────────────
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
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 380, borderRadius: 24, background: T.surface, border: `1px solid ${T.border}`, overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${T.border}`, padding: "16px 24px" }}>
          <div>
            <p style={{ fontWeight: 800, color: T.text, fontSize: 15 }}>Edit Schedule</p>
            <p style={{ fontSize: 12, color: T.textMuted }}>{staff.name}</p>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: T.textMuted, padding: 4 }}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <Label>Working Days</Label>
            <DayPicker value={form.allowedDays} onChange={v => set("allowedDays", v)} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <Label>From</Label>
              <input type="time" style={inputStyle} value={form.allowedFrom} onChange={e => set("allowedFrom", e.target.value)}
                onFocus={e => { e.target.style.borderColor = T.gold; e.target.style.boxShadow = `0 0 0 3px ${T.gold}22`; }}
                onBlur={e => { e.target.style.borderColor = T.border; e.target.style.boxShadow = "none"; }} />
            </div>
            <div>
              <Label>Until</Label>
              <input type="time" style={inputStyle} value={form.allowedUntil} onChange={e => set("allowedUntil", e.target.value)}
                onFocus={e => { e.target.style.borderColor = T.gold; e.target.style.boxShadow = `0 0 0 3px ${T.gold}22`; }}
                onBlur={e => { e.target.style.borderColor = T.border; e.target.style.boxShadow = "none"; }} />
            </div>
          </div>
          {error && (
            <div style={{ borderRadius: 10, background: `${T.red}18`, border: `1px solid ${T.red}44`, padding: "10px 14px", fontSize: 13, color: T.red }}>{error}</div>
          )}
          <GoldBtn type="submit" disabled={saving}>{saving ? "Saving…" : "Save Schedule"}</GoldBtn>
        </form>
      </div>
    </div>
  );
}

// ── Staff Card (Resident view) ───────────────────────────────────
function StaffCard({ staff, onBlock, onRemove, onEditSchedule, blocking, removing }) {
  const a = staff.myAssignment;
  const isBlocked = a?.blocked;
  const isOnLeave = a?.onLeave;
  const [hovered, setHovered] = useState(false);

  const activeDays = a?.allowedDays?.length
    ? ALL_DAYS.filter(d => a.allowedDays.includes(d.key)).map(d => d.label).join(" ")
    : "—";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 18, border: `1px solid ${hovered ? T.borderHov : T.border}`,
        background: T.surface, overflow: "hidden",
        opacity: isBlocked ? 0.6 : 1,
        transition: "border-color 0.25s, box-shadow 0.25s",
        boxShadow: hovered ? `0 4px 24px rgba(200,145,74,0.1)` : "none",
      }}
    >
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", borderBottom: `1px solid ${T.border}` }}>
        {staff.photoUrl
          ? <img src={staff.photoUrl} alt={staff.name} style={{ height: 48, width: 48, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: `2px solid ${T.border}` }} />
          : <div style={{ display: "flex", height: 48, width: 48, alignItems: "center", justifyContent: "center", borderRadius: "50%", background: `${T.gold}18`, border: `1px solid ${T.border}`, fontSize: 22, flexShrink: 0 }}>
              {getCategoryEmoji(staff.category)}
            </div>
        }
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <p style={{ fontWeight: 700, color: T.text, fontSize: 14 }}>{staff.name}</p>
            {isBlocked && (
              <span style={{ display: "flex", alignItems: "center", gap: 4, borderRadius: 100, background: `${T.red}22`, padding: "2px 8px", fontSize: 11, fontWeight: 700, color: T.red, border: `1px solid ${T.red}44` }}>
                <Ban size={10} /> Blocked
              </span>
            )}
            {isOnLeave && !isBlocked && (
              <span style={{ display: "flex", alignItems: "center", gap: 4, borderRadius: 100, background: `${T.amber}22`, padding: "2px 8px", fontSize: 11, fontWeight: 700, color: T.amber, border: `1px solid ${T.amber}44` }}>
                <Clock size={10} /> On Leave
              </span>
            )}
          </div>
          <p style={{ fontSize: 12, color: T.textSub, textTransform: "capitalize" }}>{staff.category} · {staff.phone}</p>
        </div>
        <div style={{ fontSize: 12, fontFamily: "monospace", background: `${T.gold}15`, color: T.gold, padding: "4px 10px", borderRadius: 8, flexShrink: 0, border: `1px solid ${T.border}` }}>
          {staff.staffCode}
        </div>
      </div>

      {/* Schedule row */}
      {a && (
        <div style={{ padding: "10px 20px", background: `${T.gold}08`, display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: T.textSub, borderBottom: `1px solid ${T.border}` }}>
          <Calendar size={13} color={T.gold} />
          <span style={{ fontWeight: 600 }}>{activeDays}</span>
          <Clock size={13} color={T.gold} style={{ marginLeft: 6 }} />
          <span>{a.allowedFrom} – {a.allowedUntil}</span>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 20px" }}>
        {[
          { label: "Edit Schedule", icon: <Edit2 size={12} />, onClick: () => onEditSchedule(staff), color: T.gold },
          {
            label: blocking === staff._id ? "…" : isBlocked ? "Unblock" : "Block",
            icon: <Ban size={12} />,
            onClick: () => onBlock(staff),
            disabled: blocking === staff._id,
            color: isBlocked ? T.green : T.amber,
          },
        ].map((btn, i) => (
          <button key={i} onClick={btn.onClick} disabled={btn.disabled}
            style={{ display: "flex", alignItems: "center", gap: 6, borderRadius: 8, border: `1px solid ${btn.color}44`, padding: "6px 12px", fontSize: 12, fontWeight: 600, color: btn.color, background: "transparent", cursor: btn.disabled ? "not-allowed" : "pointer", opacity: btn.disabled ? 0.5 : 1, transition: "background 0.15s" }}
            onMouseEnter={e => { if (!btn.disabled) e.currentTarget.style.background = `${btn.color}18`; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
            {btn.icon}{btn.label}
          </button>
        ))}
        <button onClick={() => onRemove(staff)} disabled={removing === staff._id}
          style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, borderRadius: 8, border: `1px solid ${T.red}44`, padding: "6px 12px", fontSize: 12, fontWeight: 600, color: T.red, background: "transparent", cursor: removing === staff._id ? "not-allowed" : "pointer", opacity: removing === staff._id ? 0.5 : 1, transition: "background 0.15s" }}
          onMouseEnter={e => { if (removing !== staff._id) e.currentTarget.style.background = `${T.red}18`; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
          <Trash2 size={12} />{removing === staff._id ? "…" : "Remove"}
        </button>
      </div>
    </div>
  );
}

// ── Society-wide Staff Card (Committee view) ─────────────────────
function SocietyStaffCard({ staff }) {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ borderRadius: 18, border: `1px solid ${hovered ? T.borderHov : T.border}`, background: T.surface, overflow: "hidden", transition: "border-color 0.25s, box-shadow 0.25s", boxShadow: hovered ? `0 4px 24px rgba(200,145,74,0.1)` : "none" }}
    >
      <button onClick={() => setExpanded(v => !v)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>
        {staff.photoUrl
          ? <img src={staff.photoUrl} alt={staff.name} style={{ height: 44, width: 44, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: `2px solid ${T.border}` }} />
          : <div style={{ display: "flex", height: 44, width: 44, alignItems: "center", justifyContent: "center", borderRadius: "50%", background: `${T.gold}18`, border: `1px solid ${T.border}`, fontSize: 20, flexShrink: 0 }}>
              {getCategoryEmoji(staff.category)}
            </div>
        }
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 700, color: T.text, fontSize: 14 }}>{staff.name}</p>
          <p style={{ fontSize: 12, color: T.textSub, textTransform: "capitalize" }}>{staff.category} · {staff.phone}</p>
        </div>
        <span style={{ fontSize: 12, background: `${T.gold}15`, color: T.gold, padding: "4px 10px", borderRadius: 100, fontWeight: 600, marginRight: 8, border: `1px solid ${T.border}` }}>
          {staff.assignments?.length || 0} flat{staff.assignments?.length !== 1 ? "s" : ""}
        </span>
        <ChevronDown size={16} color={T.textMuted} style={{ transition: "transform 0.2s", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }} />
      </button>
      {expanded && staff.assignments?.length > 0 && (
        <div style={{ borderTop: `1px solid ${T.border}` }}>
          {staff.assignments.map((a, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 20px", borderBottom: i < staff.assignments.length - 1 ? `1px solid ${T.border}` : "none", fontSize: 13 }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, color: T.text }}>{a.flatNumber}</p>
                <p style={{ fontSize: 12, color: T.textMuted }}>{a.residentId?.fullName || "Unknown resident"}</p>
              </div>
              <div style={{ fontSize: 12, color: T.textSub }}>{ALL_DAYS.filter(d => a.allowedDays?.includes(d.key)).map(d => d.label).join(" ")}</div>
              <div style={{ fontSize: 12, color: T.textSub }}>{a.allowedFrom}–{a.allowedUntil}</div>
              {a.blocked && <span style={{ borderRadius: 100, background: `${T.red}22`, padding: "2px 8px", fontSize: 11, fontWeight: 700, color: T.red }}>Blocked</span>}
              {a.onLeave && <span style={{ borderRadius: 100, background: `${T.amber}22`, padding: "2px 8px", fontSize: 11, fontWeight: 700, color: T.amber }}>On Leave</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────
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
    } catch (err) {
      console.error(err);
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
      setMyStaff(prev => prev.map(s => s._id === staffId ? { ...s, myAssignment: s.myAssignment ? { ...s.myAssignment, onLeave } : s.myAssignment } : s));
    }
    socket.on("staff:leave_toggled", onLeaveToggled);
    return () => socket.off("staff:leave_toggled", onLeaveToggled);
  }, []);

  function handleAdded()  { setShowAdd(false); fetchMyStaff(); }
  function handleUpdated() { setEditTarget(null); fetchMyStaff(); }

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

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 16px", fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text, margin: 0 }}>Staff Management</h1>
          <p style={{ fontSize: 13, color: T.textMuted, marginTop: 4 }}>Manage your household staff members</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={fetchMyStaff}
            style={{ borderRadius: 12, border: `1px solid ${T.border}`, padding: "10px", background: "transparent", cursor: "pointer", color: T.textSub, transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.gold; e.currentTarget.style.color = T.gold; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textSub; }}>
            <RefreshCw size={16} />
          </button>
          <button onClick={() => setShowAdd(true)}
            style={{ display: "flex", alignItems: "center", gap: 8, borderRadius: 12, background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`, padding: "10px 18px", fontSize: 13, fontWeight: 700, color: "#0a0907", border: "none", cursor: "pointer", transition: "all 0.2s", boxShadow: `0 4px 16px ${T.gold}40` }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
            <Plus size={16} /> Add Staff
          </button>
        </div>
      </div>

      {/* Tabs */}
      {isCommittee && (
        <div style={{ display: "flex", gap: 4, borderRadius: 16, background: `${T.gold}10`, padding: 4, width: "fit-content", marginBottom: 20, border: `1px solid ${T.border}` }}>
          {[["mine", "My Staff"], ["all", "All Society Staff"]].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              style={{ padding: "8px 20px", fontSize: 13, fontWeight: 700, borderRadius: 12, border: "none", cursor: "pointer", transition: "all 0.2s", background: tab === key ? T.gold : "transparent", color: tab === key ? "#0a0907" : T.textMuted }}>
              {label}
            </button>
          ))}
        </div>
      )}

      {/* My Staff tab */}
      {tab === "mine" && (
        <>
          {loading ? (
            <div style={{ textAlign: "center", padding: "64px 0", color: T.textMuted, fontSize: 14 }}>Loading…</div>
          ) : error ? (
            <div style={{ borderRadius: 14, background: `${T.red}18`, border: `1px solid ${T.red}44`, padding: "14px 18px", fontSize: 13, color: T.red }}>{error}</div>
          ) : myStaff.length === 0 ? (
            <div style={{ borderRadius: 18, border: `2px dashed ${T.border}`, padding: "64px 24px", textAlign: "center" }}>
              <p style={{ fontSize: 36, marginBottom: 12 }}>🧹</p>
              <p style={{ fontWeight: 700, color: T.text, fontSize: 15 }}>No staff added yet</p>
              <p style={{ fontSize: 13, color: T.textMuted, marginTop: 4 }}>Add your maid, cook, or driver to manage their access</p>
              <button onClick={() => setShowAdd(true)}
                style={{ marginTop: 16, display: "inline-flex", alignItems: "center", gap: 8, borderRadius: 12, background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`, padding: "10px 20px", fontSize: 13, fontWeight: 700, color: "#0a0907", border: "none", cursor: "pointer" }}>
                <Plus size={16} /> Add First Staff
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {myStaff.map(staff => (
                <StaffCard key={staff._id} staff={staff} onBlock={handleBlock} onRemove={handleRemove} onEditSchedule={setEditTarget} blocking={blocking} removing={removing} />
              ))}
            </div>
          )}
        </>
      )}

      {/* All Society Staff tab */}
      {tab === "all" && isCommittee && (
        <>
          {allLoading ? (
            <div style={{ textAlign: "center", padding: "64px 0", color: T.textMuted, fontSize: 14 }}>Loading…</div>
          ) : allStaff.length === 0 ? (
            <div style={{ textAlign: "center", padding: "64px 0", color: T.textMuted, fontSize: 14 }}>No staff registered in this society yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {allStaff.map(staff => <SocietyStaffCard key={staff._id} staff={staff} />)}
            </div>
          )}
        </>
      )}

      {showAdd    && <AddStaffModal    onClose={() => setShowAdd(false)}    onAdded={handleAdded}    />}
      {editTarget && <EditScheduleModal staff={editTarget} onClose={() => setEditTarget(null)} onUpdated={handleUpdated} />}
    </div>
  );
}
