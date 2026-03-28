const STATUS_OPTIONS = ["approved", "rejected", "cancelled"];

export function AdminManager({ items, onStatusUpdate }) {
  if (!items.length) {
    return <p className="text-sm text-slate-500">No pending booking requests.</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <article key={item._id} className="rounded-xl border border-slate-200 p-4">
          <h4 className="font-semibold text-slate-900">{item.amenityId?.name || item.amenityName}</h4>
          <p className="mt-1 text-sm text-slate-600">
            {item.date} • {item.startTime} to {item.endTime}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Resident: {item.residentId?.fullName || item.requestedBy?.fullName || "Resident"}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((status) => (
              <button key={status} className="btn-muted" type="button" onClick={() => onStatusUpdate(item._id, status)}>
                Set {status}
              </button>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}
