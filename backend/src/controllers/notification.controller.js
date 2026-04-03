import mongoose from "mongoose";
import { StatusCodes } from "http-status-codes";
import { Notification } from "../models/notification.model.js";
import { AppError } from "../utils/app-error.js";

export async function getMyNotifications(req, res, next) {
  try {
    const notifications = await Notification.find({
      tenantId: req.tenantId,
      userId: req.user.userId
    })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    res.json({ notifications, unreadCount });
  } catch (error) {
    next(error);
  }
}

export async function markOneRead(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid notification id", StatusCodes.BAD_REQUEST);
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: req.user.userId, tenantId: req.tenantId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      throw new AppError("Notification not found", StatusCodes.NOT_FOUND);
    }

    res.json({ notification });
  } catch (error) {
    next(error);
  }
}

export async function markAllRead(req, res, next) {
  try {
    await Notification.updateMany(
      { tenantId: req.tenantId, userId: req.user.userId, isRead: false },
      { isRead: true }
    );

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    next(error);
  }
}
