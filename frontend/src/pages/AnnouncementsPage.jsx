import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../components/api";
import { useAuth } from "../components/AuthContext";
import { RefreshCw, Megaphone, ChevronDown, ChevronUp } from "lucide-react";

/* ─── Design tokens ──────────────────────────────────────────── */
const T = {
  bg:           "#0a0907",
  surface:      "#111008",
  surfaceHigh:  "#161310",
  border:       "rgba(200,145,74,0.12)",
  borderHover:  "rgba(200,145,74,0.32)",
  gold:         "#c8914a",
  goldLight:    "#e8c47a",
  textPrimary:  "#f5f0e8",
  textSecondary:"rgba(245,240,232,0.55)",
  textMuted:    "rgba(245,240,232,0.3)",
  green:        "#3d9e6e",
  red:          "#e85d5d",
  amber:        "#d4a843",
  blue:         "#4d8dd4",
};

/* ─── Category config ────────────────────────────────────────── */
const CATS = {
  General:     { color: T.gold,  border: "rgba(200,145,74,0.3)",  bg: "rgba(200,145,74,0.1)",  accent: T.gold  },
  Maintenance: { color: T.blue,  border: "rgba(77,141,212,0.3)",  bg: "rgba(77,141,212,0.1)",  accent: T.blue  },
  Finance:     { color: "#9b64c8", border: "rgba(155,100,200,0.3)", bg: "rgba(155,100,200,0.1)", accent: "#9b64c8" },
  Emergency:   { color: T.red,   border: "rgba(232,93,93,0.3)",   bg: "rgba(232,93,93,0.1)",   accent: T.red   },
  Event:       { color: T.green, border: "rgba(61,158,110,0.3)",  bg: "rgba(61,158,110,0.1)",  accent: T.green },
  Social:      { color: T.amber, border: "rgba(212,168,67,0.3)",  bg: "rgba(212,168,67,0.1)",  accent: T.amber },
};
const CAT_LIST = Object.keys(CATS);
function catOf(item) { return item?.category && CATS[item.category] ? item.category : "General"; }

/* ─── CSS ────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;600&display=swap');

  .ann-root * { box-sizing: border-box; }
  .ann-root    { font-family: 'DM Sans', sans-serif; }
  .ann-display { font-family: 'Cormorant Garamond', serif !important; }

  /* Card */
  .ann-card {
    position: relative;
    border-radius: 16px;
    border: 1px solid rgba(200,145,74,0.12);
    background: #111008;
    padding: 20px 20px 16px 24px;
    transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.2s ease;
    overflow: hidden;
    cursor: default;
  }
  .ann-card:hover {
    border-color: rgba(200,145,74,0.32);
    box-shadow: 0 8px 40px rgba(200,145,74,0.07), 0 2px 12px rgba(0,0,0,0.4);
    transform: translateY(-1px);
  }
  .ann-card.unread {
    background: #161310;
    border-color: rgba(200,145,74,0.2);
  }

  /* Left accent strip — colored by category */
  .ann-card::before {
    content: '';
    position: absolute;
    left: 0; top: 14px; bottom: 14px;
    width: 3px;
    border-radius: 0 2px 2px 0;
    background: var(--cat-accent);
    opacity: 0.75;
    transition: opacity 0.2s, height 0.2s;
  }
  .ann-card:hover::before { opacity: 1; top: 8px; bottom: 8px; }
  .ann-card.unread::before { opacity: 1; }

  /* Unread dot */
  @keyframes dotPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(200,145,74,0.4); }
    50%       { box-shadow: 0 0 0 5px rgba(200,145,74,0); }
  }
  .unread-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: #c8914a;
    flex-shrink: 0;
    animation: dotPulse 2s ease-in-out infinite;
  }

  /* Stagger entrance */
  @keyframes annFadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .ann-enter {
    opacity: 0;
    animation: annFadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }

  /* Skeleton */
  @keyframes skShimmer {
    0%   { background-position:  200% center; }
    100% { background-position: -200% center; }
  }
  .ann-sk {
    background: linear-gradient(90deg,
      rgba(255,255,255,0.04) 25%,
      rgba(255,255,255,0.07) 50%,
      rgba(255,255,255,0.04) 75%);
    background-size: 200% 100%;
    animation: skShimmer 1.6s ease-in-out infinite;
    border-radius: 8px;
  }

  /* Form fields */
  .ann-input {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(200,145,74,0.1);
    border-radius: 11px;
    padding: 12px 14px;
    color: #f5f0e8;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem;
    outline: none;
    resize: vertical;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .ann-input::placeholder { color: rgba(245,240,232,0.25); }
  .ann-input:focus {
    border-color: #c8914a;
    box-shadow: 0 0 0 3px rgba(200,145,74,0.12);
  }

  /* Select */
  .ann-select {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(200,145,74,0.1);
    border-radius: 11px;
    padding: 12px 14px;
    color: #f5f0e8;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem;
    outline: none;
    cursor: pointer;
    appearance: none;
    transition: border-color 0.2s;
  }
  .ann-select:focus { border-color: #c8914a; }
  option { background: #1a1710; color: #f5f0e8; }

  /* Gold button */
  .ann-btn-gold {
    display: inline-flex; align-items: center; gap: 7px;
    background: linear-gradient(135deg, #c8914a, #e8c47a);
    color: #0a0907;
    border: none; border-radius: 11px;
    padding: 11px 20px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.88rem; font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 18px rgba(200,145,74,0.32);
    transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
  }
  .ann-btn-gold:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 7px 24px rgba(200,145,74,0.45);
  }
  .ann-btn-gold:disabled { opacity: 0.55; cursor: not-allowed; }

  /* Ghost button */
  .ann-btn-ghost {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(200,145,74,0.15);
    color: rgba(245,240,232,0.45);
    border-radius: 100px;
    padding: 7px 14px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.78rem; font-weight: 500;
    cursor: pointer;
    transition: border-color 0.2s, color 0.2s, background 0.2s;
  }
  .ann-btn-ghost:hover {
    border-color: rgba(200,145,74,0.35);
    color: #c8914a;
    background: rgba(200,145,74,0.06);
  }
  .ann-btn-ghost:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Form collapse */
  @keyframes formOpen {
    from { opacity: 0; transform: translateY(-10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .ann-form-body { animation: formOpen 0.28s ease forwards; }

  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.45} }
`;

/* ─── Helpers ─────────────────────────────────────────────────── */
function timeAgo(date) {
  if (!date) return "";
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function isRecent(dateStr) {
  return dateStr && (Date.now() - new Date(dateStr)) < 24 * 60 * 60 * 1000;
}

/* ─── Skeleton card ──────────────────────────────────────────── */
function SkCard() {
  return (
    <div style={{
      borderRadius: 16, border: "1px solid rgba(200,145,74,0.08)",
      background: "#111008", padding: "20px 20px 16px 24px",
      display: "flex", flexDirection: "column", gap: 10,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div className="ann-sk" style={{ height: 14, width: "25%" }} />
        <div className="ann-sk" style={{ height: 14, width: "12%" }} />
      </div>
      <div className="ann-sk" style={{ height: 18, width: "60%" }} />
      <div className="ann-sk" style={{ height: 13, width: "85%" }} />
      <div className="ann-sk" style={{ height: 13, width: "70%" }} />
      <div className="ann-sk" style={{ height: 11, width: "28%", marginTop: 4 }} />
    </div>
  );
}

/* ─── Category pill ──────────────────────────────────────────── */
function CatPill({ category }) {
  const c = CATS[category] || CATS.General;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "3px 10px", borderRadius: "100px",
      fontSize: "0.62rem", fontWeight: 700,
      letterSpacing: "0.08em", textTransform: "uppercase",
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      flexShrink: 0,
    }}>
      {category}
    </span>
  );
}

/* ─── Announcement card ───────────────────────────────────────── */
function AnnCard({ item, unread, onRead }) {
  const cat = catOf(item);
  const cc  = CATS[cat];
  const [expanded, setExpanded] = useState(false);
  const isLong = item.body && item.body.length > 160;
  const displayBody = isLong && !expanded ? item.body.slice(0, 160) + "…" : item.body;

  return (
    <article
      className={`ann-card${unread ? " unread" : ""}`}
      style={{ "--cat-accent": cc.accent }}
      onMouseEnter={onRead}
    >
      {/* Top row: category + unread dot + time */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <CatPill category={cat} />
        {unread && <div className="unread-dot" />}
        <span style={{ marginLeft: "auto", fontSize: "0.7rem", color: T.textMuted, flexShrink: 0 }}>
          {timeAgo(item.createdAt)}
        </span>
      </div>

      {/* Title */}
      <h3
        className="ann-display"
        style={{
          fontSize: "1.2rem", fontWeight: 600,
          color: T.textPrimary, margin: "0 0 8px",
          lineHeight: 1.3,
        }}
      >
        {item.title}
      </h3>

      {/* Body */}
      <p style={{
        fontSize: "0.87rem", color: T.textSecondary,
        lineHeight: 1.7, margin: 0,
      }}>
        {displayBody}
      </p>

      {/* Read more toggle */}
      {isLong && (
        <button
          onClick={() => setExpanded(v => !v)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: T.gold, fontSize: "0.78rem", fontWeight: 500,
            padding: "6px 0 0", display: "inline-flex", alignItems: "center", gap: 3,
          }}
        >
          {expanded ? <><ChevronUp size={13} /> Show less</> : <><ChevronDown size={13} /> Read more</>}
        </button>
      )}

      {/* Footer: author */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginTop: 14, paddingTop: 12,
        borderTop: "1px solid rgba(245,240,232,0.05)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Author avatar */}
          <div style={{
            width: 22, height: 22, borderRadius: "50%",
            background: "rgba(200,145,74,0.12)",
            border: "1px solid rgba(200,145,74,0.22)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.6rem", fontWeight: 700, color: T.gold,
            flexShrink: 0,
          }}>
            {(item.createdBy?.fullName || "C")[0].toUpperCase()}
          </div>
          <span style={{ fontSize: "0.75rem", color: T.textMuted }}>
            {item.createdBy?.fullName || "Committee"}
          </span>
        </div>
        {unread && (
          <span style={{
            fontSize: "0.62rem", fontWeight: 600, color: T.gold,
            letterSpacing: "0.06em", textTransform: "uppercase",
          }}>
            New
          </span>
        )}
      </div>
    </article>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ANNOUNCEMENTS PAGE
═══════════════════════════════════════════════════════════════ */
export function AnnouncementsPage() {
  const { token, user } = useAuth();
  const [items, setItems]       = useState([]);
  const [title, setTitle]       = useState("");
  const [body, setBody]         = useState("");
  const [category, setCategory] = useState("General");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [submitting, setSubmit] = useState(false);
  const [showForm, setShowForm] = useState(false);

  /* Track which item IDs have been "read" this session */
  const [readIds, setReadIds] = useState(() => new Set());
  function markRead(id) {
    setReadIds(prev => { const s = new Set(prev); s.add(id); return s; });
  }

  const canCreate = useMemo(() =>
    ["committee", "super_admin"].includes(user?.role), [user?.role]);

  async function loadItems() {
    setLoading(true); setError("");
    try {
      const data = await apiRequest("/announcements", { token });
      setItems(data.items || []);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setSubmit(true); setError("");
    try {
      const data = await apiRequest("/announcements", {
        method: "POST", token, body: { title, body, category },
      });
      setItems(prev => [data.item, ...prev]);
      setTitle(""); setBody(""); setCategory("General");
      setShowForm(false);
    } catch (err) { setError(err.message); }
    finally { setSubmit(false); }
  }

  useEffect(() => { loadItems(); }, []);

  return (
    <>
      <style>{CSS}</style>
      <div className="ann-root" style={{ maxWidth: 720, margin: "0 auto", paddingBottom: 64 }}>

        {/* ── Page header ── */}
        <div className="ann-enter" style={{ marginBottom: 28, animationDelay: "0ms" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
            <div>
              <p style={{
                fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.14em",
                textTransform: "uppercase", color: T.gold, marginBottom: 6, opacity: 0.75,
              }}>
                Community
              </p>
              <h1
                className="ann-display"
                style={{ fontSize: "clamp(2rem, 4vw, 2.8rem)", fontWeight: 600, color: T.textPrimary, margin: 0, lineHeight: 1.1 }}
              >
                Notices
              </h1>
              <p style={{ fontSize: "0.85rem", color: T.textMuted, marginTop: 6, fontWeight: 300 }}>
                Official announcements from your society
              </p>
            </div>

            <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
              {canCreate && (
                <button className="ann-btn-gold" onClick={() => setShowForm(v => !v)}>
                  <Megaphone size={14} />
                  {showForm ? "Cancel" : "Post"}
                </button>
              )}
              <button className="ann-btn-ghost" onClick={loadItems} disabled={loading}>
                <RefreshCw size={12} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
                Refresh
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              marginTop: 14, padding: "11px 16px",
              background: "rgba(232,93,93,0.08)", border: "1px solid rgba(232,93,93,0.22)",
              borderRadius: 12, fontSize: "0.85rem", color: T.red,
            }}>
              {error}
            </div>
          )}
        </div>

        {/* ── Admin create form ── */}
        {canCreate && showForm && (
          <div
            className="ann-form-body ann-enter"
            style={{
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: 18,
              padding: "24px",
              marginBottom: 24,
              animationDelay: "0ms",
            }}
          >
            {/* Gold top strip */}
            <div style={{
              height: 2, borderRadius: "18px 18px 0 0",
              background: "linear-gradient(90deg,#c8914a,#e8c47a44)",
              margin: "-24px -24px 20px",
            }} />

            <p style={{ fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: T.gold, marginBottom: 6, opacity: 0.75 }}>
              New Announcement
            </p>
            <h2
              className="ann-display"
              style={{ fontSize: "1.4rem", fontWeight: 600, color: T.textPrimary, margin: "0 0 20px" }}
            >
              Post to Community
            </h2>

            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Category */}
              <div style={{ position: "relative" }}>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 500, color: T.textMuted, letterSpacing: "0.04em", marginBottom: 6 }}>
                  Category
                </label>
                <select
                  className="ann-select"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                >
                  {CAT_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Title */}
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 500, color: T.textMuted, letterSpacing: "0.04em", marginBottom: 6 }}>
                  Title
                </label>
                <input
                  className="ann-input"
                  placeholder="e.g. Water supply disruption on 15th Jan"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
              </div>

              {/* Body */}
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 500, color: T.textMuted, letterSpacing: "0.04em", marginBottom: 6 }}>
                  Message
                </label>
                <textarea
                  className="ann-input"
                  style={{ minHeight: 110 }}
                  placeholder="Write your announcement here…"
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 4 }}>
                <button className="ann-btn-gold" type="submit" disabled={submitting}>
                  {submitting ? "Posting…" : <><Megaphone size={14} /> Post Announcement</>}
                </button>
                <button
                  type="button"
                  className="ann-btn-ghost"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── List ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

          {/* Skeletons while loading */}
          {loading && [0, 1, 2, 3].map(i => (
            <div key={i} className="ann-enter" style={{ animationDelay: `${i * 60}ms` }}>
              <SkCard />
            </div>
          ))}

          {/* Empty state */}
          {!loading && items.length === 0 && (
            <div
              className="ann-enter"
              style={{
                textAlign: "center", padding: "64px 32px",
                animationDelay: "80ms",
              }}
            >
              <div
                style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: "rgba(200,145,74,0.07)",
                  border: "1px solid rgba(200,145,74,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, margin: "0 auto 14px",
                }}
              >
                📭
              </div>
              <p
                className="ann-display"
                style={{ fontSize: "1.35rem", fontWeight: 600, color: T.textSecondary, margin: "0 0 6px", fontStyle: "italic" }}
              >
                No voices yet.
              </p>
              <p style={{ fontSize: "0.84rem", color: T.textMuted, margin: 0, fontWeight: 300 }}>
                Your community's first announcement will appear here.
              </p>
            </div>
          )}

          {/* Announcement cards */}
          {!loading && items.map((item, i) => {
            const unread = isRecent(item.createdAt) && !readIds.has(item._id);
            return (
              <div
                key={item._id}
                className="ann-enter"
                style={{ animationDelay: `${i * 55}ms` }}
              >
                <AnnCard
                  item={item}
                  unread={unread}
                  onRead={() => markRead(item._id)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
