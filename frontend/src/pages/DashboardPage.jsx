import { useEffect, useState } from "react";
import { apiRequest } from "../components/api";
import { useAuth } from "../components/AuthContext";
import { getSocket, joinTenantRoom, leaveTenantRoom } from "../components/socket";

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export function DashboardPage() {
  const { user, token } = useAuth();
  const role = user?.role;
  const canManageAnnouncements = role === "committee" || role === "super_admin";
  const canUpdateTicketStatus = role === "committee" || role === "staff" || role === "super_admin";
  const canManageEvents = role === "committee" || role === "super_admin";
  const canApproveAmenities = role === "committee" || role === "super_admin";

  const [socketState, setSocketState] = useState("disconnected");
  const [error, setError] = useState("");

  const [announcements, setAnnouncements] = useState([]);
  const [announcementForm, setAnnouncementForm] = useState({ title: "", body: "" });

  const [tickets, setTickets] = useState([]);
  const [ticketForm, setTicketForm] = useState({ title: "", description: "", category: "general" });

  const [events, setEvents] = useState([]);
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    location: "Club House",
    startAt: "",
    endAt: ""
  });

  const [bookings, setBookings] = useState([]);
  const [bookingForm, setBookingForm] = useState({
    amenityName: "Club House",
    date: "",
    startTime: "",
    endTime: ""
  });

  async function loadAnnouncements() {
    const data = await apiRequest("/announcements", { token });
    setAnnouncements(data.items || []);
  }

  async function loadTickets() {
    const data = await apiRequest("/tickets", { token });
    setTickets(data.items || []);
  }

  async function loadEvents() {
    const data = await apiRequest("/events", { token });
    setEvents(data.items || []);
  }

  async function loadBookings() {
    const data = await apiRequest("/amenities/bookings", { token });
    setBookings(data.items || []);
  }

  async function loadAll() {
    try {
      setError("");
      await Promise.all([loadAnnouncements(), loadTickets(), loadEvents(), loadBookings()]);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    if (!token) return;
    loadAll();
  }, [token]);

  useEffect(() => {
    if (!user?.tenantId) return;

    const socket = getSocket();

    function onConnect() {
      setSocketState("connected");
      joinTenantRoom(user.tenantId);
    }

    function onDisconnect() {
      setSocketState("disconnected");
    }

    function onDataChanged() {
      loadAll();
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("announcement:created", onDataChanged);
    socket.on("ticket:created", onDataChanged);
    socket.on("ticket:status_updated", onDataChanged);
    socket.on("event:created", onDataChanged);
    socket.on("event:updated", onDataChanged);
    socket.on("event:deleted", onDataChanged);
    socket.on("amenity:booking_created", onDataChanged);
    socket.on("amenity:booking_status_updated", onDataChanged);

    if (socket.connected) {
      onConnect();
    }

    return () => {
      leaveTenantRoom(user.tenantId);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("announcement:created", onDataChanged);
      socket.off("ticket:created", onDataChanged);
      socket.off("ticket:status_updated", onDataChanged);
      socket.off("event:created", onDataChanged);
      socket.off("event:updated", onDataChanged);
      socket.off("event:deleted", onDataChanged);
      socket.off("amenity:booking_created", onDataChanged);
      socket.off("amenity:booking_status_updated", onDataChanged);
    };
  }, [user?.tenantId]);

  async function handleAnnouncementSubmit(event) {
    event.preventDefault();
    try {
      setError("");
      await apiRequest("/announcements", {
        method: "POST",
        token,
        body: announcementForm
      });
      setAnnouncementForm({ title: "", body: "" });
      await loadAnnouncements();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleTicketSubmit(event) {
    event.preventDefault();
    try {
      setError("");
      await apiRequest("/tickets", {
        method: "POST",
        token,
        body: ticketForm
      });
      setTicketForm({ title: "", description: "", category: "general" });
      await loadTickets();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleTicketStatus(ticketId, status) {
    try {
      setError("");
      await apiRequest(`/tickets/${ticketId}/status`, {
        method: "PATCH",
        token,
        body: { status }
      });
      await loadTickets();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleEventSubmit(event) {
    event.preventDefault();
    try {
      setError("");
      await apiRequest("/events", {
        method: "POST",
        token,
        body: eventForm
      });
      setEventForm({
        title: "",
        description: "",
        location: "Club House",
        startAt: "",
        endAt: ""
      });
      await loadEvents();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleEventDelete(eventId) {
    try {
      setError("");
      await apiRequest(`/events/${eventId}`, {
        method: "DELETE",
        token
      });
      await loadEvents();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleBookingSubmit(event) {
    event.preventDefault();
    try {
      setError("");
      await apiRequest("/amenities/bookings", {
        method: "POST",
        token,
        body: bookingForm
      });
      setBookingForm({
        amenityName: "Club House",
        date: "",
        startTime: "",
        endTime: ""
      });
      await loadBookings();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleBookingStatus(bookingId, status) {
    try {
      setError("");
      await apiRequest(`/amenities/bookings/${bookingId}/status`, {
        method: "PATCH",
        token,
        body: { status }
      });
      await loadBookings();
    } catch (err) {
      setError(err.message);
    }
  }

  function isOwnBooking(item) {
    const requestedById = item?.requestedBy?._id || item?.requestedBy;
    return String(requestedById) === String(user?.id);
  }

  return (
    <section className="space-y-5">
      <div className="panel">
        <h2 className="text-2xl font-bold">Test Dashboard</h2>
        <p className="mt-1 text-sm text-slate-600">
          User: <span className="font-medium text-slate-800">{user?.fullName}</span> | Role: {user?.role} | Socket: {socketState}
        </p>
        <button className="btn-muted mt-3" onClick={loadAll} type="button">Refresh all</button>
        {error ? <p className="mt-3 rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-800">{error}</p> : null}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <article className="panel space-y-3">
          <h3 className="text-xl font-semibold">Announcements</h3>
          {canManageAnnouncements ? (
            <form className="space-y-2" onSubmit={handleAnnouncementSubmit}>
              <input className="field" placeholder="Title" value={announcementForm.title} onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, title: e.target.value }))} />
              <textarea className="field min-h-24" placeholder="Body" value={announcementForm.body} onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, body: e.target.value }))} />
              <button className="btn-primary" type="submit">Create announcement</button>
            </form>
          ) : (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">Only committee and super admin can create announcements.</p>
          )}
          <ul className="space-y-2 text-sm">
            {announcements.map((item) => (
              <li className="rounded-lg border border-slate-200 p-3" key={item._id}>
                <p className="font-semibold">{item.title}</p>
                <p className="text-slate-600">{item.body}</p>
              </li>
            ))}
          </ul>
        </article>

        <article className="panel space-y-3">
          <h3 className="text-xl font-semibold">Tickets</h3>
          <form className="space-y-2" onSubmit={handleTicketSubmit}>
            <input className="field" placeholder="Title" value={ticketForm.title} onChange={(e) => setTicketForm((prev) => ({ ...prev, title: e.target.value }))} />
            <textarea className="field min-h-24" placeholder="Description" value={ticketForm.description} onChange={(e) => setTicketForm((prev) => ({ ...prev, description: e.target.value }))} />
            <input className="field" placeholder="Category" value={ticketForm.category} onChange={(e) => setTicketForm((prev) => ({ ...prev, category: e.target.value }))} />
            <button className="btn-primary" type="submit">Create ticket</button>
          </form>
          <ul className="space-y-2 text-sm">
            {tickets.map((item) => (
              <li className="rounded-lg border border-slate-200 p-3" key={item._id}>
                <p className="font-semibold">{item.title}</p>
                <p className="text-slate-600">{item.description}</p>
                <div className="mt-2 flex items-center gap-2">
                  {canUpdateTicketStatus ? (
                    <select className="field max-w-40" defaultValue={item.status} onChange={(e) => handleTicketStatus(item._id, e.target.value)}>
                      <option value="open">open</option>
                      <option value="in_progress">in_progress</option>
                      <option value="resolved">resolved</option>
                      <option value="closed">closed</option>
                    </select>
                  ) : null}
                  <span className="text-xs text-slate-500">Current: {item.status}</span>
                </div>
              </li>
            ))}
          </ul>
        </article>

        <article className="panel space-y-3 lg:col-span-2">
          <h3 className="text-xl font-semibold">Events</h3>
          {canManageEvents ? (
            <form className="grid gap-2 md:grid-cols-2" onSubmit={handleEventSubmit}>
              <input className="field" placeholder="Title" value={eventForm.title} onChange={(e) => setEventForm((prev) => ({ ...prev, title: e.target.value }))} />
              <input className="field" placeholder="Location" value={eventForm.location} onChange={(e) => setEventForm((prev) => ({ ...prev, location: e.target.value }))} />
              <textarea className="field md:col-span-2" placeholder="Description" value={eventForm.description} onChange={(e) => setEventForm((prev) => ({ ...prev, description: e.target.value }))} />
              <input className="field" type="datetime-local" value={eventForm.startAt} onChange={(e) => setEventForm((prev) => ({ ...prev, startAt: e.target.value }))} />
              <input className="field" type="datetime-local" value={eventForm.endAt} onChange={(e) => setEventForm((prev) => ({ ...prev, endAt: e.target.value }))} />
              <button className="btn-primary md:col-span-2" type="submit">Create event</button>
            </form>
          ) : (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">Only committee and super admin can create or delete events.</p>
          )}
          <ul className="space-y-2 text-sm">
            {events.map((item) => (
              <li className="flex flex-col gap-2 rounded-lg border border-slate-200 p-3 md:flex-row md:items-center md:justify-between" key={item._id}>
                <div>
                  <p className="font-semibold">{item.title}</p>
                  <p className="text-slate-600">{item.location}</p>
                  <p className="text-xs text-slate-500">{formatDateTime(item.startAt)} - {formatDateTime(item.endAt)}</p>
                </div>
                {canManageEvents ? <button className="btn-danger" onClick={() => handleEventDelete(item._id)} type="button">Delete</button> : null}
              </li>
            ))}
          </ul>
        </article>

        <article className="panel space-y-3 lg:col-span-2">
          <h3 className="text-xl font-semibold">Amenity Bookings</h3>
          <form className="grid gap-2 md:grid-cols-2" onSubmit={handleBookingSubmit}>
            <input className="field" placeholder="Amenity name" value={bookingForm.amenityName} onChange={(e) => setBookingForm((prev) => ({ ...prev, amenityName: e.target.value }))} />
            <input className="field" type="date" value={bookingForm.date} onChange={(e) => setBookingForm((prev) => ({ ...prev, date: e.target.value }))} />
            <input className="field" type="time" value={bookingForm.startTime} onChange={(e) => setBookingForm((prev) => ({ ...prev, startTime: e.target.value }))} />
            <input className="field" type="time" value={bookingForm.endTime} onChange={(e) => setBookingForm((prev) => ({ ...prev, endTime: e.target.value }))} />
            <button className="btn-primary md:col-span-2" type="submit">Create booking</button>
          </form>
          <ul className="space-y-2 text-sm">
            {bookings.map((item) => (
              <li className="rounded-lg border border-slate-200 p-3" key={item._id}>
                <p className="font-semibold">{item.amenityName} ({item.status})</p>
                <p className="text-slate-600">{item.date} | {item.startTime} - {item.endTime}</p>
                {item.requestedBy ? (
                  <p className="text-xs text-slate-500">Requested by: {item.requestedBy.fullName} ({item.requestedBy.role})</p>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-2">
                  {canApproveAmenities && item.status === "pending" ? (
                    <>
                      <button className="btn-primary" onClick={() => handleBookingStatus(item._id, "approved")} type="button">Approve</button>
                      <button className="btn-danger" onClick={() => handleBookingStatus(item._id, "rejected")} type="button">Reject</button>
                    </>
                  ) : null}
                  {(item.status === "pending" || item.status === "approved") && (canApproveAmenities || isOwnBooking(item)) ? (
                    <button className="btn-muted" onClick={() => handleBookingStatus(item._id, "cancelled")} type="button">Cancel</button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
