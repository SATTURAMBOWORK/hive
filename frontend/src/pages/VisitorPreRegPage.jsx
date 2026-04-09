import { useCallback, useEffect, useState } from "react";
import { Calendar, Plus, Trash2, X, RefreshCw, QrCode } from "lucide-react";
import { useAuth } from "../components/AuthContext";
import { apiRequest } from "../components/api";
import { getSocket } from "../components/socket";

/*
  PURPOSE_OPTIONS mirrors the backend enum so labels + emojis are consistent.
*/
const PURPOSE_OPTIONS = [
  { value: "guest",      label: "Guest",      emoji: "👤" },
  { value: "delivery",   label: "Delivery",   emoji: "📦" },
  { value: "contractor", label: "Contractor", emoji: "🔧" },
  { value: "other",      label: "Other",      emoji: "📋" },
];

/*
  STATUS_STYLE maps each pre-registration status to a colour + label
  so the UI looks clean at a glance.
*/
const STATUS_STYLE = {
  active:    { label: "Active",    cls: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200" },
  used:      { label: "Used",      cls: "bg-sky-100    text-sky-700    ring-1 ring-sky-200"      },
  expired:   { label: "Expired",   cls: "bg-slate-100  text-slate-500  ring-1 ring-slate-200"    },
  cancelled: { label: "Cancelled", cls: "bg-rose-100   text-rose-600   ring-1 ring-rose-200"     },
};

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 " +
  "placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none " +
  "focus:ring-1 focus:ring-emerald-500 text-sm transition-colors";

/*  Format a Date object to the short "Apr 9" style  */
function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/* ── Entry Pass Card ───────────────────────────────────────────────
   Shown for each active (and used) pre-registration.
   Displays the OTP in large digits + a QR code image so residents
   can share either one with their visitor.

   QR code uses a free public API — no npm install needed:
   https://api.qrserver.com/v1/create-qr-code/?data=OTP&size=160x160
   When the guard scans the QR code, they see the 6-digit OTP on screen.
──────────────────────────────────────────────────────────────────── */
function EntryPassCard({ pass, onCancel, cancelling }) {
  const purposeEmoji = PURPOSE_OPTIONS.find(p => p.value === pass.purpose)?.emoji || "👤";
  const statusStyle  = STATUS_STYLE[pass.status] || STATUS_STYLE.active;
  const isActive     = pass.status === "active";

  // QR code encodes just the 6-digit OTP text
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${pass.otp}&size=160x160&margin=10`;

  return (
    <div className={`rounded-2xl border bg-white overflow-hidden shadow-sm
      ${isActive ? "border-emerald-200" : "border-slate-200 opacity-70"}`}>

      {/* Card header — visitor name + status badge */}
      <div className={`flex items-center justify-between px-5 py-3.5
        ${isActive ? "bg-emerald-50" : "bg-slate-50"}`}>
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{purposeEmoji}</span>
          <div>
            <p className="font-bold text-slate-900 text-sm">{pass.visitorName}</p>
            {pass.visitorPhone && (
              <p className="text-xs text-slate-500">{pass.visitorPhone}</p>
            )}
          </div>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${statusStyle.cls}`}>
          {statusStyle.label}
        </span>
      </div>

      {/* Card body — OTP + QR code side by side */}
      <div className="flex items-stretch gap-0 divide-x divide-slate-100">

        {/* Left: pass details + OTP */}
        <div className="flex-1 p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Calendar size={13} />
            <span>Valid on <strong className="text-slate-700">{fmtDate(pass.expectedDate)}</strong></span>
          </div>

          {/* OTP — the main thing the resident shares with their visitor */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
              Entry OTP
            </p>
            <div className={`flex gap-1.5 ${!isActive ? "opacity-50" : ""}`}>
              {pass.otp.split("").map((digit, i) => (
                <div key={i}
                  className="flex h-10 w-9 items-center justify-center rounded-xl bg-slate-900 text-white text-lg font-black tracking-tight shadow-sm">
                  {digit}
                </div>
              ))}
            </div>
            {isActive && (
              <p className="mt-2 text-xs text-slate-400">
                Share this code or the QR with your visitor. Guard enters it at the gate.
              </p>
            )}
          </div>
        </div>

        {/* Right: QR code */}
        <div className="flex flex-col items-center justify-center p-5 gap-2">
          {isActive ? (
            <>
              <img
                src={qrUrl}
                alt={`QR code for OTP ${pass.otp}`}
                className="h-24 w-24 rounded-xl"
                loading="lazy"
              />
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <QrCode size={11} /> Scan to see OTP
              </p>
            </>
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
              <QrCode size={28} />
            </div>
          )}
        </div>
      </div>

      {/* Footer — cancel button (only for active passes) */}
      {isActive && (
        <div className="border-t border-slate-100 px-5 py-3 flex justify-end">
          <button
            onClick={() => onCancel(pass._id)}
            disabled={cancelling === pass._id}
            className="flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5
              text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
          >
            <Trash2 size={12} />
            {cancelling === pass._id ? "Cancelling…" : "Cancel Pass"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Create Pass Form ────────────────────────────────────────────── */
function CreatePassForm({ onCreate }) {
  const { token } = useAuth();
  const [form, setForm] = useState({
    visitorName: "", visitorPhone: "", purpose: "guest", expectedDate: ""
  });
  const [error,      setError]      = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill today's date as the default so the resident doesn't have to always type it
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
    setForm(prev => ({ ...prev, expectedDate: today }));
  }, []);

  function field(key) {
    return (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.visitorName.trim()) { setError("Visitor name is required.");  return; }
    if (!form.expectedDate)       { setError("Expected date is required.");  return; }

    setError(""); setSubmitting(true);
    try {
      const data = await apiRequest("/visitor-prereg", {
        token, method: "POST", body: form
      });
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
        Pre-register your visitor. You'll get a 6-digit OTP and QR code to share with them.
        When they arrive, the guard enters the OTP — no approval needed, they walk right in.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-rose-50 px-4 py-2.5 text-sm text-rose-700 ring-1 ring-rose-200">
            {error}
          </div>
        )}

        {/* Row 1: Visitor name + phone */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              Visitor Name <span className="text-rose-500">*</span>
            </label>
            <input className={inputCls} placeholder="e.g. Raj Kumar"
              value={form.visitorName} onChange={field("visitorName")} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              Visitor Phone
            </label>
            <input className={inputCls} placeholder="e.g. 9876543210"
              value={form.visitorPhone} onChange={field("visitorPhone")} />
          </div>
        </div>

        {/* Row 2: Purpose selector */}
        <div>
          <label className="mb-2 block text-xs font-semibold text-slate-600">Purpose</label>
          <div className="grid grid-cols-4 gap-2">
            {PURPOSE_OPTIONS.map(p => (
              <button key={p.value} type="button"
                onClick={() => setForm(prev => ({ ...prev, purpose: p.value }))}
                className={`flex flex-col items-center gap-1 rounded-xl border-2 py-2.5 text-center transition
                  ${form.purpose === p.value
                    ? "border-emerald-500 bg-white text-emerald-700"
                    : "border-slate-200 bg-white text-slate-500 hover:border-emerald-300"}`}
              >
                <span className="text-lg">{p.emoji}</span>
                <span className="text-xs font-semibold">{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Row 3: Expected date */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">
            Expected Visit Date <span className="text-rose-500">*</span>
          </label>
          <input type="date" className={inputCls}
            value={form.expectedDate} onChange={field("expectedDate")}
            min={new Date().toISOString().split("T")[0]} />
          <p className="mt-1 text-xs text-slate-400">
            The pass is valid for the entire selected day (00:00 – 23:59).
          </p>
        </div>

        <div className="flex gap-3 pt-1">
          <button type="submit" disabled={submitting}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5
              text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60">
            <Plus size={15} />
            {submitting ? "Generating pass…" : "Generate Entry Pass"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════ */
export function VisitorPreRegPage() {
  const { token } = useAuth();

  const [passes,      setPasses]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [cancelling,  setCancelling]  = useState(null); // ID of the pass being cancelled
  const [showForm,    setShowForm]    = useState(false);
  const [arrivalToast, setArrivalToast] = useState(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true); setError("");
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

  // Real-time: guard verified OTP → mark that pass as "used" + show toast
  useEffect(() => {
    const socket = getSocket();
    function onPreRegUsed({ visitor }) {
      setPasses(prev =>
        prev.map(p =>
          p.visitorEntryId === visitor._id || p._id === visitor.preRegId
            ? { ...p, status: "used" }
            : p
        )
      );
      setArrivalToast(`${visitor.visitorName} has entered the building!`);
      setTimeout(() => setArrivalToast(null), 6000);

      // Reload to get accurate statuses from the server
      load();
    }
    socket.on("visitor:prereg_used", onPreRegUsed);
    return () => socket.off("visitor:prereg_used", onPreRegUsed);
  }, [load]);

  async function handleCancel(id) {
    setCancelling(id);
    try {
      await apiRequest(`/visitor-prereg/${id}`, { token, method: "DELETE" });
      setPasses(prev => prev.map(p => p._id === id ? { ...p, status: "cancelled" } : p));
    } catch (err) {
      setError(err.message);
    } finally {
      setCancelling(null);
    }
  }

  function handleCreated(newPass) {
    setPasses(prev => [newPass, ...prev]);
    setShowForm(false);
  }

  const activePasses  = passes.filter(p => p.status === "active");
  const historicPasses = passes.filter(p => p.status !== "active");

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">

      {/* ── Real-time arrival toast ── */}
      {arrivalToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl
          bg-emerald-700 px-5 py-3.5 text-sm font-semibold text-white shadow-xl">
          🚶 {arrivalToast}
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Visitor Pre-Registration</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Generate entry passes for expected visitors — no gate approval needed.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white
              px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Sync
          </button>
          <button onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2
              text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700">
            <Plus size={15} />
            New Pass
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl bg-rose-50 px-4 py-3
          text-sm text-rose-700 ring-1 ring-rose-200">
          <X size={16} /> {error}
        </div>
      )}

      {/* ── Create form (toggled) ── */}
      {showForm && <CreatePassForm onCreate={handleCreated} />}

      {/* ── Active passes ── */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : (
        <>
          {activePasses.length === 0 && !showForm && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed
              border-slate-200 bg-white py-16 text-center">
              <span className="mb-3 text-4xl">🎫</span>
              <p className="font-semibold text-slate-700">No active passes</p>
              <p className="mt-1 text-sm text-slate-400">
                Click "New Pass" to pre-register a visitor.
              </p>
            </div>
          )}

          {activePasses.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide">
                Active Passes ({activePasses.length})
              </h2>
              {activePasses.map(p => (
                <EntryPassCard
                  key={p._id}
                  pass={p}
                  onCancel={handleCancel}
                  cancelling={cancelling}
                />
              ))}
            </div>
          )}

          {historicPasses.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide">
                History
              </h2>
              {historicPasses.map(p => (
                <EntryPassCard
                  key={p._id}
                  pass={p}
                  onCancel={handleCancel}
                  cancelling={cancelling}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
