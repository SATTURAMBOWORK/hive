import { StatusCodes } from "http-status-codes";
import { VisitorPreReg } from "../models/visitor-prereg.model.js";
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

// Generate a random 6-digit OTP as a string, e.g. "047821"
function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Auto-expire any active passes whose validUntil has passed
async function expireStalePreRegs(tenantId) {
  await VisitorPreReg.updateMany(
    { tenantId, status: "active", validUntil: { $lt: new Date() } },
    { $set: { status: "expired" } }
  );
}

// ─────────────────────────────────────────────────────────────────
// POST /api/visitor-prereg
// Resident creates a pre-registration for an expected visitor.
// Returns the created record (with OTP visible, so resident can share it).
// ─────────────────────────────────────────────────────────────────
export async function createPreReg(req, res, next) {
  try {
    const visitorName  = sanitizeText(req.body?.visitorName);
    const visitorPhone = sanitizeText(req.body?.visitorPhone);
    const purpose      = sanitizeText(req.body?.purpose) || "guest";
    const rawDate      = sanitizeText(req.body?.expectedDate); // "YYYY-MM-DD"

    // Validate inputs
    if (!visitorName) throw new AppError("visitorName is required", StatusCodes.BAD_REQUEST);
    if (!rawDate)     throw new AppError("expectedDate is required", StatusCodes.BAD_REQUEST);
    if (!VALID_PURPOSES.includes(purpose)) {
      throw new AppError(`purpose must be one of: ${VALID_PURPOSES.join(", ")}`, StatusCodes.BAD_REQUEST);
    }

    // Parse expected date — set validFrom = 00:00:00 and validUntil = 23:59:59 of that day
    const expectedDate = new Date(rawDate);
    if (isNaN(expectedDate.getTime())) {
      throw new AppError("expectedDate is not a valid date (use YYYY-MM-DD format)", StatusCodes.BAD_REQUEST);
    }

    const validFrom = new Date(expectedDate);
    validFrom.setHours(0, 0, 0, 0);

    const validUntil = new Date(expectedDate);
    validUntil.setHours(23, 59, 59, 999);

    // Make sure the date is not in the past
    if (validUntil < new Date()) {
      throw new AppError("expectedDate cannot be in the past", StatusCodes.BAD_REQUEST);
    }

    // Generate a unique OTP — keep trying until no collision in this tenant
    let otp;
    let attempts = 0;
    do {
      otp = generateOtp();
      const existing = await VisitorPreReg.findOne({ tenantId: req.tenantId, otp, status: "active" });
      if (!existing) break;
      attempts++;
    } while (attempts < 5);

    const preReg = await VisitorPreReg.create({
      tenantId:  req.tenantId,
      residentId: req.user.userId,
      visitorName,
      visitorPhone,
      purpose,
      expectedDate,
      validFrom,
      validUntil,
      otp,
      status: "active"
    });

    const populated = await VisitorPreReg.findById(preReg._id)
      .populate("residentId", "fullName phone");

    res.status(StatusCodes.CREATED).json({ item: populated });
  } catch (error) {
    next(error);
  }
}

// ─────────────────────────────────────────────────────────────────
// GET /api/visitor-prereg
// Resident lists all their pre-registrations (active, used, etc.)
// ─────────────────────────────────────────────────────────────────
export async function listMyPreRegs(req, res, next) {
  try {
    await expireStalePreRegs(req.tenantId);

    const items = await VisitorPreReg.find({
      tenantId:   req.tenantId,
      residentId: req.user.userId
    })
      .sort({ expectedDate: -1, createdAt: -1 })
      .populate("residentId", "fullName");

    res.json({ items });
  } catch (error) {
    next(error);
  }
}

// ─────────────────────────────────────────────────────────────────
// DELETE /api/visitor-prereg/:id
// Resident cancels a pre-registration (only if it's still active)
// ─────────────────────────────────────────────────────────────────
export async function cancelPreReg(req, res, next) {
  try {
    const preReg = await VisitorPreReg.findOne({
      _id:       req.params.id,
      tenantId:  req.tenantId,
      residentId: req.user.userId    // only the owner can cancel
    });

    if (!preReg) throw new AppError("Pre-registration not found", StatusCodes.NOT_FOUND);
    if (preReg.status !== "active") {
      throw new AppError(`Cannot cancel a pass that is already "${preReg.status}"`, StatusCodes.BAD_REQUEST);
    }

    preReg.status = "cancelled";
    await preReg.save();

    res.json({ item: preReg });
  } catch (error) {
    next(error);
  }
}

// ─────────────────────────────────────────────────────────────────
// POST /api/visitor-prereg/verify-otp
// Guard enters the 6-digit OTP at the gate.
// System finds the matching pre-registration, validates it,
// creates a Visitor log entry (auto-approved), and notifies the resident.
// ─────────────────────────────────────────────────────────────────
export async function verifyOtp(req, res, next) {
  try {
    const otp = sanitizeText(req.body?.otp);

    if (!otp || !/^\d{6}$/.test(otp)) {
      throw new AppError("OTP must be a 6-digit number", StatusCodes.BAD_REQUEST);
    }

    await expireStalePreRegs(req.tenantId);

    // Find an active pre-registration with this OTP in the current tenant
    const preReg = await VisitorPreReg.findOne({
      tenantId: req.tenantId,
      otp,
      status: "active"
    }).populate("residentId", "fullName flatNumber");

    if (!preReg) {
      throw new AppError(
        "Invalid OTP or pass has expired / already been used. Ask the resident to share a valid pass.",
        StatusCodes.NOT_FOUND
      );
    }

    // Check the time window (should already be filtered by expireStalePreRegs, but double-check)
    const now = new Date();
    if (now < preReg.validFrom || now > preReg.validUntil) {
      throw new AppError(
        `This pass is only valid on ${preReg.expectedDate.toDateString()}`,
        StatusCodes.BAD_REQUEST
      );
    }

    // Look up the flat number for this resident from their membership
    const membership = await Membership.findOne({
      tenantId: req.tenantId,
      userId:   preReg.residentId._id,
      status:   "approved"
    })
      .populate("wingId", "name")
      .populate("unitId", "unitNumber");

    const flatNumber = membership?.wingId && membership?.unitId
      ? `${membership.wingId.name}-${membership.unitId.unitNumber}`
      : "Unknown";

    // Create the actual Visitor log entry — auto-approved (no need for resident to respond)
    const visitor = await Visitor.create({
      tenantId:       req.tenantId,
      visitorName:    preReg.visitorName,
      visitorPhone:   preReg.visitorPhone,
      flatNumber,
      residentName:   preReg.residentId.fullName,
      purpose:        preReg.purpose,
      vehicleNumber:  "",
      residentId:     preReg.residentId._id,
      approvalStatus: "approved",     // already pre-approved by resident
      status:         "inside",       // visitor enters immediately
      loggedBy:       req.user.userId
    });

    // Mark the pre-registration as used
    preReg.status        = "used";
    preReg.usedAt        = new Date();
    preReg.visitorEntryId = visitor._id;
    await preReg.save();

    const populatedVisitor = await Visitor.findById(visitor._id)
      .populate("loggedBy",    "fullName")
      .populate("residentId",  "fullName");

    // Notify the resident in real-time: "Your pre-registered visitor has arrived"
    await Notification.create({
      tenantId: req.tenantId,
      userId:   preReg.residentId._id,
      type:     "visitor_prereg_used",
      title:    "Pre-registered visitor arrived",
      message:  `${preReg.visitorName} has entered using your entry pass.`,
      data:     { visitorId: visitor._id }
    });

    const io = req.app.get("io");
    io.to(`user:${preReg.residentId._id}`).emit(SOCKET_EVENTS.VISITOR_PRE_REG_USED, {
      visitor:    populatedVisitor,
      preRegId:   preReg._id
    });

    res.status(StatusCodes.CREATED).json({ item: populatedVisitor });
  } catch (error) {
    next(error);
  }
}
