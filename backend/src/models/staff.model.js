import mongoose from "mongoose";

/*
  Staff — society-level staff members (maids, cooks, drivers, etc.)

  Key difference from FrequentVisitor:
    - Staff are formally onboarded at society level
    - Each flat they serve has its own schedule
    - Can be put on leave (temporary) or blocked (permanent) per flat
    - Exit is logged (they come daily, so exit matters)

  Structure:
    - Top-level: identity (name, phone, photo, category)
    - assignments[]: one entry per flat they serve
      Each assignment has its own schedule + leave/block state
*/


// ── Step 1: Define allowed categories ───────────────────────────
// HINT: Export this so the controller can validate against it.
// Values should be: "maid", "cook", "driver", "security", "nanny", "gardener", "other"
export const STAFF_CATEGORIES = ["maid", "cook", "driver", "security", "nanny", "gardener", "other"];


// ── Step 2: Define allowed days ──────────────────────────────────
// HINT: Same pattern as freq-visitor.model.js
// Short lowercase day names: "sun", "mon", "tue", "wed", "thu", "fri", "sat"
export const STAFF_DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];


// ── Step 3: Assignment sub-schema ────────────────────────────────
// HINT: One entry per flat this staff member serves.
// Think about what each flat needs to know about this staff member:
//   - Which resident? (residentId → ref "User")
//   - Which flat? (flatNumber string)
//   - What days are they allowed? (array of STAFF_DAYS values)
//   - What time window? (allowedFrom, allowedUntil → "HH:MM" strings)
//   - Are they on leave today? (onLeave boolean, default false)
//   - Are they blocked by this resident? (blocked boolean, default false)
//   - When was this assignment created? (assignedAt Date)
//
// HINT: Use _id: false — same reason as freq-visitor.model.js
//       (we identify assignments by residentId, not a separate _id)
const assignmentSchema = new mongoose.Schema(
  {
    residentId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    flatNumber:   { type: String, required: true, trim: true },
    allowedDays:  [{ type: String, enum: STAFF_DAYS }],
    allowedFrom:  { type: String, default: "00:00" }, // "HH:MM"
    allowedUntil: { type: String, default: "23:59" }, // "HH:MM"
    onLeave:      { type: Boolean, default: false },   // temporary — staff absent today
    blocked:      { type: Boolean, default: false },   // permanent — resident blocked this staff
    assignedAt:   { type: Date, default: Date.now }
  },
  { _id: false }
);


// ── Step 4: Main staff schema ────────────────────────────────────
// HINT: Think about:
//   - tenantId: which society (ObjectId, ref "Tenant", required, indexed)
//   - name: string, required
//   - phone: string, required (this is the unique identifier per tenant)
//   - photoUrl: string, default ""
//   - category: one of STAFF_CATEGORIES
//   - assignments: array of assignmentSchema
//
// HINT: No "status" field at the top level — status is per-assignment
//       (a maid can be blocked by flat A but still active for flat B)
const staffSchema = new mongoose.Schema(
  {
    tenantId:{
      type:mongoose.Schema.Types.ObjectId,
      required:true,
      ref:"Tenant",
      index:true
    },
    name:{
      type:String,
      required:true
    },
    phone:{
      type:String,
      required:true
    },
    photoUrl:{
      type:String,
      default:''
    },
    // FIXED: category uses enum, not an array — a staff member has ONE category
    category: {
      type: String,
      enum: STAFF_CATEGORIES,
      default: "other"
    },
    assignments: [assignmentSchema]
  },
  { timestamps: true } // adds createdAt and updatedAt automatically
);


// ── Step 5: Add indexes ──────────────────────────────────────────
// HINT 1: You need a UNIQUE index on { tenantId, phone }
//         — same person (phone) should only exist once per society
//         — look at how freq-visitor.model.js does this
//
// HINT 2: A regular index on tenantId alone for fast tenant-wide queries
//         — already covered if you added index:true on tenantId above,
//           but an explicit compound index is fine too

staffSchema.index({ tenantId: 1, phone: 1 }, { unique: true });


// ── Step 6: Export the model ─────────────────────────────────────
// HINT: mongoose.model("Staff", staffSchema)
//       The first argument is the model name — MongoDB will create
//       a collection called "staffs" (Mongoose pluralises it)

export const Staff = mongoose.model("Staff", staffSchema);
