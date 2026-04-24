import { Router } from "express";
import {
  logDelivery,
  listPendingDeliveries,
  listActiveDeliveries,
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

// Guard sees all active deliveries (pending + approved, not yet handed over)
deliveryRouter.get(
  "/active",
  requireRoles("security", "committee", "super_admin"),
  listActiveDeliveries
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

// Guard approves an awaiting delivery
deliveryRouter.post(
  "/:id/approve",
  requireRoles("security", "committee", "super_admin"),
  approveDelivery
);

// Guard rejects an awaiting delivery
deliveryRouter.post(
  "/:id/reject",
  requireRoles("security", "committee", "super_admin"),
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
