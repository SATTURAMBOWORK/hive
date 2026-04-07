import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { RefreshCw, XCircle, ChevronRight } from "lucide-react";
import { useAuth } from "../components/AuthContext";
import { apiRequest } from "../components/api";

/* ── Google Fonts (same as main dashboard) ─────────────────── */
if (!document.getElementById("dash-fonts")) {
  const l = document.createElement("link");
  l.id = "dash-fonts";
  l.rel = "stylesheet";
  l.href =
    "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=DM+Serif+Display:ital@0;1&display=swap";
  document.head.appendChild(l);
}

/* ── Design Tokens (same palette as DashboardPage) ─────────── */
const tok = {
  cream:         "#FDFCF9",
  stone50:       "#F7F5F0",
  stone100:      "#EDEBE4",
  stone200:      "#D9D6CC",
  stone400:      "#9E9B91",
  stone600:      "#6B6860",
  stone800:      "#2E2D29",
  gold:          "#C9A84C",
  goldLight:     "#F5EDD6",
  indigo:        "#3D52A0",
  indigoLight:   "#EEF1FA",
  indigoBorder:  "#C7D0EE",
  emerald:       "#1A7A5E",
  emeraldLight:  "#E6F5F0",
  emeraldBorder: "#B2DECE",
  rose:          "#C0392B",
  roseLight:     "#FBF0EE",
  roseBorder:    "#F5C6C2",
  amber:         "#B5620D",
  amberLight:    "#FEF5E7",
  amberBorder:   "#FDE68A",
  orange:        "#C2500A",
  orangeLight:   "#FFF3EB",
  orangeBorder:  "#FDDAB8",
};

/* ── Helpers ────────────────────────────────────────────────── */
function greeting(name) {
  const h = new Date().getHours();
  const word = h < 12 ? "Morning" : h < 17 ? "Afternoon" : "Evening";
  return { word, first: name?.split(" ")[0] || "there" };
}
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
function fmtDate(d) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
function fmtTime(d) {
  if (!d) return "";
  return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}
function fmtDay(d)   { return new Date(d).toLocaleDateString("en-IN", { day: "numeric" }); }
function fmtMonth(d) { return new Date(d).toLocaleDateString("en-IN", { month: "short" }); }

/* ── Skeleton loader ────────────────────────────────────────── */
function Sk({ style = {} }) {
  return (
    <div style={{
      borderRadius: 12, background: tok.stone100,
      animation: "pulse 1.5s ease-in-out infinite",
      ...style,
    }} />
  );
}

/* ── Reusable Card wrapper ──────────────────────────────────── */
function Card({ children, style = {} }) {
  return (
    <div style={{
      background: "#fff", border: `1px solid ${tok.stone100}`,
      borderRadius: 24, padding: "28px",
      ...style,
    }}>
      {children}
    </div>
  );
}

/* ── Section Header ─────────────────────────────────────────── */
function SectionHeader({ eyebrow, title, linkTo, linkLabel }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 22 }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: tok.stone400, marginBottom: 2 }}>
          {eyebrow}
        </div>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: tok.stone800 }}>
          {title}
        </div>
      </div>
      {linkTo && (
        <Link to={linkTo} style={{
          fontSize: 12, fontWeight: 600, color: tok.stone400, textDecoration: "none",
          letterSpacing: "0.04em", textTransform: "uppercase",
          padding: "6px 14px", borderRadius: 100,
          border: `1px solid ${tok.stone100}`, background: tok.stone50,
        }}>
          {linkLabel || "View all"}
        </Link>
      )}
    </div>
  );
}

/* ── Quick Action button ────────────────────────────────────── */
function QuickAction({ to, emoji, label, hoverColor, hoverBg, hoverBorder }) {
  const [hov, setHov] = useState(false);
  return (
    <Link
      to={to}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", gap: 10,
        padding: "20px 12px", borderRadius: 16,
        border: `1px solid ${hov ? hoverBorder : tok.stone100}`,
        background: hov ? hoverBg : "#fff",
        fontSize: 12, fontWeight: 600,
        color: hov ? hoverColor : tok.stone600,
        textDecoration: "none",
        transform: hov ? "translateY(-2px)" : "none",
        transition: "all .2s",
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 14, fontSize: 20,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: hov ? "#fff" : tok.stone50,
        border: `1px solid ${hov ? hoverBorder : tok.stone100}`,
        transition: "all .2s",
      }}>
        {emoji}
      </div>
      {label}
    </Link>
  );
}

/* ── Announcement Row ───────────────────────────────────────── */
function AnnouncementRow({ item, isLast }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", gap: 14,
        padding: "16px 0",
        borderBottom: isLast ? "none" : `1px solid ${tok.stone100}`,
        transition: "all .2s",
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
        background: tok.indigoLight,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 16,
        transform: hov ? "scale(1.08)" : "scale(1)",
        transition: "transform .2s",
      }}>
        📢
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
          <p style={{ fontSize: 14, fontWeight: 500, color: hov ? tok.indigo : tok.stone800, transition: "color .2s" }}>
            {item.title}
          </p>
          <span style={{ fontSize: 11, color: tok.stone400, flexShrink: 0 }}>{timeAgo(item.createdAt)}</span>
        </div>
        {item.body && (
          <p style={{ fontSize: 12, color: tok.stone400, lineHeight: 1.5 }}>
            {item.body.length > 100 ? item.body.slice(0, 100) + "…" : item.body}
          </p>
        )}
      </div>
    </div>
  );
}

/* ── Upcoming Event Row ─────────────────────────────────────── */
function EventRow({ event }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "13px 14px", borderRadius: 14,
        border: `1px solid ${hov ? tok.stone200 : tok.stone100}`,
        background: hov ? "#fff" : tok.stone50,
        marginBottom: 8, cursor: "default",
        transform: hov ? "translateX(3px)" : "none",
        transition: "all .2s",
      }}
    >
      {/* Date badge */}
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", width: 44, height: 44, borderRadius: 12,
        background: tok.indigoLight, flexShrink: 0,
      }}>
        <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, lineHeight: 1, color: tok.indigo, fontWeight: 700 }}>
          {fmtDay(event.startAt)}
        </span>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: tok.indigo }}>
          {fmtMonth(event.startAt)}
        </span>
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: tok.stone800 }}>{event.title}</div>
        <div style={{ fontSize: 11, color: tok.stone400, marginTop: 2 }}>
          {event.location ? `📍 ${event.location} · ` : ""}{fmtTime(event.startAt)}
        </div>
      </div>
    </div>
  );
}

/* ── Mini stat box ──────────────────────────────────────────── */
function MiniStat({ label, value, loading }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center",
      background: tok.stone50, border: `1px solid ${tok.stone100}`,
      borderRadius: 20, padding: "20px 28px", minWidth: 90,
    }}>
      {loading
        ? <Sk style={{ width: 48, height: 40, marginBottom: 4 }} />
        : <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 40, lineHeight: 1, color: tok.stone800 }}>{value}</span>
      }
      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: tok.stone400, marginTop: 4 }}>
        {label}
      </span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SECURITY DASHBOARD
══════════════════════════════════════════════════════════════ */
export function SecurityDashboard() {
  const { token, user } = useAuth();

  const [announcements, setAnnouncements] = useState([]);
  const [events,        setEvents]        = useState([]);
  const [myTickets,     setMyTickets]     = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true); setError("");
    try {
      const [annRes, evRes, tkRes] = await Promise.all([
        apiRequest("/announcements", { token }),
        apiRequest("/events",        { token }),
        apiRequest("/tickets",       { token }),
      ]);
      setAnnouncements(annRes.items || []);
      setEvents(evRes.items || []);
      setMyTickets(tkRes.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const { word, first } = greeting(user?.fullName);
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" });

  const upcomingEvents = useMemo(() =>
    events
      .filter(e => new Date(e.startAt) >= new Date())
      .sort((a, b) => new Date(a.startAt) - new Date(b.startAt)),
    [events]
  );

  // Only show open incidents raised by this security guard
  const userId = user?._id || user?.id || "";
  const openIncidents = useMemo(() =>
    myTickets.filter(t =>
      (t.createdBy?._id || t.createdBy) === userId &&
      !["resolved", "closed"].includes(t.status)
    ),
    [myTickets, userId]
  );

  return (
    <div style={{
      fontFamily: "'DM Sans', sans-serif",
      background: tok.cream,
      minHeight: "calc(100vh - 90px)",
      padding: "32px 24px 64px",
      margin: "-16px -24px",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* ── Error ─────────────────────────────────── */}
        {error && (
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            background: "#FBF0EE", border: `1px solid ${tok.roseBorder}`,
            borderRadius: 16, padding: "14px 20px",
            fontSize: 14, fontWeight: 500, color: tok.rose, marginBottom: 20,
          }}>
            <XCircle size={18} /> {error}
          </div>
        )}

        {/* ── HERO ──────────────────────────────────── */}
        <div style={{
          background: "#fff", border: `1px solid ${tok.stone100}`,
          borderRadius: 32, padding: "36px 40px",
          display: "flex", alignItems: "flex-end", justifyContent: "space-between",
          gap: 24, position: "relative", overflow: "hidden", marginBottom: 20,
        }}>
          {/* Decorative blob — orange tint for security */}
          <div style={{
            position: "absolute", top: -60, right: -60,
            width: 280, height: 280, borderRadius: "50%",
            background: tok.orangeLight, opacity: 0.7,
            pointerEvents: "none",
          }} />

          {/* Greeting */}
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: tok.stone400, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
              Good {word} · {today}
            </div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 48, lineHeight: 1, color: tok.stone800, marginBottom: 18 }}>
              Welcome back,{" "}
              <em style={{ fontStyle: "italic", color: tok.orange }}>{first}.</em>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {/* Role badge */}
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "6px 14px", borderRadius: 100, fontSize: 12, fontWeight: 500,
                border: `1px solid ${tok.orangeBorder}`, background: tok.orangeLight, color: tok.orange,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: tok.orange, display: "inline-block" }} />
                Security Guard
              </span>
              {/* On duty badge */}
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "6px 14px", borderRadius: 100, fontSize: 12, fontWeight: 500,
                border: `1px solid ${tok.emeraldBorder}`, background: tok.emeraldLight, color: tok.emerald,
              }}>
                🟢 On Duty
              </span>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 12, position: "relative", zIndex: 1, flexShrink: 0 }}>
            <MiniStat label="Notices"   value={announcements.length}  loading={loading} />
            <MiniStat label="Events"    value={upcomingEvents.length} loading={loading} />
            <MiniStat label="Incidents" value={openIncidents.length}  loading={loading} />
          </div>

          {/* Sync button */}
          <button
            onClick={load}
            disabled={loading}
            style={{
              position: "absolute", top: 28, right: 32,
              display: "flex", alignItems: "center", gap: 6,
              fontSize: 12, fontWeight: 500, color: tok.stone400,
              background: tok.stone50, border: `1px solid ${tok.stone100}`,
              padding: "7px 14px", borderRadius: 100, cursor: "pointer",
              transition: "all .2s", zIndex: 2,
            }}
          >
            <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            Sync
          </button>
        </div>

        {/* ── BENTO GRID ─────────────────────────────── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 360px",
          gap: 20,
        }}>

          {/* LEFT: Announcements feed */}
          <Card>
            <SectionHeader
              eyebrow="Society Notices"
              title="Announcements"
              linkTo="/announcements"
              linkLabel="View all"
            />

            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[...Array(4)].map((_, i) => (
                  <div key={i} style={{ display: "flex", gap: 14 }}>
                    <Sk style={{ width: 40, height: 40, flexShrink: 0 }} />
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                      <Sk style={{ height: 14, width: "60%" }} />
                      <Sk style={{ height: 12, width: "80%" }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : announcements.length === 0 ? (
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", padding: "48px 0", textAlign: "center",
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16, background: tok.stone50,
                  border: `1px solid ${tok.stone100}`, display: "flex",
                  alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 12,
                }}>
                  🔔
                </div>
                <p style={{ fontSize: 15, fontWeight: 500, color: tok.stone800 }}>No notices yet</p>
                <p style={{ fontSize: 13, color: tok.stone400, marginTop: 4 }}>Society announcements will appear here.</p>
              </div>
            ) : (
              announcements.slice(0, 6).map((item, i) => (
                <AnnouncementRow
                  key={item._id}
                  item={item}
                  isLast={i === Math.min(announcements.length, 6) - 1}
                />
              ))
            )}
          </Card>

          {/* RIGHT column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Quick Actions */}
            <Card style={{ padding: 24 }}>
              <SectionHeader eyebrow="Shortcuts" title="Quick Actions" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <QuickAction
                  to="/visitors"
                  emoji="🚪"
                  label="Visitor Log"
                  hoverColor={tok.orange}
                  hoverBg={tok.orangeLight}
                  hoverBorder={tok.orangeBorder}
                />
                <QuickAction
                  to="/tickets"
                  emoji="🚨"
                  label="Report Incident"
                  hoverColor={tok.rose}
                  hoverBg={tok.roseLight}
                  hoverBorder={tok.roseBorder}
                />
                <QuickAction
                  to="/announcements"
                  emoji="📢"
                  label="Notices"
                  hoverColor={tok.indigo}
                  hoverBg={tok.indigoLight}
                  hoverBorder={tok.indigoBorder}
                />
                <QuickAction
                  to="/events"
                  emoji="🗓"
                  label="Events"
                  hoverColor={tok.emerald}
                  hoverBg={tok.emeraldLight}
                  hoverBorder={tok.emeraldBorder}
                />
              </div>
            </Card>

            {/* Upcoming Events — security needs to know about these */}
            <Card style={{ padding: 24 }}>
              <SectionHeader eyebrow="Expect visitors" title="Upcoming Events" linkTo="/events" linkLabel="See all" />
              {loading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <Sk style={{ height: 68 }} />
                  <Sk style={{ height: 68 }} />
                </div>
              ) : upcomingEvents.length === 0 ? (
                <div style={{
                  borderRadius: 14, border: `1px dashed ${tok.stone200}`,
                  background: tok.stone50, padding: 24, textAlign: "center",
                  fontSize: 13, color: tok.stone400, fontWeight: 500,
                }}>
                  No upcoming events.
                </div>
              ) : (
                upcomingEvents.slice(0, 3).map(e => <EventRow key={e._id} event={e} />)
              )}
            </Card>

            {/* Open Incidents raised by this guard */}
            {!loading && openIncidents.length > 0 && (
              <Card style={{ padding: 24 }}>
                <SectionHeader eyebrow="Raised by you" title="Open Incidents" linkTo="/tickets" linkLabel="View all" />
                {openIncidents.slice(0, 3).map((t, i) => (
                  <div key={t._id} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "11px 14px", borderRadius: 12,
                    background: tok.stone50, border: `1px solid ${tok.stone100}`,
                    marginBottom: i < openIncidents.length - 1 ? 8 : 0,
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: tok.stone800 }}>{t.title}</div>
                      <div style={{ fontSize: 11, color: tok.stone400, marginTop: 2 }}>{timeAgo(t.createdAt)}</div>
                    </div>
                    <span style={{
                      padding: "4px 10px", borderRadius: 100, fontSize: 10, fontWeight: 700,
                      letterSpacing: "0.06em", textTransform: "uppercase",
                      background: tok.amberLight, color: tok.amber, border: `1px solid ${tok.amberBorder}`,
                      flexShrink: 0,
                    }}>
                      {t.status?.replace("_", " ")}
                    </span>
                  </div>
                ))}
              </Card>
            )}

          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
      `}</style>
    </div>
  );
}
