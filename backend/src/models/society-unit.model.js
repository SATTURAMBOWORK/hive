import mongoose from "mongoose";

const societyUnitSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true
    },
    wingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SocietyWing",
      required: true,
      index: true
    },
    unitNumber: { type: String, required: true, trim: true },
    floor: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

societyUnitSchema.index({ tenantId: 1, wingId: 1, unitNumber: 1 }, { unique: true });

export const SocietyUnit = mongoose.model("SocietyUnit", societyUnitSchema);
