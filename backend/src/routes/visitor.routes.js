import { Router } from "express";
import { logEntry, markExit, listVisitors } from "../controllers/visitor.controller.js";
import { requireAuth, requireRoles } from "../middlewares/auth.middleware.js";
import { requireTenantScope } from "../middlewares/tenant.middleware.js";

const visitorRouter = Router();

// Only security guards and admins can access visitor logs
visitorRouter.use(requireAuth, requireTenantScope, requireRoles("security", "committee", "super_admin"));

visitorRouter.get("/",          listVisitors);
visitorRouter.post("/",         logEntry);
visitorRouter.patch("/:id/exit", markExit);

export { visitorRouter };
