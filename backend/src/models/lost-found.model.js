import mongoose from "mongoose";

/*
  📖 LEARNING NOTE — What is a Mongoose Schema?
  -----------------------------------------------
  A Schema defines the SHAPE of documents stored in MongoDB.
  Think of it like a blueprint: every Lost & Found post must
  follow this exact structure. Mongoose enforces types, defaults,
  and required fields automatically.

  Every field has:
    type      → what kind of data (String, ObjectId, Boolean, Date …)
    required  → if true, MongoDB will reject the document if it's missing
    default   → value used automatically when the field is not provided
    enum      → only these specific values are accepted
    index     → speeds up database searches on that field
    ref       → links to another collection (like a foreign key in SQL)
*/

const lostFoundSchema = new mongoose.Schema(
  {
    // tenantId ties this post to a specific apartment society.
    // Every query filters by tenantId so residents only see their own society's posts.
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,           // ← index makes "find all posts for this society" fast
    },

    // "lost" = someone lost this item, "found" = someone found this item
    type: {
      type: String,
      enum: ["lost", "found"],
      required: true,
    },

    // Category helps residents filter relevant posts quickly
    category: {
      type: String,
      enum: ["keys", "phone", "wallet", "pet", "documents", "bag", "other"],
      default: "other",
    },

    title: {
      type: String,
      required: true,       // short headline e.g. "Lost: Blue Umbrella"
    },

    description: {
      type: String,
      required: true,       // more detail: color, brand, where last seen, etc.
    },

    // WHERE it was lost/found inside the society (text, not GPS)
    location: {
      type: String,
      default: "",          // e.g. "Near Gate B", "Parking Lot 2", "Club House"
    },

    // WHEN it was lost or found (user-supplied date, not createdAt)
    date: {
      type: Date,
      required: true,
    },

    // Optional Cloudinary image URL uploaded by the poster
    photo: {
      type: String,
      default: "",
    },

    // Who posted this item
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // "active"   → still searching / displayed on board
    // "resolved" → item was found/returned, post is closed
    status: {
      type: String,
      enum: ["active", "resolved"],
      default: "active",
    },

    // The user who clicked "I found this" or "This is mine"
    // null means nobody has claimed it yet
    claimedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
  // timestamps: true automatically adds:
  //   createdAt  → when the document was first saved
  //   updatedAt  → last time the document was modified
);

/*
  📖 LEARNING NOTE — mongoose.model()
  ------------------------------------
  This registers the schema as a Model named "LostFound".
  Mongoose will store documents in the "lostfounds" collection in MongoDB
  (Mongoose automatically lowercases and pluralises the model name).

  Usage in the controller:
    import { LostFound } from "../models/lost-found.model.js";
    const posts = await LostFound.find({ tenantId: ... });
*/
export const LostFound = mongoose.model("LostFound", lostFoundSchema);
