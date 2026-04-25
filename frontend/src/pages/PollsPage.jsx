import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { apiRequest } from "../components/api";
import { useAuth } from "../components/AuthContext";
import { getSocket } from "../components/socket";
import {
  BarChart3,
  Bell,
  Check,
  Clock3,
  Lock,
  Plus,
  Sparkles,
  Trash2,
  Wallet,
  X,
  ListFilter,
} from "lucide-react";

const C = {
  root: "#FAFAFC",
  surface: "#FFFFFF",
  surfaceSoft: "#F7F7FB",
  ink: "#1C1C1E",
  inkSoft: "#5B5B66",
  muted: "#8A8A96",
  border: "#E8E8ED",
  borderStrong: "#D9D9E4",
  indigo: "#4F46E5",
  indigoSoft: "#EEF2FF",
  green: "#16A34A",
  greenSoft: "#E9F8EF",
  danger: "#DC2626",
  dangerSoft: "#FEE2E2",
};

const FILTERS = [
  { id: "all", label: "All", Icon: ListFilter },
  { id: "active", label: "Active", Icon: Clock3 },
  { id: "closed", label: "Closed", Icon: Lock },
];

const SPRING = { type: "spring", stiffness: 260, damping: 24 };

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  .polls-page {
    min-height: 100vh;
    background:
      radial-gradient(circle at top left, rgba(79, 70, 229, 0.07), transparent 30%),
      radial-gradient(circle at 82% 18%, rgba(22, 163, 74, 0.05), transparent 24%),
      ${C.root};
    color: ${C.ink};
    font-family: 'Plus Jakarta Sans', sans-serif;
    padding: 36px 28px 120px;
    box-sizing: border-box;
  }

  .polls-shell {
    max-width: 1280px;
    margin: 0 auto;
  }

  .pl-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 18px;
    flex-wrap: wrap;
  }

  .pl-heading {
    display: grid;
    gap: 8px;
    max-width: 760px;
  }

  .pl-kicker {
    margin: 0;
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: ${C.indigo};
  }

  .pl-title {
    margin: 0;
    font-size: clamp(2rem, 4vw, 3.2rem);
    line-height: 1.04;
    font-weight: 800;
    letter-spacing: -0.05em;
    color: ${C.ink};
  }

  .pl-subtitle {
    margin: 0;
    max-width: 760px;
    font-size: 0.98rem;
    line-height: 1.65;
    color: ${C.inkSoft};
    font-weight: 500;
  }

  .pl-create-btn {
    position: relative;
    overflow: hidden;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    background: ${C.surface};
    border: 1px solid ${C.border};
    border-radius: 10px;
    padding: 9px 14px;
    color: ${C.ink};
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    transition: border-color 0.2s, color 0.2s, transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }

  .pl-create-btn::after {
    content: '';
    position: absolute;
    left: 8px;
    right: 8px;
    bottom: 0;
    height: 2px;
    border-radius: 999px;
    background: ${C.indigo};
    transform: scaleX(0.2);
    opacity: 0;
    transition: transform 0.2s ease, opacity 0.2s ease;
  }

  .pl-create-btn:hover:not(:disabled) {
    border-color: #C7C7CC;
    color: ${C.ink};
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(28,28,30,0.09);
  }

  .pl-create-btn:hover:not(:disabled)::after {
    transform: scaleX(1);
    opacity: 1;
  }

  .pl-create-btn:active:not(:disabled) {
    transform: scale(0.97);
  }

  .pl-create-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  /* ── Segmented chip rail ──────────────────── */
  .pl-chips-rail {
    display: inline-flex;
    align-items: stretch;
    gap: 0;
    border-bottom: 1.5px solid ${C.border};
    flex-shrink: 0;
    margin: 24px 0 28px;
  }

  .pl-chip {
    position: relative;
    display: inline-flex;
    align-items: center;
    border: none;
    background: transparent;
    cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.78rem;
    font-weight: 700;
    line-height: 1;
    white-space: nowrap;
    outline: none;
    padding: 0;
  }

  /* Sliding indigo underline — sits at bottom of active chip */
  .pl-chip-underline {
    position: absolute;
    bottom: -1.5px;
    left: 13px;
    right: 13px;
    height: 2px;
    background: ${C.indigo};
    border-radius: 2px 2px 0 0;
  }

  /* Icon + label */
  .pl-chip-inner {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 13px 9px;
  }

  .pl-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 18px;
    align-items: start;
  }

  .pl-card {
    position: relative;
    overflow: hidden;
    border-radius: 24px;
    background: ${C.surface};
    border: 1px solid ${C.border};
    box-shadow: 0 12px 26px rgba(16, 24, 40, 0.04);
  }

  .pl-card-inner {
    padding: 22px;
    display: grid;
    gap: 16px;
  }

  .pl-card-head {
    display: grid;
    gap: 10px;
  }

  .pl-card-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .pl-status {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    border-radius: 999px;
    padding: 6px 11px;
    font-size: 0.68rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .pl-status.active {
    background: ${C.greenSoft};
    color: ${C.green};
  }

  .pl-status.closed {
    background: #F3F4F6;
    color: #71717A;
  }

  .pl-question {
    margin: 0;
    font-size: 1.25rem;
    line-height: 1.35;
    font-weight: 800;
    letter-spacing: -0.03em;
    color: ${C.ink};
  }

  .pl-description {
    margin: 0;
    font-size: 0.94rem;
    line-height: 1.65;
    color: ${C.inkSoft};
  }

  .pl-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    color: ${C.muted};
    font-size: 0.8rem;
    font-weight: 600;
  }

  .pl-meta-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .pl-options {
    display: grid;
    gap: 10px;
  }

  .pl-vote-button,
  .pl-result-row {
    width: 100%;
    border: 1px solid ${C.border};
    border-radius: 18px;
    overflow: hidden;
    background: ${C.surfaceSoft};
    padding: 14px 15px;
    font: inherit;
    color: ${C.ink};
    text-align: left;
    cursor: pointer;
    position: relative;
  }

  .pl-vote-button {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  }

  .pl-vote-button:hover {
    transform: translateY(-1px);
    border-color: rgba(79, 70, 229, 0.22);
    background: #fff;
    box-shadow: 0 10px 24px rgba(16, 24, 40, 0.04);
  }

  .pl-vote-button.is-selected {
    background: ${C.indigoSoft};
    border-color: rgba(79, 70, 229, 0.24);
  }

  .pl-option-copy {
    display: grid;
    gap: 4px;
    min-width: 0;
  }

  .pl-option-title {
    margin: 0;
    font-size: 0.96rem;
    font-weight: 700;
    line-height: 1.35;
    color: ${C.ink};
  }

  .pl-option-sub {
    margin: 0;
    font-size: 0.74rem;
    color: ${C.muted};
    font-weight: 600;
  }

  .pl-option-check {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    border: 1px solid ${C.borderStrong};
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: ${C.indigo};
    flex-shrink: 0;
    background: #fff;
  }

  .pl-result-row {
    cursor: default;
    padding: 0;
    background: #fff;
  }

  .pl-result-track {
    position: absolute;
    inset: 0;
    overflow: hidden;
    border-radius: 18px;
    background: linear-gradient(90deg, rgba(79, 70, 229, 0.07), rgba(79, 70, 229, 0.03));
  }

  .pl-result-bar {
    position: absolute;
    inset: 0 auto 0 0;
    width: 0%;
    background: linear-gradient(90deg, rgba(79, 70, 229, 0.14), rgba(79, 70, 229, 0.08));
  }

  .pl-result-bar.is-winner {
    background: linear-gradient(90deg, rgba(22, 163, 74, 0.22), rgba(22, 163, 74, 0.12));
  }

  .pl-result-content {
    position: relative;
    z-index: 1;
    display: grid;
    gap: 10px;
    padding: 14px 15px;
  }

  .pl-result-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .pl-result-label {
    margin: 0;
    font-size: 0.96rem;
    font-weight: 700;
    color: ${C.ink};
    line-height: 1.35;
  }

  .pl-result-value {
    font-size: 0.82rem;
    font-weight: 800;
    color: ${C.inkSoft};
    flex-shrink: 0;
  }

  .pl-result-bar-wrap {
    position: relative;
    height: 8px;
    border-radius: 999px;
    background: rgba(232, 232, 237, 0.95);
    overflow: hidden;
  }

  .pl-result-bar-fill {
    position: absolute;
    inset: 0 auto 0 0;
    width: 0%;
    border-radius: inherit;
    background: linear-gradient(90deg, ${C.indigo}, rgba(79, 70, 229, 0.72));
  }

  .pl-result-row.is-winner .pl-result-label,
  .pl-result-row.is-winner .pl-result-value {
    color: ${C.green};
  }

  .pl-result-row.is-winner .pl-result-bar-fill {
    background: linear-gradient(90deg, ${C.green}, rgba(22, 163, 74, 0.72));
  }

  .pl-voted-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: ${C.indigo};
  }

  .pl-footer-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding-top: 2px;
  }

  .pl-count {
    font-size: 0.8rem;
    font-weight: 700;
    color: ${C.muted};
  }

  .pl-submit {
    width: 100%;
    border: none;
    border-radius: 18px;
    background: ${C.ink};
    color: #fff;
    padding: 14px 16px;
    font: inherit;
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.2s ease, opacity 0.2s ease, background 0.2s ease;
  }

  .pl-submit:hover:enabled {
    transform: translateY(-1px);
    background: #111113;
  }

  .pl-submit:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .pl-empty {
    display: grid;
    place-items: center;
    gap: 10px;
    min-height: 360px;
    border: 1px dashed ${C.borderStrong};
    border-radius: 28px;
    background: rgba(255, 255, 255, 0.7);
    color: ${C.inkSoft};
    text-align: center;
    padding: 24px;
  }

  .pl-empty h3 {
    margin: 0;
    font-size: 1.2rem;
    color: ${C.ink};
  }

  .pl-empty p {
    margin: 0;
    max-width: 440px;
    line-height: 1.6;
  }

  .pl-loading {
    min-height: 220px;
    display: grid;
    place-items: center;
    color: ${C.inkSoft};
    font-weight: 600;
  }

  .pl-create-wrap {
    margin: 0 0 16px;
  }

  .pl-create-card {
    background: ${C.surface};
    border: 1px solid ${C.border};
    border-radius: 22px;
    box-shadow: 0 12px 26px rgba(16, 24, 40, 0.04);
    padding: 22px;
    display: grid;
    gap: 16px;
  }

  .pl-drawer-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;
  }

  .pl-drawer-title {
    margin: 0;
    font-size: 1.6rem;
    font-weight: 800;
    letter-spacing: -0.04em;
    color: ${C.ink};
  }

  .pl-drawer-copy {
    margin: 8px 0 0;
    color: ${C.inkSoft};
    line-height: 1.6;
    font-size: 0.92rem;
  }

  .pl-close {
    border: none;
    background: transparent;
    color: ${C.ink};
    cursor: pointer;
    padding: 8px;
    border-radius: 999px;
  }

  .pl-form {
    display: grid;
    gap: 12px;
  }

  .pl-field {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid ${C.border};
    background: #fff;
    border-radius: 16px;
    padding: 14px 15px;
    color: ${C.ink};
    font: inherit;
    outline: none;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .pl-field:focus {
    border-color: rgba(79, 70, 229, 0.42);
    box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.08);
  }

  .pl-label {
    font-size: 0.74rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: ${C.muted};
  }

  .pl-option-input-row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 10px;
  }

  .pl-add-option {
    border: 1px dashed ${C.borderStrong};
    background: transparent;
    color: ${C.indigo};
    border-radius: 14px;
    padding: 12px 14px;
    font: inherit;
    font-weight: 700;
    cursor: pointer;
  }

  .pl-publish {
    border: none;
    border-radius: 16px;
    background: ${C.indigo};
    color: #fff;
    padding: 15px 18px;
    font: inherit;
    font-weight: 800;
    cursor: pointer;
  }

  @media (max-width: 720px) {
    .polls-page {
      padding: 24px 16px 100px;
    }

    .pl-create-btn {
      width: 100%;
      justify-content: center;
    }

    .pl-card-inner {
      padding: 18px;
    }

    .pl-create-card {
      padding: 16px;
    }
  }
`;

function formatCountdown(endsAt) {
  if (!endsAt) return null;
  const diff = new Date(endsAt) - Date.now();
  if (diff <= 0) return "Ended";
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h left`;
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

function PollCard({ poll, onVote, onClose, onDelete, isCommittee }) {
  const hasVoted = Array.isArray(poll.myVote) && poll.myVote.length > 0;
  const isOpen = poll.isOpen;
  const showResults = hasVoted || !isOpen;
  const [selected, setSelected] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(formatCountdown(poll.endsAt));
  const myVoteSet = useMemo(() => new Set((poll.myVote || []).map(String)), [poll.myVote]);
  const totalVotes = poll.totalVotes || 0;
  const maxVotes = Math.max(0, ...poll.options.map((option) => option.votes || 0));

  useEffect(() => {
    if (showResults) setSelected([]);
  }, [showResults]);

  /* Live countdown timer — updates every second */
  useEffect(() => {
    if (!poll.endsAt || !isOpen) return;

    const updateCountdown = () => {
      const newCountdown = formatCountdown(poll.endsAt);
      setCountdown(newCountdown);
    };

    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [poll.endsAt, isOpen]);

  function toggleOption(optionId) {
    if (!isOpen || hasVoted) return;
    setSelected((current) => {
      if (poll.allowMultiple) {
        return current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId];
      }
      return [optionId];
    });
  }

  async function submitVote() {
    if (selected.length === 0) return;
    setIsSubmitting(true);
    try {
      await onVote(poll._id, selected);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <motion.article className="pl-card" layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={SPRING}>
      <div className="pl-card-inner">
        <div className="pl-card-head">
          <div className="pl-card-top">
            <span className={`pl-status ${isOpen ? "active" : "closed"}`}>
              {isOpen ? <Sparkles size={12} /> : <Lock size={12} />}
              {isOpen ? "Active" : "Closed"}
            </span>
            <div className="pl-meta">
              <span className="pl-meta-item"><BarChart3 size={14} /> {totalVotes} votes</span>
              {countdown && isOpen && <span className="pl-meta-item"><Clock3 size={14} /> {countdown}</span>}
            </div>
          </div>

          <h3 className="pl-question">{poll.title}</h3>
          {poll.description && <p className="pl-description">{poll.description}</p>}
        </div>

        <AnimatePresence initial={false} mode="popLayout">
          <motion.div key={showResults ? "results" : "vote"} className="pl-options" layout>
            {!showResults && isOpen
              ? poll.options.map((option) => {
                  const optionId = String(option._id);
                  const isSelected = selected.includes(optionId);

                  return (
                    <motion.button
                      key={optionId}
                      type="button"
                      className={`pl-vote-button ${isSelected ? "is-selected" : ""}`}
                      layout
                      onClick={() => toggleOption(optionId)}
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <span className="pl-option-copy">
                        <span className="pl-option-title">{option.text}</span>
                        <span className="pl-option-sub">{poll.allowMultiple ? "Select one or more" : "Tap to vote"}</span>
                      </span>
                      {isSelected && (
                        <span className="pl-option-check" aria-hidden="true">
                          {poll.allowMultiple ? <Sparkles size={14} /> : <Check size={14} />}
                        </span>
                      )}
                    </motion.button>
                  );
                })
              : poll.options.map((option) => {
                  const optionId = String(option._id);
                  const pct = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
                  const isWinner = maxVotes > 0 && option.votes === maxVotes;
                  const isMyChoice = myVoteSet.has(optionId);

                  return (
                    <motion.div key={optionId} className={`pl-result-row ${isWinner ? "is-winner" : ""}`} layout>
                      <motion.div
                        className={`pl-result-bar ${isWinner ? "is-winner" : ""}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                      />
                      <div className="pl-result-content">
                        <div className="pl-result-top">
                          <div>
                            <p className="pl-result-label">{option.text}</p>
                            {isMyChoice && <span className="pl-voted-pill"><Check size={12} /> Your vote</span>}
                          </div>
                          <span className="pl-result-value">{pct}%</span>
                        </div>

                        <div className="pl-result-bar-wrap" aria-hidden="true">
                          <motion.div
                            className="pl-result-bar-fill"
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
          </motion.div>
        </AnimatePresence>

        {!showResults && isOpen && (
          <motion.button
            type="button"
            className="pl-submit"
            disabled={selected.length === 0 || isSubmitting}
            onClick={submitVote}
            whileHover={selected.length > 0 ? { y: -1 } : undefined}
            whileTap={selected.length > 0 ? { scale: 0.99 } : undefined}
          >
            {isSubmitting ? "Submitting..." : "Cast Vote"}
          </motion.button>
        )}

        {isCommittee && (
          <div className="pl-footer-row">
            <span className="pl-count">{poll.allowMultiple ? "Multiple choices" : "Single choice"}</span>
            <div style={{ display: "flex", gap: 10 }}>
              {isOpen && (
                <button
                  type="button"
                  onClick={() => onClose(poll._id)}
                  style={{
                    border: "none",
                    background: C.surfaceSoft,
                    color: C.inkSoft,
                    borderRadius: 999,
                    padding: "9px 13px",
                    font: "inherit",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Lock size={13} /> Close
                </button>
              )}
              <button
                type="button"
                onClick={() => onDelete(poll._id)}
                style={{
                  border: "none",
                  background: C.dangerSoft,
                  color: C.danger,
                  borderRadius: 999,
                  padding: "9px 13px",
                  font: "inherit",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.article>
  );
}

function CreatePollForm({ token, onCancel, onCreated }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [saving, setSaving] = useState(false);

  const canSubmit = title.trim().length > 0 && options.filter((option) => option.trim()).length >= 2;

  async function handleSubmit(event) {
    event.preventDefault();
    const cleanOptions = options.map((option) => option.trim()).filter(Boolean);
    if (cleanOptions.length < 2) return;

    setSaving(true);
    try {
      const data = await apiRequest("/polls", {
        method: "POST",
        token,
        body: { title, description, options: cleanOptions, allowMultiple: false },
      });
      onCreated(data.item);
    } catch (error) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div
      className="pl-create-wrap"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={SPRING}
      style={{ overflow: "hidden" }}
    >
      <div className="pl-create-card">
        <motion.div
          className="pl-drawer-head"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.02, duration: 0.22 }}
        >
          <div>
            <p className="pl-kicker" style={{ marginBottom: 8 }}>New poll</p>
            <h2 className="pl-drawer-title">Create Poll</h2>
            <p className="pl-drawer-copy">Keep it short and decisive. Publish it once the options are easy to scan.</p>
          </div>
          <button type="button" className="pl-close" onClick={onCancel} aria-label="Close form">
            <X size={22} />
          </button>
        </motion.div>

        <form className="pl-form" onSubmit={handleSubmit}>
          <div>
            <div className="pl-label">Question</div>
            <input
              className="pl-field"
              required
              placeholder="What should the community decide?"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>

          <div>
            <div className="pl-label">Description</div>
            <textarea
              className="pl-field"
              rows={4}
              placeholder="Add context for residents..."
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <div>
            <div className="pl-label" style={{ marginBottom: 10 }}>Options</div>
            <div style={{ display: "grid", gap: 10 }}>
              {options.map((option, index) => (
                <div key={index} className="pl-option-input-row">
                  <input
                    className="pl-field"
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(event) => {
                      const next = [...options];
                      next[index] = event.target.value;
                      setOptions(next);
                    }}
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      className="pl-close"
                      onClick={() => setOptions((current) => current.filter((_, i) => i !== index))}
                      aria-label={`Remove option ${index + 1}`}
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                className="pl-add-option"
                onClick={() => setOptions((current) => [...current, ""])}
              >
                <Plus size={16} style={{ marginRight: 6, verticalAlign: "-2px" }} />
                Add option
              </button>
            </div>
          </div>

          <motion.button
            type="submit"
            className="pl-publish"
            disabled={!canSubmit || saving}
            whileHover={canSubmit && !saving ? { y: -1 } : undefined}
            whileTap={canSubmit && !saving ? { scale: 0.99 } : undefined}
          >
            {saving ? "Publishing..." : "Publish poll"}
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
}

export function PollsPage() {
  const { token, user } = useAuth();
  const isCommittee = user?.role === "committee" || user?.role === "super_admin";

  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const visiblePolls = useMemo(() => {
    if (filter === "all") return polls;
    return polls.filter((poll) => (filter === "active" ? poll.isOpen : !poll.isOpen));
  }, [polls, filter]);

  const loadPolls = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/polls", { token });
      setPolls(data.items || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadPolls();
  }, [loadPolls]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleCreated = (poll) => {
      setPolls((current) => [poll, ...current.filter((item) => item._id !== poll._id)]);
    };

    const handleUpdated = (poll) => {
      setPolls((current) => current.map((item) => (item._id === poll._id ? { ...poll, myVote: item.myVote } : item)));
    };

    const handleDeleted = ({ pollId }) => {
      setPolls((current) => current.filter((item) => item._id !== pollId));
    };

    socket.on("poll:created", handleCreated);
    socket.on("poll:updated", handleUpdated);
    socket.on("poll:deleted", handleDeleted);

    return () => {
      socket.off("poll:created", handleCreated);
      socket.off("poll:updated", handleUpdated);
      socket.off("poll:deleted", handleDeleted);
    };
  }, []);

  const handleVote = async (pollId, optionIds) => {
    const data = await apiRequest(`/polls/${pollId}/vote`, {
      method: "POST",
      token,
      body: { optionIds },
    });
    setPolls((current) => current.map((poll) => (poll._id === pollId ? data.item : poll)));
  };

  const handleClose = async (pollId) => {
    if (!confirm("Close this poll?")) return;
    await apiRequest(`/polls/${pollId}/close`, { method: "PATCH", token });
    setPolls((current) => current.map((poll) => (poll._id === pollId ? { ...poll, isOpen: false, status: "closed" } : poll)));
  };

  const handleDelete = async (pollId) => {
    if (!confirm("Delete this poll?")) return;
    await apiRequest(`/polls/${pollId}`, { method: "DELETE", token });
    setPolls((current) => current.filter((poll) => poll._id !== pollId));
  };

  return (
    <>
      <style>{styles}</style>
      <div className="polls-page">
        <div className="polls-shell">
          <motion.header
            className="pl-header"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={SPRING}
          >
            <div className="pl-heading">
              <p className="pl-kicker">Community input</p>
              <h1 className="pl-title">Community Polls</h1>
              <p className="pl-subtitle">
                Keep decisions visible, vote quickly, and watch every result update without leaving the page.
              </p>
            </div>

            {isCommittee && (
              <motion.button
                type="button"
                className="pl-create-btn"
                onClick={() => setShowCreateForm((prev) => !prev)}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.99 }}
              >
                <Plus size={13} />
                {showCreateForm ? "Close form" : "Add poll"}
              </motion.button>
            )}
          </motion.header>

          <AnimatePresence>
            {isCommittee && showCreateForm && (
              <CreatePollForm
                token={token}
                onCancel={() => setShowCreateForm(false)}
                onCreated={(poll) => {
                  setShowCreateForm(false);
                  setPolls((current) => [poll, ...current.filter((item) => item._id !== poll._id)]);
                }}
              />
            )}
          </AnimatePresence>

          <div className="pl-chips-rail" role="tablist" aria-label="Poll filter">
            {FILTERS.map(({ id, label, Icon }) => {
              const isActive = filter === id;
              return (
                <motion.button
                  key={id}
                  type="button"
                  className="pl-chip"
                  onClick={() => setFilter(id)}
                  animate={{ color: isActive ? "#1C1C1E" : "#6B7280" }}
                  variants={!isActive ? { "chip-hover": { color: "#374151" } } : {}}
                  whileHover="chip-hover"
                  whileTap={{ scale: 0.96 }}
                  transition={{ color: { duration: 0.14 } }}
                >
                  {/* Sliding indigo underline */}
                  {isActive && (
                    <motion.div
                      layoutId="active-poll-filter"
                      className="pl-chip-underline"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}

                  <span className="pl-chip-inner">
                    {Icon && (
                      <motion.span
                        style={{ display: "inline-flex" }}
                        variants={!isActive ? {
                          "chip-hover": { rotate: 10, scale: 1.18 },
                        } : {}}
                        transition={{ type: "spring", stiffness: 420, damping: 16 }}
                      >
                        <Icon size={12} strokeWidth={2.5} />
                      </motion.span>
                    )}
                    {label}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {loading ? (
            <div className="pl-loading">Loading polls...</div>
          ) : visiblePolls.length === 0 ? (
            <div className="pl-empty">
              <BarChart3 size={44} color={C.muted} />
              <div>
                <h3>No polls here yet</h3>
                <p>Switch filters or create the first community question to get the board moving.</p>
              </div>
            </div>
          ) : (
            <motion.div className="pl-grid" layout>
              <AnimatePresence mode="popLayout">
                {visiblePolls.map((poll) => (
                  <PollCard
                    key={poll._id}
                    poll={poll}
                    onVote={handleVote}
                    onClose={handleClose}
                    onDelete={handleDelete}
                    isCommittee={isCommittee}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

      </div>
    </>
  );
}