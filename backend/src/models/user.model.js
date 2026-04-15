import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true
    },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["resident", "committee",  "security", "super_admin"],
      default: "resident"
    },
    flatNumber: { type: String, default: "" },
    phone: { type: String, default: "" },
    shift: {
      type: String,
      enum: ["morning", "evening", "night", ""],
      default: ""
    },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.index({ tenantId: 1, email: 1 }, { unique: true });

export const User = mongoose.model("User", userSchema);
