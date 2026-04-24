import { useState } from "react";
import { motion } from "framer-motion";

const T = {
  surface: "#FFFFFF",
  border: "#E8E8ED",
  borderHov: "#D1D5DB",
  text: "#1C1C1E",
  textSub: "#6B7280",
  textMuted: "#9CA3AF",
  indigo: "#4F46E5",
  green: "#16A34A",
};

const CSS = `
  .ag-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 16px;
  }

  .ag-card {
    border-radius: 18px;
    border: 1px solid ${T.border};
    background: ${T.surface};
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transition: border-color 0.25s, box-shadow 0.25s, transform 0.25s;
    box-shadow: 0 1px 2px rgba(0,0,0,0.04);
  }

  .ag-card:hover {
    border-color: ${T.borderHov};
    box-shadow: 0 10px 24px rgba(28,28,30,0.1);
    transform: translateY(-2px);
  }

  .ag-title {
    font-size: 15px;
    font-weight: 700;
    color: ${T.text};
    margin: 0 0 6px;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }

  .ag-desc {
    font-size: 13px;
    color: ${T.textSub};
    line-height: 1.5;
    margin: 0 0 12px;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .ag-chip {
    padding: 3px 10px;
    border-radius: 100px;
    font-size: 11px;
    font-weight: 600;
    border: 1px solid ${T.border};
    color: ${T.textSub};
    background: #F9FAFB;
  }

  .ag-chip-success {
    border-color: rgba(22,163,74,0.22);
    color: ${T.green};
    background: rgba(22,163,74,0.08);
  }

  .ag-book-btn {
    width: 100%;
    border-radius: 11px;
    background: ${T.surface};
    border: 1px solid ${T.border};
    padding: 10px 0;
    font-size: 0.8rem;
    font-weight: 700;
    color: ${T.text};
    font-family: 'Plus Jakarta Sans', sans-serif;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: border-color 0.2s, color 0.2s, transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }

  .ag-book-btn::after {
    content: '';
    position: absolute;
    left: 10px;
    right: 10px;
    bottom: 0;
    height: 2px;
    border-radius: 999px;
    background: ${T.indigo};
    transform: scaleX(0.2);
    opacity: 0;
    transition: transform 0.2s ease, opacity 0.2s ease;
  }

  .ag-book-btn:hover {
    border-color: #C7C7CC;
    box-shadow: 0 7px 16px rgba(28,28,30,0.1);
    transform: translateY(-1px);
  }

  .ag-book-btn:hover::after {
    transform: scaleX(1);
    opacity: 1;
  }

  .ag-book-btn:active {
    transform: scale(0.97);
  }

  .ag-book-btn-label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .ag-book-btn-arrow {
    transition: transform 0.18s ease;
  }

  .ag-book-btn:hover .ag-book-btn-arrow {
    transform: translateX(2px);
  }
`;

function PhotoCarousel({ photos }) {
  const [idx, setIdx] = useState(0);

  if (!photos || photos.length === 0) {
    return (
      <div style={{ height: 180, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#EEF2FF", gap: 8, borderBottom: `1px solid ${T.border}` }}>
        <span style={{ fontSize: 32 }}>🖼</span>
        <span style={{ fontSize: 12, color: T.textMuted }}>No photos</span>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", height: 180, overflow: "hidden", borderBottom: `1px solid ${T.border}` }}>
      <img src={photos[idx]} alt={`Photo ${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      {/* Gradient overlay */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(36,50,74,0.22) 0%, transparent 50%)" }} />

      {photos.length > 1 && (
        <>
          <button onClick={() => setIdx(i => (i - 1 + photos.length) % photos.length)}
            style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 28, height: 28, borderRadius: "50%", border: "none", cursor: "pointer", background: "rgba(36,50,74,0.62)", color: "#fff", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", transition: "background 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(232,137,12,0.85)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(36,50,74,0.62)"}>‹</button>
          <button onClick={() => setIdx(i => (i + 1) % photos.length)}
            style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", width: 28, height: 28, borderRadius: "50%", border: "none", cursor: "pointer", background: "rgba(36,50,74,0.62)", color: "#fff", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", transition: "background 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(232,137,12,0.85)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(36,50,74,0.62)"}>›</button>
          <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 4 }}>
            {photos.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)}
                style={{ height: 5, width: i === idx ? 16 : 5, borderRadius: 3, background: i === idx ? T.indigo : "rgba(255,255,255,0.55)", border: "none", cursor: "pointer", padding: 0, transition: "all 0.2s" }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function AmenityGrid({ amenities, onBook }) {
  if (!amenities.length) {
    return (
      <div style={{ borderRadius: 18, border: `2px dashed ${T.border}`, padding: 48, textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🏊</div>
        <p style={{ fontSize: 14, color: T.textMuted }}>No amenities configured yet.</p>
      </div>
    );
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="ag-grid">
        {amenities.map((amenity) => (
          <motion.article
            key={amenity._id}
            layoutId={`amenity-${amenity._id}`}
            className="ag-card"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.99 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
          >
            <PhotoCarousel photos={amenity.photos} />

            <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 18 }}>
              <motion.h3 layoutId={`amenity-title-${amenity._id}`} className="ag-title">
                {amenity.name}
              </motion.h3>
              {amenity.description && (
                <p className="ag-desc">
                  {amenity.description}
                </p>
              )}

              <motion.div layoutId={`amenity-meta-${amenity._id}`} style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14, marginTop: "auto" }}>
                <span className="ag-chip">
                  👥 Cap. {amenity.capacity}
                </span>
                {amenity.isAutoApprove && (
                  <span className="ag-chip ag-chip-success">
                    ⚡ Instant
                  </span>
                )}
              </motion.div>

              <button className="ag-book-btn" onClick={() => onBook(amenity)}>
                <span className="ag-book-btn-label">
                  Book Now
                  <span className="ag-book-btn-arrow">→</span>
                </span>
              </button>
            </div>
          </motion.article>
        ))}
      </div>
    </>
  );
}
