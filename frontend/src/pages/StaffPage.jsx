import { useCallback, useEffect, useRef, useState } from "react";
import {
  Plus, Trash2, X, RefreshCw, Upload, Clock,
  Ban, Calendar, Edit2, ChevronDown
} from "lucide-react";
import { useAuth } from "../components/AuthContext";
import { apiRequest } from "../components/api";
import { getSocket } from "../components/socket";

// ── Constants ────────────────────────────────────────────────────

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

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 " +
  "placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none " +
  "focus:ring-1 focus:ring-emerald-500 text-sm transition-colors";

function getCategoryEmoji(cat) {
  return CATEGORY_OPTIONS.find(c => c.value === cat)?.emoji || "👤";
}

// ── Day Picker Pills ─────────────────────────────────────────────
function DayPicker({ value, onChange }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {ALL_DAYS.map(d => {
        const active = value.includes(d.key);
        return (
          <button
            key={d.key}
            type="button"
            onClick={() =>
              onChange(
                active ? value.filter(x => x !== d.key) : [...value, d.key]
              )
            }
            className={`h-8 w-10 rounded-lg text-xs font-bold transition-all ${
              active
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {d.label}
          </button>
        );
      })}
    </div>
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

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("name",         form.name.trim());
      fd.append("phone",        form.phone.trim());
      fd.append("category",     form.category);
      fd.append("allowedDays",  JSON.stringify(form.allowedDays));
      fd.append("allowedFrom",  form.allowedFrom);
      fd.append("allowedUntil", form.allowedUntil);
      if (fileRef.current?.files[0]) {
        fd.append("photo", fileRef.current.files[0]);
      }
      const data = await apiRequest("/staff", {
        method: "POST", formData: fd, token,
      });
      onAdded(data.item);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="font-black text-slate-900">Add Staff Member</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100 transition">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Photo Upload */}
          <div className="flex items-center gap-4">
            <div
              onClick={() => fileRef.current?.click()}
              className="h-16 w-16 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden cursor-pointer hover:border-emerald-400 transition shrink-0"
            >
              {preview
                ? <img src={preview} alt="" className="h-full w-full object-cover" />
                : <Upload size={20} className="text-slate-400" />
              }
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Staff Photo</p>
              <p className="text-xs text-slate-400">Optional — helps guard identify them</p>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Full Name</label>
            <input
              required
              className={inputCls}
              placeholder="e.g. Sunita Devi"
              value={form.name}
              onChange={e => set("name", e.target.value)}
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Phone Number</label>
            <input
              required
              type="tel"
              className={inputCls}
              placeholder="10-digit mobile number"
              value={form.phone}
              onChange={e => set("phone", e.target.value)}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Category</label>
            <select
              className={inputCls}
              value={form.category}
              onChange={e => set("category", e.target.value)}
            >
              {CATEGORY_OPTIONS.map(c => (
                <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
              ))}
            </select>
          </div>

          {/* Allowed Days */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Working Days</label>
            <DayPicker value={form.allowedDays} onChange={v => set("allowedDays", v)} />
          </div>

          {/* Time Window */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">From</label>
              <input type="time" className={inputCls} value={form.allowedFrom} onChange={e => set("allowedFrom", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Until</label>
              <input type="time" className={inputCls} value={form.allowedUntil} onChange={e => set("allowedUntil", e.target.value)} />
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-rose-50 border border-rose-100 px-4 py-2.5 text-sm text-rose-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition disabled:opacity-50"
          >
            {saving ? "Saving…" : "Add Staff Member"}
          </button>
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

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const data = await apiRequest(`/staff/${staff._id}/my-assignment`, {
        method: "PATCH",
        body: {
          allowedDays:  JSON.stringify(form.allowedDays),
          allowedFrom:  form.allowedFrom,
          allowedUntil: form.allowedUntil,
        },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="font-black text-slate-900">Edit Schedule</h2>
            <p className="text-xs text-slate-500">{staff.name}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100 transition">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Working Days</label>
            <DayPicker value={form.allowedDays} onChange={v => set("allowedDays", v)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">From</label>
              <input type="time" className={inputCls} value={form.allowedFrom} onChange={e => set("allowedFrom", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Until</label>
              <input type="time" className={inputCls} value={form.allowedUntil} onChange={e => set("allowedUntil", e.target.value)} />
            </div>
          </div>
          {error && (
            <p className="rounded-xl bg-rose-50 border border-rose-100 px-4 py-2.5 text-sm text-rose-600">{error}</p>
          )}
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Schedule"}
          </button>
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

  const activeDays = a?.allowedDays?.length
    ? ALL_DAYS.filter(d => a.allowedDays.includes(d.key)).map(d => d.label).join(" ")
    : "—";

  return (
    <div className={`rounded-2xl border bg-white shadow-sm overflow-hidden transition ${isBlocked ? "opacity-60" : ""}`}>
      {/* Top row */}
      <div className="flex items-center gap-4 px-5 py-4 border-b border-slate-100">
        {staff.photoUrl
          ? <img src={staff.photoUrl} alt={staff.name} className="h-12 w-12 rounded-full object-cover shrink-0" />
          : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl shrink-0">
              {getCategoryEmoji(staff.category)}
            </div>
          )
        }
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-slate-900 truncate">{staff.name}</p>
            {isBlocked && (
              <span className="flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-600">
                <Ban size={10} /> Blocked
              </span>
            )}
            {isOnLeave && !isBlocked && (
              <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-600">
                <Clock size={10} /> On Leave
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 capitalize">{staff.category} · {staff.phone}</p>
        </div>
        <div className="text-xs font-mono bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg shrink-0">
          {staff.staffCode}
        </div>
      </div>

      {/* Schedule row */}
      {a && (
        <div className="px-5 py-3 bg-slate-50 flex items-center gap-3 text-xs text-slate-600">
          <Calendar size={13} className="shrink-0 text-emerald-600" />
          <span className="font-semibold">{activeDays}</span>
          <Clock size={13} className="shrink-0 text-emerald-600 ml-2" />
          <span>{a.allowedFrom} – {a.allowedUntil}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 px-5 py-3 border-t border-slate-100">
        <button
          onClick={() => onEditSchedule(staff)}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
        >
          <Edit2 size={12} /> Edit Schedule
        </button>
        <button
          onClick={() => onBlock(staff)}
          disabled={blocking === staff._id}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
            isBlocked
              ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              : "border-amber-200 text-amber-700 hover:bg-amber-50"
          }`}
        >
          <Ban size={12} />
          {blocking === staff._id ? "…" : isBlocked ? "Unblock" : "Block"}
        </button>
        <button
          onClick={() => onRemove(staff)}
          disabled={removing === staff._id}
          className="ml-auto flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition disabled:opacity-50"
        >
          <Trash2 size={12} />
          {removing === staff._id ? "…" : "Remove"}
        </button>
      </div>
    </div>
  );
}

// ── Society-wide Staff Card (Committee view) ─────────────────────
function SocietyStaffCard({ staff }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-50 transition"
      >
        {staff.photoUrl
          ? <img src={staff.photoUrl} alt={staff.name} className="h-11 w-11 rounded-full object-cover shrink-0" />
          : <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-xl shrink-0">{getCategoryEmoji(staff.category)}</div>
        }
        <div className="flex-1">
          <p className="font-bold text-slate-900">{staff.name}</p>
          <p className="text-xs text-slate-500 capitalize">{staff.category} · {staff.phone}</p>
        </div>
        <span className="text-xs bg-slate-100 rounded-full px-2.5 py-1 text-slate-600 font-semibold mr-2">
          {staff.assignments?.length || 0} flat{staff.assignments?.length !== 1 ? "s" : ""}
        </span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && staff.assignments?.length > 0 && (
        <div className="border-t border-slate-100 divide-y divide-slate-50">
          {staff.assignments.map((a, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3 text-sm">
              <div className="flex-1">
                <p className="font-semibold text-slate-900">{a.flatNumber}</p>
                <p className="text-xs text-slate-400">{a.residentId?.fullName || "Unknown resident"}</p>
              </div>
              <div className="text-xs text-slate-500">
                {ALL_DAYS.filter(d => a.allowedDays?.includes(d.key)).map(d => d.label).join(" ")}
              </div>
              <div className="text-xs text-slate-500">{a.allowedFrom}–{a.allowedUntil}</div>
              {a.blocked && <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-600">Blocked</span>}
              {a.onLeave && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-600">On Leave</span>}
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

  // My staff state
  const [myStaff,  setMyStaff]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  // Society staff state
  const [allStaff, setAllStaff] = useState([]);
  const [allLoading, setAllLoading] = useState(false);

  // Modal state
  const [showAdd,    setShowAdd]    = useState(false);
  const [editTarget, setEditTarget] = useState(null);   // staff to edit schedule

  // Action loading states
  const [blocking, setBlocking] = useState(null);
  const [removing, setRemoving] = useState(null);

  // ── Fetch my staff ─────────────────────────────────────────────
  const fetchMyStaff = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest("/staff/mine", { token });
      setMyStaff(data.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // ── Fetch all staff (committee) ────────────────────────────────
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

  useEffect(() => {
    if (tab === "all" && isCommittee) fetchAllStaff();
  }, [tab, isCommittee, fetchAllStaff]);

  // ── Real-time: listen for staff leave toggle notifications ─────
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    function onLeaveToggled({ staffId, onLeave }) {
      setMyStaff(prev =>
        prev.map(s =>
          s._id === staffId
            ? { ...s, myAssignment: s.myAssignment ? { ...s.myAssignment, onLeave } : s.myAssignment }
            : s
        )
      );
    }
    socket.on("staff:leave_toggled", onLeaveToggled);
    return () => socket.off("staff:leave_toggled", onLeaveToggled);
  }, []);

  // ── Actions ────────────────────────────────────────────────────
  function handleAdded() {
    setShowAdd(false);
    fetchMyStaff();
  }

  function handleUpdated() {
    setEditTarget(null);
    fetchMyStaff();
  }

  async function handleBlock(staff) {
    setBlocking(staff._id);
    try {
      await apiRequest(`/staff/${staff._id}/toggle-block`, {
        method: "PATCH",
        body: { flatNumber: staff.myAssignment?.flatNumber },
        token,
      });
      fetchMyStaff();
    } catch (err) {
      alert(err.message);
    } finally {
      setBlocking(null);
    }
  }

  async function handleRemove(staff) {
    if (!confirm(`Remove ${staff.name} from your flat?`)) return;
    setRemoving(staff._id);
    try {
      await apiRequest(`/staff/${staff._id}/my-assignment`, { method: "DELETE", token });
      setMyStaff(prev => prev.filter(s => s._id !== staff._id));
    } catch (err) {
      alert(err.message);
    } finally {
      setRemoving(null);
    }
  }

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">

      {/* Page header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Staff Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage your household staff members</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchMyStaff} className="rounded-xl border border-slate-200 p-2.5 hover:bg-slate-50 transition text-slate-500">
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition"
          >
            <Plus size={16} /> Add Staff
          </button>
        </div>
      </div>

      {/* Tabs (committee only) */}
      {isCommittee && (
        <div className="flex gap-1 rounded-2xl bg-slate-100 p-1 w-fit">
          <button
            onClick={() => setTab("mine")}
            className={`px-5 py-2 text-sm font-bold rounded-xl transition-all ${tab === "mine" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            My Staff
          </button>
          <button
            onClick={() => setTab("all")}
            className={`px-5 py-2 text-sm font-bold rounded-xl transition-all ${tab === "all" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            All Society Staff
          </button>
        </div>
      )}

      {/* My Staff tab */}
      {tab === "mine" && (
        <>
          {loading ? (
            <div className="text-center py-16 text-slate-400 text-sm">Loading…</div>
          ) : error ? (
            <div className="rounded-2xl bg-rose-50 border border-rose-100 px-5 py-4 text-sm text-rose-600">{error}</div>
          ) : myStaff.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center">
              <p className="text-4xl mb-3">🧹</p>
              <p className="font-bold text-slate-700">No staff added yet</p>
              <p className="text-sm text-slate-400 mt-1">Add your maid, cook, or driver to manage their access</p>
              <button
                onClick={() => setShowAdd(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition"
              >
                <Plus size={16} /> Add First Staff
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {myStaff.map(staff => (
                <StaffCard
                  key={staff._id}
                  staff={staff}
                  onBlock={handleBlock}
                  onRemove={handleRemove}
                  onEditSchedule={setEditTarget}
                  blocking={blocking}
                  removing={removing}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* All Society Staff tab (committee) */}
      {tab === "all" && isCommittee && (
        <>
          {allLoading ? (
            <div className="text-center py-16 text-slate-400 text-sm">Loading…</div>
          ) : allStaff.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm">No staff registered in this society yet.</div>
          ) : (
            <div className="space-y-3">
              {allStaff.map(staff => (
                <SocietyStaffCard key={staff._id} staff={staff} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showAdd    && <AddStaffModal    onClose={() => setShowAdd(false)}   onAdded={handleAdded}    />}
      {editTarget && <EditScheduleModal staff={editTarget} onClose={() => setEditTarget(null)} onUpdated={handleUpdated} />}
    </div>
  );
}
