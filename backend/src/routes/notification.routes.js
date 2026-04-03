import { Router } from "express";
import { getMyNotifications, markOneRead, markAllRead } from "../controllers/notification.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireTenantScope } from "../middlewares/tenant.middleware.js";

const notificationRouter = Router();

notificationRouter.use(requireAuth, requireTenantScope);

notificationRouter.get("/", getMyNotifications);
notificationRouter.patch("/read-all", markAllRead);
notificationRouter.patch("/:id/read", markOneRead);

export { notificationRouter };
