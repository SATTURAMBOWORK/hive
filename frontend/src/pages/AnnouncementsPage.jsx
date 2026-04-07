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

function Sk({ w = "100%", h = 16 }) {
  return <div style={{ width: w, height: h, borderRadius: 8, background: tok.stone100, animation: "pulse 1.5s ease-in-out infinite" }} />;
}

export function AnnouncementsPage() {
  const { token, user } = useAuth();
  const [items, setItems]   = useState([]);
  const [title, setTitle]   = useState("");
  const [body, setBody]     = useState("");
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canCreate = useMemo(() => ["committee", "super_admin"].includes(user?.role), [user?.role]);

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
    setSubmitting(true); setError("");
    try {
      const data = await apiRequest("/announcements", { method: "POST", token, body: { title, body } });
      setItems(prev => [data.item, ...prev]);
      setTitle(""); setBody("");
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  }

  useEffect(() => { loadItems(); }, []);

  return (
    <div style={{ fontFamily: fonts.sans, maxWidth: 760, margin: "0 auto", paddingBottom: 64 }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: fonts.display, fontSize: 32, fontWeight: 400, color: tok.stone800, margin: 0 }}>
              Notices
            </h1>
            <p style={{ fontSize: 14, color: tok.stone400, marginTop: 4 }}>Community announcements from your society</p>
          </div>
          <button style={btn.muted} onClick={loadItems}>↻ Refresh</button>
        </div>

        {error && (
          <div style={{ marginTop: 16, padding: "12px 16px", background: tok.roseLight, border: `1px solid ${tok.roseBorder}`, borderRadius: 12, fontSize: 14, color: tok.rose }}>
            {error}
          </div>
        )}
      </div>

      {/* Create form — admin only */}
      {canCreate && (
        <div style={{ ...card, marginBottom: 24 }}>
          <h2 style={{ fontFamily: fonts.display, fontSize: 20, fontWeight: 400, color: tok.stone800, margin: "0 0 16px" }}>
            Post an Announcement
          </h2>
          <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              style={fieldStyle}
              placeholder="Title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
            <textarea
              style={{ ...fieldStyle, minHeight: 100, resize: "vertical" }}
              placeholder="Write your announcement…"
              value={body}
              onChange={e => setBody(e.target.value)}
              required
            />
            <div>
              <button style={btn.primary} type="submit" disabled={submitting}>
                {submitting ? "Posting…" : "📢 Post Announcement"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {loading && [1,2,3].map(i => (
          <div key={i} style={{ ...card, display: "flex", flexDirection: "column", gap: 10 }}>
            <Sk w="55%" h={18} /> <Sk w="90%" h={14} /> <Sk w="70%" h={14} /> <Sk w="30%" h={11} />
          </div>
        ))}

        {!loading && items.length === 0 && (
          <div style={{ ...card, textAlign: "center", padding: 48 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <p style={{ fontSize: 15, color: tok.stone400 }}>No announcements yet.</p>
          </div>
        )}

        {!loading && items.map((item, i) => (
          <article key={item._id} style={{
            ...card,
            borderLeft: `4px solid ${tok.indigo}`,
            transition: "box-shadow .2s",
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: tok.stone800, margin: 0, lineHeight: 1.3 }}>
                {item.title}
              </h3>
              <span style={{
                flexShrink: 0, padding: "3px 10px", borderRadius: 100,
                background: tok.indigoLight, color: tok.indigo,
                border: `1px solid ${tok.indigoBorder}`,
                fontSize: 11, fontWeight: 700, letterSpacing: "0.05em"
              }}>
                {timeAgo(item.createdAt)}
              </span>
            </div>
            <p style={{ fontSize: 14, color: tok.stone600, lineHeight: 1.6, margin: 0 }}>{item.body}</p>
            <p style={{ fontSize: 12, color: tok.stone400, marginTop: 12 }}>
              By {item.createdBy?.fullName || "Committee"}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
