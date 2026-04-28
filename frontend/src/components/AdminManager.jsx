const C = {
  surface:  "#FFFFFF",
  bg:       "#FAFAFC",
  ink:      "#1C1C1E",
  ink2:     "#3A3A3C",
  muted:    "#6B7280",
  faint:    "#9CA3AF",
  border:   "#E8E8ED",
  borderL:  "#F0F0F5",
  green:    "#16A34A",
  greenL:   "#DCFCE7",
  greenBr:  "#BBF7D0",
  red:      "#DC2626",
  redL:     "#FEF2F2",
  redBr:    "#FECACA",
  amber:    "#F59E0B",
  amberD:   "#D97706",
  amberL:   "#FFFBEB",
  amberBr:  "#FCD34D",
};

const ACTION_CFG = {
  approved:  { bg: C.greenL, color: C.green,  border: C.greenBr },
  rejected:  { bg: C.redL,   color: C.red,    border: C.redBr   },
  cancelled: { bg: C.bg,     color: C.muted,  border: C.border  },
};

const STATUS_OPTIONS = ["approved", "rejected", "cancelled"];

export function AdminManager({ items, onStatusUpdate }) {
  if (!items.length) {
    return (
      <div style={{
        borderRadius: 12,
        border: `1.5px dashed ${C.border}`,
        padding: "20px 14px",
        textAlign: "center",
        color: C.faint,
        fontSize: "0.8rem",
        fontWeight: 600,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>
        No pending requests.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map(item => (
        <article
          key={item._id}
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderLeft: `4px solid ${C.amber}`,
            borderRadius: 13,
            padding: "12px 14px",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          {/* Booking info */}
          <p style={{ margin: "0 0 2px", fontSize: "0.88rem", fontWeight: 800, color: C.ink }}>
            {item.amenityId?.name || item.amenityName || "Facility"}
          </p>
          <p style={{ margin: "0 0 2px", fontSize: "0.74rem", fontWeight: 600, color: C.muted }}>
            {item.date} · {item.startTime}–{item.endTime}
          </p>
          <p style={{ margin: 0, fontSize: "0.72rem", color: C.faint, fontWeight: 500 }}>
            {item.residentId?.fullName || item.requestedBy?.fullName || "Resident"}
            {item.residentFlat && (
              <span style={{ marginLeft: 6, padding: "1px 7px", borderRadius: 99, background: C.borderL, color: C.muted, fontSize: "0.66rem", fontWeight: 700 }}>
                {item.residentFlat}
              </span>
            )}
          </p>

          {/* Action buttons */}
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginTop: 10,
            paddingTop: 10,
            borderTop: `1px solid ${C.borderL}`,
          }}>
            {STATUS_OPTIONS.map(status => {
              const cfg = ACTION_CFG[status];
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => onStatusUpdate(item._id, status)}
                  style={{
                    padding: "4px 12px",
                    borderRadius: 99,
                    fontSize: "0.68rem",
                    fontWeight: 800,
                    textTransform: "capitalize",
                    letterSpacing: "0.03em",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    cursor: "pointer",
                    background: cfg.bg,
                    color: cfg.color,
                    border: `1px solid ${cfg.border}`,
                    transition: "opacity 0.15s, transform 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = "0.75"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = "1";    e.currentTarget.style.transform = "";                   }}
                >
                  {status}
                </button>
              );
            })}
          </div>
        </article>
      ))}
    </div>
  );
}
