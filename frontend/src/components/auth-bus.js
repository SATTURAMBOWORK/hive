// Lets non-React code (api.js) tell AuthContext that the session is dead.
// Same pattern as toast-bus.js: a window CustomEvent acts as a tiny pub/sub.
const AUTH_EXPIRED_EVENT = "app:auth-expired";

export function emitAuthExpired() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
}

export function subscribeToAuthExpired(handler) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener(AUTH_EXPIRED_EVENT, handler);
  return () => {
    window.removeEventListener(AUTH_EXPIRED_EVENT, handler);
  };
}
