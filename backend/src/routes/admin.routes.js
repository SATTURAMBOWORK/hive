import { Router } from "express";
import { approveResident, rejectResident, listPendingApprovals } from "../controllers/admin.controller.js";
import { requireAuth, requireRoles } from "../middlewares/auth.middleware.js";
import { requireTenantScope } from "../middlewares/tenant.middleware.js";

const adminRouter = Router();

adminRouter.use(requireAuth, requireTenantScope, requireRoles("committee", "super_admin"));
adminRouter.get("/pending-approvals", listPendingApprovals);
adminRouter.patch("/approve-resident/:id", approveResident);
adminRouter.patch("/reject-resident/:id", rejectResident);

export { adminRouter };
