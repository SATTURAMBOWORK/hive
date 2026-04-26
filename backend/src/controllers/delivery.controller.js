import { StatusCodes } from "http-status-codes";
import { Delivery } from "../models/delivery.model.js";
import { Notification } from "../models/notification.model.js";
import { AppError } from "../utils/app-error.js";
import { SOCKET_EVENTS } from "../config/socket-events.js";
import { findMatchingPreReg } from "./delivery-prereg.controller.js";
import { findResidentForFlat } from "../utils/flat-lookup.js";
import { emitRealtime } from "../services/realtime-bus.service.js";

function sanitizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

// ── Helper: push an entry onto delivery.timeline ─────────────────────────────
// Call this every time the status changes so we have a full audit trail.
// HINT: delivery.timeline.push({ status, changedBy: userId, note, at: new Date() })
//       then await delivery.save()
function addTimeline(delivery, status, changedBy, note = "") {
  delivery.timeline.push({ status, changedBy, note, at: new Date() });
}

// ────────────────────────────────────────────────────────────────────────────
// POST /api/delivery
// WHO: security guard — logs a delivery agent arriving at the gate.
//
// Guard sends in req.body:
//   flatNumber    — "A-101"       (required) — which flat is this for?
//   courierName   — "Amazon"      (required)
//   agentName     — "Ravi Kumar"  (required)
//   agentPhone    — "9876543210"  (optional)
//   packageType   — enum          (optional)
//   packageCount  — number        (optional)
//   gateId        — "Gate 1"      (optional)
//   notes         — free text     (optional)
//
// Full flow:
//   1. Validate that flatNumber, courierName, agentName are present
//   2. Find the resident who lives in that flat
//      (look up Membership by { tenantId, flatNumber, status: "approved" })
//      → if no resident found, still create the delivery but residentId = null
//   3. Call findMatchingPreReg(tenantId, flatNumber, courierName)
//      → if a pre-reg is found → auto-approve (no need to notify resident)
//      → if not found          → send notification to resident for manual approval
//   4. Create the Delivery document:
//        status        = "approved_auto"   (if pre-reg matched)
//                      = "awaiting_approval" (if needs resident action)
//        decisionSource = "pre_reg"  OR  "manual"
//        loggedBy      = req.user.userId   (the guard)
//        requestedAt   = new Date()        (when resident was notified)
//   5. If auto-approved: mark the matched pre-reg as used
//        preReg.status    = "used"
//        preReg.usedAt    = new Date()
//        preReg.deliveryId = delivery._id
//   6. Create a Notification for the resident
//        type:    "delivery_arrived"   (auto) OR "delivery_approval_request" (manual)
//        message: e.g. "Your Amazon parcel has arrived at Gate 1"
//   7. Emit a socket event to the resident's room:
//        io.to(`user:${residentId}`).emit(SOCKET_EVENTS.DELIVERY_INCOMING, { delivery })
//   8. Respond 201 with the created delivery
// ────────────────────────────────────────────────────────────────────────────
export async function logDelivery(req, res, next) {
  try {
    // TODO: Step 1 — validate inputs
     const flatNumber  = sanitizeText(req.body?.flatNumber);
     const courierName = sanitizeText(req.body?.courierName);
     const agentName   = sanitizeText(req.body?.agentName);
     if (!flatNumber || !courierName) {
      throw new AppError("flatNumber and courierName are required", StatusCodes.BAD_REQUEST);
     }

    // Step 2 — find resident by flat (splits "A-101" → wing + unit → membership)
    const residentId = await findResidentForFlat(req.tenantId, flatNumber);
    if (!residentId) {
      throw new AppError(`No approved resident found for flat "${flatNumber}"`, StatusCodes.NOT_FOUND);
    }

    // Step 3 — check for a matching pre-registration (auto-approve if found)
    const preReg = await findMatchingPreReg(req.tenantId, flatNumber, courierName);
     const isAutoApproved = !!preReg;

    //TODO: Step 4 — create Delivery document
    const delivery = await Delivery.create({
      tenantId:       req.tenantId,
      residentId,
      flatNumber,
      courierName,
      agentName,
      agentPhone:     sanitizeText(req.body?.agentPhone),
      packageType:    req.body?.packageType || "parcel",
      packageCount:   req.body?.packageCount || 1,
      gateId:         sanitizeText(req.body?.gateId),
      notes:          sanitizeText(req.body?.notes),
      loggedBy:       req.user.userId,
      status:         isAutoApproved ? "approved_auto" : "awaiting_approval",
      decisionSource: isAutoApproved ? "pre_reg"      : "manual",
      preRegId:       preReg?._id ?? null,
      approvedAt:     isAutoApproved ? new Date() : null,
      requestedAt:    isAutoApproved ? null        : new Date(),
      timeline:       [{ status: isAutoApproved ? "approved_auto" : "awaiting_approval", changedBy: req.user.userId, at: new Date() }]
    });

    // TODO: Step 5 — mark pre-reg used (only if auto-approved)
    if (isAutoApproved) {
      preReg.status     = "used";
      preReg.usedAt     = new Date();
      preReg.deliveryId = delivery._id;
      await preReg.save();
    }

    //TODO: Step 6 — create Notification
    await Notification.create({
     tenantId: req.tenantId,
     userId: residentId,
     type: isAutoApproved ? "delivery_arrived" : "delivery_approval_request",
     title: isAutoApproved ? "Delivery auto-approved" : "Delivery waiting for approval",
     message: `Your ${courierName} delivery has arrived${delivery.gateId ? ` at ${delivery.gateId}` : ""}.`,
     data: { deliveryId: delivery._id }
    });

    // TODO: Step 7 — emit socket event
    const io = req.app.get("io");
    await emitRealtime(io, {
      room: `user:${residentId}`,
      event: SOCKET_EVENTS.DELIVERY_INCOMING,
      payload: { delivery }
    });

    //TODO: Step 8
    res.status(StatusCodes.CREATED).json({ item: delivery });
  } catch (error) {
    next(error);
  }
}

// ────────────────────────────────────────────────────────────────────────────
// GET /api/delivery/pending
// WHO: security guard — sees all deliveries waiting at the gate.
//
// Steps:
//   1. Query Delivery where { tenantId, status: "awaiting_approval" }
//   2. Sort by entryTime ascending (oldest waiting first)
//   3. Populate loggedBy with "fullName"
//   4. Return the list
// ────────────────────────────────────────────────────────────────────────────
export async function listPendingDeliveries(req, res, next) {
  try {
     const items = await Delivery.find({ tenantId: req.tenantId, status: "awaiting_approval" })
      .sort({ entryTime: 1 })
      .populate("loggedBy", "fullName");
    res.json({ items });
  } catch (error) {
    next(error);
  }
}

// ────────────────────────────────────────────────────────────────────────────
// GET /api/delivery/active
// WHO: security guard — all deliveries currently needing gate action
//      (awaiting approval OR approved but not yet handed over)
// ────────────────────────────────────────────────────────────────────────────
export async function listActiveDeliveries(req, res, next) {
  try {
    const items = await Delivery.find({
      tenantId: req.tenantId,
      status: { $in: ["awaiting_approval", "approved_auto", "approved_manual"] },
    }).sort({ createdAt: -1 });
    res.json({ items });
  } catch (error) {
    next(error);
  }
}

// ────────────────────────────────────────────────────────────────────────────
// GET /api/delivery/my
// WHO: resident — sees their own delivery history.
//
// Steps:
//   1. Query Delivery where { tenantId, residentId: req.user.userId }
//   2. Sort by createdAt descending (most recent first)
//   3. Return the list
// ────────────────────────────────────────────────────────────────────────────
export async function myDeliveries(req, res, next) {
  try {
    const items = await Delivery.find({ tenantId: req.tenantId, residentId: req.user.userId })
      .sort({ createdAt: -1 });
    res.json({ items });
  } catch (error) {
    next(error);
  }
}

// ────────────────────────────────────────────────────────────────────────────
// POST /api/delivery/:id/approve
// WHO: resident — taps "Approve" on the push notification.
//
// Steps:
//   1. Find the delivery by { _id: req.params.id, tenantId }
//   2. Make sure it belongs to this resident (delivery.residentId === req.user.userId)
//   3. If status is not "awaiting_approval" → 400 (already acted on)
//   4. Set status = "approved_manual", approvedAt = now, approvedBy = req.user.userId
//   5. Call addTimeline(delivery, "approved_manual", req.user.userId)
//   6. Save the delivery
//   7. Notify the guard via socket:
//        io.to(`tenant:${req.tenantId}:security`).emit(SOCKET_EVENTS.DELIVERY_APPROVED, { delivery })
//   8. Respond with the updated delivery
// ────────────────────────────────────────────────────────────────────────────
export async function approveDelivery(req, res, next) {
  try {
    // TODO: Step 1
     const delivery = await Delivery.findOne({ _id: req.params.id, tenantId: req.tenantId });

    if (!delivery) throw new AppError("Delivery not found", StatusCodes.NOT_FOUND);
    if (delivery.status !== "awaiting_approval") throw new AppError(`Cannot approve a delivery that is "${delivery.status}"`, StatusCodes.BAD_REQUEST);

    // TODO: Steps 4 + 5 + 6
    delivery.status     = "approved_manual";
    delivery.approvedAt = new Date();
    delivery.approvedBy = req.user.userId;
    addTimeline(delivery, "approved_manual", req.user.userId);
    await delivery.save();

    // TODO: Step 7
    const io = req.app.get("io");
    await emitRealtime(io, {
      room: `tenant:${req.tenantId}`,
      event: SOCKET_EVENTS.DELIVERY_APPROVED,
      payload: { delivery }
    });

    //TODO: Step 8
    res.json({ item: delivery });
  } catch (error) {
    next(error);
  }
}

// ────────────────────────────────────────────────────────────────────────────
// POST /api/delivery/:id/reject
// WHO: resident — taps "Deny" on the push notification.
//
// req.body (optional):
//   rejectionReason — "Not expecting any parcel today"
//
// Steps:
//   1. Find delivery, check ownership, check status === "awaiting_approval"
//   2. Set status = "rejected", rejectedAt = now, rejectedBy = req.user.userId,
//      rejectionReason = req.body?.rejectionReason
//   3. addTimeline(delivery, "rejected", req.user.userId, rejectionReason)
//   4. Save, notify guard via socket (DELIVERY_REJECTED event), respond
// ────────────────────────────────────────────────────────────────────────────
export async function rejectDelivery(req, res, next) {
  try {
    // TODO: Step 1
    const delivery = await Delivery.findOne({ _id: req.params.id, tenantId: req.tenantId });

    if (!delivery) throw new AppError("Delivery not found", StatusCodes.NOT_FOUND);
    if (delivery.status !== "awaiting_approval") {
      throw new AppError(`Cannot reject a delivery that is "${delivery.status}"`, StatusCodes.BAD_REQUEST);
    }

     const rejectionReason = sanitizeText(req.body?.rejectionReason);
     delivery.status          = "rejected";
     delivery.rejectedAt      = new Date();
     delivery.rejectedBy      = req.user.userId;
     delivery.rejectionReason = rejectionReason;

    addTimeline(delivery, "rejected", req.user.userId, rejectionReason);
    await delivery.save();

    const io = req.app.get("io");
    await emitRealtime(io, {
      room: `tenant:${req.tenantId}`,
      event: SOCKET_EVENTS.DELIVERY_REJECTED,
      payload: { delivery }
    });

    res.json({ item: delivery });

  } catch (error) {
    next(error);
  }
}

// ────────────────────────────────────────────────────────────────────────────
// POST /api/delivery/:id/handover
// WHO: security guard — marks a parcel as physically handed over to the resident.
//
// req.body:
//   receiverName    — "Priya Sharma" (who collected it)
//   fulfillmentMode — enum (how it was handed: "doorstep", "keep_at_gate", etc.)
//   proofType       — "otp" | "photo" | "signature" | "none"
//   proofUrl        — URL if photo/signature was uploaded
//
// Steps:
//   1. Find delivery, confirm it is "approved_auto" or "approved_manual"
//      (can only hand over an approved delivery)
//   2. Set status = "delivered", handoverTime = now, receiverName, fulfillmentMode,
//      proofType, proofUrl
//   3. addTimeline, save, notify resident (DELIVERY_DELIVERED), respond
// ────────────────────────────────────────────────────────────────────────────
export async function markDelivered(req, res, next) {
  try {
    const delivery = await Delivery.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!delivery) throw new AppError("Delivery not found", StatusCodes.NOT_FOUND);

    const allowed = ["approved_auto", "approved_manual"];
    if (!allowed.includes(delivery.status)) {
      throw new AppError("Delivery is not in an approved state", StatusCodes.BAD_REQUEST);
    }

    delivery.status = "delivered";
    delivery.handoverTime = new Date();
    delivery.receiverName = sanitizeText(req.body?.receiverName);
    delivery.fulfillmentMode = req.body?.fulfillmentMode ?? delivery.fulfillmentMode;
    delivery.proofType = req.body?.proofType ?? "none";
    delivery.proofUrl = sanitizeText(req.body?.proofUrl);

    addTimeline(delivery, "delivered", req.user.userId);
    await delivery.save();

    const io = req.app.get("io");
    await emitRealtime(io, {
      room: `user:${delivery.residentId}`,
      event: SOCKET_EVENTS.DELIVERY_DELIVERED,
      payload: { delivery }
    });

    res.json({ item: delivery });
  } catch (error) {
    next(error);
  }
}

// ────────────────────────────────────────────────────────────────────────────
// POST /api/delivery/:id/return
// WHO: security guard — agent took the parcel back (resident not home / rejected).
//
// Steps:
//   1. Find delivery, confirm status is NOT already "delivered" or "returned"
//   2. Set status = "returned"
//   3. addTimeline, save, notify resident (optional), respond
// ────────────────────────────────────────────────────────────────────────────
export async function markReturned(req, res, next) {
  try {
    const delivery = await Delivery.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!delivery) throw new AppError("Delivery not found", StatusCodes.NOT_FOUND);

    if (["delivered", "returned"].includes(delivery.status)) {
      throw new AppError(`Cannot return a delivery that is "${delivery.status}"`, StatusCodes.BAD_REQUEST);
    }

    delivery.status = "returned";
    addTimeline(delivery, "returned", req.user.userId, sanitizeText(req.body?.note));
    await delivery.save();

    res.json({ item: delivery });
  } catch (error) {
    next(error);
  }
}

// ────────────────────────────────────────────────────────────────────────────
// GET /api/delivery/:id
// WHO: resident or guard — fetch a single delivery record by ID.
//
// Steps:
//   1. Find by { _id: req.params.id, tenantId: req.tenantId }
//   2. Populate loggedBy ("fullName"), approvedBy ("fullName"), residentId ("fullName")
//   3. Return it (or 404 if not found)
// ────────────────────────────────────────────────────────────────────────────
export async function getDelivery(req, res, next) {
  try {
    const item = await Delivery.findOne({ _id: req.params.id, tenantId: req.tenantId })
      .populate("loggedBy", "fullName")
      .populate("approvedBy", "fullName")
      .populate("rejectedBy", "fullName")
      .populate("residentId", "fullName phone");

    if (!item) throw new AppError("Delivery not found", StatusCodes.NOT_FOUND);

    const isAdminOrSecurity = ["security", "committee", "super_admin"].includes(req.user.role);
    const isOwner = String(item.residentId?._id || item.residentId) === String(req.user.userId);
    if (!isAdminOrSecurity && !isOwner) {
      throw new AppError("Forbidden", StatusCodes.FORBIDDEN);
    }

    res.json({ item });
  } catch (error) {
    next(error);
  }
}
