import { Router } from "express";
import {
	createSocietyUnit,
	createSocietyWing,
	deleteSocietyUnit,
	deleteSocietyWing,
	listSocietyUnits,
	searchSocieties
} from "../controllers/societies.controller.js";
import { requireAuth, requireRoles } from "../middlewares/auth.middleware.js";
import { requireTenantScope } from "../middlewares/tenant.middleware.js";

const societiesRouter = Router();

societiesRouter.use(requireAuth);
societiesRouter.get("/search", searchSocieties);
societiesRouter.get("/:id/units", listSocietyUnits);
societiesRouter.post(
	"/:id/wings",
	requireTenantScope,
	requireRoles("committee", "super_admin"),
	createSocietyWing
);
societiesRouter.post(
	"/:id/units",
	requireTenantScope,
	requireRoles("committee", "super_admin"),
	createSocietyUnit
);
societiesRouter.delete(
	"/:id/wings/:wingId",
	requireTenantScope,
	requireRoles("committee", "super_admin"),
	deleteSocietyWing
);
societiesRouter.delete(
	"/:id/units/:unitId",
	requireTenantScope,
	requireRoles("committee", "super_admin"),
	deleteSocietyUnit
);

export { societiesRouter };
