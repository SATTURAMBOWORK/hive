import { useState } from "react";
import { tok, fonts, card, btn } from "../lib/tokens";

function PhotoCarousel({ photos }) {
  const [idx, setIdx] = useState(0);

  if (!photos || photos.length === 0) {
    return (
      <div style={{
        height: 180, display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", background: tok.stone100, gap: 8,
      }}>
        <span style={{ fontSize: 32 }}>🖼</span>
        <span style={{ fontSize: 12, color: tok.stone400 }}>No photos</span>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", height: 180, overflow: "hidden", background: tok.stone100 }}>
      <img
        src={photos[idx]}
        alt={`Photo ${idx + 1}`}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
      {photos.length > 1 && (
        <>
          <button
            onClick={() => setIdx(i => (i - 1 + photos.length) % photos.length)}
            style={{
              position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)",
              width: 28, height: 28, borderRadius: "50%", border: "none", cursor: "pointer",
              background: "rgba(0,0,0,0.45)", color: "#fff", fontSize: 14,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >‹</button>
          <button
            onClick={() => setIdx(i => (i + 1) % photos.length)}
            style={{
              position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
              width: 28, height: 28, borderRadius: "50%", border: "none", cursor: "pointer",
              background: "rgba(0,0,0,0.45)", color: "#fff", fontSize: 14,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >›</button>
          <div style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 4 }}>
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                style={{
                  height: 5, width: i === idx ? 16 : 5, borderRadius: 3,
                  background: i === idx ? "#fff" : "rgba(255,255,255,0.5)",
                  border: "none", cursor: "pointer", padding: 0, transition: "all .2s",
                }}
              />
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
      <div style={{ ...card, textAlign: "center", padding: 48 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🏊</div>
        <p style={{ fontSize: 14, color: tok.stone400 }}>No amenities configured yet.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
      {amenities.map(amenity => (
        <article
          key={amenity._id}
          style={{
            ...card,
            padding: 0,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <PhotoCarousel photos={amenity.photos} />

          <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 18 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: tok.stone800, margin: "0 0 6px", fontFamily: fonts.sans }}>
              {amenity.name}
            </h3>
            {amenity.description && (
              <p style={{ fontSize: 13, color: tok.stone600, lineHeight: 1.5, margin: "0 0 10px",
                overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                {amenity.description}
              </p>
            )}

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14, marginTop: "auto" }}>
              <span style={{
                padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 600,
                background: tok.stone100, color: tok.stone600, border: `1px solid ${tok.stone200}`,
              }}>
                👥 Cap. {amenity.capacity}
              </span>
              {amenity.isAutoApprove && (
                <span style={{
                  padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 600,
                  background: tok.emeraldLight, color: tok.emerald, border: `1px solid ${tok.emeraldBorder}`,
                }}>
                  ⚡ Instant
                </span>
              )}
            </div>

            <button style={{ ...btn.primary, width: "100%" }} onClick={() => onBook(amenity)}>
              Book Now
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
