import { useMemo, useState } from "react";
import { tok, fonts, card, fieldStyle, btn } from "../lib/tokens";

const DAY_KEYS = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];

function getDayKey(dateValue) {
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return DAY_KEYS[date.getDay()];
}

function toMinutes(timeValue) {
  if (!timeValue || !timeValue.includes(":")) return 0;
  const [h, m] = timeValue.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  return h * 60 + m;
}

export function BookingForm({ amenity, isOpen, onClose, onSubmit, isSubmitting, errorMessage }) {
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const dayKey = useMemo(() => getDayKey(date), [date]);
  const dayHours = useMemo(() => {
    if (!amenity || !dayKey) return null;
    return amenity.operatingHours?.[dayKey] || { open: "06:00", close: "22:00" };
  }, [amenity, dayKey]);

  const durationMinutes = useMemo(() => {
    if (!startTime || !endTime) return 0;
    const diff = toMinutes(endTime) - toMinutes(startTime);
    return diff > 0 ? diff : 0;
  }, [startTime, endTime]);

  const outsideHours = useMemo(() => {
    if (!dayHours || !startTime || !endTime) return false;
    return startTime < dayHours.open || endTime > dayHours.close;
  }, [dayHours, endTime, startTime]);

  if (!isOpen || !amenity) return null;

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit({ amenityId: amenity._id, date, startTime, endTime });
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 50, display: "flex",
        alignItems: "center", justifyContent: "center", padding: 16,
        background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          ...card,
          width: "100%", maxWidth: 480,
          fontFamily: fonts.sans,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 20 }}>
          <div>
            <h3 style={{ fontSize: 20, fontWeight: 600, color: tok.stone800, margin: "0 0 4px" }}>
              Book {amenity.name}
            </h3>
            <p style={{ fontSize: 12, color: tok.stone400, margin: 0 }}>
              {amenity.isAutoApprove ? "⚡ Auto-approval enabled" : "Requires committee approval"}
            </p>
          </div>
          <button type="button" onClick={onClose} style={{ ...btn.muted, padding: "6px 14px", fontSize: 13 }}>
            ✕ Close
          </button>
        </div>

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: tok.stone400, letterSpacing: "0.07em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Date</label>
            <input style={fieldStyle} type="date" value={date} onChange={e => setDate(e.target.value)} required />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: tok.stone400, letterSpacing: "0.07em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Start</label>
              <input style={fieldStyle} type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: tok.stone400, letterSpacing: "0.07em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>End</label>
              <input style={fieldStyle} type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required />
            </div>
          </div>

          {dayHours && (
            <p style={{ fontSize: 12, color: tok.stone400 }}>
              🕐 Operating hours ({dayKey}): {dayHours.open} – {dayHours.close}
            </p>
          )}
          {durationMinutes > 0 && (
            <p style={{ fontSize: 12, color: tok.stone400 }}>⏱ Duration: {durationMinutes} min</p>
          )}

          {outsideHours && (
            <div style={{ padding: "10px 14px", background: tok.amberLight, border: `1px solid ${tok.amberBorder}`, borderRadius: 10, fontSize: 13, color: tok.amber }}>
              Selected time is outside operating hours.
            </div>
          )}
          {errorMessage && (
            <div style={{ padding: "10px 14px", background: tok.roseLight, border: `1px solid ${tok.roseBorder}`, borderRadius: 10, fontSize: 13, color: tok.rose }}>
              {errorMessage}
            </div>
          )}
        </div>

        <button
          style={{ ...btn.primary, width: "100%", marginTop: 20 }}
          disabled={isSubmitting || outsideHours}
          type="submit"
        >
          {isSubmitting ? "Submitting…" : "✓ Confirm Booking"}
        </button>
      </form>
    </div>
  );
}
