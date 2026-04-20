import { useEffect, useMemo, useState } from "react";
import { AdminManager } from "../components/AdminManager";
import { AmenityGrid } from "../components/AmenityGrid";
import { apiRequest } from "../components/api";
import { BookingForm } from "../components/BookingForm";
import { useAuth } from "../components/AuthContext";
import { RefreshCw, Plus } from "lucide-react";

const T = {
  bg: "#F7F9FF",
  surface: "#FFFFFF",
  border: "#DCE5F3",
  borderHover: "#D1D5DB",
  ink: "#111827",
  text2: "#6B7280",
  text3: "#9CA3AF",
  amber: "#E8890C",
  amberH: "#C97508",
  amberLight: "#FFF8F0",
  amberBorder: "#FDECC8",
  blue: "#2563EB",
  green: "#16A34A",
  greenLight: "#DCFCE7",
  greenBorder: "#BBF7D0",
  red: "#DC2626",
  redLight: "#FEE2E2",
  redBorder: "#FECACA",
};

const DAY_KEYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

function buildOperatingHours(open, close) {
  return DAY_KEYS.reduce((acc, day) => {
    acc[day] = { open, close };
    return acc;
  }, {});
}

const BOOKING_STATUS_CFG = {
  pending: { color: "#B45309", bg: "#FFFBEB", border: "#FDE68A" },
  approved: { color: T.green, bg: T.greenLight, border: T.greenBorder },
  rejected: { color: T.red, bg: T.redLight, border: T.redBorder },
  cancelled: { color: T.text3, bg: "#F9FAFB", border: "#E5E7EB" },
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap');

  .amn-root * { box-sizing: border-box; }

  .amn-root {
    font-family: 'Manrope', sans-serif;
    color: ${T.ink};
    background:
      radial-gradient(900px 380px at 85% -12%, rgba(37,99,235,0.13), transparent 64%),
      radial-gradient(760px 340px at -10% 0%, rgba(232,137,12,0.12), transparent 68%),
      ${T.bg};
    min-height: calc(100vh - 64px);
    padding: 22px 20px 78px;
    position: relative;
  }

  .amn-root::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image:
      linear-gradient(to right, rgba(148,163,184,0.11) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(148,163,184,0.11) 1px, transparent 1px);
    background-size: 38px 38px;
    mask-image: radial-gradient(circle at 15% 10%, rgba(0,0,0,.9), transparent 70%);
  }

  .amn-content {
    position: relative;
    z-index: 1;
    max-width: 1040px;
    margin: 0 auto;
  }

  .amn-display { font-family: 'Cormorant Garamond', serif; }

  .amn-hero {
    border-radius: 24px;
    border: 1px solid #D8E3F5;
    background: linear-gradient(140deg, rgba(255,255,255,0.96), rgba(243,247,255,0.95));
    box-shadow: 0 22px 46px rgba(17,24,39,0.09);
    padding: 18px;
    display: grid;
    grid-template-columns: 1.05fr 0.95fr;
    gap: 16px;
    margin-bottom: 18px;
  }

  .amn-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(2rem, 4.4vw, 3.2rem);
    margin: 0;
    line-height: 0.95;
    color: ${T.ink};
  }

  .amn-sub {
    margin-top: 10px;
    color: #61708D;
    font-size: 0.9rem;
    line-height: 1.65;
    max-width: 58ch;
  }

  .amn-actions {
    margin-top: 14px;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .amn-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    align-content: start;
  }

  .amn-stat {
    border: 1px solid #D8E3F5;
    border-radius: 14px;
    background: #FFFFFF;
    padding: 10px;
  }

  .amn-stat-num {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.5rem;
    line-height: 1;
    font-weight: 700;
  }

  .amn-stat-lbl {
    margin-top: 4px;
    font-size: 0.74rem;
    color: #8B95A8;
    font-weight: 600;
  }

  .amn-block {
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 18px;
    padding: 16px;
    box-shadow: 0 10px 26px rgba(17,24,39,0.06);
    margin-bottom: 18px;
  }

  .amn-section-title {
    margin: 0 0 14px;
    font-size: 1rem;
    font-weight: 700;
    color: ${T.ink};
  }

  .amn-form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .amn-label {
    display: block;
    margin-bottom: 6px;
    color: ${T.text2};
    font-size: 0.78rem;
    font-weight: 600;
  }

  .amn-input {
    width: 100%;
    background: ${T.surface};
    border: 1px solid #E5E7EB;
    border-radius: 10px;
    padding: 10px 14px;
    color: ${T.ink};
    font-family: 'Manrope', sans-serif;
    font-size: 0.875rem;
    outline: none;
    transition: border-color 0.18s, box-shadow 0.18s;
    box-sizing: border-box;
    resize: vertical;
  }

  .amn-input::placeholder { color: ${T.text3}; }

  .amn-input:focus {
    border-color: #D1D5DB;
    box-shadow: 0 0 0 3px rgba(232,137,12,.1);
  }

  .amn-toggle {
    display: flex;
    align-items: center;
    gap: 10px;
    border: 1px solid #E5E7EB;
    border-radius: 10px;
    background: #FFFFFF;
    color: ${T.text2};
    padding: 11px 14px;
    font-size: 0.84rem;
    font-weight: 600;
    cursor: pointer;
  }

  .amn-toggle input {
    width: 16px;
    height: 16px;
    accent-color: ${T.amber};
    margin: 0;
  }

  .amn-btn-primary {
    position: relative;
    overflow: hidden;
    isolation: isolate;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    background: linear-gradient(135deg, ${T.amber}, ${T.amberH});
    color: #fff;
    border: none;
    border-radius: 10px;
    padding: 10px 20px;
    font-family: 'Manrope', sans-serif;
    font-size: 0.84rem;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(232,137,12,.25);
    transition: all 0.18s;
  }

  .amn-btn-primary::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(120deg, rgba(255,255,255,0) 36%, rgba(255,255,255,0.35) 52%, rgba(255,255,255,0) 68%);
    transform: translateX(-130%);
    transition: transform 0.5s ease;
    z-index: 0;
  }

  .amn-btn-primary > * {
    position: relative;
    z-index: 1;
    transition: transform 0.2s ease;
  }

  .amn-btn-primary:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(232,137,12,.32);
  }

  .amn-btn-primary:hover:not(:disabled)::before { transform: translateX(130%); }
  .amn-btn-primary:hover:not(:disabled) svg { transform: translateX(1px); }
  .amn-btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }

  .amn-btn-ghost {
    position: relative;
    overflow: hidden;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: ${T.surface};
    border: 1px solid #E5E7EB;
    border-radius: 8px;
    padding: 9px 13px;
    color: ${T.text2};
    font-family: 'Manrope', sans-serif;
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.18s;
  }

  .amn-btn-ghost::after {
    content: '';
    position: absolute;
    left: 8px;
    right: 8px;
    bottom: 0;
    height: 2px;
    border-radius: 999px;
    background: linear-gradient(90deg, ${T.blue}, ${T.amber});
    transform: scaleX(0.2);
    opacity: 0;
    transition: transform 0.2s ease, opacity 0.2s ease;
  }

  .amn-btn-ghost:hover {
    border-color: #D1D5DB;
    color: ${T.ink};
    transform: translateY(-1px);
    box-shadow: 0 8px 18px rgba(17,24,39,0.07);
  }

  .amn-btn-ghost:hover::after {
    transform: scaleX(1);
    opacity: 1;
  }

  .amn-btn-ghost:disabled { opacity: 0.45; cursor: not-allowed; }

  .amn-book-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .amn-book-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 16px;
    border-radius: 14px;
    border: 1px solid ${T.border};
    background: ${T.surface};
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .amn-book-item:hover {
    border-color: ${T.borderHover};
    box-shadow: 0 8px 18px rgba(17,24,39,0.07);
  }

  .amn-badge {
    flex-shrink: 0;
    padding: 4px 11px;
    border-radius: 100px;
    font-size: 0.7rem;
    font-weight: 700;
    white-space: nowrap;
    text-transform: capitalize;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  @media (max-width: 960px) {
    .amn-hero { grid-template-columns: 1fr; }
  }

  @media (max-width: 740px) {
    .amn-form-grid { grid-template-columns: 1fr; }
    .amn-stats { grid-template-columns: 1fr; }
  }
`;

export function AmenitiesPage() {
  const { token, user } = useAuth();
  const [amenities, setAmenities] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [activeAmenity, setActiveAmenity] = useState(null);
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [capacity, setCapacity] = useState(1);
  const [isAutoApprove, setIsAutoApprove] = useState(false);
  const [openTime, setOpenTime] = useState("06:00");
  const [closeTime, setCloseTime] = useState("22:00");
  const [photoFiles, setPhotoFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const canManage = useMemo(() => ["committee", "super_admin"].includes(user?.role), [user?.role]);
  const pendingBookings = useMemo(() => bookings.filter((b) => b.status === "pending"), [bookings]);

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
    setLoading(true);
    try {
      await Promise.all([loadAmenities(), loadBookings()]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
        photoFiles.forEach((file) => fd.append("photos", file));
        const uploadData = await apiRequest("/amenities/upload-photos", { method: "POST", token, formData: fd });
        photos = uploadData.urls || [];
        setIsUploading(false);
      }

      const data = await apiRequest("/amenities", {
        method: "POST",
        token,
        body: {
          name,
          description,
          isAutoApprove,
          capacity: Number(capacity),
          photos,
          operatingHours: buildOperatingHours(openTime, closeTime),
        },
      });

      setAmenities((prev) => [...prev, data.item]);
      setName("");
      setDescription("");
      setCapacity(1);
      setIsAutoApprove(false);
      setOpenTime("06:00");
      setCloseTime("22:00");
      setPhotoFiles([]);
    } catch (err) {
      setIsUploading(false);
      setError(err.message);
    }
  }

  async function handleCreateBooking(payload) {
    setBookingError("");
    setError("");
    setIsBookingSubmitting(true);
    try {
      const data = await apiRequest("/amenities/bookings", { method: "POST", token, body: payload });
      setBookings((prev) => [data.item, ...prev]);
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
      setBookings((prev) => prev.map((item) => (item._id === bookingId ? data.item : item)));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  return (
    <>
      <style>{CSS}</style>
      <div className="amn-root">
        <div className="amn-content">
          <section className="amn-hero">
            <div>
              <h1 className="amn-title">Amenities</h1>
              <p className="amn-sub">Book shared facilities, track approvals, and manage society spaces in one place.</p>
              <div className="amn-actions">
                <button className="amn-btn-ghost" onClick={loadAll} disabled={loading}>
                  <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
                  Refresh
                </button>
                {canManage && (
                  <button className="amn-btn-primary" onClick={() => setShowCreateForm((v) => !v)}>
                    <Plus size={13} />
                    {showCreateForm ? "Close form" : "Add amenity"}
                  </button>
                )}
              </div>
            </div>

            <div className="amn-stats">
              <div className="amn-stat">
                <div className="amn-stat-num" style={{ color: T.blue }}>{amenities.length}</div>
                <div className="amn-stat-lbl">Facilities</div>
              </div>
              <div className="amn-stat">
                <div className="amn-stat-num" style={{ color: T.amber }}>{bookings.length}</div>
                <div className="amn-stat-lbl">My bookings</div>
              </div>
              <div className="amn-stat">
                <div className="amn-stat-num" style={{ color: T.green }}>{pendingBookings.length}</div>
                <div className="amn-stat-lbl">Pending approvals</div>
              </div>
            </div>
          </section>

          {error && (
            <div
              style={{
                marginBottom: 14,
                padding: "11px 16px",
                background: T.redLight,
                border: `1px solid ${T.redBorder}`,
                borderRadius: 10,
                fontSize: "0.84rem",
                color: T.red,
              }}
            >
              {error}
            </div>
          )}

          {canManage && showCreateForm && (
            <section className="amn-block" style={{ position: "relative", overflow: "hidden" }}>
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: `linear-gradient(90deg, ${T.amber}, ${T.amberH})`,
                }}
              />
              <h2 className="amn-display" style={{ fontSize: "1.45rem", fontWeight: 700, color: T.ink, margin: "0 0 14px" }}>
                Add Amenity
              </h2>

              <form onSubmit={handleCreateAmenity} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label className="amn-label">Amenity name</label>
                  <input
                    className="amn-input"
                    placeholder="e.g. Swimming pool"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="amn-label">Description</label>
                  <textarea
                    className="amn-input"
                    style={{ minHeight: 82 }}
                    placeholder="Tell residents about this facility"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="amn-form-grid">
                  <div>
                    <label className="amn-label">Capacity</label>
                    <input
                      className="amn-input"
                      type="number"
                      min="1"
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="amn-label">Approvals</label>
                    <label className="amn-toggle">
                      <input
                        type="checkbox"
                        checked={isAutoApprove}
                        onChange={(e) => setIsAutoApprove(e.target.checked)}
                      />
                      {isAutoApprove ? "Auto-approval is enabled" : "Manual approval is enabled"}
                    </label>
                  </div>
                </div>

                <div className="amn-form-grid">
                  <div>
                    <label className="amn-label">Opens at</label>
                    <input className="amn-input" type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)} />
                  </div>
                  <div>
                    <label className="amn-label">Closes at</label>
                    <input className="amn-input" type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} />
                  </div>
                </div>

                <div>
                  <label className="amn-label">Photos (up to 5, max 5 MB each)</label>
                  <input
                    className="amn-input"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setPhotoFiles(Array.from(e.target.files).slice(0, 5))}
                  />
                  {photoFiles.length > 0 && (
                    <p style={{ fontSize: "0.78rem", color: T.text3, marginTop: 6 }}>
                      {photoFiles.length} file{photoFiles.length > 1 ? "s" : ""} selected
                    </p>
                  )}
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button className="amn-btn-primary" type="submit" disabled={isUploading}>
                    {isUploading ? "Uploading photos..." : <><Plus size={13} /> Add amenity</>}
                  </button>
                  <button type="button" className="amn-btn-ghost" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          )}

          <section className="amn-block">
            <h2 className="amn-section-title">Available facilities</h2>
            <AmenityGrid amenities={amenities} onBook={setActiveAmenity} />
          </section>

          {bookings.length > 0 && (
            <section className="amn-block">
              <h2 className="amn-section-title">My bookings</h2>
              <div className="amn-book-list">
                {bookings.map((item) => {
                  const cfg = BOOKING_STATUS_CFG[item.status] || BOOKING_STATUS_CFG.pending;
                  return (
                    <article key={item._id} className="amn-book-item">
                      <div>
                        <p style={{ fontSize: "0.92rem", fontWeight: 700, color: T.ink, margin: "0 0 4px" }}>
                          {item.amenityId?.name || item.amenityName}
                        </p>
                        <p style={{ fontSize: "0.78rem", color: T.text2, margin: 0 }}>
                          {item.date} . {item.startTime}-{item.endTime}
                        </p>
                      </div>
                      <span className="amn-badge" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                        {item.status}
                      </span>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {canManage && pendingBookings.length > 0 && (
            <section className="amn-block">
              <h2 className="amn-section-title">Pending approvals ({pendingBookings.length})</h2>
              <AdminManager items={pendingBookings} onStatusUpdate={handleStatusUpdate} />
            </section>
          )}
        </div>

        <BookingForm
          amenity={activeAmenity}
          isOpen={Boolean(activeAmenity)}
          errorMessage={bookingError}
          isSubmitting={isBookingSubmitting}
          onClose={() => {
            setActiveAmenity(null);
            setBookingError("");
          }}
          onSubmit={handleCreateBooking}
        />
      </div>
    </>
  );
}
