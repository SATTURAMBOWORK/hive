import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../components/api";
import { useAuth } from "../components/AuthContext";

export function EventsPage() {
  const { token, user } = useAuth();
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("Club House");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [error, setError] = useState("");

  const canCreate = useMemo(
    () => ["committee", "super_admin"].includes(user?.role),
    [user?.role]
  );

  async function loadItems() {
    setError("");
    try {
      const data = await apiRequest("/events", { token });
      setItems(data.items || []);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreate(event) {
    event.preventDefault();
    setError("");

    try {
      const data = await apiRequest("/events", {
        method: "POST",
        token,
        body: {
          title,
          description,
          location,
          startAt,
          endAt
        }
      });

      setItems((prev) => [...prev, data.item]);
      setTitle("");
      setDescription("");
      setLocation("Club House");
      setStartAt("");
      setEndAt("");
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
        <h2 className="text-xl font-bold">Events</h2>
        <button className="btn-muted" onClick={loadItems}>Refresh</button>
      </div>

      {error ? <p className="rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-800">{error}</p> : null}

      {canCreate ? (
        <form onSubmit={handleCreate} className="space-y-2 rounded-xl border border-slate-200 p-4">
          <input className="field" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea className="field min-h-24" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <input className="field" placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
          <input className="field" type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
          <input className="field" type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
          <button className="btn-primary" type="submit">Create event</button>
        </form>
      ) : null}

      <div className="space-y-3">
        {!items.length ? <p className="text-sm text-slate-500">No events found.</p> : null}
        {items.map((item) => (
          <article key={item._id} className="rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold">{item.title}</h3>
            <p className="mt-1 text-sm text-slate-700">{item.description || "No description"}</p>
            <p className="mt-2 text-xs text-slate-500">
              {item.location} • {new Date(item.startAt).toLocaleString()} to {new Date(item.endAt).toLocaleString()}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
