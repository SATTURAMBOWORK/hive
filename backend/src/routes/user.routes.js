import { Router } from "express";
import { getMyProfile, updateMyProfile } from "../controllers/user.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireTenantScope } from "../middlewares/tenant.middleware.js";

const userRouter = Router();

userRouter.use(requireAuth, requireTenantScope);
userRouter.get("/me", getMyProfile);
userRouter.patch("/me", updateMyProfile);

export { userRouter };
