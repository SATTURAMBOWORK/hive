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

const groupPassRouter = Router();

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
