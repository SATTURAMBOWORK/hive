import { Router } from "express";
import multer from "multer";
import {
  listItems,
  createItem,
  claimItem,
  resolveItem,
  deleteItem,
} from "../controllers/lost-found.controller.js";
import { requireAuth, requireRoles } from "../middlewares/auth.middleware.js";
import { requireTenantScope } from "../middlewares/tenant.middleware.js";
import { requireApprovedMembership } from "../middlewares/membership.middleware.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter(_req, file, cb) {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

/*
  📖 LEARNING NOTE — What is a Router?
  --------------------------------------
  Router() creates a mini Express app that only handles routes
  for a specific feature. We define the routes here, then mount
  the whole router onto a path in app.js like:
    app.use("/api/lost-found", lostFoundRouter);

  This means every route below is RELATIVE to "/api/lost-found".
  So "/" here actually means "/api/lost-found".
*/

const lostFoundRouter = Router();

/*
  📖 LEARNING NOTE — Middleware chain (.use)
  -------------------------------------------
  .use() runs these middleware functions for EVERY route in this router,
  in order, before the controller function runs:

  1. requireAuth         → checks the JWT token in the Authorization header.
                           If missing or invalid → 401 Unauthorized.
                           If valid → attaches req.user = { userId, role, ... }

  2. requireTenantScope  → reads the society subdomain from the request and
                           sets req.tenantId. Every DB query uses this to
                           ensure data isolation between societies.

  3. requireApprovedMembership → makes sure the resident's membership has been
                           approved by the committee. Pending/rejected members
                           can't use the app features.

  Think of middleware as security checkpoints the request must pass
  before it reaches the actual controller function.
*/
lostFoundRouter.use(requireAuth, requireTenantScope, requireApprovedMembership);

/*
  📖 LEARNING NOTE — HTTP Methods
  ---------------------------------
  GET    → Read data (safe, no side effects)
  POST   → Create new data
  PATCH  → Partial update (change one or two fields)
  DELETE → Remove data

  :id is a URL parameter. When the URL is /api/lost-found/abc123/claim,
  req.params.id will be "abc123" inside the controller.
*/

// GET  /api/lost-found       → fetch all posts for this society
lostFoundRouter.get("/", listItems);

// POST /api/lost-found       → create a new lost/found post
lostFoundRouter.post("/", upload.single("photo"), createItem);

// PATCH /api/lost-found/:id/claim   → mark as "I found this" / "This is mine"
lostFoundRouter.patch("/:id/claim", claimItem);

// PATCH /api/lost-found/:id/resolve → poster marks item as reunited/closed
lostFoundRouter.patch("/:id/resolve", resolveItem);

// DELETE /api/lost-found/:id → poster or admin can remove the post
//   requireRoles() here is NOT used because we handle ownership check inside
//   the controller itself (both poster AND admin can delete — two groups).

lostFoundRouter.delete("/:id", deleteItem);

export { lostFoundRouter };
