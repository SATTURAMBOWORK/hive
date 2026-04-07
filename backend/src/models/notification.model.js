import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: "User",   required: true, index: true },
    type: {
      type: String,
      enum: [
        "membership_approved",
        "membership_rejected",
        "announcement_created",
        "ticket_status_updated",
        "event_created",
        "amenity_booking_status_updated",
        "visitor_request_incoming"
      ],
      required: true
    },
    title:   { type: String, required: true },
    message: { type: String, required: true },
    isRead:  { type: Boolean, default: false },
    data:    { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

notificationSchema.index({ tenantId: 1, userId: 1, createdAt: -1 });

export const Notification = mongoose.model("Notification", notificationSchema);
