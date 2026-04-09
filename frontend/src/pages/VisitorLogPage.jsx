import { useCallback, useEffect, useRef, useState } from "react";
import { LogIn, LogOut, RefreshCw, UserPlus, X, ChevronDown, Search, KeyRound, Users, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
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
  pending:  { label: "Waiting…", cls: "bg-amber-100 text-amber-700"    },
  approved: { label: "Approved", cls: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "Rejected", cls: "bg-rose-100 text-rose-700"      },
  missed:   { label: "Missed",   cls: "bg-slate-100 text-slate-500"    },
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

/* ── Searchable flat dropdown ───────────────────────────────────
   Shows a text input. As the guard types, the list filters.
   On selection, auto-fills flatNumber + residentName.
──────────────────────────────────────────────────────────────── */
function FlatDropdown({ flats, value, onChange }) {
  const [query,  setQuery]  = useState(value || "");
  const [open,   setOpen]   = useState(false);
  const ref = useRef(null);

  // Filter flats by query
  const filtered = flats.filter(f =>
    f.flatNumber.toLowerCase().includes(query.toLowerCase()) ||
    f.residentName.toLowerCase().includes(query.toLowerCase())
  );

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Keep text in sync if parent clears the value
  useEffect(() => { setQuery(value || ""); }, [value]);

  function select(flat) {
    setQuery(flat.flatNumber);
    setOpen(false);
    onChange(flat); // pass the whole flat object up
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-10 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm transition-colors"
          placeholder="Search flat or resident…"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
        />
        <ChevronDown size={14} className={`absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none transition-transform ${open ? "rotate-180" : ""}`} />
      </div>

      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg max-h-52 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-400">No flats found</p>
          ) : (
            filtered.map(f => (
              <button
                key={f.flatNumber}
                type="button"
                onMouseDown={() => select(f)} // mousedown fires before blur
                className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-slate-50 transition-colors"
              >
                <span className="font-semibold text-slate-800">Flat {f.flatNumber}</span>
                <span className="text-slate-400">{f.residentName}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════ */
export function VisitorLogPage() {
  const { token } = useAuth();

  const [visitors,      setVisitors]      = useState([]);
  const [flats,         setFlats]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const [formError,     setFormError]     = useState("");
  const [submitting,    setSubmitting]    = useState(false);
  const [exitingId,     setExitingId]     = useState(null);
  const [showForm,      setShowForm]      = useState(false);
  const [responseToast, setResponseToast] = useState(null);

  // OTP verification modal state
  const [showOtpModal,  setShowOtpModal]  = useState(false);
  const [otpValue,      setOtpValue]      = useState("");
  const [otpError,      setOtpError]      = useState("");
  const [otpLoading,    setOtpLoading]    = useState(false);
  const [otpSuccess,    setOtpSuccess]    = useState(null);
  // Group pass two-step state
  const [groupPassInfo,    setGroupPassInfo]    = useState(null);  // from /check — pass details
  const [groupVisitorName, setGroupVisitorName] = useState("");    // step 2 input
  const [groupSubmitting,  setGroupSubmitting]  = useState(false);

  // Frequent visitor search modal state
  const [showFreqModal,   setShowFreqModal]   = useState(false);
  const [freqPhone,       setFreqPhone]       = useState("");
  const [freqSearching,   setFreqSearching]   = useState(false);
  const [freqResult,      setFreqResult]      = useState(null);  // found FrequentVisitor
  const [freqSearchError, setFreqSearchError] = useState("");
  const [freqLoggingFlat, setFreqLoggingFlat] = useState(null); // flatNumber being logged
  const [freqLogSuccess,  setFreqLogSuccess]  = useState(null); // visitor logged

  const [form, setForm] = useState({
    visitorName: "", visitorPhone: "", flatNumber: "",
    residentName: "", purpose: "guest", vehicleNumber: "",
  });

  function field(key) {
    return (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));
  }

  // When a flat is selected from the dropdown, auto-fill flatNumber + residentName
  function handleFlatSelect(flat) {
    setForm(prev => ({
      ...prev,
      flatNumber:   flat.flatNumber,
      residentName: flat.residentName,
    }));
  }

  // Load today's visitors + the flat list in parallel
  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true); setError("");
    try {
      const [visitorData, flatData] = await Promise.all([
        apiRequest("/visitors",       { token }),
        apiRequest("/visitors/flats", { token }),
      ]);
      setVisitors(visitorData.items || []);
      setFlats(flatData.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  // Real-time: resident responded → update that row + show toast
  useEffect(() => {
    const socket = getSocket();
    function onResponded({ visitor, decision }) {
      setVisitors(prev => prev.map(v => v._id === visitor._id ? visitor : v));
      const msg = decision === "approved"
        ? `✅ ${visitor.visitorName} approved by resident`
        : `❌ ${visitor.visitorName} rejected by resident`;
      setResponseToast(msg);
      setTimeout(() => setResponseToast(null), 5000);
    }
    socket.on("visitor:request_responded", onResponded);
    return () => socket.off("visitor:request_responded", onResponded);
  }, []);

  function resetForm() {
    setForm({ visitorName: "", visitorPhone: "", flatNumber: "", residentName: "", purpose: "guest", vehicleNumber: "" });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.visitorName.trim()) { setFormError("Visitor name is required."); return; }
    if (!form.flatNumber.trim())  { setFormError("Please select a flat.");     return; }
    setFormError(""); setSubmitting(true);
    try {
      const data = await apiRequest("/visitors", { token, method: "POST", body: form });
      setVisitors(prev => [data.item, ...prev]);
      resetForm();
      setShowForm(false);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // Step 1 — guard enters OTP.
  // Try pre-reg first. If not found, check group passes.
  async function handleOtpVerify(e) {
    e.preventDefault();
    if (!/^\d{6}$/.test(otpValue)) { setOtpError("Enter a valid 6-digit OTP."); return; }
    setOtpError(""); setOtpLoading(true); setOtpSuccess(null); setGroupPassInfo(null);
    try {
      // Try pre-reg pass first
      const data = await apiRequest("/visitor-prereg/verify-otp", {
        token, method: "POST", body: { otp: otpValue }
      });
      setVisitors(prev => [data.item, ...prev]);
      setOtpSuccess(data.item);
      setOtpValue("");
    } catch (preRegErr) {
      // Pre-reg not found — check if it's a group pass
      try {
        const groupData = await apiRequest(`/group-passes/check?otp=${otpValue}`, { token });
        // Group pass found → move to step 2
        setGroupPassInfo(groupData.item);
        setGroupVisitorName("");
        setOtpError("");
      } catch {
        // Neither pre-reg nor group pass — show the original pre-reg error
        setOtpError(preRegErr.message);
      }
    } finally {
      setOtpLoading(false);
    }
  }

  // Step 2 — guard enters visitor name for a group pass
  async function handleGroupPassConfirm(e) {
    e.preventDefault();
    if (!groupVisitorName.trim()) { setOtpError("Visitor name is required."); return; }
    setOtpError(""); setGroupSubmitting(true);
    try {
      const data = await apiRequest("/group-passes/verify-otp", {
        token, method: "POST", body: { otp: otpValue, visitorName: groupVisitorName }
      });
      setVisitors(prev => [data.item, ...prev]);
      setOtpSuccess(data.item);
      setGroupPassInfo(null);
    } catch (err) {
      setOtpError(err.message);
    } finally {
      setGroupSubmitting(false);
    }
  }

  // Guard searches for a frequent visitor by phone
  async function handleFreqSearch(e) {
    e.preventDefault();
    if (!freqPhone.trim()) return;
    setFreqSearching(true); setFreqSearchError(""); setFreqResult(null); setFreqLogSuccess(null);
    try {
      const data = await apiRequest(`/freq-visitors/search?phone=${freqPhone.replace(/\D/g,"")}`, { token });
      setFreqResult(data.item);
    } catch (err) {
      setFreqSearchError(err.message);
    } finally {
      setFreqSearching(false);
    }
  }

  // Guard logs entry for a specific flat from the freq-visitor search result
  async function handleFreqLogEntry(freqId, flatNumber) {
    setFreqLoggingFlat(flatNumber);
    try {
      const data = await apiRequest(`/freq-visitors/${freqId}/log-entry`, {
        token, method: "POST", body: { flatNumber }
      });
      setVisitors(prev => [data.item, ...prev]);
      setFreqLogSuccess(data.item);
    } catch (err) {
      setFreqSearchError(err.message);
    } finally {
      setFreqLoggingFlat(null);
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

      {/* ── Real-time toast ── */}
      {responseToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white shadow-xl">
          {responseToast}
        </div>
      )}

      {/* ── Frequent Visitor Search Modal ── */}
      {showFreqModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="font-extrabold text-slate-900">Frequent Visitor</h2>
                <p className="text-xs text-slate-400 mt-0.5">Search by phone number</p>
              </div>
              <button onClick={() => setShowFreqModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 text-slate-400">
                <X size={16} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Search form */}
              <form onSubmit={handleFreqSearch} className="flex gap-2">
                <input
                  className={`${inputCls} flex-1`}
                  placeholder="Enter phone number…"
                  value={freqPhone}
                  onChange={e => setFreqPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  autoFocus
                />
                <button type="submit" disabled={freqSearching || !freqPhone.trim()}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5
                    text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-50">
                  {freqSearching ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
                </button>
              </form>

              {freqSearchError && (
                <div className="rounded-lg bg-rose-50 px-4 py-2.5 text-sm text-rose-700 ring-1 ring-rose-200">
                  {freqSearchError}
                </div>
              )}

              {/* Result card */}
              {freqResult && !freqLogSuccess && (
                <div className="space-y-3">
                  {/* Visitor identity */}
                  <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
                    {freqResult.photoUrl ? (
                      <img src={freqResult.photoUrl} alt={freqResult.name}
                        className="h-14 w-14 rounded-full object-cover ring-2 ring-slate-200 flex-shrink-0" />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xl font-black flex-shrink-0">
                        {freqResult.name[0]?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-slate-900">{freqResult.name}</p>
                      <p className="text-xs text-slate-500">{freqResult.phone}</p>
                      <span className="mt-1 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 capitalize">
                        {freqResult.relationship}
                      </span>
                      {freqResult.description && (
                        <p className="mt-0.5 text-xs text-slate-400">{freqResult.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Linked flats with schedule */}
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Linked Flats</p>
                  <div className="space-y-2">
                    {freqResult.links.map(link => {
                      const isOk       = link.scheduleStatus === "ok";
                      const wrongDay   = link.scheduleStatus === "wrong_day";
                      const wrongTime  = link.scheduleStatus === "wrong_time";
                      const dayLabels  = link.allowedDays.join(", ").toUpperCase();

                      return (
                        <div key={link.flatNumber}
                          className={`rounded-xl border p-3.5 ${isOk ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <p className="font-bold text-slate-900 text-sm">Flat {link.flatNumber}</p>
                              <p className="text-xs text-slate-500">{link.residentId?.fullName}</p>
                              <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                                <Clock size={11} />
                                <span>{dayLabels} · {link.allowedFrom}–{link.allowedUntil}</span>
                              </div>

                              {/* Schedule warning */}
                              {wrongDay && (
                                <div className="mt-1.5 flex items-center gap-1 text-xs text-amber-700 font-semibold">
                                  <AlertTriangle size={11} /> Not an allowed day
                                </div>
                              )}
                              {wrongTime && (
                                <div className="mt-1.5 flex items-center gap-1 text-xs text-amber-700 font-semibold">
                                  <AlertTriangle size={11} /> Outside allowed hours ({link.allowedFrom}–{link.allowedUntil})
                                </div>
                              )}
                              {isOk && (
                                <div className="mt-1.5 flex items-center gap-1 text-xs text-emerald-700 font-semibold">
                                  <CheckCircle2 size={11} /> Within allowed schedule
                                </div>
                              )}
                            </div>

                            <button
                              onClick={() => handleFreqLogEntry(freqResult._id, link.flatNumber)}
                              disabled={freqLoggingFlat === link.flatNumber}
                              className={`flex-shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-2
                                text-xs font-bold text-white transition disabled:opacity-50
                                ${isOk ? "bg-emerald-600 hover:bg-emerald-700" : "bg-amber-500 hover:bg-amber-600"}`}>
                              <LogIn size={12} />
                              {freqLoggingFlat === link.flatNumber ? "Logging…" : "Log Entry"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Success state */}
              {freqLogSuccess && (
                <div className="space-y-3">
                  <div className="rounded-xl bg-emerald-50 ring-1 ring-emerald-200 p-4 space-y-1">
                    <p className="text-sm font-bold text-emerald-800">
                      ✅ {freqLogSuccess.visitorName} has entered
                    </p>
                    <p className="text-xs text-emerald-700">
                      Flat {freqLogSuccess.flatNumber} · Visitor log updated · Resident notified
                    </p>
                  </div>
                  <button onClick={() => setShowFreqModal(false)}
                    className="w-full rounded-xl border border-slate-200 py-2.5 text-sm
                      font-semibold text-slate-600 transition hover:bg-slate-50">
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── OTP Verification Modal ── */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">

            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="font-extrabold text-slate-900">Verify Entry Pass</h2>
                <p className="text-xs text-slate-400 mt-0.5">Ask the visitor for their 6-digit OTP</p>
              </div>
              <button onClick={() => setShowOtpModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 text-slate-400">
                <X size={16} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {otpError && (
                <div className="rounded-lg bg-rose-50 px-4 py-2.5 text-sm text-rose-700 ring-1 ring-rose-200">
                  {otpError}
                </div>
              )}

              {/* ── SUCCESS ── */}
              {otpSuccess && (
                <div className="space-y-3">
                  <div className="rounded-xl bg-emerald-50 ring-1 ring-emerald-200 p-4 space-y-1">
                    <p className="text-sm font-bold text-emerald-800">
                      ✅ {otpSuccess.visitorName} has entered
                    </p>
                    <p className="text-xs text-emerald-700">
                      Flat {otpSuccess.flatNumber} · {otpSuccess.purpose}
                      {otpSuccess.visitorPhone ? ` · ${otpSuccess.visitorPhone}` : ""}
                    </p>
                    <p className="text-xs text-emerald-600 mt-1">Visitor log updated automatically.</p>
                  </div>
                  <button onClick={() => setShowOtpModal(false)}
                    className="w-full rounded-xl border border-slate-200 py-2.5 text-sm
                      font-semibold text-slate-600 transition hover:bg-slate-50">
                    Close
                  </button>
                </div>
              )}

              {/* ── STEP 2 — Group pass: enter visitor name ── */}
              {!otpSuccess && groupPassInfo && (
                <form onSubmit={handleGroupPassConfirm} className="space-y-4">
                  {/* Show event info so guard knows what they're dealing with */}
                  <div className="rounded-xl bg-purple-50 ring-1 ring-purple-200 p-4 space-y-2">
                    <p className="text-sm font-bold text-purple-900">🎉 Group Pass Found</p>
                    <p className="text-sm text-purple-800 font-semibold">{groupPassInfo.eventName}</p>
                    <p className="text-xs text-purple-700">
                      Resident: {groupPassInfo.residentName}
                    </p>
                    {/* Usage progress bar */}
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-xs text-purple-700">
                        <span>{groupPassInfo.usedCount} of {groupPassInfo.maxUses} guests used</span>
                        <span className="font-bold">{groupPassInfo.spotsLeft} spots left</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-purple-200">
                        <div
                          className="h-1.5 rounded-full bg-purple-600 transition-all"
                          style={{ width: `${Math.min(100, (groupPassInfo.usedCount / groupPassInfo.maxUses) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                      Guest Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      className={inputCls}
                      placeholder="Ask the visitor their name…"
                      value={groupVisitorName}
                      onChange={e => setGroupVisitorName(e.target.value)}
                      autoFocus
                    />
                    <p className="mt-1.5 text-xs text-slate-400">
                      This gets logged in the event's guest list.
                    </p>
                  </div>

                  <button type="submit" disabled={groupSubmitting || !groupVisitorName.trim()}
                    className="w-full flex items-center justify-center gap-2 rounded-xl
                      bg-purple-600 px-5 py-2.5 text-sm font-bold text-white
                      transition hover:bg-purple-700 disabled:opacity-50">
                    <LogIn size={15} />
                    {groupSubmitting ? "Logging…" : "Confirm Entry"}
                  </button>

                  <button type="button"
                    onClick={() => { setGroupPassInfo(null); setOtpValue(""); }}
                    className="w-full rounded-xl border border-slate-200 py-2 text-sm
                      font-semibold text-slate-500 transition hover:bg-slate-50">
                    ← Back
                  </button>
                </form>
              )}

              {/* ── STEP 1 — Enter OTP ── */}
              {!otpSuccess && !groupPassInfo && (
                <form onSubmit={handleOtpVerify} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                      6-Digit OTP
                    </label>
                    <input
                      className={`${inputCls} text-center text-2xl font-black tracking-[0.4em]`}
                      placeholder="······"
                      maxLength={6}
                      value={otpValue}
                      onChange={e => setOtpValue(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      autoFocus
                    />
                    <p className="mt-1.5 text-xs text-slate-400">
                      Works for both individual passes and group event passes.
                    </p>
                  </div>
                  <button type="submit" disabled={otpLoading || otpValue.length < 6}
                    className="w-full flex items-center justify-center gap-2 rounded-xl
                      bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white
                      transition hover:bg-emerald-700 disabled:opacity-50">
                    <KeyRound size={15} />
                    {otpLoading ? "Checking…" : "Verify OTP"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Visitor Log</h1>
          <p className="mt-0.5 text-sm text-slate-500">{today}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Sync
          </button>
          <button onClick={() => { setShowFreqModal(true); setFreqPhone(""); setFreqResult(null); setFreqSearchError(""); setFreqLogSuccess(null); }}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700">
            <Users size={15} />
            Frequent Visitor
          </button>
          <button onClick={() => { setShowOtpModal(true); setOtpValue(""); setOtpError(""); setOtpSuccess(null); }}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700">
            <KeyRound size={15} />
            Verify OTP
          </button>
          <button onClick={() => { setShowForm(v => !v); setFormError(""); }}
            className="flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-orange-700">
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
        <StatCard emoji="👥" label="Total Today" value={visitors.length} color="slate"   />
        <StatCard emoji="⏳" label="Pending"     value={pendingCount}    color="amber"   />
        <StatCard emoji="🟢" label="Inside"      value={insideCount}     color="orange"  />
        <StatCard emoji="✅" label="Exited"      value={exitedCount}     color="emerald" />
      </div>

      {/* ── Request Entry Form ── */}
      {showForm && (
        <div className="rounded-2xl border border-orange-100 bg-orange-50 p-6">
          <h2 className="mb-1 text-base font-bold text-slate-900">New Visitor Request</h2>
          <p className="mb-4 text-xs text-slate-500">
            The resident receives an instant notification and must approve before the visitor enters.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="rounded-lg bg-rose-50 px-4 py-2.5 text-sm text-rose-700 ring-1 ring-rose-200">
                {formError}
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

            {/* Row 2: Flat dropdown (auto-fills resident name) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Visiting Flat <span className="text-rose-500">*</span>
                </label>
                <FlatDropdown
                  flats={flats}
                  value={form.flatNumber}
                  onChange={handleFlatSelect}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Resident Name
                  <span className="ml-1 text-slate-400 font-normal">(auto-filled)</span>
                </label>
                <input
                  className={`${inputCls} bg-slate-50 text-slate-500`}
                  placeholder="Auto-filled when flat is selected"
                  value={form.residentName}
                  readOnly
                />
              </div>
            </div>

            {/* Purpose selector */}
            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-600">Purpose</label>
              <div className="grid grid-cols-4 gap-2">
                {PURPOSE_OPTIONS.map(p => (
                  <button key={p.value} type="button"
                    onClick={() => setForm(prev => ({ ...prev, purpose: p.value }))}
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

            {/* Vehicle number */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Vehicle Number</label>
              <input className={inputCls} placeholder="e.g. KA01AB1234 (optional)"
                value={form.vehicleNumber} onChange={field("vehicleNumber")} />
            </div>

            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={submitting}
                className="flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-orange-700 disabled:opacity-60">
                <LogIn size={15} />
                {submitting ? "Sending…" : "Send Request"}
              </button>
              <button type="button" onClick={() => { setShowForm(false); resetForm(); setFormError(""); }}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
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
            {visitors.map(v => {
              const approval    = APPROVAL_STYLE[v.approvalStatus] || APPROVAL_STYLE.pending;
              const purposeEmoji = PURPOSE_OPTIONS.find(p => p.value === v.purpose)?.emoji || "👤";

              return (
                <div key={v._id} className="flex items-center justify-between gap-4 px-6 py-4">
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

                    <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${approval.cls}`}>
                      {approval.label}
                    </span>

                    {v.status === "inside" && (
                      <button onClick={() => handleExit(v._id)} disabled={exitingId === v._id}
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50">
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
