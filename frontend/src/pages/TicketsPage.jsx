import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../components/api";
import { useAuth } from "../components/AuthContext";

const STATUS_OPTIONS = ["open", "in_progress", "resolved", "closed"];

export function TicketsPage() {
  const { token, user } = useAuth();
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [error, setError] = useState("");

  const canUpdateStatus = useMemo(
    () => ["committee", "staff", "super_admin"].includes(user?.role),
    [user?.role]
  );

  async function loadItems() {
    setError("");
    try {
      const data = await apiRequest("/tickets", { token });
      setItems(data.items || []);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreate(event) {
    event.preventDefault();
    setError("");

    try {
      const data = await apiRequest("/tickets", {
        method: "POST",
        token,
        body: { title, description, category }
      });

      setItems((prev) => [data.item, ...prev]);
      setTitle("");
      setDescription("");
      setCategory("general");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleStatusUpdate(ticketId, status) {
    setError("");
    try {
      const data = await apiRequest(`/tickets/${ticketId}/status`, {
        method: "PATCH",
        token,
        body: { status }
      });

      setItems((prev) => prev.map((item) => (item._id === ticketId ? { ...item, ...data.item } : item)));
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
        <h2 className="text-xl font-bold">Tickets</h2>
        <button className="btn-muted" onClick={loadItems}>Refresh</button>
      </div>

      {error ? <p className="rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-800">{error}</p> : null}

      <form onSubmit={handleCreate} className="space-y-2 rounded-xl border border-slate-200 p-4">
        <input className="field" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea className="field min-h-24" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <input className="field" placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} />
        <button className="btn-primary" type="submit">Create ticket</button>
      </form>

      <div className="space-y-3">
        {!items.length ? <p className="text-sm text-slate-500">No tickets found.</p> : null}
        {items.map((item) => (
          <article key={item._id} className="rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold">{item.title}</h3>
            <p className="mt-1 text-sm text-slate-700">{item.description}</p>
            <p className="mt-2 text-xs text-slate-500">Status: {item.status} • Category: {item.category}</p>
            {canUpdateStatus ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((status) => (
                  <button key={status} className="btn-muted" onClick={() => handleStatusUpdate(item._id, status)} type="button">
                    Mark {status}
                  </button>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
