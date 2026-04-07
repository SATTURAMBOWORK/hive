import mongoose from "mongoose";

const pendingRegistrationSchema = new mongoose.Schema({
  tenantSlug:           { type: String, required: true },
  fullName:             { type: String, required: true },
  email:                { type: String, required: true, lowercase: true },
  passwordHash:         { type: String, required: true },
  desiredRole:          { type: String, required: true },
  flatNumber:           { type: String, default: "" },
  phone:                { type: String, default: "" },
  shift:                { type: String, default: "" },
  tenantName:           { type: String, default: "" },
  tenantCity:           { type: String, default: "Bangalore" },
  otpHash:              { type: String, required: true },
  otpExpiresAt:         { type: Date, required: true },
  otpAttempts:          { type: Number, default: 0 },
  createdAt:            { type: Date, default: Date.now }
});

// Auto-delete documents 15 minutes after createdAt
pendingRegistrationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 900 });

// One pending registration per email+slug at a time
pendingRegistrationSchema.index({ tenantSlug: 1, email: 1 }, { unique: true });

export const PendingRegistration = mongoose.model("PendingRegistration", pendingRegistrationSchema);
