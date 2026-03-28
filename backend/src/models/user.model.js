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
      enum: ["resident", "committee", "staff", "security", "super_admin"],
      default: "resident"
    },
    flatNumber: { type: String, default: "" },
    phone: { type: String, default: "" },
    isVerified: { type: Boolean, default: false },
    verificationOtpHash: { type: String, default: "" },
    verificationOtpExpiresAt: { type: Date, default: null },
    verificationAttempts: { type: Number, default: 0 }
  },
  { timestamps: true }
);

userSchema.index({ tenantId: 1, email: 1 }, { unique: true });

export const User = mongoose.model("User", userSchema);
