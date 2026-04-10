import { Router } from "express";
import multer from "multer";
import {
  onboardStaff,
  listMyStaff,
  listAllStaff,
  updateMyAssignment,
  removeMyAssignment,
  searchStaff,
  getByStaffCode,
  expectedToday,
  logStaffEntry,
  markStaffExit,
  toggleLeave,
  toggleBlock,
  pendingExits,
} from "../controllers/staff.controller.js";
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

const staffRouter = Router();

// Apply auth + tenant scope to ALL staff routes
staffRouter.use(requireAuth, requireTenantScope);

// ── IMPORTANT: Specific paths MUST come before /:id routes ───────
// Express matches routes in order — if /:id comes first, "mine",
// "search", "society", "expected-today" would all be treated as IDs.

// ── Resident routes ──────────────────────────────────────────────

// Resident adds or re-links a staff member to their flat
staffRouter.post(
  "/",
  requireRoles("resident", "committee", "super_admin"),
  upload.single("photo"),   // parses multipart/form-data → req.file
  onboardStaff
);

// Resident views their own assigned staff
staffRouter.get(
  "/mine",
  requireRoles("resident", "committee", "super_admin"),
  listMyStaff
);

// Resident updates the schedule for one of their staff
staffRouter.patch(
  "/:id/my-assignment",
  requireRoles("resident", "committee", "super_admin"),
  updateMyAssignment
);

// Resident removes a staff member from their flat
staffRouter.delete(
  "/:id/my-assignment",
  requireRoles("resident", "committee", "super_admin"),
  removeMyAssignment
);

// Resident permanently blocks/unblocks a staff member from their flat
staffRouter.patch(
  "/:id/toggle-block",
  requireRoles("resident", "committee", "super_admin"),
  toggleBlock
);

// ── Committee routes ─────────────────────────────────────────────

// Committee views all staff in the society
staffRouter.get(
  "/society",
  requireRoles("committee", "super_admin"),
  listAllStaff
);

// ── Guard routes ─────────────────────────────────────────────────

// Guard searches by name or phone
staffRouter.get(
  "/search",
  requireRoles("security", "committee", "super_admin"),
  searchStaff
);

// Guard scans QR → frontend decodes staffCode → calls this
staffRouter.get(
  "/by-code/:staffCode",
  requireRoles("security", "committee", "super_admin"),
  getByStaffCode
);

// Guard's dashboard: who is expected today
staffRouter.get(
  "/expected-today",
  requireRoles("security", "committee", "super_admin"),
  expectedToday
);

// Guard marks exit — MUST be before /:id routes to avoid collision
// Note: /entries/:entryId/exit — "entries" is literal, not an :id
staffRouter.get(
  "/entries/pending-exits",
  requireRoles("security", "committee", "super_admin"),
  pendingExits
);

staffRouter.patch(
  "/entries/:entryId/exit",
  requireRoles("security", "committee", "super_admin"),
  markStaffExit
);

// Guard logs a staff entry for a specific flat
staffRouter.post(
  "/:id/log-entry",
  requireRoles("security", "committee", "super_admin"),
  logStaffEntry
);

// Guard toggles leave for a staff member (e.g. staff called in sick)
staffRouter.patch(
  "/:id/toggle-leave",
  requireRoles("security", "committee", "super_admin"),
  toggleLeave
);

export { staffRouter };
