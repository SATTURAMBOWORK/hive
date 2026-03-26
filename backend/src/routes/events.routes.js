import { Router } from "express";
import { createEvent, listEvents } from "../controllers/events.controller.js";
import { requireAuth, requireRoles } from "../middlewares/auth.middleware.js";
import { requireTenantScope } from "../middlewares/tenant.middleware.js";

const eventRouter = Router();

eventRouter.use(requireAuth, requireTenantScope);
eventRouter.get("/", listEvents);
eventRouter.post("/", requireRoles("committee", "super_admin"), createEvent);

export { eventRouter };
