import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import { AmenityBooking } from "../models/amenity-booking.model.js";
import { AppError } from "../utils/app-error.js";
import { SOCKET_EVENTS } from "../config/socket-events.js";

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const ALLOWED_STATUS_UPDATES = ["approved", "rejected", "cancelled"];

function sanitizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export async function listAmenityBookings(req, res, next) {
  try {
    const items = await AmenityBooking.find({ tenantId: req.tenantId })
      .sort({ date: 1, startTime: 1, createdAt: -1 })
      .populate("requestedBy", "fullName role");

    res.json({ items });
  } catch (error) {
    next(error);
  }
}

export async function createAmenityBooking(req, res, next) {
  try {
    const amenityName = sanitizeText(req.body?.amenityName);
    const date = sanitizeText(req.body?.date);
    const startTime = sanitizeText(req.body?.startTime);
    const endTime = sanitizeText(req.body?.endTime);

    if (!amenityName || !date || !startTime || !endTime) {
      throw new AppError(
        "amenityName, date, startTime and endTime are required",
        StatusCodes.BAD_REQUEST
      );
    }

    if (!DATE_REGEX.test(date)) {
      throw new AppError("date must be in YYYY-MM-DD format", StatusCodes.BAD_REQUEST);
    }

    if (!TIME_REGEX.test(startTime) || !TIME_REGEX.test(endTime)) {
      throw new AppError("startTime and endTime must be HH:mm", StatusCodes.BAD_REQUEST);
    }

    if (endTime <= startTime) {
      throw new AppError("endTime must be after startTime", StatusCodes.BAD_REQUEST);
    }

    const conflicting = await AmenityBooking.findOne({
      tenantId: req.tenantId,
      amenityName,
      date,
      status: { $in: ["pending", "approved"] },
      startTime: { $lt: endTime },
      endTime: { $gt: startTime }
    });

    if (conflicting) {
      throw new AppError("Amenity slot already booked for that time", StatusCodes.CONFLICT);
    }

    const booking = await AmenityBooking.create({
      tenantId: req.tenantId,
      amenityName,
      date,
      startTime,
      endTime,
      requestedBy: req.user.userId
    });

    const io = req.app.get("io");
    io.to(`tenant:${req.tenantId}`).emit(SOCKET_EVENTS.AMENITY_BOOKING_CREATED, {
      item: booking
    });

    res.status(StatusCodes.CREATED).json({ item: booking });
  } catch (error) {
    next(error);
  }
}

export async function updateAmenityBookingStatus(req, res, next) {
  try {
    const bookingId = sanitizeText(req.params?.bookingId);
    const status = sanitizeText(req.body?.status);

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      throw new AppError("Invalid bookingId", StatusCodes.BAD_REQUEST);
    }

    if (!ALLOWED_STATUS_UPDATES.includes(status)) {
      throw new AppError(
        `status must be one of: ${ALLOWED_STATUS_UPDATES.join(", ")}`,
        StatusCodes.BAD_REQUEST
      );
    }

    const booking = await AmenityBooking.findOne({ _id: bookingId, tenantId: req.tenantId });
    if (!booking) {
      throw new AppError("Amenity booking not found", StatusCodes.NOT_FOUND);
    }

    const isApprover = ["committee", "super_admin"].includes(req.user.role);
    const isRequester = booking.requestedBy.toString() === req.user.userId;

    if (status === "cancelled") {
      if (!isApprover && !isRequester) {
        throw new AppError("Forbidden", StatusCodes.FORBIDDEN);
      }
    } else if (!isApprover) {
      throw new AppError("Forbidden", StatusCodes.FORBIDDEN);
    }

    booking.status = status;
    await booking.save();

    const populatedBooking = await booking.populate("requestedBy", "fullName role");

    const io = req.app.get("io");
    io.to(`tenant:${req.tenantId}`).emit(SOCKET_EVENTS.AMENITY_BOOKING_STATUS_UPDATED, {
      item: populatedBooking
    });

    res.json({ item: populatedBooking });
  } catch (error) {
    next(error);
  }
}
