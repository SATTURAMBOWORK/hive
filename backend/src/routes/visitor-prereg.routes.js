import { Router } from "express";
import {
  createPreReg,
  listMyPreRegs,
  cancelPreReg,
  verifyOtp
} from "../controllers/visitor-prereg.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRoles } from "../middlewares/auth.middleware.js";
import { requireTenantScope } from "../middlewares/tenant.middleware.js";
import { createRedisRateLimiter } from "../middlewares/redis-rate-limit.middleware.js";

const preRegRouter = Router();

// 10 visitor passes per IP per hour — prevents OTP spam to visitors
const createPassLimiter = createRedisRateLimiter({
  keyPrefix: "visitor-prereg:create",
  windowSeconds: 60 * 60,
  maxRequests: 10,
  message: "Too many visitor pass requests. Please wait an hour and try again.",
});

// All routes require a valid token + tenant context
preRegRouter.use(requireAuth, requireTenantScope);

// ── Resident routes ──────────────────────────────────────────────
// Create a new pre-registration (generates OTP)
preRegRouter.post("/",    requireRoles("resident", "committee", "super_admin"), createPassLimiter, createPreReg);

// List own pre-registrations
preRegRouter.get("/",     requireRoles("resident", "committee", "super_admin"), listMyPreRegs);

// Cancel a specific pre-registration by ID
preRegRouter.delete("/:id", requireRoles("resident", "committee", "super_admin"), cancelPreReg);

// ── Guard routes ─────────────────────────────────────────────────
// Guard submits OTP at gate → validates + creates visitor entry
// NOTE: /verify-otp must come before /:id to avoid route collision
preRegRouter.post("/verify-otp", requireRoles("security", "committee", "super_admin"), verifyOtp);

export { preRegRouter };
