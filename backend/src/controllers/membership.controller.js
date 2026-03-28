import mongoose from "mongoose";
import { StatusCodes } from "http-status-codes";
import { Membership } from "../models/membership.model.js";
import { SocietyUnit } from "../models/society-unit.model.js";
import { SocietyWing } from "../models/society-wing.model.js";
import { Tenant } from "../models/tenant.model.js";
import { AppError } from "../utils/app-error.js";

const ALLOWED_RESIDENT_ROLES = ["owner", "tenant"];

function sanitizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export async function joinMembership(req, res, next) {
  try {
    const societyId = sanitizeText(req.body?.societyId);
    const wingId = sanitizeText(req.body?.wingId);
    const unitId = sanitizeText(req.body?.unitId);
    const residentRole = sanitizeText(req.body?.residentRole).toLowerCase();
    const verificationDocUrl = sanitizeText(req.body?.verificationDocUrl);

    if (!societyId || !wingId || !unitId || !residentRole || !verificationDocUrl) {
      throw new AppError(
        "societyId, wingId, unitId, residentRole, verificationDocUrl are required",
        StatusCodes.BAD_REQUEST
      );
    }

    if (!mongoose.Types.ObjectId.isValid(societyId)) {
      throw new AppError("Invalid societyId", StatusCodes.BAD_REQUEST);
    }

    if (!mongoose.Types.ObjectId.isValid(wingId)) {
      throw new AppError("Invalid wingId", StatusCodes.BAD_REQUEST);
    }

    if (!mongoose.Types.ObjectId.isValid(unitId)) {
      throw new AppError("Invalid unitId", StatusCodes.BAD_REQUEST);
    }

    if (!ALLOWED_RESIDENT_ROLES.includes(residentRole)) {
      throw new AppError("residentRole must be owner or tenant", StatusCodes.BAD_REQUEST);
    }

    const society = await Tenant.findById(societyId).select("_id isActive");
    if (!society || !society.isActive) {
      throw new AppError("Society not found", StatusCodes.NOT_FOUND);
    }

    const wing = await SocietyWing.findOne({ _id: wingId, tenantId: society._id });
    if (!wing) {
      throw new AppError("Wing not found for selected society", StatusCodes.BAD_REQUEST);
    }

    const unit = await SocietyUnit.findOne({ _id: unitId, tenantId: society._id, wingId: wing._id, isActive: true });
    if (!unit) {
      throw new AppError("Unit not found for selected society/wing", StatusCodes.BAD_REQUEST);
    }

    const existingForUser = await Membership.findOne({
      userId: req.user.userId,
      status: { $in: ["pending", "approved"] }
    });
    if (existingForUser) {
      throw new AppError("You already have an active or pending membership request", StatusCodes.CONFLICT);
    }

    const occupiedUnit = await Membership.findOne({
      tenantId: society._id,
      unitId: unit._id,
      status: "approved"
    });
    if (occupiedUnit) {
      throw new AppError("Selected unit is already occupied", StatusCodes.CONFLICT);
    }

    const item = await Membership.create({
      tenantId: society._id,
      userId: req.user.userId,
      wingId: wing._id,
      unitId: unit._id,
      residentRole,
      verificationDocUrl,
      status: "pending"
    });

    res.status(StatusCodes.CREATED).json({ item });
  } catch (error) {
    next(error);
  }
}

export async function getMyMembership(req, res, next) {
  try {
    const item = await Membership.findOne({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .populate("tenantId", "name city slug")
      .populate("wingId", "name code")
      .populate("unitId", "unitNumber floor");

    res.json({ item });
  } catch (error) {
    next(error);
  }
}
