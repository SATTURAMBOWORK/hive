import { useCallback, useEffect, useRef, useState } from "react";
import {
  Calendar, Plus, Trash2, X, RefreshCw, QrCode,
  Users, Upload, Clock, CheckCircle2, AlertTriangle, PartyPopper
} from "lucide-react";
import { useAuth } from "../components/AuthContext";
import { apiRequest } from "../components/api";
import { getSocket } from "../components/socket";

// ── Constants ────────────────────────────────────────────────────

const PURPOSE_OPTIONS = [
  { value: "guest",      label: "Guest",      emoji: "👤" },
  { value: "delivery",   label: "Delivery",   emoji: "📦" },
  { value: "contractor", label: "Contractor", emoji: "🔧" },
  { value: "other",      label: "Other",      emoji: "📋" },
];

const PASS_STATUS_STYLE = {
  active:    { label: "Active",    cls: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200" },
  used:      { label: "Used",      cls: "bg-sky-100    text-sky-700    ring-1 ring-sky-200"      },
  expired:   { label: "Expired",   cls: "bg-slate-100  text-slate-500  ring-1 ring-slate-200"    },
  cancelled: { label: "Cancelled", cls: "bg-rose-100   text-rose-600   ring-1 ring-rose-200"     },
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

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 " +
  "placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none " +
  "focus:ring-1 focus:ring-emerald-500 text-sm transition-colors";

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

// ── Tab Button ───────────────────────────────────────────────────
function Tab({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-all ${
        active
          ? "bg-white text-emerald-700 shadow-sm"
          : "text-slate-500 hover:text-slate-700"
      }`}
    >
      {children}
    </button>
  );
}

// ══════════════════════════════════════════════════════════════════
//  TAB 1 — ENTRY PASSES (pre-registration)
// ══════════════════════════════════════════════════════════════════

function EntryPassCard({ pass, onCancel, cancelling }) {
  const purposeEmoji = PURPOSE_OPTIONS.find(p => p.value === pass.purpose)?.emoji || "👤";
  const statusStyle  = PASS_STATUS_STYLE[pass.status] || PASS_STATUS_STYLE.active;
  const isActive     = pass.status === "active";
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${pass.otp}&size=160x160&margin=10`;

  return (
    <div className={`rounded-2xl border bg-white overflow-hidden shadow-sm
      ${isActive ? "border-emerald-200" : "border-slate-200 opacity-70"}`}>
      <div className={`flex items-center justify-between px-5 py-3.5
        ${isActive ? "bg-emerald-50" : "bg-slate-50"}`}>
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{purposeEmoji}</span>
          <div>
            <p className="font-bold text-slate-900 text-sm">{pass.visitorName}</p>
            {pass.visitorPhone && <p className="text-xs text-slate-500">{pass.visitorPhone}</p>}
          </div>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${statusStyle.cls}`}>
          {statusStyle.label}
        </span>
      </div>

      <div className="flex items-stretch divide-x divide-slate-100">
        <div className="flex-1 p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Calendar size={13} />
            <span>Valid on <strong className="text-slate-700">{fmtDate(pass.expectedDate)}</strong></span>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Entry OTP</p>
            <div className={`flex gap-1.5 ${!isActive ? "opacity-50" : ""}`}>
              {pass.otp.split("").map((digit, i) => (
                <div key={i}
                  className="flex h-10 w-9 items-center justify-center rounded-xl bg-slate-900 text-white text-lg font-black shadow-sm">
                  {digit}
                </div>
              ))}
            </div>
            {isActive && (
              <p className="mt-2 text-xs text-slate-400">Share with your visitor — guard enters at gate.</p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-center justify-center p-5 gap-2">
          {isActive ? (
            <>
              <img src={qrUrl} alt={`QR ${pass.otp}`} className="h-24 w-24 rounded-xl" loading="lazy" />
              <p className="text-xs text-slate-400 flex items-center gap-1"><QrCode size={11} /> Scan to see OTP</p>
            </>
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
              <QrCode size={28} />
            </div>
          )}
        </div>
      </div>

      {isActive && (
        <div className="border-t border-slate-100 px-5 py-3 flex justify-end">
          <button onClick={() => onCancel(pass._id)} disabled={cancelling === pass._id}
            className="flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5
              text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50">
            <Trash2 size={12} />
            {cancelling === pass._id ? "Cancelling…" : "Cancel Pass"}
          </button>
        </div>
      )}
    </div>
  );
}

function CreatePassForm({ onCreate }) {
  const { token } = useAuth();
  const [form, setForm] = useState({
    visitorName: "", visitorPhone: "", purpose: "guest",
    expectedDate: new Date().toISOString().split("T")[0]
  });
  const [error, setError]           = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.visitorName.trim()) { setError("Visitor name is required."); return; }
    setError(""); setSubmitting(true);
    try {
      const data = await apiRequest("/visitor-prereg", { token, method: "POST", body: form });
      onCreate(data.item);
      setForm(prev => ({ ...prev, visitorName: "", visitorPhone: "", purpose: "guest" }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6">
      <h2 className="mb-1 text-base font-bold text-slate-900">Create Entry Pass</h2>
      <p className="mb-5 text-xs text-slate-500">
        Generate a one-time OTP pass for an expected visitor. No gate approval needed — they walk right in.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-rose-50 px-4 py-2.5 text-sm text-rose-700 ring-1 ring-rose-200">{error}</div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Visitor Name <span className="text-rose-500">*</span></label>
            <input className={inputCls} placeholder="e.g. Raj Kumar"
              value={form.visitorName} onChange={e => setForm(p => ({ ...p, visitorName: e.target.value }))} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Visitor Phone</label>
            <input className={inputCls} placeholder="e.g. 9876543210"
              value={form.visitorPhone} onChange={e => setForm(p => ({ ...p, visitorPhone: e.target.value }))} />
          </div>
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold text-slate-600">Purpose</label>
          <div className="grid grid-cols-4 gap-2">
            {PURPOSE_OPTIONS.map(p => (
              <button key={p.value} type="button"
                onClick={() => setForm(prev => ({ ...prev, purpose: p.value }))}
                className={`flex flex-col items-center gap-1 rounded-xl border-2 py-2.5 transition
                  ${form.purpose === p.value
                    ? "border-emerald-500 bg-white text-emerald-700"
                    : "border-slate-200 bg-white text-slate-500 hover:border-emerald-300"}`}>
                <span className="text-lg">{p.emoji}</span>
                <span className="text-xs font-semibold">{p.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">
            Expected Visit Date <span className="text-rose-500">*</span>
          </label>
          <input type="date" className={inputCls}
            value={form.expectedDate} min={new Date().toISOString().split("T")[0]}
            onChange={e => setForm(p => ({ ...p, expectedDate: e.target.value }))} />
        </div>
        <button type="submit" disabled={submitting}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5
            text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60">
          <Plus size={15} />
          {submitting ? "Generating…" : "Generate Entry Pass"}
        </button>
      </form>
    </div>
  );
}

function PassesTab() {
  const { token } = useAuth();
  const [passes,     setPasses]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [cancelling, setCancelling] = useState(null);
  const [showForm,   setShowForm]   = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true); setError("");
    try {
      const data = await apiRequest("/visitor-prereg", { token });
      setPasses(data.items || []);
    } catch (err) { setError(err.message); }
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

  const active   = passes.filter(p => p.status === "active");
  const historic = passes.filter(p => p.status !== "active");

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2
            text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700">
          <Plus size={15} /> New Pass
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
          <X size={16} /> {error}
        </div>
      )}

      {showForm && <CreatePassForm onCreate={item => { setPasses(p => [item, ...p]); setShowForm(false); }} />}

      {loading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => <div key={i} className="h-44 animate-pulse rounded-2xl bg-slate-100" />)}
        </div>
      ) : (
        <>
          {active.length === 0 && !showForm && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-14 text-center">
              <span className="mb-3 text-4xl">🎫</span>
              <p className="font-semibold text-slate-700">No active passes</p>
              <p className="mt-1 text-sm text-slate-400">Click "New Pass" to pre-register a visitor.</p>
            </div>
          )}
          {active.length > 0 && (
            <div className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Active ({active.length})</p>
              {active.map(p => <EntryPassCard key={p._id} pass={p} onCancel={handleCancel} cancelling={cancelling} />)}
            </div>
          )}
          {historic.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">History</p>
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

// Day selector — clickable pills for Mon, Tue … Sun
function DayPicker({ selected, onChange }) {
  function toggle(day) {
    onChange(
      selected.includes(day)
        ? selected.filter(d => d !== day)
        : [...selected, day]
    );
  }
  return (
    <div className="flex gap-1.5 flex-wrap">
      {ALL_DAYS.map(d => (
        <button key={d.key} type="button" onClick={() => toggle(d.key)}
          className={`h-9 w-9 rounded-xl text-xs font-bold transition border-2
            ${selected.includes(d.key)
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-slate-200 bg-white text-slate-500 hover:border-emerald-300"}`}>
          {d.label}
        </button>
      ))}
    </div>
  );
}

// Circular photo upload area — shows preview or placeholder
function PhotoUpload({ preview, onChange }) {
  const ref = useRef(null);
  return (
    <div className="flex flex-col items-center gap-2">
      <button type="button" onClick={() => ref.current?.click()}
        className="relative flex h-24 w-24 items-center justify-center rounded-full
          border-2 border-dashed border-slate-300 bg-slate-50 overflow-hidden
          hover:border-emerald-400 transition">
        {preview
          ? <img src={preview} alt="preview" className="h-full w-full object-cover" />
          : <Upload size={22} className="text-slate-400" />
        }
      </button>
      <p className="text-xs text-slate-400">Tap to upload photo</p>
      <input ref={ref} type="file" accept="image/*" className="hidden"
        onChange={e => onChange(e.target.files[0])} />
    </div>
  );
}

// Add Frequent Visitor form
function AddFreqVisitorForm({ onAdded }) {
  const { token } = useAuth();
  const [form, setForm] = useState({
    name: "", phone: "", relationship: "maid", description: "",
    allowedDays: ["mon", "tue", "wed", "thu", "fri"],
    allowedFrom: "08:00", allowedUntil: "10:00"
  });
  const [photoFile,    setPhotoFile]    = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [error,        setError]        = useState("");
  const [submitting,   setSubmitting]   = useState(false);

  function handlePhotoChange(file) {
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim())  { setError("Name is required.");           return; }
    if (!form.phone.trim()) { setError("Phone number is required.");   return; }
    if (form.allowedDays.length === 0) { setError("Select at least one allowed day."); return; }

    setError(""); setSubmitting(true);
    try {
      // Build FormData because we may have a photo file
      const fd = new FormData();
      fd.append("name",         form.name);
      fd.append("phone",        form.phone);
      fd.append("relationship", form.relationship);
      fd.append("description",  form.description);
      fd.append("allowedDays",  JSON.stringify(form.allowedDays));
      fd.append("allowedFrom",  form.allowedFrom);
      fd.append("allowedUntil", form.allowedUntil);
      if (photoFile) fd.append("photo", photoFile);

      const data = await apiRequest("/freq-visitors", { token, method: "POST", formData: fd });
      onAdded(data.item);
      setForm({ name: "", phone: "", relationship: "maid", description: "",
        allowedDays: ["mon","tue","wed","thu","fri"], allowedFrom: "08:00", allowedUntil: "10:00" });
      setPhotoFile(null); setPhotoPreview("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
      <h2 className="mb-1 text-base font-bold text-slate-900">Add Frequent Visitor</h2>
      <p className="mb-5 text-xs text-slate-500">
        Add someone who visits regularly. Guard will find them by phone — no approval needed during allowed hours.
      </p>
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-lg bg-rose-50 px-4 py-2.5 text-sm text-rose-700 ring-1 ring-rose-200">{error}</div>
        )}

        {/* Photo + Name/Phone row */}
        <div className="flex gap-5 items-start">
          <PhotoUpload preview={photoPreview} onChange={handlePhotoChange} />
          <div className="flex-1 space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Full Name <span className="text-rose-500">*</span></label>
              <input className={inputCls} placeholder="e.g. Sunita Devi"
                value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Phone Number <span className="text-rose-500">*</span></label>
              <input className={inputCls} placeholder="e.g. 9876543210"
                value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            </div>
          </div>
        </div>

        {/* Relationship + Description */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Relationship</label>
            <select className={inputCls}
              value={form.relationship} onChange={e => setForm(p => ({ ...p, relationship: e.target.value }))}>
              {RELATIONSHIPS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Description <span className="text-slate-400 font-normal">(optional)</span></label>
            <input className={inputCls} placeholder="e.g. Comes Mon-Sat morning"
              value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>
        </div>

        {/* Allowed days */}
        <div>
          <label className="mb-2 block text-xs font-semibold text-slate-600">Allowed Days</label>
          <DayPicker selected={form.allowedDays}
            onChange={days => setForm(p => ({ ...p, allowedDays: days }))} />
        </div>

        {/* Allowed time window */}
        <div>
          <label className="mb-2 block text-xs font-semibold text-slate-600">Allowed Time Window</label>
          <div className="flex items-center gap-3">
            <input type="time" className={`${inputCls} w-36`}
              value={form.allowedFrom} onChange={e => setForm(p => ({ ...p, allowedFrom: e.target.value }))} />
            <span className="text-sm text-slate-400 font-semibold">to</span>
            <input type="time" className={`${inputCls} w-36`}
              value={form.allowedUntil} onChange={e => setForm(p => ({ ...p, allowedUntil: e.target.value }))} />
          </div>
          <p className="mt-1 text-xs text-slate-400">Guard sees a warning if they arrive outside this window.</p>
        </div>

        <button type="submit" disabled={submitting}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5
            text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60">
          <Users size={15} />
          {submitting ? "Saving…" : "Add to Trusted List"}
        </button>
      </form>
    </div>
  );
}

// Frequent Visitor card shown in the resident's list
function FreqVisitorCard({ fv, onRemove, removing }) {
  const relLabel = RELATIONSHIPS.find(r => r.value === fv.relationship)?.label || fv.relationship;
  const dayLabels = fv.myLink?.allowedDays?.map(d => ALL_DAYS.find(x => x.key === d)?.label).join(" ") || "Any day";

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4">
      {/* Photo */}
      <div className="relative flex-shrink-0">
        {fv.photoUrl ? (
          <img src={fv.photoUrl} alt={fv.name}
            className="h-14 w-14 rounded-full object-cover ring-2 ring-slate-100" />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xl font-black">
            {fv.name[0]?.toUpperCase()}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-bold text-slate-900 text-sm truncate">{fv.name}</p>
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 flex-shrink-0">
            {relLabel}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">{fv.phone}</p>
        {fv.description && <p className="text-xs text-slate-400 mt-0.5 truncate">{fv.description}</p>}
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
          <Clock size={11} />
          <span>{dayLabels} · {fv.myLink?.allowedFrom}–{fv.myLink?.allowedUntil}</span>
        </div>
      </div>

      {/* Remove */}
      <button onClick={() => onRemove(fv._id)} disabled={removing === fv._id}
        className="flex-shrink-0 flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5
          text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50">
        <Trash2 size={12} />
        {removing === fv._id ? "…" : "Remove"}
      </button>
    </div>
  );
}

function FreqVisitorsTab() {
  const { token } = useAuth();
  const [visitors,  setVisitors]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [removing,  setRemoving]  = useState(null);
  const [showForm,  setShowForm]  = useState(false);
  const [entryToast, setEntryToast] = useState(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true); setError("");
    try {
      const data = await apiRequest("/freq-visitors/mine", { token });
      setVisitors(data.items || []);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  // Real-time: guard logged a freq visitor entry → show toast
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
    <div className="space-y-4">
      {entryToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl
          bg-blue-700 px-5 py-3.5 text-sm font-semibold text-white shadow-xl">
          🚶 {entryToast}
        </div>
      )}

      <div className="flex justify-end">
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2
            text-sm font-bold text-white shadow-sm transition hover:bg-blue-700">
          <Plus size={15} /> Add Frequent Visitor
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
          <X size={16} /> {error}
        </div>
      )}

      {showForm && (
        <AddFreqVisitorForm onAdded={item => {
          // Build the "sanitized" shape the list expects (myLink extracted)
          const myLink = item.links?.find(l => l.residentId);
          setVisitors(prev => [{ ...item, myLink }, ...prev]);
          setShowForm(false);
        }} />
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />)}
        </div>
      ) : visitors.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-14 text-center">
          <span className="mb-3 text-4xl">👥</span>
          <p className="font-semibold text-slate-700">No frequent visitors yet</p>
          <p className="mt-1 text-sm text-slate-400">Add your maid, cook, driver — they'll enter without approval.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visitors.map(fv => (
            <FreqVisitorCard key={fv._id} fv={fv} onRemove={handleRemove} removing={removing} />
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  TAB 3 — GROUP PASSES
// ══════════════════════════════════════════════════════════════════

const GROUP_STATUS_STYLE = {
  active:    { label: "Active",    cls: "bg-purple-100 text-purple-700 ring-1 ring-purple-200" },
  exhausted: { label: "Full",      cls: "bg-slate-100  text-slate-500  ring-1 ring-slate-200"  },
  expired:   { label: "Expired",   cls: "bg-slate-100  text-slate-500  ring-1 ring-slate-200"  },
  cancelled: { label: "Cancelled", cls: "bg-rose-100   text-rose-600   ring-1 ring-rose-200"   },
};

// Progress bar showing how many guest slots have been used
function UsageBar({ used, max }) {
  const pct = Math.min(100, Math.round((used / max) * 100));
  const color = pct >= 100 ? "bg-rose-500" : pct >= 75 ? "bg-amber-400" : "bg-purple-500";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-500">
        <span>{used} of {max} guests used</span>
        <span>{max - used} spots left</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-100">
        <div className={`h-1.5 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function GroupPassCard({ pass, onCancel, cancelling }) {
  const statusStyle = GROUP_STATUS_STYLE[pass.status] || GROUP_STATUS_STYLE.active;
  const isActive    = pass.status === "active";
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${pass.otp}&size=160x160&margin=10`;

  return (
    <div className={`rounded-2xl border bg-white overflow-hidden shadow-sm
      ${isActive ? "border-purple-200" : "border-slate-200 opacity-70"}`}>

      {/* Header */}
      <div className={`flex items-center justify-between px-5 py-3.5
        ${isActive ? "bg-purple-50" : "bg-slate-50"}`}>
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🎉</span>
          <div>
            <p className="font-bold text-slate-900 text-sm">{pass.eventName}</p>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <Calendar size={11} /> {fmtDate(pass.expectedDate)}
            </p>
          </div>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${statusStyle.cls}`}>
          {statusStyle.label}
        </span>
      </div>

      {/* Body — OTP + QR */}
      <div className="flex items-stretch divide-x divide-slate-100">
        <div className="flex-1 p-5 space-y-3">
          {/* Usage progress */}
          <UsageBar used={pass.usedCount || 0} max={pass.maxUses} />

          {/* OTP */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Shared Entry OTP
            </p>
            <div className={`flex gap-1.5 ${!isActive ? "opacity-40" : ""}`}>
              {pass.otp.split("").map((digit, i) => (
                <div key={i}
                  className="flex h-10 w-9 items-center justify-center rounded-xl bg-slate-900 text-white text-lg font-black shadow-sm">
                  {digit}
                </div>
              ))}
            </div>
            {isActive && (
              <p className="mt-2 text-xs text-slate-400">
                Share this one code with all your guests. Each person uses it once at the gate.
              </p>
            )}
          </div>

          {/* Entries log — who actually came */}
          {pass.entries?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Guests who entered
              </p>
              <div className="space-y-1">
                {pass.entries.map((e, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="text-slate-400">#{i + 1}</span>
                    <span className="font-medium">{e.visitorName}</span>
                    <span className="text-slate-400">
                      {new Date(e.entryTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* QR code */}
        <div className="flex flex-col items-center justify-center p-5 gap-2">
          {isActive ? (
            <>
              <img src={qrUrl} alt={`QR ${pass.otp}`} className="h-24 w-24 rounded-xl" loading="lazy" />
              <p className="text-xs text-slate-400 flex items-center gap-1"><QrCode size={11} /> Scan to see OTP</p>
            </>
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
              <QrCode size={28} />
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      {isActive && (
        <div className="border-t border-slate-100 px-5 py-3 flex justify-end">
          <button onClick={() => onCancel(pass._id)} disabled={cancelling === pass._id}
            className="flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5
              text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50">
            <Trash2 size={12} />
            {cancelling === pass._id ? "Cancelling…" : "Cancel Pass"}
          </button>
        </div>
      )}
    </div>
  );
}

function CreateGroupPassForm({ onCreate }) {
  const { token } = useAuth();
  const [form, setForm] = useState({
    eventName: "", maxUses: 10,
    expectedDate: new Date().toISOString().split("T")[0]
  });
  const [error, setError]           = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.eventName.trim()) { setError("Event name is required."); return; }
    if (form.maxUses < 1)       { setError("At least 1 guest required."); return; }
    setError(""); setSubmitting(true);
    try {
      const data = await apiRequest("/group-passes", { token, method: "POST", body: form });
      onCreate(data.item);
      setForm(prev => ({ ...prev, eventName: "", maxUses: 10 }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-purple-100 bg-purple-50 p-6">
      <h2 className="mb-1 text-base font-bold text-slate-900">Create Group Pass</h2>
      <p className="mb-5 text-xs text-slate-500">
        One shared OTP for all your guests. Guard enters it once per person with their name.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-rose-50 px-4 py-2.5 text-sm text-rose-700 ring-1 ring-rose-200">{error}</div>
        )}

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">
            Event Name <span className="text-rose-500">*</span>
          </label>
          <input className={inputCls} placeholder="e.g. Birthday Party, Kitty Party, House Warming…"
            value={form.eventName} onChange={e => setForm(p => ({ ...p, eventName: e.target.value }))} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              Max Guests <span className="text-rose-500">*</span>
            </label>
            <input type="number" min={1} max={100} className={inputCls}
              value={form.maxUses}
              onChange={e => setForm(p => ({ ...p, maxUses: parseInt(e.target.value, 10) || 1 }))} />
            <p className="mt-1 text-xs text-slate-400">OTP stops working after this many entries.</p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              Event Date <span className="text-rose-500">*</span>
            </label>
            <input type="date" className={inputCls}
              value={form.expectedDate} min={new Date().toISOString().split("T")[0]}
              onChange={e => setForm(p => ({ ...p, expectedDate: e.target.value }))} />
          </div>
        </div>

        <button type="submit" disabled={submitting}
          className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5
            text-sm font-bold text-white transition hover:bg-purple-700 disabled:opacity-60">
          <PartyPopper size={15} />
          {submitting ? "Generating…" : "Generate Group Pass"}
        </button>
      </form>
    </div>
  );
}

function GroupPassesTab() {
  const { token } = useAuth();
  const [passes,     setPasses]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [cancelling, setCancelling] = useState(null);
  const [showForm,   setShowForm]   = useState(false);
  const [guestToast, setGuestToast] = useState(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true); setError("");
    try {
      const data = await apiRequest("/group-passes", { token });
      setPasses(data.items || []);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  // Real-time: guard verified a guest → update usage count + show toast
  useEffect(() => {
    const socket = getSocket();
    function onGroupPassUsed({ visitor, groupPass }) {
      setGuestToast(`${visitor.visitorName} entered — ${groupPass.usedCount}/${groupPass.maxUses} guests`);
      setTimeout(() => setGuestToast(null), 6000);
      // Reload to get latest entries list and usedCount
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

  const active   = passes.filter(p => p.status === "active");
  const historic = passes.filter(p => p.status !== "active");

  return (
    <div className="space-y-4">
      {guestToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl
          bg-purple-700 px-5 py-3.5 text-sm font-semibold text-white shadow-xl">
          🎉 {guestToast}
        </div>
      )}

      <div className="flex justify-end">
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2
            text-sm font-bold text-white shadow-sm transition hover:bg-purple-700">
          <Plus size={15} /> New Group Pass
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
          <X size={16} /> {error}
        </div>
      )}

      {showForm && (
        <CreateGroupPassForm onCreate={item => { setPasses(p => [item, ...p]); setShowForm(false); }} />
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => <div key={i} className="h-52 animate-pulse rounded-2xl bg-slate-100" />)}
        </div>
      ) : (
        <>
          {active.length === 0 && !showForm && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-14 text-center">
              <span className="mb-3 text-4xl">🎉</span>
              <p className="font-semibold text-slate-700">No group passes yet</p>
              <p className="mt-1 text-sm text-slate-400">
                Hosting a party? Create a group pass — one OTP for all guests.
              </p>
            </div>
          )}
          {active.length > 0 && (
            <div className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Active ({active.length})</p>
              {active.map(p => <GroupPassCard key={p._id} pass={p} onCancel={handleCancel} cancelling={cancelling} />)}
            </div>
          )}
          {historic.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">History</p>
              {historic.map(p => <GroupPassCard key={p._id} pass={p} onCancel={handleCancel} cancelling={cancelling} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  MAIN PAGE — tabs to switch between the two sections
// ══════════════════════════════════════════════════════════════════
export function VisitorPreRegPage() {
  const [activeTab, setActiveTab] = useState("passes"); // "passes" | "frequent" | "group"

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">My Visitor Passes</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Manage entry passes, trusted visitors, and group event passes.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 rounded-2xl bg-slate-100 p-1">
        <Tab active={activeTab === "passes"}   onClick={() => setActiveTab("passes")}>
          🎫 Entry Passes
        </Tab>
        <Tab active={activeTab === "frequent"} onClick={() => setActiveTab("frequent")}>
          👥 Frequent Visitors
        </Tab>
        <Tab active={activeTab === "group"}    onClick={() => setActiveTab("group")}>
          🎉 Group Passes
        </Tab>
      </div>

      {/* Tab content */}
      {activeTab === "passes"   && <PassesTab />}
      {activeTab === "frequent" && <FreqVisitorsTab />}
      {activeTab === "group"    && <GroupPassesTab />}
    </div>
  );
}
