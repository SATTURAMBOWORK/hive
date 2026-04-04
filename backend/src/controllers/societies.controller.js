import mongoose from "mongoose";
import { StatusCodes } from "http-status-codes";
import { Tenant } from "../models/tenant.model.js";
import { SocietyUnit } from "../models/society-unit.model.js";
import { SocietyWing } from "../models/society-wing.model.js";
import { Membership } from "../models/membership.model.js";
import { AppError } from "../utils/app-error.js";

function sanitizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function assertManageScope(req, societyId) {
  if (String(req.tenantId) !== String(societyId)) {
    throw new AppError("Forbidden society scope", StatusCodes.FORBIDDEN);
  }
}

export async function searchSocieties(req, res, next) {
  try {
    const q = sanitizeText(req.query?.q);

    const filter = q
      ? {
          $or: [
            { name: { $regex: q, $options: "i" } },
            { city: { $regex: q, $options: "i" } },
            { slug: { $regex: q, $options: "i" } }
          ]
        }
      : {};

    const items = await Tenant.find({ ...filter, isActive: true })
      .sort({ name: 1 })
      .select("name city slug")
      .limit(20);

    res.json({ items });
  } catch (error) {
    next(error);
  }
}

export async function listSocietyUnits(req, res, next) {
  try {
    const societyId = sanitizeText(req.params?.id);

    if (!mongoose.Types.ObjectId.isValid(societyId)) {
      throw new AppError("Invalid society id", StatusCodes.BAD_REQUEST);
    }

    const society = await Tenant.findById(societyId).select("_id name city slug isActive");
    if (!society || !society.isActive) {
      throw new AppError("Society not found", StatusCodes.NOT_FOUND);
    }

    const wings = await SocietyWing.find({ tenantId: society._id })
      .sort({ name: 1 })
      .select("name code");

    const units = await SocietyUnit.find({ tenantId: society._id, isActive: true })
      .sort({ unitNumber: 1 })
      .populate("wingId", "name code");

    const approvedMemberships = await Membership.find({
      tenantId: society._id,
      status: "approved",
      unitId: { $in: units.map((unit) => unit._id) }
    }).select("unitId userId").populate("userId", "_id");

    // Filter out memberships where the user was deleted directly from DB
    const occupiedUnitIds = new Set(
      approvedMemberships
        .filter((m) => m.userId != null)
        .map((m) => String(m.unitId))
    );

    const mapUnit = (unit) => ({
      _id: unit._id,
      unitNumber: unit.unitNumber,
      floor: unit.floor,
      wing: unit.wingId
        ? { _id: unit.wingId._id, name: unit.wingId.name, code: unit.wingId.code }
        : null
    });

    // vacant only — used by onboarding flow
    const items = units
      .filter((unit) => !occupiedUnitIds.has(String(unit._id)))
      .map(mapUnit);

    // all units — used by admin setup page
    const allUnits = units.map(mapUnit);

    res.json({
      society,
      wings,
      items,
      allUnits
    });
  } catch (error) {
    next(error);
  }
}

export async function createSocietyWing(req, res, next) {
  try {
    const societyId = sanitizeText(req.params?.id);
    const name = sanitizeText(req.body?.name);
    const code = sanitizeText(req.body?.code).toUpperCase();

    if (!mongoose.Types.ObjectId.isValid(societyId)) {
      throw new AppError("Invalid society id", StatusCodes.BAD_REQUEST);
    }

    assertManageScope(req, societyId);

    if (!name || !code) {
      throw new AppError("name and code are required", StatusCodes.BAD_REQUEST);
    }

    const society = await Tenant.findById(societyId).select("_id isActive");
    if (!society || !society.isActive) {
      throw new AppError("Society not found", StatusCodes.NOT_FOUND);
    }

    const item = await SocietyWing.create({
      tenantId: society._id,
      name,
      code
    });

    res.status(StatusCodes.CREATED).json({ item });
  } catch (error) {
    next(error);
  }
}

export async function deleteSocietyWing(req, res, next) {
  try {
    const societyId = sanitizeText(req.params?.id);
    const wingId = sanitizeText(req.params?.wingId);

    if (!mongoose.Types.ObjectId.isValid(societyId) || !mongoose.Types.ObjectId.isValid(wingId)) {
      throw new AppError("Invalid id", StatusCodes.BAD_REQUEST);
    }

    assertManageScope(req, societyId);

    const wing = await SocietyWing.findOne({ _id: wingId, tenantId: societyId });
    if (!wing) throw new AppError("Tower not found", StatusCodes.NOT_FOUND);

    const unitCount = await SocietyUnit.countDocuments({ wingId, tenantId: societyId });
    if (unitCount > 0) {
      throw new AppError(
        `Cannot delete — this tower still has ${unitCount} flat(s). Delete the flats first.`,
        StatusCodes.CONFLICT
      );
    }

    await wing.deleteOne();
    res.json({ message: "Tower deleted" });
  } catch (error) {
    next(error);
  }
}

export async function createSocietyUnit(req, res, next) {
  try {
    const societyId = sanitizeText(req.params?.id);
    const wingId = sanitizeText(req.body?.wingId);
    const unitNumber = sanitizeText(req.body?.unitNumber);
    const floor = Number(req.body?.floor || 0);

    if (!mongoose.Types.ObjectId.isValid(societyId)) {
      throw new AppError("Invalid society id", StatusCodes.BAD_REQUEST);
    }

    assertManageScope(req, societyId);

    if (!mongoose.Types.ObjectId.isValid(wingId)) {
      throw new AppError("Invalid wingId", StatusCodes.BAD_REQUEST);
    }

    if (!unitNumber) {
      throw new AppError("unitNumber is required", StatusCodes.BAD_REQUEST);
    }

    if (!Number.isFinite(floor)) {
      throw new AppError("floor must be a number", StatusCodes.BAD_REQUEST);
    }

    const society = await Tenant.findById(societyId).select("_id isActive");
    if (!society || !society.isActive) {
      throw new AppError("Society not found", StatusCodes.NOT_FOUND);
    }

    const wing = await SocietyWing.findOne({ _id: wingId, tenantId: society._id });
    if (!wing) {
      throw new AppError("Wing not found", StatusCodes.BAD_REQUEST);
    }

    const item = await SocietyUnit.create({
      tenantId: society._id,
      wingId: wing._id,
      unitNumber,
      floor,
      isActive: true
    });

    res.status(StatusCodes.CREATED).json({ item });
  } catch (error) {
    if (error.code === 11000) {
      return next(new AppError(`Flat "${req.body?.unitNumber}" already exists in this tower.`, StatusCodes.CONFLICT));
    }
    next(error);
  }
}

export async function deleteSocietyUnit(req, res, next) {
  try {
    const societyId = sanitizeText(req.params?.id);
    const unitId = sanitizeText(req.params?.unitId);

    if (!mongoose.Types.ObjectId.isValid(societyId) || !mongoose.Types.ObjectId.isValid(unitId)) {
      throw new AppError("Invalid id", StatusCodes.BAD_REQUEST);
    }

    assertManageScope(req, societyId);

    const unit = await SocietyUnit.findOne({ _id: unitId, tenantId: societyId });
    if (!unit) throw new AppError("Flat not found", StatusCodes.NOT_FOUND);

    const activeMembership = await Membership.findOne({ unitId, tenantId: societyId, status: "approved" });
    if (activeMembership) {
      throw new AppError("Cannot delete — this flat has an active resident.", StatusCodes.CONFLICT);
    }

    await unit.deleteOne();
    res.json({ message: "Flat deleted" });
  } catch (error) {
    next(error);
  }
}
