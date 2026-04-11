import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

/*
  optionSchema — one choice inside a poll.
  _id: true (default) so we can reference each option by ID when someone votes.
  votes: starts at 0, incremented atomically with $inc — never manually set.
*/
const optionSchema = new mongoose.Schema({
  text:  { type: String, required: true, trim: true },
  votes: { type: Number, default: 0, min: 0 },
});

const pollSchema = new mongoose.Schema(
  {
    tenantId:  { type: ObjectId, ref: "Tenant", required: true, index: true },
    createdBy: { type: ObjectId, ref: "User",   required: true },

    title:       { type: String, required: true, trim: true },
    description: { type: String, default: "",   trim: true },

    options: {
      type: [optionSchema],
      validate: {
        validator: (arr) => arr.length >= 2 && arr.length <= 10,
        message: "A poll must have between 2 and 10 options",
      },
    },

    /*
      allowMultiple — if true, resident can select more than one option.
      Default false (standard single-choice poll).
    */
    allowMultiple: { type: Boolean, default: false },

    status: {
      type:    String,
      enum:    ["active", "closed"],
      default: "active",
    },

    /*
      endsAt — optional deadline.
      If set, the poll automatically reads as "closed" once this time passes.
      We enforce this in the controller, not via a cron job, to keep it simple.
    */
    endsAt: { type: Date, default: null },

    totalVotes: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

pollSchema.index({ tenantId: 1, createdAt: -1 });

export const Poll = mongoose.model("Poll", pollSchema);


/*
  Vote — separate collection tracking who voted on what.

  Why separate?
  ─ Poll document stays lean (no giant voters array).
  ─ Unique index on (pollId + userId) blocks double voting at DB level.
  ─ Can query "has this user voted on this poll?" in one fast indexed lookup.

  optionIds — array because allowMultiple polls let you pick several options.
  For single-choice polls, optionIds will always have exactly one element.
*/
const voteSchema = new mongoose.Schema(
  {
    tenantId:  { type: ObjectId, ref: "Tenant", required: true },
    pollId:    { type: ObjectId, ref: "Poll",   required: true },
    userId:    { type: ObjectId, ref: "User",   required: true },
    optionIds: [{ type: ObjectId }],
  },
  { timestamps: true }
);

// The crucial index — prevents any user from voting twice on the same poll
voteSchema.index({ pollId: 1, userId: 1 }, { unique: true });

export const Vote = mongoose.model("Vote", voteSchema);
