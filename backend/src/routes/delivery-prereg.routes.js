import { Router } from "express";
import {
  createPreReg,
  listMyPreRegs,
  listUpcomingPreRegs,
  cancelPreReg
} from "../controllers/delivery-prereg.controller.js";
import { requireAuth, requireRoles } from "../middlewares/auth.middleware.js";
import { requireTenantScope } from "../middlewares/tenant.middleware.js";

const deliveryPreRegRouter = Router();

// Every route needs a valid JWT + a tenant context
deliveryPreRegRouter.use(requireAuth, requireTenantScope);

// ── Resident routes ──────────────────────────────────────────────────────────

// Resident registers an expected parcel in advance
deliveryPreRegRouter.post(
  "/",
  requireRoles("resident", "committee", "super_admin"),
  createPreReg
);

// Resident views their own pre-registrations
deliveryPreRegRouter.get(
  "/",
  requireRoles("resident", "committee", "super_admin"),
  listMyPreRegs
);

// Guard views all active pre-registrations for the tenant (so they know what's coming)
// NOTE: must be before /:id to avoid being swallowed as a param
deliveryPreRegRouter.get(
  "/upcoming",
  requireRoles("security", "committee", "super_admin"),
  listUpcomingPreRegs
);

// Resident cancels a pre-registration they created
// NOTE: /:id comes AFTER named sub-paths so it doesn't swallow them
deliveryPreRegRouter.delete(
  "/:id",
  requireRoles("resident", "committee", "super_admin"),
  cancelPreReg
);

export { deliveryPreRegRouter };
