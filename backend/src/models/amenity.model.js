import mongoose from "mongoose";

const dayHoursSchema = new mongoose.Schema(
  {
    open: { type: String, default: "06:00" },
    close: { type: String, default: "22:00" }
  },
  { _id: false }
);

const operatingHoursSchema = new mongoose.Schema(
  {
    monday: { type: dayHoursSchema, default: () => ({}) },
    tuesday: { type: dayHoursSchema, default: () => ({}) },
    wednesday: { type: dayHoursSchema, default: () => ({}) },
    thursday: { type: dayHoursSchema, default: () => ({}) },
    friday: { type: dayHoursSchema, default: () => ({}) },
    saturday: { type: dayHoursSchema, default: () => ({}) },
    sunday: { type: dayHoursSchema, default: () => ({}) }
  },
  { _id: false }
);

const amenitySchema = new mongoose.Schema(
  {
    societyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    photos: { type: [String], default: [] },
    isAutoApprove: { type: Boolean, default: false },
    capacity: { type: Number, default: 1, min: 1 },
    operatingHours: {
      type: operatingHoursSchema,
      default: () => ({})
    }
  },
  { timestamps: true }
);

amenitySchema.index({ societyId: 1, name: 1 }, { unique: true });

export const Amenity = mongoose.model("Amenity", amenitySchema);
