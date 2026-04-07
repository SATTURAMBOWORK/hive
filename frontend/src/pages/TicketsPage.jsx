import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../components/api";
import { useAuth } from "../components/AuthContext";
import { tok, fonts, card, fieldStyle, btn } from "../lib/tokens";

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

const STATUS_CFG = {
  open:        { bg: tok.indigoLight, color: tok.indigo, border: tok.indigoBorder, emoji: "🔵" },
  in_progress: { bg: tok.amberLight,  color: tok.amber,  border: tok.amberBorder,  emoji: "🟡" },
  resolved:    { bg: tok.emeraldLight,color: tok.emerald,border: tok.emeraldBorder, emoji: "🟢" },
  closed:      { bg: tok.stone100,    color: tok.stone600,border: tok.stone200,     emoji: "⚪" },
};

const STATUS_OPTIONS = ["open", "in_progress", "resolved", "closed"];

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
            style={{ border: `1px solid ${tok.stone200}`, borderRadius: 10, overflow: "hidden", cursor: "pointer", background: "none", padding: 0 }}
          >
            <img src={url} alt={`attachment ${i+1}`} style={{ width: 72, height: 72, objectFit: "cover", display: "block" }} />
          </button>
        ))}
      </div>
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}
        >
          <img src={lightbox} alt="attachment" style={{ maxHeight: "85vh", maxWidth: "90vw", borderRadius: 16, boxShadow: "0 24px 64px rgba(0,0,0,0.4)" }} />
        </div>
      )}
    </>
  );
}

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

  const open   = items.filter(t => !["resolved","closed"].includes(t.status));
  const closed = items.filter(t =>  ["resolved","closed"].includes(t.status));

  function TicketCard({ item }) {
    const cfg = STATUS_CFG[item.status] || STATUS_CFG.open;
    return (
      <article style={{ ...card, borderLeft: `4px solid ${cfg.color}` }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: tok.stone800, margin: 0, lineHeight: 1.3 }}>{item.title}</h3>
          <span style={{ flexShrink: 0, padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, textTransform: "capitalize", whiteSpace: "nowrap" }}>
            {cfg.emoji} {item.status?.replace("_", " ")}
          </span>
        </div>
        <p style={{ fontSize: 14, color: tok.stone600, lineHeight: 1.5, margin: 0 }}>{item.description}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
          <span style={{ fontSize: 12, color: tok.stone400 }}>🗂 {item.category}</span>
          <span style={{ fontSize: 12, color: tok.stone400 }}>🕐 {timeAgo(item.createdAt)}</span>
          <span style={{ fontSize: 12, color: tok.stone400 }}>👤 {item.createdBy?.fullName || "Resident"}</span>
        </div>
        <TicketPhotos photos={item.photos} />
        {canUpdateStatus && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14, paddingTop: 14, borderTop: `1px solid ${tok.stone100}` }}>
            {STATUS_OPTIONS.map(s => (
              <button
                key={s}
                onClick={() => handleStatusUpdate(item._id, s)}
                style={{
                  padding: "5px 12px", borderRadius: 100, fontSize: 12, fontWeight: 600,
                  cursor: "pointer", transition: "all .15s",
                  background: item.status === s ? STATUS_CFG[s].bg : tok.stone50,
                  color: item.status === s ? STATUS_CFG[s].color : tok.stone600,
                  border: `1px solid ${item.status === s ? STATUS_CFG[s].border : tok.stone200}`,
                  textTransform: "capitalize",
                }}
              >
                {s.replace("_", " ")}
              </button>
            ))}
          </div>
        )}
      </article>
    );
  }

  return (
    <div style={{ fontFamily: fonts.sans, maxWidth: 760, margin: "0 auto", paddingBottom: 64 }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: fonts.display, fontSize: 32, fontWeight: 400, color: tok.stone800, margin: 0 }}>Tickets</h1>
            <p style={{ fontSize: 14, color: tok.stone400, marginTop: 4 }}>{open.length} open · {closed.length} resolved</p>
          </div>
          <button style={btn.muted} onClick={loadItems}>↻ Refresh</button>
        </div>
        {error && (
          <div style={{ marginTop: 16, padding: "12px 16px", background: tok.roseLight, border: `1px solid ${tok.roseBorder}`, borderRadius: 12, fontSize: 14, color: tok.rose }}>
            {error}
          </div>
        )}
      </div>

      {/* Create form */}
      <div style={{ ...card, marginBottom: 28 }}>
        <h2 style={{ fontFamily: fonts.display, fontSize: 20, fontWeight: 400, color: tok.stone800, margin: "0 0 16px" }}>
          Raise a Complaint
        </h2>
        <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input style={fieldStyle} placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} required />
          <textarea style={{ ...fieldStyle, minHeight: 88, resize: "vertical" }} placeholder="Describe the issue in detail…" value={description} onChange={e => setDesc(e.target.value)} required />
          <input style={fieldStyle} placeholder="Category (e.g. plumbing, electrical)" value={category} onChange={e => setCategory(e.target.value)} />
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: tok.stone400, letterSpacing: "0.07em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
              Attach Photos (up to 3, max 5 MB each)
            </label>
            <input
              style={{ ...fieldStyle, cursor: "pointer" }}
              type="file" accept="image/*" multiple
              onChange={e => setPhotoFiles(Array.from(e.target.files).slice(0, 3))}
            />
            {photoFiles.length > 0 && (
              <p style={{ fontSize: 12, color: tok.stone400, marginTop: 6 }}>{photoFiles.length} file{photoFiles.length > 1 ? "s" : ""} selected</p>
            )}
          </div>
          <div>
            <button style={btn.primary} type="submit" disabled={isUploading}>
              {isUploading ? "Uploading photos…" : "🎫 Submit Ticket"}
            </button>
          </div>
        </form>
      </div>

      {/* Open tickets */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: tok.stone400, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Open</h2>
        {loading && [1,2].map(i => <div key={i} style={{ ...card, height: 120, marginBottom: 12 }} />)}
        {!loading && open.length === 0 && (
          <div style={{ ...card, textAlign: "center", padding: 36 }}>
            <p style={{ fontSize: 14, color: tok.stone400 }}>No open tickets. All good! 🎉</p>
          </div>
        )}
        {!loading && open.map(item => <div key={item._id} style={{ marginBottom: 12 }}><TicketCard item={item} /></div>)}
      </div>

      {/* Resolved */}
      {closed.length > 0 && (
        <div>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: tok.stone400, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Resolved & Closed</h2>
          {closed.map(item => <div key={item._id} style={{ marginBottom: 12, opacity: 0.65 }}><TicketCard item={item} /></div>)}
        </div>
      )}
    </div>
  );
}
