import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, Clock, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useAuth } from "./AuthContext";
import { apiRequest } from "./api";
import { getSocket } from "./socket";

const C = {
  surface: "#FFFFFF", ink: "#1C1C1E", muted: "#6B7280",
  border: "#E8E8ED", faint: "#F5F5F7",
  red: "#DC2626", redL: "#FEF2F2", redBr: "#FECACA",
  amber: "#F59E0B", amberL: "#FFFBEB",
  green: "#16A34A", greenL: "#DCFCE7",
};

const STATUS = {
  sent:                      { label: "Alert sent",           sub: "Waiting for security to respond",   color: C.red,    bg: C.redL,   Icon: Clock,       pulse: true  },
  acknowledged:              { label: "Guard is on the way",  sub: "Security has acknowledged",         color: C.amber,  bg: C.amberL, Icon: ShieldCheck,  pulse: false },
  pending_user_confirmation: { label: "Are you safe?",        sub: "Guard is requesting to close alert",color: "#4F46E5",bg: "#EEF2FF", Icon: ShieldCheck,  pulse: false },
  resolved:                  { label: "Situation resolved",   sub: "You are safe. Alert closed.",       color: C.green,  bg: C.greenL, Icon: CheckCircle2, pulse: false },
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  @keyframes sos-ring {
    0%   { box-shadow: 0 0 0 0   rgba(220,38,38,0.55); }
    70%  { box-shadow: 0 0 0 16px rgba(220,38,38,0);   }
    100% { box-shadow: 0 0 0 0   rgba(220,38,38,0);    }
  }
  .sos-btn-pulse { animation: sos-ring 1.8s ease-out infinite; }
`;

export function SosButton() {
  const { user, token } = useAuth();
  const [showModal,       setShowModal]       = useState(false);
  const [message,         setMessage]         = useState("");
  const [sending,         setSending]         = useState(false);
  const [confirming,      setConfirming]      = useState(false);
  const [activeAlert,     setActiveAlert]     = useState(null);
  const [showConfirmSafe, setShowConfirmSafe] = useState(false);

  const role    = user?.role;
  const visible = role === "resident" || role === "committee";

  // Restore active alert from server on mount (handles page refresh)
  useEffect(() => {
    if (!visible || !token) return;
    apiRequest("/sos/mine/active", { token, notifyError: false })
      .then(data => {
        if (!data.alert) return;
        setActiveAlert(data.alert);
        if (data.alert.status === "pending_user_confirmation") {
          setShowConfirmSafe(true);
        }
      })
      .catch(() => {});
  }, [visible, token]);

  // Listen for status updates from guards
  useEffect(() => {
    if (!visible) return;
    const socket = getSocket();

    function onAcknowledged({ alertId }) {
      setActiveAlert(prev => prev?._id === alertId ? { ...prev, status: "acknowledged" } : prev);
    }
    function onResolutionRequested({ alertId }) {
      setActiveAlert(prev => {
        // If a different alert is active, ignore this event
        if (prev && prev._id !== alertId) return prev;
        setShowConfirmSafe(true);
        // If we already have the full alert object, just update its status
        if (prev) return { ...prev, status: "pending_user_confirmation" };
        // Page was refreshed — we don't have alert data yet, create a minimal
        // placeholder so the popup can render. The _id is enough to confirm/reject.
        return { _id: alertId, status: "pending_user_confirmation" };
      });
    }
    function onResolved({ alertId }) {
      setActiveAlert(prev => {
        if (prev && prev._id !== alertId) return prev;
        return prev ? { ...prev, status: "resolved" } : prev;
      });
      setShowConfirmSafe(false);
      setTimeout(() => setActiveAlert(null), 6000);
    }

    socket.on("sos:acknowledged",         onAcknowledged);
    socket.on("sos:resolution_requested", onResolutionRequested);
    socket.on("sos:resolved",             onResolved);
    return () => {
      socket.off("sos:acknowledged",         onAcknowledged);
      socket.off("sos:resolution_requested", onResolutionRequested);
      socket.off("sos:resolved",             onResolved);
    };
  }, [visible]);

  if (!visible) return null;

  async function handleSend() {
    setSending(true);
    try {
      const data = await apiRequest("/sos", {
        token, method: "POST",
        body: { message: message.trim() },
        notifySuccess: false,
      });
      setActiveAlert(data.alert);
      setShowModal(false);
      setMessage("");
    } catch (_err) {
      // error toast is shown by apiRequest automatically
    } finally {
      setSending(false);
    }
  }

  async function confirmSafe() {
    if (!activeAlert) return;
    setConfirming(true);
    try {
      await apiRequest(`/sos/${activeAlert._id}/confirm-resolve`, {
        token, method: "PATCH", notifySuccess: false,
      });
      setActiveAlert(prev => prev ? { ...prev, status: "resolved" } : prev);
      setShowConfirmSafe(false);
      setTimeout(() => setActiveAlert(null), 6000);
    } catch (_) {}
    finally { setConfirming(false); }
  }

  const cfg = activeAlert ? STATUS[activeAlert.status] : null;

  return (
    <>
      <style>{CSS}</style>

      {/* Status card — appears above the button when alert is active */}
      <AnimatePresence>
        {activeAlert && cfg && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.94 }}
            animate={{ opacity: 1, y: 0,  scale: 1     }}
            exit={{   opacity: 0, y: 16, scale: 0.94  }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            style={{
              position: "fixed", bottom: 92, right: 24, zIndex: 9998,
              background: C.surface, borderRadius: 18,
              border: `1.5px solid ${cfg.color}35`,
              boxShadow: `0 8px 28px ${cfg.color}18, 0 2px 6px rgba(0,0,0,0.05)`,
              padding: "13px 16px", minWidth: 230, maxWidth: 290,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <cfg.Icon size={17} color={cfg.color} strokeWidth={2} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: C.ink, margin: 0 }}>{cfg.label}</p>
                <p style={{ fontSize: 11, color: C.muted, margin: "2px 0 0", lineHeight: 1.45 }}>{cfg.sub}</p>
              </div>
              <button onClick={() => setActiveAlert(null)} style={{
                background: "none", border: "none", cursor: "pointer",
                color: C.muted, padding: 3, flexShrink: 0, lineHeight: 0,
              }}>
                <X size={13} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating SOS button */}
      <motion.button
        onClick={() => { if (!activeAlert) setShowModal(true); }}
        whileTap={{ scale: 0.9 }}
        className={!activeAlert ? "sos-btn-pulse" : ""}
        title="Emergency SOS"
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9999,
          width: 52, height: 52, borderRadius: "50%", border: "none",
          background: activeAlert
            ? `linear-gradient(135deg, ${cfg.color}, ${cfg.color}CC)`
            : "linear-gradient(135deg, #DC2626, #B91C1C)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: activeAlert ? "default" : "pointer",
          boxShadow: `0 4px 16px ${activeAlert ? cfg.color : "#DC2626"}55`,
          transition: "background 0.4s ease, box-shadow 0.4s ease",
        }}
      >
        <AlertTriangle size={20} color="#fff" strokeWidth={2.3} />
      </motion.button>

      {/* "Are you safe?" resident confirmation popup */}
      <AnimatePresence>
        {showConfirmSafe && activeAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed", inset: 0, zIndex: 10000,
              background: "rgba(10,10,18,0.52)", backdropFilter: "blur(6px)",
              display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 16 }}
              animate={{ scale: 1,   opacity: 1, y: 0  }}
              exit={{   scale: 0.9, opacity: 0, y: 16 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              style={{
                background: C.surface, borderRadius: 24,
                padding: "28px 26px 24px", maxWidth: 360, width: "100%",
                boxShadow: "0 32px 72px rgba(0,0,0,0.22)",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              <div style={{
                width: 50, height: 50, borderRadius: 15,
                background: "#EEF2FF", border: "1.5px solid #C7D2FE",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 18,
              }}>
                <ShieldCheck size={24} color="#4F46E5" />
              </div>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: C.ink, margin: "0 0 8px" }}>
                Are you safe now?
              </h2>
              <p style={{ fontSize: 13, color: C.muted, margin: "0 0 22px", lineHeight: 1.65 }}>
                The guard is requesting to close this alert. Confirm only if the situation has been fully resolved.
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={async () => {
                    try {
                      await apiRequest(`/sos/${activeAlert._id}/reject-resolve`, {
                        token, method: "PATCH", notifySuccess: false,
                      });
                      setActiveAlert(prev => prev ? { ...prev, status: "sent" } : prev);
                    } catch (_) {}
                    setShowConfirmSafe(false);
                  }}
                  style={{
                    flex: 1, padding: "11px 0", borderRadius: 12,
                    border: `1.5px solid ${C.redBr}`, background: C.surface,
                    fontSize: 13, fontWeight: 700, color: C.red,
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  No, still need help
                </button>
                <button
                  onClick={confirmSafe}
                  disabled={confirming}
                  style={{
                    flex: 1, padding: "11px 0", borderRadius: 12, border: "none",
                    background: confirming ? "#C7D2FE" : "linear-gradient(135deg, #4F46E5, #4338CA)",
                    fontSize: 13, fontWeight: 800, color: "#fff",
                    cursor: confirming ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {confirming ? "Closing…" : "Yes, I'm safe"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Send SOS confirmation modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={e => { if (e.target === e.currentTarget) { setShowModal(false); setMessage(""); } }}
            style={{
              position: "fixed", inset: 0, zIndex: 10000,
              background: "rgba(10,10,18,0.52)", backdropFilter: "blur(6px)",
              display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 16 }}
              animate={{ scale: 1,   opacity: 1, y: 0  }}
              exit={{   scale: 0.9, opacity: 0, y: 16 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              style={{
                background: C.surface, borderRadius: 24,
                padding: "28px 26px 24px", maxWidth: 380, width: "100%",
                boxShadow: "0 32px 72px rgba(0,0,0,0.22)",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              <div style={{
                width: 50, height: 50, borderRadius: 15,
                background: C.redL, border: `1.5px solid ${C.redBr}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 18,
              }}>
                <AlertTriangle size={23} color={C.red} />
              </div>

              <h2 style={{ fontSize: 17, fontWeight: 800, color: C.ink, margin: "0 0 8px" }}>
                Send Emergency Alert?
              </h2>
              <p style={{ fontSize: 13, color: C.muted, margin: "0 0 22px", lineHeight: 1.65 }}>
                This instantly notifies all security guards and society management. Use only in a real emergency.
              </p>

              <label style={{
                display: "block", fontSize: 10, fontWeight: 800,
                color: C.muted, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 7,
              }}>
                Message (optional)
              </label>
              <input
                placeholder="e.g. Medical emergency, intruder at door…"
                value={message}
                onChange={e => setMessage(e.target.value)}
                maxLength={80}
                onKeyDown={e => e.key === "Enter" && !sending && handleSend()}
                style={{
                  width: "100%", borderRadius: 12, boxSizing: "border-box",
                  border: `1.5px solid ${C.border}`, background: C.faint,
                  padding: "10px 13px", fontSize: 13, color: C.ink,
                  fontFamily: "inherit", outline: "none", marginBottom: 22,
                }}
                onFocus={e  => e.target.style.borderColor = C.red}
                onBlur={e   => e.target.style.borderColor = C.border}
                autoFocus
              />

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => { setShowModal(false); setMessage(""); }}
                  style={{
                    flex: 1, padding: "11px 0", borderRadius: 12,
                    border: `1.5px solid ${C.border}`, background: C.surface,
                    fontSize: 13, fontWeight: 700, color: C.muted,
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  disabled={sending}
                  style={{
                    flex: 2, padding: "11px 0", borderRadius: 12, border: "none",
                    background: sending ? "#FCA5A5" : "linear-gradient(135deg, #DC2626, #B91C1C)",
                    fontSize: 13, fontWeight: 800, color: "#fff",
                    cursor: sending ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                  }}
                >
                  <AlertTriangle size={13} />
                  {sending ? "Sending…" : "Send SOS Alert"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
