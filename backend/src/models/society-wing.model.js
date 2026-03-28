import mongoose from "mongoose";

const societyWingSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true
    },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

societyWingSchema.index({ tenantId: 1, code: 1 }, { unique: true });

export const SocietyWing = mongoose.model("SocietyWing", societyWingSchema);
