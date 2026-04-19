/*
  📖 LEARNING NOTE — React Imports
  ----------------------------------
  useState   → stores data that changes over time (like the list of posts)
  useEffect  → runs code when the component mounts or when dependencies change
  useCallback → memoizes a function so it doesn't get recreated on every render
               (important when you pass it as a dependency to useEffect)
*/
import { useState, useEffect, useCallback } from "react";
import { Search, Plus, X, PackageSearch, CheckCircle, Trash2, HandHelping } from "lucide-react";
import { apiRequest } from "../components/api";
import { useAuth } from "../components/AuthContext";

/* ─── Design tokens — AptHive system (matches AnnouncementsPage) ─ */
const T = {
  bg:       "#FFFCF6",
  surface:  "#FFFFFF",
  subtle:   "#FAF6ED",
  subtle2:  "#F5EED9",
  border:   "#E7DDC8",
  borderHv: "#D8CDAE",
  ink:      "#24324A",
  ink2:     "#3D52A0",
  text2:    "#5B6577",
  text3:    "#8B95A8",
  green:    "#16A34A",
  greenL:   "#DCFCE7",
  red:      "#DC2626",
  redL:     "#FEE2E2",
  amber:    "#D97706",
  amberL:   "#FEF9C3",
  purple:   "#7C3AED",
  purpleL:  "#EDE9FE",
  sh:       "0 1px 3px rgba(36,50,74,.06), 0 1px 2px rgba(36,50,74,.04)",
  sh2:      "0 4px 20px rgba(36,50,74,.08), 0 1px 4px rgba(36,50,74,.04)",
};

/* ─── Category config — what colors each category badge uses ─── */
/*
  📖 LEARNING NOTE — Config objects
  ------------------------------------
  Instead of writing a big if/else chain every time we render a category badge,
  we store all the styling info in a lookup object (CATS).
  Then we just do CATS[item.category] to get the right colors.
  This is called the "lookup table" pattern.
*/
const CATS = {
  keys:      { label: "🔑 Keys",      color: T.amber,  bg: T.amberL,  border: "#FDE68A" },
  phone:     { label: "📱 Phone",     color: T.ink2,   bg: "#EEF2FF", border: "#C7D2FE" },
  wallet:    { label: "👛 Wallet",    color: T.green,  bg: T.greenL,  border: "#BBF7D0" },
  pet:       { label: "🐾 Pet",       color: T.purple, bg: T.purpleL, border: "#DDD6FE" },
  documents: { label: "📄 Documents", color: T.red,    bg: T.redL,    border: "#FECACA" },
  bag:       { label: "🎒 Bag",       color: T.amber,  bg: T.amberL,  border: "#FDE68A" },
  other:     { label: "📦 Other",     color: T.text2,  bg: T.subtle2, border: T.border  },
};

const CATEGORIES = Object.keys(CATS);

/* ─── CSS — class-based styles that can't be done with inline styles ─ */
/*
  📖 LEARNING NOTE — Why inject a <style> tag?
  -----------------------------------------------
  React's inline styles (style={{ ... }}) don't support :hover pseudo-selectors.
  So for hover effects, we inject a real CSS <style> block into the page.
  The class names (lf-card, lf-btn-primary, etc.) are then used as className.
*/
const CSS = `
  .lf-root * { box-sizing: border-box; }
  .lf-root {
    font-family: 'DM Sans', sans-serif;
    color: ${T.ink};
    min-height: calc(100vh - 64px);
    padding: 28px 28px 80px;
  }

  /* Card hover lift */
  .lf-card {
    background: ${T.surface};
    border: 1px solid ${T.border};
    border-radius: 16px;
    box-shadow: ${T.sh};
    transition: box-shadow .2s, border-color .2s, transform .2s;
    overflow: hidden;
  }
  .lf-card:hover {
    transform: translateY(-2px);
    box-shadow: ${T.sh2};
    border-color: ${T.borderHv};
  }

  /* Primary button — ink black */
  .lf-btn-primary {
    display: inline-flex; align-items: center; gap: 7px;
    background: ${T.ink};
    color: #fff;
    border: none;
    border-radius: 10px;
    padding: 10px 18px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: .83rem; font-weight: 700;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(36,50,74,.2);
    transition: background .15s, box-shadow .15s, transform .1s;
  }
  .lf-btn-primary:hover {
    background: #0F172A;
    box-shadow: 0 6px 18px rgba(36,50,74,.25);
    transform: translateY(-1px);
  }

  /* Secondary / ghost button */
  .lf-btn-ghost {
    display: inline-flex; align-items: center; gap: 6px;
    background: transparent;
    color: ${T.text2};
    border: 1.5px solid ${T.border};
    border-radius: 10px;
    padding: 9px 16px;
    font-family: 'DM Sans', sans-serif;
    font-size: .82rem; font-weight: 600;
    cursor: pointer;
    transition: border-color .15s, color .15s, background .15s;
  }
  .lf-btn-ghost:hover { border-color: ${T.ink}; color: ${T.ink}; background: ${T.subtle2}; }

  /* Filter chip */
  .lf-chip {
    padding: 6px 14px; border-radius: 100px;
    font-size: .75rem; font-weight: 600;
    border: 1.5px solid ${T.border};
    background: ${T.surface};
    color: ${T.text2};
    cursor: pointer;
    transition: all .15s;
    white-space: nowrap;
  }
  .lf-chip:hover { border-color: ${T.ink}; color: ${T.ink}; }
  .lf-chip.active { background: ${T.ink}; color: #fff; border-color: ${T.ink}; }

  /* Form input */
  .lf-input {
    width: 100%;
    padding: 10px 13px;
    border-radius: 10px;
    border: 1.5px solid ${T.border};
    background: ${T.subtle};
    font-family: 'DM Sans', sans-serif;
    font-size: .87rem;
    color: ${T.ink};
    outline: none;
    transition: border-color .15s, background .15s;
  }
  .lf-input:focus { border-color: ${T.ink}; background: ${T.surface}; }

  /* Claim / Resolve action buttons on cards */
  .lf-action-btn {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 6px 13px; border-radius: 8px;
    font-size: .75rem; font-weight: 700;
    cursor: pointer; border: 1.5px solid;
    transition: background .15s, transform .1s;
    font-family: 'DM Sans', sans-serif;
  }
  .lf-action-btn:hover { transform: translateY(-1px); }

  /* Skeleton shimmer */
  .lf-sk {
    background: linear-gradient(90deg, ${T.subtle2} 25%, ${T.border} 50%, ${T.subtle2} 75%);
    background-size: 200% 100%;
    animation: lf-shimmer 1.6s ease-in-out infinite;
    border-radius: 6px;
  }
  @keyframes lf-shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }

  /* Staggered fade-up entrance for cards */
  @keyframes lf-fadeup {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .lf-animate { animation: lf-fadeup .35s ease both; }
`;

/* ─── Small helper: how long ago ─────────────────────────────────── */
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
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/* ─── Skeleton loader (shown while data is fetching) ─────────────── */
/*
  📖 LEARNING NOTE — Skeleton screens
  -------------------------------------
  Instead of a spinner, we show placeholder "bones" that match the shape
  of the real content. This feels faster to the user (perceived performance).
  The .lf-sk class adds the shimmer animation via CSS.
*/
function SkeletonCard() {
  return (
    <div className="lf-card" style={{ padding: 20 }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <div className="lf-sk" style={{ width: 52, height: 20, borderRadius: 100 }} />
        <div className="lf-sk" style={{ width: 68, height: 20, borderRadius: 100 }} />
      </div>
      <div className="lf-sk" style={{ height: 17, width: "70%", marginBottom: 8 }} />
      <div className="lf-sk" style={{ height: 13, width: "55%", marginBottom: 16 }} />
      <div className="lf-sk" style={{ height: 13, width: "40%" }} />
    </div>
  );
}

/* ─── Single post card ────────────────────────────────────────────── */
/*
  📖 LEARNING NOTE — Props
  --------------------------
  Props are how we pass data from a parent component (LostFoundPage) into
  a child component (ItemCard). They're read-only inside the child.
  Here: item = the post data, userId = current user's id, onClaim/onResolve/onDelete = callbacks
*/
function ItemCard({ item, userId, onClaim, onResolve, onDelete, index }) {
  const cat      = CATS[item.category] || CATS.other;
  const isLost   = item.type === "lost";
  const isOwner  = item.postedBy?._id === userId || item.postedBy === userId;
  const isClaimed = !!item.claimedBy;
  const isResolved = item.status === "resolved";

  return (
    <div
      className="lf-card lf-animate"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* Top accent strip — blue for lost, green for found */}
      <div style={{
        height: 3,
        background: isLost
          ? "linear-gradient(90deg, #3D52A0, #6B7FD4)"
          : "linear-gradient(90deg, #16A34A, #4ADE80)",
      }} />

      <div style={{ padding: "16px 18px 14px" }}>

        {/* ── Badge row ── */}
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 10 }}>
          {/* LOST / FOUND badge */}
          <span style={{
            padding: "3px 10px", borderRadius: 100,
            fontSize: ".68rem", fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase",
            background: isLost ? "#EEF2FF" : T.greenL,
            color:      isLost ? T.ink2    : T.green,
            border:     `1px solid ${isLost ? "#C7D2FE" : "#BBF7D0"}`,
          }}>
            {isLost ? "Lost" : "Found"}
          </span>

          {/* Category badge */}
          <span style={{
            padding: "3px 10px", borderRadius: 100,
            fontSize: ".68rem", fontWeight: 700,
            background: cat.bg, color: cat.color, border: `1px solid ${cat.border}`,
          }}>
            {cat.label}
          </span>

          {/* Resolved badge */}
          {isResolved && (
            <span style={{
              padding: "3px 10px", borderRadius: 100,
              fontSize: ".68rem", fontWeight: 700,
              background: T.greenL, color: T.green, border: "1px solid #BBF7D0",
            }}>
              ✓ Resolved
            </span>
          )}
        </div>

        {/* ── Title ── */}
        <p style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: "1rem", fontWeight: 700, color: T.ink,
          margin: "0 0 5px", lineHeight: 1.35,
        }}>
          {item.title}
        </p>

        {/* ── Description ── */}
        <p style={{ fontSize: ".83rem", color: T.text2, margin: "0 0 10px", lineHeight: 1.6 }}>
          {item.description}
        </p>

        {/* ── Meta row: location + date ── */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
          {item.location && (
            <span style={{ fontSize: ".75rem", color: T.text3 }}>
              📍 {item.location}
            </span>
          )}
          <span style={{ fontSize: ".75rem", color: T.text3 }}>
            🗓 {fmtDate(item.date)}
          </span>
        </div>

        {/* ── Photo (if any) ── */}
        {item.photo && (
          <img
            src={item.photo}
            alt="Item"
            style={{
              width: "100%", maxHeight: 180, objectFit: "cover",
              borderRadius: 10, marginBottom: 12,
              border: `1px solid ${T.border}`,
            }}
          />
        )}

        {/* ── Footer: poster + actions ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 10, flexWrap: "wrap",
          paddingTop: 10, borderTop: `1px solid ${T.border}`,
        }}>

          {/* Who posted + when */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Avatar circle with initials */}
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "linear-gradient(135deg, #24324A, #5B6577)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: ".62rem", fontWeight: 800, color: "#fff", flexShrink: 0,
            }}>
              {(item.postedBy?.fullName || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p style={{ fontSize: ".75rem", fontWeight: 600, color: T.ink, margin: 0 }}>
                {item.postedBy?.fullName || "Unknown"}
              </p>
              <p style={{ fontSize: ".68rem", color: T.text3, margin: 0 }}>
                {timeAgo(item.createdAt)}
              </p>
            </div>
          </div>

          {/* Action buttons — only shown when post is active */}
          {!isResolved && (
            <div style={{ display: "flex", gap: 7 }}>

              {/* Claim — visible to everyone EXCEPT the poster */}
              {!isOwner && !isClaimed && (
                <button
                  className="lf-action-btn"
                  onClick={() => onClaim(item._id)}
                  style={{
                    background: isLost ? "#EEF2FF" : T.greenL,
                    color: isLost ? T.ink2 : T.green,
                    borderColor: isLost ? "#C7D2FE" : "#BBF7D0",
                  }}
                >
                  <HandHelping size={13} />
                  {isLost ? "I Found This" : "This is Mine"}
                </button>
              )}

              {/* Claimed notice */}
              {isClaimed && !isOwner && (
                <span style={{ fontSize: ".73rem", color: T.text3, fontStyle: "italic" }}>
                  Claimed by {item.claimedBy?.fullName || "someone"}
                </span>
              )}

              {/* Resolve — only the poster sees this */}
              {isOwner && (
                <button
                  className="lf-action-btn"
                  onClick={() => onResolve(item._id)}
                  style={{
                    background: T.greenL, color: T.green, borderColor: "#BBF7D0",
                  }}
                >
                  <CheckCircle size={13} />
                  Mark Resolved
                </button>
              )}

              {/* Delete — only the poster sees this */}
              {isOwner && (
                <button
                  className="lf-action-btn"
                  onClick={() => onDelete(item._id)}
                  style={{ background: T.redL, color: T.red, borderColor: "#FECACA" }}
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
══════════════════════════════════════════════════════════════ */
/*
  📖 LEARNING NOTE — Component structure
  ----------------------------------------
  This is the top-level component for the Lost & Found page.
  It owns ALL the state (items, filters, form data, loading flags).
  It passes data DOWN to child components (ItemCard) via props.
  It defines handler functions (handleClaim, handleResolve, etc.)
  that it also passes down so children can trigger actions.

  This pattern is called "lifting state up" — keep state at the
  highest component that needs it, pass it down to children.
*/
export function LostFoundPage() {
  const { token, user } = useAuth();
  const userId = user?._id || user?.id || "";

  /* ── State ────────────────────────────────────────────────── */
  /*
    📖 LEARNING NOTE — useState
    -----------------------------
    useState(initialValue) returns [currentValue, setterFunction].
    Calling the setter re-renders the component with the new value.

    items     → the array of posts fetched from the API
    loading   → true while the API call is in-flight
    error     → stores error message if API call fails
    filter    → which type filter chip is active: "all" | "lost" | "found"
    catFilter → which category chip is active: "all" | "keys" | "phone" ...
    search    → what the user has typed in the search box
    showForm  → whether the "Post Item" form is visible
  */
  const [items,     setItems]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [filter,    setFilter]    = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [search,    setSearch]    = useState("");
  const [showForm,  setShowForm]  = useState(false);

  /* ── Form state ── */
  /*
    📖 LEARNING NOTE — Controlled inputs
    ----------------------------------------
    In React, form inputs are "controlled" — their value is always
    driven by a state variable. When the user types, onChange fires,
    which calls the setter, which updates the state, which re-renders
    the input with the new value. This gives you full control over the form.
  */
  const [form, setForm] = useState({
    type: "lost",
    category: "other",
    title: "",
    description: "",
    location: "",
    date: new Date().toISOString().split("T")[0],
    photo: "",
  });
  const [submitting, setSubmitting] = useState(false);

  /* ── Fetch all posts ─────────────────────────────────────── */
  /*
    📖 LEARNING NOTE — useCallback + useEffect
    --------------------------------------------
    useCallback(fn, [deps]) memoizes the function — it only creates a new
    reference when the dependencies change. We use this so useEffect
    doesn't run in an infinite loop.

    useEffect(fn, [deps]) runs fn after the component renders.
    The dependency array [load] means: re-run if `load` changes.
    With useCallback, `load` only changes when `token` changes.
  */
  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      /*
        📖 LEARNING NOTE — apiRequest
        --------------------------------
        apiRequest is a helper in components/api.js that:
          1. Adds the Authorization: Bearer <token> header automatically
          2. Reads the tenant subdomain from the URL and adds x-tenant-id header
          3. Parses the JSON response and returns it
          4. Throws an error if the server responds with a non-2xx status
      */
      const data = await apiRequest("/lost-found", { token });
      setItems(data.items || []);
    } catch (err) {
      setError(err.message || "Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  /* ── Filtered + searched list ────────────────────────────── */
  /*
    📖 LEARNING NOTE — Derived state with filter logic
    ----------------------------------------------------
    We don't store a separate "filtered items" state — we compute it
    on every render from the raw items array + current filter values.
    This is simpler and always stays in sync.

    .filter() returns a new array containing only items where the
    callback function returns true.

    .toLowerCase().includes() → case-insensitive substring search
  */
  const visible = items.filter(item => {
    if (filter    !== "all" && item.type     !== filter)    return false;
    if (catFilter !== "all" && item.category !== catFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matches =
        item.title?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.location?.toLowerCase().includes(q);
      if (!matches) return false;
    }
    return true;
  });

  /* ── Handlers ────────────────────────────────────────────── */

  // Update a single form field (generic handler used by all inputs)
  function handleFormChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    /*
      📖 LEARNING NOTE — computed property names
      ---------------------------------------------
      { ...prev, [e.target.name]: e.target.value }
        - ...prev → spread all existing form fields
        - [e.target.name] → the bracket syntax turns a variable into a key name.
          If the input has name="title", this becomes { title: "new value" }
      This lets one handler update ANY field without writing separate handlers.
    */
  }

  async function handleSubmit(e) {
    e.preventDefault(); // prevent the browser from reloading the page
    if (!form.title.trim() || !form.description.trim()) return;

    setSubmitting(true);
    try {
      const data = await apiRequest("/lost-found", {
        token,
        method: "POST",
        body: form,
        /*
          📖 LEARNING NOTE — apiRequest with method + body
          --------------------------------------------------
          When method is "POST", apiRequest sends the body as JSON.
          The server reads it from req.body inside the controller.
        */
      });
      // Prepend the new post to the top of the list (no full reload needed)
      setItems(prev => [data.item, ...prev]);
      setShowForm(false);
      setForm({ type: "lost", category: "other", title: "", description: "", location: "", date: new Date().toISOString().split("T")[0], photo: "" });
    } catch (err) {
      setError(err.message || "Failed to post item");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleClaim(id) {
    try {
      const data = await apiRequest(`/lost-found/${id}/claim`, { token, method: "PATCH" });
      // Update just this one item in the array (optimistic UI without full reload)
      setItems(prev => prev.map(i => i._id === id ? data.item : i));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleResolve(id) {
    if (!window.confirm("Mark this item as resolved (reunited)?")) return;
    try {
      const data = await apiRequest(`/lost-found/${id}/resolve`, { token, method: "PATCH" });
      setItems(prev => prev.map(i => i._id === id ? data.item : i));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this post permanently?")) return;
    try {
      await apiRequest(`/lost-found/${id}`, { token, method: "DELETE" });
      // Remove the deleted item from state
      setItems(prev => prev.filter(i => i._id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <>
      <style>{CSS}</style>

      <div className="lf-root">

        {/* ── Page header ── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
          <div>
            <p style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: T.ink2, marginBottom: 4 }}>
              Community Board
            </p>
            <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "clamp(1.4rem,3vw,1.9rem)", fontWeight: 800, color: T.ink, margin: 0, letterSpacing: "-0.5px" }}>
              Lost &amp; Found
            </h1>
            <p style={{ fontSize: ".85rem", color: T.text2, marginTop: 5 }}>
              Post lost items or report what you've found in the society
            </p>
          </div>

          {/* Post button */}
          <button className="lf-btn-primary" onClick={() => setShowForm(v => !v)}>
            {showForm ? <><X size={15}/> Cancel</> : <><Plus size={15}/> Post Item</>}
          </button>
        </div>

        {/* ── Error banner ── */}
        {error && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10, marginBottom: 16,
            background: T.redL, border: `1px solid rgba(220,38,38,.25)`,
            borderRadius: 12, padding: "12px 16px",
            fontSize: ".85rem", color: T.red,
          }}>
            {error}
            <button onClick={() => setError("")} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: T.red }}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* ── Post form (collapsible) ── */}
        {/*
          📖 LEARNING NOTE — Conditional rendering
          ------------------------------------------
          {showForm && <div>...</div>}
          The && operator means: if showForm is true, render the div.
          If false, render nothing. This is the most common way to
          show/hide UI in React.
        */}
        {showForm && (
          <div className="lf-card" style={{ marginBottom: 24, overflow: "hidden" }}>
            {/* Accent bar */}
            <div style={{ height: 3, background: `linear-gradient(90deg, ${T.ink}, #334155)` }} />
            <form onSubmit={handleSubmit} style={{ padding: "20px 22px" }}>
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: ".95rem", fontWeight: 700, color: T.ink, marginBottom: 18 }}>
                New Post
              </p>

              {/* Type + Category row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: ".75rem", fontWeight: 600, color: T.text2, display: "block", marginBottom: 6 }}>Type *</label>
                  <select name="type" value={form.type} onChange={handleFormChange} className="lf-input" style={{ appearance: "none" }}>
                    <option value="lost">Lost — I'm looking for this</option>
                    <option value="found">Found — I found this</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: ".75rem", fontWeight: 600, color: T.text2, display: "block", marginBottom: 6 }}>Category *</label>
                  <select name="category" value={form.category} onChange={handleFormChange} className="lf-input" style={{ appearance: "none" }}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{CATS[c].label}</option>)}
                  </select>
                </div>
              </div>

              {/* Title */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: ".75rem", fontWeight: 600, color: T.text2, display: "block", marginBottom: 6 }}>Title *</label>
                <input
                  name="title" value={form.title} onChange={handleFormChange}
                  className="lf-input" placeholder="e.g. Lost blue umbrella near gym"
                  required
                />
              </div>

              {/* Description */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: ".75rem", fontWeight: 600, color: T.text2, display: "block", marginBottom: 6 }}>Description *</label>
                <textarea
                  name="description" value={form.description} onChange={handleFormChange}
                  className="lf-input" rows={3}
                  placeholder="Describe the item — colour, brand, distinguishing features…"
                  required
                  style={{ resize: "vertical", minHeight: 80 }}
                />
              </div>

              {/* Location + Date row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: ".75rem", fontWeight: 600, color: T.text2, display: "block", marginBottom: 6 }}>Location</label>
                  <input name="location" value={form.location} onChange={handleFormChange} className="lf-input" placeholder="Near Gate B, Parking Lot…" />
                </div>
                <div>
                  <label style={{ fontSize: ".75rem", fontWeight: 600, color: T.text2, display: "block", marginBottom: 6 }}>Date *</label>
                  <input name="date" type="date" value={form.date} onChange={handleFormChange} className="lf-input" required />
                </div>
              </div>

              {/* Photo URL (optional) */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: ".75rem", fontWeight: 600, color: T.text2, display: "block", marginBottom: 6 }}>Photo URL (optional)</label>
                <input name="photo" value={form.photo} onChange={handleFormChange} className="lf-input" placeholder="Paste an image link if you have one" />
              </div>

              {/* Submit */}
              <div style={{ display: "flex", gap: 10 }}>
                <button className="lf-btn-primary" type="submit" disabled={submitting}>
                  {submitting ? "Posting…" : "Post Item"}
                </button>
                <button type="button" className="lf-btn-ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Filter bar ── */}
        <div style={{
          position: "sticky", top: 64, zIndex: 10,
          background: "rgba(255,252,246,0.92)", backdropFilter: "blur(12px)",
          borderBottom: `1px solid ${T.border}`,
          marginLeft: -28, marginRight: -28, padding: "12px 28px",
          marginBottom: 20,
          display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
        }}>
          {/* Type filters */}
          {["all", "lost", "found"].map(f => (
            <button key={f} className={`lf-chip${filter === f ? " active" : ""}`} onClick={() => setFilter(f)}>
              {f === "all" ? "All" : f === "lost" ? "Lost" : "Found"}
            </button>
          ))}

          <div style={{ width: 1, height: 20, background: T.border, flexShrink: 0, margin: "0 4px" }} />

          {/* Category filters */}
          {CATEGORIES.map(c => (
            <button key={c} className={`lf-chip${catFilter === c ? " active" : ""}`} onClick={() => setCatFilter(catFilter === c ? "all" : c)}>
              {CATS[c].label}
            </button>
          ))}

          {/* Search box — pushed to the right */}
          <div style={{ marginLeft: "auto", position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: T.text3, pointerEvents: "none" }} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              className="lf-input"
              style={{ paddingLeft: 32, width: 200 }}
              placeholder="Search posts…"
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: T.text3 }}>
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* ── Post grid ── */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : visible.length === 0 ? (
          /* Empty state */
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: T.subtle2, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <PackageSearch size={28} style={{ color: T.text3 }} />
            </div>
            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "1.05rem", fontWeight: 700, color: T.ink, margin: "0 0 6px" }}>
              {search || filter !== "all" || catFilter !== "all" ? "No posts match your filters" : "Nothing posted yet"}
            </p>
            <p style={{ fontSize: ".85rem", color: T.text2, margin: "0 0 20px" }}>
              {search || filter !== "all" || catFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Be the first to post a lost or found item!"}
            </p>
            {!showForm && (
              <button className="lf-btn-primary" onClick={() => setShowForm(true)}>
                <Plus size={14} /> Post Item
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
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
          </div>
        )}
      </div>
    </>
  );
}
