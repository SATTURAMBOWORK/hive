import { StatusCodes } from "http-status-codes";
import { Event } from "../models/event.model.js";
import { AppError } from "../utils/app-error.js";
import { SOCKET_EVENTS } from "../config/socket-events.js";

function sanitizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export async function listEvents(req, res, next) {
  try {
    const items = await Event.find({ tenantId: req.tenantId })
      .sort({ startAt: 1, createdAt: -1 })
      .populate("createdBy", "fullName role");

    res.json({ items });
  } catch (error) {
    next(error);
  }
}

export async function createEvent(req, res, next) {
  try {
    const title = sanitizeText(req.body?.title);
    const description = sanitizeText(req.body?.description);
    const location = sanitizeText(req.body?.location) || "Club House";
    const startAt = req.body?.startAt;
    const endAt = req.body?.endAt;

    if (!title || !startAt || !endAt) {
      throw new AppError("title, startAt and endAt are required", StatusCodes.BAD_REQUEST);
    }

    const startDate = new Date(startAt);
    const endDate = new Date(endAt);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new AppError("Invalid event date values", StatusCodes.BAD_REQUEST);
    }

    if (endDate <= startDate) {
      throw new AppError("endAt must be after startAt", StatusCodes.BAD_REQUEST);
    }

    const event = await Event.create({
      tenantId: req.tenantId,
      title,
      description,
      startAt: startDate,
      endAt: endDate,
      location,
      createdBy: req.user.userId
    });

    const io = req.app.get("io");
    io.to(`tenant:${req.tenantId}`).emit(SOCKET_EVENTS.EVENT_CREATED, {
      item: event
    });

    res.status(StatusCodes.CREATED).json({ item: event });
  } catch (error) {
    next(error);
  }
}
