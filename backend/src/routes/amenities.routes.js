import { Router } from "express";
import {
	createAmenity,
	createAmenityBooking,
	listAmenities,
	listAmenityBookings,
	updateAmenityBookingStatus
} from "../controllers/amenities.controller.js";
import { requireAuth, requireRoles } from "../middlewares/auth.middleware.js";
import { requireTenantScope } from "../middlewares/tenant.middleware.js";

const amenityRouter = Router();

amenityRouter.use(requireAuth, requireTenantScope);
amenityRouter.get("/", listAmenities);
amenityRouter.post("/", requireRoles("committee", "super_admin"), createAmenity);
amenityRouter.get("/bookings", listAmenityBookings);
amenityRouter.post("/bookings", createAmenityBooking);
amenityRouter.patch(
	"/bookings/:bookingId/status",
	requireRoles("committee", "super_admin"),
	updateAmenityBookingStatus
);

export { amenityRouter };
