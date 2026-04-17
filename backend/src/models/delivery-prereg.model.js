import mongoose from "mongoose";

/*
  DeliveryPreReg — a resident announces an expected parcel in advance.

  Flow:
    1. Resident creates a pre-reg (e.g. "Amazon parcel coming tomorrow").
    2. System stores the expected courier, date, and instructions.
    3. When a delivery agent arrives, the guard checks for a matching pre-reg
       (by tenantId + unitId + expectedDate + courier name).
    4. If matched, the delivery is auto-approved and this record is marked "used".
    5. If not matched by the end of expectedDate, a background job marks it "expired".

  This is different from the Delivery model, which records what actually happened.
  Pre-reg = what the resident expects. Delivery = what the guard logged at the gate.
*/

const deliveryPreRegSchema = new mongoose.Schema(
  {
    // ── Tenant isolation ──────────────────────────────────────
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true
    },

    // ── Who registered this expected delivery ─────────────────
    residentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // Flat / unit the parcel is coming to (stored as string to match Visitor pattern)
    flatNumber: { type: String, required: true, trim: true },

    // ── What is expected ──────────────────────────────────────
    expectedCourier: {
      type: String,
      trim: true,
      default: ""   // e.g. "Amazon", "Swiggy Instamart", "FedEx"
    },

    agentName: {
      type: String,
      trim: true,
      default: ""   // delivery agent name if resident knows it in advance
    },

    agentPhone: {
      type: String,
      trim: true,
      default: ""   // agent's phone from courier app — guard can cross-verify on arrival
    },

    packageType: {
      type: String,
      enum: ["parcel", "food", "grocery", "medicine", "documents", "other"],
      default: "parcel"
    },

    packageCount: {
      type: Number,
      default: 1,
      min: 1
    },

    // ── When it is expected ───────────────────────────────────
    expectedDate: { type: Date, required: true },   // the calendar day
    validFrom:    { type: Date, required: true },   // start of that day (00:00)
    validUntil:   { type: Date, required: true },   // end of that day (23:59)

    // ── Handling instructions from the resident ───────────────
    fulfillmentMode: {
      type: String,
      enum: ["keep_at_gate", "doorstep", "neighbour"],
      default: "keep_at_gate"
    },

    instructions: {
      type: String,
      trim: true,
      default: ""   // free-text note, e.g. "Leave with security if I'm not home"
    },

    // ── Lifecycle ─────────────────────────────────────────────
    // active  → waiting for the parcel to arrive
    // used    → a matching delivery arrived and was auto-approved against this pre-reg
    // expired → expectedDate passed with no matching delivery
    // cancelled → resident cancelled it before it was used
    status: {
      type: String,
      enum: ["active", "used", "expired", "cancelled"],
      default: "active",
      index: true
    },

    usedAt:       { type: Date, default: null },
    cancelledAt:  { type: Date, default: null },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    // Once matched, the actual Delivery log entry is linked here
    deliveryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Delivery",
      default: null
    }
  },
  { timestamps: true }
);

// Fast lookup: all pre-regs for a unit on a given date
deliveryPreRegSchema.index({ tenantId: 1, flatNumber: 1, expectedDate: 1 });

// Fast lookup: all active pre-regs for a resident
deliveryPreRegSchema.index({ tenantId: 1, residentId: 1, status: 1 });

export const DeliveryPreReg = mongoose.model("DeliveryPreReg", deliveryPreRegSchema);
