import mongoose from "mongoose";

/*
  GroupPass — one shared OTP for a group of expected visitors.

  Flow:
    1. Resident creates a group pass (event name, date, max guest count).
    2. System generates one 6-digit OTP.
    3. Resident shares OTP with all guests (WhatsApp group, etc.).
    4. Each guest shows the OTP at the gate.
    5. Guard enters OTP + visitor's name → entry is logged.
    6. usedCount increments each time. When usedCount >= maxUses → status "exhausted".

  entries[] keeps a record of every individual who actually entered using this pass.
*/

// One entry per guest who used this pass
const entrySchema = new mongoose.Schema(
  {
    visitorName:    { type: String, required: true, trim: true },
    entryTime:      { type: Date, default: Date.now },
    loggedBy:       { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // guard
    visitorEntryId: { type: mongoose.Schema.Types.ObjectId, ref: "Visitor" }
  },
  { _id: false }
);

const groupPassSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  "Tenant",
      required: true,
      index: true
    },

    residentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  "User",
      required: true
    },

    eventName:    { type: String, required: true, trim: true }, // "Raj's Birthday Party"
    expectedDate: { type: Date, required: true },
    validFrom:    { type: Date, required: true }, // midnight of expectedDate
    validUntil:   { type: Date, required: true }, // 23:59 of expectedDate

    maxUses:  { type: Number, required: true, min: 1, max: 100 }, // max guests allowed
    usedCount: { type: Number, default: 0 },                       // increments per guest

    otp: { type: String, required: true }, // 6-digit shared code

    status: {
      type: String,
      enum: ["active", "exhausted", "expired", "cancelled"],
      default: "active"
    },

    // Log of every individual who entered using this pass
    entries: [entrySchema]
  },
  { timestamps: true }
);

groupPassSchema.index({ tenantId: 1, residentId: 1 });
groupPassSchema.index({ tenantId: 1, otp: 1 });

export const GroupPass = mongoose.model("GroupPass", groupPassSchema);
