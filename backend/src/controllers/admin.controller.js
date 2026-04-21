import mongoose from "mongoose";
import { StatusCodes } from "http-status-codes";
import { Membership } from "../models/membership.model.js";
import { User } from "../models/user.model.js";
import { AppError } from "../utils/app-error.js";
import { SOCKET_EVENTS } from "../config/socket-events.js";
import { createNotification } from "../utils/create-notification.js";
import { emitRealtime } from "../services/realtime-bus.service.js";

function sanitizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export async function listResidents(req, res, next) {
  try {
    const memberships = await Membership.find({
      tenantId: req.tenantId,
      status: "approved"
    })
      .sort({ createdAt: -1 })
      .populate("userId", "fullName email phone")
      .populate("wingId", "name code")
      .populate("unitId", "unitNumber floor");

    // Exclude memberships where the user was deleted directly from DB
    const items = memberships.filter((m) => m.userId != null);

    res.json({ items });
  } catch (error) {
    next(error);
  }
}

export async function listPendingApprovals(req, res, next) {
  try {
    const items = await Membership.find({
      tenantId: req.tenantId,
      status: "pending"
    })
      .sort({ createdAt: -1 })
      .populate("userId", "fullName email phone")
      .populate("wingId", "name code")
      .populate("unitId", "unitNumber floor");

    res.json({ items });
  } catch (error) {
    next(error);
  }
}

export async function approveResident(req, res, next) {
  try {
    const membershipId = sanitizeText(req.params?.id);

    if (!mongoose.Types.ObjectId.isValid(membershipId)) {
      throw new AppError("Invalid membership id", StatusCodes.BAD_REQUEST);
    }

    const membership = await Membership.findOne({
      _id: membershipId,
      tenantId: req.tenantId
    });

    if (!membership) {
      throw new AppError("Membership request not found", StatusCodes.NOT_FOUND);
    }

    if (membership.status !== "pending") {
      throw new AppError("Only pending memberships can be approved", StatusCodes.BAD_REQUEST);
    }

    const occupiedUnit = await Membership.findOne({
      tenantId: req.tenantId,
      unitId: membership.unitId,
      status: "approved"
    }).populate("userId", "_id");

    if (occupiedUnit) {
      if (occupiedUnit.userId != null) {
        throw new AppError("Unit is already occupied", StatusCodes.CONFLICT);
      }
      // User was deleted directly from DB — clean up the orphaned membership
      await occupiedUnit.deleteOne();
    }

    membership.status = "approved";
    membership.approvedBy = req.user.userId;
    membership.approvedAt = new Date();
    await membership.save();

    await User.findByIdAndUpdate(membership.userId, {
      tenantId: membership.tenantId,
      isVerified: true
    });

    const populated = await membership.populate([
      { path: "userId", select: "fullName email" },
      { path: "wingId", select: "name code" },
      { path: "unitId", select: "unitNumber floor" }
    ]);

    const io = req.app.get("io");
    await emitRealtime(io, {
      room: `user:${membership.userId}`,
      event: SOCKET_EVENTS.MEMBERSHIP_APPROVED,
      payload: { item: populated }
    });
    await emitRealtime(io, {
      room: `tenant:${req.tenantId}`,
      event: SOCKET_EVENTS.MEMBERSHIP_APPROVED,
      payload: { item: populated }
    });

    await createNotification(io, {
      tenantId: req.tenantId,
      userId: membership.userId,
      type: "membership_approved",
      title: "Membership Approved",
      message: "Your membership request has been approved. Welcome to the community!",
      data: { membershipId: membership._id }
    });

    res.json({ item: populated });
  } catch (error) {
    next(error);
  }
}

export async function rejectResident(req, res, next) {
  try {
    const membershipId = sanitizeText(req.params?.id);
    const rejectedReason = sanitizeText(req.body?.reason);

    if (!mongoose.Types.ObjectId.isValid(membershipId)) {
      throw new AppError("Invalid membership id", StatusCodes.BAD_REQUEST);
    }

    if (!rejectedReason) {
      throw new AppError("A reason for rejection is required", StatusCodes.BAD_REQUEST);
    }

    const membership = await Membership.findOne({
      _id: membershipId,
      tenantId: req.tenantId
    });

    if (!membership) {
      throw new AppError("Membership request not found", StatusCodes.NOT_FOUND);
    }

    if (membership.status !== "pending") {
      throw new AppError("Only pending memberships can be rejected", StatusCodes.BAD_REQUEST);
    }

    membership.status = "rejected";
    membership.rejectedReason = rejectedReason;
    await membership.save();

    const populated = await membership.populate([
      { path: "userId", select: "fullName email" },
      { path: "wingId", select: "name code" },
      { path: "unitId", select: "unitNumber floor" }
    ]);

    const io = req.app.get("io");
    await emitRealtime(io, {
      room: `user:${membership.userId}`,
      event: SOCKET_EVENTS.MEMBERSHIP_REJECTED,
      payload: { item: populated }
    });

    await createNotification(io, {
      tenantId: req.tenantId,
      userId: membership.userId,
      type: "membership_rejected",
      title: "Membership Request Rejected",
      message: `Your membership request was rejected. Reason: ${rejectedReason}`,
      data: { membershipId: membership._id, reason: rejectedReason }
    });

    res.json({ item: populated });
  } catch (error) {
    next(error);
  }
}
