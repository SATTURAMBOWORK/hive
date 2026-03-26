import { Router } from "express";
import { createAnnouncement, listAnnouncements } from "../controllers/announcements.controller.js";
import { requireAuth, requireRoles } from "../middlewares/auth.middleware.js";
import { requireTenantScope } from "../middlewares/tenant.middleware.js";

const announcementRouter = Router();

announcementRouter.use(requireAuth, requireTenantScope);
announcementRouter.get("/", listAnnouncements);
announcementRouter.post("/", requireRoles("committee", "super_admin"), createAnnouncement);

export { announcementRouter };
