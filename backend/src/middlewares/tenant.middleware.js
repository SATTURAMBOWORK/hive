import { StatusCodes } from "http-status-codes";
import { AppError } from "../utils/app-error.js";

export function requireTenantScope(req, _res, next) {
  const tenantIdFromUser = req.user?.tenantId;
  const tenantIdFromHeader = req.headers["x-tenant-id"];

  if (!tenantIdFromUser && !tenantIdFromHeader) {
    return next(new AppError("Tenant scope missing", StatusCodes.BAD_REQUEST));
  }

  // TODO (Learning Step):
  // Decide strict tenant resolution strategy:
  // 1) always trust JWT tenantId, or
  // 2) allow super_admin to switch tenant via header.
  req.tenantId = tenantIdFromUser || tenantIdFromHeader;

  next();
}
