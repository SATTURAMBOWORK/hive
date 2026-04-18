import { Router } from "express";
import {
  logDelivery,
  listPendingDeliveries,
  myDeliveries,
  approveDelivery,
  rejectDelivery,
  markDelivered,
  markReturned,
  getDelivery
} from "../controllers/delivery.controller.js";
import { requireAuth, requireRoles } from "../middlewares/auth.middleware.js";
import { requireTenantScope } from "../middlewares/tenant.middleware.js";

const deliveryRouter = Router();

// Every route needs a valid JWT + a tenant context
deliveryRouter.use(requireAuth, requireTenantScope);

// ── Guard routes ─────────────────────────────────────────────────────────────

// Guard logs a delivery agent arriving at the gate
deliveryRouter.post(
  "/",
  requireRoles("security", "committee", "super_admin"),
  logDelivery
);

// Guard sees all deliveries currently waiting for resident approval
deliveryRouter.get(
  "/pending",
  requireRoles("security", "committee", "super_admin"),
  listPendingDeliveries
);

// Guard marks a parcel as physically handed over to the resident
deliveryRouter.post(
  "/:id/handover",
  requireRoles("security", "committee", "super_admin"),
  markDelivered
);

// Guard marks the parcel as returned (agent took it back)
deliveryRouter.post(
  "/:id/return",
  requireRoles("security", "committee", "super_admin"),
  markReturned
);

// ── Resident routes ───────────────────────────────────────────────────────────

// Resident sees their own delivery history
deliveryRouter.get(
  "/my",
  requireRoles("resident", "committee", "super_admin"),
  myDeliveries
);

// Resident approves an awaiting delivery (tapped "Allow" on notification)
deliveryRouter.post(
  "/:id/approve",
  requireRoles("resident", "committee", "super_admin"),
  approveDelivery
);

// Resident rejects an awaiting delivery (tapped "Deny" on notification)
deliveryRouter.post(
  "/:id/reject",
  requireRoles("resident", "committee", "super_admin"),
  rejectDelivery
);

// ── Shared ───────────────────────────────────────────────────────────────────

// Fetch a single delivery by ID (resident checks their own, guard checks any)
// NOTE: keep /:id last — it is a wildcard and will swallow named paths above if placed first
deliveryRouter.get(
  "/:id",
  requireRoles("resident", "security", "committee", "super_admin"),
  getDelivery
);

export { deliveryRouter };
