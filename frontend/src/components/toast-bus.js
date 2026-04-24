const TOAST_EVENT = "app:toast";

export function emitToast(type, message) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(TOAST_EVENT, {
      detail: {
        type,
        message,
      },
    })
  );
}

export function subscribeToToasts(handler) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const listener = (event) => {
    const { type, message } = event.detail || {};
    if (!type || !message) return;
    handler({ type, message });
  };

  window.addEventListener(TOAST_EVENT, listener);
  return () => {
    window.removeEventListener(TOAST_EVENT, listener);
  };
}
