import { useCallback, useEffect, useState } from "react";
import {
  Search, LogIn, LogOut, RefreshCw, X, Clock,
  AlertTriangle, CheckCircle2, UserCheck, Ban, Hash
} from "lucide-react";
import { useAuth } from "../components/AuthContext";
import { apiRequest } from "../components/api";

// ── Constants ────────────────────────────────────────────────────

const CATEGORY_EMOJI = {
  maid: "🧹", cook: "👨‍🍳", driver: "🚗",
  security: "💂", nanny: "👶", gardener: "🌿", other: "👤",
};

const ALL_DAYS = [
  { key: "sun", label: "Su" }, { key: "mon", label: "Mo" },
  { key: "tue", label: "Tu" }, { key: "wed", label: "We" },
  { key: "thu", label: "Th" }, { key: "fri", label: "Fr" },
  { key: "sat", label: "Sa" },
];

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 " +
  "placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none " +
  "focus:ring-1 focus:ring-emerald-500 text-sm transition-colors";

function fmtTime(d) {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function fmtElapsed(d) {
  if (!d) return "";
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 60) return `${mins}m inside`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m inside`;
}

// ── Schedule Status Badge ────────────────────────────────────────
function ScheduleBadge({ status }) {
  if (status === "ok") return (
    <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
      <CheckCircle2 size={10} /> On time
    </span>
  );
  if (status === "wrong_day") return (
    <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
      <AlertTriangle size={10} /> Wrong day
    </span>
  );
  if (status === "wrong_time") return (
    <span className="flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-700">
      <Clock size={10} /> Off-hours
    </span>
  );
  return null;
}

// ── Staff Result Card (search/code result) ───────────────────────
function StaffResultCard({ staff, onLogEntry }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Staff identity */}
      <div className="flex items-center gap-4 px-5 py-4 border-b border-slate-100">
        {staff.photoUrl
          ? <img src={staff.photoUrl} alt={staff.name} className="h-12 w-12 rounded-full object-cover shrink-0" />
          : <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl shrink-0">
              {CATEGORY_EMOJI[staff.category] || "👤"}
            </div>
        }
        <div className="flex-1">
          <p className="font-bold text-slate-900">{staff.name}</p>
          <p className="text-xs text-slate-500 capitalize">{staff.category} · {staff.phone}</p>
        </div>
        <div className="text-xs font-mono bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">
          {staff.staffCode}
        </div>
      </div>

      {/* Assignments */}
      <div className="divide-y divide-slate-50">
        {staff.assignments?.map((a, i) => {
          const isBlocked  = a.blocked;
          const isOnLeave  = a.onLeave;
          const activeDays = ALL_DAYS.filter(d => a.allowedDays?.includes(d.key)).map(d => d.label).join(" ");

          return (
            <div key={i} className={`px-5 py-3.5 ${isBlocked ? "opacity-50" : ""}`}>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{a.flatNumber}</p>
                  <p className="text-xs text-slate-500">{a.residentId?.fullName || "—"}</p>
                </div>
                <div className="flex flex-wrap gap-1.5 items-center">
                  {isBlocked && (
                    <span className="flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-600">
                      <Ban size={10} /> Blocked
                    </span>
                  )}
                  {isOnLeave && !isBlocked && (
                    <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                      <Clock size={10} /> On Leave
                    </span>
                  )}
                  {!isBlocked && !isOnLeave && <ScheduleBadge status={a.scheduleStatus} />}
                </div>
              </div>

              <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                <span>{activeDays || "No days set"}</span>
                <span className="text-slate-300">·</span>
                <span>{a.allowedFrom} – {a.allowedUntil}</span>
              </div>

              {!isBlocked && !isOnLeave && (
                <button
                  onClick={() => onLogEntry(staff, a)}
                  className="mt-3 flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition"
                >
                  <LogIn size={13} /> Log Entry — Flat {a.flatNumber}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Confirm Entry Modal ──────────────────────────────────────────
function ConfirmEntryModal({ staff, assignment, onClose, onDone }) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);
  const [error,   setError]   = useState(null);

  async function confirm() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest(`/staff/${staff._id}/log-entry`, {
        method: "POST",
        body: { flatNumber: assignment.flatNumber },
        token,
      });
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="font-black text-slate-900">Confirm Staff Entry</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100 transition">
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {!result ? (
            <>
              <div className="flex items-center gap-4 mb-5">
                {staff.photoUrl
                  ? <img src={staff.photoUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
                  : <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">{CATEGORY_EMOJI[staff.category] || "👤"}</div>
                }
                <div>
                  <p className="font-black text-slate-900 text-lg">{staff.name}</p>
                  <p className="text-sm text-slate-500 capitalize">{staff.category}</p>
                  <p className="text-sm font-semibold text-emerald-700">Flat {assignment.flatNumber}</p>
                </div>
              </div>

              {assignment.scheduleStatus !== "ok" && (
                <div className="mb-4 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-700 flex items-start gap-2">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  <span>
                    {assignment.scheduleStatus === "wrong_day"
                      ? "This staff is not scheduled for today."
                      : `This staff is outside allowed hours (${assignment.allowedFrom}–${assignment.allowedUntil}).`
                    } Entry will still be logged with a warning.
                  </span>
                </div>
              )}

              {error && (
                <p className="mb-4 rounded-xl bg-rose-50 border border-rose-100 px-4 py-2.5 text-sm text-rose-600">{error}</p>
              )}

              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
                  Cancel
                </button>
                <button
                  onClick={confirm}
                  disabled={loading}
                  className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  {loading ? "Logging…" : "Confirm Entry"}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mx-auto mb-4">
                <CheckCircle2 size={32} className="text-emerald-600" />
              </div>
              <p className="font-black text-slate-900 text-lg">Entry Logged</p>
              <p className="text-sm text-slate-500 mt-1">{staff.name} entered at {fmtTime(result.item?.entryTime)}</p>
              {result.warning && (
                <p className="mt-3 rounded-xl bg-amber-50 border border-amber-100 px-4 py-2 text-xs text-amber-700">
                  ⚠️ {result.warning}
                </p>
              )}
              <button onClick={onDone} className="mt-5 w-full rounded-xl bg-slate-900 py-2.5 text-sm font-bold text-white hover:bg-slate-700 transition">
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Pending Exits Panel ──────────────────────────────────────────
function PendingExitsPanel({ items, onMarkExit, marking }) {
  if (items.length === 0) return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-8 text-center">
      <CheckCircle2 size={28} className="mx-auto mb-2 text-emerald-400" />
      <p className="text-sm font-semibold text-slate-600">All clear — no pending exits</p>
    </div>
  );

  return (
    <div className="space-y-2">
      {items.map(entry => (
        <div key={entry._id} className="flex items-center gap-4 rounded-2xl border border-amber-100 bg-amber-50 px-5 py-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-xl shrink-0">
            {CATEGORY_EMOJI[entry.staffId?.category] || "👤"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 text-sm truncate">{entry.staffId?.name}</p>
            <p className="text-xs text-slate-500">{entry.flatNumber} · {fmtElapsed(entry.entryTime)}</p>
          </div>
          <button
            onClick={() => onMarkExit(entry)}
            disabled={marking === entry._id}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-700 transition disabled:opacity-50 shrink-0"
          >
            <LogOut size={13} />
            {marking === entry._id ? "…" : "Mark Exit"}
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Toggle Leave Modal ───────────────────────────────────────────
function ToggleLeaveModal({ staff, assignment, onClose, onDone }) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function confirm() {
    setLoading(true);
    setError(null);
    try {
      await apiRequest(`/staff/${staff._id}/toggle-leave`, {
        method: "PATCH",
        body: { flatNumber: assignment.flatNumber },
        token,
      });
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const willBe = !assignment.onLeave; // what it will become after toggle

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="font-black text-slate-900">Toggle Leave</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-700">
            {willBe
              ? <>Mark <strong>{staff.name}</strong> as <span className="text-amber-600 font-semibold">on leave</span> for flat {assignment.flatNumber}? Resident will be notified.</>
              : <>Remove leave for <strong>{staff.name}</strong> at flat {assignment.flatNumber}? They can enter again today.</>
            }
          </p>
          {error && <p className="rounded-xl bg-rose-50 border border-rose-100 px-4 py-2.5 text-sm text-rose-600">{error}</p>}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">Cancel</button>
            <button
              onClick={confirm}
              disabled={loading}
              className={`flex-1 rounded-xl py-2.5 text-sm font-bold text-white transition disabled:opacity-50 ${willBe ? "bg-amber-500 hover:bg-amber-600" : "bg-emerald-600 hover:bg-emerald-700"}`}
            >
              {loading ? "…" : willBe ? "Mark On Leave" : "Remove Leave"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  Main Guard Page
// ══════════════════════════════════════════════════════════════════
export function StaffGatePage() {
  const { token } = useAuth();

  // Expected Today
  const [expected,        setExpected]        = useState([]);
  const [expectedLoading, setExpectedLoading] = useState(true);

  // Pending exits
  const [pending,         setPending]         = useState([]);
  const [pendingLoading,  setPendingLoading]  = useState(true);
  const [marking,         setMarking]         = useState(null);

  // Search
  const [searchQuery,  setSearchQuery]  = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [searching,    setSearching]    = useState(false);

  // Staff code lookup
  const [codeInput,   setCodeInput]   = useState("");
  const [codeResult,  setCodeResult]  = useState(null);
  const [codeLooking, setCodeLooking] = useState(false);
  const [codeError,   setCodeError]   = useState(null);

  // Entry modal
  const [entryModal, setEntryModal] = useState(null); // { staff, assignment }

  // Leave modal
  const [leaveModal, setLeaveModal] = useState(null); // { staff, assignment }

  // ── Data fetching ──────────────────────────────────────────────
  const fetchExpected = useCallback(async () => {
    setExpectedLoading(true);
    try {
      const data = await apiRequest("/staff/expected-today", { token });
      setExpected(data.items || []);
    } catch (_err) {
    } finally {
      setExpectedLoading(false);
    }
  }, [token]);

  const fetchPending = useCallback(async () => {
    setPendingLoading(true);
    try {
      const data = await apiRequest("/staff/entries/pending-exits", { token });
      setPending(data.items || []);
    } catch (_err) {
    } finally {
      setPendingLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchExpected();
    fetchPending();
  }, [fetchExpected, fetchPending]);

  // ── Search by name/phone ───────────────────────────────────────
  async function handleSearch(e) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchResult([]);
    try {
      const data = await apiRequest(`/staff/search?q=${encodeURIComponent(searchQuery.trim())}`, { token });
      setSearchResult(data.items || []);
    } catch (_err) {
    } finally {
      setSearching(false);
    }
  }

  // ── Lookup by staff code ───────────────────────────────────────
  async function handleCodeLookup(e) {
    e.preventDefault();
    if (!codeInput.trim()) return;
    setCodeLooking(true);
    setCodeResult(null);
    setCodeError(null);
    try {
      const data = await apiRequest(`/staff/by-code/${codeInput.trim().toUpperCase()}`, { token });
      setCodeResult(data.item);
    } catch (err) {
      setCodeError(err.message || "Staff not found");
    } finally {
      setCodeLooking(false);
    }
  }

  // ── Mark exit ─────────────────────────────────────────────────
  async function handleMarkExit(entry) {
    setMarking(entry._id);
    try {
      await apiRequest(`/staff/entries/${entry._id}/exit`, { method: "PATCH", token });
      setPending(prev => prev.filter(e => e._id !== entry._id));
      // refresh expected to update alreadyIn flags
      fetchExpected();
    } catch (err) {
      alert(err.message);
    } finally {
      setMarking(null);
    }
  }

  // After entry logged — refresh expected + pending
  function handleEntryDone() {
    setEntryModal(null);
    setSearchResult([]);
    setCodeResult(null);
    setSearchQuery("");
    setCodeInput("");
    fetchExpected();
    fetchPending();
  }

  // After leave toggled
  function handleLeaveDone() {
    setLeaveModal(null);
    fetchExpected();
  }

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-8">

      {/* Page header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Staff Gate Log</h1>
          <p className="text-sm text-slate-500 mt-0.5">Log staff entries and exits</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { fetchExpected(); fetchPending(); }} className="rounded-xl border border-slate-200 p-2.5 hover:bg-slate-50 transition text-slate-500">
            <RefreshCw size={16} />
          </button>
          {pending.length > 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2">
              <AlertTriangle size={15} className="text-amber-600" />
              <span className="text-sm font-bold text-amber-700">{pending.length} pending exit{pending.length > 1 ? "s" : ""}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Section 1: Search by name/phone ───────────────────── */}
      <section>
        <h2 className="text-sm font-black text-slate-500 uppercase tracking-wide mb-3">Search Staff</h2>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            className={inputCls}
            placeholder="Search by name or phone…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <button
            type="submit"
            disabled={searching}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-700 transition disabled:opacity-50 shrink-0"
          >
            <Search size={15} />
            {searching ? "…" : "Search"}
          </button>
        </form>

        {searchResult.length > 0 && (
          <div className="mt-4 space-y-3">
            {searchResult.map(staff => (
              <StaffResultCard
                key={staff._id}
                staff={staff}
                onLogEntry={(s, a) => setEntryModal({ staff: s, assignment: a })}
              />
            ))}
          </div>
        )}
        {searching && (
          <p className="mt-4 text-center text-sm text-slate-400">Searching…</p>
        )}
        {!searching && searchQuery && searchResult.length === 0 && (
          <p className="mt-4 text-center text-sm text-slate-400">No staff found for "{searchQuery}"</p>
        )}
      </section>

      {/* ── Section 2: Lookup by Staff Code ───────────────────── */}
      <section>
        <h2 className="text-sm font-black text-slate-500 uppercase tracking-wide mb-3">Scan / Enter Staff Code</h2>
        <p className="text-xs text-slate-400 mb-3">Guard scans the QR on the staff card — the code is shown below for manual fallback.</p>
        <form onSubmit={handleCodeLookup} className="flex gap-2">
          <input
            className={`${inputCls} font-mono uppercase tracking-widest`}
            placeholder="e.g. A1B2C3"
            value={codeInput}
            onChange={e => setCodeInput(e.target.value.toUpperCase())}
            maxLength={6}
          />
          <button
            type="submit"
            disabled={codeLooking}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-700 transition disabled:opacity-50 shrink-0"
          >
            <Hash size={15} />
            {codeLooking ? "…" : "Lookup"}
          </button>
        </form>

        {codeError && (
          <p className="mt-3 rounded-xl bg-rose-50 border border-rose-100 px-4 py-2.5 text-sm text-rose-600">{codeError}</p>
        )}

        {codeResult && (
          <div className="mt-4">
            <StaffResultCard
              staff={codeResult}
              onLogEntry={(s, a) => setEntryModal({ staff: s, assignment: a })}
            />
          </div>
        )}
      </section>

      {/* ── Section 3: Pending Exits ───────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-black text-slate-500 uppercase tracking-wide">Pending Exits</h2>
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-black text-amber-700">
            {pending.length}
          </span>
        </div>
        {pendingLoading
          ? <p className="text-center text-sm text-slate-400 py-8">Loading…</p>
          : <PendingExitsPanel items={pending} onMarkExit={handleMarkExit} marking={marking} />
        }
      </section>

      {/* ── Section 4: Expected Today ──────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-black text-slate-500 uppercase tracking-wide">Expected Today</h2>
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-black text-emerald-700">
            {expected.length}
          </span>
        </div>
        {expectedLoading ? (
          <p className="text-center text-sm text-slate-400 py-8">Loading…</p>
        ) : expected.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-8">No staff expected today.</p>
        ) : (
          <div className="space-y-2">
            {expected.map(staff => (
              <div key={staff._id} className={`flex items-center gap-4 rounded-2xl border px-5 py-3.5 ${staff.alreadyIn ? "border-emerald-100 bg-emerald-50" : "border-slate-200 bg-white"}`}>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xl shrink-0">
                  {CATEGORY_EMOJI[staff.category] || "👤"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-sm truncate">{staff.name}</p>
                  <p className="text-xs text-slate-500 capitalize">
                    {staff.category} · {staff.assignments?.map(a => a.flatNumber).join(", ")}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  {staff.alreadyIn
                    ? <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700"><CheckCircle2 size={11} /> Inside</span>
                    : <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">Not arrived</span>
                  }
                  {/* Toggle leave quick action */}
                  {staff.assignments?.map((a, i) => (
                    !a.blocked && (
                      <button
                        key={i}
                        onClick={() => setLeaveModal({ staff, assignment: a })}
                        className={`text-xs font-semibold rounded-lg px-2.5 py-1 transition ${
                          a.onLeave
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                            : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                        }`}
                      >
                        {a.onLeave ? "Remove Leave" : "Mark Leave"}
                      </button>
                    )
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modals */}
      {entryModal && (
        <ConfirmEntryModal
          staff={entryModal.staff}
          assignment={entryModal.assignment}
          onClose={() => setEntryModal(null)}
          onDone={handleEntryDone}
        />
      )}
      {leaveModal && (
        <ToggleLeaveModal
          staff={leaveModal.staff}
          assignment={leaveModal.assignment}
          onClose={() => setLeaveModal(null)}
          onDone={handleLeaveDone}
        />
      )}
    </div>
  );
}
