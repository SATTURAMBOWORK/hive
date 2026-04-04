import { useState } from "react";
import { ChevronLeft, ChevronRight, ImageOff, Users, Zap } from "lucide-react";

function PhotoCarousel({ photos }) {
  const [idx, setIdx] = useState(0);

  if (!photos || photos.length === 0) {
    return (
      <div className="flex h-44 items-center justify-center rounded-xl bg-slate-100">
        <div className="flex flex-col items-center gap-1.5 text-slate-400">
          <ImageOff className="h-7 w-7" />
          <span className="text-xs">No photos</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-44 overflow-hidden rounded-xl bg-slate-100">
      <img
        src={photos[idx]}
        alt={`Photo ${idx + 1}`}
        className="h-full w-full object-cover"
      />

      {photos.length > 1 && (
        <>
          <button
            onClick={() => setIdx((i) => (i - 1 + photos.length) % photos.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1 text-white backdrop-blur-sm transition hover:bg-black/60"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIdx((i) => (i + 1) % photos.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1 text-white backdrop-blur-sm transition hover:bg-black/60"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`h-1.5 rounded-full transition-all ${i === idx ? "w-4 bg-white" : "w-1.5 bg-white/50"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function AmenityGrid({ amenities, onBook }) {
  if (!amenities.length) {
    return <p className="text-sm text-slate-500">No amenities configured yet.</p>;
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {amenities.map((amenity) => (
        <article key={amenity._id} className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <PhotoCarousel photos={amenity.photos} />

          <div className="flex flex-1 flex-col p-4">
            <h3 className="font-bold text-slate-900 text-base leading-snug">{amenity.name}</h3>
            {amenity.description && (
              <p className="mt-1 text-sm text-slate-500 line-clamp-2">{amenity.description}</p>
            )}

            <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                Capacity: {amenity.capacity}
              </span>
              {amenity.isAutoApprove && (
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <Zap className="h-3.5 w-3.5" />
                  Instant Approval
                </span>
              )}
            </div>

            <button
              className="btn-primary mt-4 w-full"
              onClick={() => onBook(amenity)}
            >
              Book Now
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
