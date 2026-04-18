import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    category: {
      type: String,
      enum: ["General", "Maintenance", "Finance", "Emergency", "Event", "Social"],
      default: "General",
      index: true
    },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", index: true }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

announcementSchema.index({ tenantId: 1, createdAt: -1 });

export const Announcement = mongoose.model("Announcement", announcementSchema);
