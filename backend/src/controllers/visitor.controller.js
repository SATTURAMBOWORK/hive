import { StatusCodes } from "http-status-codes";
import { Visitor } from "../models/visitor.model.js";
import { AppError } from "../utils/app-error.js";

const VALID_PURPOSES = ["delivery", "guest", "contractor", "other"];

function sanitizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

// GET /visitors
// Returns all visitors for today (midnight to now) for this tenant
export async function listVisitors(req, res, next) {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const items = await Visitor.find({
      tenantId: req.tenantId,
      entryTime: { $gte: startOfDay }
    })
      .sort({ entryTime: -1 })
      .populate("loggedBy", "fullName");

    res.json({ items });
  } catch (error) {
    next(error);
  }
}

// POST /visitors
// Security guard logs a new visitor entry
export async function logEntry(req, res, next) {
  try {
    const visitorName  = sanitizeText(req.body?.visitorName);
    const visitorPhone = sanitizeText(req.body?.visitorPhone);
    const flatNumber   = sanitizeText(req.body?.flatNumber);
    const residentName = sanitizeText(req.body?.residentName);
    const purpose      = sanitizeText(req.body?.purpose) || "guest";
    const vehicleNumber = sanitizeText(req.body?.vehicleNumber);

    if (!visitorName) {
      throw new AppError("visitorName is required", StatusCodes.BAD_REQUEST);
    }
    if (!flatNumber) {
      throw new AppError("flatNumber is required", StatusCodes.BAD_REQUEST);
    }
    if (!VALID_PURPOSES.includes(purpose)) {
      throw new AppError(`purpose must be one of: ${VALID_PURPOSES.join(", ")}`, StatusCodes.BAD_REQUEST);
    }

    const visitor = await Visitor.create({
      tenantId:     req.tenantId,
      visitorName,
      visitorPhone,
      flatNumber,
      residentName,
      purpose,
      vehicleNumber,
      loggedBy:     req.user.userId
    });

    const populated = await visitor.populate("loggedBy", "fullName");
    res.status(StatusCodes.CREATED).json({ item: populated });
  } catch (error) {
    next(error);
  }
}

// PATCH /visitors/:id/exit
// Security guard marks a visitor as exited
export async function markExit(req, res, next) {
  try {
    const visitor = await Visitor.findOne({
      _id: req.params.id,
      tenantId: req.tenantId
    });

    if (!visitor) {
      throw new AppError("Visitor record not found", StatusCodes.NOT_FOUND);
    }
    if (visitor.status === "exited") {
      throw new AppError("Visitor has already exited", StatusCodes.BAD_REQUEST);
    }

    visitor.status   = "exited";
    visitor.exitTime = new Date();
    await visitor.save();

    res.json({ item: visitor });
  } catch (error) {
    next(error);
  }
}
