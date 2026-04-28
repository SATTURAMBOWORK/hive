import mongoose from "mongoose";

const amenityBookingSchema = new mongoose.Schema(
  {
    societyId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    amenityId: { type: mongoose.Schema.Types.ObjectId, ref: "Amenity", required: true, index: true },
    residentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending"
    },
    // Backward compatibility with existing frontend/dashboard code paths.
    amenityName: { type: String, default: "" },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
  },
  { timestamps: true }
);

amenityBookingSchema.index(
  { societyId: 1, amenityId: 1, date: 1, startTime: 1 },
  { unique: true }
);

export const AmenityBooking = mongoose.model("AmenityBooking", amenityBookingSchema);
