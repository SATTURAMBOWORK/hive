import { StatusCodes } from "http-status-codes";
import { User } from "../models/user.model.js";
import { Membership } from "../models/membership.model.js";
import { AppError } from "../utils/app-error.js";

function sanitizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export async function getMyProfile(req, res, next) {
  try {
    const user = await User.findById(req.user.userId).select("-passwordHash");
    if (!user) throw new AppError("User not found", StatusCodes.NOT_FOUND);

    const membership = await Membership.findOne({
      userId: user._id,
      tenantId: req.user.tenantId
    })
      .populate("wingId", "name code")
      .populate("unitId", "unitNumber floor");

    res.json({ user, membership: membership || null });
  } catch (error) {
    next(error);
  }
}

export async function updateMyProfile(req, res, next) {
  try {
    const fullName = sanitizeText(req.body?.fullName);
    const phone = sanitizeText(req.body?.phone);

    if (!fullName) throw new AppError("Full name is required", StatusCodes.BAD_REQUEST);

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { fullName, phone },
      { new: true, runValidators: true }
    ).select("-passwordHash");

    if (!user) throw new AppError("User not found", StatusCodes.NOT_FOUND);

    res.json({ user });
  } catch (error) {
    next(error);
  }
}
