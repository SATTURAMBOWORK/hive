import { useEffect, useMemo, useState } from "react";
import { AdminManager } from "../components/AdminManager";
import { AmenityGrid } from "../components/AmenityGrid";
import { apiRequest } from "../components/api";
import { BookingForm } from "../components/BookingForm";
import { useAuth } from "../components/AuthContext";
import { RefreshCw, Plus } from "lucide-react";

// ── Design tokens ────────────────────────────────────────────────
const T = {
  bg:        "#FFFCF6",
  surface:   "#FFFFFF",
  border:    "#E7DDC8",
  borderHov: "#D8CDAE",
  gold:      "#3D52A0",
  goldLight: "#2F3F7A",
  text:      "#24324A",
  textSub:   "#5B6577",
  textMuted: "#8B95A8",
  green:     "#3d9e6e",
  red:       "#e85d5d",
  amber:     "#d4a843",
};

const DAY_KEYS = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];

function buildOperatingHours(open, close) {
  return DAY_KEYS.reduce((acc, day) => {
    acc[day] = { open, close };
    return acc;
  }, {});
}

const BOOKING_STATUS_CFG = {
  pending:   { color: T.amber  },
  approved:  { color: T.green  },
  rejected:  { color: T.red    },
  cancelled: { color: T.textMuted },
};

const inputStyle = {
  width: "100%", borderRadius: 12, border: `1px solid ${T.border}`,
  background: "#ffffff", padding: "10px 14px",
  color: T.text, fontSize: 14, outline: "none",
  transition: "border-color 0.2s, box-shadow 0.2s", boxSizing: "border-box",
};

function Label({ children }) {
  return <p style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>{children}</p>;
}

function FocusInput({ style: extraStyle = {}, ...props }) {
  return (
    <input style={{ ...inputStyle, ...extraStyle }}
      onFocus={e => { e.target.style.borderColor = T.borderHov; e.target.style.boxShadow = `0 0 0 3px rgba(61,82,160,0.12)`; }}
      onBlur={e => { e.target.style.borderColor = T.border; e.target.style.boxShadow = "none"; }}
      {...props} />
  );
}

function FocusTextarea({ style: extraStyle = {}, ...props }) {
  return (
    <textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical", ...extraStyle }}
      onFocus={e => { e.target.style.borderColor = T.borderHov; e.target.style.boxShadow = `0 0 0 3px rgba(61,82,160,0.12)`; }}
      onBlur={e => { e.target.style.borderColor = T.border; e.target.style.boxShadow = "none"; }}
      {...props} />
  );
}

export function AmenitiesPage() {
  const { token, user } = useAuth();
  const [amenities, setAmenities]           = useState([]);
  const [bookings, setBookings]             = useState([]);
  const [activeAmenity, setActiveAmenity]   = useState(null);
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);
  const [bookingError, setBookingError]     = useState("");
  const [error, setError]                   = useState("");

  const [name, setName]               = useState("");
  const [description, setDescription] = useState("");
  const [capacity, setCapacity]       = useState(1);
  const [isAutoApprove, setIsAutoApprove] = useState(false);
  const [openTime, setOpenTime]       = useState("06:00");
  const [closeTime, setCloseTime]     = useState("22:00");
  const [photoFiles, setPhotoFiles]   = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const canManage = useMemo(() => ["committee", "super_admin"].includes(user?.role), [user?.role]);
  const pendingBookings = useMemo(() => bookings.filter(b => b.status === "pending"), [bookings]);

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
    try { await Promise.all([loadAmenities(), loadBookings()]); }
    catch (err) { setError(err.message); }
  }

  async function handleCreateAmenity(event) {
    event.preventDefault(); setError("");
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
    } catch (err) { setIsUploading(false); setError(err.message); }
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
    } finally { setIsBookingSubmitting(false); }
  }

  async function handleStatusUpdate(bookingId, status) {
    setError("");
    try {
      const data = await apiRequest(`/amenities/bookings/${bookingId}/status`, { method: "PATCH", token, body: { status } });
      setBookings(prev => prev.map(item => item._id === bookingId ? data.item : item));
    } catch (err) { setError(err.message); }
  }

  useEffect(() => { loadAll(); }, []);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 16px 64px", fontFamily: "'DM Sans', sans-serif", background: "linear-gradient(180deg,#FFFCF6 0%,#F8F3E8 100%)", borderRadius: 20 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text, margin: 0 }}>Amenities</h1>
          <p style={{ fontSize: 13, color: T.textMuted, marginTop: 4 }}>Book shared facilities in your society</p>
        </div>
        <button onClick={loadAll}
          style={{ display: "flex", alignItems: "center", gap: 6, borderRadius: 12, border: `1px solid ${T.border}`, padding: "8px 14px", background: "#fff", cursor: "pointer", color: T.textSub, fontSize: 13, fontWeight: 600, transition: "all 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderHov; e.currentTarget.style.color = T.gold; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textSub; }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {error && (
        <div style={{ marginBottom: 20, borderRadius: 12, background: `${T.red}18`, border: `1px solid ${T.red}44`, padding: "12px 16px", fontSize: 13, color: T.red }}>
          {error}
        </div>
      )}

      {/* Create form — committee only */}
      {canManage && (
        <div style={{ borderRadius: 18, border: `1px solid ${T.border}`, background: T.surface, padding: 24, marginBottom: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: "0 0 20px", display: "flex", alignItems: "center", gap: 8 }}>
            <Plus size={16} color={T.gold} /> Add Amenity
          </h2>
          <form onSubmit={handleCreateAmenity} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <FocusInput placeholder="Amenity name (e.g. Swimming Pool)" value={name} onChange={e => setName(e.target.value)} required />
            <FocusTextarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <Label>Capacity</Label>
                <FocusInput type="number" min="1" value={capacity} onChange={e => setCapacity(e.target.value)} />
              </div>
              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <label
                  onClick={() => setIsAutoApprove(v => !v)}
                  style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "10px 14px", background: isAutoApprove ? `${T.green}18` : "transparent", border: `1px solid ${isAutoApprove ? T.green : T.border}`, borderRadius: 12, fontSize: 13, color: isAutoApprove ? T.green : T.textSub, fontWeight: 500, width: "100%", marginTop: 22, transition: "all 0.2s", boxSizing: "border-box" }}>
                  <div style={{ width: 36, height: 20, borderRadius: 100, background: isAutoApprove ? T.green : `${T.gold}30`, position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                    <div style={{ position: "absolute", top: 2, left: isAutoApprove ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                  </div>
                  ⚡ Auto-approve bookings
                </label>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><Label>Opens</Label><FocusInput type="time" value={openTime} onChange={e => setOpenTime(e.target.value)} /></div>
              <div><Label>Closes</Label><FocusInput type="time" value={closeTime} onChange={e => setCloseTime(e.target.value)} /></div>
            </div>

            <div>
              <Label>Photos (up to 5, max 5 MB each)</Label>
              <input type="file" accept="image/*" multiple
                style={{ ...inputStyle, cursor: "pointer" }}
                onChange={e => setPhotoFiles(Array.from(e.target.files).slice(0, 5))} />
              {photoFiles.length > 0 && (
                <p style={{ fontSize: 12, color: T.textMuted, marginTop: 6 }}>
                  {photoFiles.length} file{photoFiles.length > 1 ? "s" : ""} selected
                </p>
              )}
            </div>

            <button type="submit" disabled={isUploading}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, borderRadius: 12, background: isUploading ? "#C7D2FE" : `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`, padding: "11px 22px", fontSize: 13, fontWeight: 700, color: "#ffffff", border: "none", cursor: isUploading ? "not-allowed" : "pointer", transition: "all 0.2s", alignSelf: "flex-start" }}
              onMouseEnter={e => { if (!isUploading) e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}>
              {isUploading ? "Uploading photos…" : "🏊 Add Amenity"}
            </button>
          </form>
        </div>
      )}

      {/* Amenity grid */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>
          Available Facilities
        </p>
        <AmenityGrid amenities={amenities} onBook={setActiveAmenity} />
      </div>

      {/* Bookings list */}
      {bookings.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>
            My Bookings
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {bookings.map(item => {
              const cfg = BOOKING_STATUS_CFG[item.status] || BOOKING_STATUS_CFG.pending;
              return (
                <article key={item._id}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "16px 20px", borderRadius: 16, border: `1px solid ${T.border}`, background: T.surface, transition: "border-color 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = T.borderHov}
                  onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: T.text, margin: "0 0 4px" }}>
                      {item.amenityId?.name || item.amenityName}
                    </p>
                    <p style={{ fontSize: 12, color: T.textSub, margin: 0 }}>
                      📅 {item.date} · {item.startTime}–{item.endTime}
                    </p>
                  </div>
                  <span style={{ flexShrink: 0, padding: "4px 12px", borderRadius: 100, fontSize: 11, fontWeight: 700, background: `${cfg.color}22`, color: cfg.color, border: `1px solid ${cfg.color}44`, textTransform: "capitalize", whiteSpace: "nowrap" }}>
                    {item.status}
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
          <p style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>
            Pending Approvals ({pendingBookings.length})
          </p>
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
