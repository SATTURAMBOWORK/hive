import { useEffect, useMemo, useState } from "react";
import { ImageOff } from "lucide-react";
import { apiRequest } from "../components/api";
import { useAuth } from "../components/AuthContext";

const STATUS_OPTIONS = ["open", "in_progress", "resolved", "closed"];

const STATUS_BADGE = {
  open:        "bg-sky-100 text-sky-700",
  in_progress: "bg-amber-100 text-amber-700",
  resolved:    "bg-emerald-100 text-emerald-700",
  closed:      "bg-slate-100 text-slate-600",
};

function TicketPhotos({ photos }) {
  const [lightbox, setLightbox] = useState(null);

  if (!photos || photos.length === 0) return null;

  return (
    <>
      <div className="mt-3 flex flex-wrap gap-2">
        {photos.map((url, i) => (
          <button key={i} onClick={() => setLightbox(url)} className="overflow-hidden rounded-lg border border-slate-200 focus:outline-none">
            <img src={url} alt={`attachment ${i + 1}`} className="h-20 w-20 object-cover transition hover:opacity-80" />
          </button>
        ))}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="attachment" className="max-h-[85vh] max-w-[90vw] rounded-2xl shadow-2xl" />
        </div>
      )}
    </>
  );
}

export function TicketsPage() {
  const { token, user } = useAuth();
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [photoFiles, setPhotoFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
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
      let photos = [];

      if (photoFiles.length > 0) {
        setIsUploading(true);
        const fd = new FormData();
        photoFiles.forEach((file) => fd.append("photos", file));
        const uploadData = await apiRequest("/tickets/upload-photos", {
          method: "POST",
          token,
          formData: fd
        });
        photos = uploadData.urls || [];
        setIsUploading(false);
      }

      const data = await apiRequest("/tickets", {
        method: "POST",
        token,
        body: { title, description, category, photos }
      });

      setItems((prev) => [data.item, ...prev]);
      setTitle("");
      setDescription("");
      setCategory("general");
      setPhotoFiles([]);
    } catch (err) {
      setIsUploading(false);
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
    <section className="space-y-5">
      <div className="panel flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Tickets</h2>
        <button className="btn-muted" onClick={loadItems}>Refresh</button>
      </div>

      {error ? <p className="rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-800">{error}</p> : null}

      <form onSubmit={handleCreate} className="panel space-y-3">
        <h3 className="font-semibold text-slate-800">Raise a Complaint</h3>
        <input className="field" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <textarea className="field min-h-24" placeholder="Describe the issue" value={description} onChange={(e) => setDescription(e.target.value)} required />
        <input className="field" placeholder="Category (e.g. plumbing, electrical)" value={category} onChange={(e) => setCategory(e.target.value)} />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Attach Photos <span className="font-normal text-slate-400">(up to 3, max 5 MB each)</span>
          </label>
          <input
            className="field"
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setPhotoFiles(Array.from(e.target.files).slice(0, 3))}
          />
          {photoFiles.length > 0 && (
            <p className="mt-1.5 text-xs text-slate-500">{photoFiles.length} file{photoFiles.length > 1 ? "s" : ""} selected</p>
          )}
        </div>
        <button className="btn-primary" type="submit" disabled={isUploading}>
          {isUploading ? "Uploading photos…" : "Submit Ticket"}
        </button>
      </form>

      <div className="space-y-3">
        {!items.length ? <p className="panel text-sm text-slate-500">No tickets found.</p> : null}
        {items.map((item) => (
          <article key={item._id} className="panel space-y-1">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-semibold text-slate-900">{item.title}</h3>
              <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_BADGE[item.status] || "bg-slate-100 text-slate-600"}`}>
                {item.status?.replace("_", " ")}
              </span>
            </div>
            <p className="text-sm text-slate-600">{item.description}</p>
            <p className="text-xs text-slate-400 capitalize">
              {item.category} • {item.createdBy?.fullName || "Resident"}
            </p>
            <TicketPhotos photos={item.photos} />
            {canUpdateStatus ? (
              <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                {STATUS_OPTIONS.map((status) => (
                  <button key={status} className="btn-muted" onClick={() => handleStatusUpdate(item._id, status)} type="button">
                    Mark {status.replace("_", " ")}
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
