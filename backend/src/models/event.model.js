import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    location: { type: String, default: "Club House" },
    category: {
      type: String,
      enum: ["General", "Cultural", "Workshop"],
      default: "General"
    },
    coverImage: { type: String, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

export const Event = mongoose.model("Event", eventSchema);
