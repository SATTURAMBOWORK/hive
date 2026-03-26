import { io } from "socket.io-client";
import { SOCKET_BASE_URL } from "./config";

let socket;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_BASE_URL, {
      autoConnect: true,
      transports: ["websocket"]
    });
  }
  return socket;
}

export function joinTenantRoom(tenantId) {
  if (!tenantId) return;
  getSocket().emit("tenant:join", String(tenantId));
}

export function leaveTenantRoom(tenantId) {
  if (!tenantId) return;
  getSocket().emit("tenant:leave", String(tenantId));
}
