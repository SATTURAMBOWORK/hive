import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const C = {
  bg:      "#FAFAFC",
  surface: "#FFFFFF",
  ink:     "#1C1C1E",
  muted:   "#6B7280",
  faint:   "#9CA3AF",
  border:  "#E8E8ED",
  indigo:  "#4F46E5",
  red:     "#DC2626",
  redL:    "#FEF2F2",
  redBr:   "#FECACA",
  amberD:  "#D97706",
  amberL:  "#FFFBEB",
  amberBr: "#FCD34D",
  orange:  "#E8890C",
};

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

const field = {
  width: "100%",
  padding: "10px 14px",
  border: `1px solid ${C.border}`,
  borderRadius: 10,
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: "0.875rem",
  color: C.ink,
  background: C.surface,
  outline: "none",
  boxSizing: "border-box",
};

const lbl = {
  display: "block",
  fontSize: "0.7rem",
  fontWeight: 700,
  color: C.muted,
  letterSpacing: "0.09em",
  textTransform: "uppercase",
  marginBottom: 7,
};

const BF_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  @keyframes bf-spin { to { transform: rotate(360deg); } }
  .bf-backdrop {
    position: fixed;
    inset: 0;
    z-index: 110;
    background: rgba(15, 23, 42, 0.34);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
  }

  .bf-shell {
    position: fixed;
    inset: 0;
    z-index: 111;
    padding: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }

  .bf-modal {
    width: min(760px, 96vw);
    max-height: min(88vh, 860px);
    background: ${C.surface};
    border: 1px solid ${C.border};
    border-radius: 18px;
    box-shadow: 0 28px 80px rgba(15,23,42,0.25);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    pointer-events: auto;
  }

  .bf-modal-head {
    padding: 22px 24px 18px;
    border-bottom: 1px solid ${C.border};
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    flex-shrink: 0;
  }

  .bf-modal-body {
    padding: 20px 24px 24px;
    overflow-y: auto;
  }

  .bf-close {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${C.bg};
    border: 1px solid ${C.border};
    border-radius: 10px;
    cursor: pointer;
    color: ${C.muted};
    transition: all 0.16s;
    flex-shrink: 0;
  }

  .bf-close:hover {
    border-color: #C7C7CC;
    color: ${C.ink};
    transform: translateY(-1px);
  }

  @media (max-width: 700px) {
    .bf-shell {
      padding: 12px;
      align-items: flex-end;
    }

    .bf-modal {
      width: 100%;
      max-height: 92vh;
      border-radius: 16px 16px 0 0;
    }
  }

  .bf-field:focus {
    border-color: #C7C7CC !important;
    box-shadow: 0 0 0 3px rgba(232,137,12,0.1) !important;
  }
`;

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

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit({ amenityId: amenity._id, date, startTime, endTime });
  }

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function handleEsc(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  return (
    <>
      <style>{BF_CSS}</style>
      <AnimatePresence>
        {isOpen && amenity && (
          <>
            <motion.div
              key="bf-backdrop"
              className="bf-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              onClick={onClose}
            />

            <div className="bf-shell">
              <motion.section
                layoutId={`amenity-${amenity._id}`}
                className="bf-modal"
                transition={{ type: "spring", stiffness: 300, damping: 28, mass: 0.82 }}
              >
                <div className="bf-modal-head">
                  <div>
                    <div style={{
                      fontSize: "0.66rem",
                      fontWeight: 800,
                      letterSpacing: "0.13em",
                      textTransform: "uppercase",
                      color: C.orange,
                      marginBottom: 7,
                    }}>
                      Reserve Facility
                    </div>
                    <motion.h3 layoutId={`amenity-title-${amenity._id}`} style={{
                      fontSize: "1.4rem",
                      fontWeight: 800,
                      color: C.ink,
                      margin: 0,
                      lineHeight: 1.15,
                      letterSpacing: "-0.025em",
                    }}>
                      {amenity.name}
                    </motion.h3>
                    <motion.p layoutId={`amenity-meta-${amenity._id}`} style={{
                      fontSize: "0.78rem",
                      color: C.muted,
                      margin: "7px 0 0",
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}>
                      {amenity.isAutoApprove
                        ? <><span style={{ color: C.orange }}>⚡</span> Auto-approved instantly</>
                        : <><span style={{ color: C.indigo }}>🔖</span> Requires committee approval</>
                      }
                    </motion.p>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="bf-close"
                  >
                    <X size={15} />
                  </button>
                </div>

                <div className="bf-modal-body">
                  <form
                    onSubmit={handleSubmit}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 18,
                    }}
                  >
                {/* Date */}
                <div>
                  <label style={lbl}>Date</label>
                  <input
                    className="bf-field"
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                    style={field}
                  />
                </div>

                {/* Time */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={lbl}>Start time</label>
                    <input
                      className="bf-field"
                      type="time"
                      value={startTime}
                      onChange={e => setStartTime(e.target.value)}
                      required
                      style={field}
                    />
                  </div>
                  <div>
                    <label style={lbl}>End time</label>
                    <input
                      className="bf-field"
                      type="time"
                      value={endTime}
                      onChange={e => setEndTime(e.target.value)}
                      required
                      style={field}
                    />
                  </div>
                </div>

                {/* Info pills */}
                {(dayHours || durationMinutes > 0) && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {dayHours && (
                      <div style={{
                        display: "inline-flex", alignItems: "center", gap: 7,
                        fontSize: "0.78rem", color: C.muted,
                        background: C.bg, border: `1px solid ${C.border}`,
                        borderRadius: 8, padding: "6px 12px", width: "fit-content",
                      }}>
                        <span style={{ color: C.orange }}>◷</span>
                        {dayKey.charAt(0).toUpperCase() + dayKey.slice(1)}: {dayHours.open} – {dayHours.close}
                      </div>
                    )}
                    {durationMinutes > 0 && (
                      <div style={{
                        display: "inline-flex", alignItems: "center", gap: 7,
                        fontSize: "0.78rem", color: C.muted,
                        background: C.bg, border: `1px solid ${C.border}`,
                        borderRadius: 8, padding: "6px 12px", width: "fit-content",
                      }}>
                        <span style={{ color: C.indigo }}>⏱</span>
                        Duration: {durationMinutes} min
                      </div>
                    )}
                  </div>
                )}

                {/* Warnings */}
                {outsideHours && (
                  <div style={{
                    padding: "11px 14px", background: C.amberL,
                    border: `1px solid ${C.amberBr}`, borderRadius: 10,
                    fontSize: "0.82rem", color: C.amberD, fontWeight: 600,
                  }}>
                    ⚠ Selected time is outside operating hours.
                  </div>
                )}

                {errorMessage && (
                  <div style={{
                    padding: "11px 14px", background: C.redL,
                    border: `1px solid ${C.redBr}`, borderRadius: 10,
                    fontSize: "0.82rem", color: C.red, fontWeight: 600,
                  }}>
                    {errorMessage}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting || outsideHours}
                  style={{
                    marginTop: "10px",
                    width: "100%",
                    padding: "13px 20px",
                    background: `linear-gradient(135deg, ${C.orange}, ${C.amberD})`,
                    border: "none",
                    borderRadius: 12,
                    color: "#fff",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    cursor: isSubmitting || outsideHours ? "not-allowed" : "pointer",
                    opacity: outsideHours ? 0.5 : 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    boxShadow: "0 4px 14px rgba(232,137,12,.28)",
                    transition: "transform 0.18s, box-shadow 0.18s",
                  }}
                  onMouseEnter={e => {
                    if (!isSubmitting && !outsideHours) {
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow = "0 7px 20px rgba(232,137,12,.36)";
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = "";
                    e.currentTarget.style.boxShadow = "0 4px 14px rgba(232,137,12,.28)";
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <div style={{
                        width: 16,
                        height: 16,
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderTopColor: "#fff",
                        borderRadius: "50%",
                        animation: "bf-spin 0.7s linear infinite",
                        flexShrink: 0,
                      }} />
                      Submitting…
                    </>
                  ) : (
                    "Confirm Booking →"
                  )}
                </button>
                  </form>
                </div>
              </motion.section>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
