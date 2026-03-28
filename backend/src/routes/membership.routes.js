import { Router } from "express";
import { getMyMembership, joinMembership } from "../controllers/membership.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const membershipRouter = Router();

membershipRouter.use(requireAuth);
membershipRouter.get("/me", getMyMembership);
membershipRouter.post("/join", joinMembership);

export { membershipRouter };
