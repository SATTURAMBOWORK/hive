import { Router } from "express";
import { createAmenityBooking, listAmenityBookings } from "../controllers/amenities.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireTenantScope } from "../middlewares/tenant.middleware.js";

const amenityRouter = Router();

amenityRouter.use(requireAuth, requireTenantScope);
amenityRouter.get("/bookings", listAmenityBookings);
amenityRouter.post("/bookings", createAmenityBooking);

export { amenityRouter };
