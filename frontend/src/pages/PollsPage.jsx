import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiRequest } from '../components/api';
import { useAuth } from '../components/AuthContext';
import { getSocket } from '../components/socket';
import { 
  Users, CheckCircle2, ChevronDown, Plus, X, BarChart2,
  Lock, Trash2, Clock
} from 'lucide-react';

/* --- STYLES --- */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600;1,700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  .polls-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #FAFAFC 0%, #EEF2FF 100%);
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: #1C1C1E;
    padding: 48px 32px 120px;
    box-sizing: border-box;
  }
  
  .polls-wrapper {
    max-width: 900px;
    margin: 0 auto;
  }

  .title-editorial {
    font-family: 'Cormorant Garamond', serif;
    font-style: italic;
    font-weight: 700;
  }

  /* Smart Filter */
  .smart-filter {
    font-size: 2.2rem;
    font-weight: 600;
    color: #8E8E93;
    margin-bottom: 48px;
    letter-spacing: -0.02em;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
  }

  .dropdown-wrapper {
    position: relative;
    display: inline-block;
  }

  .dropdown-trigger {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 2.2rem;
    font-weight: 800;
    color: #1C1C1E;
    background: transparent;
    border: none;
    border-bottom: 3px solid #1C1C1E;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 4px 4px;
    transition: color 0.2s ease;
  }

  .dropdown-trigger:hover {
    color: #4F46E5;
    border-color: #4F46E5;
  }

  .dropdown-menu {
    position: absolute;
    top: 100%;
    left: 0;
    margin-top: 12px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(16px);
    border-radius: 16px;
    padding: 8px;
    min-width: 240px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.08);
    z-index: 50;
    border: 1px solid rgba(0,0,0,0.05);
  }

  .dropdown-item {
    width: 100%;
    text-align: left;
    padding: 12px 16px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 1.1rem;
    font-weight: 600;
    color: #1C1C1E;
    background: transparent;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    transition: background 0.2s ease;
  }
  .dropdown-item:hover { background: rgba(0,0,0,0.03); }

  /* Poll Card - Bento Style */
  .poll-card {
    background: #FFFFFF;
    border-radius: 24px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.02);
    overflow: hidden;
    margin-bottom: 24px;
    display: flex;
    flex-direction: column;
    border: 1px solid rgba(0,0,0,0.02);
  }

  .poll-header {
    padding: 32px 32px 0;
  }

  .poll-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }

  .tag-active {
    display: inline-flex; align-items: center; gap: 6px;
    background: #E6F4EA; color: #16A34A;
    padding: 4px 12px; border-radius: 100px;
    font-size: 0.75rem; font-weight: 800; text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .tag-closed {
    display: inline-flex; align-items: center; gap: 6px;
    background: #F2F2F7; color: #8E8E93;
    padding: 4px 12px; border-radius: 100px;
    font-size: 0.75rem; font-weight: 800; text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .pulse-dot {
    width: 6px; height: 6px;
    background: #16A34A;
    border-radius: 50%;
    box-shadow: 0 0 0 rgba(22, 163, 74, 0.4);
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.4); }
    70% { box-shadow: 0 0 0 6px rgba(22, 163, 74, 0); }
    100% { box-shadow: 0 0 0 0 rgba(22, 163, 74, 0); }
  }

  .poll-title {
    font-size: 2rem;
    line-height: 1.2;
    color: #1C1C1E;
    margin-bottom: 8px;
  }

  .poll-desc {
    color: #8E8E93;
    font-size: 1.05rem;
    line-height: 1.5;
    margin-bottom: 24px;
    font-weight: 500;
  }

  /* Voting Options */
  .poll-body {
    padding: 0 32px 32px;
  }

  .vote-option {
    display: flex;
    align-items: center;
    background: #FAFAFC;
    border: 2px solid transparent;
    border-radius: 16px;
    padding: 16px 20px;
    margin-bottom: 12px;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.25, 1, 0.5, 1);
    position: relative;
    overflow: hidden;
  }

  .vote-option:hover:not(.disabled) {
    background: #F2F2F7;
    transform: translateY(-2px);
  }

  .vote-option.selected {
    border-color: #4F46E5;
    background: #EEF2FF;
  }

  .vote-radio {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 2px solid #D1D1D6;
    margin-right: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.2s ease;
  }

  .vote-option.selected .vote-radio {
    border-color: #4F46E5;
    background: #4F46E5;
  }

  .vote-radio-inner {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #FFFFFF;
    transform: scale(0);
    transition: transform 0.2s ease;
  }

  .vote-option.selected .vote-radio-inner {
    transform: scale(1);
  }

  .vote-text {
    font-size: 1.1rem;
    font-weight: 600;
    color: #1C1C1E;
    flex: 1;
    z-index: 1;
  }

  /* Results Bar */
  .result-bar-bg {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    background: #E5E5EA;
    opacity: 0.4;
    z-index: 0;
    border-radius: 14px;
    transition: width 1s cubic-bezier(0.25, 1, 0.5, 1);
  }

  .vote-option.is-winner .result-bar-bg {
    background: #EEF2FF;
    opacity: 1;
  }

  .vote-pct {
    font-size: 1.1rem;
    font-weight: 800;
    color: #1C1C1E;
    z-index: 1;
  }

  /* Submit Button */
  .submit-vote-btn {
    width: 100%;
    background: #1C1C1E;
    color: #FFFFFF;
    border: none;
    border-radius: 100px;
    padding: 16px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 1.1rem;
    font-weight: 700;
    cursor: pointer;
    margin-top: 12px;
    transition: all 0.2s ease;
  }
  .submit-vote-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* FAB & Drawer */
  .fab {
    position: fixed;
    bottom: 40px;
    right: 40px;
    width: 64px;
    height: 64px;
    border-radius: 32px;
    background: #4F46E5;
    color: #FFFFFF;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 20px 40px rgba(79,70,229,0.3);
    cursor: pointer;
    border: none;
    z-index: 100;
  }

  .drawer-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.2);
    backdrop-filter: blur(8px);
    z-index: 150;
  }

  .drawer-panel {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    max-width: 500px;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(24px) saturate(180%);
    box-shadow: -20px 0 60px rgba(0,0,0,0.1);
    z-index: 160;
    padding: 40px;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }

  .input-field {
    width: 100%;
    padding: 16px;
    border-radius: 12px;
    border: 1px solid rgba(0,0,0,0.1);
    background: rgba(255,255,255,0.5);
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 1rem;
    margin-bottom: 20px;
    outline: none;
    transition: border-color 0.2s ease;
  }
  .input-field:focus { border-color: #4F46E5; }
`;

/* --- MOCK DATA & CONSTANTS --- */
const SPRING_TRANSITION = { type: "spring", stiffness: 300, damping: 24 };

/* --- COMPONENTS --- */

const Dropdown = ({ value, options, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="dropdown-wrapper" ref={ref}>
      <button className="dropdown-trigger" onClick={() => setIsOpen(!isOpen)}>
        {value} <ChevronDown size={24} strokeWidth={3} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="dropdown-menu"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={SPRING_TRANSITION}
          >
            {options.map(opt => (
              <button 
                key={opt.id || opt} 
                className="dropdown-item"
                onClick={() => { onChange(opt.id || opt); setIsOpen(false); }}
              >
                {opt.label || opt}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

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

function PollCard({ poll, onVote, onClose, onDelete, isCommittee }) {
  const hasVoted = poll.myVote !== null;
  const isOpen = poll.isOpen;
  const myVoteSet = new Set((poll.myVote || []).map(String));
  const [selected, setSelected] = useState([]);
  const [isVoting, setIsVoting] = useState(false);

  const showResults = hasVoted || !isOpen;
  const timeStr = timeLeft(poll.endsAt);
  const totalVotes = poll.totalVotes || 0;

  // Find the winning option to highlight it
  const maxVotes = Math.max(...poll.options.map(o => o.votes));
  
  function toggleOption(optId) {
    if (!isOpen || hasVoted) return;
    if (poll.allowMultiple) {
      setSelected(prev => prev.includes(optId) ? prev.filter(x => x !== optId) : [...prev, optId]);
    } else {
      setSelected([optId]);
    }
  }

  async function handleVoteSubmit() {
    if (selected.length === 0) return;
    setIsVoting(true);
    await onVote(poll._id, selected);
    setIsVoting(false);
  }

  return (
    <motion.div 
      className="poll-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING_TRANSITION}
    >
      <div className="poll-header">
        <div className="poll-meta">
          {isOpen ? (
            <span className="tag-active"><div className="pulse-dot" /> LIVE POLL</span>
          ) : (
            <span className="tag-closed"><Lock size={12} /> CLOSED</span>
          )}
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: '#8E8E93', fontWeight: 600 }}>
            <Users size={14} /> {totalVotes} votes
          </span>
          {timeStr && isOpen && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: '#8E8E93', fontWeight: 600 }}>
              <Clock size={14} /> {timeStr}
            </span>
          )}
        </div>
        <h3 className="title-editorial poll-title">{poll.title}</h3>
        {poll.description && <p className="poll-desc">{poll.description}</p>}
      </div>

      <div className="poll-body">
        {poll.options.map(opt => {
          const isSelected = selected.includes(String(opt._id));
          const isMyChoice = myVoteSet.has(String(opt._id));
          const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
          const isWinner = showResults && opt.votes === maxVotes && maxVotes > 0;

          return (
            <div 
              key={opt._id}
              className={`vote-option ${isSelected || isMyChoice ? 'selected' : ''} ${!isOpen || hasVoted ? 'disabled' : ''} ${isWinner ? 'is-winner' : ''}`}
              onClick={() => toggleOption(String(opt._id))}
            >
              {showResults && (
                <div className="result-bar-bg" style={{ width: `${pct}%` }} />
              )}
              
              {!showResults && (
                <div className="vote-radio" style={{ borderRadius: poll.allowMultiple ? '6px' : '50%' }}>
                  <div className="vote-radio-inner" style={{ borderRadius: poll.allowMultiple ? '2px' : '50%' }} />
                </div>
              )}
              
              {showResults && isMyChoice && (
                <div style={{ marginRight: '12px', zIndex: 1 }}>
                  <CheckCircle2 size={20} color="#4F46E5" />
                </div>
              )}

              <span className="vote-text" style={{ color: isWinner ? '#4F46E5' : '#1C1C1E' }}>
                {opt.text}
              </span>

              {showResults && (
                <span className="vote-pct" style={{ color: isWinner ? '#4F46E5' : '#1C1C1E' }}>
                  {pct}%
                </span>
              )}
            </div>
          );
        })}

        {!showResults && isOpen && (
          <motion.button 
            className="submit-vote-btn"
            disabled={selected.length === 0 || isVoting}
            onClick={handleVoteSubmit}
            whileHover={selected.length > 0 ? { scale: 1.02 } : {}}
            whileTap={selected.length > 0 ? { scale: 0.98 } : {}}
          >
            {isVoting ? "Submitting..." : "Cast Your Vote"}
          </motion.button>
        )}

        {/* Committee Actions */}
        {isCommittee && (
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px', paddingTop: '20px', borderTop: '1px dashed rgba(0,0,0,0.1)' }}>
            {isOpen && (
              <button onClick={() => onClose(poll._id)} style={{ background: '#F2F2F7', border: 'none', padding: '8px 16px', borderRadius: '100px', fontSize: '0.85rem', fontWeight: 700, color: '#8E8E93', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lock size={14} /> Close Poll
              </button>
            )}
            <button onClick={() => onDelete(poll._id)} style={{ background: '#FEE2E2', border: 'none', padding: '8px 16px', borderRadius: '100px', fontSize: '0.85rem', fontWeight: 700, color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Trash2 size={14} /> Delete
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function CreatePollDrawer({ onClose, onCreated, token }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanOptions = options.map(o => o.trim()).filter(Boolean);
    if (cleanOptions.length < 2) return alert("Add at least 2 options");
    setSaving(true);
    try {
      const res = await apiRequest("/polls", {
        method: "POST",
        body: { title, description, options: cleanOptions, allowMultiple: false },
        token
      });
      onCreated(res.item);
    } catch(err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        className="drawer-backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div 
        className="drawer-panel"
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={SPRING_TRANSITION}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <h2 className="title-editorial" style={{ fontSize: '2.5rem', color: '#1C1C1E', margin: 0 }}>New Poll</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}>
            <X size={28} color="#1C1C1E" />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input 
            required className="input-field" placeholder="What do you want to ask?" 
            value={title} onChange={e => setTitle(e.target.value)}
          />
          <textarea 
            className="input-field" placeholder="Add context (optional)..." rows={3}
            value={description} onChange={e => setDescription(e.target.value)}
          />
          
          <div style={{ margin: '16px 0 8px', fontWeight: 800, fontSize: '0.85rem', color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Voting Options
          </div>
          
          {options.map((opt, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px' }}>
              <input 
                className="input-field" placeholder={`Option ${i+1}`} style={{ marginBottom: '8px' }}
                value={opt} onChange={e => setOptions(o => o.map((v, idx) => idx === i ? e.target.value : v))}
              />
            </div>
          ))}
          
          <button 
            type="button" 
            onClick={() => setOptions(o => [...o, ""])}
            style={{ background: 'none', border: 'none', color: '#4F46E5', fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '8px 0', width: 'fit-content' }}
          >
            <Plus size={18} /> Add Option
          </button>

          <motion.button 
            type="submit" disabled={saving}
            style={{ width: '100%', background: '#4F46E5', color: '#FFFFFF', padding: '18px', borderRadius: '16px', border: 'none', fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer', marginTop: '32px' }}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          >
            {saving ? "Publishing..." : "Publish Poll"}
          </motion.button>
        </form>
      </motion.div>
    </AnimatePresence>
  );
}

export function PollsPage() {
  const { user, token } = useAuth();
  const isCommittee = user?.role === "committee" || user?.role === "super_admin";

  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Active Polls'); // 'Active Polls' | 'Closed Polls'
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchPolls = useCallback(async () => {
    setLoading(true);
    const status = filter === 'Active Polls' ? 'active' : 'closed';
    try {
      const data = await apiRequest(`/polls?status=${status}`, { token });
      setPolls(data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token, filter]);

  useEffect(() => { fetchPolls(); }, [fetchPolls]);

  // Socket updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    socket.on("poll:created", (p) => { if(filter === 'Active Polls') setPolls(prev => [p, ...prev]); });
    socket.on("poll:updated", (p) => setPolls(prev => prev.map(x => x._id === p._id ? {...p, myVote: x.myVote} : x)));
    socket.on("poll:deleted", ({pollId}) => setPolls(prev => prev.filter(x => x._id !== pollId)));
    return () => {
      socket.off("poll:created"); socket.off("poll:updated"); socket.off("poll:deleted");
    }
  }, [filter]);

  const handleVote = async (pollId, optionIds) => {
    const data = await apiRequest(`/polls/${pollId}/vote`, { method: "POST", body: { optionIds }, token });
    setPolls(prev => prev.map(p => p._id === pollId ? data.item : p));
  };

  const handleClose = async (pollId) => {
    if(!confirm("Close poll?")) return;
    await apiRequest(`/polls/${pollId}/close`, { method: "PATCH", token });
    setPolls(prev => prev.filter(p => p._id !== pollId));
  };

  const handleDelete = async (pollId) => {
    if(!confirm("Delete poll?")) return;
    await apiRequest(`/polls/${pollId}`, { method: "DELETE", token });
    setPolls(prev => prev.filter(p => p._id !== pollId));
  };

  return (
    <>
      <style>{styles}</style>
      <div className="polls-page">
        <div className="polls-wrapper">
          
          <motion.div 
            className="smart-filter"
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
            transition={SPRING_TRANSITION}
          >
            <span style={{ color: '#1C1C1E' }}>Show me</span>
            <Dropdown 
              value={filter} 
              options={[{id: 'Active Polls', label: 'Active Polls'}, {id: 'Closed Polls', label: 'Closed Polls'}]} 
              onChange={setFilter} 
            />
          </motion.div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '100px', fontWeight: 600, color: '#8E8E93' }}>Loading polls...</div>
          ) : polls.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '100px 0', border: '2px dashed rgba(0,0,0,0.1)', borderRadius: '24px' }}>
              <BarChart2 size={48} color="#8E8E93" style={{ marginBottom: '16px', opacity: 0.5 }} />
              <h3 className="title-editorial" style={{ fontSize: '2rem', marginBottom: '8px' }}>No {filter.toLowerCase()}</h3>
              <p style={{ color: '#8E8E93', fontWeight: 500 }}>Check back later for new community decisions.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <AnimatePresence>
                {polls.map(poll => (
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
            </div>
          )}
        </div>

        {isCommittee && (
          <motion.button 
            className="fab"
            whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
            onClick={() => setDrawerOpen(true)}
          >
            <Plus size={32} />
          </motion.button>
        )}

        {drawerOpen && (
          <CreatePollDrawer 
            token={token} 
            onClose={() => setDrawerOpen(false)} 
            onCreated={(p) => { setDrawerOpen(false); if(filter === 'Active Polls') setPolls([p, ...polls]); }} 
          />
        )}
      </div>
    </>
  );
}
