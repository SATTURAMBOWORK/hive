export function AmenityGrid({ amenities, onBook }) {
  if (!amenities.length) {
    return <p className="text-sm text-slate-500">No amenities configured yet.</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {amenities.map((amenity) => (
        <article key={amenity._id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="font-semibold text-slate-900">{amenity.name}</h3>
          <p className="mt-1 text-sm text-slate-600">{amenity.description || "No description"}</p>
          <p className="mt-2 text-xs text-slate-500">
            Capacity: {amenity.capacity} • {amenity.isAutoApprove ? "Auto-Approve" : "Admin Approval"}
          </p>
          <button className="btn-primary mt-3" onClick={() => onBook(amenity)}>
            Book Now
          </button>
        </article>
      ))}
    </div>
  );
}
