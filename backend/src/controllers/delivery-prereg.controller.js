import { StatusCodes } from "http-status-codes";
import { DeliveryPreReg } from "../models/delivery-prereg.model.js";
import { Membership } from "../models/membership.model.js";
import { AppError } from "../utils/app-error.js";

// ── Helper: trim a value safely ──────────────────────────────────────────────
function sanitizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ── Helper: auto-expire pre-regs whose validUntil has passed ────────────────
// Call this at the top of any listing function so stale records are cleaned up
// before the resident sees them.
async function expireStalePreRegs(tenantId) {
  await DeliveryPreReg.updateMany(
    { tenantId, status: "active", validUntil: { $lt: new Date() } },
    { $set: { status: "expired" } }
  );
}

// ────────────────────────────────────────────────────────────────────────────
// POST /api/delivery-prereg
// WHO: resident (only they know a parcel is coming)
//
// What the resident sends in req.body:
//   expectedDate    — "YYYY-MM-DD"  (required)
//   expectedCourier — "Amazon"      (optional)
//   agentName       — "Ravi"        (optional)
//   agentPhone      — "9876543210"  (optional)
//   packageType     — enum          (optional, default "parcel")
//   packageCount    — number        (optional, default 1)
//   fulfillmentMode — enum          (optional, default "keep_at_gate")
//   instructions    — free text     (optional)
//
// Steps:
//   1. Read + sanitize inputs from req.body
//   2. Validate that expectedDate exists and is a valid date
//   3. Parse expectedDate → set validFrom = 00:00:00, validUntil = 23:59:59
//   4. Reject if validUntil is in the past (cannot pre-reg for yesterday)
//   5. Get the resident's flatNumber from req.user (attach it in auth middleware,
//      or look up their Membership record)
//   6. Create the DeliveryPreReg document
//   7. Return the created record with status 201
// ────────────────────────────────────────────────────────────────────────────
export async function createPreReg(req, res, next) {
  try {
    // Step 1 — read inputs
    const rawDate = sanitizeText(req.body?.expectedDate);
    const expectedCourier = sanitizeText(req.body?.expectedCourier);
    const agentName = sanitizeText(req.body?.agentName);
    const agentPhone = sanitizeText(req.body?.agentPhone);
    const packageType = req.body?.packageType || "parcel";
    const packageCount = Number(req.body?.packageCount || 1);
    const fulfillmentMode = req.body?.fulfillmentMode || "keep_at_gate";
    const instructions = sanitizeText(req.body?.instructions);

    // Step 2 — validate expectedDate exists
    if (!rawDate) {
      throw new AppError("expectedDate is required", StatusCodes.BAD_REQUEST);
    }

    // Step 3 — parse date and set validFrom / validUntil
    const expectedDate = new Date(`${rawDate}T00:00:00`);
    if (Number.isNaN(expectedDate.getTime())) {
      throw new AppError("Invalid date format for expectedDate", StatusCodes.BAD_REQUEST);
    }
    const validFrom = new Date(expectedDate);
    validFrom.setHours(0, 0, 0, 0);
    const validUntil = new Date(expectedDate);
    validUntil.setHours(23, 59, 59, 999);

    // Step 4 — reject past dates
    if (validUntil < new Date()) {
      throw new AppError("expectedDate cannot be in the past", StatusCodes.BAD_REQUEST);
    }

    if (!Number.isFinite(packageCount) || packageCount < 1) {
      throw new AppError("packageCount must be at least 1", StatusCodes.BAD_REQUEST);
    }

    // Step 5 — get flatNumber from approved membership
    const membership = await Membership.findOne({
      tenantId: req.tenantId,
      userId: req.user.userId,
      status: "approved"
    })
      .populate("wingId", "name")
      .populate("unitId", "unitNumber");

    if (!membership || !membership.wingId || !membership.unitId) {
      throw new AppError("Approved membership with a valid flat is required", StatusCodes.BAD_REQUEST);
    }

    const flatNumber = `${membership.wingId.name}-${membership.unitId.unitNumber}`;

    // Step 6 — create the document
    const preReg = await DeliveryPreReg.create({
      tenantId: req.tenantId,
      residentId: req.user.userId,
      flatNumber,
      expectedCourier,
      agentName,
      agentPhone,
      packageType,
      packageCount,
      expectedDate,
      validFrom,
      validUntil,
      fulfillmentMode,
      instructions
    });

    // Step 7 — respond
    res.status(StatusCodes.CREATED).json({ item: preReg });
  } catch (error) {
    next(error);
  }
}

// ────────────────────────────────────────────────────────────────────────────
// GET /api/delivery-prereg
// WHO: resident — sees their own pre-registrations
//
// Steps:
//   1. Call expireStalePreRegs(req.tenantId) to clean up expired records first
//   2. Query DeliveryPreReg where { tenantId, residentId: req.user.userId }
//   3. Sort by expectedDate descending so newest shows first
//   4. Return the list
// ────────────────────────────────────────────────────────────────────────────
export async function listMyPreRegs(req, res, next) {
  try {
    // Step 1
    await expireStalePreRegs(req.tenantId);

    // Step 2 + 3
    const items = await DeliveryPreReg.find({ tenantId: req.tenantId, residentId: req.user.userId })
      .sort({ expectedDate: -1, createdAt: -1 });

    // Step 4
    res.json({ items });
  } catch (error) {
    next(error);
  }
}

// ────────────────────────────────────────────────────────────────────────────
// DELETE /api/delivery-prereg/:id
// WHO: resident — cancels one of their own pre-regs
//
// Steps:
//   1. Find the pre-reg by { _id: req.params.id, tenantId, residentId }
//      (the residentId check ensures a resident can only cancel their OWN records)
//   2. If not found → 404
//   3. If status is not "active" → 400 (can't cancel something already used/expired)
//   4. Set status = "cancelled", cancelledAt = now, cancelledBy = req.user.userId
//   5. Save and return the updated record
// ────────────────────────────────────────────────────────────────────────────
export async function cancelPreReg(req, res, next) {
  try {
    // Step 1
    const preReg = await DeliveryPreReg.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
      residentId: req.user.userId
    });

    // Step 2
    if (!preReg) {
      throw new AppError("Pre-registration not found", StatusCodes.NOT_FOUND);
    }

    // Step 3
    if (preReg.status !== "active") {
      throw new AppError(`Cannot cancel a "${preReg.status}" pre-registration`, StatusCodes.BAD_REQUEST);
    }

    // Step 4
    preReg.status = "cancelled";
    preReg.cancelledAt = new Date();
    preReg.cancelledBy = req.user.userId;

    // Step 5
    await preReg.save();
    res.json({ item: preReg });
  } catch (error) {
    next(error);
  }
}

// ────────────────────────────────────────────────────────────────────────────
// GET /api/delivery-prereg/active  (used internally by delivery controller)
// WHO: security guard — when a delivery arrives, they search for a matching
//      pre-reg so the system can auto-approve without bothering the resident.
//
// This is NOT called directly by the guard from the app — the delivery
// controller calls this logic internally inside logDelivery().
// We expose it here as a named export so delivery.controller.js can import it.
//
// Match criteria (all must match):
//   tenantId       = req.tenantId
//   flatNumber     = the flat the delivery is for
//   status         = "active"
//   validFrom ≤ now ≤ validUntil    (the delivery arrived within the expected window)
//   expectedCourier = courierName   (if the pre-reg has a courier set — fuzzy or exact)
//
// Returns the first matching pre-reg, or null if none found.
// ────────────────────────────────────────────────────────────────────────────
export async function findMatchingPreReg(tenantId, flatNumber, courierName) {
  // HINT: This is a pure DB lookup, not an Express handler — no req/res needed.
  const now = new Date();
  const safeCourier = sanitizeText(courierName);

  const courierMatch = safeCourier
    ? [
        { expectedCourier: "" },
        { expectedCourier: new RegExp(escapeRegex(safeCourier), "i") }
      ]
    : [{ expectedCourier: "" }];

  return DeliveryPreReg.findOne({
    tenantId,
    flatNumber: sanitizeText(flatNumber),
    status: "active",
    validFrom: { $lte: now },
    validUntil: { $gte: now },
    $or: courierMatch
  });
}
