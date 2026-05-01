import { Router } from "express";
import {
  createGroupPass,
  listMyGroupPasses,
  cancelGroupPass,
  checkGroupOtp,
  verifyGroupOtp
} from "../controllers/group-pass.controller.js";
import { requireAuth, requireRoles } from "../middlewares/auth.middleware.js";
import { requireTenantScope } from "../middlewares/tenant.middleware.js";
import { createRedisRateLimiter } from "../middlewares/redis-rate-limit.middleware.js";

const groupPassRouter = Router();

// 10 group passes per IP per hour — prevents OTP spam
const createPassLimiter = createRedisRateLimiter({
  keyPrefix: "group-pass:create",
  windowSeconds: 60 * 60,
  maxRequests: 10,
  message: "Too many group pass requests. Please wait an hour and try again.",
});

groupPassRouter.use(requireAuth, requireTenantScope);

// ── Resident routes ──────────────────────────────────────────────

// IMPORTANT: /check and /verify-otp must be before /:id
// so Express doesn't treat them as IDs

groupPassRouter.get(
  "/",
  requireRoles("resident", "committee", "super_admin"),
  listMyGroupPasses
);

groupPassRouter.post(
  "/",
  requireRoles("resident", "committee", "super_admin"),
  createPassLimiter,
  createGroupPass
);

groupPassRouter.delete(
  "/:id",
  requireRoles("resident", "committee", "super_admin"),
  cancelGroupPass
);

// ── Guard routes ─────────────────────────────────────────────────

// Step 1 — identify OTP without consuming a use
groupPassRouter.get(
  "/check",
  requireRoles("security", "committee", "super_admin"),
  checkGroupOtp
);

// Step 2 — consume a use, log the entry
groupPassRouter.post(
  "/verify-otp",
  requireRoles("security", "committee", "super_admin"),
  verifyGroupOtp
);

export { groupPassRouter };
