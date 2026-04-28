import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AdminManager } from "../components/AdminManager";
import { AmenityGrid } from "../components/AmenityGrid";
import { AmenityDetailModal } from "../components/AmenityDetailModal";
import { apiRequest } from "../components/api";
import { BookingForm } from "../components/BookingForm";
import { useAuth } from "../components/AuthContext";
import { RefreshCw, Plus } from "lucide-react";

/* ─── Design tokens ─────────────────────────────────────────── */
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
  return DAY_KEYS.reduce((acc, day) => { acc[day] = { open, close }; return acc; }, {});
}

const STATUS_CFG = {
  pending:   { dot: C.amber,  label: "Pending",   bg: C.amberL,  border: C.amberBr, text: C.amberD },
  approved:  { dot: C.green,  label: "Approved",  bg: C.greenL,  border: "#BBF7D0", text: C.green  },
  rejected:  { dot: C.red,    label: "Rejected",  bg: C.redL,    border: C.redBr,   text: C.red    },
  cancelled: { dot: C.faint,  label: "Cancelled", bg: "#F9FAFB", border: C.borderL, text: C.faint  },
};

const AMENITIES_CACHE_PREFIX = "apthive_amenities_page";
function getCacheKey(scope, tenantId) { return `${AMENITIES_CACHE_PREFIX}:${scope}:${tenantId || "default"}`; }
function readCachedItems(key) {
  try { const r = localStorage.getItem(key); if (!r) return []; const p = JSON.parse(r); return Array.isArray(p?.items) ? p.items : []; } catch { return []; }
}
function writeCachedItems(key, items) {
  try { localStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), items })); } catch {}
}

/* ─── CSS ────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,600&display=swap');

  .amn-root * { box-sizing: border-box; }

  .amn-root {
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: ${C.ink};
    background: ${C.bg};
    min-height: calc(100vh - 64px);
    padding: 24px 24px 80px;
  }

  .amn-shell { max-width: 1200px; margin: 0 auto; }

  .amn-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    margin-bottom: 24px;
  }

  .amn-title {
    margin: 0;
    font-size: clamp(1.5rem, 2.8vw, 2.1rem);
    font-weight: 800;
    line-height: 1.12;
    color: ${C.ink};
    letter-spacing: -0.04em;
  }

  .amn-sub {
    margin: 6px 0 0;
    color: ${C.muted};
    font-size: 0.84rem;
    font-weight: 500;
    line-height: 1.55;
  }

  .amn-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }

  .amn-btn {
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
    transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    white-space: nowrap;
  }

  .amn-btn::after {
    content: '';
    position: absolute;
    left: 8px; right: 8px; bottom: 0;
    height: 2px; border-radius: 999px;
    background: ${C.indigo};
    transform: scaleX(0.2); opacity: 0;
    transition: transform 0.2s ease, opacity 0.2s ease;
  }

  .amn-btn:hover:not(:disabled) { border-color: #C7C7CC; transform: translateY(-1px); box-shadow: 0 6px 16px rgba(28,28,30,0.09); }
  .amn-btn:hover:not(:disabled)::after { transform: scaleX(1); opacity: 1; }
  .amn-btn:active:not(:disabled) { transform: scale(0.97); }
  .amn-btn:disabled { opacity: 0.45; cursor: not-allowed; }

  /* Tabs */
  .amn-tabs {
    display: flex; gap: 12px; align-items: center; margin: 8px 0 20px;
  }
  .amn-tab-btn {
    background: transparent; border: none; padding: 8px 12px; cursor: pointer; font-weight: 700; color: ${C.muted}; font-size: 0.95rem; border-radius: 8px;
  }
  .amn-tab-btn[aria-current="true"] { color: ${C.ink}; }
  .amn-tab-rail { position: relative; height: 32px; }

  /* Main content becomes full width */
  .amn-main { width: 100%; }

  .amn-section-head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 14px;
  }

  .amn-section-title {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 800;
    color: ${C.ink};
    letter-spacing: -0.01em;
  }

  .amn-count-pill {
    display: inline-flex;
    align-items: center;
    padding: 2px 9px;
    border-radius: 99px;
    font-size: 0.66rem;
    font-weight: 800;
    letter-spacing: 0.04em;
  }

  .amn-block {
    background: ${C.surface};
    border: 1px solid ${C.border};
    border-radius: 18px;
    padding: 16px;
    box-shadow: 0 2px 8px rgba(28,28,30,0.04);
    margin-bottom: 16px;
  }
  .amn-block:last-child { margin-bottom: 0; }

  .amn-sidebar {
    position: sticky;
    top: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* Digital passbook ticket */
  .amn-ticket {
    display: flex; align-items: stretch; border-radius: 13px; overflow: visible; background: ${C.surface}; margin-bottom: 12px; position: relative;
    box-shadow: 0 10px 30px rgba(28,28,30,0.06); padding: 0; border: none;
  }
  .amn-ticket:last-child { margin-bottom: 0; }
  .amn-ticket::before,
  .amn-ticket::after {
    content: '';
    position: absolute; top: 50%; width: 28px; height: 28px; transform: translateY(-50%);
    background: ${C.bg}; border-radius: 50%; z-index: 1;
  }
  .amn-ticket::before { left: -14px; }
  .amn-ticket::after  { right: -14px; }

  .amn-ticket-strip { width: 6px; flex-shrink: 0; border-radius: 0 6px 6px 0; }

  .amn-ticket-divider {
    width: 1px; background: linear-gradient(180deg, transparent 0%, ${C.border} 40%, ${C.border} 60%, transparent 100%);
    margin: 12px 0; flex-shrink: 0; border-style: dashed; border-left: 1px dashed ${C.border};
  }

  .amn-ticket-date {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 10px 12px;
    min-width: 52px;
    text-align: center;
    flex-shrink: 0;
  }

  .amn-ticket-day { font-size: 1.3rem; font-weight: 800; line-height: 1; letter-spacing: -0.03em; color: ${C.ink}; }
  .amn-ticket-month { font-size: 0.55rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: ${C.faint}; margin-top: 2px; }

  .amn-ticket-body {
    flex: 1;
    min-width: 0;
    padding: 18px 20px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 6px;
  }

  .amn-ticket-name { font-size: 1rem; font-weight: 800; color: ${C.ink}; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .amn-ticket-time { font-size: 0.82rem; font-weight: 600; color: ${C.muted}; margin: 0; }

  .amn-ticket-status { flex-shrink: 0; display: flex; align-items: center; padding: 0 12px 0 8px; }

  .amn-status-badge {
    padding: 3px 9px;
    border-radius: 99px;
    font-size: 0.65rem;
    font-weight: 800;
    text-transform: capitalize;
    letter-spacing: 0.04em;
    border: 1px solid transparent;
  }

  /* Create form */
  .amn-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

  .amn-label {
    display: block; margin-bottom: 5px;
    color: ${C.muted}; font-size: 0.72rem; font-weight: 700;
    letter-spacing: 0.07em; text-transform: uppercase;
  }

  .amn-input {
    width: 100%; background: ${C.bg}; border: 1px solid ${C.border};
    border-radius: 10px; padding: 10px 13px; color: ${C.ink};
    font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.875rem;
    outline: none; transition: border-color 0.18s, box-shadow 0.18s; resize: vertical;
  }
  .amn-input::placeholder { color: ${C.faint}; }
  .amn-input:focus { border-color: ${C.indigoBr}; box-shadow: 0 0 0 3px rgba(79,70,229,0.1); background: ${C.surface}; }

  .amn-toggle {
    display: flex; align-items: center; gap: 10px;
    border: 1px solid ${C.border}; border-radius: 10px;
    background: ${C.bg}; color: ${C.muted};
    padding: 10px 13px; font-size: 0.84rem; font-weight: 600;
    cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; width: 100%;
  }
  .amn-toggle input { width: 16px; height: 16px; accent-color: ${C.indigo}; margin: 0; flex-shrink: 0; }

  .amn-error {
    padding: 11px 16px; background: ${C.redL}; border: 1px solid ${C.redBr};
    border-radius: 10px; font-size: 0.83rem; color: ${C.red}; font-weight: 600; margin-bottom: 16px;
  }

  .amn-empty {
    border-radius: 12px; border: 1.5px dashed ${C.border}; padding: 24px 16px;
    text-align: center; color: ${C.faint}; font-size: 0.8rem; font-weight: 600;
  }

  .amn-spinner {
    width: 13px; height: 13px;
    border: 2px solid rgba(28,28,30,0.15); border-top-color: ${C.ink};
    border-radius: 50%; animation: amn-spin 0.65s linear infinite; flex-shrink: 0;
  }
  @keyframes amn-spin { to { transform: rotate(360deg); } }

  /* Passes grid */
  .amn-passes-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 16px;
    align-items: start;
  }

  @media (max-width: 900px) {
    .amn-layout { grid-template-columns: 1fr; }
    .amn-sidebar { position: static; }
  }

  @media (max-width: 640px) {
    .amn-root { padding: 16px 14px 64px; }
    .amn-form-grid { grid-template-columns: 1fr; }
    .amn-header { align-items: flex-start; }
  }
`;

/* ─── Passbook ticket ───────────────────────────────────────── */
function BookingTicket({ item }) {
  const cfg = STATUS_CFG[item.status] || STATUS_CFG.pending;
  const dateObj = item.date ? new Date(`${item.date}T00:00:00`) : null;
  const day   = dateObj ? dateObj.getDate() : "—";
  const month = dateObj ? dateObj.toLocaleDateString("en-US", { month: "short" }) : "";
  return (
    <div className="amn-ticket">
      <div className="amn-ticket-strip" style={{ background: cfg.dot }} />
      <div className="amn-ticket-date">
        <span className="amn-ticket-day">{day}</span>
        <span className="amn-ticket-month">{month}</span>
      </div>
      <div className="amn-ticket-divider" />
      <div className="amn-ticket-body">
        <p className="amn-ticket-name">{item.amenityId?.name || item.amenityName || "Facility"}</p>
        <p className="amn-ticket-time">{item.startTime} – {item.endTime}</p>
      </div>
      <div className="amn-ticket-status">
        <span className="amn-status-badge" style={{ background: cfg.bg, color: cfg.text, borderColor: cfg.border }}>
          {cfg.label}
        </span>
      </div>
    </div>
  );
}

/* ─── Section header with count pill ────────────────────────── */
function SectionHead({ title, count, pillBg, pillColor }) {
  return (
    <div className="amn-section-head">
      <h2 className="amn-section-title">{title}</h2>
      {count > 0 && (
        <span className="amn-count-pill" style={{ background: pillBg, color: pillColor }}>{count}</span>
      )}
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────── */
export function AmenitiesPage() {
  const { token, user } = useAuth();
  const tenantScope = String(user?.tenantId || "default");
  const amenitiesCacheKey = getCacheKey("amenities", tenantScope);
  const bookingsCacheKey  = getCacheKey("bookings",  tenantScope);

  const [amenities,          setAmenities]          = useState(() => readCachedItems(amenitiesCacheKey));
  const [myBookings,         setMyBookings]         = useState(() => readCachedItems(bookingsCacheKey));
  const [allBookings,        setAllBookings]        = useState([]);
  const [activeAmenity,      setActiveAmenity]      = useState(null);   // booking form
  const [viewingAmenity,     setViewingAmenity]     = useState(null);   // detail modal
  const [editingAmenity,     setEditingAmenity]     = useState(null);   // edit drawer
  const [isBookingSubmitting,setIsBookingSubmitting]= useState(false);
  const [bookingError,       setBookingError]       = useState("");
  const [error,              setError]              = useState("");
  const [loading,            setLoading]            = useState(false);
  const [showCreateDrawer,   setShowCreateDrawer]   = useState(false);
  const [activeTab,          setActiveTab]          = useState("explore");
  const [editSaving,         setEditSaving]         = useState(false);
  const [editPhotoFiles,     setEditPhotoFiles]     = useState([]);
  const [editUploading,      setEditUploading]      = useState(false);

  const [name,         setName]         = useState("");
  const [description,  setDescription]  = useState("");
  const [capacity,     setCapacity]     = useState(1);
  const [isAutoApprove,setIsAutoApprove]= useState(false);
  const [openTime,     setOpenTime]     = useState("06:00");
  const [closeTime,    setCloseTime]    = useState("22:00");
  const [photoFiles,   setPhotoFiles]   = useState([]);
  const [isUploading,  setIsUploading]  = useState(false);

  const canManage       = useMemo(() => ["committee","super_admin"].includes(user?.role), [user?.role]);
  const pendingBookings = useMemo(() => allBookings.filter(b => b.status === "pending"), [allBookings]);

  /* Edit form state (seeded when drawer opens) */
  const [editForm, setEditForm] = useState({});
  function openEdit(amenity) {
    setEditForm({
      name:         amenity.name,
      description:  amenity.description || "",
      capacity:     amenity.capacity,
      isAutoApprove:amenity.isAutoApprove,
      openTime:     amenity.operatingHours?.monday?.open  || "06:00",
      closeTime:    amenity.operatingHours?.monday?.close || "22:00",
      photos:       amenity.photos || [],
    });
    setEditPhotoFiles([]);
    setViewingAmenity(null);
    setEditingAmenity(amenity);
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    setError(""); setEditSaving(true);
    try {
      let photos = [...editForm.photos];
      if (editPhotoFiles.length > 0) {
        setEditUploading(true);
        const fd = new FormData();
        editPhotoFiles.forEach(f => fd.append("photos", f));
        const upload = await apiRequest("/amenities/upload-photos", { method: "POST", token, formData: fd });
        photos = [...photos, ...(upload.urls || [])];
        setEditUploading(false);
      }
      const operatingHours = DAY_KEYS.reduce((acc, day) => {
        acc[day] = { open: editForm.openTime, close: editForm.closeTime };
        return acc;
      }, {});
      const { item } = await apiRequest(`/amenities/${editingAmenity._id}`, {
        method: "PATCH", token,
        body: {
          name:         editForm.name.trim(),
          description:  editForm.description.trim(),
          capacity:     Number(editForm.capacity),
          isAutoApprove:editForm.isAutoApprove,
          photos,
          operatingHours,
        },
      });
      setAmenities(prev => { const next = prev.map(a => a._id === item._id ? item : a); writeCachedItems(amenitiesCacheKey, next); return next; });
      setEditingAmenity(null);
    } catch (err) { setError(err.message); }
    finally { setEditSaving(false); setEditUploading(false); }
  }

  function removeEditPhoto(url) {
    setEditForm(prev => ({ ...prev, photos: prev.photos.filter(p => p !== url) }));
  }

  async function loadAmenities() {
    const data = await apiRequest("/amenities", { token });
    const next = data.items || [];
    setAmenities(next); writeCachedItems(amenitiesCacheKey, next);
  }

  async function loadMyBookings() {
    const data = await apiRequest("/amenities/bookings/mine", { token });
    const next = data.items || [];
    setMyBookings(next); writeCachedItems(bookingsCacheKey, next);
  }

  async function loadAllBookings() {
    const data = await apiRequest("/amenities/bookings", { token });
    setAllBookings(data.items || []);
  }

  async function loadAll() {
    setError(""); setLoading(true);
    try {
      const tasks = [loadAmenities(), loadMyBookings()];
      if (canManage) tasks.push(loadAllBookings());
      await Promise.all(tasks);
    }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function handleCreateAmenity(event) {
    event.preventDefault(); setError("");
    try {
      let photos = [];
      if (photoFiles.length > 0) {
        setIsUploading(true);
        const fd = new FormData();
        photoFiles.forEach(f => fd.append("photos", f));
        const upload = await apiRequest("/amenities/upload-photos", { method: "POST", token, formData: fd });
        photos = upload.urls || [];
        setIsUploading(false);
      }
      const data = await apiRequest("/amenities", {
        method: "POST", token,
        body: { name, description, isAutoApprove, capacity: Number(capacity), photos, operatingHours: buildOperatingHours(openTime, closeTime) },
      });
      setAmenities(prev => { const next = [...prev, data.item]; writeCachedItems(amenitiesCacheKey, next); return next; });
      setName(""); setDescription(""); setCapacity(1); setIsAutoApprove(false);
      setOpenTime("06:00"); setCloseTime("22:00"); setPhotoFiles([]);
      setShowCreateDrawer(false);
    } catch (err) { setIsUploading(false); setError(err.message); }
  }

  async function handleCreateBooking(payload) {
    setBookingError(""); setError(""); setIsBookingSubmitting(true);
    try {
      const data = await apiRequest("/amenities/bookings", { method: "POST", token, body: payload });
      setMyBookings(prev => { const next = [data.item, ...prev]; writeCachedItems(bookingsCacheKey, next); return next; });
      if (canManage) setAllBookings(prev => [data.item, ...prev]);
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
      setMyBookings(prev => { const next = prev.map(i => i._id === bookingId ? data.item : i); writeCachedItems(bookingsCacheKey, next); return next; });
      setAllBookings(prev => prev.map(i => i._id === bookingId ? data.item : i));
    } catch (err) { setError(err.message); }
  }

  useEffect(() => { loadAll(); }, []);

  const ease = [0.25, 0.46, 0.45, 0.94];

  return (
    <>
      <style>{CSS}</style>
      <div className="amn-root">
        <div className="amn-shell">

          {/* Header */}
          <motion.div className="amn-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}>
            <div>
              <h1 className="amn-title">Amenities</h1>
              <p className="amn-sub">Book shared facilities and track your reservations.</p>
            </div>
          </motion.div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div key="err" className="amn-error"
                initial={{ opacity: 0, y: -6, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.24 }} style={{ overflow: "hidden" }}>
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tabs + Main content */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 8, position: 'relative', borderBottom: `1.5px solid ${C.border}`, paddingBottom: 0 }}>
                {['explore','passes', ...(canManage?['admin']:[])].map(tab => {
                  const isActive = activeTab === tab;
                  const label = tab==='explore'?'Explore':tab==='passes'?'My Passes':'Admin';
                  return (
                    <div key={tab} style={{ position: 'relative' }}>
                      <motion.button
                        className="amn-tab-btn"
                        onClick={() => setActiveTab(tab)}
                        animate={{ color: isActive ? C.ink : C.muted }}
                        variants={!isActive ? { "tab-hover": { color: C.ink2 } } : {}}
                        whileHover="tab-hover"
                        whileTap={{ scale: 0.96 }}
                        transition={{ color: { duration: 0.14 } }}
                      >{label}</motion.button>
                      {isActive && (
                        <motion.div
                          layoutId="amn-tab-underline"
                          style={{ position: 'absolute', bottom: -1.5, left: 8, right: 8, height: 2, background: C.indigo, borderRadius: '2px 2px 0 0' }}
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="amn-btn" onClick={loadAll} disabled={loading}>
                  <RefreshCw size={13} style={{ animation: loading ? "amn-spin 1s linear infinite" : "none" }} /> Refresh
                </button>
                {canManage && (
                  <button className="amn-btn" onClick={() => setShowCreateDrawer(v => !v)}>
                    <Plus size={13} /> {showCreateDrawer ? 'Cancel' : 'Add Amenity'}
                  </button>
                )}
              </div>
            </div>

            {activeTab === 'explore' && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease, delay: 0.06 }}>
                <div className="amn-block" style={{ paddingBottom: 8 }}>
                  <SectionHead title="Available Facilities" count={amenities.length} pillBg={C.indigoL} pillColor={C.indigo} />
                  <AmenityGrid
                    amenities={amenities}
                    onView={setViewingAmenity}
                    onBook={amenity => { setViewingAmenity(null); setActiveAmenity(amenity); }}
                    onEdit={canManage ? openEdit : undefined}
                    isLoading={loading && amenities.length === 0}
                  />
                </div>
              </motion.div>
            )}

            {activeTab === 'passes' && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.36 }}>
                <div className="amn-block">
                  <SectionHead title="My Passes" count={myBookings.length} pillBg={C.amberL} pillColor={C.amberD} />
                  {myBookings.length === 0 ? (
                    <div className="amn-empty">No bookings yet.</div>
                  ) : (
                    <div className="amn-passes-grid">
                      {myBookings.map((item) => (
                        <BookingTicket key={item._id} item={item} />
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'admin' && canManage && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.36 }}>
                <div className="amn-block" style={{ borderTop: `3px solid ${C.amber}` }}>
                  <SectionHead title="Pending Approvals" count={pendingBookings.length} pillBg={C.amberL} pillColor={C.amberD} />
                  <AdminManager items={pendingBookings} onStatusUpdate={handleStatusUpdate} />
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Amenity detail modal */}
        <AnimatePresence>
          {viewingAmenity && (
            <AmenityDetailModal
              key={viewingAmenity._id}
              amenity={viewingAmenity}
              canManage={canManage}
              onClose={() => setViewingAmenity(null)}
              onBook={amenity => { setViewingAmenity(null); setActiveAmenity(amenity); }}
              onEdit={openEdit}
            />
          )}
        </AnimatePresence>

        {/* Edit amenity drawer */}
        <AnimatePresence>
          {editingAmenity && (
            <>
              <motion.div
                key="edit-backdrop"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setEditingAmenity(null)}
                style={{ position: "fixed", inset: 0, background: "rgba(28,28,30,0.2)", backdropFilter: "blur(8px)", zIndex: 400 }}
              />
              <motion.aside
                key="edit-drawer"
                initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                style={{
                  position: "fixed", top: 0, right: 0, bottom: 0,
                  width: "min(500px, 100%)", background: C.surface,
                  borderLeft: `1px solid ${C.border}`,
                  boxShadow: "-20px 0 50px rgba(28,28,30,0.1)",
                  zIndex: 410, overflowY: "auto",
                  padding: "28px 28px 40px",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 22 }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 800, color: C.ink, letterSpacing: "-0.03em" }}>Edit Amenity</h2>
                    <p style={{ margin: "5px 0 0", fontSize: "0.83rem", color: C.muted, fontWeight: 500 }}>{editingAmenity.name}</p>
                  </div>
                  <button onClick={() => setEditingAmenity(null)} style={{ width: 34, height: 34, borderRadius: "50%", border: `1px solid ${C.border}`, background: C.bg, color: C.muted, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                    ×
                  </button>
                </div>

                <form onSubmit={handleSaveEdit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label className="amn-label">Name</label>
                    <input className="amn-input" value={editForm.name || ""} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="amn-label">Description</label>
                    <textarea className="amn-input" rows={3} style={{ minHeight: 72 }} value={editForm.description || ""} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} />
                  </div>
                  <div className="amn-form-grid">
                    <div>
                      <label className="amn-label">Capacity</label>
                      <input className="amn-input" type="number" min="1" value={editForm.capacity || 1} onChange={e => setEditForm(p => ({ ...p, capacity: e.target.value }))} />
                    </div>
                    <div>
                      <label className="amn-label">Approval</label>
                      <label className="amn-toggle">
                        <input type="checkbox" checked={editForm.isAutoApprove || false} onChange={e => setEditForm(p => ({ ...p, isAutoApprove: e.target.checked }))} />
                        {editForm.isAutoApprove ? "Auto-approved" : "Manual approval"}
                      </label>
                    </div>
                  </div>
                  <div className="amn-form-grid">
                    <div>
                      <label className="amn-label">Opens at</label>
                      <input className="amn-input" type="time" value={editForm.openTime || "06:00"} onChange={e => setEditForm(p => ({ ...p, openTime: e.target.value }))} />
                    </div>
                    <div>
                      <label className="amn-label">Closes at</label>
                      <input className="amn-input" type="time" value={editForm.closeTime || "22:00"} onChange={e => setEditForm(p => ({ ...p, closeTime: e.target.value }))} />
                    </div>
                  </div>

                  {/* Existing photos */}
                  {editForm.photos?.length > 0 && (
                    <div>
                      <label className="amn-label">Current Photos</label>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                        {editForm.photos.map(url => (
                          <div key={url} style={{ position: "relative", width: 72, height: 72 }}>
                            <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 10, border: `1px solid ${C.border}` }} />
                            <button
                              type="button"
                              onClick={() => removeEditPhoto(url)}
                              style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", border: "none", background: C.red, color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add new photos */}
                  <div>
                    <label className="amn-label">Add Photos</label>
                    <input className="amn-input" type="file" accept="image/*" multiple onChange={e => setEditPhotoFiles(Array.from(e.target.files).slice(0, 5))} />
                    {editPhotoFiles.length > 0 && <p style={{ fontSize: "0.75rem", color: C.faint, marginTop: 4 }}>{editPhotoFiles.length} new file{editPhotoFiles.length > 1 ? "s" : ""} to upload</p>}
                  </div>

                  <button type="submit" className="amn-btn" disabled={editSaving} style={{ marginTop: 4, justifyContent: "center" }}>
                    {editUploading ? "Uploading photos…" : editSaving ? "Saving…" : "Save Changes"}
                  </button>
                </form>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Create amenity drawer */}
        <AnimatePresence>
          {canManage && showCreateDrawer && (
            <>
              <motion.div
                key="create-backdrop"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setShowCreateDrawer(false)}
                style={{ position: "fixed", inset: 0, background: "rgba(28,28,30,0.2)", backdropFilter: "blur(8px)", zIndex: 400 }}
              />
              <motion.aside
                key="create-drawer"
                initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                style={{
                  position: "fixed", top: 0, right: 0, bottom: 0,
                  width: "min(500px, 100%)", background: C.surface,
                  borderLeft: `1px solid ${C.border}`,
                  boxShadow: "-20px 0 50px rgba(28,28,30,0.1)",
                  zIndex: 410, overflowY: "auto",
                  padding: "28px 28px 40px",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 22 }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 800, color: C.ink, letterSpacing: "-0.03em" }}>Add Amenity</h2>
                    <p style={{ margin: "5px 0 0", fontSize: "0.83rem", color: C.muted, fontWeight: 500 }}>Create a new facility for residents</p>
                  </div>
                  <button onClick={() => setShowCreateDrawer(false)} style={{ width: 34, height: 34, borderRadius: "50%", border: `1px solid ${C.border}`, background: C.bg, color: C.muted, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                    ×
                  </button>
                </div>

                <form onSubmit={handleCreateAmenity} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <label className="amn-label">Name</label>
                    <input className="amn-input" placeholder="e.g. Swimming pool" value={name} onChange={e => setName(e.target.value)} required />
                  </div>
                  <div>
                    <label className="amn-label">Description</label>
                    <textarea className="amn-input" style={{ minHeight: 76 }} placeholder="Tell residents about this facility" value={description} onChange={e => setDescription(e.target.value)} />
                  </div>
                  <div className="amn-form-grid">
                    <div>
                      <label className="amn-label">Capacity</label>
                      <input className="amn-input" type="number" min="1" value={capacity} onChange={e => setCapacity(e.target.value)} />
                    </div>
                    <div>
                      <label className="amn-label">Approval</label>
                      <label className="amn-toggle">
                        <input type="checkbox" checked={isAutoApprove} onChange={e => setIsAutoApprove(e.target.checked)} />
                        {isAutoApprove ? "Auto-approved" : "Manual approval"}
                      </label>
                    </div>
                  </div>
                  <div className="amn-form-grid">
                    <div>
                      <label className="amn-label">Opens at</label>
                      <input className="amn-input" type="time" value={openTime} onChange={e => setOpenTime(e.target.value)} />
                    </div>
                    <div>
                      <label className="amn-label">Closes at</label>
                      <input className="amn-input" type="time" value={closeTime} onChange={e => setCloseTime(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="amn-label">Photos (up to 5)</label>
                    <input className="amn-input" type="file" accept="image/*" multiple onChange={e => setPhotoFiles(Array.from(e.target.files).slice(0, 5))} />
                    {photoFiles.length > 0 && <p style={{ fontSize: "0.75rem", color: C.faint, marginTop: 5 }}>{photoFiles.length} file{photoFiles.length > 1 ? "s" : ""} selected</p>}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="amn-btn" type="submit" disabled={isUploading}>
                      {isUploading ? <><div className="amn-spinner" /> Uploading…</> : <><Plus size={13} /> Add amenity</>}
                    </button>
                    <button type="button" className="amn-btn" onClick={() => setShowCreateDrawer(false)}>Cancel</button>
                  </div>
                </form>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* BookingForm — layoutId morphs from the clicked card */}
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
