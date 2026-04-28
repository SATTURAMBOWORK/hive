import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: [ "in_progress", "resolved"], default: "in_progress" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    photos: { type: [String], default: [] },
    resolution: {
      description: { type: String, default: "" },
      photos:      { type: [String], default: [] },
      resolvedBy:  { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      resolvedAt:  { type: Date, default: null }
    }
  },
  { timestamps: true }
);

export const Ticket = mongoose.model("Ticket", ticketSchema);
