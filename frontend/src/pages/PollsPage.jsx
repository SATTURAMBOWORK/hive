import { useCallback, useEffect, useState } from "react";
import {
  Plus, X, RefreshCw, CheckCircle2, Clock,
  BarChart2, Trash2, Lock, Users
} from "lucide-react";
import { useAuth } from "../components/AuthContext";
import { apiRequest } from "../components/api";
import { getSocket } from "../components/socket";

// ── Constants ────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 " +
  "placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none " +
  "focus:ring-1 focus:ring-emerald-500 text-sm transition-colors";

function fmtDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function timeLeft(endsAt) {
  if (!endsAt) return null;
  const diff = new Date(endsAt) - Date.now();
  if (diff <= 0) return "Ended";
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h left`;
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m left`;
  return `${m}m left`;
}

// ── Vote Progress Bar ────────────────────────────────────────────
function VoteBar({ option, totalVotes, isMyChoice }) {
  const pct = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;

  return (
    <div className={`rounded-xl border p-3.5 transition-all ${
      isMyChoice
        ? "border-emerald-300 bg-emerald-50"
        : "border-slate-200 bg-white"
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isMyChoice && <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />}
          <span className="text-sm font-semibold text-slate-800">{option.text}</span>
        </div>
        <span className="text-sm font-black text-slate-700">{pct}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${isMyChoice ? "bg-emerald-500" : "bg-slate-300"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs text-slate-400">{option.votes} vote{option.votes !== 1 ? "s" : ""}</p>
    </div>
  );
}

// ── Poll Card ─────────────────────────────────────────────────────
function PollCard({ poll, onVote, onClose, onDelete, voting, closing, deleting }) {
  const { user } = useAuth();
  const isCommittee = user?.role === "committee" || user?.role === "super_admin";

  const hasVoted   = poll.myVote !== null;
  const isOpen     = poll.isOpen;
  const myVoteSet  = new Set((poll.myVote || []).map(String));
  const [selected, setSelected] = useState([]);

  // Reset selection when poll changes
  useEffect(() => { setSelected([]); }, [poll._id]);

  function toggleOption(optId) {
    if (poll.allowMultiple) {
      setSelected(prev =>
        prev.includes(optId) ? prev.filter(x => x !== optId) : [...prev, optId]
      );
    } else {
      setSelected([optId]);
    }
  }

  const timeStr = timeLeft(poll.endsAt);
  const showResults = hasVoted || !isOpen;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {isOpen ? (
                <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </span>
              ) : (
                <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-500">
                  <Lock size={10} /> Closed
                </span>
              )}
              {poll.allowMultiple && (
                <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-bold text-violet-700">
                  Multi-choice
                </span>
              )}
            </div>
            <h3 className="text-base font-black text-slate-900">{poll.title}</h3>
            {poll.description && (
              <p className="mt-1 text-sm text-slate-500">{poll.description}</p>
            )}
          </div>

          {/* Committee actions */}
          {isCommittee && (
            <div className="flex items-center gap-1.5 shrink-0">
              {isOpen && (
                <button
                  onClick={() => onClose(poll._id)}
                  disabled={closing === poll._id}
                  className="flex items-center gap-1 rounded-lg border border-amber-200 px-2.5 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50 transition disabled:opacity-50"
                >
                  <Lock size={11} />
                  {closing === poll._id ? "…" : "Close"}
                </button>
              )}
              <button
                onClick={() => onDelete(poll._id)}
                disabled={deleting === poll._id}
                className="flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition disabled:opacity-50"
              >
                <Trash2 size={11} />
                {deleting === poll._id ? "…" : "Delete"}
              </button>
            </div>
          )}
        </div>

        {/* Meta */}
        <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Users size={11} />
            {poll.totalVotes} vote{poll.totalVotes !== 1 ? "s" : ""}
          </span>
          {timeStr && (
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {timeStr}
            </span>
          )}
          <span>by {poll.createdBy?.fullName || "Committee"}</span>
        </div>
      </div>

      {/* Options */}
      <div className="px-6 py-5 space-y-2.5">
        {showResults ? (
          // ── Results view — show progress bars ──
          <>
            {poll.options.map(opt => (
              <VoteBar
                key={opt._id}
                option={opt}
                totalVotes={poll.totalVotes}
                isMyChoice={myVoteSet.has(String(opt._id))}
              />
            ))}
            {hasVoted && (
              <p className="pt-1 text-center text-xs text-emerald-600 font-semibold">
                ✓ Your vote has been recorded
              </p>
            )}
          </>
        ) : (
          // ── Voting view — show selectable options ──
          <>
            <p className="text-xs text-slate-400 mb-3">
              {poll.allowMultiple ? "Select all that apply" : "Select one option"}
            </p>
            {poll.options.map(opt => {
              const isSelected = selected.includes(String(opt._id));
              return (
                <button
                  key={opt._id}
                  onClick={() => toggleOption(String(opt._id))}
                  className={`w-full text-left rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${
                    isSelected
                      ? "border-emerald-400 bg-emerald-50 text-emerald-800 shadow-sm"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected ? "border-emerald-500 bg-emerald-500" : "border-slate-300"
                    }`}>
                      {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </div>
                    {opt.text}
                  </div>
                </button>
              );
            })}

            <button
              onClick={() => onVote(poll._id, selected)}
              disabled={selected.length === 0 || voting === poll._id}
              className="mt-3 w-full rounded-xl bg-emerald-600 py-3 text-sm font-black text-white shadow-sm hover:bg-emerald-500 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {voting === poll._id ? "Submitting…" : "Submit Vote"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Create Poll Modal ─────────────────────────────────────────────
function CreatePollModal({ onClose, onCreated }) {
  const { token } = useAuth();
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState(null);
  const [title, setTitle]     = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [endsAt, setEndsAt]   = useState("");

  function addOption() {
    if (options.length < 10) setOptions(o => [...o, ""]);
  }

  function removeOption(i) {
    if (options.length <= 2) return;
    setOptions(o => o.filter((_, idx) => idx !== i));
  }

  function updateOption(i, value) {
    setOptions(o => o.map((v, idx) => idx === i ? value : v));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const cleanOptions = options.map(o => o.trim()).filter(Boolean);
    if (cleanOptions.length < 2) {
      setError("Add at least 2 non-empty options");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const data = await apiRequest("/polls", {
        method: "POST",
        body: {
          title: title.trim(),
          description: description.trim(),
          options: cleanOptions,
          allowMultiple,
          endsAt: endsAt || undefined,
        },
        token,
      });
      onCreated(data.item);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="font-black text-slate-900">Create Poll</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100 transition">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Question</label>
            <input
              required
              className={inputCls}
              placeholder="e.g. Which day should we hold the AGM?"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Description <span className="font-normal normal-case text-slate-400">(optional)</span></label>
            <textarea
              rows={2}
              className={inputCls}
              placeholder="Add context for residents…"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          {/* Options */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Options</label>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    className={inputCls}
                    placeholder={`Option ${i + 1}`}
                    value={opt}
                    onChange={e => updateOption(i, e.target.value)}
                  />
                  {options.length > 2 && (
                    <button type="button" onClick={() => removeOption(i)}
                      className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition">
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 10 && (
              <button type="button" onClick={addOption}
                className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition">
                <Plus size={13} /> Add option
              </button>
            )}
          </div>

          {/* Allow multiple */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setAllowMultiple(v => !v)}
              className={`h-5 w-9 rounded-full transition-all relative ${allowMultiple ? "bg-emerald-500" : "bg-slate-200"}`}
            >
              <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${allowMultiple ? "left-4" : "left-0.5"}`} />
            </div>
            <span className="text-sm font-semibold text-slate-700">Allow multiple choices</span>
          </label>

          {/* Deadline */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Deadline <span className="font-normal normal-case text-slate-400">(optional)</span></label>
            <input
              type="datetime-local"
              className={inputCls}
              value={endsAt}
              onChange={e => setEndsAt(e.target.value)}
              min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
            />
          </div>

          {error && (
            <p className="rounded-xl bg-rose-50 border border-rose-100 px-4 py-2.5 text-sm text-rose-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-black text-white shadow-sm hover:bg-emerald-500 transition disabled:opacity-50"
          >
            {saving ? "Creating…" : "Create Poll"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────
export function PollsPage() {
  const { user, token } = useAuth();
  const isCommittee = user?.role === "committee" || user?.role === "super_admin";

  const [polls,    setPolls]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [tab,      setTab]      = useState("active");
  const [showCreate, setShowCreate] = useState(false);

  // Action states
  const [voting,   setVoting]   = useState(null);
  const [closing,  setClosing]  = useState(null);
  const [deleting, setDeleting] = useState(null);

  // ── Fetch polls ────────────────────────────────────────────────
  const fetchPolls = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest(`/polls?status=${tab}`, { token });
      setPolls(data.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, tab]);

  useEffect(() => { fetchPolls(); }, [fetchPolls]);

  // ── Real-time socket ───────────────────────────────────────────
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // New poll created → prepend if active tab
    function onPollCreated(poll) {
      if (tab === "active") setPolls(prev => [poll, ...prev]);
    }

    // Vote cast or poll closed → update in place
    function onPollUpdated(poll) {
      setPolls(prev => prev.map(p => p._id === poll._id ? { ...poll, myVote: p.myVote } : p));
    }

    // Poll deleted → remove from list
    function onPollDeleted({ pollId }) {
      setPolls(prev => prev.filter(p => p._id !== pollId));
    }

    socket.on("poll:created", onPollCreated);
    socket.on("poll:updated", onPollUpdated);
    socket.on("poll:deleted", onPollDeleted);

    return () => {
      socket.off("poll:created", onPollCreated);
      socket.off("poll:updated", onPollUpdated);
      socket.off("poll:deleted", onPollDeleted);
    };
  }, [tab]);

  // ── Actions ────────────────────────────────────────────────────
  async function handleVote(pollId, optionIds) {
    if (optionIds.length === 0) return;
    setVoting(pollId);
    try {
      const data = await apiRequest(`/polls/${pollId}/vote`, {
        method: "POST",
        body: { optionIds },
        token,
      });
      // Update poll in list with fresh data + preserve myVote
      setPolls(prev => prev.map(p => p._id === pollId ? data.item : p));
    } catch (err) {
      alert(err.message);
    } finally {
      setVoting(null);
    }
  }

  async function handleClose(pollId) {
    if (!confirm("Close this poll? Residents won't be able to vote anymore.")) return;
    setClosing(pollId);
    try {
      const data = await apiRequest(`/polls/${pollId}/close`, { method: "PATCH", token });
      // Move to closed — remove from active list
      setPolls(prev => prev.filter(p => p._id !== pollId));
    } catch (err) {
      alert(err.message);
    } finally {
      setClosing(null);
    }
  }

  async function handleDelete(pollId) {
    if (!confirm("Delete this poll permanently? All votes will be lost.")) return;
    setDeleting(pollId);
    try {
      await apiRequest(`/polls/${pollId}`, { method: "DELETE", token });
      setPolls(prev => prev.filter(p => p._id !== pollId));
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(null);
    }
  }

  function handleCreated(newPoll) {
    setShowCreate(false);
    if (tab === "active") setPolls(prev => [newPoll, ...prev]);
  }

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Polls & Voting</h1>
          <p className="text-sm text-slate-500 mt-0.5">Community decisions, made together</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchPolls} className="rounded-xl border border-slate-200 p-2.5 hover:bg-slate-50 transition text-slate-500">
            <RefreshCw size={16} />
          </button>
          {isCommittee && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-500 transition"
            >
              <Plus size={16} /> New Poll
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl bg-slate-100 p-1 w-fit">
        {["active", "closed"].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 text-sm font-bold rounded-xl capitalize transition-all ${
              tab === t ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-20 text-center text-sm text-slate-400">Loading…</div>
      ) : error ? (
        <div className="rounded-2xl bg-rose-50 border border-rose-100 px-5 py-4 text-sm text-rose-600">{error}</div>
      ) : polls.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 py-20 text-center">
          <BarChart2 size={32} className="mx-auto mb-3 text-slate-300" />
          <p className="font-bold text-slate-700">
            {tab === "active" ? "No active polls" : "No closed polls"}
          </p>
          <p className="text-sm text-slate-400 mt-1">
            {tab === "active" && isCommittee
              ? "Create a poll to gather your community's opinion."
              : "Check back later."}
          </p>
          {tab === "active" && isCommittee && (
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-500 transition"
            >
              <Plus size={16} /> Create First Poll
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {polls.map(poll => (
            <PollCard
              key={poll._id}
              poll={poll}
              onVote={handleVote}
              onClose={handleClose}
              onDelete={handleDelete}
              voting={voting}
              closing={closing}
              deleting={deleting}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <CreatePollModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />
      )}
    </div>
  );
}
