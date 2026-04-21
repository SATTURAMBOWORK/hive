import { StatusCodes } from "http-status-codes";
import { GroupPass } from "../models/group-pass.model.js";
import { Visitor } from "../models/visitor.model.js";
import { Membership } from "../models/membership.model.js";
import { Notification } from "../models/notification.model.js";
import { AppError } from "../utils/app-error.js";
import { SOCKET_EVENTS } from "../config/socket-events.js";
import { emitRealtime } from "../services/realtime-bus.service.js";

function sanitizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Auto-expire active passes whose validUntil has passed
async function expireStaleGroupPasses(tenantId) {
  await GroupPass.updateMany(
    { tenantId, status: "active", validUntil: { $lt: new Date() } },
    { $set: { status: "expired" } }
  );
}

// Get the resident's flat number from their approved membership
async function getFlatForResident(tenantId, residentId) {
  const membership = await Membership.findOne({
    tenantId,
    userId: residentId,
    status: "approved"
  })
    .populate("wingId", "name")
    .populate("unitId", "unitNumber");

  if (!membership?.wingId || !membership?.unitId) return null;
  return `${membership.wingId.name}-${membership.unitId.unitNumber}`;
}

// ─────────────────────────────────────────────────────────────────
// POST /api/group-passes
// Resident creates a group pass for an event.
// ─────────────────────────────────────────────────────────────────
export async function createGroupPass(req, res, next) {
  try {
    const eventName  = sanitizeText(req.body?.eventName);
    const rawDate    = sanitizeText(req.body?.expectedDate);
    const maxUses    = parseInt(req.body?.maxUses, 10);

    if (!eventName)       throw new AppError("eventName is required", StatusCodes.BAD_REQUEST);
    if (!rawDate)         throw new AppError("expectedDate is required", StatusCodes.BAD_REQUEST);
    if (isNaN(maxUses) || maxUses < 1 || maxUses > 100) {
      throw new AppError("maxUses must be between 1 and 100", StatusCodes.BAD_REQUEST);
    }

    const expectedDate = new Date(rawDate);
    if (isNaN(expectedDate.getTime())) {
      throw new AppError("expectedDate is not a valid date (use YYYY-MM-DD)", StatusCodes.BAD_REQUEST);
    }

    const validFrom = new Date(expectedDate);
    validFrom.setHours(0, 0, 0, 0);

    const validUntil = new Date(expectedDate);
    validUntil.setHours(23, 59, 59, 999);

    if (validUntil < new Date()) {
      throw new AppError("expectedDate cannot be in the past", StatusCodes.BAD_REQUEST);
    }

    // Generate a unique OTP — retry on collision
    let otp;
    let attempts = 0;
    do {
      otp = generateOtp();
      const existing = await GroupPass.findOne({ tenantId: req.tenantId, otp, status: "active" });
      if (!existing) break;
      attempts++;
    } while (attempts < 5);

    const groupPass = await GroupPass.create({
      tenantId:    req.tenantId,
      residentId:  req.user.userId,
      eventName,
      expectedDate,
      validFrom,
      validUntil,
      maxUses,
      otp,
      status: "active"
    });

    const populated = await GroupPass.findById(groupPass._id)
      .populate("residentId", "fullName");

    res.status(StatusCodes.CREATED).json({ item: populated });
  } catch (error) {
    next(error);
  }
}

// ─────────────────────────────────────────────────────────────────
// GET /api/group-passes
// Resident lists all their group passes.
// ─────────────────────────────────────────────────────────────────
export async function listMyGroupPasses(req, res, next) {
  try {
    await expireStaleGroupPasses(req.tenantId);

    const items = await GroupPass.find({
      tenantId:   req.tenantId,
      residentId: req.user.userId
    }).sort({ expectedDate: -1, createdAt: -1 });

    res.json({ items });
  } catch (error) {
    next(error);
  }
}

// ─────────────────────────────────────────────────────────────────
// DELETE /api/group-passes/:id
// Resident cancels an active group pass.
// ─────────────────────────────────────────────────────────────────
export async function cancelGroupPass(req, res, next) {
  try {
    const pass = await GroupPass.findOne({
      _id:        req.params.id,
      tenantId:   req.tenantId,
      residentId: req.user.userId
    });

    if (!pass) throw new AppError("Group pass not found", StatusCodes.NOT_FOUND);
    if (pass.status !== "active") {
      throw new AppError(`Cannot cancel a pass that is already "${pass.status}"`, StatusCodes.BAD_REQUEST);
    }

    pass.status = "cancelled";
    await pass.save();

    res.json({ item: pass });
  } catch (error) {
    next(error);
  }
}

// ─────────────────────────────────────────────────────────────────
// GET /api/group-passes/check?otp=123456
// Guard checks if an OTP belongs to a group pass (WITHOUT consuming a use).
// Called by the frontend after pre-reg OTP fails, to identify group passes.
// Returns pass info so the frontend can show event name + usage count.
// ─────────────────────────────────────────────────────────────────
export async function checkGroupOtp(req, res, next) {
  try {
    const otp = sanitizeText(req.query?.otp);
    if (!otp || !/^\d{6}$/.test(otp)) {
      throw new AppError("OTP must be a 6-digit number", StatusCodes.BAD_REQUEST);
    }

    await expireStaleGroupPasses(req.tenantId);

    const pass = await GroupPass.findOne({
      tenantId: req.tenantId,
      otp,
      status: "active"
    }).populate("residentId", "fullName");

    if (!pass) {
      throw new AppError(
        "No valid pass found for this OTP. It may be expired, exhausted, or invalid.",
        StatusCodes.NOT_FOUND
      );
    }

    // Return just enough info for the guard UI — not the full entries list
    res.json({
      item: {
        _id:          pass._id,
        eventName:    pass.eventName,
        expectedDate: pass.expectedDate,
        maxUses:      pass.maxUses,
        usedCount:    pass.usedCount,
        residentName: pass.residentId.fullName,
        spotsLeft:    pass.maxUses - pass.usedCount
      }
    });
  } catch (error) {
    next(error);
  }
}

// ─────────────────────────────────────────────────────────────────
// POST /api/group-passes/verify-otp
// Guard verifies OTP + enters visitor name → consumes one use.
// Creates a Visitor log entry and notifies the resident.
// Body: { otp, visitorName }
// ─────────────────────────────────────────────────────────────────
export async function verifyGroupOtp(req, res, next) {
  try {
    const otp         = sanitizeText(req.body?.otp);
    const visitorName = sanitizeText(req.body?.visitorName);

    if (!otp || !/^\d{6}$/.test(otp)) {
      throw new AppError("OTP must be a 6-digit number", StatusCodes.BAD_REQUEST);
    }
    if (!visitorName) {
      throw new AppError("visitorName is required", StatusCodes.BAD_REQUEST);
    }

    await expireStaleGroupPasses(req.tenantId);

    // Find and lock the pass — use findOneAndUpdate to atomically increment
    // usedCount. This prevents two guards from simultaneously using the last spot.
    const pass = await GroupPass.findOneAndUpdate(
      {
        tenantId: req.tenantId,
        otp,
        status:   "active",
        // Only allow if there's still a spot left
        $expr: { $lt: ["$usedCount", "$maxUses"] }
      },
      { $inc: { usedCount: 1 } },
      { new: true }           // return the updated document
    ).populate("residentId", "fullName");

    if (!pass) {
      // Could be: wrong OTP, expired, cancelled, or all spots used up
      const existing = await GroupPass.findOne({ tenantId: req.tenantId, otp });
      if (existing?.status === "exhausted" || existing?.usedCount >= existing?.maxUses) {
        throw new AppError(
          "This group pass has been fully used — all guest slots are taken.",
          StatusCodes.BAD_REQUEST
        );
      }
      throw new AppError(
        "Invalid or expired group pass OTP.",
        StatusCodes.NOT_FOUND
      );
    }

    // If all spots are now taken, mark exhausted
    if (pass.usedCount >= pass.maxUses) {
      pass.status = "exhausted";
      await pass.save();
    }

    // Look up the resident's flat number
    const flatNumber = await getFlatForResident(req.tenantId, pass.residentId._id);

    // Create the Visitor log entry (auto-approved)
    const visitor = await Visitor.create({
      tenantId:       req.tenantId,
      visitorName,
      visitorPhone:   "",
      flatNumber:     flatNumber || "Unknown",
      residentName:   pass.residentId.fullName,
      purpose:        "guest",
      vehicleNumber:  "",
      residentId:     pass.residentId._id,
      approvalStatus: "approved",
      status:         "inside",
      loggedBy:       req.user.userId
    });

    // Add entry to the pass's entries log
    pass.entries.push({
      visitorName,
      entryTime:      new Date(),
      loggedBy:       req.user.userId,
      visitorEntryId: visitor._id
    });
    await pass.save();

    const populatedVisitor = await Visitor.findById(visitor._id)
      .populate("loggedBy",   "fullName")
      .populate("residentId", "fullName");

    // Notify the resident
    await Notification.create({
      tenantId: req.tenantId,
      userId:   pass.residentId._id,
      type:     "group_pass_used",
      title:    `Guest arrived — ${pass.eventName}`,
      message:  `${visitorName} has entered using your group pass. (${pass.usedCount}/${pass.maxUses} guests)`,
      data:     { visitorId: visitor._id, groupPassId: pass._id }
    });

    const io = req.app.get("io");
    await emitRealtime(io, {
      room: `user:${pass.residentId._id}`,
      event: SOCKET_EVENTS.GROUP_PASS_USED,
      payload: {
        visitor:   populatedVisitor,
        groupPass: {
          _id:       pass._id,
          eventName: pass.eventName,
          usedCount: pass.usedCount,
          maxUses:   pass.maxUses,
          status:    pass.status
        }
      }
    });

    res.status(StatusCodes.CREATED).json({
      item:      populatedVisitor,
      groupPass: {
        eventName: pass.eventName,
        usedCount: pass.usedCount,
        maxUses:   pass.maxUses,
        spotsLeft: pass.maxUses - pass.usedCount,
        status:    pass.status
      }
    });
  } catch (error) {
    next(error);
  }
}
