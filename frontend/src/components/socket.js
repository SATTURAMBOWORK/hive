import { io } from "socket.io-client";
import { SOCKET_BASE_URL } from "./config";

let socket;
let _tenantId = null;
let _userId = null;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_BASE_URL, {
      autoConnect: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on("connect", () => {
      console.log("[Socket] Connected:", socket.id);
      // Re-join rooms on every connect (initial connection + every reconnect)
      if (_tenantId) socket.emit("tenant:join", _tenantId);
      if (_userId)   socket.emit("user:join",   _userId);
    });

    socket.on("disconnect", (reason) => {
      console.log("[Socket] Disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      console.error("[Socket] Connection error:", err.message);
    });
  }
  return socket;
}

export function joinTenantRoom(tenantId) {
  if (!tenantId) return;
  _tenantId = String(tenantId);
  const s = getSocket();
  if (s.connected) s.emit("tenant:join", _tenantId);
}

export function joinUserRoom(userId) {
  if (!userId) return;
  _userId = String(userId);
  const s = getSocket();
  if (s.connected) s.emit("user:join", _userId);
}

export function leaveTenantRoom(tenantId) {
  if (!tenantId) return;
  _tenantId = null;
  getSocket().emit("tenant:leave", String(tenantId));
}

export function leaveUserRoom(userId) {
  if (!userId) return;
  _userId = null;
  getSocket().emit("user:leave", String(userId));
}
