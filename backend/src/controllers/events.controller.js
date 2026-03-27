import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
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

export async function updateEvent(req, res, next) {
  try {
    const eventId = sanitizeText(req.params?.eventId);
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      throw new AppError("Invalid eventId", StatusCodes.BAD_REQUEST);
    }

    const event = await Event.findOne({ _id: eventId, tenantId: req.tenantId });
    if (!event) {
      throw new AppError("Event not found", StatusCodes.NOT_FOUND);
    }

    const title = sanitizeText(req.body?.title);
    const description = sanitizeText(req.body?.description);
    const location = sanitizeText(req.body?.location);

    const nextStartAt = req.body?.startAt ? new Date(req.body.startAt) : new Date(event.startAt);
    const nextEndAt = req.body?.endAt ? new Date(req.body.endAt) : new Date(event.endAt);

    if (req.body?.startAt && Number.isNaN(nextStartAt.getTime())) {
      throw new AppError("Invalid startAt date", StatusCodes.BAD_REQUEST);
    }

    if (req.body?.endAt && Number.isNaN(nextEndAt.getTime())) {
      throw new AppError("Invalid endAt date", StatusCodes.BAD_REQUEST);
    }

    if (nextEndAt <= nextStartAt) {
      throw new AppError("endAt must be after startAt", StatusCodes.BAD_REQUEST);
    }

    if (title) event.title = title;
    if (description) event.description = description;
    if (location) event.location = location;
    event.startAt = nextStartAt;
    event.endAt = nextEndAt;

    await event.save();

    const io = req.app.get("io");
    io.to(`tenant:${req.tenantId}`).emit(SOCKET_EVENTS.EVENT_UPDATED, {
      item: event
    });

    res.json({ item: event });
  } catch (error) {
    next(error);
  }
}

export async function deleteEvent(req, res, next) {
  try {
    const eventId = sanitizeText(req.params?.eventId);
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      throw new AppError("Invalid eventId", StatusCodes.BAD_REQUEST);
    }

    const event = await Event.findOneAndDelete({ _id: eventId, tenantId: req.tenantId });
    if (!event) {
      throw new AppError("Event not found", StatusCodes.NOT_FOUND);
    }

    const io = req.app.get("io");
    io.to(`tenant:${req.tenantId}`).emit(SOCKET_EVENTS.EVENT_DELETED, {
      item: event
    });

    res.status(StatusCodes.OK).json({ message: "Event deleted", item: event });
  } catch (error) {
    next(error);
  }
}
