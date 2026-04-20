import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  X,
  PackageSearch,
  CheckCircle,
  Trash2,
  HandHelping,
  MapPin,
  CalendarDays,
} from "lucide-react";
import { apiRequest } from "../components/api";
import { useAuth } from "../components/AuthContext";

const T = {
  bg: "#F7F9FF",
  surface: "#FFFFFF",
  border: "#DCE5F3",
  borderHover: "#D1D5DB",
  ink: "#111827",
  text2: "#6B7280",
  text3: "#9CA3AF",
  blue: "#2563EB",
  blueLight: "#EFF6FF",
  blueBorder: "#BFDBFE",
  green: "#16A34A",
  greenLight: "#DCFCE7",
  greenBorder: "#BBF7D0",
  amber: "#E8890C",
  amberH: "#C97508",
  amberLight: "#FFF8F0",
  amberBorder: "#FDECC8",
  red: "#DC2626",
  redLight: "#FEE2E2",
  redBorder: "#FECACA",
};

const CATEGORY_META = {
  keys: { label: "Keys", color: T.amber, bg: T.amberLight, border: T.amberBorder },
  phone: { label: "Phone", color: T.blue, bg: T.blueLight, border: T.blueBorder },
  wallet: { label: "Wallet", color: T.green, bg: T.greenLight, border: T.greenBorder },
  pet: { label: "Pet", color: "#7C3AED", bg: "#EDE9FE", border: "#DDD6FE" },
  documents: { label: "Documents", color: T.red, bg: T.redLight, border: T.redBorder },
  bag: { label: "Bag", color: T.amber, bg: T.amberLight, border: T.amberBorder },
  other: { label: "Other", color: T.text2, bg: "#F1F5F9", border: "#E2E8F0" },
};

const CATEGORIES = Object.keys(CATEGORY_META);

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap');

  .lfx-root * { box-sizing: border-box; }

  .lfx-root {
    font-family: 'Manrope', sans-serif;
    background:
      radial-gradient(900px 380px at 85% -12%, rgba(37,99,235,0.13), transparent 64%),
      radial-gradient(760px 340px at -10% 0%, rgba(232,137,12,0.12), transparent 68%),
      ${T.bg};
    min-height: calc(100vh - 64px);
    padding: 22px 20px 70px;
    position: relative;
  }

  .lfx-root::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image:
      linear-gradient(to right, rgba(148,163,184,0.11) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(148,163,184,0.11) 1px, transparent 1px);
    background-size: 40px 40px;
    mask-image: radial-gradient(circle at 20% 10%, rgba(0,0,0,0.9), transparent 72%);
  }

  .lfx-content {
    position: relative;
    z-index: 1;
    max-width: 1120px;
    margin: 0 auto;
  }

  .lfx-display { font-family: 'Cormorant Garamond', serif; }

  .lfx-hero {
    border: 1px solid #D8E3F5;
    border-radius: 24px;
    background: linear-gradient(140deg, rgba(255,255,255,0.96), rgba(243,247,255,0.95));
    box-shadow: 0 24px 50px rgba(17,24,39,0.09);
    padding: 18px;
    margin-bottom: 18px;
    overflow: hidden;
    position: relative;
  }

  .lfx-hero::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(120deg, rgba(255,255,255,0) 38%, rgba(255,255,255,0.34) 52%, rgba(255,255,255,0) 66%);
    transform: translateX(-130%);
    animation: lfx-sheen 4.6s ease-in-out infinite;
  }

  .lfx-sub {
    margin-top: 10px;
    color: ${T.text2};
    font-size: 0.9rem;
    line-height: 1.7;
    max-width: 60ch;
  }

  .lfx-hero-actions {
    margin-top: 14px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .lfx-btn-primary {
    position: relative;
    isolation: isolate;
    overflow: hidden;
    border: 1.5px solid rgba(232,137,12,0.38);
    border-radius: 10px;
    padding: 10px 18px;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    background: rgba(255,248,240,0.75);
    color: ${T.amberH};
    font-family: 'Manrope', sans-serif;
    font-size: 0.84rem;
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.24s cubic-bezier(0.22,1,0.36,1), box-shadow 0.24s, color 0.2s, border-color 0.2s;
  }

  .lfx-btn-primary::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, ${T.amber}, ${T.amberH});
    transform: scaleX(0);
    transform-origin: left center;
    transition: transform 0.32s cubic-bezier(0.22, 1, 0.36, 1);
    z-index: -1;
  }

  .lfx-btn-primary > * {
    position: relative;
    z-index: 1;
    transition: transform 0.2s ease;
  }

  .lfx-btn-primary:hover:not(:disabled) {
    color: #FFFFFF;
    border-color: ${T.amber};
    transform: translateY(-1px);
    box-shadow: 0 8px 22px rgba(232,137,12,0.26), 0 2px 6px rgba(232,137,12,0.12);
  }

  .lfx-btn-primary:hover:not(:disabled)::before { transform: scaleX(1); }
  .lfx-btn-primary:hover:not(:disabled) svg { transform: translateX(1px); }
  .lfx-btn-primary:active:not(:disabled) { transform: translateY(0); }
  .lfx-btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }

  .lfx-btn-soft {
    position: relative;
    overflow: hidden;
    border: 1px solid ${T.border};
    border-radius: 10px;
    padding: 9px 14px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #FFFFFF;
    color: ${T.text2};
    font-family: 'Manrope', sans-serif;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s, color 0.2s;
  }

  .lfx-btn-soft::after {
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
    transition: transform 0.22s ease, opacity 0.22s ease;
  }

  .lfx-btn-soft:hover:not(:disabled) {
    border-color: ${T.borderHover};
    color: ${T.ink};
    transform: translateY(-1px);
    box-shadow: 0 8px 16px rgba(17,24,39,0.08);
  }

  .lfx-btn-soft:hover:not(:disabled)::after {
    transform: scaleX(1);
    opacity: 1;
  }

  .lfx-toolbar {
    position: sticky;
    top: 64px;
    z-index: 10;
    margin-bottom: 16px;
    border: 1px solid #DAE4F6;
    border-radius: 16px;
    padding: 10px;
    background: rgba(255,255,255,0.88);
    backdrop-filter: blur(12px);
    box-shadow: 0 12px 26px rgba(17,24,39,0.08);
  }

  .lfx-chip-row {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    margin-bottom: 8px;
  }

  .lfx-chip {
    border: 1px solid ${T.border};
    border-radius: 999px;
    padding: 6px 12px;
    background: #FFFFFF;
    color: ${T.text2};
    font-family: 'Manrope', sans-serif;
    font-size: 0.75rem;
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.16s, border-color 0.16s, color 0.16s, box-shadow 0.16s;
    white-space: nowrap;
  }

  .lfx-chip:hover {
    border-color: ${T.borderHover};
    color: ${T.ink};
    transform: translateY(-1px);
    box-shadow: 0 6px 14px rgba(17,24,39,0.08);
  }

  .lfx-chip.active {
    border-color: ${T.amber};
    color: #FFFFFF;
    background: linear-gradient(135deg, ${T.amber}, ${T.amberH});
    box-shadow: 0 8px 18px rgba(232,137,12,0.30);
  }

  .lfx-search {
    position: relative;
    margin-left: auto;
    min-width: 230px;
  }

  .lfx-input {
    width: 100%;
    border: 1px solid ${T.border};
    border-radius: 10px;
    background: #FFFFFF;
    color: ${T.ink};
    padding: 10px 12px;
    font-family: 'Manrope', sans-serif;
    font-size: 0.84rem;
    outline: none;
    transition: border-color 0.18s, box-shadow 0.18s;
  }

  .lfx-input::placeholder { color: ${T.text3}; }

  .lfx-input:focus {
    border-color: ${T.borderHover};
    box-shadow: 0 0 0 3px rgba(232,137,12,.1);
  }

  .lfx-block {
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 18px;
    padding: 16px;
    box-shadow: 0 10px 24px rgba(17,24,39,0.06);
    margin-bottom: 16px;
  }

  .lfx-card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 14px;
  }

  .lfx-card {
    border: 1px solid #E2E8F0;
    border-radius: 18px;
    background: #FFFFFF;
    overflow: hidden;
    box-shadow: 0 8px 20px rgba(17,24,39,0.06);
    transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
  }

  .lfx-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 16px 34px rgba(17,24,39,0.12);
    border-color: ${T.borderHover};
  }

  .lfx-card-topbar {
    height: 3px;
    background: linear-gradient(90deg, ${T.amber}, ${T.amberH});
  }

  .lfx-type-badge,
  .lfx-cat-badge,
  .lfx-status-badge {
    padding: 3px 10px;
    border-radius: 999px;
    font-size: 0.66rem;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .lfx-mini-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    border-radius: 8px;
    border: 1px solid;
    padding: 6px 11px;
    font-family: 'Manrope', sans-serif;
    font-size: 0.73rem;
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.16s, box-shadow 0.16s, opacity 0.16s;
  }

  .lfx-mini-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 14px rgba(17,24,39,0.10);
  }

  .lfx-sk {
    border-radius: 8px;
    background: linear-gradient(90deg, #EEF2F7 25%, #E2E8F0 50%, #EEF2F7 75%);
    background-size: 200% 100%;
    animation: lfx-shimmer 1.5s ease-in-out infinite;
  }

  .lfx-fade {
    opacity: 0;
    animation: lfx-fadeup .35s ease both;
  }

  @keyframes lfx-shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }

  @keyframes lfx-fadeup {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes lfx-sheen {
    0%, 24% { transform: translateX(-130%); }
    55% { transform: translateX(130%); }
    100% { transform: translateX(130%); }
  }

  @media (max-width: 760px) {
    .lfx-search {
      width: 100%;
      margin-left: 0;
      min-width: 0;
    }
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

function fmtDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function SkeletonCard() {
  return (
    <div className="lfx-card" style={{ padding: 16 }}>
      <div className="lfx-sk" style={{ width: 74, height: 18, marginBottom: 10, borderRadius: 999 }} />
      <div className="lfx-sk" style={{ width: "74%", height: 17, marginBottom: 8 }} />
      <div className="lfx-sk" style={{ width: "54%", height: 13, marginBottom: 14 }} />
      <div className="lfx-sk" style={{ width: "40%", height: 13 }} />
    </div>
  );
}

function ItemCard({ item, userId, onClaim, onResolve, onDelete, index }) {
  const isLost = item.type === "lost";
  const cat = CATEGORY_META[item.category] || CATEGORY_META.other;
  const isOwner = item.postedBy?._id === userId || item.postedBy === userId;
  const isClaimed = Boolean(item.claimedBy);
  const isResolved = item.status === "resolved";

  return (
    <article className="lfx-card lfx-fade" style={{ animationDelay: `${index * 0.05}s` }}>
      <div
        className="lfx-card-topbar"
        style={{
          background: isLost
            ? "linear-gradient(90deg, #E8890C, #C97508)"
            : "linear-gradient(90deg, #16A34A, #4ADE80)",
        }}
      />

      <div style={{ padding: "15px 16px 14px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 10 }}>
          <span
            className="lfx-type-badge"
            style={{
              background: isLost ? T.amberLight : T.greenLight,
              color: isLost ? T.amber : T.green,
              border: `1px solid ${isLost ? T.amberBorder : T.greenBorder}`,
            }}
          >
            {isLost ? "Lost" : "Found"}
          </span>

          <span className="lfx-cat-badge" style={{ background: cat.bg, color: cat.color, border: `1px solid ${cat.border}` }}>
            {cat.label}
          </span>

          {isResolved && (
            <span className="lfx-status-badge" style={{ background: T.greenLight, color: T.green, border: `1px solid ${T.greenBorder}` }}>
              Resolved
            </span>
          )}
        </div>

        <h3 style={{ margin: "0 0 6px", fontSize: "1rem", fontWeight: 800, color: T.ink, lineHeight: 1.35 }}>
          {item.title}
        </h3>

        <p style={{ margin: "0 0 10px", fontSize: "0.83rem", color: T.text2, lineHeight: 1.6 }}>
          {item.description}
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
          {item.location && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "0.73rem", color: T.text3 }}>
              <MapPin size={12} />
              {item.location}
            </span>
          )}
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "0.73rem", color: T.text3 }}>
            <CalendarDays size={12} />
            {fmtDate(item.date)}
          </span>
        </div>

        {item.photo && (
          <img
            src={item.photo}
            alt="Item"
            style={{
              width: "100%",
              maxHeight: 180,
              objectFit: "cover",
              borderRadius: 10,
              marginBottom: 10,
              border: `1px solid ${T.border}`,
            }}
          />
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            flexWrap: "wrap",
            borderTop: `1px solid ${T.border}`,
            paddingTop: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #24324A, #5B6577)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.62rem",
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              {(item.postedBy?.fullName || "?")
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "0.74rem", fontWeight: 700, color: T.ink }}>
                {item.postedBy?.fullName || "Unknown"}
              </p>
              <p style={{ margin: 0, fontSize: "0.68rem", color: T.text3 }}>{timeAgo(item.createdAt)}</p>
            </div>
          </div>

          {!isResolved && (
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              {!isOwner && !isClaimed && (
                <button
                  className="lfx-mini-btn"
                  onClick={() => onClaim(item._id)}
                  style={{
                    background: isLost ? T.amberLight : T.greenLight,
                    color: isLost ? T.amber : T.green,
                    borderColor: isLost ? T.amberBorder : T.greenBorder,
                  }}
                >
                  <HandHelping size={12} />
                  {isLost ? "I found this" : "This is mine"}
                </button>
              )}

              {isClaimed && !isOwner && (
                <span style={{ fontSize: "0.72rem", color: T.text3, fontStyle: "italic", alignSelf: "center" }}>
                  Claimed by {item.claimedBy?.fullName || "someone"}
                </span>
              )}

              {isOwner && (
                <button
                  className="lfx-mini-btn"
                  onClick={() => onResolve(item._id)}
                  style={{ background: T.greenLight, color: T.green, borderColor: T.greenBorder }}
                >
                  <CheckCircle size={12} />
                  Resolve
                </button>
              )}

              {isOwner && (
                <button
                  className="lfx-mini-btn"
                  onClick={() => onDelete(item._id)}
                  style={{ background: T.redLight, color: T.red, borderColor: T.redBorder }}
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export function LostFoundPage() {
  const { token, user } = useAuth();
  const userId = user?._id || user?.id || "";

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    type: "lost",
    category: "other",
    title: "",
    description: "",
    location: "",
    date: new Date().toISOString().split("T")[0],
    photo: "",
  });

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("/lost-found", { token });
      setItems(data.items || []);
    } catch (err) {
      setError(err.message || "Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    return items.filter((item) => {
      if (filter !== "all" && item.type !== filter) return false;
      if (catFilter !== "all" && item.category !== catFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const hit =
          item.title?.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.location?.toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [items, filter, catFilter, search]);

  function onFormChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const data = await apiRequest("/lost-found", {
        token,
        method: "POST",
        body: form,
      });
      setItems((prev) => [data.item, ...prev]);
      setShowForm(false);
      setForm({
        type: "lost",
        category: "other",
        title: "",
        description: "",
        location: "",
        date: new Date().toISOString().split("T")[0],
        photo: "",
      });
    } catch (err) {
      setError(err.message || "Failed to post item");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleClaim(id) {
    setError("");
    try {
      const data = await apiRequest(`/lost-found/${id}/claim`, { token, method: "PATCH" });
      setItems((prev) => prev.map((i) => (i._id === id ? data.item : i)));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleResolve(id) {
    if (!window.confirm("Mark this item as resolved?")) return;
    setError("");
    try {
      const data = await apiRequest(`/lost-found/${id}/resolve`, { token, method: "PATCH" });
      setItems((prev) => prev.map((i) => (i._id === id ? data.item : i)));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this post permanently?")) return;
    setError("");
    try {
      await apiRequest(`/lost-found/${id}`, { token, method: "DELETE" });
      setItems((prev) => prev.filter((i) => i._id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="lfx-root">
        <div className="lfx-content">
          <section className="lfx-hero">
            <div>
              <h1 className="lfx-display" style={{ margin: 0, color: T.ink, fontSize: "clamp(2.1rem, 4.8vw, 3.3rem)", lineHeight: 0.94 }}>
                Lost &amp; Found
              </h1>
              <p className="lfx-sub">
                Report missing items, post found objects, and help residents reunite quickly through one organized board.
              </p>
              <div className="lfx-hero-actions">
                <button className="lfx-btn-primary" onClick={() => setShowForm((v) => !v)}>
                  {showForm ? <><X size={14} /> Cancel</> : <><Plus size={14} /> Post Item</>}
                </button>
                <button className="lfx-btn-soft" onClick={load} disabled={loading}>Refresh Feed</button>
              </div>
            </div>
          </section>

          {error && (
            <div
              style={{
                marginBottom: 14,
                borderRadius: 12,
                border: `1px solid ${T.redBorder}`,
                background: T.redLight,
                color: T.red,
                fontSize: "0.84rem",
                padding: "11px 14px",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              {error}
              <button
                onClick={() => setError("")}
                style={{ marginLeft: "auto", border: "none", background: "none", color: T.red, cursor: "pointer" }}
              >
                <X size={14} />
              </button>
            </div>
          )}

          {showForm && (
            <section className="lfx-block" style={{ position: "relative", overflow: "hidden" }}>
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
              <h2 className="lfx-display" style={{ margin: "0 0 14px", color: T.ink, fontSize: "1.5rem" }}>
                Report Lost or Found Item
              </h2>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", marginBottom: 6, color: T.text2, fontSize: "0.74rem", fontWeight: 700 }}>Type *</label>
                    <select name="type" value={form.type} onChange={onFormChange} className="lfx-input">
                      <option value="lost">Lost - I am looking for this</option>
                      <option value="found">Found - I found this</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 6, color: T.text2, fontSize: "0.74rem", fontWeight: 700 }}>Category *</label>
                    <select name="category" value={form.category} onChange={onFormChange} className="lfx-input">
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{CATEGORY_META[c].label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 6, color: T.text2, fontSize: "0.74rem", fontWeight: 700 }}>Title *</label>
                  <input
                    name="title"
                    value={form.title}
                    onChange={onFormChange}
                    className="lfx-input"
                    placeholder="e.g. Lost blue umbrella near gym"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 6, color: T.text2, fontSize: "0.74rem", fontWeight: 700 }}>Description *</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={onFormChange}
                    rows={3}
                    className="lfx-input"
                    placeholder="Describe color, brand, size, and key identifiers"
                    required
                    style={{ minHeight: 82 }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", marginBottom: 6, color: T.text2, fontSize: "0.74rem", fontWeight: 700 }}>Location</label>
                    <input
                      name="location"
                      value={form.location}
                      onChange={onFormChange}
                      className="lfx-input"
                      placeholder="Near Gate B, Parking Lot, Club House"
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 6, color: T.text2, fontSize: "0.74rem", fontWeight: 700 }}>Date *</label>
                    <input
                      name="date"
                      type="date"
                      value={form.date}
                      onChange={onFormChange}
                      className="lfx-input"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 6, color: T.text2, fontSize: "0.74rem", fontWeight: 700 }}>Photo URL (optional)</label>
                  <input
                    name="photo"
                    value={form.photo}
                    onChange={onFormChange}
                    className="lfx-input"
                    placeholder="Paste an image URL"
                  />
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button className="lfx-btn-primary" type="submit" disabled={submitting}>
                    {submitting ? "Posting..." : "Post Item"}
                  </button>
                  <button type="button" className="lfx-btn-soft" onClick={() => setShowForm(false)}>Cancel</button>
                </div>
              </form>
            </section>
          )}

          <section className="lfx-toolbar">
            <div className="lfx-chip-row">
              {["all", "lost", "found"].map((f) => (
                <button key={f} className={`lfx-chip${filter === f ? " active" : ""}`} onClick={() => setFilter(f)}>
                  {f === "all" ? "All" : f === "lost" ? "Lost" : "Found"}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <div className="lfx-chip-row" style={{ marginBottom: 0 }}>
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    className={`lfx-chip${catFilter === c ? " active" : ""}`}
                    onClick={() => setCatFilter(catFilter === c ? "all" : c)}
                  >
                    {CATEGORY_META[c].label}
                  </button>
                ))}
              </div>

              <div className="lfx-search">
                <Search
                  size={14}
                  style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: T.text3, pointerEvents: "none" }}
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="lfx-input"
                  placeholder="Search title, description, location"
                  style={{ paddingLeft: 32, paddingRight: 30 }}
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    style={{
                      position: "absolute",
                      right: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      border: "none",
                      background: "none",
                      color: T.text3,
                      cursor: "pointer",
                    }}
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>
          </section>

          {loading ? (
            <section className="lfx-card-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </section>
          ) : visible.length === 0 ? (
            <section className="lfx-block" style={{ textAlign: "center", padding: "56px 28px" }}>
              <div
                style={{
                  width: 60,
                  height: 60,
                  margin: "0 auto 14px",
                  borderRadius: 16,
                  border: `1px solid ${T.amberBorder}`,
                  background: T.amberLight,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <PackageSearch size={26} color={T.amber} />
              </div>

              <p className="lfx-display" style={{ margin: "0 0 6px", fontSize: "1.5rem", color: T.ink }}>
                {search || filter !== "all" || catFilter !== "all" ? "No posts match your filters" : "Nothing posted yet"}
              </p>

              <p style={{ margin: "0 0 16px", color: T.text2, fontSize: "0.84rem" }}>
                {search || filter !== "all" || catFilter !== "all"
                  ? "Try adjusting your filters or search terms"
                  : "Be the first to report a lost or found item."}
              </p>

              {!showForm && (
                <button className="lfx-btn-primary" onClick={() => setShowForm(true)}>
                  <Plus size={14} /> Post Item
                </button>
              )}
            </section>
          ) : (
            <section className="lfx-card-grid">
              {visible.map((item, i) => (
                <ItemCard
                  key={item._id}
                  item={item}
                  userId={userId}
                  onClaim={handleClaim}
                  onResolve={handleResolve}
                  onDelete={handleDelete}
                  index={i}
                />
              ))}
            </section>
          )}
        </div>
      </div>
    </>
  );
}
