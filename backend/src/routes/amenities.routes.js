import { Router } from "express";
import multer from "multer";
import {
	createAmenity,
	createAmenityBooking,
	listAmenities,
	listAmenityBookings,
	updateAmenityBookingStatus,
	uploadAmenityPhotos
} from "../controllers/amenities.controller.js";
import { requireAuth, requireRoles } from "../middlewares/auth.middleware.js";
import { requireTenantScope } from "../middlewares/tenant.middleware.js";

const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB per file
	fileFilter(_req, file, cb) {
		if (!file.mimetype.startsWith("image/")) {
			return cb(new Error("Only image files are allowed"));
		}
		cb(null, true);
	}
});

const amenityRouter = Router();

amenityRouter.use(requireAuth, requireTenantScope);
amenityRouter.get("/", listAmenities);
amenityRouter.post("/", requireRoles("committee", "super_admin"), createAmenity);
amenityRouter.post(
	"/upload-photos",
	requireRoles("committee", "super_admin"),
	upload.array("photos", 5),
	uploadAmenityPhotos
);
amenityRouter.get("/bookings", listAmenityBookings);
amenityRouter.post("/bookings", createAmenityBooking);
amenityRouter.patch(
	"/bookings/:bookingId/status",
	requireRoles("committee", "super_admin"),
	updateAmenityBookingStatus
);

export { amenityRouter };
