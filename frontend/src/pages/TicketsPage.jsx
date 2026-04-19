import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../components/api";
import { useAuth } from "../components/AuthContext";
import { RefreshCw, Ticket, ChevronRight } from "lucide-react";

const T = {
  bg: "#F7F9FF",
  surface: "#FFFFFF",
  border: "#DCE5F3",
  border2: "#E5E7EB",
  ink: "#111827",
  text2: "#6B7280",
  text3: "#9CA3AF",
  amber: "#E8890C",
  amberH: "#C97508",
  amberL: "#FFF8F0",
  amberM: "#FDECC8",
  green: "#16A34A",
  red: "#DC2626",
  redL: "#FEE2E2",
  blue: "#2563EB",
  sh: "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)",
};

const STATUS_CFG = {
  open: { label: "Open", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", accent: "#2563EB" },
  in_progress: { label: "In Progress", color: "#B45309", bg: "#FFFBEB", border: "#FDE68A", accent: "#D97706" },
  resolved: { label: "Resolved", color: "#16A34A", bg: "#DCFCE7", border: "#BBF7D0", accent: "#16A34A" },
  closed: { label: "Closed", color: "#9CA3AF", bg: "#F9FAFB", border: "#E5E7EB", accent: "#D1D5DB" },
};

const STATUS_OPTIONS = ["open", "in_progress", "resolved", "closed"];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap');

  .tp-root * { box-sizing: border-box; }
  .tp-root {
    font-family: 'Manrope', sans-serif;
    color: ${T.ink};
    background:
      radial-gradient(900px 380px at 85% -12%, rgba(37,99,235,0.13), transparent 64%),
      radial-gradient(760px 340px at -10% 0%, rgba(232,137,12,0.12), transparent 68%),
      ${T.bg};
    min-height: calc(100vh - 64px);
    padding: 22px 20px 78px;
    position: relative;
  }

  .tp-root::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image:
      linear-gradient(to right, rgba(148,163,184,0.11) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(148,163,184,0.11) 1px, transparent 1px);
    background-size: 38px 38px;
    mask-image: radial-gradient(circle at 15% 10%, rgba(0,0,0,.9), transparent 70%);
  }

  .tp-content { position: relative; z-index: 1; }
  .tp-display { font-family: 'Cormorant Garamond', serif; }

  .tp-hero {
    border-radius: 24px;
    border: 1px solid #D8E3F5;
    background: linear-gradient(140deg, rgba(255,255,255,0.96), rgba(243,247,255,0.95));
    box-shadow: 0 22px 46px rgba(17,24,39,0.09);
    padding: 18px;
    display: grid;
    grid-template-columns: 1.05fr 0.95fr;
    gap: 16px;
    margin-bottom: 18px;
  }

  .tp-sub {
    margin-top: 10px;
    color: #61708D;
    font-size: 0.9rem;
    line-height: 1.65;
    max-width: 58ch;
  }

  .tp-hero-actions {
    margin-top: 14px;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .tp-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    align-content: start;
  }

  .tp-stat {
    border: 1px solid #D8E3F5;
    border-radius: 14px;
    background: #FFFFFF;
    padding: 10px;
  }

  .tp-stat-num {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.5rem;
    line-height: 1;
    font-weight: 700;
  }

  .tp-stat-lbl {
    margin-top: 4px;
    font-size: 0.64rem;
    text-transform: uppercase;
    letter-spacing: 0.13em;
    color: #8B95A8;
    font-weight: 700;
  }

  .tp-block {
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 18px;
    padding: 16px;
    box-shadow: 0 10px 26px rgba(17,24,39,0.06);
    margin-bottom: 18px;
  }

  @media (max-width: 960px) {
    .tp-hero { grid-template-columns: 1fr; }
  }

  .tp-card {
    background: ${T.surface};
    border: 1px solid #E2E8F0;
    border-radius: 16px;
    overflow: hidden;
    transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
    box-shadow: ${T.sh};
  }

  .tp-card:hover {
    box-shadow: 0 18px 38px rgba(17,24,39,0.12);
    transform: translateY(-3px);
  }

  .tp-input {
    width: 100%;
    background: ${T.surface};
    border: 1px solid ${T.border2};
    border-radius: 10px;
    padding: 10px 14px;
    color: ${T.ink};
    font-family: 'Manrope', sans-serif;
    font-size: 0.875rem;
    outline: none;
    transition: border-color 0.18s, box-shadow 0.18s;
    box-sizing: border-box;
    resize: vertical;
  }

  .tp-input::placeholder { color: ${T.text3}; }

  .tp-input:focus {
    border-color: #D1D5DB;
    box-shadow: 0 0 0 3px rgba(232,137,12,.1);
  }

  .tp-btn-primary {
    position: relative;
    overflow: hidden;
    isolation: isolate;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    background: linear-gradient(135deg, ${T.amber}, ${T.amberH});
    color: #fff;
    border: none;
    border-radius: 10px;
    padding: 10px 20px;
    font-family: 'Manrope', sans-serif;
    font-size: 0.84rem;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(232,137,12,.25);
    transition: all 0.18s;
  }

  .tp-btn-primary::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(120deg, rgba(255,255,255,0) 36%, rgba(255,255,255,0.35) 52%, rgba(255,255,255,0) 68%);
    transform: translateX(-130%);
    transition: transform 0.5s ease;
    z-index: 0;
  }

  .tp-btn-primary > * {
    position: relative;
    z-index: 1;
    transition: transform 0.2s ease;
  }

  .tp-btn-primary:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(232,137,12,.32);
  }

  .tp-btn-primary:hover:not(:disabled)::before { transform: translateX(130%); }
  .tp-btn-primary:hover:not(:disabled) svg { transform: translateX(1px); }
  .tp-btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }

  .tp-btn-ghost {
    position: relative;
    overflow: hidden;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: ${T.surface};
    border: 1px solid ${T.border2};
    border-radius: 8px;
    padding: 7px 12px;
    color: ${T.text2};
    font-family: 'Manrope', sans-serif;
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.18s;
  }

  .tp-btn-ghost::after {
    content: '';
    position: absolute;
    left: 8px;
    right: 8px;
    bottom: 0;
    height: 2px;
    border-radius: 999px;
    background: linear-gradient(90deg, ${T.blue}, ${T.amber});
    transform: scaleX(0.2);
    opacity: 0;
    transition: transform 0.2s ease, opacity 0.2s ease;
  }

  .tp-btn-ghost:hover {
    border-color: #D1D5DB;
    color: ${T.ink};
    transform: translateY(-1px);
    box-shadow: 0 8px 18px rgba(17,24,39,0.07);
  }

  .tp-btn-ghost:hover::after {
    transform: scaleX(1);
    opacity: 1;
  }

  .tp-status-btn {
    padding: 4px 10px;
    border-radius: 100px;
    font-size: 0.68rem;
    font-weight: 700;
    cursor: pointer;
    font-family: 'Manrope', sans-serif;
    text-transform: capitalize;
    letter-spacing: 0.03em;
    transition: opacity 0.15s, transform 0.12s, box-shadow 0.18s;
  }

  .tp-status-btn:hover {
    opacity: 0.9;
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(17,24,39,0.10);
  }

  @keyframes tpSkel {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }

  .tp-skel {
    border-radius: 12px;
    background: linear-gradient(90deg, #F3F4F6 25%, #E5E7EB 50%, #F3F4F6 75%);
    background-size: 200% 100%;
    animation: tpSkel 1.4s ease infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  input[type="file"].tp-input { cursor: pointer; }

  input[type="file"].tp-input::-webkit-file-upload-button {
    background: ${T.amberL};
    border: 1px solid ${T.amberM};
    border-radius: 6px;
    color: ${T.amber};
    padding: 4px 10px;
    font-size: 0.78rem;
    font-family: 'Manrope', sans-serif;
    font-weight: 600;
    cursor: pointer;
    margin-right: 10px;
  }
`;

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
              border: `1px solid ${T.border2}`,
              borderRadius: 8,
              overflow: "hidden",
              cursor: "pointer",
              background: "none",
              padding: 0,
              transition: "border-color 0.2s",
            }}
          >
            <img src={url} alt={`attachment ${i + 1}`} style={{ width: 72, height: 72, objectFit: "cover", display: "block" }} />
          </button>
        ))}
      </div>

      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999,
            background: "rgba(0,0,0,0.82)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(8px)",
          }}
        >
          <img src={lightbox} alt="attachment" style={{ maxHeight: "85vh", maxWidth: "90vw", borderRadius: 16, boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }} />
        </div>
      )}
    </>
  );
}

export function TicketsPage() {
  const { token, user } = useAuth();
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDesc] = useState("");
  const [category, setCategory] = useState("General");
  const [photoFiles, setPhotoFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const canUpdateStatus = useMemo(
    () => ["committee", "staff", "super_admin"].includes(user?.role),
    [user?.role],
  );

  async function loadItems() {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("/tickets", { token });
      setItems(data.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      let photos = [];
      if (photoFiles.length > 0) {
        setIsUploading(true);
        const fd = new FormData();
        photoFiles.forEach((f) => fd.append("photos", f));
        const up = await apiRequest("/tickets/upload-photos", { method: "POST", token, formData: fd });
        photos = up.urls || [];
        setIsUploading(false);
      }

      const data = await apiRequest("/tickets", {
        method: "POST",
        token,
        body: { title, description, category, photos },
      });

      setItems((prev) => [data.item, ...prev]);
      setTitle("");
      setDesc("");
      setCategory("General");
      setPhotoFiles([]);
      setShowForm(false);
    } catch (err) {
      setIsUploading(false);
      setError(err.message);
    }
  }

  async function handleStatusUpdate(ticketId, status) {
    setError("");
    try {
      const data = await apiRequest(`/tickets/${ticketId}/status`, {
        method: "PATCH",
        token,
        body: { status },
      });
      setItems((prev) => prev.map((i) => (i._id === ticketId ? { ...i, ...data.item } : i)));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  const openItems = items.filter((t) => t.status === "open");
  const inProgItems = items.filter((t) => t.status === "in_progress");
  const resolvedItems = items.filter((t) => ["resolved", "closed"].includes(t.status));

  function TicketCard({ item }) {
    const cfg = STATUS_CFG[item.status] || STATUS_CFG.open;
    return (
      <article className="tp-card" style={{ borderLeft: `3px solid ${cfg.accent}` }}>
        <div style={{ padding: "16px 18px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
            <h3 style={{ fontSize: "0.92rem", fontWeight: 700, color: T.ink, margin: 0, lineHeight: 1.35 }}>
              {item.title}
            </h3>
            <span
              style={{
                flexShrink: 0,
                padding: "3px 10px",
                borderRadius: 100,
                fontSize: "0.68rem",
                fontWeight: 700,
                background: cfg.bg,
                color: cfg.color,
                border: `1px solid ${cfg.border}`,
                textTransform: "capitalize",
                whiteSpace: "nowrap",
                letterSpacing: "0.03em",
              }}
            >
              {item.status?.replace("_", " ")}
            </span>
          </div>

          <p style={{ fontSize: "0.84rem", color: T.text2, lineHeight: 1.6, margin: 0, textWrap: "pretty" }}>
            {item.description}
          </p>

          <div style={{ display: "flex", alignItems: "center", fontSize: "0.7rem", color: T.text3, marginTop: 8 }}>
            <span>{item.category}</span>
            <span style={{ margin: "0 7px", color: T.border2 }}>.</span>
            <span>{timeAgo(item.createdAt)}</span>
            <span style={{ margin: "0 7px", color: T.border2 }}>.</span>
            <span>{item.createdBy?.fullName || "Resident"}</span>
          </div>

          <TicketPhotos photos={item.photos} />

          {canUpdateStatus && (
            <div
              style={{
                marginTop: 12,
                paddingTop: 12,
                borderTop: `1px solid ${T.border}`,
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span style={{ fontSize: "0.65rem", color: T.text3, marginRight: 2 }}>Move to</span>
              {STATUS_OPTIONS.filter((s) => s !== item.status).map((s) => {
                const sc = STATUS_CFG[s];
                return (
                  <button
                    key={s}
                    onClick={() => handleStatusUpdate(item._id, s)}
                    className="tp-status-btn"
                    style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}
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
      <div className="tp-root" style={{ maxWidth: 1040, margin: "0 auto" }}>
        <div className="tp-content">
          <section className="tp-hero">
            <div>
              <h1 className="tp-display" style={{ fontSize: "clamp(2rem, 4.4vw, 3.2rem)", margin: 0, lineHeight: 0.95, color: T.ink }}>
                My Tickets
              </h1>
              <p className="tp-sub">
                Track ongoing complaints, see status updates, and raise new issues with photo evidence in one streamlined flow.
              </p>
              <div className="tp-hero-actions">
                <button className="tp-btn-primary" onClick={() => setShowForm((v) => !v)}>
                  <Ticket size={13} />
                  {showForm ? "Cancel" : "Raise Ticket"}
                </button>
                <button className="tp-btn-ghost" onClick={loadItems} disabled={loading}>
                  <RefreshCw size={12} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
                  Refresh Feed
                </button>
              </div>
            </div>

            <div className="tp-stats">
              {[
                { label: "Open", count: openItems.length, color: T.blue },
                { label: "In Progress", count: inProgItems.length, color: "#B45309" },
                { label: "Resolved", count: resolvedItems.length, color: T.green },
              ].map((s) => (
                <div className="tp-stat" key={s.label}>
                  <div className="tp-stat-num" style={{ color: s.color }}>{s.count}</div>
                  <div className="tp-stat-lbl">{s.label}</div>
                </div>
              ))}
            </div>
          </section>

          {error && (
            <div
              style={{
                marginBottom: 14,
                padding: "11px 16px",
                background: T.redL,
                border: "1px solid #FECACA",
                borderRadius: 10,
                fontSize: "0.84rem",
                color: T.red,
              }}
            >
              {error}
            </div>
          )}

          {showForm && (
            <div className="tp-block" style={{ position: "relative", overflow: "hidden" }}>
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: `linear-gradient(90deg, ${T.amber}, ${T.amberH})`,
                }}
              />
              <h2 className="tp-display" style={{ fontSize: "1.45rem", fontWeight: 700, color: T.ink, margin: "0 0 14px" }}>
                Raise a Complaint
              </h2>

              <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <input
                  className="tp-input"
                  placeholder="Brief title - e.g. Leaking pipe under kitchen sink"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
                <textarea
                  className="tp-input"
                  style={{ minHeight: 88 }}
                  placeholder="Describe the issue in detail..."
                  value={description}
                  onChange={(e) => setDesc(e.target.value)}
                  required
                />
                <input
                  className="tp-input"
                  placeholder="Category - e.g. Plumbing, Electrical, Amenities"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      color: T.text3,
                      letterSpacing: "0.07em",
                      textTransform: "uppercase",
                      marginBottom: 7,
                    }}
                  >
                    Attach Photos (up to 3 · max 5 MB each)
                  </label>
                  <input
                    className="tp-input"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setPhotoFiles(Array.from(e.target.files).slice(0, 3))}
                  />
                  {photoFiles.length > 0 && (
                    <p style={{ fontSize: "0.75rem", color: T.text3, marginTop: 6 }}>
                      {photoFiles.length} file{photoFiles.length > 1 ? "s" : ""} selected
                    </p>
                  )}
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button className="tp-btn-primary" type="submit" disabled={isUploading}>
                    {isUploading ? "Uploading..." : <><Ticket size={13} /> Submit Ticket <ChevronRight size={13} /></>}
                  </button>
                  <button type="button" className="tp-btn-ghost" onClick={() => setShowForm(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {loading && (
            <div className="tp-block" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[1, 2, 3].map((i) => <div key={i} className="tp-skel" style={{ height: 110 }} />)}
            </div>
          )}

          {!loading && items.length === 0 && (
            <div className="tp-block" style={{ textAlign: "center", padding: "48px 32px" }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: T.amberL,
                  border: `1px solid ${T.amberM}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 14px",
                }}
              >
                <Ticket size={20} color={T.amber} strokeWidth={1.8} />
              </div>
              <p className="tp-display" style={{ fontSize: "1.45rem", fontWeight: 700, color: T.ink, margin: "0 0 6px" }}>
                No tickets yet
              </p>
              <p style={{ fontSize: "0.83rem", color: T.text2, margin: 0 }}>
                Raise a complaint and track its progress here.
              </p>
            </div>
          )}

          {!loading && openItems.length > 0 && (
            <div className="tp-block">
              <p style={{ margin: "0 0 12px", fontSize: "0.9rem", fontWeight: 700, color: T.ink }}>Open & In Progress</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[...openItems, ...inProgItems].map((item) => (
                  <TicketCard key={item._id} item={item} />
                ))}
              </div>
            </div>
          )}

          {!loading && inProgItems.length > 0 && openItems.length === 0 && (
            <div className="tp-block">
              <p style={{ margin: "0 0 12px", fontSize: "0.9rem", fontWeight: 700, color: T.ink }}>In Progress</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {inProgItems.map((item) => <TicketCard key={item._id} item={item} />)}
              </div>
            </div>
          )}

          {!loading && resolvedItems.length > 0 && (
            <div className="tp-block">
              <p style={{ margin: "0 0 12px", fontSize: "0.9rem", fontWeight: 700, color: T.ink }}>Resolved & Closed</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {resolvedItems.map((item) => (
                  <div key={item._id} style={{ opacity: 0.68 }}>
                    <TicketCard item={item} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
