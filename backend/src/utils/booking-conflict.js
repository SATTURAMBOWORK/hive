import mongoose from "mongoose";
import { AmenityBooking } from "../models/amenity-booking.model.js";

export async function hasAmenityBookingConflict({
  societyId,
  amenityId,
  date,
  startTime,
  endTime,
  excludeBookingId
}) {
  const filter = {
    societyId,
    amenityId,
    date,
    status: { $in: ["pending", "approved"] },
    startTime: { $lt: endTime },
    endTime: { $gt: startTime }
  };

  if (excludeBookingId && mongoose.Types.ObjectId.isValid(excludeBookingId)) {
    filter._id = { $ne: excludeBookingId };
  }

  const match = await AmenityBooking.findOne(filter).select("_id");
  return Boolean(match);
}
