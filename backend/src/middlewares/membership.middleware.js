import { StatusCodes } from "http-status-codes";
import { Membership } from "../models/membership.model.js";
import { AppError } from "../utils/app-error.js";

export async function requireApprovedMembership(req, _res, next) {
  try {
    if (!req.user) {
      return next(new AppError("Unauthorized", StatusCodes.UNAUTHORIZED));
    }

    const ROLES_REQUIRING_MEMBERSHIP = ["resident", "committee"];
    if (!ROLES_REQUIRING_MEMBERSHIP.includes(req.user.role)) {
      return next();
    }

    const membership = await Membership.findOne({
      userId: req.user.userId,
      tenantId: req.tenantId,
      status: "approved"
    });

    if (!membership) {
      return next(new AppError("Membership approval pending", StatusCodes.FORBIDDEN));
    }

    req.membership = membership;
    return next();
  } catch (error) {
    return next(error);
  }
}
