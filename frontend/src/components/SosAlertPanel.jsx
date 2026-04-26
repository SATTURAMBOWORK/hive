import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ShieldCheck, CheckCircle2, X, ChevronDown, Clock, User } from "lucide-react";
import { useAuth } from "./AuthContext";
import { apiRequest } from "./api";
import { getSocket } from "./socket";

const C = {
  surface: "#FFFFFF", bg: "#FAFAFC",
  ink: "#1C1C1E", ink2: "#3A3A3C", muted: "#6B7280", faint: "#9CA3AF",
  border: "#E8E8ED", borderL: "#F0F0F5",
  indigo: "#4F46E5", indigoL: "#EEF2FF", indigoBr: "#C7D2FE",
  red: "#DC2626", redL: "#FEF2F2", redBr: "#FECACA",
  amber: "#F59E0B", amberL: "#FFFBEB", amberBr: "#FCD34D",
  green: "#16A34A", greenL: "#DCFCE7",
};

const STATUS_BADGE = {
  sent:                       { label: "Waiting",          color: C.red,    bg: C.redL    },
  acknowledged:               { label: "Acknowledged",     color: C.amber,  bg: C.amberL  },
  pending_user_confirmation:  { label: "Awaiting Resident",color: C.indigo, bg: C.indigoL },
  resolved:                   { label: "Resolved",         color: C.green,  bg: C.greenL  },
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  @keyframes sap-emergency-ring {
    0%   { box-shadow: 0 0 0 0   rgba(220,38,38,0.7); }
    70%  { box-shadow: 0 0 0 22px rgba(220,38,38,0);  }
    100% { box-shadow: 0 0 0 0   rgba(220,38,38,0);   }
  }
  .sap-emergency-ring { animation: sap-emergency-ring 1.4s ease-out infinite; }

  @keyframes sap-badge-bounce {
    0%, 100% { transform: scale(1); }
    30%       { transform: scale(1.25); }
    60%       { transform: scale(0.92); }
  }
  .sap-badge-bounce { animation: sap-badge-bounce 0.5s ease; }

  @keyframes sap-pulse-dot {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.35; }
  }
  .sap-pulse-dot { animation: sap-pulse-dot 1.6s ease-in-out infinite; }

  .sap-card-scroll::-webkit-scrollbar { width: 4px; }
  .sap-card-scroll::-webkit-scrollbar-track { background: transparent; }
  .sap-card-scroll::-webkit-scrollbar-thumb { background: #E8E8ED; border-radius: 99px; }
`;

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

function AlertCard({ alert, onAcknowledge, onResolve, acting }) {
  const badge     = STATUS_BADGE[alert.status] || STATUS_BADGE.sent;
  const isWaiting = alert.status === "sent";
  const isPending = alert.status === "pending_user_confirmation";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 20 }}
      style={{
        borderRadius: 16,
        border: `1.5px solid ${isWaiting ? C.redBr : C.border}`,
        background: isWaiting ? "#FFFCFC" : C.surface,
        padding: "14px 16px",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* Top row: unit + status + time */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isWaiting && (
            <span className="sap-pulse-dot" style={{
              width: 7, height: 7, borderRadius: "50%",
              background: C.red, flexShrink: 0, display: "inline-block",
            }} />
          )}
          <div>
            <span style={{ fontSize: 17, fontWeight: 800, color: isWaiting ? C.red : C.ink, letterSpacing: "-0.3px" }}>
              {alert.unit ? `Flat ${alert.unit}` : "Flat —"}
            </span>
            {alert.wing && (
              <span style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginLeft: 7 }}>
                {alert.wing} Wing
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            fontSize: 10, fontWeight: 800, padding: "3px 9px",
            borderRadius: 99, letterSpacing: "0.06em", textTransform: "uppercase",
            background: badge.bg, color: badge.color,
          }}>
            {badge.label}
          </span>
          <span style={{ fontSize: 11, color: C.faint, display: "flex", alignItems: "center", gap: 3 }}>
            <Clock size={10} /> {timeAgo(alert.createdAt)}
          </span>
        </div>
      </div>

      {/* Resident info */}
      <div style={{ display: "flex", gap: 12, marginBottom: alert.message ? 10 : 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: C.muted }}>
          <User size={11} color={C.faint} />
          {alert.residentId?.fullName || "Resident"}
        </div>
      </div>

      {/* Optional message */}
      {alert.message && (
        <div style={{
          marginTop: 8, padding: "8px 12px", borderRadius: 10,
          background: isWaiting ? C.redL : C.bg,
          fontSize: 12, color: isWaiting ? C.red : C.ink2,
          fontStyle: "italic", lineHeight: 1.5,
        }}>
          "{alert.message}"
        </div>
      )}

      {/* Acknowledged-by line */}
      {alert.acknowledgedBy?.fullName && (
        <p style={{ marginTop: 8, fontSize: 11, color: C.muted }}>
          Acknowledged by <strong style={{ color: C.ink }}>{alert.acknowledgedBy.fullName}</strong>
        </p>
      )}

      {/* Awaiting resident confirmation note */}
      {isPending && (
        <div style={{
          marginTop: 10, padding: "8px 12px", borderRadius: 10,
          background: C.indigoL, border: `1px solid ${C.indigoBr}`,
          fontSize: 12, color: C.indigo, display: "flex", alignItems: "center", gap: 6,
        }}>
          <Clock size={12} />
          Waiting for resident to confirm they're safe…
        </div>
      )}

      {/* Acknowledge — only when sent (nobody responded yet) */}
      {alert.status === "sent" && (
        <div style={{ marginTop: 12 }}>
          <button
            onClick={() => onAcknowledge(alert._id)}
            disabled={acting === alert._id}
            style={{
              width: "100%", padding: "9px 0", borderRadius: 10, border: "none",
              background: acting === alert._id ? C.amberBr : `linear-gradient(135deg, ${C.amber}, #D97706)`,
              fontSize: 12, fontWeight: 700, color: "#fff",
              cursor: acting === alert._id ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <ShieldCheck size={13} />
            {acting === alert._id ? "…" : "Acknowledge — I'm on my way"}
          </button>
        </div>
      )}

      {/* Request Resolve — only after guard has acknowledged */}
      {alert.status === "acknowledged" && (
        <div style={{ marginTop: 12 }}>
          <button
            onClick={() => onResolve(alert._id)}
            disabled={acting === alert._id}
            style={{
              width: "100%", padding: "9px 0", borderRadius: 10, border: "none",
              background: acting === alert._id ? C.borderL : `linear-gradient(135deg, ${C.green}, #15803D)`,
              fontSize: 12, fontWeight: 700, color: acting === alert._id ? C.muted : "#fff",
              cursor: acting === alert._id ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <CheckCircle2 size={13} />
            {acting === alert._id ? "…" : "Request Resolve"}
          </button>
        </div>
      )}
    </motion.div>
  );
}

export function SosAlertPanel() {
  const { user, token } = useAuth();
  const [open,          setOpen]          = useState(false);
  const [alerts,        setAlerts]        = useState([]);
  const [acting,        setActing]        = useState(null);
  const [bounce,        setBounce]        = useState(false);
  const [incomingAlert, setIncomingAlert] = useState(null); // drives the center-screen popup

  const role    = user?.role;
  const visible = role === "security" || role === "committee" || role === "super_admin";

  const activeCount = alerts.filter(a => a.status !== "resolved").length;

  // Load existing unresolved alerts on mount
  const load = useCallback(async () => {
    if (!token || !visible) return;
    try {
      const data = await apiRequest("/sos", { token, notifyError: false });
      setAlerts(data.alerts || []);
    } catch (_) {}
  }, [token, visible]);

  useEffect(() => { load(); }, [load]);

  // Real-time socket listeners
  useEffect(() => {
    if (!visible) return;
    const socket = getSocket();

    function onNewAlert({ alert }) {
      setAlerts(prev => {
        if (prev.find(a => a._id === alert._id)) return prev;
        return [alert, ...prev];
      });
      setIncomingAlert(alert); // show center-screen popup
      setOpen(true);
      setBounce(true);
      setTimeout(() => setBounce(false), 600);
    }

    function onAcknowledged({ alertId }) {
      setAlerts(prev => prev.map(a =>
        a._id === alertId ? { ...a, status: "acknowledged" } : a
      ));
    }

    function onResolved({ alertId }) {
      setAlerts(prev => prev.map(a =>
        a._id === alertId ? { ...a, status: "resolved" } : a
      ));
    }

    function onResolutionRequested({ alertId }) {
      setAlerts(prev => prev.map(a =>
        a._id === alertId ? { ...a, status: "pending_user_confirmation" } : a
      ));
    }

    function onResolveRejected({ alertId }) {
      // Resident said no help arrived — revert fully to sent so guard must re-acknowledge
      setAlerts(prev => prev.map(a =>
        a._id === alertId
          ? { ...a, status: "sent", acknowledgedBy: null, acknowledgedAt: null }
          : a
      ));
    }

    socket.on("sos:alert",                onNewAlert);
    socket.on("sos:acknowledged",         onAcknowledged);
    socket.on("sos:resolved",             onResolved);
    socket.on("sos:resolution_requested", onResolutionRequested);
    socket.on("sos:resolve_rejected",     onResolveRejected);
    return () => {
      socket.off("sos:alert",                onNewAlert);
      socket.off("sos:acknowledged",         onAcknowledged);
      socket.off("sos:resolved",             onResolved);
      socket.off("sos:resolution_requested", onResolutionRequested);
      socket.off("sos:resolve_rejected",     onResolveRejected);
    };
  }, [visible]);

  if (!visible) return null;

  async function handleAcknowledge(id) {
    setActing(id);
    try {
      const data = await apiRequest(`/sos/${id}/acknowledge`, {
        token, method: "PATCH", notifySuccess: false,
      });
      setAlerts(prev => prev.map(a => a._id === id ? data.alert : a));
    } catch (_) {}
    finally { setActing(null); }
  }

  async function handleResolve(id) {
    setActing(id);
    try {
      const data = await apiRequest(`/sos/${id}/resolve`, {
        token, method: "PATCH", notifySuccess: false,
      });
      setAlerts(prev => prev.map(a => a._id === id ? data.alert : a));
    } catch (_) {}
    finally { setActing(null); }
  }

  return (
    <>
      <style>{CSS}</style>

      {/* ── Center-screen emergency popup ── */}
      <AnimatePresence>
        {incomingAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed", inset: 0, zIndex: 10001,
              background: "rgba(10,0,0,0.65)", backdropFilter: "blur(6px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: 24,
            }}
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 20 }}
              animate={{ scale: 1,    opacity: 1, y: 0  }}
              exit={{   scale: 0.88, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
              style={{
                background: C.surface, borderRadius: 28,
                maxWidth: 380, width: "100%",
                overflow: "hidden",
                boxShadow: "0 40px 80px rgba(0,0,0,0.35)",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              {/* Red header band */}
              <div style={{
                background: "linear-gradient(135deg, #DC2626, #991B1B)",
                padding: "22px 24px 20px",
                display: "flex", alignItems: "center", gap: 14,
              }}>
                <div
                  className="sap-emergency-ring"
                  style={{
                    width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
                    background: "rgba(255,255,255,0.18)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <AlertTriangle size={24} color="#fff" strokeWidth={2.5} />
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.7)", letterSpacing: "0.14em", textTransform: "uppercase", margin: 0 }}>
                    Emergency SOS
                  </p>
                  <p style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: "3px 0 0", letterSpacing: "-0.4px" }}>
                    {incomingAlert.unit
                      ? `Flat ${incomingAlert.unit}${incomingAlert.wing ? ` · ${incomingAlert.wing} Wing` : ""}`
                      : "Unknown location"}
                  </p>
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: "18px 24px 22px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
                  <User size={13} color={C.faint} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>
                    {incomingAlert.residentId?.fullName || "Resident"}
                  </span>
                </div>

                {incomingAlert.message && (
                  <div style={{
                    background: C.redL, borderRadius: 12,
                    padding: "10px 14px", marginBottom: 16,
                    fontSize: 13, color: C.red, fontStyle: "italic", lineHeight: 1.55,
                  }}>
                    "{incomingAlert.message}"
                  </div>
                )}

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={() => {
                      setIncomingAlert(null);
                      handleAcknowledge(incomingAlert._id);
                    }}
                    style={{
                      flex: 1, padding: "11px 0", borderRadius: 12, border: "none",
                      background: `linear-gradient(135deg, ${C.amber}, #D97706)`,
                      fontSize: 13, fontWeight: 800, color: "#fff",
                      cursor: "pointer", fontFamily: "inherit",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                    }}
                  >
                    <ShieldCheck size={14} /> Acknowledge
                  </button>
                  <button
                    onClick={() => setIncomingAlert(null)}
                    style={{
                      padding: "11px 16px", borderRadius: 12,
                      border: `1.5px solid ${C.border}`, background: C.surface,
                      fontSize: 13, fontWeight: 600, color: C.muted,
                      cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alert panel drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1     }}
            exit={{   opacity: 0, y: 16, scale: 0.97  }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
            style={{
              position: "fixed", bottom: 92, right: 24, zIndex: 9998,
              width: 340, maxHeight: "70vh",
              background: C.surface, borderRadius: 22,
              border: `1.5px solid ${C.border}`,
              boxShadow: "0 16px 48px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.05)",
              display: "flex", flexDirection: "column",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              overflow: "hidden",
            }}
          >
            {/* Panel header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 18px 14px",
              borderBottom: `1px solid ${C.borderL}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: activeCount > 0 ? C.redL : C.bg,
                  border: `1px solid ${activeCount > 0 ? C.redBr : C.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <AlertTriangle size={15} color={activeCount > 0 ? C.red : C.faint} strokeWidth={2} />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 800, color: C.ink, margin: 0 }}>SOS Alerts</p>
                  <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>
                    {activeCount > 0 ? `${activeCount} active` : "All clear"}
                  </p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} style={{
                background: "none", border: "none", cursor: "pointer",
                color: C.faint, padding: 4, lineHeight: 0,
              }}>
                <X size={15} />
              </button>
            </div>

            {/* Alert list */}
            <div className="sap-card-scroll" style={{ overflowY: "auto", padding: "12px 12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
              {alerts.length === 0 ? (
                <div style={{ padding: "32px 0", textAlign: "center" }}>
                  <p style={{ fontSize: 28, marginBottom: 8 }}>✅</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>No alerts</p>
                  <p style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>Society is all clear</p>
                </div>
              ) : (
                <AnimatePresence>
                  {alerts.map(a => (
                    <AlertCard
                      key={a._id}
                      alert={a}
                      onAcknowledge={handleAcknowledge}
                      onResolve={handleResolve}
                      acting={acting}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating toggle button */}
      <motion.button
        onClick={() => setOpen(v => !v)}
        whileTap={{ scale: 0.9 }}
        title="SOS Alerts"
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9999,
          width: 52, height: 52, borderRadius: "50%", border: "none",
          background: activeCount > 0
            ? "linear-gradient(135deg, #DC2626, #B91C1C)"
            : "linear-gradient(135deg, #4F46E5, #4338CA)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
          boxShadow: activeCount > 0
            ? "0 4px 16px rgba(220,38,38,0.45)"
            : "0 4px 16px rgba(79,70,229,0.35)",
          transition: "background 0.4s ease, box-shadow 0.4s ease",
        }}
      >
        <AlertTriangle size={20} color="#fff" strokeWidth={2.2} />
        {/* Active count badge */}
        {activeCount > 0 && (
          <motion.span
            key={activeCount}
            initial={{ scale: 0.6 }}
            animate={{ scale: 1 }}
            className={bounce ? "sap-badge-bounce" : ""}
            style={{
              position: "absolute", top: -3, right: -3,
              width: 18, height: 18, borderRadius: "50%",
              background: "#fff", border: "2px solid #DC2626",
              fontSize: 10, fontWeight: 800, color: C.red,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              lineHeight: 1,
            }}
          >
            {activeCount}
          </motion.span>
        )}
      </motion.button>
    </>
  );
}
