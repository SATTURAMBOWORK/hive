import mongoose from "mongoose";
import { StatusCodes } from "http-status-codes";
import { Ticket } from "../models/ticket.model.js";
import { AppError } from "../utils/app-error.js";
import { SOCKET_EVENTS } from "../config/socket-events.js";

const ALLOWED_TICKET_STATUSES = ["open", "in_progress", "resolved", "closed"];

function sanitizeText(value) {
  return typeof value === "string" ? value.trim() : "";
} //making the value is string and if it is then it is trimmed.

export async function listTickets(req, res, next) {
  try {
    const items = await Ticket.find({ tenantId: req.tenantId })
      .sort({ createdAt: -1 })    //latest ticket first
      .populate("createdBy", "fullName role") // replaces created by with actual user data
      .populate("assignedTo", "fullName role"); // same as above

    res.json({ items });
  } catch (error) {
    next(error);
  }
}

export async function createTicket(req, res, next) {
  try {
    const title = sanitizeText(req.body?.title);
    const description = sanitizeText(req.body?.description);
    const category = sanitizeText(req.body?.category) || "general";

    if (!title || !description) {
      throw new AppError("title and description are required", StatusCodes.BAD_REQUEST);
    }

    const ticket = await Ticket.create({
      tenantId: req.tenantId,
      title,
      description,
      category,
      createdBy: req.user.userId
    });

    const io = req.app.get("io");
    io.to(`tenant:${req.tenantId}`).emit(SOCKET_EVENTS.TICKET_CREATED, {
      item: ticket
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
    const assignedTo = sanitizeText(req.body?.assignedTo);

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

    if (assignedTo) {
      if (!mongoose.Types.ObjectId.isValid(assignedTo)) {
        throw new AppError("Invalid assignedTo", StatusCodes.BAD_REQUEST);
      }
      ticket.assignedTo = assignedTo;
    }

    await ticket.save();

    const io = req.app.get("io");
    io.to(`tenant:${req.tenantId}`).emit(SOCKET_EVENTS.TICKET_STATUS_UPDATED, {
      item: ticket
    });

    res.json({ item: ticket });
  } catch (error) {
    next(error);
  }
}
