import { Router } from "express";
import {
  sendSos,
  getAlerts,
  getMyActiveAlert,
  acknowledgeAlert,
  resolveAlert,
  confirmResolveAlert,
  rejectResolveAlert,
} from "../controllers/sos.controller.js";
import { requireAuth, requireRoles } from "../middlewares/auth.middleware.js";
import { requireTenantScope } from "../middlewares/tenant.middleware.js";
import { requireApprovedMembership } from "../middlewares/membership.middleware.js";
import { createRedisRateLimiter } from "../middlewares/redis-rate-limit.middleware.js";

const sosRouter = Router();

// 5 SOS alerts per IP per 15 min — blocks spam while allowing genuine emergencies
const sosLimiter = createRedisRateLimiter({
  keyPrefix: "sos:send",
  windowSeconds: 15 * 60,
  maxRequests: 5,
  message: "Too many SOS requests. Please try again shortly.",
});

// All SOS routes require a valid JWT and tenant scope
sosRouter.use(requireAuth, requireTenantScope);

// Residents send SOS — also requires approved membership
sosRouter.post(
  "/",
  requireRoles("resident", "committee"),
  requireApprovedMembership,
  sosLimiter,
  sendSos
);

// Resident restores their own active alert after page refresh
// IMPORTANT: must be declared before /:id routes so "mine" isn't parsed as an ID
sosRouter.get("/mine/active", requireRoles("resident", "committee"), getMyActiveAlert);

// Security and committee can view all alerts
sosRouter.get(
  "/",
  requireRoles("security", "committee", "super_admin"),
  getAlerts
);

// Security, committee, and admin can acknowledge or resolve
sosRouter.patch("/:id/acknowledge", requireRoles("security", "committee", "super_admin"), acknowledgeAlert);
sosRouter.patch("/:id/resolve",     requireRoles("security", "committee", "super_admin"), resolveAlert);

// Resident confirms they are safe — closes the alert
sosRouter.patch("/:id/confirm-resolve", confirmResolveAlert);
// Resident says they still need help — reverts alert to acknowledged
sosRouter.patch("/:id/reject-resolve",  rejectResolveAlert);

export { sosRouter };
