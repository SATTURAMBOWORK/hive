import { useEffect, useMemo, useState } from "react";
import { AdminManager } from "../components/AdminManager";
import { AmenityGrid } from "../components/AmenityGrid";
import { apiRequest } from "../components/api";
import { BookingForm } from "../components/BookingForm";
import { useAuth } from "../components/AuthContext";

const DAY_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday"
];

function buildOperatingHours(open, close) {
  return DAY_KEYS.reduce((acc, day) => {
    acc[day] = { open, close };
    return acc;
  }, {});
}

export function AmenitiesPage() {
  const { token, user } = useAuth();
  const [amenities, setAmenities] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [activeAmenity, setActiveAmenity] = useState(null);
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [capacity, setCapacity] = useState(1);
  const [isAutoApprove, setIsAutoApprove] = useState(false);
  const [openTime, setOpenTime] = useState("06:00");
  const [closeTime, setCloseTime] = useState("22:00");
  const [photoFiles, setPhotoFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const canManage = useMemo(
    () => ["committee", "super_admin"].includes(user?.role),
    [user?.role]
  );

  const pendingBookings = useMemo(
    () => bookings.filter((booking) => booking.status === "pending"),
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
        photoFiles.forEach((file) => fd.append("photos", file));
        const uploadData = await apiRequest("/amenities/upload-photos", {
          method: "POST",
          token,
          formData: fd
        });
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
          operatingHours: buildOperatingHours(openTime, closeTime)
        }
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
      const data = await apiRequest("/amenities/bookings", {
        method: "POST",
        token,
        body: payload
      });

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
      const data = await apiRequest(`/amenities/bookings/${bookingId}/status`, {
        method: "PATCH",
        token,
        body: { status }
      });

      setBookings((prev) => prev.map((item) => (item._id === bookingId ? data.item : item)));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  return (
    <section className="space-y-5">
      <div className="panel flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Amenity Management</h2>
        <button className="btn-muted" onClick={loadAll}>Refresh</button>
      </div>

      {error ? <p className="rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-800">{error}</p> : null}

      {canManage ? (
        <form className="panel space-y-3" onSubmit={handleCreateAmenity}>
          <h3 className="text-lg font-semibold">Create Amenity (Admin)</h3>
          <input className="field" placeholder="Amenity name" value={name} onChange={(e) => setName(e.target.value)} required />
          <textarea className="field min-h-24" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <div className="grid gap-3 md:grid-cols-2">
            <input className="field" type="number" min="1" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
            <label className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">
              <input checked={isAutoApprove} onChange={(e) => setIsAutoApprove(e.target.checked)} type="checkbox" />
              Auto-approve bookings
            </label>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <input className="field" type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)} />
            <input className="field" type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Photos <span className="text-slate-400 font-normal">(up to 5, max 5 MB each)</span>
            </label>
            <input
              className="field"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setPhotoFiles(Array.from(e.target.files).slice(0, 5))}
            />
            {photoFiles.length > 0 && (
              <p className="mt-1.5 text-xs text-slate-500">{photoFiles.length} file{photoFiles.length > 1 ? "s" : ""} selected</p>
            )}
          </div>
          <button className="btn-primary" type="submit" disabled={isUploading}>
            {isUploading ? "Uploading photos…" : "Create Amenity"}
          </button>
        </form>
      ) : null}

      <section className="panel space-y-3">
        <h3 className="text-lg font-semibold">Amenities</h3>
        <AmenityGrid amenities={amenities} onBook={setActiveAmenity} />
      </section>

      <section className="panel space-y-3">
        <h3 className="text-lg font-semibold">My Society Bookings</h3>
        {!bookings.length ? <p className="text-sm text-slate-500">No bookings yet.</p> : null}
        {bookings.map((item) => (
          <article key={item._id} className="rounded-xl border border-slate-200 p-4">
            <h4 className="font-semibold text-slate-900">{item.amenityId?.name || item.amenityName}</h4>
            <p className="mt-1 text-sm text-slate-600">
              {item.date} • {item.startTime}-{item.endTime}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Status: {item.status} • Resident: {item.residentId?.fullName || item.requestedBy?.fullName || "Resident"}
            </p>
          </article>
        ))}
      </section>

      {canManage ? (
        <section className="panel space-y-3">
          <h3 className="text-lg font-semibold">Pending Approval Queue</h3>
          <AdminManager items={pendingBookings} onStatusUpdate={handleStatusUpdate} />
        </section>
      ) : null}

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
    </section>
  );
}
