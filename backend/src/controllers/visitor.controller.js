import { StatusCodes } from "http-status-codes";
import { Visitor } from "../models/visitor.model.js";
import { Membership } from "../models/membership.model.js";
import { SocietyWing } from "../models/society-wing.model.js";
import { SocietyUnit } from "../models/society-unit.model.js";
import { Notification } from "../models/notification.model.js";
import { AppError } from "../utils/app-error.js";
import { SOCKET_EVENTS } from "../config/socket-events.js";

const VALID_PURPOSES = ["delivery", "guest", "contractor", "other"];

function sanitizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

// GET /visitors/flats
// Returns all flats that have an approved resident — used to populate the guard's dropdown
export async function listFlats(req, res, next) {
  try {
    const memberships = await Membership.find({
      tenantId: req.tenantId,
      status: "approved"
    })
      .populate("userId",  "fullName phone")
      .populate("wingId",  "name")
      .populate("unitId",  "unitNumber");

    const flats = memberships
      .filter(m => m.wingId && m.unitId && m.userId)
      .map(m => ({
        flatNumber:   `${m.wingId.name}-${m.unitId.unitNumber}`,
        residentName: m.userId.fullName,
        residentPhone: m.userId.phone || "",
        residentId:   m.userId._id,
      }))
      .sort((a, b) => a.flatNumber.localeCompare(b.flatNumber));

    res.json({ items: flats });
  } catch (error) {
    next(error);
  }
}

// Parse "A-401" → { wingName: "A", unitNumber: "401" }
// If no hyphen, wingName is null and the whole string is unitNumber
function parseFlatNumber(flat) {
  const idx = flat.indexOf("-");
  if (idx === -1) return { wingName: null, unitNumber: flat };
  return { wingName: flat.slice(0, idx).toUpperCase(), unitNumber: flat.slice(idx + 1) };
}

// Find the approved resident for a given flat number within a tenant
async function findResidentForFlat(tenantId, flatNumber) {
  const { wingName, unitNumber } = parseFlatNumber(flatNumber);

  let unitQuery = { tenantId, unitNumber };

  if (wingName) {
    // Find the wing by name first
    const wing = await SocietyWing.findOne({ tenantId, name: wingName });
    if (!wing) return null;
    unitQuery.wingId = wing._id;
  }

  const unit = await SocietyUnit.findOne(unitQuery);
  if (!unit) return null;

  // Find an approved resident in this unit
  const membership = await Membership.findOne({
    tenantId,
    unitId: unit._id,
    status: "approved"
  });

  return membership?.userId || null;
}

// GET /visitors — today's visitor log for this tenant
export async function listVisitors(req, res, next) {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const items = await Visitor.find({
      tenantId: req.tenantId,
      entryTime: { $gte: startOfDay }
    })
      .sort({ entryTime: -1 })
      .populate("loggedBy", "fullName")
      .populate("residentId", "fullName");

    res.json({ items });
  } catch (error) {
    next(error);
  }
}

// POST /visitors — guard creates a visitor request, resident is notified in real-time
export async function requestEntry(req, res, next) {
  try {
    const visitorName   = sanitizeText(req.body?.visitorName);
    const visitorPhone  = sanitizeText(req.body?.visitorPhone);
    const flatNumber    = sanitizeText(req.body?.flatNumber);
    const residentName  = sanitizeText(req.body?.residentName);
    const purpose       = sanitizeText(req.body?.purpose) || "guest";
    const vehicleNumber = sanitizeText(req.body?.vehicleNumber);

    if (!visitorName) throw new AppError("visitorName is required", StatusCodes.BAD_REQUEST);
    if (!flatNumber)  throw new AppError("flatNumber is required",  StatusCodes.BAD_REQUEST);
    if (!VALID_PURPOSES.includes(purpose)) {
      throw new AppError(`purpose must be one of: ${VALID_PURPOSES.join(", ")}`, StatusCodes.BAD_REQUEST);
    }

    // Look up the resident for this flat
    const residentId = await findResidentForFlat(req.tenantId, flatNumber);
    if (!residentId) {
      throw new AppError(
        `No approved resident found for flat "${flatNumber}". Check the flat number.`,
        StatusCodes.NOT_FOUND
      );
    }

    // Create the visitor request
    const visitor = await Visitor.create({
      tenantId: req.tenantId,
      visitorName,
      visitorPhone,
      flatNumber,
      residentName,
      purpose,
      vehicleNumber,
      residentId,
      approvalStatus: "pending",
      status: "pending_entry",
      loggedBy: req.user.userId
    });

    const populated = await Visitor.findById(visitor._id)
      .populate("loggedBy", "fullName")
      .populate("residentId", "fullName");

    // Save a persistent notification for the resident
    const notification = await Notification.create({
      tenantId:  req.tenantId,
      userId:    residentId,
      type:      "visitor_request_incoming",
      title:     "Visitor at the gate",
      message:   `${visitorName} is at the gate${residentName ? ` to meet you` : ""}. Purpose: ${purpose}.`,
      data:      { visitorId: visitor._id }
    });

    // Emit real-time event to the resident's private socket room
    const io = req.app.get("io");
    io.to(`user:${residentId}`).emit(SOCKET_EVENTS.VISITOR_REQUEST_INCOMING, {
      visitor: populated,
      notification
    });

    res.status(StatusCodes.CREATED).json({ item: populated });
  } catch (error) {
    next(error);
  }
}

// PATCH /visitors/:id/respond — resident approves or rejects
export async function respondToRequest(req, res, next) {
  try {
    const decision = sanitizeText(req.body?.decision).toLowerCase();
    if (!["approved", "rejected"].includes(decision)) {
      throw new AppError("decision must be 'approved' or 'rejected'", StatusCodes.BAD_REQUEST);
    }

    const visitor = await Visitor.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!visitor) throw new AppError("Visitor request not found", StatusCodes.NOT_FOUND);

    if (visitor.approvalStatus !== "pending") {
      throw new AppError("This request has already been responded to", StatusCodes.BAD_REQUEST);
    }

    // Only the targeted resident (or admin) can respond
    const isAdmin = ["committee", "super_admin"].includes(req.user.role);
    const isTargetResident = String(visitor.residentId) === String(req.user.userId);
    if (!isAdmin && !isTargetResident) {
      throw new AppError("You are not authorised to respond to this request", StatusCodes.FORBIDDEN);
    }

    visitor.approvalStatus = decision;
    // If approved, visitor is considered inside; if rejected, they stay at pending_entry
    if (decision === "approved") visitor.status = "inside";
    await visitor.save();

    const populated = await Visitor.findById(visitor._id)
      .populate("loggedBy", "fullName")
      .populate("residentId", "fullName");

    // Notify the guard in real-time
    const io = req.app.get("io");
    const guardId = visitor.loggedBy;
    io.to(`user:${guardId}`).emit(SOCKET_EVENTS.VISITOR_REQUEST_RESPONDED, {
      visitor: populated,
      decision
    });

    res.json({ item: populated });
  } catch (error) {
    next(error);
  }
}

// PATCH /visitors/:id/exit — guard marks visitor as exited
export async function markExit(req, res, next) {
  try {
    const visitor = await Visitor.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!visitor) throw new AppError("Visitor record not found", StatusCodes.NOT_FOUND);
    if (visitor.status === "exited") throw new AppError("Visitor has already exited", StatusCodes.BAD_REQUEST);

    visitor.status   = "exited";
    visitor.exitTime = new Date();
    await visitor.save();

    res.json({ item: visitor });
  } catch (error) {
    next(error);
  }
}
