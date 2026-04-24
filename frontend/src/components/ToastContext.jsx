import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { subscribeToToasts } from "./toast-bus";

const C = {
  bg: "#FAFAFC",
  surface: "#FFFFFF",
  ink: "#1C1C1E",
  muted: "#6B7280",
  border: "#E8E8ED",
  success: "#16A34A",
  error: "#DC2626",
  successBg: "#DCFCE7",
  errorBg: "#FEF2F2",
};

const ToastContext = createContext(null);

function ToastItem({ id, type, message, onDismiss }) {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      onDismiss(id);
    }, 4000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [id, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      style={{
        borderRadius: 14,
        border: `1px solid ${type === "success" ? C.success : C.error}`,
        background: C.surface,
        boxShadow: "0 14px 28px rgba(28,28,30,0.12)",
        minWidth: 280,
        maxWidth: 360,
        overflow: "hidden",
        pointerEvents: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
          padding: "12px 12px 12px 10px",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          color: C.ink,
          background: C.surface,
        }}
      >
        <div
          style={{
            width: 8,
            alignSelf: "stretch",
            borderRadius: 999,
            background: type === "success" ? C.success : C.error,
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {type === "success" ? "Success" : "Error"}
          </p>
          <p style={{ margin: "4px 0 0", fontSize: "0.85rem", lineHeight: 1.45, fontWeight: 600 }}>
            {message}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onDismiss(id)}
          style={{
            border: `1px solid ${C.border}`,
            background: type === "success" ? C.successBg : C.errorBg,
            color: type === "success" ? C.success : C.error,
            borderRadius: 8,
            width: 24,
            height: 24,
            cursor: "pointer",
            fontWeight: 800,
            lineHeight: 1,
            flexShrink: 0,
          }}
          aria-label="Dismiss toast"
        >
          ×
        </button>
      </div>
    </motion.div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const pushToast = useCallback((type, message) => {
    const text = String(message || "").trim();
    if (!text) return;

    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [...prev, { id, type, message: text }]);
  }, []);

  const value = useMemo(() => ({
    toast: {
      success: (message) => pushToast("success", message),
      error: (message) => pushToast("error", message),
    },
  }), [pushToast]);

  useEffect(() => {
    return subscribeToToasts(({ type, message }) => {
      if (type === "success") pushToast("success", message);
      if (type === "error") pushToast("error", message);
    });
  }, [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        style={{
          position: "fixed",
          right: 18,
          bottom: 18,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          pointerEvents: "none",
        }}
      >
        <AnimatePresence>
          {toasts.map((item) => (
            <ToastItem
              key={item.id}
              id={item.id}
              type={item.type}
              message={item.message}
              onDismiss={dismiss}
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return context;
}
