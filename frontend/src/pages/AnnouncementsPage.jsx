import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../components/api";
import { useAuth } from "../components/AuthContext";

export function AnnouncementsPage() {
  const { token, user } = useAuth();
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const canCreate = useMemo(
    () => ["committee", "super_admin"].includes(user?.role),
    [user?.role]
  );

  async function loadItems() {
    setIsLoading(true);
    setError("");
    try {
      const data = await apiRequest("/announcements", { token });
      setItems(data.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreate(event) {
    event.preventDefault();
    setError("");

    try {
      const data = await apiRequest("/announcements", {
        method: "POST",
        token,
        body: { title, body }
      });

      setItems((prev) => [data.item, ...prev]);
      setTitle("");
      setBody("");
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
        <h2 className="text-xl font-bold">Announcements</h2>
        <button className="btn-muted" onClick={loadItems}>Refresh</button>
      </div>

      {error ? <p className="rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-800">{error}</p> : null}

      {canCreate ? (
        <form onSubmit={handleCreate} className="space-y-2 rounded-xl border border-slate-200 p-4">
          <input className="field" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea className="field min-h-24" placeholder="Body" value={body} onChange={(e) => setBody(e.target.value)} />
          <button className="btn-primary" type="submit">Post announcement</button>
        </form>
      ) : null}

      <div className="space-y-3">
        {isLoading ? <p className="text-sm text-slate-500">Loading...</p> : null}
        {!isLoading && !items.length ? <p className="text-sm text-slate-500">No announcements found.</p> : null}
        {items.map((item) => (
          <article key={item._id} className="rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold">{item.title}</h3>
            <p className="mt-1 text-sm text-slate-700">{item.body}</p>
            <p className="mt-2 text-xs text-slate-500">
              By {item.createdBy?.fullName || "Community"} • {new Date(item.createdAt).toLocaleString()}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
