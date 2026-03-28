import { useMemo, useState } from "react";

const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday"
];

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

  if (!isOpen || !amenity) {
    return null;
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit({ amenityId: amenity._id, date, startTime, endTime });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl" onSubmit={handleSubmit}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Book {amenity.name}</h3>
            <p className="text-xs text-slate-500">
              {amenity.isAutoApprove ? "Auto-approval is enabled" : "Requires admin approval"}
            </p>
          </div>
          <button className="btn-muted" type="button" onClick={onClose}>Close</button>
        </div>

        <div className="space-y-3">
          <input className="field" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="field" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
            <input className="field" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
          </div>

          {dayHours ? (
            <p className="text-xs text-slate-500">
              Operating hours for {dayKey}: {dayHours.open} - {dayHours.close}
            </p>
          ) : null}

          <p className="text-xs text-slate-500">Duration: {durationMinutes} minutes</p>

          {outsideHours ? (
            <p className="rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-900">
              Selected time is outside operating hours.
            </p>
          ) : null}

          {errorMessage ? (
            <p className="rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-900">
              {errorMessage}
            </p>
          ) : null}
        </div>

        <button className="btn-primary mt-4 w-full" disabled={isSubmitting || outsideHours} type="submit">
          {isSubmitting ? "Submitting..." : "Confirm Booking"}
        </button>
      </form>
    </div>
  );
}
