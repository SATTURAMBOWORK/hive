import { useCallback, useEffect, useState } from "react";
import { LogIn, LogOut, RefreshCw, UserPlus, X } from "lucide-react";
import { useAuth } from "../components/AuthContext";
import { apiRequest } from "../components/api";
import { getSocket } from "../components/socket";

const PURPOSE_OPTIONS = [
  { value: "guest",      label: "Guest",      emoji: "👤" },
  { value: "delivery",   label: "Delivery",   emoji: "📦" },
  { value: "contractor", label: "Contractor", emoji: "🔧" },
  { value: "other",      label: "Other",      emoji: "📋" },
];

const APPROVAL_STYLE = {
  pending:  { label: "Waiting…",  cls: "bg-amber-100 text-amber-700"   },
  approved: { label: "Approved",  cls: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "Rejected",  cls: "bg-rose-100 text-rose-700"     },
};

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm transition-colors";

function fmtTime(d) {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function StatCard({ emoji, label, value, color }) {
  const colors = {
    orange:  "bg-orange-50  border-orange-100  text-orange-700",
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-700",
    slate:   "bg-slate-50   border-slate-100   text-slate-700",
    amber:   "bg-amber-50   border-amber-100   text-amber-700",
  };
  return (
    <div className={`flex items-center gap-4 rounded-2xl border p-5 ${colors[color] || colors.slate}`}>
      <span className="text-3xl">{emoji}</span>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      </div>
    </div>
  );
}

export function VisitorLogPage() {
  const { token } = useAuth();

  const [visitors,   setVisitors]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [formError,  setFormError]  = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [exitingId,  setExitingId]  = useState(null);
  const [showForm,   setShowForm]   = useState(false);
  // Toast shown when a response comes back in real-time
  const [responseToast, setResponseToast] = useState(null);

  const [form, setForm] = useState({
    visitorName: "", visitorPhone: "", flatNumber: "",
    residentName: "", purpose: "guest", vehicleNumber: "",
  });

  function field(key) {
    return (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));
  }

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true); setError("");
    try {
      const data = await apiRequest("/visitors", { token });
      setVisitors(data.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  // Listen for real-time response from resident
  useEffect(() => {
    const socket = getSocket();

    function onResponded({ visitor, decision }) {
      // Update that specific visitor row in state — no page refresh needed
      setVisitors(prev => prev.map(v => v._id === visitor._id ? visitor : v));

      // Show a temporary toast to the guard
      const msg = decision === "approved"
        ? `✅ ${visitor.visitorName} approved by resident`
        : `❌ ${visitor.visitorName} rejected by resident`;
      setResponseToast(msg);
      setTimeout(() => setResponseToast(null), 5000);
    }

    socket.on("visitor:request_responded", onResponded);
    return () => socket.off("visitor:request_responded", onResponded);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.visitorName.trim()) { setFormError("Visitor name is required."); return; }
    if (!form.flatNumber.trim())  { setFormError("Flat number is required.");  return; }
    setFormError(""); setSubmitting(true);
    try {
      const data = await apiRequest("/visitors", { token, method: "POST", body: form });
      // Add the new visitor to the top of the list immediately
      setVisitors(prev => [data.item, ...prev]);
      setForm({ visitorName: "", visitorPhone: "", flatNumber: "", residentName: "", purpose: "guest", vehicleNumber: "" });
      setShowForm(false);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleExit(id) {
    setExitingId(id);
    try {
      const data = await apiRequest(`/visitors/${id}/exit`, { token, method: "PATCH" });
      setVisitors(prev => prev.map(v => v._id === id ? data.item : v));
    } catch (err) {
      setError(err.message);
    } finally {
      setExitingId(null);
    }
  }

  const insideCount  = visitors.filter(v => v.status === "inside").length;
  const pendingCount = visitors.filter(v => v.approvalStatus === "pending").length;
  const exitedCount  = visitors.filter(v => v.status === "exited").length;

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long"
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">

      {/* ── Real-time response toast ── */}
      {responseToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white shadow-xl">
          {responseToast}
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Visitor Log</h1>
          <p className="mt-0.5 text-sm text-slate-500">{today}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Sync
          </button>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-orange-700"
          >
            <UserPlus size={15} />
            Request Entry
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
          <X size={16} /> {error}
        </div>
      )}

      {/* ── Stats ── */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard emoji="👥" label="Total Today"  value={visitors.length} color="slate"   />
        <StatCard emoji="⏳" label="Pending"      value={pendingCount}    color="amber"   />
        <StatCard emoji="🟢" label="Inside"       value={insideCount}     color="orange"  />
        <StatCard emoji="✅" label="Exited"       value={exitedCount}     color="emerald" />
      </div>

      {/* ── Request Entry Form ── */}
      {showForm && (
        <div className="rounded-2xl border border-orange-100 bg-orange-50 p-6">
          <h2 className="mb-4 text-base font-bold text-slate-900">New Visitor Request</h2>
          <p className="mb-4 text-xs text-slate-500">
            The resident will receive an instant notification and must approve before the visitor enters.
          </p>
          <form onSubmit={handleSubmit} className="space-y-3">
            {formError && (
              <div className="rounded-lg bg-rose-50 px-4 py-2.5 text-sm text-rose-700 ring-1 ring-rose-200">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Visitor Name <span className="text-rose-500">*</span>
                </label>
                <input className={inputCls} placeholder="e.g. Raj Kumar" value={form.visitorName} onChange={field("visitorName")} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Phone</label>
                <input className={inputCls} placeholder="e.g. 9876543210" value={form.visitorPhone} onChange={field("visitorPhone")} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Visiting Flat <span className="text-rose-500">*</span>
                </label>
                <input className={inputCls} placeholder="e.g. A-401" value={form.flatNumber} onChange={field("flatNumber")} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Resident Name</label>
                <input className={inputCls} placeholder="Who they're visiting" value={form.residentName} onChange={field("residentName")} />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-600">Purpose</label>
              <div className="grid grid-cols-4 gap-2">
                {PURPOSE_OPTIONS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, purpose: p.value }))}
                    className={`flex flex-col items-center gap-1 rounded-xl border-2 py-2.5 text-center transition
                      ${form.purpose === p.value
                        ? "border-orange-500 bg-white text-orange-700"
                        : "border-slate-200 bg-white text-slate-500 hover:border-orange-300"}`}
                  >
                    <span className="text-lg">{p.emoji}</span>
                    <span className="text-xs font-semibold">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Vehicle Number</label>
              <input className={inputCls} placeholder="e.g. KA01AB1234 (optional)" value={form.vehicleNumber} onChange={field("vehicleNumber")} />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-orange-700 disabled:opacity-60"
              >
                <LogIn size={15} />
                {submitting ? "Sending request…" : "Send Request"}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setFormError(""); }}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Visitor List ── */}
      <div className="rounded-2xl border border-slate-100 bg-white">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="font-bold text-slate-900">Today's Visitors</h2>
        </div>

        {loading ? (
          <div className="space-y-3 p-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : visitors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="mb-3 text-4xl">🚪</span>
            <p className="font-semibold text-slate-700">No visitors today</p>
            <p className="mt-1 text-sm text-slate-400">Send a request when someone arrives.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {visitors.map((v) => {
              const approval = APPROVAL_STYLE[v.approvalStatus] || APPROVAL_STYLE.pending;
              const purposeEmoji = PURPOSE_OPTIONS.find(p => p.value === v.purpose)?.emoji || "👤";

              return (
                <div key={v._id} className="flex items-center justify-between gap-4 px-6 py-4">
                  {/* Left */}
                  <div className="flex items-center gap-4">
                    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-lg
                      ${v.approvalStatus === "pending" ? "bg-amber-50" : v.approvalStatus === "approved" ? "bg-orange-50" : "bg-slate-50"}`}>
                      {purposeEmoji}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{v.visitorName}</p>
                      <p className="text-xs text-slate-400">
                        Flat {v.flatNumber}
                        {v.residentId?.fullName ? ` · ${v.residentId.fullName}` : ""}
                        {v.visitorPhone ? ` · ${v.visitorPhone}` : ""}
                      </p>
                    </div>
                  </div>

                  {/* Right */}
                  <div className="flex flex-shrink-0 items-center gap-3">
                    <div className="hidden text-right sm:block">
                      <p className="text-xs text-slate-500">
                        <span className="font-medium text-slate-700">In:</span> {fmtTime(v.entryTime)}
                      </p>
                      {v.exitTime && (
                        <p className="text-xs text-slate-500">
                          <span className="font-medium text-slate-700">Out:</span> {fmtTime(v.exitTime)}
                        </p>
                      )}
                    </div>

                    {/* Approval status badge */}
                    <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${approval.cls}`}>
                      {approval.label}
                    </span>

                    {/* Mark exit — only if visitor is inside */}
                    {v.status === "inside" && (
                      <button
                        onClick={() => handleExit(v._id)}
                        disabled={exitingId === v._id}
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50"
                      >
                        <LogOut size={12} />
                        {exitingId === v._id ? "…" : "Mark Exit"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
