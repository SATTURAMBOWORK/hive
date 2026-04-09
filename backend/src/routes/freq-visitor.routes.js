import { Router } from "express";
import multer from "multer";
import {
  addOrLinkFreqVisitor,
  listMyFreqVisitors,
  updateMyLink,
  removeMyLink,
  searchByPhone,
  logFreqEntry
} from "../controllers/freq-visitor.controller.js";
import { requireAuth, requireRoles } from "../middlewares/auth.middleware.js";
import { requireTenantScope } from "../middlewares/tenant.middleware.js";

// Multer — accepts one image file named "photo", max 5 MB, images only
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  }
});

const freqVisitorRouter = Router();

freqVisitorRouter.use(requireAuth, requireTenantScope);

// ── Resident routes ──────────────────────────────────────────────

// IMPORTANT: /mine and /search must be declared BEFORE /:id routes
// otherwise Express would treat "mine" and "search" as IDs

freqVisitorRouter.get(
  "/mine",
  requireRoles("resident", "committee", "super_admin"),
  listMyFreqVisitors
);

freqVisitorRouter.post(
  "/",
  requireRoles("resident", "committee", "super_admin"),
  upload.single("photo"),   // parses multipart/form-data, puts file in req.file
  addOrLinkFreqVisitor
);

freqVisitorRouter.patch(
  "/:id/my-link",
  requireRoles("resident", "committee", "super_admin"),
  updateMyLink
);

freqVisitorRouter.delete(
  "/:id/my-link",
  requireRoles("resident", "committee", "super_admin"),
  removeMyLink
);

// ── Guard routes ─────────────────────────────────────────────────

freqVisitorRouter.get(
  "/search",
  requireRoles("security", "committee", "super_admin"),
  searchByPhone
);

freqVisitorRouter.post(
  "/:id/log-entry",
  requireRoles("security", "committee", "super_admin"),
  logFreqEntry
);

export { freqVisitorRouter };
