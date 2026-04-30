import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiRequest } from '../components/api';
import { useAuth } from '../components/AuthContext';
import { Clock, MapPin, Plus, X, ArrowRight, Trash2 } from 'lucide-react';

/* ─── Design tokens (shared with dashboard) ─────────────────── */
const C = {
  bg:       '#FAFAFC',
  surface:  '#FFFFFF',
  ink:      '#1C1C1E',
  ink2:     '#3A3A3C',
  muted:    '#6B7280',
  faint:    '#9CA3AF',
  border:   '#E8E8ED',
  borderL:  '#F0F0F5',
  indigo:   '#4F46E5',
  indigoD:  '#4338CA',
  indigoL:  '#EEF2FF',
  indigoBr: '#C7D2FE',
  red:      '#DC2626',
};

const SPRING = { type: 'spring', stiffness: 320, damping: 26 };

const CATEGORIES = [
  { id: 'All Events', label: 'All Events' },
  { id: 'General',    label: 'General'    },
  { id: 'Cultural',   label: 'Cultural'   },
  { id: 'Workshop',   label: 'Workshop'   },
];

/* ─── CSS ────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,700&display=swap');

  .ep * { box-sizing: border-box; }

  .ep {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: ${C.bg};
    color: ${C.ink};
    min-height: 100vh;
    padding: 32px 32px 80px;
  }

  .ep-shell { max-width: 1120px; margin: 0 auto; }

  /* ── Header ── */
  .ep-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    margin-bottom: 20px;
  }

  .ep-title {
    margin: 0;
    font-size: clamp(1.6rem, 3vw, 2.1rem);
    font-weight: 800;
    letter-spacing: -0.04em;
    color: ${C.ink};
    line-height: 1.1;
  }

  .ep-sub {
    margin: 6px 0 0;
    font-size: 0.88rem;
    font-weight: 600;
    color: ${C.muted};
  }

  .ep-create-btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 9px 16px;
    border-radius: 10px;
    border: 1px solid ${C.border};
    background: ${C.surface};
    color: ${C.ink};
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    transition: border-color 0.18s, box-shadow 0.18s, transform 0.18s;
    flex-shrink: 0;
  }
  .ep-create-btn:hover {
    border-color: ${C.indigoBr};
    box-shadow: 0 4px 12px rgba(79,70,229,0.14);
    transform: translateY(-1px);
  }

  /* ── Tab rail ── */
  .ep-tabs {
    display: inline-flex;
    align-items: stretch;
    border-bottom: 1.5px solid ${C.border};
    margin-bottom: 24px;
    overflow-x: auto;
    max-width: 100%;
  }

  .ep-tab {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px 10px;
    border: none;
    background: transparent;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.8rem;
    font-weight: 700;
    color: ${C.muted};
    cursor: pointer;
    white-space: nowrap;
    outline: none;
    transition: color 0.18s;
  }
  .ep-tab.active { color: ${C.ink}; }

  .ep-tab-count {
    font-size: 0.68rem;
    font-weight: 800;
    padding: 1px 6px;
    border-radius: 99px;
    background: ${C.borderL};
    color: ${C.faint};
    transition: background 0.18s, color 0.18s;
  }
  .ep-tab.active .ep-tab-count {
    background: ${C.indigoL};
    color: ${C.indigo};
  }

  .ep-tab-line {
    position: absolute;
    bottom: -1.5px;
    left: 10px;
    right: 10px;
    height: 2px;
    background: ${C.indigo};
    border-radius: 2px 2px 0 0;
  }

  /* ── Card grid ── */
  .ep-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
  }

  /* ── Card ── */
  .ep-card {
    background: ${C.surface};
    border: 1px solid ${C.border};
    border-radius: 18px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    display: flex;
    flex-direction: column;
    transition: box-shadow 0.22s, transform 0.22s, border-color 0.22s;
  }
  .ep-card:hover {
    box-shadow: 0 12px 28px rgba(28,28,30,0.09);
    transform: translateY(-2px);
    border-color: ${C.indigoBr};
  }

  .ep-card-top {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 18px 18px 14px;
  }

  /* Date anchor block */
  .ep-date-anchor {
    flex-shrink: 0;
    width: 52px;
    border-radius: 12px;
    background: ${C.indigoL};
    border: 1px solid ${C.indigoBr};
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 8px 4px 6px;
    text-align: center;
  }

  .ep-date-day {
    font-size: 1.55rem;
    font-weight: 800;
    line-height: 1;
    color: ${C.indigo};
    letter-spacing: -0.03em;
  }

  .ep-date-month {
    font-size: 0.58rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: ${C.indigo};
    opacity: 0.7;
    margin-top: 3px;
  }

  .ep-card-info { flex: 1; min-width: 0; }

  .ep-card-category {
    display: inline-block;
    font-size: 0.58rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: ${C.indigo};
    margin-bottom: 5px;
  }

  .ep-card-title {
    margin: 0 0 10px;
    font-size: 0.96rem;
    font-weight: 800;
    line-height: 1.35;
    letter-spacing: -0.02em;
    color: ${C.ink};
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .ep-card-meta {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .ep-card-meta-row {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.74rem;
    font-weight: 600;
    color: ${C.muted};
  }

  /* Card footer */
  .ep-card-footer {
    margin-top: auto;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 11px 16px;
    border-top: 1px solid ${C.borderL};
  }

  .ep-view-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: none;
    border: none;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.76rem;
    font-weight: 800;
    color: ${C.indigo};
    cursor: pointer;
    padding: 4px 0;
    letter-spacing: 0.01em;
    transition: gap 0.18s, opacity 0.18s;
  }
  .ep-view-btn:hover { gap: 8px; opacity: 0.8; }

  .ep-cancel-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: none;
    border: none;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.72rem;
    font-weight: 700;
    color: ${C.muted};
    cursor: pointer;
    padding: 4px 6px;
    border-radius: 7px;
    transition: color 0.15s, background 0.15s;
  }
  .ep-cancel-btn:hover { color: ${C.red}; background: #FEF2F2; }

  /* ── Empty / Loading ── */
  .ep-empty {
    grid-column: 1 / -1;
    border-radius: 16px;
    border: 1.5px dashed ${C.border};
    background: ${C.surface};
    padding: 48px 20px;
    text-align: center;
    color: ${C.muted};
    font-size: 0.86rem;
    font-weight: 600;
  }

  /* ── Modal backdrop ── */
  .ep-backdrop {
    position: fixed;
    inset: 0;
    z-index: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: rgba(28,28,30,0.28);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
  }

  /* ── Modal ── */
  .ep-modal {
    width: min(560px, 100%);
    max-height: calc(100vh - 40px);
    overflow-y: auto;
    border-radius: 24px;
    background: ${C.surface};
    border: 1px solid ${C.border};
    box-shadow: 0 32px 80px rgba(28,28,30,0.2);
  }

  .ep-modal-header {
    padding: 22px 24px 18px;
    border-bottom: 1px solid ${C.borderL};
    display: flex;
    align-items: flex-start;
    gap: 14px;
  }

  .ep-modal-date {
    flex-shrink: 0;
    width: 58px;
    border-radius: 14px;
    background: ${C.indigoL};
    border: 1px solid ${C.indigoBr};
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px 4px 8px;
    text-align: center;
  }

  .ep-modal-date-day {
    font-size: 1.8rem;
    font-weight: 800;
    line-height: 1;
    color: ${C.indigo};
    letter-spacing: -0.04em;
  }

  .ep-modal-date-month {
    font-size: 0.6rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: ${C.indigo};
    opacity: 0.7;
    margin-top: 3px;
  }

  .ep-modal-head-body { flex: 1; min-width: 0; }

  .ep-modal-category {
    display: inline-block;
    font-size: 0.6rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: ${C.indigo};
    margin-bottom: 6px;
  }

  .ep-modal-title {
    margin: 0;
    font-size: 1.35rem;
    font-weight: 800;
    letter-spacing: -0.04em;
    line-height: 1.2;
    color: ${C.ink};
  }

  .ep-modal-close {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 1px solid ${C.border};
    background: ${C.bg};
    color: ${C.muted};
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: border-color 0.18s, color 0.18s;
  }
  .ep-modal-close:hover { border-color: ${C.ink}; color: ${C.ink}; }

  .ep-modal-body { padding: 20px 24px 24px; }

  .ep-modal-meta {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 18px;
    padding-bottom: 18px;
    border-bottom: 1px solid ${C.borderL};
  }

  .ep-modal-meta-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.84rem;
    font-weight: 600;
    color: ${C.muted};
  }

  .ep-modal-desc-label {
    font-size: 0.65rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: ${C.faint};
    margin: 0 0 8px;
  }

  .ep-modal-desc {
    margin: 0;
    font-size: 0.9rem;
    line-height: 1.75;
    font-weight: 500;
    color: ${C.ink2};
    white-space: pre-wrap;
  }

  .ep-modal-footer {
    padding: 0 24px 20px;
    display: flex;
    justify-content: flex-end;
  }

  .ep-modal-close-btn {
    padding: 9px 20px;
    border-radius: 10px;
    border: 1px solid ${C.border};
    background: ${C.bg};
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.82rem;
    font-weight: 700;
    color: ${C.ink2};
    cursor: pointer;
    transition: border-color 0.18s, background 0.18s;
  }
  .ep-modal-close-btn:hover { border-color: ${C.ink2}; background: ${C.surface}; }

  /* ── Drawer ── */
  .ep-drawer-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(28,28,30,0.2);
    backdrop-filter: blur(8px);
    z-index: 400;
  }

  .ep-drawer {
    position: fixed;
    top: 0; right: 0; bottom: 0;
    width: min(500px, 100%);
    background: ${C.surface};
    border-left: 1px solid ${C.border};
    box-shadow: -20px 0 50px rgba(28,28,30,0.1);
    z-index: 410;
    overflow-y: auto;
    padding: 28px 28px 40px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .ep-drawer-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .ep-drawer-title {
    margin: 0;
    font-size: 1.4rem;
    font-weight: 800;
    letter-spacing: -0.04em;
    color: ${C.ink};
  }

  .ep-drawer-sub {
    margin: 5px 0 0;
    font-size: 0.84rem;
    color: ${C.muted};
    font-weight: 600;
  }

  .ep-field {
    width: 100%;
    padding: 12px 14px;
    border-radius: 11px;
    border: 1px solid ${C.border};
    background: ${C.bg};
    color: ${C.ink};
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.88rem;
    outline: none;
    transition: border-color 0.18s, box-shadow 0.18s;
  }
  .ep-field::placeholder { color: ${C.faint}; }
  .ep-field:focus {
    border-color: ${C.indigoBr};
    box-shadow: 0 0 0 3px rgba(79,70,229,0.1);
    background: ${C.surface};
  }

  .ep-field-label {
    display: block;
    font-size: 0.7rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: ${C.muted};
    margin-bottom: 5px;
  }

  .ep-field-group { display: flex; flex-direction: column; gap: 4px; }

  .ep-drawer-submit {
    width: 100%;
    padding: 14px;
    border-radius: 12px;
    border: none;
    background: ${C.indigo};
    color: #FFFFFF;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.9rem;
    font-weight: 800;
    cursor: pointer;
    box-shadow: 0 8px 20px rgba(79,70,229,0.25);
    transition: background 0.18s, transform 0.18s, box-shadow 0.18s, opacity 0.18s;
  }
  .ep-drawer-submit:hover:not(:disabled) {
    background: ${C.indigoD};
    transform: translateY(-1px);
    box-shadow: 0 12px 24px rgba(79,70,229,0.3);
  }
  .ep-drawer-submit:disabled { opacity: 0.55; cursor: not-allowed; }

  .ep-form-error {
    font-size: 0.8rem;
    font-weight: 600;
    color: ${C.red};
    margin: 0;
  }

  /* ── Responsive ── */
  @media (max-width: 900px) {
    .ep-grid { grid-template-columns: repeat(2, 1fr); }
  }

  @media (max-width: 640px) {
    .ep { padding: 20px 16px 64px; }
    .ep-grid { grid-template-columns: 1fr; }
    .ep-header { align-items: flex-start; }
    .ep-create-btn { width: 100%; }
    .ep-modal { border-radius: 20px; }
    .ep-backdrop { padding: 12px; }
    .ep-drawer { padding: 20px 18px 32px; }
  }
`;

/* ─── Helpers ────────────────────────────────────────────────── */
function fmtDay(d)   { return new Date(d).getDate(); }
function fmtMonth(d) { return new Date(d).toLocaleDateString('en-US', { month: 'short' }); }
function fmtTime(d) {
  return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}
function fmtFullDate(d) {
  return new Date(d).toLocaleDateString('en-US', {
    weekday: 'short', month: 'long', day: 'numeric', year: 'numeric',
  });
}
function getCategoryLabel(cat) {
  return CATEGORIES.find(c => c.id === cat)?.label || cat || 'General';
}
function getCategoryCounts(items) {
  return CATEGORIES.reduce((acc, cat) => {
    acc[cat.id] = cat.id === 'All Events'
      ? items.length
      : items.filter(e => (e.category || 'General') === cat.id).length;
    return acc;
  }, {});
}

/* ─── EventCard ─────────────────────────────────────────────── */
function EventCard({ event, onOpen, canModerate, onDelete }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <motion.article
      className="ep-card"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={SPRING}
      layout
    >
      <div className="ep-card-top">
        {/* Date anchor */}
        <div className="ep-date-anchor">
          <span className="ep-date-day">{fmtDay(event.startAt)}</span>
          <span className="ep-date-month">{fmtMonth(event.startAt)}</span>
        </div>

        {/* Info */}
        <div className="ep-card-info">
          <span className="ep-card-category">{getCategoryLabel(event.category || 'General')}</span>
          <h3 className="ep-card-title">{event.title}</h3>
          <div className="ep-card-meta">
            <div className="ep-card-meta-row">
              <Clock size={12} strokeWidth={2.5} />
              <span>{fmtTime(event.startAt)}</span>
            </div>
            {event.location && (
              <div className="ep-card-meta-row">
                <MapPin size={12} strokeWidth={2.5} />
                <span>{event.location}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="ep-card-footer" style={{ justifyContent: 'space-between' }}>
        <button className="ep-view-btn" onClick={() => onOpen(event)}>
          View Details <ArrowRight size={13} strokeWidth={2.5} />
        </button>

        {canModerate && !confirming && (
          <button className="ep-cancel-btn" onClick={e => { e.stopPropagation(); setConfirming(true); }}>
            <Trash2 size={12} /> Cancel
          </button>
        )}
        {canModerate && confirming && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: C.red, fontWeight: 700 }}>Cancel event?</span>
            <button className="ep-cancel-btn" style={{ color: C.red, fontWeight: 800 }}
              onClick={e => { e.stopPropagation(); onDelete(event._id); }}>
              Yes
            </button>
            <button className="ep-cancel-btn"
              onClick={e => { e.stopPropagation(); setConfirming(false); }}>
              No
            </button>
          </div>
        )}
      </div>
    </motion.article>
  );
}

/* ─── SmartModal ────────────────────────────────────────────── */
function SmartModal({ event, onClose }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  if (!event) return null;

  return (
    <motion.div
      className="ep-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onClose}
    >
      <motion.div
        className="ep-modal"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={SPRING}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="ep-modal-header">
          <div className="ep-modal-date">
            <span className="ep-modal-date-day">{fmtDay(event.startAt)}</span>
            <span className="ep-modal-date-month">{fmtMonth(event.startAt)}</span>
          </div>
          <div className="ep-modal-head-body">
            <span className="ep-modal-category">{getCategoryLabel(event.category || 'General')}</span>
            <h2 className="ep-modal-title">{event.title}</h2>
          </div>
          <button className="ep-modal-close" onClick={onClose} aria-label="Close">
            <X size={16} strokeWidth={2.4} />
          </button>
        </div>

        {/* Meta */}
        <div className="ep-modal-body">
          <div className="ep-modal-meta">
            <div className="ep-modal-meta-row">
              <Clock size={14} strokeWidth={2.3} />
              <span>{fmtFullDate(event.startAt)} · {fmtTime(event.startAt)} – {fmtTime(event.endAt)}</span>
            </div>
            {event.location && (
              <div className="ep-modal-meta-row">
                <MapPin size={14} strokeWidth={2.3} />
                <span>{event.location}</span>
              </div>
            )}
          </div>

          {/* Description */}
          <p className="ep-modal-desc-label">About this event</p>
          <p className="ep-modal-desc">
            {event.description || 'No description provided for this event.'}
          </p>
        </div>

        <div className="ep-modal-footer">
          <button className="ep-modal-close-btn" onClick={onClose}>Close</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Constants ─────────────────────────────────────────────── */
const EMPTY_FORM = { title: '', category: 'General', location: '', startAt: '', endAt: '', description: '' };

/* ─── EventsPage ────────────────────────────────────────────── */
export function EventsPage() {
  const { token, user } = useAuth();
  const [events,       setEvents]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [selCategory,  setSelCategory]  = useState('All Events');
  const [selEvent,     setSelEvent]     = useState(null);
  const [drawerOpen,   setDrawerOpen]   = useState(false);
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [submitting,   setSubmitting]   = useState(false);
  const [formError,    setFormError]    = useState('');

  /* ── Fetch ── */
  useEffect(() => {
    apiRequest('/events', { token })
      .then(data => { setEvents(data.items || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  /* ── Form helpers ── */
  function setField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleCreate() {
    setFormError('');
    if (!form.title.trim())          return setFormError('Event title is required.');
    if (!form.startAt)               return setFormError('Start date & time is required.');
    if (!form.endAt)                 return setFormError('End date & time is required.');
    const startDate = new Date(form.startAt);
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
    if (startDate < oneHourFromNow)  return setFormError('Event must start at least 1 hour from now.');
    if (form.endAt <= form.startAt)  return setFormError('End time must be after start time.');

    setSubmitting(true);
    try {
      const { item } = await apiRequest('/events', {
        token, method: 'POST',
        body: {
          title:       form.title.trim(),
          category:    form.category,
          location:    form.location.trim(),
          startAt:     form.startAt,
          endAt:       form.endAt,
          description: form.description.trim(),
        },
        notifySuccess: true,
        successMessage: 'Event published!',
      });
      setEvents(prev => [...prev, item]);
      setForm(EMPTY_FORM);
      setDrawerOpen(false);
    } catch {
      /* toast shown by apiRequest */
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Derived ── */
  const upcoming = useMemo(() =>
    events
      .filter(e => new Date(e.startAt) >= new Date())
      .sort((a, b) => new Date(a.startAt) - new Date(b.startAt)),
    [events]
  );

  const filtered = useMemo(() =>
    selCategory === 'All Events'
      ? upcoming
      : upcoming.filter(e => (e.category || 'General') === selCategory),
    [upcoming, selCategory]
  );

  const counts = useMemo(() => getCategoryCounts(upcoming), [upcoming]);

  const canCreate = ['committee', 'super_admin'].includes(user?.role);

  async function handleDelete(eventId) {
    try {
      await apiRequest(`/events/${eventId}`, { token, method: 'DELETE', notifySuccess: true, successMessage: 'Event cancelled.' });
      setEvents(prev => prev.filter(e => e._id !== eventId));
      if (selEvent?._id === eventId) setSelEvent(null);
    } catch (_) {}
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="ep">
        <div className="ep-shell">

          {/* Header */}
          <motion.div
            className="ep-header"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING, delay: 0.04 }}
          >
            <div>
              <h1 className="ep-title">Events</h1>
              <p className="ep-sub">Upcoming community events &amp; gatherings</p>
            </div>
            {canCreate && (
              <button className="ep-create-btn" onClick={() => setDrawerOpen(true)}>
                <Plus size={15} /> Create Event
              </button>
            )}
          </motion.div>

          {/* Tab rail */}
          <motion.div
            className="ep-tabs"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING, delay: 0.08 }}
          >
            {CATEGORIES.map(cat => {
              const active = selCategory === cat.id;
              return (
                <motion.button
                  key={cat.id}
                  className={`ep-tab${active ? ' active' : ''}`}
                  onClick={() => setSelCategory(cat.id)}
                  animate={{ color: active ? C.ink : C.muted }}
                  variants={!active ? { "tab-hover": { color: C.ink2 } } : {}}
                  whileHover="tab-hover"
                  whileTap={{ scale: 0.96 }}
                  transition={{ color: { duration: 0.14 } }}
                >
                  {cat.label}
                  <span className="ep-tab-count">{counts[cat.id] ?? 0}</span>
                  {active && (
                    <motion.div
                      layoutId="ep-active-tab"
                      className="ep-tab-line"
                      transition={SPRING}
                    />
                  )}
                </motion.button>
              );
            })}
          </motion.div>

          {/* Grid */}
          <div className="ep-grid">
            {loading ? (
              <div className="ep-empty">Loading events…</div>
            ) : filtered.length === 0 ? (
              <div className="ep-empty">No upcoming events in this category.</div>
            ) : (
              <AnimatePresence mode="popLayout">
                {filtered.map(event => (
                  <EventCard key={event._id} event={event} onOpen={setSelEvent} canModerate={canCreate} onDelete={handleDelete} />
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Detail modal */}
        <AnimatePresence>
          {selEvent && <SmartModal event={selEvent} onClose={() => setSelEvent(null)} />}
        </AnimatePresence>

        {/* Create drawer */}
        <AnimatePresence>
          {drawerOpen && (
            <>
              <motion.div
                className="ep-drawer-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setDrawerOpen(false)}
              />
              <motion.aside
                className="ep-drawer"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={SPRING}
              >
                <div className="ep-drawer-head">
                  <div>
                    <h2 className="ep-drawer-title">Create Event</h2>
                    <p className="ep-drawer-sub">Fill in the details and publish to all residents.</p>
                  </div>
                  <button className="ep-modal-close" onClick={() => setDrawerOpen(false)} aria-label="Close">
                    <X size={16} strokeWidth={2.4} />
                  </button>
                </div>

                <form
                  style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
                  onSubmit={e => { e.preventDefault(); handleCreate(); }}
                >
                  <div className="ep-field-group">
                    <label className="ep-field-label">Title *</label>
                    <input className="ep-field" placeholder="e.g. Diwali Celebration" value={form.title} onChange={e => setField('title', e.target.value)} />
                  </div>

                  <div className="ep-field-group">
                    <label className="ep-field-label">Category</label>
                    <select className="ep-field" value={form.category} onChange={e => setField('category', e.target.value)}>
                      <option value="General">General</option>
                      <option value="Cultural">Cultural</option>
                      <option value="Workshop">Workshop</option>
                    </select>
                  </div>

                  <div className="ep-field-group">
                    <label className="ep-field-label">Location</label>
                    <input className="ep-field" placeholder="e.g. Club House" value={form.location} onChange={e => setField('location', e.target.value)} />
                  </div>

                  <div className="ep-field-group">
                    <label className="ep-field-label">Start date &amp; time *</label>
                    <input className="ep-field" type="datetime-local" value={form.startAt} onChange={e => setField('startAt', e.target.value)} />
                  </div>

                  <div className="ep-field-group">
                    <label className="ep-field-label">End date &amp; time *</label>
                    <input className="ep-field" type="datetime-local" value={form.endAt} onChange={e => setField('endAt', e.target.value)} />
                  </div>

                  <div className="ep-field-group">
                    <label className="ep-field-label">Description</label>
                    <textarea className="ep-field" placeholder="What's this event about?" rows={4} value={form.description} onChange={e => setField('description', e.target.value)} />
                  </div>

                  {formError && <p className="ep-form-error">{formError}</p>}

                  <button type="submit" className="ep-drawer-submit" disabled={submitting}>
                    {submitting ? 'Publishing…' : 'Publish Event'}
                  </button>
                </form>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
