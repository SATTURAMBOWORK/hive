import { Router } from "express";
import { createAnnouncement, listAnnouncements, markAnnouncementRead } from "../controllers/announcements.controller.js";
import { requireAuth, requireRoles } from "../middlewares/auth.middleware.js";
import { requireTenantScope } from "../middlewares/tenant.middleware.js";
import { requireApprovedMembership } from "../middlewares/membership.middleware.js";

const announcementRouter = Router();

announcementRouter.use(requireAuth, requireTenantScope, requireApprovedMembership);
announcementRouter.get("/", listAnnouncements);
announcementRouter.patch("/:id/read", markAnnouncementRead);
announcementRouter.post("/", requireRoles("committee", "super_admin"), createAnnouncement);

export { announcementRouter };
