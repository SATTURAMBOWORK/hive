import mongoose from "mongoose";

/*
  VisitorPreReg — stores a resident's pre-registered visitor.

  Flow:
    1. Resident creates a pre-reg → system assigns a 6-digit OTP.
    2. Resident shares OTP with their expected visitor.
    3. When visitor arrives, guard enters the OTP.
    4. System finds this record, validates it, and creates a Visitor entry.
    5. This record is marked "used".
*/

const preRegSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true
    },

    // The resident who pre-registered this visitor
    residentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // Visitor details (filled by resident in advance)
    visitorName:  { type: String, required: true, trim: true },
    visitorPhone: { type: String, default: "", trim: true },
    purpose: {
      type: String,
      enum: ["delivery", "guest", "contractor", "other"],
      default: "guest"
    },

    // The date the visitor is expected — guard can use the pass on this date only
    expectedDate: { type: Date, required: true },
    validFrom:    { type: Date, required: true }, // start of expectedDate
    validUntil:   { type: Date, required: true }, // end of expectedDate

    // 6-digit entry code — stored as plain text (short-lived, low sensitivity)
    otp: { type: String, required: true },

    // Lifecycle: active → used (or) active → cancelled (or) active → expired
    status: {
      type: String,
      enum: ["active", "used", "expired", "cancelled"],
      default: "active"
    },

    usedAt:        { type: Date, default: null },

    // Once the OTP is verified, the actual Visitor log entry is linked here
    visitorEntryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Visitor",
      default: null
    }
  },
  { timestamps: true }
);

// Fast lookup: resident's passes for a tenant
preRegSchema.index({ tenantId: 1, residentId: 1 });

// Fast OTP verification lookup
preRegSchema.index({ tenantId: 1, otp: 1 });

export const VisitorPreReg = mongoose.model("VisitorPreReg", preRegSchema);
