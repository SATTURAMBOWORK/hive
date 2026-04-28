import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, ChevronLeft, ChevronRight, BookOpen, Pencil } from "lucide-react";

const C = {
  surface:  "#FFFFFF",
  bg:       "#FAFAFC",
  ink:      "#1C1C1E",
  ink2:     "#3A3A3C",
  muted:    "#6B7280",
  faint:    "#9CA3AF",
  border:   "#E8E8ED",
  borderL:  "#F0F0F5",
  indigo:   "#4F46E5",
  indigoD:  "#4338CA",
  indigoL:  "#EEF2FF",
  indigoBr: "#C7D2FE",
  orange:   "#E8890C",
  orangeL:  "#FFF8F0",
};

const SPRING = { type: "spring", stiffness: 300, damping: 28, mass: 0.82 };

const DAY_LABELS = {
  monday: "Mon", tuesday: "Tue", wednesday: "Wed",
  thursday: "Thu", friday: "Fri", saturday: "Sat", sunday: "Sun",
};
const DAY_ORDER = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];

const PLACEHOLDERS = [
  "linear-gradient(135deg, #EEF2FF 0%, #C7D2FE 100%)",
  "linear-gradient(135deg, #F0FDF4 0%, #BBF7D0 100%)",
  "linear-gradient(135deg, #FFF7ED 0%, #FED7AA 100%)",
  "linear-gradient(135deg, #FDF2F8 0%, #F5D0FE 100%)",
  "linear-gradient(135deg, #F0F9FF 0%, #BAE6FD 100%)",
];
const PLACEHOLDER_EMOJIS = ["🏊","🎾","🏋️","🧘","⛳","🎱","🏸","🎯"];
function getPlaceholder(id) {
  const h = [...(id || "x")].reduce((a, c) => a + c.charCodeAt(0), 0);
  return { bg: PLACEHOLDERS[h % PLACEHOLDERS.length], emoji: PLACEHOLDER_EMOJIS[h % PLACEHOLDER_EMOJIS.length] };
}

/* Condense operating hours: group consecutive days with same hours */
function groupHours(operatingHours) {
  if (!operatingHours) return [];
  const rows = DAY_ORDER.map(d => ({ day: d, ...operatingHours[d] })).filter(r => r.open && r.close);
  const groups = [];
  for (const row of rows) {
    const last = groups[groups.length - 1];
    if (last && last.open === row.open && last.close === row.close) {
      last.to = row.day;
    } else {
      groups.push({ from: row.day, to: row.day, open: row.open, close: row.close });
    }
  }
  return groups.map(g => ({
    label: g.from === g.to ? DAY_LABELS[g.from] : `${DAY_LABELS[g.from]}–${DAY_LABELS[g.to]}`,
    hours: `${g.open} – ${g.close}`,
  }));
}

/* ─── Photo carousel ─────────────────────────────────────────── */
function PhotoCarousel({ photos, placeholderBg, placeholderEmoji }) {
  const [idx, setIdx] = useState(0);
  const total = photos?.length || 0;

  if (total === 0) {
    return (
      <div style={{ height: 260, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: placeholderBg, fontSize: 52 }}>
        {placeholderEmoji}
      </div>
    );
  }

  return (
    <div style={{ position: "relative", height: 260, background: "#000", overflow: "hidden" }}>
      <AnimatePresence initial={false} mode="wait">
        <motion.img
          key={idx}
          src={photos[idx]}
          alt={`Photo ${idx + 1}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </AnimatePresence>

      {total > 1 && (
        <>
          <button
            onClick={e => { e.stopPropagation(); setIdx(i => (i - 1 + total) % total); }}
            style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 32, height: 32, borderRadius: "50%", border: "none", cursor: "pointer", background: "rgba(0,0,0,0.45)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); setIdx(i => (i + 1) % total); }}
            style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 32, height: 32, borderRadius: "50%", border: "none", cursor: "pointer", background: "rgba(0,0,0,0.45)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }}
          >
            <ChevronRight size={16} />
          </button>
          <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 5 }}>
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={e => { e.stopPropagation(); setIdx(i); }}
                style={{ width: i === idx ? 18 : 6, height: 6, borderRadius: 3, border: "none", cursor: "pointer", padding: 0, background: i === idx ? "#fff" : "rgba(255,255,255,0.45)", transition: "all 0.2s" }}
              />
            ))}
          </div>
        </>
      )}

      {/* Photo counter */}
      {total > 1 && (
        <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.5)", color: "#fff", fontSize: "0.7rem", fontWeight: 700, padding: "3px 8px", borderRadius: 99, backdropFilter: "blur(4px)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {idx + 1} / {total}
        </div>
      )}
    </div>
  );
}

/* ─── AmenityDetailModal ─────────────────────────────────────── */
export function AmenityDetailModal({ amenity, canManage, onClose, onBook, onEdit }) {
  const ph = getPlaceholder(amenity?._id);
  const hoursGroups = groupHours(amenity?.operatingHours);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = e => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; document.removeEventListener("keydown", onKey); };
  }, [onClose]);

  if (!amenity) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
        background: "rgba(28,28,30,0.28)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      <motion.div
        layoutId={`amenity-${amenity._id}`}
        transition={SPRING}
        onClick={e => e.stopPropagation()}
        style={{
          width: "min(540px, 100%)",
          maxHeight: "calc(100vh - 40px)",
          overflowY: "auto",
          borderRadius: 24,
          background: C.surface,
          border: `1px solid ${C.border}`,
          boxShadow: "0 32px 80px rgba(28,28,30,0.2)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Photo carousel */}
        <div style={{ flexShrink: 0, position: "relative" }}>
          <PhotoCarousel photos={amenity.photos} placeholderBg={ph.bg} placeholderEmoji={ph.emoji} />
          {/* Close button overlaid */}
          <button
            onClick={onClose}
            style={{
              position: "absolute", top: 12, right: 12,
              width: 34, height: 34, borderRadius: "50%",
              border: "none", cursor: "pointer",
              background: "rgba(0,0,0,0.45)", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              backdropFilter: "blur(6px)",
            }}
            aria-label="Close"
          >
            <X size={15} strokeWidth={2.4} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 22px", overflowY: "auto", flex: 1 }}>

          {/* Title row */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 14 }}>
            <motion.h2
              layoutId={`amenity-title-${amenity._id}`}
              style={{ margin: 0, fontSize: "1.35rem", fontWeight: 800, color: C.ink, letterSpacing: "-0.03em", lineHeight: 1.2 }}
            >
              {amenity.name}
            </motion.h2>
            <motion.div layoutId={`amenity-meta-${amenity._id}`} style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap" }}>
              {amenity.isAutoApprove && (
                <span style={{ padding: "4px 10px", borderRadius: 99, fontSize: "0.68rem", fontWeight: 700, background: C.orangeL, color: C.orange, border: "1px solid rgba(232,137,12,0.25)" }}>
                  ⚡ Instant
                </span>
              )}
            </motion.div>
          </div>

          {/* Description */}
          {amenity.description && (
            <p style={{ margin: "0 0 18px", fontSize: "0.88rem", fontWeight: 500, color: C.ink2, lineHeight: 1.7 }}>
              {amenity.description}
            </p>
          )}

          {/* Operating hours */}
          {hoursGroups.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ margin: "0 0 8px", fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: C.faint }}>
                Operating Hours
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {hoursGroups.map((g, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: 10, background: C.bg, border: `1px solid ${C.borderL}` }}>
                    <span style={{ fontSize: "0.78rem", fontWeight: 700, color: C.ink2, display: "flex", alignItems: "center", gap: 6 }}>
                      <Clock size={12} color={C.muted} />
                      {g.label}
                    </span>
                    <span style={{ fontSize: "0.78rem", fontWeight: 600, color: C.muted }}>{g.hours}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => onBook(amenity)}
              style={{
                flex: 1, padding: "12px 0", borderRadius: 13,
                border: "none", background: C.indigo, color: "#fff",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: "0.88rem", fontWeight: 800,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                boxShadow: "0 6px 18px rgba(79,70,229,0.3)",
              }}
            >
              <BookOpen size={15} /> Book Space
            </button>
            {canManage && (
              <button
                onClick={() => onEdit(amenity)}
                style={{
                  padding: "12px 18px", borderRadius: 13,
                  border: `1px solid ${C.border}`, background: C.bg, color: C.ink2,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: "0.88rem", fontWeight: 800,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 7,
                  transition: "border-color 0.18s",
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = C.ink2}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
              >
                <Pencil size={14} /> Edit
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
