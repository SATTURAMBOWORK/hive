import { Notification } from "../models/notification.model.js";
import { SOCKET_EVENTS } from "../config/socket-events.js";
import { emitRealtime } from "../services/realtime-bus.service.js";

export async function createNotification(io, { tenantId, userId, type, title, message, data = {} }) {
  const notification = await Notification.create({ tenantId, userId, type, title, message, data });
  await emitRealtime(io, {
    room: `user:${userId}`,
    event: SOCKET_EVENTS.NOTIFICATION_CREATED,
    payload: { notification }
  });
  return notification;
}
