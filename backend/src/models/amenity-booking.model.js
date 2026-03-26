import mongoose from "mongoose";

const amenityBookingSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    amenityName: { type: String, required: true },
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    status: { type: String, enum: ["pending", "approved", "rejected", "cancelled"], default: "pending" },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

amenityBookingSchema.index(
  { tenantId: 1, amenityName: 1, date: 1, startTime: 1, endTime: 1 },
  { unique: true }
);

export const AmenityBooking = mongoose.model("AmenityBooking", amenityBookingSchema);
