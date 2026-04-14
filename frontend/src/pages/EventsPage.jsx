import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../components/api";
import { useAuth } from "../components/AuthContext";
import { MapPin, Clock, Plus, RefreshCw, CalendarDays } from "lucide-react";

/* ─── Design tokens ───────────────────────────────────────────── */
const T = {
  bg:           "#0a0907",
  surface:      "#111008",
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

/* ─── Cover images — curated Unsplash set ─────────────────────── */
const COVERS = [
  "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=700&q=80",
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=700&q=80",
  "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=700&q=80",
  "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=700&q=80",
  "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=700&q=80",
  "https://images.unsplash.com/photo-1493836512294-502baa1986e2?w=700&q=80",
  "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=700&q=80",
  "https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=700&q=80",
];

function coverFor(id) {
  const h = (id || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return COVERS[h % COVERS.length];
}

/* ─── CSS ─────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;600&display=swap');

  .ev-root * { box-sizing: border-box; }
  .ev-root    { font-family: 'DM Sans', sans-serif; }
  .ev-display { font-family: 'Cormorant Garamond', serif !important; }

  /* Grid */
  .ev-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 18px;
  }
  @media (max-width: 700px) { .ev-grid { grid-template-columns: 1fr; } }

  /* Card */
  .ev-card {
    position: relative;
    background: #111008;
    border: 1px solid rgba(200,145,74,0.12);
    border-radius: 18px;
    overflow: hidden;
    transition: transform 0.28s cubic-bezier(0.22,1,0.36,1),
                box-shadow  0.28s ease,
                border-color 0.25s ease;
  }
  .ev-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(200,145,74,0.22);
    border-color: rgba(200,145,74,0.28);
  }
  .ev-card.past {
    opacity: 0.65;
  }
  .ev-card.past:hover { opacity: 0.82; }

  /* Cover image */
  .ev-cover {
    width: 100%; aspect-ratio: 16/9;
    object-fit: cover;
    display: block;
    transition: filter 0.35s ease, transform 0.35s ease;
    filter: brightness(0.82);
  }
  .ev-card:hover .ev-cover {
    filter: brightness(0.96);
    transform: scale(1.025);
  }
  .ev-card.past .ev-cover {
    filter: grayscale(0.7) brightness(0.55);
  }

  /* Gradient overlay over the cover */
  .ev-cover-overlay {
    position: absolute;
    left: 0; right: 0; top: 0;
    /* same height as the image */
    aspect-ratio: 16/9;
    background: linear-gradient(
      to bottom,
      rgba(10,9,7,0.0) 0%,
      rgba(10,9,7,0.15) 55%,
      rgba(17,16,8,0.98) 100%
    );
    pointer-events: none;
  }

  /* Time ribbon badge */
  .ev-ribbon {
    position: absolute;
    top: 12px; right: 12px;
    padding: 4px 10px;
    border-radius: 100px;
    font-size: 0.62rem; font-weight: 700;
    letter-spacing: 0.08em; text-transform: uppercase;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    z-index: 3;
  }

  /* Date badge — overlaps image/content boundary */
  .ev-date-badge {
    position: absolute;
    /* sits at the bottom of the image */
    left: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 50px; height: 52px;
    border-radius: 13px;
    background: rgba(200,145,74,0.14);
    border: 1px solid rgba(200,145,74,0.35);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    z-index: 4;
    box-shadow: 0 4px 16px rgba(0,0,0,0.35);
  }

  /* RSVP pill row */
  .rsvp-row {
    display: flex;
    gap: 6px;
  }
  .rsvp-pill {
    flex: 1;
    padding: 7px 6px;
    border-radius: 100px;
    border: 1px solid rgba(200,145,74,0.15);
    background: rgba(255,255,255,0.03);
    color: rgba(245,240,232,0.45);
    font-family: 'DM Sans', sans-serif;
    font-size: 0.72rem; font-weight: 600;
    cursor: pointer;
    text-align: center;
    transition: background 0.2s, border-color 0.2s, color 0.2s, transform 0.15s;
  }
  .rsvp-pill:hover {
    border-color: rgba(200,145,74,0.3);
    color: rgba(245,240,232,0.75);
    transform: translateY(-1px);
  }
  .rsvp-pill.active {
    background: linear-gradient(135deg, #c8914a, #e8c47a);
    border-color: transparent;
    color: #0a0907;
    box-shadow: 0 3px 12px rgba(200,145,74,0.35);
  }
  .rsvp-pill.active:hover { transform: translateY(-1px); }

  /* Form fields */
  .ev-input {
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
  .ev-input::placeholder { color: rgba(245,240,232,0.25); }
  .ev-input:focus {
    border-color: #c8914a;
    box-shadow: 0 0 0 3px rgba(200,145,74,0.12);
  }
  input[type="datetime-local"].ev-input::-webkit-calendar-picker-indicator {
    filter: invert(0.6) sepia(1) saturate(2) hue-rotate(5deg);
    cursor: pointer;
    opacity: 0.6;
  }

  /* Gold button */
  .ev-btn-gold {
    display: inline-flex; align-items: center; gap: 7px;
    background: linear-gradient(135deg, #c8914a, #e8c47a);
    color: #0a0907;
    border: none; border-radius: 11px;
    padding: 11px 20px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.88rem; font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 18px rgba(200,145,74,0.3);
    transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
  }
  .ev-btn-gold:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 7px 24px rgba(200,145,74,0.45);
  }
  .ev-btn-gold:disabled { opacity: 0.55; cursor: not-allowed; }

  .ev-btn-ghost {
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
  .ev-btn-ghost:hover:not(:disabled) {
    border-color: rgba(200,145,74,0.35);
    color: #c8914a;
    background: rgba(200,145,74,0.06);
  }
  .ev-btn-ghost:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Stagger entrance */
  @keyframes evFadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .ev-enter {
    opacity: 0;
    animation: evFadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }

  /* Skeleton */
  @keyframes skShimmer {
    0%   { background-position:  200% center; }
    100% { background-position: -200% center; }
  }
  .ev-sk {
    background: linear-gradient(90deg,
      rgba(255,255,255,0.04) 25%,
      rgba(255,255,255,0.07) 50%,
      rgba(255,255,255,0.04) 75%);
    background-size: 200% 100%;
    animation: skShimmer 1.6s ease-in-out infinite;
    border-radius: 10px;
  }

  /* Section divider */
  .ev-section-label {
    font-size: 0.65rem; font-weight: 700;
    letter-spacing: 0.14em; text-transform: uppercase;
    color: rgba(245,240,232,0.28);
    display: flex; align-items: center; gap: 12px;
    margin-bottom: 16px;
  }
  .ev-section-label::after {
    content: '';
    flex: 1; height: 1px;
    background: rgba(200,145,74,0.1);
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  /* "Today" pulse */
  @keyframes todayPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(61,158,110,0.5); }
    50%       { box-shadow: 0 0 0 5px rgba(61,158,110,0); }
  }
`;

/* ─── Helpers ─────────────────────────────────────────────────── */
function fmtTime(d) {
  if (!d) return "";
  return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}
function fmtDay(d)   { return new Date(d).toLocaleDateString("en-IN", { day: "numeric" }); }
function fmtMonth(d) { return new Date(d).toLocaleDateString("en-IN", { month: "short" }); }
function fmtFull(d) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long" });
}

function timeUntil(d) {
  const ms = new Date(d) - Date.now();
  if (ms <= 0) return null;
  const hrs  = Math.floor(ms / 3_600_000);
  const days = Math.floor(ms / 86_400_000);
  if (hrs < 3)  return "Starting soon";
  if (hrs < 24) return "Today";
  if (days === 1) return "Tomorrow";
  if (days < 7)   return `In ${days} days`;
  return `In ${Math.ceil(days / 7)}w`;
}

function ribbonColor(label) {
  if (!label) return null;
  if (label === "Starting soon" || label === "Today")
    return { bg: "rgba(61,158,110,0.85)", text: "#fff" };
  if (label === "Tomorrow")
    return { bg: "rgba(200,145,74,0.85)", text: "#0a0907" };
  return { bg: "rgba(245,240,232,0.12)", text: "rgba(245,240,232,0.7)" };
}

/* ─── Skeleton card ───────────────────────────────────────────── */
function SkCard() {
  return (
    <div style={{
      borderRadius: 18, border: "1px solid rgba(200,145,74,0.08)",
      background: "#111008", overflow: "hidden",
    }}>
      <div className="ev-sk" style={{ width: "100%", aspectRatio: "16/9" }} />
      <div style={{ padding: "48px 18px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
        <div className="ev-sk" style={{ height: 20, width: "70%" }} />
        <div className="ev-sk" style={{ height: 14, width: "45%" }} />
        <div className="ev-sk" style={{ height: 36, marginTop: 8 }} />
      </div>
    </div>
  );
}

/* ─── RSVP options ─────────────────────────────────────────────── */
const RSVP_OPTS = [
  { key: "going",     label: "✓ Going"    },
  { key: "maybe",     label: "~ Maybe"    },
  { key: "not_going", label: "✕ Can't go" },
];

/* ─── Event card ───────────────────────────────────────────────── */
function EventCard({ item, rsvp, onRsvp, delay }) {
  const isPast  = new Date(item.startAt) < new Date();
  const ribbon  = !isPast ? timeUntil(item.startAt) : null;
  const rc      = ribbonColor(ribbon);
  const cover   = item.coverImage || coverFor(item._id);

  /* image loaded state for graceful load */
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <article className={`ev-card ev-enter${isPast ? " past" : ""}`} style={{ animationDelay: delay }}>

      {/* ── Cover image container ── */}
      <div style={{ position: "relative", overflow: "hidden" }}>
        {/* Placeholder shimmer while image loads */}
        {!imgLoaded && (
          <div className="ev-sk" style={{ width: "100%", aspectRatio: "16/9" }} />
        )}
        <img
          src={cover}
          alt={item.title}
          className="ev-cover"
          style={{ display: imgLoaded ? "block" : "none" }}
          onLoad={() => setImgLoaded(true)}
        />

        {/* Gradient overlay fading into card */}
        <div className="ev-cover-overlay" />

        {/* Time ribbon */}
        {ribbon && rc && (
          <div
            className="ev-ribbon"
            style={{ background: rc.bg, color: rc.text,
              boxShadow: ribbon === "Today" || ribbon === "Starting soon"
                ? "0 0 0 0 rgba(61,158,110,0.5)"
                : "none",
              animation: ribbon === "Today" ? "todayPulse 2s infinite" : "none",
            }}
          >
            {ribbon}
          </div>
        )}

        {/* Past overlay text */}
        {isPast && (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 3,
          }}>
            <span style={{
              background: "rgba(10,9,7,0.6)",
              backdropFilter: "blur(4px)",
              color: T.textMuted,
              fontSize: "0.65rem", fontWeight: 700,
              letterSpacing: "0.12em", textTransform: "uppercase",
              padding: "5px 13px", borderRadius: "100px",
              border: "1px solid rgba(245,240,232,0.1)",
            }}>
              Past Event
            </span>
          </div>
        )}
      </div>

      {/* ── Content area ── */}
      <div style={{ padding: "14px 18px 18px", position: "relative" }}>

        {/* Floating date badge — anchored above content area */}
        <div
          className="ev-date-badge"
          style={{ top: -26 }} /* half its height above content edge */
        >
          <span
            className="ev-display"
            style={{
              fontSize: "1.25rem", lineHeight: 1, fontWeight: 700,
              color: isPast ? T.textMuted : T.gold,
            }}
          >
            {fmtDay(item.startAt)}
          </span>
          <span style={{
            fontSize: "0.55rem", fontWeight: 700,
            letterSpacing: "0.1em", textTransform: "uppercase",
            color: isPast ? T.textMuted : T.gold, opacity: 0.75,
          }}>
            {fmtMonth(item.startAt)}
          </span>
        </div>

        {/* Title — pushed right of date badge */}
        <div style={{ paddingLeft: "62px", marginBottom: 10, minHeight: 52 }}>
          <h3
            className="ev-display"
            style={{
              fontSize: "1.15rem", fontWeight: 600,
              color: T.textPrimary, margin: "0 0 4px",
              lineHeight: 1.25,
            }}
          >
            {item.title}
          </h3>
          <p style={{ fontSize: "0.75rem", color: T.textMuted, margin: 0 }}>
            {fmtFull(item.startAt)}
          </p>
        </div>

        {/* Description */}
        {item.description && (
          <p style={{
            fontSize: "0.83rem", color: T.textSecondary,
            lineHeight: 1.65, margin: "0 0 12px",
          }}>
            {item.description.length > 100
              ? item.description.slice(0, 100) + "…"
              : item.description}
          </p>
        )}

        {/* Meta pills row */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "4px 9px", borderRadius: "100px",
            background: "rgba(255,255,255,0.04)", border: `1px solid ${T.border}`,
            fontSize: "0.72rem", color: T.textMuted, fontWeight: 500,
          }}>
            <Clock size={11} style={{ color: T.gold, opacity: 0.7 }} />
            {fmtTime(item.startAt)}{item.endAt ? ` – ${fmtTime(item.endAt)}` : ""}
          </span>
          {item.location && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "4px 9px", borderRadius: "100px",
              background: "rgba(255,255,255,0.04)", border: `1px solid ${T.border}`,
              fontSize: "0.72rem", color: T.textMuted, fontWeight: 500,
            }}>
              <MapPin size={11} style={{ color: T.gold, opacity: 0.7 }} />
              {item.location}
            </span>
          )}
        </div>

        {/* RSVP pills — upcoming events only */}
        {!isPast && (
          <>
            <div style={{
              height: "1px",
              background: "rgba(200,145,74,0.08)",
              margin: "0 0 12px",
            }} />
            <div className="rsvp-row">
              {RSVP_OPTS.map(opt => (
                <button
                  key={opt.key}
                  className={`rsvp-pill${rsvp === opt.key ? " active" : ""}`}
                  onClick={() => onRsvp(item._id, opt.key)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {rsvp && (
              <p style={{
                fontSize: "0.68rem", color: T.gold,
                margin: "8px 0 0", textAlign: "center",
                fontWeight: 500, opacity: 0.8,
              }}>
                You responded: {RSVP_OPTS.find(o => o.key === rsvp)?.label}
              </p>
            )}
          </>
        )}
      </div>
    </article>
  );
}

/* ═══════════════════════════════════════════════════════════════
   EVENTS PAGE
═══════════════════════════════════════════════════════════════ */
export function EventsPage() {
  const { token, user } = useAuth();
  const [items, setItems]           = useState([]);
  const [title, setTitle]           = useState("");
  const [description, setDesc]      = useState("");
  const [location, setLocation]     = useState("Club House");
  const [startAt, setStartAt]       = useState("");
  const [endAt, setEndAt]           = useState("");
  const [error, setError]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [submitting, setSubmit]     = useState(false);
  const [showForm, setShowForm]     = useState(false);

  /* RSVP state: { [eventId]: "going" | "maybe" | "not_going" } */
  const [rsvpMap, setRsvpMap] = useState({});

  function handleRsvp(eventId, key) {
    setRsvpMap(prev => ({
      ...prev,
      [eventId]: prev[eventId] === key ? null : key,
    }));
  }

  const canCreate = useMemo(() =>
    ["committee", "super_admin"].includes(user?.role), [user?.role]);

  const upcoming = items
    .filter(e => new Date(e.startAt) >= new Date())
    .sort((a, b) => new Date(a.startAt) - new Date(b.startAt));

  const past = items
    .filter(e => new Date(e.startAt) < new Date())
    .sort((a, b) => new Date(b.startAt) - new Date(a.startAt));

  async function loadItems() {
    setLoading(true); setError("");
    try {
      const data = await apiRequest("/events", { token });
      setItems(data.items || []);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setSubmit(true); setError("");
    try {
      const data = await apiRequest("/events", {
        method: "POST", token,
        body: { title, description, location, startAt, endAt },
      });
      setItems(prev => [...prev, data.item]);
      setTitle(""); setDesc(""); setLocation("Club House"); setStartAt(""); setEndAt("");
      setShowForm(false);
    } catch (err) { setError(err.message); }
    finally { setSubmit(false); }
  }

  useEffect(() => { loadItems(); }, []);

  const inputLabel = (text) => (
    <label style={{
      display: "block", fontSize: "0.72rem", fontWeight: 500,
      color: T.textMuted, letterSpacing: "0.04em", marginBottom: 6,
    }}>
      {text}
    </label>
  );

  return (
    <>
      <style>{CSS}</style>
      <div className="ev-root" style={{ maxWidth: 860, margin: "0 auto", paddingBottom: 64 }}>

        {/* ── Header ── */}
        <div className="ev-enter" style={{ marginBottom: 28, animationDelay: "0ms" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <p style={{
                fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.14em",
                textTransform: "uppercase", color: T.gold, marginBottom: 6, opacity: 0.75,
              }}>
                Community
              </p>
              <h1
                className="ev-display"
                style={{ fontSize: "clamp(2rem, 4vw, 2.8rem)", fontWeight: 600, color: T.textPrimary, margin: 0, lineHeight: 1.1 }}
              >
                Events
              </h1>
              <p style={{ fontSize: "0.85rem", color: T.textMuted, marginTop: 6, fontWeight: 300 }}>
                Upcoming and past community gatherings
              </p>
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {canCreate && (
                <button className="ev-btn-gold" onClick={() => setShowForm(v => !v)}>
                  <Plus size={14} />
                  {showForm ? "Cancel" : "Create Event"}
                </button>
              )}
              <button className="ev-btn-ghost" onClick={loadItems} disabled={loading}>
                <RefreshCw size={12} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
                Refresh
              </button>
            </div>
          </div>

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

        {/* ── Create form (admin, collapsible) ── */}
        {canCreate && showForm && (
          <div
            className="ev-enter"
            style={{
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: 18, padding: "24px",
              marginBottom: 28, animationDelay: "0ms",
              position: "relative", overflow: "hidden",
            }}
          >
            {/* Gold strip */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 2,
              background: "linear-gradient(90deg,#c8914a,#e8c47a44)",
              borderRadius: "18px 18px 0 0",
            }} />

            <p style={{ fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: T.gold, marginBottom: 6, opacity: 0.75 }}>
              New Event
            </p>
            <h2 className="ev-display" style={{ fontSize: "1.4rem", fontWeight: 600, color: T.textPrimary, margin: "0 0 20px" }}>
              Create Event
            </h2>

            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                {inputLabel("Event Title")}
                <input className="ev-input" placeholder="e.g. Rooftop Diwali Celebration" value={title} onChange={e => setTitle(e.target.value)} required />
              </div>

              <div>
                {inputLabel("Description")}
                <textarea className="ev-input" style={{ minHeight: 80 }} placeholder="Tell residents what to expect…" value={description} onChange={e => setDesc(e.target.value)} />
              </div>

              <div>
                {inputLabel("Location")}
                <input className="ev-input" placeholder="Club House" value={location} onChange={e => setLocation(e.target.value)} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  {inputLabel("Starts")}
                  <input className="ev-input" type="datetime-local" value={startAt} onChange={e => setStartAt(e.target.value)} required />
                </div>
                <div>
                  {inputLabel("Ends")}
                  <input className="ev-input" type="datetime-local" value={endAt} onChange={e => setEndAt(e.target.value)} required />
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button className="ev-btn-gold" type="submit" disabled={submitting}>
                  {submitting ? "Creating…" : <><CalendarDays size={14} /> Create Event</>}
                </button>
                <button type="button" className="ev-btn-ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Upcoming section ── */}
        <div className="ev-enter" style={{ marginBottom: 36, animationDelay: "80ms" }}>
          <div className="ev-section-label">Upcoming Events</div>

          {loading ? (
            <div className="ev-grid">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="ev-enter" style={{ animationDelay: `${80 + i * 60}ms` }}>
                  <SkCard />
                </div>
              ))}
            </div>
          ) : upcoming.length === 0 ? (
            /* Empty state */
            <div style={{ textAlign: "center", padding: "56px 32px" }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: "rgba(200,145,74,0.07)",
                border: "1px solid rgba(200,145,74,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 24, margin: "0 auto 14px",
              }}>
                📅
              </div>
              <p className="ev-display" style={{ fontSize: "1.35rem", fontWeight: 600, color: T.textSecondary, margin: "0 0 6px", fontStyle: "italic" }}>
                Nothing on the calendar yet.
              </p>
              <p style={{ fontSize: "0.84rem", color: T.textMuted, margin: 0, fontWeight: 300 }}>
                {canCreate ? "Create your first community event above." : "Check back soon for upcoming events."}
              </p>
            </div>
          ) : (
            <div className="ev-grid">
              {upcoming.map((item, i) => (
                <EventCard
                  key={item._id}
                  item={item}
                  rsvp={rsvpMap[item._id] || null}
                  onRsvp={handleRsvp}
                  delay={`${100 + i * 55}ms`}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Past section ── */}
        {!loading && past.length > 0 && (
          <div className="ev-enter" style={{ animationDelay: "200ms" }}>
            <div className="ev-section-label">Past Events</div>
            <div className="ev-grid">
              {past.map((item, i) => (
                <EventCard
                  key={item._id}
                  item={item}
                  rsvp={null}
                  onRsvp={() => {}}
                  delay={`${220 + i * 55}ms`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
