import { useEffect, useState } from "react";
import { CheckCircle, XCircle, User } from "lucide-react";
import { useAuth } from "./AuthContext";
import { apiRequest } from "./api";
import { getSocket } from "./socket";

const PURPOSE_LABEL = {
  guest:      "Guest visit",
  delivery:   "Delivery",
  contractor: "Contractor",
  other:      "Other",
};

/*
  This component listens for visitor:request_incoming socket events.
  It renders a floating popup that only appears when a request arrives.
  The resident can Approve or Reject directly from the popup.
  It is mounted once in MainLayout so it works on every page.
*/
export function VisitorRequestPopup() {
  const { token, user } = useAuth();
  const [request,    setRequest]    = useState(null); // the incoming visitor object
  const [responding, setResponding] = useState(false);
  const [result,     setResult]     = useState(null); // "approved" | "rejected"

  // Only residents see this popup
  const isResident = user?.role === "resident";

  useEffect(() => {
    if (!isResident) return;

    const socket = getSocket();

    function onIncoming({ visitor }) {
      setRequest(visitor);
      setResult(null);
    }

    socket.on("visitor:request_incoming", onIncoming);
    return () => socket.off("visitor:request_incoming", onIncoming);
  }, [isResident]);

  async function handleRespond(decision) {
    if (!request || responding) return;
    setResponding(true);
    try {
      await apiRequest(`/visitors/${request._id}/respond`, {
        token,
        method: "PATCH",
        body: { decision }
      });
      setResult(decision);
      // Auto-close after 3 seconds
      setTimeout(() => {
        setRequest(null);
        setResult(null);
      }, 3000);
    } catch (err) {
      console.error("Failed to respond to visitor request:", err.message);
    } finally {
      setResponding(false);
    }
  }

  // Nothing to show
  if (!request) return null;

  return (
    // Full-screen overlay
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden">

        {result ? (
          /* ── Result state ── */
          <div className={`flex flex-col items-center justify-center p-10 text-center
            ${result === "approved" ? "bg-emerald-50" : "bg-rose-50"}`}>
            {result === "approved"
              ? <CheckCircle className="mb-4 text-emerald-500" size={52} />
              : <XCircle    className="mb-4 text-rose-500"    size={52} />
            }
            <p className={`text-xl font-extrabold ${result === "approved" ? "text-emerald-700" : "text-rose-700"}`}>
              {result === "approved" ? "Entry Approved" : "Entry Rejected"}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {result === "approved"
                ? "The security guard has been notified."
                : "The visitor will be turned away."}
            </p>
          </div>
        ) : (
          /* ── Request state ── */
          <>
            {/* Header */}
            <div className="bg-orange-50 px-6 pt-6 pb-4 border-b border-orange-100">
              <p className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-1">
                Visitor at your gate
              </p>
              <h2 className="text-xl font-extrabold text-slate-900">
                Someone wants to visit you
              </h2>
            </div>

            {/* Visitor details */}
            <div className="px-6 py-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-100">
                  <User size={22} className="text-slate-500" />
                </div>
                <div>
                  <p className="text-base font-bold text-slate-900">{request.visitorName}</p>
                  {request.visitorPhone && (
                    <p className="text-sm text-slate-500">{request.visitorPhone}</p>
                  )}
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-100 divide-y divide-slate-100">
                <Row label="Purpose"  value={PURPOSE_LABEL[request.purpose] || request.purpose} />
                {request.vehicleNumber && (
                  <Row label="Vehicle" value={request.vehicleNumber} />
                )}
                {request.loggedBy?.fullName && (
                  <Row label="Logged by" value={`Guard: ${request.loggedBy.fullName}`} />
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3 px-6 pb-6">
              <button
                onClick={() => handleRespond("rejected")}
                disabled={responding}
                className="flex items-center justify-center gap-2 rounded-2xl border-2 border-rose-200 bg-rose-50 py-3.5 text-sm font-bold text-rose-600 transition hover:bg-rose-100 disabled:opacity-60"
              >
                <XCircle size={16} />
                Reject
              </button>
              <button
                onClick={() => handleRespond("approved")}
                disabled={responding}
                className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
              >
                <CheckCircle size={16} />
                {responding ? "…" : "Approve"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</span>
      <span className="text-sm font-medium text-slate-700">{value}</span>
    </div>
  );
}
