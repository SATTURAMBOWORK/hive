import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, default: "general" },
    status: { type: String, enum: ["open", "in_progress", "resolved", "closed"], default: "open" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
  },
  { timestamps: true }
);

export const Ticket = mongoose.model("Ticket", ticketSchema);
