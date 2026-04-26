import mongoose from "mongoose";

/*
  SosAlert — stores an emergency SOS alert sent by a resident.

  Flow:
    1. Resident presses the SOS button on the frontend.
    2. A new SosAlert document is created with status "sent".
    3. A Socket.IO event is emitted to all security members in the same tenant.
    4. A security guard clicks "Acknowledge" → status becomes "acknowledged".
    5. After the guard resolves the situation, they click "Resolve" → status becomes "resolved".
    6. The resident sees these status changes in real-time via socket.

  Status lifecycle:
    sent  →  acknowledged  →  pending_user_confirmation  →  resolved

  Multi-tenancy:
    Every alert must belong to a tenant (tenantId). This ensures
    Security from Society A cannot see alerts from Society B.
*/

const sosAlertSchema = new mongoose.Schema(
  {
    // ── MULTI-TENANCY ──────────────────────────────────────────────
    // HINT: Copy the tenantId field exactly as it appears in other models.
    // It should reference the "Tenant" model, be required, and be indexed.
    tenantId:{
      type:mongoose.Schema.Types.ObjectId,
      required:true,
      ref:"Tenant",
      index:true

    },

      // ── WHO SENT THE ALERT ─────────────────────────────────────────
    // HINT: Store the residentId. It references the "User" model and is required.
    // This tells security WHICH resident is in trouble.

    residentId:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"User",
      required:true,
      index:true
    },

  


    // ── WHERE THEY ARE ─────────────────────────────────────────────
    // HINT: Store the resident's unit number as a plain String.
    // Name it "unit". It is required and should be trimmed.
    // This is the most important field for security — they need to know WHERE to go.
   
    unit: { type: String, trim: true, default: "" },
    wing: { type: String, trim: true, default: "" },
   


    // ── CURRENT STATUS ─────────────────────────────────────────────
    // HINT: Use an enum field named "status" with three allowed values:
    //   "sent"         — alert just created, nobody has responded yet
    //   "acknowledged" — a security guard has seen it and is on their way
    //   "pending_user_confirmation" — guard/committee requested close, waiting for creator confirm
    //   "resolved"     — situation has been handled and confirmed
    // Default value should be "sent".

    status: {
      type: String,
      enum: ["sent", "acknowledged", "pending_user_confirmation", "resolved"],
      default: "sent",
      index: true
    },

    // Who responded — empty at first, filled when a guard acknowledges
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Optional short message from the resident ("Medical emergency", etc.)
    message: {
      type: String,
      trim: true,
      default: "",
    },

    // Exact moment each status change happened
    acknowledgedAt: { type: Date },
    resolutionRequestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    resolutionRequestedAt: { type: Date },
    resolutionConfirmedByResidentAt: { type: Date },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    resolvedAt:     { type: Date },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

// Compound index — speeds up "all sent alerts for this society" query
sosAlertSchema.index({ tenantId: 1, status: 1 });

export const SosAlert = mongoose.model("SosAlert", sosAlertSchema);

