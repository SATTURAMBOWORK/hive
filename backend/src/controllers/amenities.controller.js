import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import { Amenity } from "../models/amenity.model.js";
import { AmenityBooking } from "../models/amenity-booking.model.js";
import { AppError } from "../utils/app-error.js";
import { SOCKET_EVENTS } from "../config/socket-events.js";
import { hasAmenityBookingConflict } from "../utils/booking-conflict.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { cache, cacheKey } from "../config/cache.js";

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const ALLOWED_STATUS_UPDATES = ["approved", "rejected", "cancelled"];
const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday"
];

function sanitizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePhotos(photos) {
  if (!Array.isArray(photos)) return [];
  return photos
    .map((item) => sanitizeText(item))
    .filter(Boolean)
    .slice(0, 10);
}

function normalizeOperatingHours(rawHours) {
  const result = {};

  for (const day of DAY_KEYS) {
    const open = sanitizeText(rawHours?.[day]?.open) || "06:00";
    const close = sanitizeText(rawHours?.[day]?.close) || "22:00";

    if (!TIME_REGEX.test(open) || !TIME_REGEX.test(close)) {
      throw new AppError(`Invalid operating hour format for ${day}`, StatusCodes.BAD_REQUEST);
    }

    if (close <= open) {
      throw new AppError(`close must be after open for ${day}`, StatusCodes.BAD_REQUEST);
    }

    result[day] = { open, close };
  }

  return result;
}

function getDayKeyForDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    throw new AppError("Invalid booking date", StatusCodes.BAD_REQUEST);
  }

  return DAY_KEYS[date.getDay()];
}

function ensureWithinOperatingHours(amenity, date, startTime, endTime) {
  const dayKey = getDayKeyForDate(date);
  const dayHours = amenity.operatingHours?.[dayKey] || { open: "06:00", close: "22:00" };

  if (startTime < dayHours.open || endTime > dayHours.close) {
    throw new AppError(
      `Selected time is outside operating hours (${dayHours.open}-${dayHours.close}) for ${dayKey}`,
      StatusCodes.BAD_REQUEST
    );
  }
}

export async function uploadAmenityPhotos(req, res, next) {
  try {
    if (!req.files || req.files.length === 0) {
      throw new AppError("No files uploaded", StatusCodes.BAD_REQUEST);
    }

    if (req.files.length > 5) {
      throw new AppError("Maximum 5 photos allowed per upload", StatusCodes.BAD_REQUEST);
    }

    const urls = await Promise.all(
      req.files.map((file) => uploadToCloudinary(file.buffer))
    );

    res.json({ urls });
  } catch (error) {
    next(error);
  }
}

export async function createAmenity(req, res, next) {
  try {
    const name = sanitizeText(req.body?.name);
    const description = sanitizeText(req.body?.description);
    const isAutoApprove = Boolean(req.body?.isAutoApprove);
    const capacity = Number(req.body?.capacity || 1);
    const photos = normalizePhotos(req.body?.photos);
    const operatingHours = normalizeOperatingHours(req.body?.operatingHours || {});

    if (!name) {
      throw new AppError("name is required", StatusCodes.BAD_REQUEST);
    }

    if (!Number.isFinite(capacity) || capacity < 1) {
      throw new AppError("capacity must be at least 1", StatusCodes.BAD_REQUEST);
    }

    const item = await Amenity.create({
      societyId: req.tenantId,
      name,
      description,
      photos,
      isAutoApprove,
      capacity,
      operatingHours
    });

    cache.del(cacheKey("amenities", req.tenantId));

    const io = req.app.get("io");
    io.to(`tenant:${req.tenantId}`).emit(SOCKET_EVENTS.AMENITY_CREATED, { item });

    res.status(StatusCodes.CREATED).json({ item });
  } catch (error) {
    next(error);
  }
}

export async function listAmenities(req, res, next) {
  try {
    const key = cacheKey("amenities", req.tenantId);

    const cached = cache.get(key);
    if (cached) {
      return res.json({ items: cached });
    }

    const items = await Amenity.find({ societyId: req.tenantId })
      .sort({ name: 1 })
      .lean();

    cache.set(key, items);
    res.json({ items });
  } catch (error) {
    next(error);
  }
}

export async function listAmenityBookings(req, res, next) {
  try {
    const items = await AmenityBooking.find({ societyId: req.tenantId })
      .sort({ date: 1, startTime: 1, createdAt: -1 })
      .populate("residentId", "fullName role")
      .populate("amenityId", "name isAutoApprove capacity");

    const mapped = items.map((booking) => ({
      ...booking.toObject(),
      amenityName: booking.amenityId?.name || booking.amenityName,
      requestedBy: booking.residentId
    }));

    res.json({ items: mapped });
  } catch (error) {
    next(error);
  }
}

export async function createAmenityBooking(req, res, next) {
  try {
    const amenityId = sanitizeText(req.body?.amenityId);
    const date = sanitizeText(req.body?.date);
    const startTime = sanitizeText(req.body?.startTime);
    const endTime = sanitizeText(req.body?.endTime);

    if (!amenityId || !date || !startTime || !endTime) {
      throw new AppError("amenityId, date, startTime and endTime are required", StatusCodes.BAD_REQUEST);
    }

    if (!mongoose.Types.ObjectId.isValid(amenityId)) {
      throw new AppError("Invalid amenityId", StatusCodes.BAD_REQUEST);
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

    const amenity = await Amenity.findOne({ _id: amenityId, societyId: req.tenantId });
    if (!amenity) {
      throw new AppError("Amenity not found in your society", StatusCodes.NOT_FOUND);
    }

    ensureWithinOperatingHours(amenity, date, startTime, endTime);

    const isConflicting = await hasAmenityBookingConflict({
      societyId: req.tenantId,
      amenityId,
      date,
      startTime,
      endTime
    });

    if (isConflicting) {
      throw new AppError("Amenity slot already booked for that time", StatusCodes.CONFLICT);
    }

    const status = amenity.isAutoApprove ? "approved" : "pending";

    const booking = await AmenityBooking.create({
      societyId: req.tenantId,
      amenityId,
      residentId: req.user.userId,
      date,
      startTime,
      endTime,
      status,
      amenityName: amenity.name,
      requestedBy: req.user.userId
    });

    const populatedBooking = await booking.populate([
      { path: "residentId", select: "fullName role" },
      { path: "amenityId", select: "name isAutoApprove capacity" }
    ]);

    const responseItem = {
      ...populatedBooking.toObject(),
      amenityName: populatedBooking.amenityId?.name || populatedBooking.amenityName,
      requestedBy: populatedBooking.residentId
    };

    const io = req.app.get("io");
    io.to(`tenant:${req.tenantId}`).emit(SOCKET_EVENTS.AMENITY_BOOKING_CREATED, {
      item: responseItem
    });

    res.status(StatusCodes.CREATED).json({ item: responseItem });
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

    const booking = await AmenityBooking.findOne({ _id: bookingId, societyId: req.tenantId });
    if (!booking) {
      throw new AppError("Amenity booking not found", StatusCodes.NOT_FOUND);
    }

    const isApprover = ["committee", "super_admin"].includes(req.user.role);
    const isRequester = String(booking.residentId) === req.user.userId;

    if (status === "cancelled") {
      if (!isApprover && !isRequester) {
        throw new AppError("Forbidden", StatusCodes.FORBIDDEN);
      }
    } else if (!isApprover) {
      throw new AppError("Forbidden", StatusCodes.FORBIDDEN);
    }

    booking.status = status;
    await booking.save();

    const populatedBooking = await booking.populate([
      { path: "residentId", select: "fullName role" },
      { path: "amenityId", select: "name isAutoApprove capacity" }
    ]);

    const responseItem = {
      ...populatedBooking.toObject(),
      amenityName: populatedBooking.amenityId?.name || populatedBooking.amenityName,
      requestedBy: populatedBooking.residentId
    };

    const io = req.app.get("io");
    io.to(`tenant:${req.tenantId}`).emit(SOCKET_EVENTS.AMENITY_BOOKING_STATUS_UPDATED, {
      item: responseItem
    });

    res.json({ item: responseItem });
  } catch (error) {
    next(error);
  }
}
