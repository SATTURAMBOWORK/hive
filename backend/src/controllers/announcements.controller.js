import { StatusCodes } from "http-status-codes";
import { Announcement } from "../models/announcement.model.js";
import { AppError } from "../utils/app-error.js";
import { SOCKET_EVENTS } from "../config/socket-events.js";

function sanitizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export async function listAnnouncements(req, res, next) {
  try {
    const announcements = await Announcement.find({ tenantId: req.tenantId })
      .sort({ createdAt: -1 })
      .populate("createdBy", "fullName role");

    res.json({ items: announcements });
  } catch (error) {
    next(error);
  }
}

export async function createAnnouncement(req, res, next) {
  try {
    const title = sanitizeText(req.body?.title);
    const body = sanitizeText(req.body?.body);

    if (!title || !body) {
      throw new AppError("title and body are required", StatusCodes.BAD_REQUEST);
    }

    const announcement = await Announcement.create({
      tenantId: req.tenantId,
      title,
      body,
      createdBy: req.user.userId
    });

    const io = req.app.get("io");
    io.to(`tenant:${req.tenantId}`).emit(SOCKET_EVENTS.ANNOUNCEMENT_CREATED, {
      item: announcement
    });

    res.status(StatusCodes.CREATED).json({ item: announcement });
  } catch (error) {
    next(error);
  }
}
