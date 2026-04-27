import { useEffect, useState, useCallback } from "react";
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
  VisitorRequestPopup — persistent across reloads.

  Strategy:
    - On mount: fetch GET /visitors/my-requests to recover any pending requests
      the resident didn't act on before refreshing.
    - Socket: push newly arriving requests onto the queue.
    - Queue: show one popup at a time. After the resident responds (or it's
      auto-dismissed), advance to the next item in the queue.

  This way the guard never waits forever — the popup stays until acted on.
*/
export function VisitorRequestPopup() {
  const { token, user } = useAuth();

  // Queue of pending visitor objects; we show queue[0] as the active popup.
  const [queue,      setQueue]      = useState([]);
  const [responding, setResponding] = useState(false);
  const [result,     setResult]     = useState(null); // "approved" | "rejected"

  const isResident = user?.role === "resident";

  // Helper: add a visitor to the queue without duplicates
  const enqueue = useCallback((visitor) => {
    setQueue(prev => {
      const alreadyIn = prev.some(v => v._id === visitor._id);
      return alreadyIn ? prev : [...prev, visitor];
    });
  }, []);

  // On mount: recover any pending requests the resident missed (e.g. page reload)
  useEffect(() => {
    if (!isResident || !token) return;

    apiRequest("/visitors/my-requests", { token })
      .then(({ items }) => {
        if (items && items.length > 0) {
          // Sort oldest first so we show in arrival order
          const sorted = [...items].sort(
            (a, b) => new Date(a.entryTime) - new Date(b.entryTime)
          );
          setQueue(sorted);
        }
      })
      .catch(() => {
        // Non-critical — socket will still catch new arrivals
      });
  }, [isResident, token]);

  // Socket: live new arrivals
  useEffect(() => {
    if (!isResident) return;
    const socket = getSocket();

    function onIncoming({ visitor }) {
      setResult(null);
      enqueue(visitor);
    }

    socket.on("visitor:request_incoming", onIncoming);
    return () => socket.off("visitor:request_incoming", onIncoming);
  }, [isResident, enqueue]);

  const current = queue[0] ?? null;

  async function handleRespond(decision) {
    if (!current || responding) return;
    setResponding(true);
    try {
      await apiRequest(`/visitors/${current._id}/respond`, {
        token,
        method: "PATCH",
        body: { decision }
      });
      setResult(decision);
      // Show the result briefly, then advance to the next item
      setTimeout(() => {
        setResult(null);
        setResponding(false);
        setQueue(prev => prev.slice(1)); // remove the responded item
      }, 2500);
    } catch (err) {
      console.error("Failed to respond to visitor request:", err.message);
      setResponding(false);
    }
  }

  // Nothing in the queue — render nothing
  if (!current) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)",
      padding: "16px",
    }}>
      <div style={{
        width: "100%", maxWidth: 400,
        borderRadius: 24, background: "#FFFFFF",
        boxShadow: "0 25px 60px rgba(0,0,0,0.22)",
        overflow: "hidden",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>

        {result ? (
          /* ── Result state ── */
          <div style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            padding: "40px 32px", textAlign: "center",
            background: result === "approved" ? "#F0FDF4" : "#FFF1F2",
          }}>
            {result === "approved"
              ? <CheckCircle size={52} color="#16A34A" style={{ marginBottom: 16 }} />
              : <XCircle    size={52} color="#DC2626" style={{ marginBottom: 16 }} />
            }
            <p style={{
              margin: 0, fontSize: "1.2rem", fontWeight: 800,
              color: result === "approved" ? "#15803D" : "#B91C1C",
            }}>
              {result === "approved" ? "Entry Approved" : "Entry Rejected"}
            </p>
            <p style={{ margin: "8px 0 0", fontSize: "0.85rem", color: "#6B7280" }}>
              {result === "approved"
                ? "The security guard has been notified."
                : "The visitor will be turned away."}
            </p>
            {queue.length > 1 && (
              <p style={{
                margin: "14px 0 0", fontSize: "0.75rem",
                fontWeight: 700, color: "#4F46E5",
              }}>
                {queue.length - 1} more visitor{queue.length - 1 > 1 ? "s" : ""} waiting…
              </p>
            )}
          </div>

        ) : (
          /* ── Request state ── */
          <>
            {/* Header */}
            <div style={{
              background: "#FFF7ED",
              padding: "20px 24px 16px",
              borderBottom: "1px solid #FED7AA",
            }}>
              <p style={{
                margin: "0 0 4px",
                fontSize: "0.65rem", fontWeight: 800,
                letterSpacing: "0.13em", textTransform: "uppercase",
                color: "#EA580C",
              }}>
                Visitor at your gate
                {queue.length > 1 && (
                  <span style={{
                    marginLeft: 8, background: "#EA580C", color: "#fff",
                    padding: "1px 7px", borderRadius: 100,
                    fontSize: "0.6rem",
                  }}>
                    {queue.length} waiting
                  </span>
                )}
              </p>
              <h2 style={{
                margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "#1C1C1E",
              }}>
                Someone wants to visit you
              </h2>
            </div>

            {/* Visitor details */}
            <div style={{ padding: "20px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{
                  width: 48, height: 48, flexShrink: 0,
                  borderRadius: 14, background: "#F3F4F6",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <User size={22} color="#6B7280" />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "#1C1C1E" }}>
                    {current.visitorName}
                  </p>
                  {current.visitorPhone && (
                    <p style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "#6B7280" }}>
                      {current.visitorPhone}
                    </p>
                  )}
                </div>
              </div>

              <div style={{
                borderRadius: 12, border: "1px solid #E8E8ED",
                overflow: "hidden",
              }}>
                <InfoRow label="Purpose" value={PURPOSE_LABEL[current.purpose] || current.purpose} />
                {current.vehicleNumber && (
                  <InfoRow label="Vehicle" value={current.vehicleNumber} />
                )}
                {current.loggedBy?.fullName && (
                  <InfoRow label="Logged by" value={`Guard: ${current.loggedBy.fullName}`} />
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr",
              gap: 12, padding: "0 24px 24px",
            }}>
              <button
                onClick={() => handleRespond("rejected")}
                disabled={responding}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "12px 0", borderRadius: 14,
                  border: "2px solid #FECACA", background: "#FFF1F2",
                  fontSize: "0.85rem", fontWeight: 800, color: "#DC2626",
                  cursor: responding ? "not-allowed" : "pointer",
                  opacity: responding ? 0.55 : 1,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  transition: "background 0.15s",
                }}
              >
                <XCircle size={15} /> Reject
              </button>
              <button
                onClick={() => handleRespond("approved")}
                disabled={responding}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "12px 0", borderRadius: 14,
                  border: "none", background: "#16A34A",
                  fontSize: "0.85rem", fontWeight: 800, color: "#FFFFFF",
                  cursor: responding ? "not-allowed" : "pointer",
                  opacity: responding ? 0.55 : 1,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  boxShadow: "0 4px 14px rgba(22,163,74,0.35)",
                  transition: "background 0.15s",
                }}
              >
                <CheckCircle size={15} /> {responding ? "…" : "Approve"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "9px 14px", borderBottom: "1px solid #F0F0F5",
    }}>
      <span style={{
        fontSize: "0.67rem", fontWeight: 700,
        textTransform: "uppercase", letterSpacing: "0.08em", color: "#9CA3AF",
      }}>
        {label}
      </span>
      <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#3A3A3C" }}>
        {value}
      </span>
    </div>
  );
}
