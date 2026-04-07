import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../components/api";
import { useAuth } from "../components/AuthContext";
import { tok, fonts, card, fieldStyle, btn } from "../lib/tokens";

function fmtDate(d) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}
function fmtTime(d) {
  if (!d) return "";
  return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}
function fmtDay(d)   { return new Date(d).toLocaleDateString("en-IN", { day: "numeric" }); }
function fmtMonth(d) { return new Date(d).toLocaleDateString("en-IN", { month: "short" }); }

function Sk({ w = "100%", h = 16 }) {
  return <div style={{ width: w, height: h, borderRadius: 8, background: tok.stone100, animation: "pulse 1.5s ease-in-out infinite" }} />;
}

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
  const [submitting, setSubmitting] = useState(false);

  const canCreate = useMemo(() => ["committee", "super_admin"].includes(user?.role), [user?.role]);

  const upcoming = items.filter(e => new Date(e.startAt) >= new Date()).sort((a,b) => new Date(a.startAt)-new Date(b.startAt));
  const past     = items.filter(e => new Date(e.startAt) <  new Date()).sort((a,b) => new Date(b.startAt)-new Date(a.startAt));

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
    setSubmitting(true); setError("");
    try {
      const data = await apiRequest("/events", { method: "POST", token, body: { title, description, location, startAt, endAt } });
      setItems(prev => [...prev, data.item]);
      setTitle(""); setDesc(""); setLocation("Club House"); setStartAt(""); setEndAt("");
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  }

  useEffect(() => { loadItems(); }, []);

  function EventCard({ item }) {
    const isPast = new Date(item.startAt) < new Date();
    return (
      <article style={{
        ...card,
        display: "flex", gap: 20, alignItems: "flex-start",
        opacity: isPast ? 0.6 : 1,
        borderLeft: `4px solid ${isPast ? tok.stone200 : tok.emerald}`,
      }}>
        {/* Date block */}
        <div style={{
          flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", width: 56, height: 60,
          background: isPast ? tok.stone100 : tok.emeraldLight,
          border: `1px solid ${isPast ? tok.stone200 : tok.emeraldBorder}`,
          borderRadius: 14,
        }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: isPast ? tok.stone400 : tok.emerald, lineHeight: 1, fontFamily: fonts.display }}>
            {fmtDay(item.startAt)}
          </span>
          <span style={{ fontSize: 11, fontWeight: 600, color: isPast ? tok.stone400 : tok.emerald, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {fmtMonth(item.startAt)}
          </span>
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: tok.stone800, margin: "0 0 6px", lineHeight: 1.3 }}>
            {item.title}
          </h3>
          {item.description && (
            <p style={{ fontSize: 13, color: tok.stone600, margin: "0 0 8px", lineHeight: 1.5 }}>{item.description}</p>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <span style={{ fontSize: 12, color: tok.stone400 }}>🕐 {fmtTime(item.startAt)} – {fmtTime(item.endAt)}</span>
            {item.location && <span style={{ fontSize: 12, color: tok.stone400 }}>📍 {item.location}</span>}
          </div>
        </div>
        {isPast && (
          <span style={{ flexShrink: 0, padding: "3px 10px", borderRadius: 100, background: tok.stone100, color: tok.stone400, fontSize: 11, fontWeight: 700, border: `1px solid ${tok.stone200}` }}>
            Past
          </span>
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
            <h1 style={{ fontFamily: fonts.display, fontSize: 32, fontWeight: 400, color: tok.stone800, margin: 0 }}>Events</h1>
            <p style={{ fontSize: 14, color: tok.stone400, marginTop: 4 }}>Upcoming & past community events</p>
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
      {canCreate && (
        <div style={{ ...card, marginBottom: 28 }}>
          <h2 style={{ fontFamily: fonts.display, fontSize: 20, fontWeight: 400, color: tok.stone800, margin: "0 0 16px" }}>
            Create Event
          </h2>
          <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input style={fieldStyle} placeholder="Event title" value={title} onChange={e => setTitle(e.target.value)} required />
            <textarea style={{ ...fieldStyle, minHeight: 80, resize: "vertical" }} placeholder="Description" value={description} onChange={e => setDesc(e.target.value)} />
            <input style={fieldStyle} placeholder="Location" value={location} onChange={e => setLocation(e.target.value)} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: tok.stone400, letterSpacing: "0.07em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Starts</label>
                <input style={fieldStyle} type="datetime-local" value={startAt} onChange={e => setStartAt(e.target.value)} required />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: tok.stone400, letterSpacing: "0.07em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Ends</label>
                <input style={fieldStyle} type="datetime-local" value={endAt} onChange={e => setEndAt(e.target.value)} required />
              </div>
            </div>
            <div><button style={btn.primary} type="submit" disabled={submitting}>{submitting ? "Creating…" : "📅 Create Event"}</button></div>
          </form>
        </div>
      )}

      {/* Upcoming */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: tok.stone400, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Upcoming</h2>
        {loading && [1,2].map(i => <div key={i} style={{ ...card, marginBottom: 12, height: 80 }}><Sk /></div>)}
        {!loading && upcoming.length === 0 && (
          <div style={{ ...card, textAlign: "center", padding: 40 }}>
            <p style={{ fontSize: 14, color: tok.stone400 }}>No upcoming events.</p>
          </div>
        )}
        {!loading && upcoming.map(item => <div key={item._id} style={{ marginBottom: 12 }}><EventCard item={item} /></div>)}
      </div>

      {/* Past */}
      {past.length > 0 && (
        <div>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: tok.stone400, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Past Events</h2>
          {past.map(item => <div key={item._id} style={{ marginBottom: 12 }}><EventCard item={item} /></div>)}
        </div>
      )}
    </div>
  );
}
