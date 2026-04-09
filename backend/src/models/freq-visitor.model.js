import mongoose from "mongoose";

/*
  FrequentVisitor — one document per person per society (identified by tenantId + phone).

  Structure:
    - Top-level fields (name, phone, photo, relationship, description) are shared.
      The first resident to add this person sets them.
    - "links" array — each resident who trusts this person adds their own entry here.
      Each link has its own schedule (allowed days + time window).

  Example:
    Sunita (maid) works in A-401 Mon-Sat 8-10am AND B-202 Tue-Thu 9-11am.
    → One FrequentVisitor document for Sunita.
    → Two entries in "links" — one per resident.
*/

const DAYS         = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const RELATIONSHIPS = ["maid", "cook", "driver", "security", "nanny", "other"];
const TIME_REGEX   = /^([01]\d|2[0-3]):[0-5]\d$/; // "HH:MM" 24-hour

// Each resident's schedule for this visitor (no _id needed — we use residentId to find it)
const linkSchema = new mongoose.Schema(
  {
    residentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  "User",
      required: true
    },
    flatNumber:   { type: String, required: true, trim: true },
    allowedDays:  [{ type: String, enum: DAYS }],    // e.g. ["mon","tue","wed","thu","fri"]
    allowedFrom:  { type: String, default: "00:00" }, // "HH:MM" — start of allowed window
    allowedUntil: { type: String, default: "23:59" }, // "HH:MM" — end of allowed window
    addedAt:      { type: Date, default: Date.now }
  },
  { _id: false } // sub-documents don't need their own _id
);

const freqVisitorSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  "Tenant",
      required: true,
      index: true
    },

    // Shared identity fields
    name:         { type: String, required: true, trim: true },
    phone:        { type: String, required: true, trim: true },
    photoUrl:     { type: String, default: "" },
    relationship: { type: String, enum: RELATIONSHIPS, default: "other" },
    description:  { type: String, default: "", trim: true },

    // One entry per resident who trusts this visitor
    links: [linkSchema]
  },
  { timestamps: true }
);

// One person (phone) per society — unique constraint
freqVisitorSchema.index({ tenantId: 1, phone: 1 }, { unique: true });

export const FrequentVisitor = mongoose.model("FrequentVisitor", freqVisitorSchema);
export { DAYS, RELATIONSHIPS, TIME_REGEX };
