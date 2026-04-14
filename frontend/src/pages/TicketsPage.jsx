import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../components/api";
import { useAuth } from "../components/AuthContext";

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

  .tp-card {
    background: ${T.surface};
    border: 1px solid ${T.border};
    border-radius: 14px;
    overflow: hidden;
    transition: border-color 0.25s, box-shadow 0.25s;
    font-family: 'DM Sans', sans-serif;
  }
  .tp-input {
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
    resize: vertical;
  }
  .tp-input::placeholder { color: ${T.textMuted}; }
  .tp-input:focus {
    border-color: ${T.gold};
    box-shadow: 0 0 0 3px rgba(200,145,74,0.15);
  }
  .tp-btn-gold {
    display: inline-flex; align-items: center; gap: 7px;
    background: linear-gradient(135deg, ${T.gold}, ${T.goldLight});
    color: #0a0907;
    border: none;
    border-radius: 10px;
    padding: 10px 20px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.84rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .tp-btn-gold:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(200,145,74,0.35); }
  .tp-btn-gold:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }
  .tp-btn-ghost {
    display: inline-flex; align-items: center; gap: 6px;
    background: none;
    border: 1px solid ${T.border};
    border-radius: 8px;
    padding: 7px 12px;
    color: ${T.textSecondary};
    font-family: 'DM Sans', sans-serif;
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .tp-btn-ghost:hover { border-color: ${T.borderHover}; color: ${T.textPrimary}; transform: translateY(-1px); }

  /* Status pill buttons */
  .tp-status-pill {
    padding: 4px 12px;
    border-radius: 100px;
    font-size: 0.72rem;
    font-weight: 700;
    cursor: pointer;
    border: 1px solid transparent;
    font-family: 'DM Sans', sans-serif;
    text-transform: capitalize;
    transition: all 0.15s ease;
    letter-spacing: 0.03em;
  }
  .tp-status-pill:hover { transform: translateY(-1px); }

  /* File input */
  input[type="file"].tp-input { cursor: pointer; }
  input[type="file"].tp-input::-webkit-file-upload-button {
    background: rgba(200,145,74,0.1);
    border: 1px solid rgba(200,145,74,0.2);
    border-radius: 6px;
    color: ${T.gold};
    padding: 4px 10px;
    font-size: 0.78rem;
    font-family: 'DM Sans', sans-serif;
    font-weight: 600;
    cursor: pointer;
    margin-right: 10px;
  }

  /* Skeleton */
  @keyframes tpSkel {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  .tp-skel {
    border-radius: 12px;
    background: linear-gradient(90deg, #181510 25%, #201c14 50%, #181510 75%);
    background-size: 200% 100%;
    animation: tpSkel 1.4s ease infinite;
  }
`;

/* ─── Status config ──────────────────────────────────────────── */
const STATUS_CFG = {
  open:        { color: T.blue,  bg: "rgba(77,141,212,0.1)",   border: "rgba(77,141,212,0.25)",  leftBorder: T.blue,  emoji: "🔵" },
  in_progress: { color: T.amber, bg: "rgba(212,168,67,0.1)",   border: "rgba(212,168,67,0.25)",  leftBorder: T.amber, emoji: "🟡" },
  resolved:    { color: T.green, bg: "rgba(61,158,110,0.1)",   border: "rgba(61,158,110,0.25)",  leftBorder: T.green, emoji: "🟢" },
  closed:      { color: T.textMuted, bg: "rgba(245,240,232,0.04)", border: T.border, leftBorder: "rgba(245,240,232,0.2)", emoji: "⚫" },
};

const STATUS_OPTIONS = ["open", "in_progress", "resolved", "closed"];

/* ─── Helpers ────────────────────────────────────────────────── */
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

/* ─── Ticket Photos with lightbox ────────────────────────────── */
function TicketPhotos({ photos }) {
  const [lightbox, setLightbox] = useState(null);
  if (!photos || photos.length === 0) return null;
  return (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
        {photos.map((url, i) => (
          <button
            key={i}
            onClick={() => setLightbox(url)}
            style={{
              border: `1px solid ${T.border}`,
              borderRadius: 8, overflow: "hidden",
              cursor: "pointer", background: "none", padding: 0,
              transition: "border-color 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = T.borderHover}
            onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
          >
            <img src={url} alt={`attachment ${i + 1}`} style={{ width: 72, height: 72, objectFit: "cover", display: "block" }} />
          </button>
        ))}
      </div>
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 999,
            background: "rgba(0,0,0,0.85)",
            display: "flex", alignItems: "center", justifyContent: "center",
            backdropFilter: "blur(8px)",
          }}
        >
          <img src={lightbox} alt="attachment" style={{ maxHeight: "85vh", maxWidth: "90vw", borderRadius: 16, boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }} />
        </div>
      )}
    </>
  );
}

/* ─── Main Page ──────────────────────────────────────────────── */
export function TicketsPage() {
  const { token, user } = useAuth();
  const [items, setItems]           = useState([]);
  const [title, setTitle]           = useState("");
  const [description, setDesc]      = useState("");
  const [category, setCategory]     = useState("general");
  const [photoFiles, setPhotoFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError]           = useState("");
  const [loading, setLoading]       = useState(false);

  const canUpdateStatus = useMemo(
    () => ["committee", "staff", "super_admin"].includes(user?.role),
    [user?.role]
  );

  async function loadItems() {
    setLoading(true); setError("");
    try {
      const data = await apiRequest("/tickets", { token });
      setItems(data.items || []);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function handleCreate(e) {
    e.preventDefault(); setError("");
    try {
      let photos = [];
      if (photoFiles.length > 0) {
        setIsUploading(true);
        const fd = new FormData();
        photoFiles.forEach(f => fd.append("photos", f));
        const up = await apiRequest("/tickets/upload-photos", { method: "POST", token, formData: fd });
        photos = up.urls || [];
        setIsUploading(false);
      }
      const data = await apiRequest("/tickets", { method: "POST", token, body: { title, description, category, photos } });
      setItems(prev => [data.item, ...prev]);
      setTitle(""); setDesc(""); setCategory("general"); setPhotoFiles([]);
    } catch (err) { setIsUploading(false); setError(err.message); }
  }

  async function handleStatusUpdate(ticketId, status) {
    setError("");
    try {
      const data = await apiRequest(`/tickets/${ticketId}/status`, { method: "PATCH", token, body: { status } });
      setItems(prev => prev.map(i => i._id === ticketId ? { ...i, ...data.item } : i));
    } catch (err) { setError(err.message); }
  }

  useEffect(() => { loadItems(); }, []);

  const open   = items.filter(t => !["resolved", "closed"].includes(t.status));
  const closed = items.filter(t =>  ["resolved", "closed"].includes(t.status));

  /* ── Ticket Card ── */
  function TicketCard({ item }) {
    const cfg = STATUS_CFG[item.status] || STATUS_CFG.open;
    return (
      <article
        className="tp-card"
        style={{ borderLeft: `3px solid ${cfg.leftBorder}` }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = cfg.leftBorder;
          e.currentTarget.style.borderLeftColor = cfg.leftBorder;
          e.currentTarget.style.boxShadow = `0 4px 24px rgba(200,145,74,0.09)`;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = T.border;
          e.currentTarget.style.borderLeftColor = cfg.leftBorder;
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <div style={{ padding: "18px 20px" }}>
          {/* Title + Status */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
            <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, color: T.textPrimary, margin: 0, lineHeight: 1.35 }}>
              {item.title}
            </h3>
            <span style={{
              flexShrink: 0,
              padding: "3px 10px", borderRadius: 100,
              fontSize: "0.72rem", fontWeight: 700,
              background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
              textTransform: "capitalize", whiteSpace: "nowrap",
              letterSpacing: "0.04em",
            }}>
              {cfg.emoji} {item.status?.replace("_", " ")}
            </span>
          </div>

          {/* Description */}
          <p style={{ fontSize: "0.875rem", color: T.textSecondary, lineHeight: 1.55, margin: 0 }}>
            {item.description}
          </p>

          {/* Meta */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 10 }}>
            <span style={{ fontSize: "0.78rem", color: T.textMuted }}>🗂 {item.category}</span>
            <span style={{ fontSize: "0.78rem", color: T.textMuted }}>🕐 {timeAgo(item.createdAt)}</span>
            <span style={{ fontSize: "0.78rem", color: T.textMuted }}>👤 {item.createdBy?.fullName || "Resident"}</span>
          </div>

          <TicketPhotos photos={item.photos} />

          {/* Status update buttons (staff/admin) */}
          {canUpdateStatus && (
            <div style={{
              display: "flex", flexWrap: "wrap", gap: 6,
              marginTop: 14, paddingTop: 14,
              borderTop: `1px solid ${T.border}`,
            }}>
              {STATUS_OPTIONS.map(s => {
                const sc = STATUS_CFG[s];
                const isActive = item.status === s;
                return (
                  <button
                    key={s}
                    className="tp-status-pill"
                    onClick={() => handleStatusUpdate(item._id, s)}
                    style={{
                      background: isActive ? sc.bg : "rgba(255,255,255,0.03)",
                      color: isActive ? sc.color : T.textMuted,
                      borderColor: isActive ? sc.border : T.border,
                    }}
                  >
                    {s.replace("_", " ")}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </article>
    );
  }

  return (
    <>
      <style>{CSS}</style>
      <div style={{
        fontFamily: "'DM Sans', sans-serif",
        maxWidth: 760,
        margin: "0 auto",
        paddingBottom: 64,
      }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div>
              <h1 style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "2rem", fontWeight: 600,
                color: T.textPrimary, margin: 0,
              }}>
                Tickets
              </h1>
              <p style={{ fontSize: "0.875rem", color: T.textMuted, marginTop: 4 }}>
                {open.length} open · {closed.length} resolved
              </p>
            </div>
            <button className="tp-btn-ghost" onClick={loadItems}>↻ Refresh</button>
          </div>
          {error && (
            <div style={{
              marginTop: 14,
              background: "rgba(232,93,93,0.08)",
              border: "1px solid rgba(232,93,93,0.2)",
              borderRadius: 10, padding: "12px 16px",
              fontSize: "0.875rem", color: T.red,
            }}>
              {error}
            </div>
          )}
        </div>

        {/* Create form */}
        <div style={{
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 16,
          padding: "22px 24px",
          marginBottom: 28,
        }}>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "1.2rem", fontWeight: 600,
            color: T.textPrimary,
            margin: "0 0 18px",
          }}>
            Raise a Complaint
          </h2>
          <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              className="tp-input"
              placeholder="Title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
            <textarea
              className="tp-input"
              style={{ minHeight: 88 }}
              placeholder="Describe the issue in detail…"
              value={description}
              onChange={e => setDesc(e.target.value)}
              required
            />
            <input
              className="tp-input"
              placeholder="Category (e.g. plumbing, electrical)"
              value={category}
              onChange={e => setCategory(e.target.value)}
            />
            <div>
              <label style={{
                display: "block",
                fontSize: "0.72rem", fontWeight: 700,
                color: T.textMuted, letterSpacing: "0.07em",
                textTransform: "uppercase", marginBottom: 7,
              }}>
                Attach Photos (up to 3, max 5 MB each)
              </label>
              <input
                className="tp-input"
                type="file" accept="image/*" multiple
                onChange={e => setPhotoFiles(Array.from(e.target.files).slice(0, 3))}
              />
              {photoFiles.length > 0 && (
                <p style={{ fontSize: "0.78rem", color: T.textMuted, marginTop: 6 }}>
                  {photoFiles.length} file{photoFiles.length > 1 ? "s" : ""} selected
                </p>
              )}
            </div>
            <div>
              <button className="tp-btn-gold" type="submit" disabled={isUploading}>
                {isUploading ? "Uploading photos…" : "🎫 Submit Ticket"}
              </button>
            </div>
          </form>
        </div>

        {/* Open tickets */}
        <div style={{ marginBottom: 28 }}>
          <p style={{
            fontSize: "0.72rem", fontWeight: 700,
            color: T.textMuted, letterSpacing: "0.09em",
            textTransform: "uppercase", marginBottom: 12,
          }}>
            Open
          </p>
          {loading && [1, 2].map(i => <div key={i} className="tp-skel" style={{ height: 120, marginBottom: 10 }} />)}
          {!loading && open.length === 0 && (
            <div style={{
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: 14, padding: 32,
              textAlign: "center",
            }}>
              <p style={{ fontSize: "0.875rem", color: T.textMuted }}>No open tickets. All good! 🎉</p>
            </div>
          )}
          {!loading && open.map(item => (
            <div key={item._id} style={{ marginBottom: 10 }}>
              <TicketCard item={item} />
            </div>
          ))}
        </div>

        {/* Resolved & Closed */}
        {closed.length > 0 && (
          <div>
            <p style={{
              fontSize: "0.72rem", fontWeight: 700,
              color: T.textMuted, letterSpacing: "0.09em",
              textTransform: "uppercase", marginBottom: 12,
            }}>
              Resolved & Closed
            </p>
            {closed.map(item => (
              <div key={item._id} style={{ marginBottom: 10, opacity: 0.6 }}>
                <TicketCard item={item} />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
