import { useEffect, useMemo, useState } from "react";
import { AdminManager } from "../components/AdminManager";
import { AmenityGrid } from "../components/AmenityGrid";
import { apiRequest } from "../components/api";
import { BookingForm } from "../components/BookingForm";
import { useAuth } from "../components/AuthContext";
import { tok, fonts, card, fieldStyle, btn } from "../lib/tokens";

const DAY_KEYS = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];

function buildOperatingHours(open, close) {
  return DAY_KEYS.reduce((acc, day) => {
    acc[day] = { open, close };
    return acc;
  }, {});
}

const BOOKING_STATUS_CFG = {
  pending:   { bg: tok.amberLight,   color: tok.amber,   border: tok.amberBorder,   emoji: "🟡" },
  approved:  { bg: tok.emeraldLight, color: tok.emerald, border: tok.emeraldBorder, emoji: "🟢" },
  rejected:  { bg: tok.roseLight,    color: tok.rose,    border: tok.roseBorder,    emoji: "🔴" },
  cancelled: { bg: tok.stone100,     color: tok.stone600, border: tok.stone200,     emoji: "⚪" },
};

export function AmenitiesPage() {
  const { token, user } = useAuth();
  const [amenities, setAmenities]           = useState([]);
  const [bookings, setBookings]             = useState([]);
  const [activeAmenity, setActiveAmenity]   = useState(null);
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);
  const [bookingError, setBookingError]     = useState("");
  const [error, setError]                   = useState("");

  const [name, setName]             = useState("");
  const [description, setDescription] = useState("");
  const [capacity, setCapacity]     = useState(1);
  const [isAutoApprove, setIsAutoApprove] = useState(false);
  const [openTime, setOpenTime]     = useState("06:00");
  const [closeTime, setCloseTime]   = useState("22:00");
  const [photoFiles, setPhotoFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const canManage = useMemo(
    () => ["committee", "super_admin"].includes(user?.role),
    [user?.role]
  );

  const pendingBookings = useMemo(
    () => bookings.filter(b => b.status === "pending"),
    [bookings]
  );

  async function loadAmenities() {
    const data = await apiRequest("/amenities", { token });
    setAmenities(data.items || []);
  }

  async function loadBookings() {
    const data = await apiRequest("/amenities/bookings", { token });
    setBookings(data.items || []);
  }

  async function loadAll() {
    setError("");
    try {
      await Promise.all([loadAmenities(), loadBookings()]);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreateAmenity(event) {
    event.preventDefault();
    setError("");
    try {
      let photos = [];
      if (photoFiles.length > 0) {
        setIsUploading(true);
        const fd = new FormData();
        photoFiles.forEach(file => fd.append("photos", file));
        const uploadData = await apiRequest("/amenities/upload-photos", { method: "POST", token, formData: fd });
        photos = uploadData.urls || [];
        setIsUploading(false);
      }
      const data = await apiRequest("/amenities", {
        method: "POST", token,
        body: { name, description, isAutoApprove, capacity: Number(capacity), photos, operatingHours: buildOperatingHours(openTime, closeTime) }
      });
      setAmenities(prev => [...prev, data.item]);
      setName(""); setDescription(""); setCapacity(1); setIsAutoApprove(false);
      setOpenTime("06:00"); setCloseTime("22:00"); setPhotoFiles([]);
    } catch (err) {
      setIsUploading(false);
      setError(err.message);
    }
  }

  async function handleCreateBooking(payload) {
    setBookingError(""); setError(""); setIsBookingSubmitting(true);
    try {
      const data = await apiRequest("/amenities/bookings", { method: "POST", token, body: payload });
      setBookings(prev => [data.item, ...prev]);
      setActiveAmenity(null);
    } catch (err) {
      setError(err.message);
      setBookingError(err.message || "Failed to create booking");
    } finally {
      setIsBookingSubmitting(false);
    }
  }

  async function handleStatusUpdate(bookingId, status) {
    setError("");
    try {
      const data = await apiRequest(`/amenities/bookings/${bookingId}/status`, { method: "PATCH", token, body: { status } });
      setBookings(prev => prev.map(item => item._id === bookingId ? data.item : item));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { loadAll(); }, []);

  return (
    <div style={{ fontFamily: fonts.sans, maxWidth: 900, margin: "0 auto", paddingBottom: 64 }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: fonts.display, fontSize: 32, fontWeight: 400, color: tok.stone800, margin: 0 }}>Amenities</h1>
            <p style={{ fontSize: 14, color: tok.stone400, marginTop: 4 }}>Book shared facilities in your society</p>
          </div>
          <button style={btn.muted} onClick={loadAll}>↻ Refresh</button>
        </div>
        {error && (
          <div style={{ marginTop: 16, padding: "12px 16px", background: tok.roseLight, border: `1px solid ${tok.roseBorder}`, borderRadius: 12, fontSize: 14, color: tok.rose }}>
            {error}
          </div>
        )}
      </div>

      {/* Create form — admin only */}
      {canManage && (
        <div style={{ ...card, marginBottom: 28 }}>
          <h2 style={{ fontFamily: fonts.display, fontSize: 20, fontWeight: 400, color: tok.stone800, margin: "0 0 16px" }}>
            Add Amenity
          </h2>
          <form onSubmit={handleCreateAmenity} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input style={fieldStyle} placeholder="Amenity name (e.g. Swimming Pool)" value={name} onChange={e => setName(e.target.value)} required />
            <textarea style={{ ...fieldStyle, minHeight: 80, resize: "vertical" }} placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: tok.stone400, letterSpacing: "0.07em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                  Capacity
                </label>
                <input style={fieldStyle} type="number" min="1" value={capacity} onChange={e => setCapacity(e.target.value)} />
              </div>
              <div style={{ display: "flex", alignItems: "center" }}>
                <label style={{
                  display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
                  padding: "10px 14px", background: isAutoApprove ? tok.emeraldLight : tok.stone50,
                  border: `1px solid ${isAutoApprove ? tok.emeraldBorder : tok.stone200}`,
                  borderRadius: 12, fontSize: 14, color: isAutoApprove ? tok.emerald : tok.stone600,
                  fontWeight: 500, width: "100%", marginTop: 22,
                }}>
                  <input
                    type="checkbox"
                    checked={isAutoApprove}
                    onChange={e => setIsAutoApprove(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: tok.emerald }}
                  />
                  ⚡ Auto-approve bookings
                </label>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: tok.stone400, letterSpacing: "0.07em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Opens</label>
                <input style={fieldStyle} type="time" value={openTime} onChange={e => setOpenTime(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: tok.stone400, letterSpacing: "0.07em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Closes</label>
                <input style={fieldStyle} type="time" value={closeTime} onChange={e => setCloseTime(e.target.value)} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: tok.stone400, letterSpacing: "0.07em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                Photos (up to 5, max 5 MB each)
              </label>
              <input
                style={{ ...fieldStyle, cursor: "pointer" }}
                type="file" accept="image/*" multiple
                onChange={e => setPhotoFiles(Array.from(e.target.files).slice(0, 5))}
              />
              {photoFiles.length > 0 && (
                <p style={{ fontSize: 12, color: tok.stone400, marginTop: 6 }}>
                  {photoFiles.length} file{photoFiles.length > 1 ? "s" : ""} selected
                </p>
              )}
            </div>

            <div>
              <button style={btn.primary} type="submit" disabled={isUploading}>
                {isUploading ? "Uploading photos…" : "🏊 Add Amenity"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Amenity grid */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: tok.stone400, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>
          Available Facilities
        </h2>
        <AmenityGrid amenities={amenities} onBook={setActiveAmenity} />
      </div>

      {/* Bookings list */}
      {bookings.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: tok.stone400, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>
            My Bookings
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {bookings.map(item => {
              const cfg = BOOKING_STATUS_CFG[item.status] || BOOKING_STATUS_CFG.pending;
              return (
                <article key={item._id} style={{ ...card, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "16px 20px" }}>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 600, color: tok.stone800, margin: "0 0 4px" }}>
                      {item.amenityId?.name || item.amenityName}
                    </p>
                    <p style={{ fontSize: 13, color: tok.stone600, margin: 0 }}>
                      📅 {item.date} · {item.startTime}–{item.endTime}
                    </p>
                  </div>
                  <span style={{
                    flexShrink: 0, padding: "4px 12px", borderRadius: 100, fontSize: 11, fontWeight: 700,
                    background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                    textTransform: "capitalize", whiteSpace: "nowrap",
                  }}>
                    {cfg.emoji} {item.status}
                  </span>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* Admin approval queue */}
      {canManage && pendingBookings.length > 0 && (
        <div>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: tok.stone400, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>
            Pending Approvals ({pendingBookings.length})
          </h2>
          <AdminManager items={pendingBookings} onStatusUpdate={handleStatusUpdate} />
        </div>
      )}

      <BookingForm
        amenity={activeAmenity}
        isOpen={Boolean(activeAmenity)}
        errorMessage={bookingError}
        isSubmitting={isBookingSubmitting}
        onClose={() => { setActiveAmenity(null); setBookingError(""); }}
        onSubmit={handleCreateBooking}
      />
    </div>
  );
}
