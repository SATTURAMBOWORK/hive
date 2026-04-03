import { Notification } from "../models/notification.model.js";
import { SOCKET_EVENTS } from "../config/socket-events.js";

export async function createNotification(io, { tenantId, userId, type, title, message, data = {} }) {
  const notification = await Notification.create({ tenantId, userId, type, title, message, data });
  io.to(`user:${userId}`).emit(SOCKET_EVENTS.NOTIFICATION_CREATED, { notification });
  return notification;
}
