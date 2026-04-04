import { Router } from "express";
import multer from "multer";
import { createTicket, listTickets, updateTicketStatus, uploadTicketPhotos } from "../controllers/tickets.controller.js";
import { requireAuth, requireRoles } from "../middlewares/auth.middleware.js";
import { requireTenantScope } from "../middlewares/tenant.middleware.js";
import { requireApprovedMembership } from "../middlewares/membership.middleware.js";

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

const ticketRouter = Router();

ticketRouter.use(requireAuth, requireTenantScope, requireApprovedMembership);
ticketRouter.get("/", listTickets);
ticketRouter.post("/", createTicket);
ticketRouter.post("/upload-photos", upload.array("photos", 3), uploadTicketPhotos);
ticketRouter.patch("/:ticketId/status", requireRoles("committee", "staff", "super_admin"), updateTicketStatus);

export { ticketRouter };
