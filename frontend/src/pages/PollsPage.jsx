import { useCallback, useEffect, useState } from "react";
import {
  Plus, X, RefreshCw, CheckCircle2, Clock,
  BarChart2, Trash2, Lock, Users
} from "lucide-react";
import { useAuth } from "../components/AuthContext";
import { apiRequest } from "../components/api";
import { getSocket } from "../components/socket";

/* ─── Design tokens ──────────────────────────────────────────── */
const T = {
  bg:          "#0a0907",
  surface:     "#111008",
  surfaceRaised: "#181510",
  border:      "rgba(200,145,74,0.12)",
  borderHover: "rgba(200,145,74,0.28)",
  gold:        "#c8914a",
  goldLight:   "#e8c47a",
  textPrimary: "#f5f0e8",
  textSecondary: "rgba(245,240,232,0.55)",
  textMuted:   "rgba(245,240,232,0.3)",
  green:       "#3d9e6e",
  red:         "#e85d5d",
  amber:       "#d4a843",
  blue:        "#4d8dd4",
};

/* ─── Injected CSS ───────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:wght@400;500;600&display=swap');

  .pp-card {
    background: rgba(17,16,8,0.8);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid ${T.border};
    border-radius: 16px;
    transition: border-color 0.25s, box-shadow 0.25s;
    overflow: hidden;
  }
  .pp-card:hover {
    border-color: ${T.borderHover};
    box-shadow: 0 4px 24px rgba(200,145,74,0.09);
  }
  .pp-input {
    width: 100%;
    background: #0f0e0b;
    border: 1px solid rgba(200,145,74,0.2);
    border-radius: 10px;
    padding: 10px 14px;
    color: ${T.textPrimary};
    font-family: 'DM Sans', sans-serif;
    font-size: 0.875rem;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-sizing: border-box;
  }
  .pp-input::placeholder { color: ${T.textMuted}; }
  .pp-input:focus {
    border-color: ${T.gold};
    box-shadow: 0 0 0 3px rgba(200,145,74,0.15);
  }
  .pp-btn-gold {
    display: flex; align-items: center; gap: 7px;
    background: linear-gradient(135deg, ${T.gold}, ${T.goldLight});
    color: #0a0907;
    border: none;
    border-radius: 10px;
    padding: 9px 18px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.84rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
  }
  .pp-btn-gold:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(200,145,74,0.35);
  }
  .pp-btn-gold:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }
  .pp-btn-ghost {
    display: flex; align-items: center; gap: 6px;
    background: none;
    border: 1px solid ${T.border};
    border-radius: 10px;
    padding: 8px 14px;
    color: ${T.textSecondary};
    font-family: 'DM Sans', sans-serif;
    font-size: 0.82rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .pp-btn-ghost:hover {
    border-color: ${T.borderHover};
    color: ${T.textPrimary};
    transform: translateY(-1px);
  }
  .pp-btn-danger {
    display: flex; align-items: center; gap: 5px;
    background: rgba(232,93,93,0.08);
    border: 1px solid rgba(232,93,93,0.25);
    border-radius: 8px;
    padding: 5px 11px;
    color: ${T.red};
    font-family: 'DM Sans', sans-serif;
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .pp-btn-danger:hover { background: rgba(232,93,93,0.15); transform: translateY(-1px); }
  .pp-btn-amber {
    display: flex; align-items: center; gap: 5px;
    background: rgba(212,168,67,0.08);
    border: 1px solid rgba(212,168,67,0.25);
    border-radius: 8px;
    padding: 5px 11px;
    color: ${T.amber};
    font-family: 'DM Sans', sans-serif;
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .pp-btn-amber:hover { background: rgba(212,168,67,0.15); transform: translateY(-1px); }
  .pp-option-btn {
    width: 100%;
    text-align: left;
    background: rgba(255,255,255,0.02);
    border: 1px solid ${T.border};
    border-radius: 10px;
    padding: 12px 16px;
    color: ${T.textSecondary};
    font-family: 'DM Sans', sans-serif;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex; align-items: center; gap: 12px;
  }
  .pp-option-btn:hover {
    border-color: ${T.borderHover};
    color: ${T.textPrimary};
  }
  .pp-option-btn.selected {
    border-color: ${T.gold};
    background: rgba(200,145,74,0.08);
    color: ${T.gold};
    box-shadow: 0 0 0 1px rgba(200,145,74,0.2);
  }
  .pp-tab {
    padding: 8px 20px;
    border-radius: 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.84rem;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: all 0.2s ease;
    color: ${T.textMuted};
    background: transparent;
    text-transform: capitalize;
  }
  .pp-tab.active {
    background: rgba(200,145,74,0.12);
    color: ${T.gold};
  }
  .pp-tab:hover:not(.active) { color: ${T.textSecondary}; }

  /* Pulse dot for active polls */
  @keyframes ppPulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.5; transform: scale(1.5); }
  }
  .pp-pulse { animation: ppPulse 1.5s ease-in-out infinite; }

  /* Skeleton */
  @keyframes ppSkeleton {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  .pp-skel {
    border-radius: 12px;
    background: linear-gradient(90deg, #181510 25%, #201c14 50%, #181510 75%);
    background-size: 200% 100%;
    animation: ppSkeleton 1.4s ease infinite;
  }

  /* Modal scrollbar */
  .pp-modal-body::-webkit-scrollbar { width: 4px; }
  .pp-modal-body::-webkit-scrollbar-track { background: transparent; }
  .pp-modal-body::-webkit-scrollbar-thumb { background: rgba(200,145,74,0.25); border-radius: 4px; }

  /* Toggle */
  .pp-toggle {
    width: 36px; height: 20px;
    border-radius: 10px;
    cursor: pointer;
    position: relative;
    transition: background 0.2s;
    flex-shrink: 0;
    border: none;
  }
  .pp-toggle-knob {
    position: absolute;
    top: 2px; height: 16px; width: 16px;
    border-radius: 50%;
    background: white;
    transition: left 0.2s;
    box-shadow: 0 1px 4px rgba(0,0,0,0.4);
  }
`;

/* ─── Helpers ────────────────────────────────────────────────── */
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

/* ─── Vote Progress Bar ──────────────────────────────────────── */
function VoteBar({ option, totalVotes, isMyChoice }) {
  const pct = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;

  return (
    <div style={{
      borderRadius: 10,
      border: `1px solid ${isMyChoice ? T.gold : T.border}`,
      background: isMyChoice ? "rgba(200,145,74,0.07)" : "rgba(255,255,255,0.02)",
      padding: "12px 14px",
      transition: "all 0.25s",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          {isMyChoice && <CheckCircle2 size={13} color={T.gold} />}
          <span style={{ fontSize: "0.875rem", fontWeight: 500, color: isMyChoice ? T.goldLight : T.textPrimary }}>
            {option.text}
          </span>
        </div>
        <span style={{ fontSize: "0.875rem", fontWeight: 700, color: isMyChoice ? T.gold : T.textSecondary }}>{pct}%</span>
      </div>
      <div style={{ height: 5, width: "100%", borderRadius: 4, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            borderRadius: 4,
            width: `${pct}%`,
            background: isMyChoice
              ? `linear-gradient(90deg, ${T.gold}, ${T.goldLight})`
              : "rgba(245,240,232,0.2)",
            transition: "width 0.7s ease",
          }}
        />
      </div>
      <p style={{ marginTop: 5, fontSize: "0.75rem", color: T.textMuted }}>
        {option.votes} vote{option.votes !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

/* ─── Poll Card ──────────────────────────────────────────────── */
function PollCard({ poll, onVote, onClose, onDelete, voting, closing, deleting }) {
  const { user } = useAuth();
  const isCommittee = user?.role === "committee" || user?.role === "super_admin";

  const hasVoted   = poll.myVote !== null;
  const isOpen     = poll.isOpen;
  const myVoteSet  = new Set((poll.myVote || []).map(String));
  const [selected, setSelected] = useState([]);

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
    <div className="pp-card">
      {/* Header */}
      <div style={{
        padding: "20px 22px",
        borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ flex: 1 }}>
            {/* Status badges */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
              {isOpen ? (
                <span style={{
                  display: "flex", alignItems: "center", gap: 5,
                  background: "rgba(61,158,110,0.12)",
                  border: "1px solid rgba(61,158,110,0.25)",
                  borderRadius: 100,
                  padding: "3px 10px",
                  fontSize: "0.72rem", fontWeight: 700, color: T.green,
                  letterSpacing: "0.04em",
                }}>
                  <span className="pp-pulse" style={{ width: 6, height: 6, borderRadius: "50%", background: T.green, display: "inline-block" }} />
                  ACTIVE
                </span>
              ) : (
                <span style={{
                  display: "flex", alignItems: "center", gap: 5,
                  background: "rgba(245,240,232,0.05)",
                  border: `1px solid ${T.border}`,
                  borderRadius: 100,
                  padding: "3px 10px",
                  fontSize: "0.72rem", fontWeight: 700, color: T.textMuted,
                  letterSpacing: "0.04em",
                }}>
                  <Lock size={9} /> CLOSED
                </span>
              )}
              {poll.allowMultiple && (
                <span style={{
                  background: "rgba(77,141,212,0.1)",
                  border: "1px solid rgba(77,141,212,0.2)",
                  borderRadius: 100,
                  padding: "3px 10px",
                  fontSize: "0.72rem", fontWeight: 700, color: T.blue,
                  letterSpacing: "0.04em",
                }}>
                  MULTI-CHOICE
                </span>
              )}
            </div>
            <h3 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "1.15rem", fontWeight: 600,
              color: T.textPrimary, margin: 0,
              lineHeight: 1.35,
            }}>
              {poll.title}
            </h3>
            {poll.description && (
              <p style={{ marginTop: 5, fontSize: "0.84rem", color: T.textSecondary, lineHeight: 1.5 }}>
                {poll.description}
              </p>
            )}
          </div>

          {/* Committee actions */}
          {isCommittee && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              {isOpen && (
                <button
                  className="pp-btn-amber"
                  onClick={() => onClose(poll._id)}
                  disabled={closing === poll._id}
                >
                  <Lock size={11} />
                  {closing === poll._id ? "…" : "Close"}
                </button>
              )}
              <button
                className="pp-btn-danger"
                onClick={() => onDelete(poll._id)}
                disabled={deleting === poll._id}
              >
                <Trash2 size={11} />
                {deleting === poll._id ? "…" : "Delete"}
              </button>
            </div>
          )}
        </div>

        {/* Meta row */}
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.78rem", color: T.textMuted }}>
            <Users size={11} />
            {poll.totalVotes} vote{poll.totalVotes !== 1 ? "s" : ""}
          </span>
          {timeStr && (
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.78rem", color: T.textMuted }}>
              <Clock size={11} />
              {timeStr}
            </span>
          )}
          <span style={{ fontSize: "0.78rem", color: T.textMuted }}>
            by {poll.createdBy?.fullName || "Committee"}
          </span>
        </div>
      </div>

      {/* Options area */}
      <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 10 }}>
        {showResults ? (
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
              <p style={{ textAlign: "center", fontSize: "0.8rem", color: T.green, fontWeight: 600, marginTop: 4 }}>
                ✓ Your vote has been recorded
              </p>
            )}
          </>
        ) : (
          <>
            <p style={{ fontSize: "0.78rem", color: T.textMuted, marginBottom: 4 }}>
              {poll.allowMultiple ? "Select all that apply" : "Select one option"}
            </p>
            {poll.options.map(opt => {
              const isSelected = selected.includes(String(opt._id));
              return (
                <button
                  key={opt._id}
                  onClick={() => toggleOption(String(opt._id))}
                  className={`pp-option-btn${isSelected ? " selected" : ""}`}
                >
                  <div style={{
                    width: 16, height: 16,
                    borderRadius: poll.allowMultiple ? 4 : "50%",
                    border: `2px solid ${isSelected ? T.gold : T.border}`,
                    background: isSelected ? T.gold : "transparent",
                    flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s",
                  }}>
                    {isSelected && <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#0a0907" }} />}
                  </div>
                  {opt.text}
                </button>
              );
            })}
            <button
              className="pp-btn-gold"
              onClick={() => onVote(poll._id, selected)}
              disabled={selected.length === 0 || voting === poll._id}
              style={{ marginTop: 6, justifyContent: "center", padding: "11px" }}
            >
              {voting === poll._id ? "Submitting…" : "Submit Vote"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Create Poll Modal ──────────────────────────────────────── */
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
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.6)",
      backdropFilter: "blur(8px)",
      padding: 16,
    }}>
      <div style={{
        width: "100%", maxWidth: 460,
        background: "#0f0e0b",
        border: `1px solid ${T.border}`,
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
      }}>
        {/* Modal header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 22px",
          borderBottom: `1px solid ${T.border}`,
        }}>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "1.2rem", fontWeight: 600, color: T.textPrimary, margin: 0,
          }}>
            Create Poll
          </h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted, padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="pp-modal-body" style={{ padding: 22, overflowY: "auto", maxHeight: "75vh", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Title */}
          <div>
            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: T.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 7 }}>
              Question
            </label>
            <input
              required
              className="pp-input"
              placeholder="e.g. Which day should we hold the AGM?"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div>
            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: T.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 7 }}>
              Description <span style={{ fontWeight: 400, textTransform: "none" }}>(optional)</span>
            </label>
            <textarea
              rows={2}
              className="pp-input"
              style={{ resize: "vertical" }}
              placeholder="Add context for residents…"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          {/* Options */}
          <div>
            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: T.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 7 }}>
              Options
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {options.map((opt, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    className="pp-input"
                    placeholder={`Option ${i + 1}`}
                    value={opt}
                    onChange={e => updateOption(i, e.target.value)}
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(i)}
                      style={{
                        flexShrink: 0, width: 30, height: 30,
                        borderRadius: 8, background: "rgba(232,93,93,0.08)",
                        border: "1px solid rgba(232,93,93,0.2)",
                        color: T.red, cursor: "pointer", display: "flex",
                        alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 10 && (
              <button
                type="button"
                onClick={addOption}
                style={{
                  marginTop: 8, background: "none", border: "none",
                  display: "flex", alignItems: "center", gap: 5,
                  fontSize: "0.8rem", fontWeight: 600, color: T.gold, cursor: "pointer",
                  padding: 0,
                }}
              >
                <Plus size={13} /> Add option
              </button>
            )}
          </div>

          {/* Allow multiple toggle */}
          <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
            <button
              type="button"
              className="pp-toggle"
              style={{ background: allowMultiple ? T.gold : "rgba(255,255,255,0.08)" }}
              onClick={() => setAllowMultiple(v => !v)}
            >
              <div className="pp-toggle-knob" style={{ left: allowMultiple ? 18 : 2 }} />
            </button>
            <span style={{ fontSize: "0.875rem", fontWeight: 500, color: T.textSecondary }}>Allow multiple choices</span>
          </label>

          {/* Deadline */}
          <div>
            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: T.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 7 }}>
              Deadline <span style={{ fontWeight: 400, textTransform: "none" }}>(optional)</span>
            </label>
            <input
              type="datetime-local"
              className="pp-input"
              value={endsAt}
              onChange={e => setEndsAt(e.target.value)}
              min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
            />
          </div>

          {error && (
            <div style={{
              background: "rgba(232,93,93,0.1)",
              border: "1px solid rgba(232,93,93,0.25)",
              borderRadius: 10, padding: "10px 14px",
              fontSize: "0.84rem", color: T.red,
            }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={saving} className="pp-btn-gold" style={{ justifyContent: "center", padding: "12px" }}>
            {saving ? "Creating…" : "Create Poll"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────── */
export function PollsPage() {
  const { user, token } = useAuth();
  const isCommittee = user?.role === "committee" || user?.role === "super_admin";

  const [polls,    setPolls]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [tab,      setTab]      = useState("active");
  const [showCreate, setShowCreate] = useState(false);

  const [voting,   setVoting]   = useState(null);
  const [closing,  setClosing]  = useState(null);
  const [deleting, setDeleting] = useState(null);

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

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    function onPollCreated(poll) {
      if (tab === "active") setPolls(prev => [poll, ...prev]);
    }
    function onPollUpdated(poll) {
      setPolls(prev => prev.map(p => p._id === poll._id ? { ...poll, myVote: p.myVote } : p));
    }
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

  async function handleVote(pollId, optionIds) {
    if (optionIds.length === 0) return;
    setVoting(pollId);
    try {
      const data = await apiRequest(`/polls/${pollId}/vote`, {
        method: "POST",
        body: { optionIds },
        token,
      });
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
      await apiRequest(`/polls/${pollId}/close`, { method: "PATCH", token });
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

  return (
    <>
      <style>{CSS}</style>
      <div style={{
        fontFamily: "'DM Sans', sans-serif",
        maxWidth: 680,
        margin: "0 auto",
        paddingBottom: 64,
      }}>

        {/* Header */}
        <div style={{ marginBottom: 28, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h1 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "2rem", fontWeight: 600,
              color: T.textPrimary, margin: 0,
            }}>
              Polls & Voting
            </h1>
            <p style={{ fontSize: "0.875rem", color: T.textMuted, marginTop: 4 }}>
              Community decisions, made together
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className="pp-btn-ghost" onClick={fetchPolls} style={{ padding: "9px 10px" }}>
              <RefreshCw size={15} />
            </button>
            {isCommittee && (
              <button className="pp-btn-gold" onClick={() => setShowCreate(true)}>
                <Plus size={15} /> New Poll
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", gap: 4,
          background: "rgba(255,255,255,0.03)",
          border: `1px solid ${T.border}`,
          borderRadius: 12,
          padding: 4,
          width: "fit-content",
          marginBottom: 24,
        }}>
          {["active", "closed"].map(t => (
            <button
              key={t}
              className={`pp-tab${tab === t ? " active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[240, 200, 220].map((h, i) => (
              <div key={i} className="pp-skel" style={{ height: h }} />
            ))}
          </div>
        ) : error ? (
          <div style={{
            background: "rgba(232,93,93,0.08)",
            border: "1px solid rgba(232,93,93,0.2)",
            borderRadius: 12, padding: "14px 18px",
            fontSize: "0.875rem", color: T.red,
          }}>
            {error}
          </div>
        ) : polls.length === 0 ? (
          <div style={{
            border: `1px dashed ${T.border}`,
            borderRadius: 16,
            padding: "60px 24px",
            textAlign: "center",
          }}>
            <BarChart2 size={36} color={T.borderHover} style={{ margin: "0 auto 14px" }} />
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.15rem", fontWeight: 600, color: T.textSecondary }}>
              {tab === "active" ? "No active polls" : "No closed polls"}
            </p>
            <p style={{ fontSize: "0.84rem", color: T.textMuted, marginTop: 6 }}>
              {tab === "active" && isCommittee
                ? "Create a poll to gather your community's opinion."
                : "Check back later."}
            </p>
            {tab === "active" && isCommittee && (
              <button
                className="pp-btn-gold"
                onClick={() => setShowCreate(true)}
                style={{ margin: "16px auto 0", display: "inline-flex" }}
              >
                <Plus size={15} /> Create First Poll
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
    </>
  );
}
