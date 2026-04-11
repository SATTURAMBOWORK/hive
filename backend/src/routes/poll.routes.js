import { Router } from "express";
import {
  createPoll,
  listPolls,
  getPoll,
  castVote,
  closePoll,
  deletePoll,
} from "../controllers/poll.controller.js";
import { requireAuth, requireRoles } from "../middlewares/auth.middleware.js";
import { requireTenantScope } from "../middlewares/tenant.middleware.js";

const pollRouter = Router();

pollRouter.use(requireAuth, requireTenantScope);

// ── Anyone in the society can view polls ──────────────────────────
pollRouter.get("/",    requireRoles("resident", "committee", "super_admin", "security"), listPolls);
pollRouter.get("/:id", requireRoles("resident", "committee", "super_admin", "security"), getPoll);

// ── Residents vote ────────────────────────────────────────────────
pollRouter.post("/:id/vote", requireRoles("resident", "committee", "super_admin"), castVote);

// ── Committee manages ─────────────────────────────────────────────
pollRouter.post(   "/",          requireRoles("committee", "super_admin"), createPoll);
pollRouter.patch(  "/:id/close", requireRoles("committee", "super_admin"), closePoll);
pollRouter.delete( "/:id",       requireRoles("committee", "super_admin"), deletePoll);

export { pollRouter };
