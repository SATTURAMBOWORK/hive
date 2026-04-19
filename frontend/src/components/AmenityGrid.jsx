import { useState } from "react";

const T = {
  surface:   "#FFFFFF",
  border:    "#E7DDC8",
  borderHov: "#D8CDAE",
  gold:      "#3D52A0",
  goldLight: "#2F3F7A",
  text:      "#24324A",
  textSub:   "#5B6577",
  textMuted: "#8B95A8",
  green:     "#3d9e6e",
};

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
            onMouseEnter={e => e.currentTarget.style.background = `rgba(61,82,160,0.8)`}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(36,50,74,0.62)"}>‹</button>
          <button onClick={() => setIdx(i => (i + 1) % photos.length)}
            style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", width: 28, height: 28, borderRadius: "50%", border: "none", cursor: "pointer", background: "rgba(36,50,74,0.62)", color: "#fff", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", transition: "background 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.background = `rgba(61,82,160,0.8)`}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(36,50,74,0.62)"}>›</button>
          <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 4 }}>
            {photos.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)}
                style={{ height: 5, width: i === idx ? 16 : 5, borderRadius: 3, background: i === idx ? T.gold : "rgba(255,255,255,0.55)", border: "none", cursor: "pointer", padding: 0, transition: "all 0.2s" }} />
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
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
      {amenities.map(amenity => {
        const [hovered, setHovered] = useState(false);
        return (
          <article key={amenity._id}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{ borderRadius: 18, border: `1px solid ${hovered ? T.borderHov : T.border}`, background: T.surface, overflow: "hidden", display: "flex", flexDirection: "column", transition: "border-color 0.25s, box-shadow 0.25s, transform 0.25s", boxShadow: hovered ? `0 8px 32px rgba(36,50,74,0.14)` : "none", transform: hovered ? "translateY(-2px)" : "translateY(0)" }}>
            <PhotoCarousel photos={amenity.photos} />

            <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 18 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: "0 0 6px", fontFamily: "'DM Sans', sans-serif" }}>
                {amenity.name}
              </h3>
              {amenity.description && (
                <p style={{ fontSize: 13, color: T.textSub, lineHeight: 1.5, margin: "0 0 12px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                  {amenity.description}
                </p>
              )}

              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14, marginTop: "auto" }}>
                <span style={{ padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 600, background: `${T.gold}18`, color: T.textSub, border: `1px solid ${T.border}` }}>
                  👥 Cap. {amenity.capacity}
                </span>
                {amenity.isAutoApprove && (
                  <span style={{ padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 600, background: `${T.green}18`, color: T.green, border: `1px solid ${T.green}44` }}>
                    ⚡ Instant
                  </span>
                )}
              </div>

              <button onClick={() => onBook(amenity)}
                style={{ width: "100%", borderRadius: 12, background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`, padding: "10px 0", fontSize: 13, fontWeight: 700, color: "#ffffff", border: "none", cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                Book Now
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
