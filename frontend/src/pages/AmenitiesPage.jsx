import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AdminManager } from "../components/AdminManager";
import { AmenityGrid } from "../components/AmenityGrid";
import { apiRequest } from "../components/api";
import { BookingForm } from "../components/BookingForm";
import { useAuth } from "../components/AuthContext";
import { RefreshCw, Plus } from "lucide-react";

const C = {
  bg:       "#FAFAFC",
  surface:  "#FFFFFF",
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
  red:      "#DC2626",
  redL:     "#FEF2F2",
  redBr:    "#FECACA",
  amber:    "#F59E0B",
  amberD:   "#D97706",
  amberL:   "#FFFBEB",
  amberBr:  "#FCD34D",
  green:    "#16A34A",
  greenL:   "#DCFCE7",
  orange:   "#E8890C",
  orangeL:  "#FFF8F0",
};

const DAY_KEYS = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];

function buildOperatingHours(open, close) {
  return DAY_KEYS.reduce((acc, day) => {
    acc[day] = { open, close };
    return acc;
  }, {});
}

const BOOKING_STATUS_CFG = {
  pending:   { color: C.amberD, bg: C.amberL,  border: C.amberBr },
  approved:  { color: C.green,  bg: C.greenL,  border: "#BBF7D0"  },
  rejected:  { color: C.red,    bg: C.redL,    border: C.redBr    },
  cancelled: { color: C.faint,  bg: "#F9FAFB", border: C.borderL  },
};

const staggerStats = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
};

const statVariant = {
  hidden:  { opacity: 0, y: 14, scale: 0.95 },
  visible: { opacity: 1, y: 0,  scale: 1,   transition: { duration: 0.42, ease: "easeOut" } },
};

const staggerBooks = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.055 } },
};

const bookItemVariant = {
  hidden:  { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0,   transition: { duration: 0.3, ease: "easeOut" } },
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,600&display=swap');

  .amn-root * { box-sizing: border-box; }

  .amn-root {
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: ${C.ink};
    background: ${C.bg};
    min-height: calc(100vh - 64px);
    padding: 22px 20px 78px;
    position: relative;
  }

  .amn-content {
    position: relative;
    z-index: 1;
    max-width: 1040px;
    margin: 0 auto;
  }

  .amn-hero {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    margin-bottom: 16px;
    background: transparent;
    border: none;
    box-shadow: none;
    padding: 0;
  }

  .amn-head-left {
    min-width: 0;
  }

  .amn-title {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: clamp(1.5rem, 2.8vw, 2.1rem);
    font-weight: 800;
    margin: 0;
    line-height: 1.15;
    color: ${C.ink};
    letter-spacing: -0.5px;
  }

  .amn-sub {
    margin-top: 8px;
    color: ${C.muted};
    font-size: 0.82rem;
    line-height: 1.6;
    max-width: 58ch;
  }

  .amn-actions {
    margin-top: 0;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
  }

  .amn-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    align-content: start;
    margin-bottom: 18px;
  }

  .amn-stat {
    border: 1px solid ${C.border};
    border-radius: 14px;
    background: ${C.surface};
    padding: 10px;
  }

  .amn-stat-num {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 1.6rem;
    line-height: 1;
    font-weight: 800;
    letter-spacing: -0.03em;
  }

  .amn-stat-lbl {
    margin-top: 4px;
    font-size: 0.74rem;
    color: ${C.faint};
    font-weight: 600;
  }

  .amn-block {
    background: ${C.surface};
    border: 1px solid ${C.border};
    border-radius: 18px;
    padding: 16px;
    box-shadow: 0 8px 24px rgba(28,28,30,0.05);
    margin-bottom: 18px;
  }

  .amn-section-title {
    margin: 0 0 14px;
    font-size: 1rem;
    font-weight: 700;
    color: ${C.ink};
    letter-spacing: -0.01em;
  }

  .amn-form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .amn-label {
    display: block;
    margin-bottom: 6px;
    color: ${C.muted};
    font-size: 0.78rem;
    font-weight: 600;
  }

  .amn-input {
    width: 100%;
    background: ${C.surface};
    border: 1px solid ${C.border};
    border-radius: 10px;
    padding: 10px 14px;
    color: ${C.ink};
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.875rem;
    outline: none;
    transition: border-color 0.18s, box-shadow 0.18s;
    box-sizing: border-box;
    resize: vertical;
  }

  .amn-input::placeholder { color: ${C.faint}; }

  .amn-input:focus {
    border-color: #C7C7CC;
    box-shadow: 0 0 0 3px rgba(232,137,12,0.1);
  }

  .amn-toggle {
    display: flex;
    align-items: center;
    gap: 10px;
    border: 1px solid ${C.border};
    border-radius: 10px;
    background: ${C.surface};
    color: ${C.muted};
    padding: 11px 14px;
    font-size: 0.84rem;
    font-weight: 600;
    cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }

  .amn-toggle input {
    width: 16px;
    height: 16px;
    accent-color: ${C.orange};
    margin: 0;
  }

  .amn-btn-primary,
  .amn-btn-ghost {
    position: relative;
    overflow: hidden;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    background: ${C.surface};
    border: 1px solid ${C.border};
    border-radius: 10px;
    padding: 9px 14px;
    color: ${C.ink};
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    transition: border-color 0.2s, color 0.2s, transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }

  .amn-btn-primary::after,
  .amn-btn-ghost::after {
    content: '';
    position: absolute;
    left: 8px;
    right: 8px;
    bottom: 0;
    height: 2px;
    border-radius: 999px;
    background: ${C.indigo};
    transform: scaleX(0.2);
    opacity: 0;
    transition: transform 0.2s ease, opacity 0.2s ease;
  }

  .amn-btn-primary:hover:not(:disabled),
  .amn-btn-ghost:hover:not(:disabled) {
    border-color: #C7C7CC;
    color: ${C.ink};
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(28,28,30,0.09);
  }

  .amn-btn-primary:hover:not(:disabled)::after,
  .amn-btn-ghost:hover:not(:disabled)::after {
    transform: scaleX(1);
    opacity: 1;
  }

  .amn-btn-primary:active:not(:disabled),
  .amn-btn-ghost:active:not(:disabled) {
    transform: scale(0.97);
  }

  .amn-btn-primary:disabled,
  .amn-btn-ghost:disabled {
    opacity: 0.45;
    cursor: not-allowed;
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
    border: 1px solid ${C.border};
    background: ${C.surface};
    cursor: default;
    will-change: transform;
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

  .amn-spinner {
    width: 13px;
    height: 13px;
    border: 2px solid rgba(28,28,30,0.2);
    border-top-color: ${C.ink};
    border-radius: 50%;
    animation: amn-spin 0.65s linear infinite;
    flex-shrink: 0;
  }

  @keyframes amn-spin { to { transform: rotate(360deg); } }

  @media (max-width: 960px) {
    .amn-hero { align-items: flex-start; }
    .amn-actions { margin-top: 2px; }
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
        body: { name, description, isAutoApprove, capacity: Number(capacity), photos, operatingHours: buildOperatingHours(openTime, closeTime) },
      });
      setAmenities((prev) => [...prev, data.item]);
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

  useEffect(() => { loadAll(); }, []);

  const ease = [0.25, 0.46, 0.45, 0.94];

  return (
    <>
      <style>{CSS}</style>
      <div className="amn-root">
        <div className="amn-content">

          {/* ── Hero ── */}
          <motion.section
            className="amn-hero"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease }}
          >
            <div className="amn-head-left">
              <h1 className="amn-title">Amenities</h1>
              <p className="amn-sub">Book shared facilities, track approvals, and manage society spaces in one place.</p>
            </div>

            <div className="amn-actions">
              <button className="amn-btn-ghost" onClick={loadAll} disabled={loading}>
                <RefreshCw size={13} style={{ animation: loading ? "amn-spin 1s linear infinite" : "none" }} />
                Refresh
              </button>
              {canManage && (
                <button className="amn-btn-primary" onClick={() => setShowCreateForm((v) => !v)}>
                  <Plus size={13} />
                  {showCreateForm ? "Close form" : "Add amenity"}
                </button>
              )}
            </div>
          </motion.section>

          <motion.div
            className="amn-stats"
            variants={staggerStats}
            initial="hidden"
            animate="visible"
          >
            <motion.div className="amn-stat" variants={statVariant}>
              <div className="amn-stat-num" style={{ color: C.indigo }}>{amenities.length}</div>
              <div className="amn-stat-lbl">Facilities</div>
            </motion.div>
            <motion.div className="amn-stat" variants={statVariant}>
              <div className="amn-stat-num" style={{ color: C.orange }}>{bookings.length}</div>
              <div className="amn-stat-lbl">My bookings</div>
            </motion.div>
            <motion.div className="amn-stat" variants={statVariant}>
              <div className="amn-stat-num" style={{ color: C.green }}>{pendingBookings.length}</div>
              <div className="amn-stat-lbl">Pending approvals</div>
            </motion.div>
          </motion.div>

          {/* ── Error banner ── */}
          <AnimatePresence>
            {error && (
              <motion.div
                key="error-banner"
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                transition={{ duration: 0.26 }}
                style={{
                  marginBottom: 14, padding: "11px 16px",
                  background: C.redL, border: `1px solid ${C.redBr}`,
                  borderRadius: 10, fontSize: "0.84rem",
                  color: C.red, fontWeight: 600, overflow: "hidden",
                }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Create Amenity form (animated toggle) ── */}
          <AnimatePresence>
            {canManage && showCreateForm && (
              <motion.div
                key="create-form"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease }}
                style={{ overflow: "hidden" }}
              >
                <section className="amn-block" style={{ position: "relative", overflow: "hidden" }}>
                  <div style={{
                    position: "absolute", top: 0, left: 0, right: 0, height: 3,
                    background: `linear-gradient(90deg, ${C.orange}, ${C.amberD})`,
                  }} />
                  <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: C.ink, margin: "0 0 14px", letterSpacing: "-0.02em" }}>
                    Add Amenity
                  </h2>

                  <form onSubmit={handleCreateAmenity} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div>
                      <label className="amn-label">Amenity name</label>
                      <input className="amn-input" placeholder="e.g. Swimming pool" value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>

                    <div>
                      <label className="amn-label">Description</label>
                      <textarea className="amn-input" style={{ minHeight: 82 }} placeholder="Tell residents about this facility" value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>

                    <div className="amn-form-grid">
                      <div>
                        <label className="amn-label">Capacity</label>
                        <input className="amn-input" type="number" min="1" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
                      </div>
                      <div>
                        <label className="amn-label">Approvals</label>
                        <label className="amn-toggle">
                          <input type="checkbox" checked={isAutoApprove} onChange={(e) => setIsAutoApprove(e.target.checked)} />
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
                      <input className="amn-input" type="file" accept="image/*" multiple onChange={(e) => setPhotoFiles(Array.from(e.target.files).slice(0, 5))} />
                      {photoFiles.length > 0 && (
                        <p style={{ fontSize: "0.78rem", color: C.faint, marginTop: 6 }}>
                          {photoFiles.length} file{photoFiles.length > 1 ? "s" : ""} selected
                        </p>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button className="amn-btn-primary" type="submit" disabled={isUploading}>
                        {isUploading
                          ? <><div className="amn-spinner" /> Uploading photos...</>
                          : <><Plus size={13} /> Add amenity</>
                        }
                      </button>
                      <button type="button" className="amn-btn-ghost" onClick={() => setShowCreateForm(false)}>
                        Cancel
                      </button>
                    </div>
                  </form>
                </section>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Available Facilities ── */}
          <motion.section
            className="amn-block"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.52, ease, delay: 0.12 }}
          >
            <h2 className="amn-section-title">Available facilities</h2>
            <AmenityGrid amenities={amenities} onBook={setActiveAmenity} />
          </motion.section>

          {/* ── My Bookings ── */}
          <AnimatePresence>
            {bookings.length > 0 && (
              <motion.section
                key="bookings-section"
                className="amn-block"
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.45, ease }}
              >
                <h2 className="amn-section-title">My bookings</h2>
                <motion.div
                  className="amn-book-list"
                  variants={staggerBooks}
                  initial="hidden"
                  animate="visible"
                >
                  {bookings.map((item) => {
                    const cfg = BOOKING_STATUS_CFG[item.status] || BOOKING_STATUS_CFG.pending;
                    return (
                      <motion.article
                        key={item._id}
                        className="amn-book-item"
                        variants={bookItemVariant}
                        whileHover={{
                          y: -2,
                          boxShadow: "0 14px 32px rgba(28,28,30,0.1)",
                          borderColor: "#C7C7CC",
                        }}
                        transition={{ duration: 0.18 }}
                      >
                        <div>
                          <p style={{ fontSize: "0.92rem", fontWeight: 700, color: C.ink, margin: "0 0 4px" }}>
                            {item.amenityId?.name || item.amenityName}
                          </p>
                          <p style={{ fontSize: "0.78rem", color: C.muted, margin: 0 }}>
                            {item.date} · {item.startTime}–{item.endTime}
                          </p>
                        </div>
                        <span className="amn-badge" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                          {item.status}
                        </span>
                      </motion.article>
                    );
                  })}
                </motion.div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* ── Pending Approvals ── */}
          <AnimatePresence>
            {canManage && pendingBookings.length > 0 && (
              <motion.section
                key="pending-section"
                className="amn-block"
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, ease }}
              >
                <h2 className="amn-section-title">Pending approvals ({pendingBookings.length})</h2>
                <AdminManager items={pendingBookings} onStatusUpdate={handleStatusUpdate} />
              </motion.section>
            )}
          </AnimatePresence>

        </div>

        <BookingForm
          amenity={activeAmenity}
          isOpen={Boolean(activeAmenity)}
          errorMessage={bookingError}
          isSubmitting={isBookingSubmitting}
          onClose={() => { setActiveAmenity(null); setBookingError(""); }}
          onSubmit={handleCreateBooking}
        />
      </div>
    </>
  );
}
