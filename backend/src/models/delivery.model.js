import mongoose from "mongoose";

/*
  Delivery — the actual delivery event logged at the gate.

  This is the source of truth for what physically happened:
  who arrived, what they brought, what decision was made, and when the parcel
  was handed over to the resident.

  Status flow:
    created
      → awaiting_approval   (guard logged it, waiting for resident to decide)
      → approved_auto       (matched a DeliveryPreReg → let in automatically)
      → approved_manual     (resident tapped Approve in the app)
      → rejected            (resident tapped Deny, or guard turned them away)
      → delivered           (parcel handed to resident or left at gate per instructions)
      → returned            (agent took it back — resident not available, rejected, etc.)
      → expired             (no action for too long → auto-closed by background job)

  Decisions made by:
    - pre_reg   : matched a DeliveryPreReg
    - manual    : resident approved/rejected via push notification
    - auto_rule : future — permanent preference rules (not built yet)
*/

const timelineEntrySchema = new mongoose.Schema(
  {
    status:    { type: String, required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    note:      { type: String, default: "" },
    at:        { type: Date, default: Date.now }
  },
  { _id: false }
);

const deliverySchema = new mongoose.Schema(
  {
    // ── Tenant isolation ──────────────────────────────────────
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true
    },

    // ── Target home ───────────────────────────────────────────
    residentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    flatNumber: { type: String, required: true, trim: true },

    // ── Delivery agent details ─────────────────────────────────
    courierName: { type: String, required: true, trim: true },   // e.g. "Amazon"
    agentName:   { type: String, default: "",    trim: true },
    agentPhone:  { type: String, default: "",    trim: true },

    // ── Package details ────────────────────────────────────────
    packageType: {
      type: String,
      enum: ["parcel", "food", "grocery", "medicine", "documents", "other"],
      default: "parcel"
    },

    packageCount: { type: Number, default: 1, min: 1 },
    notes:        { type: String, default: "", trim: true },

    // ── Status ────────────────────────────────────────────────
    status: {
      type: String,
      enum: [
        "created",
        "awaiting_approval",
        "approved_auto",
        "approved_manual",
        "rejected",
        "delivered",
        "returned",
        "expired"
      ],
      default: "created",
      index: true
    },

    // ── How the decision was made ─────────────────────────────
    decisionSource: {
      type: String,
      enum: ["manual", "pre_reg", "auto_rule"],
      default: "manual"
    },

    // If this delivery matched a pre-registration, link it here
    preRegId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryPreReg",
      default: null
    },

    // ── Approval / Rejection details ──────────────────────────
    requestedAt: { type: Date, default: null },  // when resident was notified
    approvedAt:  { type: Date, default: null },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    rejectedAt: { type: Date, default: null },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    rejectionReason: { type: String, default: "", trim: true },

    // ── Gate entry ────────────────────────────────────────────
    gateId:    { type: String, default: "", trim: true },  // e.g. "Gate 1"
    loggedBy: {                                            // the guard who logged this
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    entryTime: { type: Date, default: Date.now },

    // ── Handover ──────────────────────────────────────────────
    fulfillmentMode: {
      type: String,
      enum: ["keep_at_gate", "doorstep", "neighbour"],
      default: "keep_at_gate"
    },

    handoverTime:  { type: Date, default: null },
    receiverName:  { type: String, default: "", trim: true },  // who physically received it
    proofType: {
      type: String,
      enum: ["photo", "signature", "otp", "none"],
      default: "none"
    },
    proofUrl: { type: String, default: "" },  // photo/signature upload URL

    // ── Full audit trail ──────────────────────────────────────
    // Every status change is pushed here so we have a complete history
    timeline: { type: [timelineEntrySchema], default: [] },

    // ── Risk flag ─────────────────────────────────────────────
    riskFlag: { type: Boolean, default: false },
    riskNote: { type: String, default: "" }
  },
  { timestamps: true }
);

// Fast queries: all deliveries for a unit, ordered by most recent
deliverySchema.index({ tenantId: 1, flatNumber: 1, createdAt: -1 });

// Fast queries: security dashboard — all pending deliveries for a tenant
deliverySchema.index({ tenantId: 1, status: 1, createdAt: -1 });

export const Delivery = mongoose.model("Delivery", deliverySchema);
