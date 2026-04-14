import { useCallback, useEffect, useRef, useState } from "react";
import {
  Calendar, Plus, Trash2, X, QrCode,
  Users, Upload, Clock, PartyPopper
} from "lucide-react";
import { useAuth } from "../components/AuthContext";
import { apiRequest } from "../components/api";
import { getSocket } from "../components/socket";

// ── Design tokens ────────────────────────────────────────────────
const T = {
  surface:   "#111008",
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
  blue:      "#4d8dd4",
};

const PURPOSE_OPTIONS = [
  { value: "guest",      label: "Guest",      emoji: "👤" },
  { value: "delivery",   label: "Delivery",   emoji: "📦" },
  { value: "contractor", label: "Contractor", emoji: "🔧" },
  { value: "other",      label: "Other",      emoji: "📋" },
];

const PASS_STATUS = {
  active:    { label: "Active",    color: T.green  },
  used:      { label: "Used",      color: T.blue   },
  expired:   { label: "Expired",   color: T.textMuted },
  cancelled: { label: "Cancelled", color: T.red    },
};

const GROUP_STATUS = {
  active:    { label: "Active",    color: T.green  },
  exhausted: { label: "Full",      color: T.textMuted },
  expired:   { label: "Expired",   color: T.textMuted },
  cancelled: { label: "Cancelled", color: T.red    },
};

const RELATIONSHIPS = [
  { value: "maid",     label: "Maid"     },
  { value: "cook",     label: "Cook"     },
  { value: "driver",   label: "Driver"   },
  { value: "security", label: "Security" },
  { value: "nanny",    label: "Nanny"    },
  { value: "other",    label: "Other"    },
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
  width: "100%", borderRadius: 12, border: `1px solid ${T.border}`,
  background: "#0f0e0b", padding: "10px 14px",
  color: T.text, fontSize: 14, outline: "none",
  transition: "border-color 0.2s, box-shadow 0.2s", boxSizing: "border-box",
};

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function Label({ children }) {
  return <p style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>{children}</p>;
}

function FocusInput({ style: extraStyle = {}, ...props }) {
  return (
    <input
      style={{ ...inputStyle, ...extraStyle }}
      onFocus={e => { e.target.style.borderColor = T.gold; e.target.style.boxShadow = `0 0 0 3px ${T.gold}22`; }}
      onBlur={e => { e.target.style.borderColor = T.border; e.target.style.boxShadow = "none"; }}
      {...props}
    />
  );
}

function FocusSelect({ children, style: extraStyle = {}, ...props }) {
  return (
    <select
      style={{ ...inputStyle, cursor: "pointer", ...extraStyle }}
      onFocus={e => { e.target.style.borderColor = T.gold; e.target.style.boxShadow = `0 0 0 3px ${T.gold}22`; }}
      onBlur={e => { e.target.style.borderColor = T.border; e.target.style.boxShadow = "none"; }}
      {...props}
    >
      {children}
    </select>
  );
}

function GoldBtn({ children, disabled, type = "button", onClick }) {
  return (
    <button type={type} disabled={disabled} onClick={onClick}
      style={{ display: "inline-flex", alignItems: "center", gap: 8, borderRadius: 12, background: disabled ? `${T.gold}44` : `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`, padding: "10px 20px", fontSize: 13, fontWeight: 700, color: "#0a0907", border: "none", cursor: disabled ? "not-allowed" : "pointer", transition: "all 0.2s" }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}>
      {children}
    </button>
  );
}

function StatusBadge({ status, cfg }) {
  const c = cfg[status] || cfg[Object.keys(cfg)[0]];
  return (
    <span style={{ borderRadius: 100, background: `${c.color}22`, padding: "3px 10px", fontSize: 11, fontWeight: 700, color: c.color, border: `1px solid ${c.color}44`, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
      {c.label}
    </span>
  );
}

function DayPicker({ selected, onChange }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {ALL_DAYS.map(d => {
        const active = selected.includes(d.key);
        return (
          <button key={d.key} type="button" onClick={() => onChange(active ? selected.filter(x => x !== d.key) : [...selected, d.key])}
            style={{ height: 34, width: 38, borderRadius: 10, fontSize: 12, fontWeight: 700, border: `1.5px solid ${active ? T.gold : T.border}`, background: active ? `${T.gold}22` : "transparent", color: active ? T.gold : T.textMuted, cursor: "pointer", transition: "all 0.15s" }}>
            {d.label}
          </button>
        );
      })}
    </div>
  );
}

function PhotoUpload({ preview, onChange }) {
  const ref = useRef(null);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <button type="button" onClick={() => ref.current?.click()}
        style={{ position: "relative", display: "flex", height: 80, width: 80, alignItems: "center", justifyContent: "center", borderRadius: "50%", border: `2px dashed ${T.border}`, background: "#0f0e0b", overflow: "hidden", cursor: "pointer", transition: "border-color 0.2s" }}
        onMouseEnter={e => e.currentTarget.style.borderColor = T.gold}
        onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
        {preview ? <img src={preview} alt="preview" style={{ height: "100%", width: "100%", objectFit: "cover" }} /> : <Upload size={22} color={T.textMuted} />}
      </button>
      <p style={{ fontSize: 11, color: T.textMuted }}>Tap to upload photo</p>
      <input ref={ref} type="file" accept="image/*" style={{ display: "none" }} onChange={e => onChange(e.target.files[0])} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  TAB 1 — ENTRY PASSES
// ══════════════════════════════════════════════════════════════════

function EntryPassCard({ pass, onCancel, cancelling }) {
  const purposeEmoji = PURPOSE_OPTIONS.find(p => p.value === pass.purpose)?.emoji || "👤";
  const isActive = pass.status === "active";
  const [hovered, setHovered] = useState(false);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${pass.otp}&size=160x160&margin=10`;

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ borderRadius: 18, border: `1px solid ${hovered ? T.borderHov : T.border}`, background: T.surface, overflow: "hidden", opacity: isActive ? 1 : 0.65, transition: "border-color 0.25s, box-shadow 0.25s", boxShadow: hovered ? `0 4px 24px rgba(200,145,74,0.1)` : "none" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: `1px solid ${T.border}`, background: isActive ? `${T.green}10` : `${T.gold}08` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>{purposeEmoji}</span>
          <div>
            <p style={{ fontWeight: 700, color: T.text, fontSize: 14 }}>{pass.visitorName}</p>
            {pass.visitorPhone && <p style={{ fontSize: 12, color: T.textMuted }}>{pass.visitorPhone}</p>}
          </div>
        </div>
        <StatusBadge status={pass.status} cfg={PASS_STATUS} />
      </div>

      {/* Body */}
      <div style={{ display: "flex" }}>
        <div style={{ flex: 1, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: T.textSub }}>
            <Calendar size={13} color={T.gold} />
            <span>Valid on <strong style={{ color: T.text }}>{fmtDate(pass.expectedDate)}</strong></span>
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Entry OTP</p>
            <div style={{ display: "flex", gap: 6, opacity: isActive ? 1 : 0.4 }}>
              {pass.otp.split("").map((digit, i) => (
                <div key={i} style={{ display: "flex", height: 40, width: 34, alignItems: "center", justifyContent: "center", borderRadius: 10, background: `${T.gold}22`, border: `1px solid ${T.border}`, color: T.gold, fontSize: 18, fontWeight: 800 }}>
                  {digit}
                </div>
              ))}
            </div>
            {isActive && <p style={{ marginTop: 8, fontSize: 12, color: T.textMuted }}>Share with your visitor — guard enters at gate.</p>}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20, gap: 8, borderLeft: `1px solid ${T.border}` }}>
          {isActive ? (
            <>
              <img src={qrUrl} alt={`QR ${pass.otp}`} style={{ height: 96, width: 96, borderRadius: 12, border: `1px solid ${T.border}` }} loading="lazy" />
              <p style={{ fontSize: 11, color: T.textMuted, display: "flex", alignItems: "center", gap: 4 }}><QrCode size={11} /> Scan to see OTP</p>
            </>
          ) : (
            <div style={{ display: "flex", height: 96, width: 96, alignItems: "center", justifyContent: "center", borderRadius: 12, background: `${T.gold}08`, border: `1px solid ${T.border}`, color: T.textMuted }}>
              <QrCode size={28} />
            </div>
          )}
        </div>
      </div>

      {isActive && (
        <div style={{ borderTop: `1px solid ${T.border}`, padding: "10px 20px", display: "flex", justifyContent: "flex-end" }}>
          <button onClick={() => onCancel(pass._id)} disabled={cancelling === pass._id}
            style={{ display: "flex", alignItems: "center", gap: 6, borderRadius: 8, border: `1px solid ${T.red}44`, padding: "6px 12px", fontSize: 12, fontWeight: 600, color: T.red, background: "transparent", cursor: cancelling === pass._id ? "not-allowed" : "pointer", opacity: cancelling === pass._id ? 0.5 : 1, transition: "background 0.15s" }}
            onMouseEnter={e => { if (cancelling !== pass._id) e.currentTarget.style.background = `${T.red}18`; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
            <Trash2 size={12} />{cancelling === pass._id ? "Cancelling…" : "Cancel Pass"}
          </button>
        </div>
      )}
    </div>
  );
}

function CreatePassForm({ onCreate }) {
  const { token } = useAuth();
  const [form, setForm] = useState({ visitorName: "", visitorPhone: "", purpose: "guest", expectedDate: new Date().toISOString().split("T")[0] });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.visitorName.trim()) { setError("Visitor name is required."); return; }
    setError(""); setSubmitting(true);
    try {
      const data = await apiRequest("/visitor-prereg", { token, method: "POST", body: form });
      onCreate(data.item);
      setForm(prev => ({ ...prev, visitorName: "", visitorPhone: "", purpose: "guest" }));
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  }

  return (
    <div style={{ borderRadius: 18, border: `1px solid ${T.border}`, background: `${T.green}0d`, padding: 24 }}>
      <p style={{ fontWeight: 700, color: T.text, fontSize: 15, marginBottom: 4 }}>Create Entry Pass</p>
      <p style={{ fontSize: 12, color: T.textMuted, marginBottom: 20 }}>Generate a one-time OTP pass for an expected visitor.</p>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {error && <div style={{ borderRadius: 10, background: `${T.red}18`, border: `1px solid ${T.red}44`, padding: "10px 14px", fontSize: 13, color: T.red }}>{error}</div>}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <Label>Visitor Name *</Label>
            <FocusInput placeholder="e.g. Raj Kumar" value={form.visitorName} onChange={e => setForm(p => ({ ...p, visitorName: e.target.value }))} />
          </div>
          <div>
            <Label>Visitor Phone</Label>
            <FocusInput placeholder="e.g. 9876543210" value={form.visitorPhone} onChange={e => setForm(p => ({ ...p, visitorPhone: e.target.value }))} />
          </div>
        </div>
        <div>
          <Label>Purpose</Label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {PURPOSE_OPTIONS.map(p => (
              <button key={p.value} type="button" onClick={() => setForm(prev => ({ ...prev, purpose: p.value }))}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, borderRadius: 12, border: `2px solid ${form.purpose === p.value ? T.gold : T.border}`, padding: "10px 4px", background: form.purpose === p.value ? `${T.gold}18` : "transparent", color: form.purpose === p.value ? T.gold : T.textSub, cursor: "pointer", transition: "all 0.15s", fontSize: 11, fontWeight: 600 }}>
                <span style={{ fontSize: 18 }}>{p.emoji}</span>{p.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label>Expected Visit Date *</Label>
          <FocusInput type="date" value={form.expectedDate} min={new Date().toISOString().split("T")[0]} onChange={e => setForm(p => ({ ...p, expectedDate: e.target.value }))} />
        </div>
        <div><GoldBtn type="submit" disabled={submitting}><Plus size={15} />{submitting ? "Generating…" : "Generate Entry Pass"}</GoldBtn></div>
      </form>
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
    setLoading(true); setError("");
    try { const data = await apiRequest("/visitor-prereg", { token }); setPasses(data.items || []); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
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
      setPasses(prev => prev.map(p => p._id === id ? { ...p, status: "cancelled" } : p));
    } catch (err) { setError(err.message); }
    finally { setCancelling(null); }
  }

  const active = passes.filter(p => p.status === "active");
  const historic = passes.filter(p => p.status !== "active");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <GoldBtn onClick={() => setShowForm(v => !v)}><Plus size={15} /> New Pass</GoldBtn>
      </div>
      {error && <div style={{ borderRadius: 10, background: `${T.red}18`, border: `1px solid ${T.red}44`, padding: "10px 14px", fontSize: 13, color: T.red, display: "flex", alignItems: "center", gap: 8 }}><X size={14} />{error}</div>}
      {showForm && <CreatePassForm onCreate={item => { setPasses(p => [item, ...p]); setShowForm(false); }} />}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1, 2].map(i => <div key={i} style={{ height: 176, borderRadius: 18, background: `${T.gold}08`, animation: "pulse 1.5s infinite" }} />)}
        </div>
      ) : (
        <>
          {active.length === 0 && !showForm && (
            <div style={{ borderRadius: 18, border: `2px dashed ${T.border}`, padding: "56px 24px", textAlign: "center" }}>
              <p style={{ fontSize: 36, marginBottom: 12 }}>🎫</p>
              <p style={{ fontWeight: 700, color: T.text, fontSize: 15 }}>No active passes</p>
              <p style={{ fontSize: 13, color: T.textMuted, marginTop: 4 }}>Click "New Pass" to pre-register a visitor.</p>
            </div>
          )}
          {active.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: "0.1em", textTransform: "uppercase" }}>Active ({active.length})</p>
              {active.map(p => <EntryPassCard key={p._id} pass={p} onCancel={handleCancel} cancelling={cancelling} />)}
            </div>
          )}
          {historic.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: "0.1em", textTransform: "uppercase" }}>History</p>
              {historic.map(p => <EntryPassCard key={p._id} pass={p} onCancel={handleCancel} cancelling={cancelling} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  TAB 2 — FREQUENT VISITORS
// ══════════════════════════════════════════════════════════════════

function AddFreqVisitorForm({ onAdded }) {
  const { token } = useAuth();
  const [form, setForm] = useState({ name: "", phone: "", relationship: "maid", description: "", allowedDays: ["mon","tue","wed","thu","fri"], allowedFrom: "08:00", allowedUntil: "10:00" });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handlePhotoChange(file) {
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Name is required."); return; }
    if (!form.phone.trim()) { setError("Phone number is required."); return; }
    if (form.allowedDays.length === 0) { setError("Select at least one allowed day."); return; }
    setError(""); setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name); fd.append("phone", form.phone);
      fd.append("relationship", form.relationship); fd.append("description", form.description);
      fd.append("allowedDays", JSON.stringify(form.allowedDays));
      fd.append("allowedFrom", form.allowedFrom); fd.append("allowedUntil", form.allowedUntil);
      if (photoFile) fd.append("photo", photoFile);
      const data = await apiRequest("/freq-visitors", { token, method: "POST", formData: fd });
      onAdded(data.item);
      setForm({ name: "", phone: "", relationship: "maid", description: "", allowedDays: ["mon","tue","wed","thu","fri"], allowedFrom: "08:00", allowedUntil: "10:00" });
      setPhotoFile(null); setPhotoPreview("");
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  }

  return (
    <div style={{ borderRadius: 18, border: `1px solid ${T.border}`, background: `${T.blue}0d`, padding: 24 }}>
      <p style={{ fontWeight: 700, color: T.text, fontSize: 15, marginBottom: 4 }}>Add Frequent Visitor</p>
      <p style={{ fontSize: 12, color: T.textMuted, marginBottom: 20 }}>Add someone who visits regularly. Guard finds them by phone — no approval needed during allowed hours.</p>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {error && <div style={{ borderRadius: 10, background: `${T.red}18`, border: `1px solid ${T.red}44`, padding: "10px 14px", fontSize: 13, color: T.red }}>{error}</div>}
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
          <PhotoUpload preview={photoPreview} onChange={handlePhotoChange} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
            <div><Label>Full Name *</Label><FocusInput placeholder="e.g. Sunita Devi" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div><Label>Phone Number *</Label><FocusInput placeholder="e.g. 9876543210" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <Label>Relationship</Label>
            <FocusSelect value={form.relationship} onChange={e => setForm(p => ({ ...p, relationship: e.target.value }))}>
              {RELATIONSHIPS.map(r => <option key={r.value} value={r.value} style={{ background: "#111008" }}>{r.label}</option>)}
            </FocusSelect>
          </div>
          <div><Label>Description (optional)</Label><FocusInput placeholder="e.g. Comes Mon-Sat morning" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
        </div>
        <div><Label>Allowed Days</Label><DayPicker selected={form.allowedDays} onChange={days => setForm(p => ({ ...p, allowedDays: days }))} /></div>
        <div>
          <Label>Allowed Time Window</Label>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <FocusInput type="time" style={{ width: 140 }} value={form.allowedFrom} onChange={e => setForm(p => ({ ...p, allowedFrom: e.target.value }))} />
            <span style={{ fontSize: 13, color: T.textMuted, fontWeight: 600 }}>to</span>
            <FocusInput type="time" style={{ width: 140 }} value={form.allowedUntil} onChange={e => setForm(p => ({ ...p, allowedUntil: e.target.value }))} />
          </div>
          <p style={{ marginTop: 6, fontSize: 12, color: T.textMuted }}>Guard sees a warning if they arrive outside this window.</p>
        </div>
        <div><GoldBtn type="submit" disabled={submitting}><Users size={15} />{submitting ? "Saving…" : "Add to Trusted List"}</GoldBtn></div>
      </form>
    </div>
  );
}

function FreqVisitorCard({ fv, onRemove, removing }) {
  const relLabel = RELATIONSHIPS.find(r => r.value === fv.relationship)?.label || fv.relationship;
  const dayLabels = fv.myLink?.allowedDays?.map(d => ALL_DAYS.find(x => x.key === d)?.label).join(" ") || "Any day";
  const [hovered, setHovered] = useState(false);

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ display: "flex", alignItems: "center", gap: 16, borderRadius: 16, border: `1px solid ${hovered ? T.borderHov : T.border}`, background: T.surface, padding: 16, transition: "border-color 0.25s, box-shadow 0.25s", boxShadow: hovered ? `0 4px 20px rgba(200,145,74,0.08)` : "none" }}>
      <div style={{ flexShrink: 0 }}>
        {fv.photoUrl
          ? <img src={fv.photoUrl} alt={fv.name} style={{ height: 56, width: 56, borderRadius: "50%", objectFit: "cover", border: `2px solid ${T.border}` }} />
          : <div style={{ display: "flex", height: 56, width: 56, alignItems: "center", justifyContent: "center", borderRadius: "50%", background: `${T.blue}22`, border: `1px solid ${T.border}`, color: T.blue, fontSize: 20, fontWeight: 800 }}>{fv.name[0]?.toUpperCase()}</div>
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <p style={{ fontWeight: 700, color: T.text, fontSize: 14 }}>{fv.name}</p>
          <span style={{ borderRadius: 100, background: `${T.blue}22`, padding: "2px 8px", fontSize: 11, fontWeight: 600, color: T.blue, border: `1px solid ${T.blue}44`, flexShrink: 0 }}>{relLabel}</span>
        </div>
        <p style={{ fontSize: 12, color: T.textSub, marginTop: 2 }}>{fv.phone}</p>
        {fv.description && <p style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>{fv.description}</p>}
        <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: T.textSub }}>
          <Clock size={11} color={T.gold} />
          <span>{dayLabels} · {fv.myLink?.allowedFrom}–{fv.myLink?.allowedUntil}</span>
        </div>
      </div>
      <button onClick={() => onRemove(fv._id)} disabled={removing === fv._id}
        style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 6, borderRadius: 8, border: `1px solid ${T.red}44`, padding: "6px 12px", fontSize: 12, fontWeight: 600, color: T.red, background: "transparent", cursor: removing === fv._id ? "not-allowed" : "pointer", opacity: removing === fv._id ? 0.5 : 1, transition: "background 0.15s" }}
        onMouseEnter={e => { if (removing !== fv._id) e.currentTarget.style.background = `${T.red}18`; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
        <Trash2 size={12} />{removing === fv._id ? "…" : "Remove"}
      </button>
    </div>
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
    setLoading(true); setError("");
    try { const data = await apiRequest("/freq-visitors/mine", { token }); setVisitors(data.items || []); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
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
      setVisitors(prev => prev.filter(v => v._id !== id));
    } catch (err) { setError(err.message); }
    finally { setRemoving(null); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {entryToast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 50, display: "flex", alignItems: "center", gap: 10, borderRadius: 18, background: T.blue, padding: "14px 20px", fontSize: 13, fontWeight: 600, color: "#fff", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
          🚶 {entryToast}
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <GoldBtn onClick={() => setShowForm(v => !v)}><Plus size={15} /> Add Frequent Visitor</GoldBtn>
      </div>
      {error && <div style={{ borderRadius: 10, background: `${T.red}18`, border: `1px solid ${T.red}44`, padding: "10px 14px", fontSize: 13, color: T.red }}>{error}</div>}
      {showForm && <AddFreqVisitorForm onAdded={item => { const myLink = item.links?.find(l => l.residentId); setVisitors(prev => [{ ...item, myLink }, ...prev]); setShowForm(false); }} />}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[1,2,3].map(i => <div key={i} style={{ height: 80, borderRadius: 16, background: `${T.gold}08` }} />)}
        </div>
      ) : visitors.length === 0 && !showForm ? (
        <div style={{ borderRadius: 18, border: `2px dashed ${T.border}`, padding: "56px 24px", textAlign: "center" }}>
          <p style={{ fontSize: 36, marginBottom: 12 }}>👥</p>
          <p style={{ fontWeight: 700, color: T.text, fontSize: 15 }}>No frequent visitors yet</p>
          <p style={{ fontSize: 13, color: T.textMuted, marginTop: 4 }}>Add your maid, cook, driver — they'll enter without approval.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {visitors.map(fv => <FreqVisitorCard key={fv._id} fv={fv} onRemove={handleRemove} removing={removing} />)}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  TAB 3 — GROUP PASSES
// ══════════════════════════════════════════════════════════════════

function UsageBar({ used, max }) {
  const pct = Math.min(100, Math.round((used / max) * 100));
  const color = pct >= 100 ? T.red : pct >= 75 ? T.amber : T.gold;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.textSub }}>
        <span>{used} of {max} guests used</span>
        <span>{max - used} spots left</span>
      </div>
      <div style={{ height: 6, width: "100%", borderRadius: 100, background: `${T.gold}18` }}>
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
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ borderRadius: 18, border: `1px solid ${hovered ? T.borderHov : T.border}`, background: T.surface, overflow: "hidden", opacity: isActive ? 1 : 0.65, transition: "border-color 0.25s, box-shadow 0.25s", boxShadow: hovered ? `0 4px 24px rgba(200,145,74,0.1)` : "none" }}>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: `1px solid ${T.border}`, background: isActive ? `${T.gold}0d` : `${T.gold}08` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>🎉</span>
          <div>
            <p style={{ fontWeight: 700, color: T.text, fontSize: 14 }}>{pass.eventName}</p>
            <p style={{ fontSize: 12, color: T.textMuted, display: "flex", alignItems: "center", gap: 4 }}><Calendar size={11} /> {fmtDate(pass.expectedDate)}</p>
          </div>
        </div>
        <StatusBadge status={pass.status} cfg={GROUP_STATUS} />
      </div>

      <div style={{ display: "flex" }}>
        <div style={{ flex: 1, padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          <UsageBar used={pass.usedCount || 0} max={pass.maxUses} />
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Shared Entry OTP</p>
            <div style={{ display: "flex", gap: 6, opacity: isActive ? 1 : 0.4 }}>
              {pass.otp.split("").map((digit, i) => (
                <div key={i} style={{ display: "flex", height: 40, width: 34, alignItems: "center", justifyContent: "center", borderRadius: 10, background: `${T.gold}22`, border: `1px solid ${T.border}`, color: T.gold, fontSize: 18, fontWeight: 800 }}>
                  {digit}
                </div>
              ))}
            </div>
            {isActive && <p style={{ marginTop: 8, fontSize: 12, color: T.textMuted }}>Share this one code with all your guests. Each person uses it once at the gate.</p>}
          </div>
          {pass.entries?.length > 0 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Guests who entered</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {pass.entries.map((e, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: T.textSub }}>
                    <span style={{ color: T.textMuted }}>#{i + 1}</span>
                    <span style={{ fontWeight: 500, color: T.text }}>{e.visitorName}</span>
                    <span style={{ color: T.textMuted }}>{new Date(e.entryTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20, gap: 8, borderLeft: `1px solid ${T.border}` }}>
          {isActive
            ? <><img src={qrUrl} alt={`QR ${pass.otp}`} style={{ height: 96, width: 96, borderRadius: 12, border: `1px solid ${T.border}` }} loading="lazy" /><p style={{ fontSize: 11, color: T.textMuted, display: "flex", alignItems: "center", gap: 4 }}><QrCode size={11} /> Scan</p></>
            : <div style={{ display: "flex", height: 96, width: 96, alignItems: "center", justifyContent: "center", borderRadius: 12, background: `${T.gold}08`, border: `1px solid ${T.border}`, color: T.textMuted }}><QrCode size={28} /></div>
          }
        </div>
      </div>

      {isActive && (
        <div style={{ borderTop: `1px solid ${T.border}`, padding: "10px 20px", display: "flex", justifyContent: "flex-end" }}>
          <button onClick={() => onCancel(pass._id)} disabled={cancelling === pass._id}
            style={{ display: "flex", alignItems: "center", gap: 6, borderRadius: 8, border: `1px solid ${T.red}44`, padding: "6px 12px", fontSize: 12, fontWeight: 600, color: T.red, background: "transparent", cursor: cancelling === pass._id ? "not-allowed" : "pointer", opacity: cancelling === pass._id ? 0.5 : 1, transition: "background 0.15s" }}
            onMouseEnter={e => { if (cancelling !== pass._id) e.currentTarget.style.background = `${T.red}18`; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
            <Trash2 size={12} />{cancelling === pass._id ? "Cancelling…" : "Cancel Pass"}
          </button>
        </div>
      )}
    </div>
  );
}

function CreateGroupPassForm({ onCreate }) {
  const { token } = useAuth();
  const [form, setForm] = useState({ eventName: "", maxUses: 10, expectedDate: new Date().toISOString().split("T")[0] });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.eventName.trim()) { setError("Event name is required."); return; }
    if (form.maxUses < 1) { setError("At least 1 guest required."); return; }
    setError(""); setSubmitting(true);
    try {
      const data = await apiRequest("/group-passes", { token, method: "POST", body: form });
      onCreate(data.item);
      setForm(prev => ({ ...prev, eventName: "", maxUses: 10 }));
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  }

  return (
    <div style={{ borderRadius: 18, border: `1px solid ${T.border}`, background: `${T.gold}0a`, padding: 24 }}>
      <p style={{ fontWeight: 700, color: T.text, fontSize: 15, marginBottom: 4 }}>Create Group Pass</p>
      <p style={{ fontSize: 12, color: T.textMuted, marginBottom: 20 }}>One shared OTP for all your guests. Guard enters it once per person with their name.</p>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {error && <div style={{ borderRadius: 10, background: `${T.red}18`, border: `1px solid ${T.red}44`, padding: "10px 14px", fontSize: 13, color: T.red }}>{error}</div>}
        <div><Label>Event Name *</Label><FocusInput placeholder="e.g. Birthday Party, House Warming…" value={form.eventName} onChange={e => setForm(p => ({ ...p, eventName: e.target.value }))} /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <Label>Max Guests *</Label>
            <FocusInput type="number" min={1} max={100} value={form.maxUses} onChange={e => setForm(p => ({ ...p, maxUses: parseInt(e.target.value, 10) || 1 }))} />
            <p style={{ marginTop: 4, fontSize: 12, color: T.textMuted }}>OTP stops working after this many entries.</p>
          </div>
          <div><Label>Event Date *</Label><FocusInput type="date" value={form.expectedDate} min={new Date().toISOString().split("T")[0]} onChange={e => setForm(p => ({ ...p, expectedDate: e.target.value }))} /></div>
        </div>
        <div><GoldBtn type="submit" disabled={submitting}><PartyPopper size={15} />{submitting ? "Generating…" : "Generate Group Pass"}</GoldBtn></div>
      </form>
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
    setLoading(true); setError("");
    try { const data = await apiRequest("/group-passes", { token }); setPasses(data.items || []); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
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
      setPasses(prev => prev.map(p => p._id === id ? { ...p, status: "cancelled" } : p));
    } catch (err) { setError(err.message); }
    finally { setCancelling(null); }
  }

  const active = passes.filter(p => p.status === "active");
  const historic = passes.filter(p => p.status !== "active");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {guestToast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 50, display: "flex", alignItems: "center", gap: 10, borderRadius: 18, background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`, padding: "14px 20px", fontSize: 13, fontWeight: 700, color: "#0a0907", boxShadow: `0 8px 32px ${T.gold}40` }}>
          🎉 {guestToast}
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <GoldBtn onClick={() => setShowForm(v => !v)}><Plus size={15} /> New Group Pass</GoldBtn>
      </div>
      {error && <div style={{ borderRadius: 10, background: `${T.red}18`, border: `1px solid ${T.red}44`, padding: "10px 14px", fontSize: 13, color: T.red }}>{error}</div>}
      {showForm && <CreateGroupPassForm onCreate={item => { setPasses(p => [item, ...p]); setShowForm(false); }} />}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1, 2].map(i => <div key={i} style={{ height: 208, borderRadius: 18, background: `${T.gold}08` }} />)}
        </div>
      ) : (
        <>
          {active.length === 0 && !showForm && (
            <div style={{ borderRadius: 18, border: `2px dashed ${T.border}`, padding: "56px 24px", textAlign: "center" }}>
              <p style={{ fontSize: 36, marginBottom: 12 }}>🎉</p>
              <p style={{ fontWeight: 700, color: T.text, fontSize: 15 }}>No group passes yet</p>
              <p style={{ fontSize: 13, color: T.textMuted, marginTop: 4 }}>Hosting a party? Create a group pass — one OTP for all guests.</p>
            </div>
          )}
          {active.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: "0.1em", textTransform: "uppercase" }}>Active ({active.length})</p>
              {active.map(p => <GroupPassCard key={p._id} pass={p} onCancel={handleCancel} cancelling={cancelling} />)}
            </div>
          )}
          {historic.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: "0.1em", textTransform: "uppercase" }}>History</p>
              {historic.map(p => <GroupPassCard key={p._id} pass={p} onCancel={handleCancel} cancelling={cancelling} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ══════════════════════════════════════════════════════════════════
export function VisitorPreRegPage() {
  const [activeTab, setActiveTab] = useState("passes");

  const TABS = [
    { key: "passes",   label: "🎫 Entry Passes"      },
    { key: "frequent", label: "👥 Frequent Visitors"  },
    { key: "group",    label: "🎉 Group Passes"       },
  ];

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 16px", fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text, margin: 0 }}>My Visitor Passes</h1>
        <p style={{ fontSize: 13, color: T.textMuted, marginTop: 4 }}>Manage entry passes, trusted visitors, and group event passes.</p>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, borderRadius: 16, background: `${T.gold}10`, padding: 4, border: `1px solid ${T.border}`, marginBottom: 24, flexWrap: "wrap" }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            style={{ padding: "8px 20px", fontSize: 13, fontWeight: 700, borderRadius: 12, border: "none", cursor: "pointer", transition: "all 0.2s", background: activeTab === t.key ? T.gold : "transparent", color: activeTab === t.key ? "#0a0907" : T.textMuted, flex: 1 }}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "passes"   && <PassesTab />}
      {activeTab === "frequent" && <FreqVisitorsTab />}
      {activeTab === "group"    && <GroupPassesTab />}
    </div>
  );
}
