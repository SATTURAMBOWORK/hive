import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import { AppError } from "../utils/app-error.js";

export function requireTenantScope(req, _res, next) {
  if (!req.user) {
    return next(new AppError("Unauthorized", StatusCodes.UNAUTHORIZED));
  }

  const tenantIdFromUser = req.user?.tenantId;
  const tenantIdFromHeader = req.headers["x-tenant-id"];

  if (!tenantIdFromUser) {
    return next(new AppError("Tenant scope missing", StatusCodes.BAD_REQUEST));
  }

  const userTenantId = String(tenantIdFromUser);
  const headerTenantId = tenantIdFromHeader ? String(tenantIdFromHeader) : null;
  const isSuperAdmin = req.user.role === "super_admin";

  if (headerTenantId && !isSuperAdmin && headerTenantId !== userTenantId) {
    return next(
      new AppError("Forbidden tenant switch", StatusCodes.FORBIDDEN)
    );
  }

  const resolvedTenantId = isSuperAdmin && headerTenantId ? headerTenantId : userTenantId;

  if (!mongoose.Types.ObjectId.isValid(resolvedTenantId)) {
    return next(new AppError("Invalid tenant scope", StatusCodes.BAD_REQUEST));
  }

  req.tenantId = resolvedTenantId;

  next();
}
