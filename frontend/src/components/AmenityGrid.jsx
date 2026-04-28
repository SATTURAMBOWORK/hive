import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Pencil } from "lucide-react";

const T = {
  surface:  "#FFFFFF",
  bg:       "#FAFAFC",
  border:   "#E8E8ED",
  borderHov:"#C7D2FE",
  ink:      "#1C1C1E",
  ink2:     "#3A3A3C",
  muted:    "#6B7280",
  faint:    "#9CA3AF",
  indigo:   "#4F46E5",
  indigoL:  "#EEF2FF",
  indigoBr: "#C7D2FE",
  green:    "#16A34A",
  orange:   "#E8890C",
};

const DAY_KEYS = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];

/* Gradient placeholders for amenities with no photos */
const PLACEHOLDERS = [
  "linear-gradient(135deg, #EEF2FF 0%, #C7D2FE 100%)",
  "linear-gradient(135deg, #F0FDF4 0%, #BBF7D0 100%)",
  "linear-gradient(135deg, #FFF7ED 0%, #FED7AA 100%)",
  "linear-gradient(135deg, #FDF2F8 0%, #F5D0FE 100%)",
  "linear-gradient(135deg, #F0F9FF 0%, #BAE6FD 100%)",
];

const PLACEHOLDER_EMOJIS = ["🏊", "🎾", "🏋️", "🧘", "⛳", "🎱", "🏸", "🎯"];

function getPlaceholder(id) {
  const h = [...(id || "x")].reduce((a, c) => a + c.charCodeAt(0), 0);
  return {
    bg:    PLACEHOLDERS[h % PLACEHOLDERS.length],
    emoji: PLACEHOLDER_EMOJIS[h % PLACEHOLDER_EMOJIS.length],
  };
}

function getTodayHours(operatingHours) {
  if (!operatingHours) return null;
  const dayKey = DAY_KEYS[new Date().getDay()];
  const h = operatingHours[dayKey];
  if (!h?.open || !h?.close) return null;
  return `${h.open} – ${h.close}`;
}

const CSS = `
  .ag-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 14px;
  }

  .ag-card {
    position: relative;
    border-radius: 18px;
    border: 1px solid ${T.border};
    background: ${T.surface};
    overflow: hidden;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    transition: box-shadow 0.25s, transform 0.25s, border-color 0.25s;
  }

  .ag-card:hover {
    box-shadow: 0 14px 32px rgba(28,28,30,0.11);
    transform: translateY(-4px);
    border-color: ${T.borderHov};
  }

  /* Image / placeholder area */
  .ag-cover {
    position: relative;
    height: 160px;
    overflow: hidden;
  }

  .ag-cover-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.4s ease;
  }

  .ag-card:hover .ag-cover-img {
    transform: scale(1.05);
  }

  .ag-cover-gradient {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(28,28,30,0.55) 0%, rgba(28,28,30,0) 55%);
  }

  /* Capacity chip pinned top-right */
  .ag-cap-chip {
    position: absolute;
    top: 10px;
    right: 10px;
    padding: 4px 9px;
    border-radius: 99px;
    font-size: 0.67rem;
    font-weight: 700;
    background: rgba(255,255,255,0.88);
    color: ${T.ink2};
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,0.5);
  }

  /* Admin edit button — top-left on image */
  .ag-edit-btn {
    position: absolute;
    top: 10px;
    left: 10px;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: none;
    cursor: pointer;
    background: rgba(255,255,255,0.88);
    color: ${T.ink2};
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,0.5);
    transition: background 0.18s, color 0.18s;
    z-index: 2;
  }

  .ag-edit-btn:hover {
    background: ${T.indigo};
    color: #FFFFFF;
  }

  /* Auto-approve badge top-left (shifts right when edit btn present) */
  .ag-auto-chip {
    position: absolute;
    top: 10px;
    left: 10px;
    padding: 4px 9px;
    border-radius: 99px;
    font-size: 0.67rem;
    font-weight: 700;
    background: rgba(255,247,237,0.92);
    color: ${T.orange};
    backdrop-filter: blur(8px);
    border: 1px solid rgba(232,137,12,0.25);
  }

  /* Card body (always visible) */
  .ag-body {
    padding: 13px 14px 14px;
  }

  .ag-name {
    font-size: 0.92rem;
    font-weight: 700;
    color: ${T.ink};
    margin: 0 0 4px;
    letter-spacing: -0.01em;
    font-family: 'Plus Jakarta Sans', sans-serif;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .ag-desc {
    font-size: 0.76rem;
    color: ${T.muted};
    margin: 0;
    line-height: 1.55;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    font-weight: 400;
  }

  /* Glassmorphic hover panel */
  .ag-hover-panel {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 14px;
    background: rgba(255,255,255,0.88);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-top: 1px solid rgba(232,232,237,0.8);
    transform: translateY(100%);
    transition: transform 0.3s cubic-bezier(0.34, 1.26, 0.64, 1);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .ag-card:hover .ag-hover-panel {
    transform: translateY(0);
  }

  .ag-hours-text {
    font-size: 0.72rem;
    font-weight: 700;
    color: ${T.ink2};
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .ag-hours-label {
    font-size: 0.6rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: ${T.faint};
  }

  .ag-book-btn {
    position: relative;
    overflow: hidden;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    background: ${T.surface};
    border: 1px solid ${T.border};
    border-radius: 10px;
    padding: 9px 14px;
    color: ${T.ink};
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    white-space: nowrap;
  }

  .ag-book-btn::after {
    content: '';
    position: absolute;
    left: 8px; right: 8px; bottom: 0;
    height: 2px; border-radius: 999px;
    background: ${T.indigo};
    transform: scaleX(0.2); opacity: 0;
    transition: transform 0.2s ease, opacity 0.2s ease;
  }

  .ag-book-btn:hover:not(:disabled) { border-color: #C7C7CC; transform: translateY(-1px); box-shadow: 0 6px 16px rgba(28,28,30,0.09); }
  .ag-book-btn:hover:not(:disabled)::after { transform: scaleX(1); opacity: 1; }
  .ag-book-btn:active:not(:disabled) { transform: scale(0.97); }
  .ag-book-btn:disabled { opacity: 0.45; cursor: not-allowed; }

  /* Skeleton */
  .ag-sk-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 14px;
  }

  .ag-sk-card {
    border-radius: 18px;
    border: 1px solid ${T.border};
    background: ${T.surface};
    overflow: hidden;
  }

  .ag-sk-shimmer {
    background: linear-gradient(90deg, #F0F0F7 25%, #E8E8F2 50%, #F0F0F7 75%);
    background-size: 200% 100%;
    animation: ag-shimmer 1.3s ease-in-out infinite;
  }

  @keyframes ag-shimmer {
    0%   { background-position: 200% center; }
    100% { background-position: -200% center; }
  }
`;

function AmenityCard({ amenity, onView, onBook, onEdit }) {
  const ph = getPlaceholder(amenity._id);
  const hasPhoto = amenity.photos?.length > 0;
  const todayHours = getTodayHours(amenity.operatingHours);

  return (
    <motion.article
      className="ag-card"
      layoutId={`amenity-${amenity._id}`}
      transition={{ type: "spring", stiffness: 300, damping: 28, mass: 0.82 }}
      onClick={() => onView(amenity)}
    >
      {/* Cover */}
      <div className="ag-cover">
        {hasPhoto ? (
          <img src={amenity.photos[0]} alt={amenity.name} className="ag-cover-img" />
        ) : (
          <div style={{ width: "100%", height: "100%", background: ph.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>
            {ph.emoji}
          </div>
        )}
        <div className="ag-cover-gradient" />
        {amenity.isAutoApprove && <span className="ag-auto-chip">⚡ Instant</span>}
        {/* Admin edit button */}
        {onEdit && (
          <button
            className="ag-edit-btn"
            onClick={e => { e.stopPropagation(); onEdit(amenity); }}
            aria-label="Edit amenity"
          >
            <Pencil size={12} />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="ag-body">
        <motion.h3 className="ag-name" layoutId={`amenity-title-${amenity._id}`}>
          {amenity.name}
        </motion.h3>
        {amenity.description && <p className="ag-desc">{amenity.description}</p>}
      </div>

      {/* Glassmorphic hover panel */}
      <div className="ag-hover-panel" onClick={e => e.stopPropagation()}>
        <motion.div layoutId={`amenity-meta-${amenity._id}`}>
          {todayHours ? (
            <div className="ag-hours-text">
              <span className="ag-hours-label">Today's hours</span>
              <span>{todayHours}</span>
            </div>
          ) : (
            <div className="ag-hours-text">
              <span className="ag-hours-label">Availability</span>
              <span>Check schedule</span>
            </div>
          )}
        </motion.div>
        <button className="ag-book-btn" onClick={e => { e.stopPropagation(); onBook(amenity); }}>
          <BookOpen size={13} /> Book Space
        </button>
      </div>
    </motion.article>
  );
}

function AmenitySkeletonCard() {
  return (
    <div className="ag-sk-card">
      <div className="ag-sk-shimmer" style={{ height: 160 }} />
      <div style={{ padding: 13 }}>
        <div className="ag-sk-shimmer" style={{ height: 16, width: "55%", borderRadius: 99, marginBottom: 8 }} />
        <div className="ag-sk-shimmer" style={{ height: 11, width: "85%", borderRadius: 99 }} />
      </div>
    </div>
  );
}

export function AmenityGrid({ amenities, onView, onBook, onEdit, isLoading = false }) {
  if (isLoading) {
    return (
      <>
        <style>{CSS}</style>
        <div className="ag-sk-grid" aria-busy="true">
          <AmenitySkeletonCard />
          <AmenitySkeletonCard />
          <AmenitySkeletonCard />
        </div>
      </>
    );
  }

  if (!amenities.length) {
    return (
      <>
        <style>{CSS}</style>
        <div style={{ borderRadius: 16, border: `2px dashed ${T.border}`, padding: 48, textAlign: "center" }}>
          <div style={{ fontSize: 38, marginBottom: 10 }}>🏊</div>
          <p style={{ fontSize: "0.84rem", color: T.faint, fontWeight: 600 }}>No amenities configured yet.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="ag-grid">
        {amenities.map(amenity => (
          <AmenityCard
            key={amenity._id}
            amenity={amenity}
            onView={onView}
            onBook={onBook}
            onEdit={onEdit}
          />
        ))}
      </div>
    </>
  );
}
