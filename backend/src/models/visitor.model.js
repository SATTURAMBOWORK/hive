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

    // Who the request was sent to (looked up from flat number via membership)
    residentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    // Resident's decision on the request
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", "missed"],
      default: "pending"
    },

    // Physical presence — pending_entry until approved, inside after entry, exited after leaving
    status: {
      type: String,
      enum: ["pending_entry", "inside", "exited"],
      default: "pending_entry"
    },

    loggedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

visitorSchema.index({ tenantId: 1, entryTime: -1 });

export const Visitor = mongoose.model("Visitor", visitorSchema);
