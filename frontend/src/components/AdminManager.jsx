import { tok, fonts, card, btn } from "../lib/tokens";

const STATUS_OPTIONS = ["approved", "rejected", "cancelled"];

const STATUS_CFG = {
  approved:  { bg: tok.emeraldLight, color: tok.emerald, border: tok.emeraldBorder },
  rejected:  { bg: tok.roseLight,    color: tok.rose,    border: tok.roseBorder    },
  cancelled: { bg: tok.stone100,     color: tok.stone600, border: tok.stone200     },
};

export function AdminManager({ items, onStatusUpdate }) {
  if (!items.length) {
    return (
      <div style={{ ...card, textAlign: "center", padding: 40 }}>
        <p style={{ fontSize: 14, color: tok.stone400 }}>No pending booking requests.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {items.map(item => (
        <article key={item._id} style={{ ...card, borderLeft: `4px solid ${tok.amber}` }}>
          <div style={{ marginBottom: 8 }}>
            <h4 style={{ fontSize: 15, fontWeight: 600, color: tok.stone800, margin: "0 0 4px", fontFamily: fonts.sans }}>
              {item.amenityId?.name || item.amenityName}
            </h4>
            <p style={{ fontSize: 13, color: tok.stone600, margin: 0 }}>
              📅 {item.date} · {item.startTime}–{item.endTime}
            </p>
            <p style={{ fontSize: 12, color: tok.stone400, marginTop: 4 }}>
              👤 {item.residentId?.fullName || item.requestedBy?.fullName || "Resident"}
            </p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${tok.stone100}` }}>
            {STATUS_OPTIONS.map(status => {
              const cfg = STATUS_CFG[status];
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => onStatusUpdate(item._id, status)}
                  style={{
                    padding: "5px 14px", borderRadius: 100, fontSize: 12, fontWeight: 600,
                    cursor: "pointer", textTransform: "capitalize", fontFamily: fonts.sans,
                    background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                    transition: "opacity .15s",
                  }}
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
