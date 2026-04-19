import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiRequest } from "../components/api";
import { useAuth } from "../components/AuthContext";
import { RefreshCw, Megaphone, ChevronDown, ChevronUp, Search, X } from "lucide-react";
import ReactQuill from "react-quill";
import DOMPurify from "dompurify";
import "react-quill/dist/quill.snow.css";

/* ─── Design tokens — AptHive system ────────────────────────── */
const T = {
  bg:      "#F7F8FA",
  surface: "#FFFFFF",
  subtle:  "#F9FAFB",
  subtle2: "#F3F4F6",
  border:  "#F0F0F0",
  borderHv:"#E5E7EB",
  ink:     "#111827",
  ink2:    "#374151",
  text2:   "#6B7280",
  text3:   "#9CA3AF",
  green:   "#16A34A",
  greenL:  "#DCFCE7",
  red:     "#DC2626",
  redL:    "#FEE2E2",
  amber:   "#E8890C",
  amberL:  "#FFF8F0",
  amberM:  "#FDECC8",
  teal:    "#0F766E",
  tealL:   "#CCFBF1",
  purple:  "#7C3AED",
  purpleL: "#F5F3FF",
  purpleM: "#DDD6FE",
  sh:      "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)",
  sh2:     "0 4px 16px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)",
};

/* ─── Category config — semantic colors only ─────────────────── */
const CATS = {
  General:     { color: "#6B7280", border: "#E5E7EB", bg: "#F9FAFB",  accent: "#9CA3AF" },
  Finance:     { color: "#0F766E", border: "#99F6E4", bg: "#F0FDFA",  accent: "#0D9488" },
  Emergency:   { color: "#DC2626", border: "#FECACA", bg: "#FEE2E2",  accent: "#DC2626" },
  Maintenance: { color: "#B45309", border: "#FDE68A", bg: "#FFFBEB",  accent: "#D97706" },
  Event:       { color: "#16A34A", border: "#BBF7D0", bg: "#DCFCE7",  accent: "#16A34A" },
  Social:      { color: "#7C3AED", border: "#DDD6FE", bg: "#F5F3FF",  accent: "#7C3AED" },
};

/* Emergency and Maintenance removed from filter/create per user request */
const CAT_META = {
  All:     "All",
  Event:   "Event",
  General: "General",
  Finance: "Finance",
  Social:  "Social",
};
const CAT_LIST = ["General", "Finance", "Event", "Social"];
function catOf(item) { return item?.category && CATS[item.category] ? item.category : "General"; }

/* ─── CSS ────────────────────────────────────────────────────── */
const CSS = `
  .ann-root * { box-sizing: border-box; }
  .ann-root {
    font-family: 'DM Sans', sans-serif;
    color: ${T.ink};
    background: ${T.bg};
    min-height: calc(100vh - 64px);
    padding: 28px 28px 80px;
  }

  .ann-display {
    font-family: 'Plus Jakarta Sans', sans-serif !important;
    letter-spacing: -0.4px;
  }

  /* ── Card ── */
  .ann-card {
    position: relative;
    border-radius: 12px;
    border: 1px solid ${T.border};
    background: ${T.surface};
    padding: 14px 16px 12px 18px;
    box-shadow: ${T.sh};
    transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
    overflow: hidden;
    cursor: default;
  }
  .ann-card:hover {
    border-color: ${T.borderHv};
    box-shadow: ${T.sh2};
    transform: translateY(-1px);
  }
  .ann-card.unread {
    background: #FDFCFF;
    border-color: ${T.border};
  }

  /* Left accent strip */
  .ann-card::before {
    content: '';
    position: absolute;
    left: 0; top: 16px; bottom: 16px;
    width: 3px;
    border-radius: 0 2px 2px 0;
    background: var(--cat-accent);
    opacity: 0.6;
    transition: opacity 0.2s, top 0.2s, bottom 0.2s;
  }
  .ann-card:hover::before { opacity: 1; top: 10px; bottom: 10px; }
  .ann-card.unread::before { opacity: 1; }

  /* Unread dot */
  @keyframes dotPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(124,58,237,0.35); }
    50%       { box-shadow: 0 0 0 5px rgba(124,58,237,0); }
  }
  .unread-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: ${T.purple};
    flex-shrink: 0;
    animation: dotPulse 2.2s ease-in-out infinite;
  }

  /* Entrance animation */
  @keyframes annFadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .ann-enter {
    opacity: 0;
    animation: annFadeUp 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }

  /* Skeleton shimmer */
  @keyframes skShimmer {
    0%   { background-position: 200% center; }
    100% { background-position: -200% center; }
  }
  .ann-sk {
    background: linear-gradient(90deg, #F3F4F6 25%, #E5E7EB 50%, #F3F4F6 75%);
    background-size: 200% 100%;
    animation: skShimmer 1.6s ease-in-out infinite;
    border-radius: 6px;
  }

  /* Form inputs */
  .ann-input {
    width: 100%;
    background: ${T.surface};
    border: 1px solid ${T.border};
    border-radius: 10px;
    padding: 11px 14px;
    color: ${T.ink};
    font-family: 'DM Sans', sans-serif;
    font-size: 0.88rem;
    outline: none;
    resize: vertical;
    transition: border-color 0.18s, box-shadow 0.18s;
  }
  .ann-input::placeholder { color: ${T.text3}; }
  .ann-input:focus {
    border-color: #D1D5DB;
    box-shadow: 0 0 0 3px rgba(232,137,12,.1);
  }

  .ann-select {
    width: 100%;
    background: ${T.surface};
    border: 1px solid ${T.border};
    border-radius: 10px;
    padding: 11px 14px;
    color: ${T.ink};
    font-family: 'DM Sans', sans-serif;
    font-size: 0.88rem;
    outline: none;
    cursor: pointer;
    appearance: none;
    transition: border-color 0.18s, box-shadow 0.18s;
  }
  .ann-select:focus {
    border-color: #D1D5DB;
    box-shadow: 0 0 0 3px rgba(232,137,12,.1);
  }

  /* Primary button */
  .ann-btn-primary {
    display: inline-flex; align-items: center; gap: 7px;
    background: linear-gradient(135deg, #E8890C, #C97508);
    color: #FFFFFF;
    border: none; border-radius: 10px;
    padding: 10px 18px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.84rem; font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(232,137,12,.25);
    transition: background 0.18s, box-shadow 0.18s, transform 0.18s;
  }
  .ann-btn-primary:hover:not(:disabled) {
    background: linear-gradient(135deg, #C97508, #A86206);
    box-shadow: 0 6px 18px rgba(232,137,12,.32);
    transform: translateY(-1px);
  }
  .ann-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Ghost button */
  .ann-btn-ghost {
    display: inline-flex; align-items: center; gap: 6px;
    background: ${T.surface};
    border: 1px solid ${T.border};
    color: ${T.text2};
    border-radius: 10px;
    padding: 9px 14px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.82rem; font-weight: 500;
    cursor: pointer;
    transition: border-color 0.18s, color 0.18s, box-shadow 0.18s;
  }
  .ann-btn-ghost:hover {
    border-color: ${T.borderHv};
    color: ${T.ink};
    box-shadow: 0 0 0 3px rgba(0,0,0,.05);
  }
  .ann-btn-ghost:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Form slide-in */
  @keyframes formOpen {
    from { opacity: 0; transform: translateY(-8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .ann-form-body { animation: formOpen 0.25s ease forwards; }

  /* Filter bar */
  .ann-filter-bar {
    position: sticky;
    top: 64px;
    z-index: 8;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    background: rgba(247,248,250,0.94);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid ${T.border};
    border-radius: 12px;
    padding: 10px 12px;
    margin-bottom: 16px;
  }

  /* Filter chip */
  .ann-chip {
    border: 1px solid ${T.border};
    border-radius: 100px;
    background: ${T.surface};
    color: ${T.text2};
    font-family: 'DM Sans', sans-serif;
    font-size: 0.72rem;
    font-weight: 600;
    padding: 4px 12px;
    cursor: pointer;
    transition: all 0.18s ease;
    white-space: nowrap;
  }
  .ann-chip:hover {
    border-color: ${T.borderHv};
    color: ${T.ink};
  }
  .ann-chip.active {
    background: ${T.purple};
    color: #FFFFFF;
    border-color: ${T.purple};
  }

  /* Search wrapper */
  .ann-search-wrap {
    display: flex; align-items: center; gap: 8px;
    margin-left: auto;
    background: ${T.surface};
    border: 1px solid ${T.border};
    border-radius: 10px;
    padding: 7px 12px;
    min-width: 200px;
    max-width: 280px;
    flex: 1;
    transition: border-color 0.18s, box-shadow 0.18s;
  }
  .ann-search-wrap:focus-within {
    border-color: #D1D5DB;
    box-shadow: 0 0 0 3px rgba(232,137,12,.1);
  }
  .ann-search-input {
    background: none;
    border: none;
    outline: none;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.82rem;
    color: ${T.ink};
    width: 100%;
  }
  .ann-search-input::placeholder { color: ${T.text3}; }

  /* Quill editor overrides */
  .ann-editor .ql-toolbar {
    border: 1px solid #E5E7EB !important;
    border-radius: 10px 10px 0 0 !important;
    background: #F9FAFB !important;
    font-family: 'DM Sans', sans-serif !important;
  }
  .ann-editor .ql-container {
    border: 1px solid #E5E7EB !important;
    border-top: none !important;
    border-radius: 0 0 10px 10px !important;
    font-family: 'DM Sans', sans-serif !important;
    min-height: 130px;
    font-size: 0.88rem;
    color: ${T.ink};
  }
  .ann-editor .ql-editor::before {
    font-style: normal !important;
    color: ${T.text3} !important;
  }

  /* Rich content */
  .ann-rich {
    font-family: 'DM Sans', sans-serif;
    font-size: 0.86rem;
    color: ${T.text2};
    line-height: 1.72;
  }
  .ann-rich p { margin: 0 0 8px; }
  .ann-rich ul, .ann-rich ol { margin: 0 0 8px 18px; }
  .ann-rich a { color: ${T.ink}; text-decoration: underline; }

  @keyframes spin { to { transform: rotate(360deg); } }

  @media (max-width: 720px) {
    .ann-root { padding: 20px 16px 64px; }
    .ann-search-wrap { margin-left: 0; max-width: none; }
    .ann-filter-bar { top: 56px; }
  }
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

function htmlToPlainText(value) {
  return (value || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

const editorModules = {
  toolbar: [
    [{ header: [2, 3, false] }],
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"],
  ],
};

const editorFormats = ["header", "bold", "italic", "underline", "list", "bullet", "link"];

/* ─── Label — field label ─────────────────────────────────────── */
function Label({ children }) {
  return (
    <label style={{
      display: "block",
      fontFamily: "'DM Sans', sans-serif",
      fontSize: "0.7rem", fontWeight: 600,
      color: T.text3, letterSpacing: "0.06em",
      textTransform: "uppercase", marginBottom: 6,
    }}>
      {children}
    </label>
  );
}

/* ─── Skeleton card ──────────────────────────────────────────── */
function SkCard() {
  return (
    <div style={{
      borderRadius: 16, border: `1px solid ${T.border}`,
      background: T.surface, padding: "20px 20px 16px 24px",
      display: "flex", flexDirection: "column", gap: 10,
      boxShadow: T.sh,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div className="ann-sk" style={{ height: 20, width: 72, borderRadius: 100 }} />
        <div className="ann-sk" style={{ height: 13, width: 60 }} />
      </div>
      <div className="ann-sk" style={{ height: 20, width: "58%" }} />
      <div className="ann-sk" style={{ height: 13, width: "80%" }} />
      <div className="ann-sk" style={{ height: 13, width: "65%" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
        <div className="ann-sk" style={{ width: 22, height: 22, borderRadius: "50%" }} />
        <div className="ann-sk" style={{ height: 11, width: 80 }} />
      </div>
    </div>
  );
}

/* ─── Category pill ──────────────────────────────────────────── */
function CatPill({ category }) {
  const c = CATS[category] || CATS.General;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "2px 9px", borderRadius: 100,
      fontFamily: "'DM Sans', sans-serif",
      fontSize: "0.58rem", fontWeight: 700,
      letterSpacing: "0.07em", textTransform: "uppercase",
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
  const safeHtml  = useMemo(() => DOMPurify.sanitize(item.body || ""), [item.body]);
  const plainBody = useMemo(() => htmlToPlainText(safeHtml), [safeHtml]);
  const isLong    = plainBody.length > 180;
  const displayBody = isLong && !expanded ? `${plainBody.slice(0, 180)}…` : plainBody;

  return (
    <article
      className={`ann-card${unread ? " unread" : ""}`}
      style={{ "--cat-accent": cc.accent }}
      onMouseEnter={() => unread && onRead(item._id)}
    >
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <CatPill category={cat} />
        {unread && <div className="unread-dot" />}
        <span style={{
          marginLeft: "auto",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "0.68rem", color: T.text3, flexShrink: 0,
        }}>
          {timeAgo(item.createdAt)}
        </span>
      </div>

      {/* Title */}
      <h3
        className="ann-display"
        style={{
          fontSize: "1.05rem", fontWeight: 700,
          color: T.ink, margin: "0 0 8px", lineHeight: 1.35,
        }}
      >
        {item.title}
      </h3>

      {/* Body */}
      {!expanded && (
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "0.84rem", color: T.text2,
          lineHeight: 1.65, margin: 0,
          textWrap: "pretty",
        }}>
          {displayBody}
        </p>
      )}
      {expanded && <div className="ann-rich" dangerouslySetInnerHTML={{ __html: safeHtml }} />}

      {/* Read more */}
      {isLong && (
        <button
          onClick={() => { if (!expanded && unread) onRead(item._id); setExpanded(v => !v); }}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
            color: T.text3, fontSize: "0.74rem", fontWeight: 600,
            padding: "5px 0 0", display: "inline-flex", alignItems: "center", gap: 3,
          }}
        >
          {expanded ? "↑ less" : "↓ more"}
        </button>
      )}

      {/* Author row — no border, just spacing */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginTop: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div style={{
            width: 18, height: 18, borderRadius: "50%",
            background: `linear-gradient(135deg, ${T.purple}, #6D28D9)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.48rem", fontWeight: 800, color: "#fff",
            flexShrink: 0,
          }}>
            {(item.createdBy?.fullName || "C")[0].toUpperCase()}
          </div>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.68rem", color: T.text3 }}>
            {item.createdBy?.fullName || "Committee"}
          </span>
        </div>
        {unread && (
          <span style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.55rem", fontWeight: 700, color: T.purple,
            letterSpacing: "0.08em", textTransform: "uppercase",
            background: T.purpleL, border: `1px solid ${T.purpleM}`,
            padding: "1px 7px", borderRadius: 100,
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
  const [items,         setItems]         = useState([]);
  const [title,         setTitle]         = useState("");
  const [body,          setBody]          = useState("<p></p>");
  const [category,      setCategory]      = useState("General");
  const [activeCategory,setActiveCategory]= useState("All");
  const [searchInput,   setSearchInput]   = useState("");
  const [searchQuery,   setSearchQuery]   = useState("");
  const [error,         setError]         = useState("");
  const [loading,       setLoading]       = useState(false);
  const [loadingMore,   setLoadingMore]   = useState(false);
  const [submitting,    setSubmit]        = useState(false);
  const [showForm,      setShowForm]      = useState(false);
  const [page,          setPage]          = useState(1);
  const [hasMore,       setHasMore]       = useState(false);
  const readInFlight = useRef(new Set());

  const canCreate = useMemo(() =>
    ["committee", "super_admin"].includes(user?.role), [user?.role]);
  const plainBody = useMemo(() => htmlToPlainText(body), [body]);

  const loadItems = useCallback(async ({ targetPage = 1, append = false } = {}) => {
    append ? setLoadingMore(true) : setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(targetPage), limit: "15" });
      if (activeCategory !== "All") params.set("category", activeCategory);
      if (searchQuery) params.set("q", searchQuery);
      const data = await apiRequest(`/announcements?${params.toString()}`, { token });
      const nextItems = data.items || [];
      setItems(prev => append ? [...prev, ...nextItems] : nextItems);
      setPage(data.page || targetPage);
      setHasMore(Boolean(data.hasMore));
    } catch (err) { setError(err.message); }
    finally { setLoading(false); setLoadingMore(false); }
  }, [activeCategory, searchQuery, token]);

  const markRead = useCallback(async (id) => {
    if (!id || readInFlight.current.has(id)) return;
    readInFlight.current.add(id);
    setItems(prev => prev.map(item => item._id === id ? { ...item, unread: false } : item));
    try {
      await apiRequest(`/announcements/${id}/read`, { method: "PATCH", token });
    } catch (_) {}
    finally { readInFlight.current.delete(id); }
  }, [token]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!title.trim() || !plainBody) { setError("Title and body are required"); return; }
    setSubmit(true); setError("");
    try {
      const data = await apiRequest("/announcements", {
        method: "POST", token, body: { title, body, category },
      });
      setItems(prev => [data.item, ...prev]);
      setTitle(""); setBody("<p></p>"); setCategory("General");
      setShowForm(false);
    } catch (err) { setError(err.message); }
    finally { setSubmit(false); }
  }

  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => { loadItems({ targetPage: 1, append: false }); }, [loadItems]);

  return (
    <>
      <style>{CSS}</style>
      <div className="ann-root" style={{ maxWidth: 860, margin: "0 auto" }}>

        {/* ── Page header ── */}
        <div className="ann-enter" style={{ marginBottom: 28, animationDelay: "0ms" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
            <div>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em",
                textTransform: "uppercase", color: T.purple, marginBottom: 6,
              }}>
                Community
              </p>
              <h1
                className="ann-display"
                style={{
                  fontSize: "clamp(1.8rem, 4vw, 2.4rem)",
                  fontWeight: 800, color: T.ink,
                  margin: 0, lineHeight: 1.1,
                  letterSpacing: "-0.5px",
                }}
              >
                Announcements
              </h1>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.84rem", color: T.text2,
                marginTop: 6, fontWeight: 400,
              }}>
                Official notices from your society
              </p>
            </div>

            <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
              {canCreate && (
                <button className="ann-btn-primary" onClick={() => setShowForm(v => !v)}>
                  {showForm
                    ? <><X size={13} /> Cancel</>
                    : <><Megaphone size={13} /> Post Notice</>
                  }
                </button>
              )}
              <button className="ann-btn-ghost" onClick={() => loadItems()} disabled={loading}>
                <RefreshCw size={12} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
                Refresh
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              marginTop: 14, padding: "11px 16px",
              background: T.redL, border: "1px solid #FECACA",
              borderRadius: 12,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.84rem", color: T.red,
            }}>
              {error}
            </div>
          )}
        </div>

        {/* ── Filter bar ── */}
        <div className="ann-filter-bar ann-enter" style={{ animationDelay: "30ms" }}>
          {Object.entries(CAT_META).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`ann-chip${activeCategory === key ? " active" : ""}`}
              onClick={() => setActiveCategory(key)}
            >
              {label}
            </button>
          ))}

          <div className="ann-search-wrap">
            <Search size={13} color={T.text3} strokeWidth={2} style={{ flexShrink: 0 }} />
            <input
              type="search"
              className="ann-search-input"
              placeholder="Search notices…"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
          </div>
        </div>

        {/* ── Create form ── */}
        {canCreate && showForm && (
          <div
            className="ann-form-body"
            style={{
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: 20,
              padding: "28px",
              marginBottom: 20,
              boxShadow: T.sh2,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Top accent bar */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 3,
              background: "linear-gradient(90deg, #E8890C, #C97508)",
              borderRadius: "20px 20px 0 0",
            }} />

            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em",
              textTransform: "uppercase", color: T.text3, marginBottom: 4, marginTop: 4,
            }}>
              New Announcement
            </p>
            <h2
              className="ann-display"
              style={{ fontSize: "1.25rem", fontWeight: 800, color: T.ink, margin: "0 0 22px" }}
            >
              Post to Community
            </h2>

            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
                <div>
                  <Label>Category</Label>
                  <select
                    className="ann-select"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                  >
                    {CAT_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Title</Label>
                  <input
                    className="ann-input"
                    placeholder="e.g. Water supply disruption on 15th Jan"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label>Message</Label>
                <div className="ann-editor">
                  <ReactQuill
                    theme="snow"
                    modules={editorModules}
                    formats={editorFormats}
                    value={body}
                    onChange={setBody}
                    placeholder="Write your announcement here…"
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "center", paddingTop: 4 }}>
                <button
                  className="ann-btn-primary"
                  type="submit"
                  disabled={submitting || !title.trim() || !plainBody}
                >
                  {submitting ? "Posting…" : <><Megaphone size={13} /> Post Announcement</>}
                </button>
                <button type="button" className="ann-btn-ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── List ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

          {loading && [0, 1, 2, 3].map(i => (
            <div key={i} className="ann-enter" style={{ animationDelay: `${i * 60}ms` }}>
              <SkCard />
            </div>
          ))}

          {!loading && items.length === 0 && (
            <div
              className="ann-enter"
              style={{ textAlign: "center", padding: "72px 32px", animationDelay: "80ms" }}
            >
              <div style={{
                width: 54, height: 54, borderRadius: 16,
                background: T.subtle2, border: `1px solid ${T.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, margin: "0 auto 14px",
              }}>
                📭
              </div>
              <p className="ann-display" style={{
                fontSize: "1.2rem", fontWeight: 700,
                color: T.ink, margin: "0 0 6px",
              }}>
                Nothing here yet
              </p>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.83rem", color: T.text2, margin: 0,
              }}>
                Your community's first announcement will appear here.
              </p>
            </div>
          )}

          {!loading && items.map((item, i) => {
            const unread = Boolean(item.unread);
            return (
              <div key={item._id} className="ann-enter" style={{ animationDelay: `${i * 50}ms` }}>
                <AnnCard item={item} unread={unread} onRead={markRead} />
              </div>
            );
          })}

          {!loading && items.length > 0 && hasMore && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
              <button
                type="button"
                className="ann-btn-ghost"
                onClick={() => loadItems({ targetPage: page + 1, append: true })}
                disabled={loadingMore}
              >
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
