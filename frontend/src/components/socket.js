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
    });

    // Re-join rooms on every connect (initial + every reconnect after Render wakes up)
    socket.on("connect", () => {
      if (_tenantId) socket.emit("tenant:join", _tenantId);
      if (_userId)   socket.emit("user:join",   _userId);
    });
  }
  return socket;
}

export function joinTenantRoom(tenantId) {
  if (!tenantId) return;
  _tenantId = String(tenantId);
  getSocket().emit("tenant:join", _tenantId);
}

export function joinUserRoom(userId) {
  if (!userId) return;
  _userId = String(userId);
  getSocket().emit("user:join", _userId);
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
