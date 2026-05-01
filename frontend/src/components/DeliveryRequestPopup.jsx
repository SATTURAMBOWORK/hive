import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle, Package, XCircle } from "lucide-react";
import { useAuth } from "./AuthContext";
import { apiRequest } from "./api";
import { getSocket } from "./socket";

const PACKAGE_LABEL = {
  parcel: "Parcel",
  food: "Food",
  grocery: "Grocery",
  medicine: "Medicine",
  documents: "Documents",
  other: "Other",
};

export function DeliveryRequestPopup() {
  const { token, user } = useAuth();

  const [queue, setQueue] = useState([]);
  const [responding, setResponding] = useState(false);
  const [result, setResult] = useState(null);
  const timerRef = useRef(null);

  const isResident = user?.role === "resident";

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const enqueue = useCallback((delivery) => {
    setQueue(prev => {
      const alreadyIn = prev.some(item => item._id === delivery._id);
      return alreadyIn ? prev : [...prev, delivery];
    });
  }, []);

  useEffect(() => {
    if (!isResident || !token) return;

    apiRequest("/delivery/my", { token })
      .then(({ items }) => {
        if (!Array.isArray(items) || items.length === 0) return;
        const pending = items
          .filter(item => item.status === "awaiting_approval")
          .sort((a, b) => new Date(a.entryTime || a.createdAt) - new Date(b.entryTime || b.createdAt));
        setQueue(pending);
      })
      .catch(() => {
        // Non-critical: socket events still keep the popup live.
      });
  }, [isResident, token]);

  useEffect(() => {
    if (!isResident) return;

    const socket = getSocket();

    function onIncoming({ delivery }) {
      if (!delivery || delivery.status !== "awaiting_approval") return;
      setResult(null);
      enqueue(delivery);
    }

    socket.on("delivery:incoming", onIncoming);
    return () => socket.off("delivery:incoming", onIncoming);
  }, [isResident, enqueue]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const current = queue[0] ?? null;

  async function handleRespond(decision) {
    if (!current || responding) return;

    setResponding(true);
    try {
      await apiRequest(`/delivery/${current._id}/${decision}`, {
        token,
        method: "POST",
        body: {},
      });

      setResult(decision);
      clearTimer();
      timerRef.current = setTimeout(() => {
        setResult(null);
        setResponding(false);
        setQueue(prev => prev.slice(1));
      }, 2500);
    } catch (_err) {
      setResponding(false);
    }
  }

  if (!current) return null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 9998,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(15,23,42,0.42)",
      backdropFilter: "blur(6px)",
      padding: 16,
    }}>
      <div style={{
        width: "100%",
        maxWidth: 420,
        overflow: "hidden",
        borderRadius: 24,
        background: "#FFFFFF",
        boxShadow: "0 28px 70px rgba(15,23,42,0.22)",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>
        {result ? (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 32px",
            textAlign: "center",
            background: result === "approved" ? "#EFF6FF" : "#FFF1F2",
          }}>
            {result === "approved"
              ? <CheckCircle size={54} color="#2563EB" style={{ marginBottom: 16 }} />
              : <XCircle size={54} color="#DC2626" style={{ marginBottom: 16 }} />}
            <p style={{
              margin: 0,
              fontSize: "1.2rem",
              fontWeight: 800,
              color: result === "approved" ? "#1D4ED8" : "#B91C1C",
            }}>
              {result === "approved" ? "Delivery Approved" : "Delivery Rejected"}
            </p>
            <p style={{ margin: "8px 0 0", fontSize: "0.85rem", color: "#6B7280" }}>
              {result === "approved"
                ? "The guard has been notified to continue the handover."
                : "The delivery will be turned away at the gate."}
            </p>
            {queue.length > 1 && (
              <p style={{ margin: "14px 0 0", fontSize: "0.75rem", fontWeight: 700, color: "#2563EB" }}>
                {queue.length - 1} more delivery request{queue.length - 1 === 1 ? "" : "s"} waiting…
              </p>
            )}
          </div>
        ) : (
          <>
            <div style={{
              padding: "20px 24px 16px",
              background: "linear-gradient(180deg, #EEF2FF 0%, #FFFFFF 100%)",
              borderBottom: "1px solid #E5E7EB",
            }}>
              <p style={{
                margin: "0 0 4px",
                fontSize: "0.65rem",
                fontWeight: 800,
                letterSpacing: "0.13em",
                textTransform: "uppercase",
                color: "#4F46E5",
              }}>
                Delivery at your gate
                {queue.length > 1 && (
                  <span style={{
                    marginLeft: 8,
                    background: "#4F46E5",
                    color: "#fff",
                    padding: "1px 7px",
                    borderRadius: 100,
                    fontSize: "0.6rem",
                  }}>
                    {queue.length} waiting
                  </span>
                )}
              </p>
              <h2 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "#111827" }}>
                Someone has arrived with a parcel
              </h2>
            </div>

            <div style={{ padding: "20px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{
                  width: 48,
                  height: 48,
                  flexShrink: 0,
                  borderRadius: 14,
                  background: "#EEF2FF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <Package size={22} color="#4F46E5" />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "#111827" }}>
                    {current.courierName}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "#6B7280" }}>
                    {current.agentName || "Delivery agent"}
                  </p>
                </div>
              </div>

              <div style={{ borderRadius: 12, border: "1px solid #E5E7EB", overflow: "hidden" }}>
                <InfoRow label="Package" value={PACKAGE_LABEL[current.packageType] || current.packageType || "Parcel"} />
                <InfoRow label="Count" value={`${current.packageCount || 1}`} />
                {current.gateId && <InfoRow label="Gate" value={current.gateId} />}
                {current.agentPhone && <InfoRow label="Agent phone" value={current.agentPhone} />}
                {current.notes && <InfoRow label="Notes" value={current.notes} />}
              </div>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              padding: "0 24px 24px",
            }}>
              <button
                onClick={() => handleRespond("reject")}
                disabled={responding}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "12px 0",
                  borderRadius: 14,
                  border: "2px solid #FECACA",
                  background: "#FFF1F2",
                  fontSize: "0.85rem",
                  fontWeight: 800,
                  color: "#DC2626",
                  cursor: responding ? "not-allowed" : "pointer",
                  opacity: responding ? 0.55 : 1,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                <XCircle size={15} /> Reject
              </button>
              <button
                onClick={() => handleRespond("approve")}
                disabled={responding}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "12px 0",
                  borderRadius: 14,
                  border: "none",
                  background: "#4F46E5",
                  fontSize: "0.85rem",
                  fontWeight: 800,
                  color: "#FFFFFF",
                  cursor: responding ? "not-allowed" : "pointer",
                  opacity: responding ? 0.55 : 1,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  boxShadow: "0 4px 14px rgba(79,70,229,0.28)",
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
      display: "grid",
      gridTemplateColumns: "120px 1fr",
      gap: 12,
      padding: "11px 14px",
      borderBottom: "1px solid #E5E7EB",
      alignItems: "start",
    }}>
      <span style={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6B7280" }}>
        {label}
      </span>
      <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#111827" }}>
        {value}
      </span>
    </div>
  );
}