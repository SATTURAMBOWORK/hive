import mongoose from "mongoose";

/*
  StaffEntry — one record per staff visit (entry + exit).

  Why separate from Visitor model?
    - Staff come daily → visitor log would get flooded
    - No approval status (staff are pre-approved)
    - No purpose / vehicle fields
    - Exit is MANDATORY here (unlike visitor exit which is optional)
    - We want a clean daily attendance view per staff member

  Lifecycle:
    Guard logs entry → exitMarked: false
    Guard logs exit  → exitTime set, exitMarked: true

  "Mandatory exit" enforcement:
    Guard sees a "⚠️ Pending exits" count badge.
    Before end of shift, all inside staff must be marked as exited.
*/

const staffEntrySchema = new mongoose.Schema(
  {
    tenantId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "Tenant",
      required: true,
      index:    true
    },

    // Which staff member entered
    staffId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "Staff",
      required: true
    },

    // Which flat they came to serve (from their assignment)
    residentId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true
    },
    flatNumber: {
      type:     String,
      required: true,
      trim:     true
    },

    // Entry details
    entryTime: { type: Date, default: Date.now },
    loggedBy:  {                                   // guard who logged entry
      type: mongoose.Schema.Types.ObjectId,
      ref:  "User",
      required: true
    },

    // Exit details — mandatory, must be filled before guard shift ends
    exitTime:       { type: Date,    default: null  },
    exitMarked:     { type: Boolean, default: false },
    exitLoggedBy:   {                               // guard who logged exit (may differ from entry guard)
      type:    mongoose.Schema.Types.ObjectId,
      ref:     "User",
      default: null
    }
  },
  { timestamps: true }
);

// Fast lookup: all entries for a tenant on a given date
staffEntrySchema.index({ tenantId: 1, entryTime: -1 });

// Fast lookup: all entries for a specific staff member
staffEntrySchema.index({ staffId: 1, entryTime: -1 });

export const StaffEntry = mongoose.model("StaffEntry", staffEntrySchema);
