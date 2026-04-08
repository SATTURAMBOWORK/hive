import { Router } from "express";
import { requestEntry, respondToRequest, markExit, listVisitors, listFlats } from "../controllers/visitor.controller.js";
import { requireAuth, requireRoles } from "../middlewares/auth.middleware.js";
import { requireTenantScope } from "../middlewares/tenant.middleware.js";

const visitorRouter = Router();

// All visitor routes need a valid token + tenant scope
visitorRouter.use(requireAuth, requireTenantScope);

// Guard & admin: view log, flat list, create request, mark exit
visitorRouter.get("/flats",       requireRoles("security", "committee", "super_admin"), listFlats);    //specific routes always above parameterized routes
visitorRouter.get("/",            requireRoles("security", "committee", "super_admin"), listVisitors);
visitorRouter.post("/",           requireRoles("security", "committee", "super_admin"), requestEntry);
visitorRouter.patch("/:id/exit",  requireRoles("security", "committee", "super_admin"), markExit);

// Resident & admin: approve or reject a pending request
visitorRouter.patch("/:id/respond", requireRoles("resident", "committee", "super_admin"), respondToRequest);

export { visitorRouter };
