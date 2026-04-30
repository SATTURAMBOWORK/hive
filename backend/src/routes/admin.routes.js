import { Router } from "express";
import { approveResident, rejectResident, listPendingApprovals, listResidents, removeMember, changeMemberRole } from "../controllers/admin.controller.js";
import { requireAuth, requireRoles } from "../middlewares/auth.middleware.js";
import { requireTenantScope } from "../middlewares/tenant.middleware.js";

const adminRouter = Router();

adminRouter.use(requireAuth, requireTenantScope, requireRoles("committee", "super_admin")); //every single routes below must pass through these middlewares in order
adminRouter.get("/pending-approvals", listPendingApprovals);
adminRouter.get("/residents", listResidents);
adminRouter.patch("/approve-resident/:id", approveResident);
adminRouter.patch("/reject-resident/:id", rejectResident);
adminRouter.delete("/residents/:id", removeMember);
adminRouter.patch("/residents/:id/role", changeMemberRole);

export { adminRouter };
