import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../components/api";
import { useAuth } from "../components/AuthContext";

const APPROVER_STATUSES = ["approved", "rejected", "cancelled"];

function resolveId(entity) {
  if (!entity) return "";
  return entity._id || entity.id || "";
}

export function AmenitiesPage() {
  const { token, user } = useAuth();
  const [items, setItems] = useState([]);
  const [amenityName, setAmenityName] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [error, setError] = useState("");

  const isApprover = useMemo(
    () => ["committee", "super_admin"].includes(user?.role),
    [user?.role]
  );

  async function loadItems() {
    setError("");
    try {
      const data = await apiRequest("/amenities/bookings", { token });
      setItems(data.items || []);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreate(event) {
    event.preventDefault();
    setError("");

    try {
      const data = await apiRequest("/amenities/bookings", {
        method: "POST",
        token,
        body: { amenityName, date, startTime, endTime }
      });

      setItems((prev) => [...prev, data.item]);
      setAmenityName("");
      setDate("");
      setStartTime("");
      setEndTime("");
    } catch (err) {
      setError(err.message);
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

      setItems((prev) => prev.map((item) => (item._id === bookingId ? data.item : item)));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  return (
    <section className="panel space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Amenities</h2>
        <button className="btn-muted" onClick={loadItems}>Refresh</button>
      </div>

      {error ? <p className="rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-800">{error}</p> : null}

      <form onSubmit={handleCreate} className="space-y-2 rounded-xl border border-slate-200 p-4">
        <input className="field" placeholder="Amenity name (Gym, Pool...)" value={amenityName} onChange={(e) => setAmenityName(e.target.value)} />
        <input className="field" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <input className="field" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        <input className="field" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        <button className="btn-primary" type="submit">Book amenity</button>
      </form>

      <div className="space-y-3">
        {!items.length ? <p className="text-sm text-slate-500">No bookings found.</p> : null}
        {items.map((item) => {
          const isRequester = resolveId(item.requestedBy) === (user?.id || user?._id);
          return (
            <article key={item._id} className="rounded-xl border border-slate-200 p-4">
              <h3 className="font-semibold">{item.amenityName}</h3>
              <p className="mt-1 text-sm text-slate-700">{item.date} • {item.startTime} to {item.endTime}</p>
              <p className="mt-2 text-xs text-slate-500">Status: {item.status}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                {isApprover ? APPROVER_STATUSES.map((status) => (
                  <button key={status} className="btn-muted" type="button" onClick={() => handleStatusUpdate(item._id, status)}>
                    Set {status}
                  </button>
                )) : null}

                {!isApprover && isRequester && item.status !== "cancelled" ? (
                  <button className="btn-danger" type="button" onClick={() => handleStatusUpdate(item._id, "cancelled")}>Cancel</button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
