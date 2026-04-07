import mongoose from "mongoose";

const visitorSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true
    },
    visitorName:  { type: String, required: true, trim: true },
    visitorPhone: { type: String, default: "", trim: true },
    flatNumber:   { type: String, required: true, trim: true },
    residentName: { type: String, default: "", trim: true },
    purpose: {
      type: String,
      enum: ["delivery", "guest", "contractor", "other"],
      default: "guest"
    },
    vehicleNumber: { type: String, default: "", trim: true },
    entryTime:     { type: Date, default: Date.now },
    exitTime:      { type: Date, default: null },
    status: {
      type: String,
      enum: ["inside", "exited"],
      default: "inside"
    },
    loggedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

// Index for efficiently fetching today's visitors for a tenant
visitorSchema.index({ tenantId: 1, entryTime: -1 });

export const Visitor = mongoose.model("Visitor", visitorSchema);
