import mongoose from "mongoose";
import { StatusCodes } from "http-status-codes";
import { Ticket } from "../models/ticket.model.js";
import { AppError } from "../utils/app-error.js";
import { SOCKET_EVENTS } from "../config/socket-events.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { emitRealtime } from "../services/realtime-bus.service.js";

const ALLOWED_TICKET_STATUSES = ["in_progress", "resolved"];

function sanitizeText(value) {
  return typeof value === "string" ? value.trim() : "";
} //making the value is string and if it is then it is trimmed.

export async function uploadTicketPhotos(req, res, next) {
  try {
    if (!req.files || req.files.length === 0) {
      throw new AppError("No files uploaded", StatusCodes.BAD_REQUEST);
    }

    if (req.files.length > 3) {
      throw new AppError("Maximum 3 photos allowed per ticket", StatusCodes.BAD_REQUEST);
    }

    const urls = await Promise.all(
      req.files.map((file) => uploadToCloudinary(file.buffer, { folder: "tickets" }))
    );

    res.json({ urls });
  } catch (error) {
    next(error);
  }
}

export async function listTickets(req, res, next) {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const items = await Ticket.find({ tenantId: req.tenantId, createdAt: { $gte: sixMonthsAgo } })
      .sort({ createdAt: -1 })
      .populate("createdBy", "fullName role")
      .populate("assignedTo", "fullName role");

    res.json({ items });
  } catch (error) {
    next(error);
  }
}

export async function createTicket(req, res, next) {
  try {
    const title = sanitizeText(req.body?.title);
    const description = sanitizeText(req.body?.description);
    const photos = Array.isArray(req.body?.photos)
      ? req.body.photos.map((u) => sanitizeText(u)).filter(Boolean).slice(0, 3)
      : [];

    if (!title || !description) {
      throw new AppError("title and description are required", StatusCodes.BAD_REQUEST);
    }

    const ticket = await Ticket.create({
      tenantId: req.tenantId,
      title,
      description,
      photos,
      createdBy: req.user.userId
    });

    const io = req.app.get("io");
    await emitRealtime(io, {
      room: `tenant:${req.tenantId}`,
      event: SOCKET_EVENTS.TICKET_CREATED,
      payload: {
        item: ticket
      }
    });

    res.status(StatusCodes.CREATED).json({ item: ticket });
  } catch (error) {
    next(error);
  }
}

export async function updateTicketStatus(req, res, next) {
  try {
    const ticketId = sanitizeText(req.params?.ticketId);
    const status = sanitizeText(req.body?.status);
    const resolutionDescription = sanitizeText(req.body?.resolutionDescription);
    const resolutionPhotos = Array.isArray(req.body?.resolutionPhotos)
      ? req.body.resolutionPhotos.map((u) => sanitizeText(u)).filter(Boolean).slice(0, 5)
      : [];

    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      throw new AppError("Invalid ticketId", StatusCodes.BAD_REQUEST);
    }

    if (!ALLOWED_TICKET_STATUSES.includes(status)) {
      throw new AppError(
        `status must be one of: ${ALLOWED_TICKET_STATUSES.join(", ")}`,
        StatusCodes.BAD_REQUEST
      );
    }

    const ticket = await Ticket.findOne({ _id: ticketId, tenantId: req.tenantId });
    if (!ticket) {
      throw new AppError("Ticket not found", StatusCodes.NOT_FOUND);
    }

    ticket.status = status;

    if (status === "resolved") {
      ticket.resolution = {
        description: resolutionDescription,
        photos: resolutionPhotos,
        resolvedBy: req.user.userId,
        resolvedAt: new Date()
      };
    }

    await ticket.save();

    const populated = await ticket.populate([
      { path: "createdBy", select: "fullName role" },
      { path: "resolution.resolvedBy", select: "fullName role" }
    ]);

    const io = req.app.get("io");
    await emitRealtime(io, {
      room: `tenant:${req.tenantId}`,
      event: SOCKET_EVENTS.TICKET_STATUS_UPDATED,
      payload: { item: populated }
    });

    res.json({ item: populated });
  } catch (error) {
    next(error);
  }
}
