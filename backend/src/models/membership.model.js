import mongoose from "mongoose";

const membershipSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    unitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SocietyUnit",
      required: true,
      index: true
    },
    wingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SocietyWing",
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true
    },
    residentRole: {
      type: String,
      enum: ["owner", "tenant"],
      required: true
    },
    verificationDocUrl: { type: String, required: true, trim: true },
    rejectedReason: { type: String, default: "" },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    approvedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

membershipSchema.index({ tenantId: 1, userId: 1, status: 1 });
membershipSchema.index({ tenantId: 1, unitId: 1, status: 1 });

export const Membership = mongoose.model("Membership", membershipSchema);
