import bcrypt from "bcryptjs";
import { StatusCodes } from "http-status-codes";
import { User } from "../models/user.model.js";
import { Tenant } from "../models/tenant.model.js";
import { PendingRegistration } from "../models/pending-registration.model.js";
import { AppError } from "../utils/app-error.js";
import { signToken } from "../utils/jwt.js";
import { ROLES } from "../config/roles.js";
import { env } from "../config/env.js";
import { enqueueOtpEmail } from "../services/email-queue.service.js";
import { acquireLock, releaseLock } from "../services/redis-features.service.js";
import { isRedisEnabled } from "../config/redis.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;
const OTP_REGEX = /^\d{6}$/;
const VERIFICATION_OTP_TTL_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;

function sanitizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(email) {
  return sanitizeText(email).toLowerCase();
}

function sanitizeDigits(value) {
  return sanitizeText(value).replace(/\D/g, "");
}

function buildOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function buildOtpState() {
  const otp = buildOtp();
  const verificationOtpHash = await bcrypt.hash(otp, 10);
  const verificationOtpExpiresAt = new Date(
    Date.now() + VERIFICATION_OTP_TTL_MINUTES * 60 * 1000
  );

  return { otp, verificationOtpHash, verificationOtpExpiresAt };
}

function buildAuthResponse(user) {
  const token = signToken({
    userId: user._id,
    tenantId: user.tenantId,
    role: user.role,
    email: user.email
  });

  return {
    token,
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      isVerified: user.isVerified,
      flatNumber: user.flatNumber,
      phone: user.phone
    }
  };
}

export async function register(req, res, next) {
  try {
    const fullName = sanitizeText(req.body?.fullName);
    const email = normalizeEmail(req.body?.email);
    const password = sanitizeText(req.body?.password);
    const tenantSlug = sanitizeText(req.body?.tenantSlug).toLowerCase();
    const desiredRole = sanitizeText(req.body?.desiredRole).toLowerCase();
    const tenantName = sanitizeText(req.body?.tenantName);
    const tenantCity = sanitizeText(req.body?.tenantCity) || "Bangalore";
    const superAdminSignupKey = sanitizeText(req.body?.superAdminSignupKey);
    const flatNumber = sanitizeText(req.body?.flatNumber);
    const phone = sanitizeDigits(req.body?.phone);
    const shift = sanitizeText(req.body?.shift).toLowerCase();

    if (!fullName || !email || !password || !tenantSlug) {
      throw new AppError("fullName, email, password, tenantSlug are required", StatusCodes.BAD_REQUEST);
    }

    if (!EMAIL_REGEX.test(email)) {
      throw new AppError("Invalid email format", StatusCodes.BAD_REQUEST);
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      throw new AppError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`, StatusCodes.BAD_REQUEST);
    }

    const isSuperAdminSignup = desiredRole === ROLES.SUPER_ADMIN;

    // ── Super admin: validate key + create tenant immediately, then return token ──
    if (isSuperAdminSignup) {
      if (!env.superAdminSignupKey) {
        throw new AppError("SUPER_ADMIN_SIGNUP_KEY is not configured on server", StatusCodes.FORBIDDEN);
      }
      if (superAdminSignupKey !== env.superAdminSignupKey) {
        throw new AppError("Invalid super admin signup key", StatusCodes.FORBIDDEN);
      }

      let tenant = await Tenant.findOne({ slug: tenantSlug });
      if (!tenant) {
        if (!tenantName) {
          throw new AppError("tenantName is required when creating a new society", StatusCodes.BAD_REQUEST);
        }
        tenant = await Tenant.create({ slug: tenantSlug, name: tenantName, city: tenantCity });
      }
      if (!tenant.isActive) throw new AppError("Tenant is inactive", StatusCodes.FORBIDDEN);

      const existingSuperAdmin = await User.findOne({ tenantId: tenant._id, role: ROLES.SUPER_ADMIN });
      if (existingSuperAdmin) {
        throw new AppError("Super admin already exists for this society", StatusCodes.CONFLICT);
      }

      const existing = await User.findOne({ tenantId: tenant._id, email });
      if (existing) throw new AppError("User already exists", StatusCodes.CONFLICT);

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await User.create({
        tenantId: tenant._id, fullName, email, passwordHash,
        role: ROLES.SUPER_ADMIN, isVerified: true,
        verificationOtpHash: "", verificationOtpExpiresAt: null, verificationAttempts: 0
      });

      res.status(StatusCodes.CREATED).json(buildAuthResponse(user));
      return;
    }

    // ── Resident, Staff, Security: validate tenant exists, then store pending registration ──
    const tenant = await Tenant.findOne({ slug: tenantSlug });
    if (!tenant) throw new AppError("Invalid society code", StatusCodes.BAD_REQUEST);
    if (!tenant.isActive) throw new AppError("Tenant is inactive", StatusCodes.FORBIDDEN);

    if (!phone) {
      throw new AppError("phone is required", StatusCodes.BAD_REQUEST);
    }
    if (phone.length < 10 || phone.length > 15) {
      throw new AppError("Phone must be between 10 and 15 digits", StatusCodes.BAD_REQUEST);
    }

    if (desiredRole === "security") {
      if (!["morning", "evening", "night"].includes(shift)) {
        throw new AppError("shift is required for security (morning, evening, or night)", StatusCodes.BAD_REQUEST);
      }
    }

    const existingUser = await User.findOne({ tenantId: tenant._id, email });
    if (existingUser) throw new AppError("An account with this email already exists", StatusCodes.CONFLICT);

    const passwordHash = await bcrypt.hash(password, 10);
    const otpState = await buildOtpState();

    // Upsert so resend also works cleanly
    await PendingRegistration.findOneAndUpdate(
      { tenantSlug, email },
      {
        fullName, passwordHash, desiredRole,
        flatNumber, phone, shift, tenantName, tenantCity,
        otpHash: otpState.verificationOtpHash,
        otpExpiresAt: otpState.verificationOtpExpiresAt,
        otpAttempts: 0,
        createdAt: new Date()
      },
      { upsert: true, new: true }
    );

    await enqueueOtpEmail({ to: email, otp: otpState.otp, purpose: "verification" });

    res.status(StatusCodes.OK).json({
      message: "OTP sent to your email. Verify to complete registration.",
      email,
      tenantSlug
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = sanitizeText(req.body?.password);
    const tenantSlug = sanitizeText(req.body?.tenantSlug).toLowerCase();

    if (!email || !password || !tenantSlug) {
      throw new AppError("email, password, tenantSlug are required", StatusCodes.BAD_REQUEST);
    }

    if (!EMAIL_REGEX.test(email)) {
      throw new AppError("Invalid email format", StatusCodes.BAD_REQUEST);
    }

    const tenant = await Tenant.findOne({ slug: tenantSlug });
    if (!tenant) {
      throw new AppError("Invalid tenantSlug", StatusCodes.BAD_REQUEST);
    }

    if (!tenant.isActive) {
      throw new AppError("Tenant is inactive", StatusCodes.FORBIDDEN);
    }

    const user = await User.findOne({ tenantId: tenant._id, email });
    if (!user || user.tenantId.toString() !== tenant._id.toString()) {
      throw new AppError("Invalid credentials", StatusCodes.UNAUTHORIZED);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError("Invalid credentials", StatusCodes.UNAUTHORIZED);
    }

    if (!user.isVerified) {
      throw new AppError("Account not verified. Please verify your email before login.", StatusCodes.FORBIDDEN);
    }

    res.json(buildAuthResponse(user));
  } catch (error) {
    next(error);
  }
}

export async function verifyRegistration(req, res, next) {
  try {
    const email = normalizeEmail(req.body?.email);
    const tenantSlug = sanitizeText(req.body?.tenantSlug).toLowerCase();
    const otp = sanitizeDigits(req.body?.otp);

    if (!email || !tenantSlug || !otp) {
      throw new AppError("email, tenantSlug and otp are required", StatusCodes.BAD_REQUEST);
    }

    if (!OTP_REGEX.test(otp)) {
      throw new AppError("OTP must be a 6 digit code", StatusCodes.BAD_REQUEST);
    }

    const lockKey = `verify-registration:${tenantSlug}:${email}`;
    const lockHandle = isRedisEnabled()
      ? await acquireLock(lockKey, { ttlMs: 10_000 })
      : null;

    if (isRedisEnabled() && !lockHandle) {
      throw new AppError("Another verification request is already in progress", StatusCodes.CONFLICT);
    }

    try {
      const pending = await PendingRegistration.findOne({ tenantSlug, email });
      if (!pending) {
        throw new AppError("No pending registration found. Please register again.", StatusCodes.NOT_FOUND);
      }

      if (pending.otpAttempts >= MAX_OTP_ATTEMPTS) {
        throw new AppError("Too many invalid attempts. Please register again.", StatusCodes.TOO_MANY_REQUESTS);
      }

      if (new Date(pending.otpExpiresAt).getTime() < Date.now()) {
        throw new AppError("OTP expired. Please register again.", StatusCodes.BAD_REQUEST);
      }

      const isOtpMatch = await bcrypt.compare(otp, pending.otpHash);
      if (!isOtpMatch) {
        pending.otpAttempts += 1;
        await pending.save();
        throw new AppError("Invalid OTP", StatusCodes.BAD_REQUEST);
      }

      // OTP correct — now create the actual user
      const tenant = await Tenant.findOne({ slug: tenantSlug });
      if (!tenant) throw new AppError("Society not found", StatusCodes.BAD_REQUEST);

      const existingUser = await User.findOne({ tenantId: tenant._id, email });
      if (existingUser) throw new AppError("An account with this email already exists", StatusCodes.CONFLICT);

      const user = await User.create({
        tenantId: tenant._id,
        fullName: pending.fullName,
        email: pending.email,
        passwordHash: pending.passwordHash,
        role: pending.desiredRole,
        flatNumber: pending.flatNumber,
        phone: pending.phone,
        shift: pending.shift,
        isVerified: true,
        verificationOtpHash: "",
        verificationOtpExpiresAt: null,
        verificationAttempts: 0
      });

      await PendingRegistration.deleteOne({ _id: pending._id });

      res.status(StatusCodes.CREATED).json(buildAuthResponse(user));
    } finally {
      if (lockHandle) {
        try {
          await releaseLock(lockHandle);
        } catch {
          // Ignore lock release errors to avoid breaking auth responses.
        }
      }
    }

  } catch (error) {
    next(error);
  }
}

export async function resendRegistrationOtp(req, res, next) {
  try {
    const email = normalizeEmail(req.body?.email);
    const tenantSlug = sanitizeText(req.body?.tenantSlug).toLowerCase();

    if (!email || !tenantSlug) {
      throw new AppError("email and tenantSlug are required", StatusCodes.BAD_REQUEST);
    }

    const pending = await PendingRegistration.findOne({ tenantSlug, email });
    if (!pending) {
      throw new AppError("No pending registration found. Please register again.", StatusCodes.NOT_FOUND);
    }

    const otpState = await buildOtpState();
    pending.otpHash = otpState.verificationOtpHash;
    pending.otpExpiresAt = otpState.verificationOtpExpiresAt;
    pending.otpAttempts = 0;
    pending.createdAt = new Date();
    await pending.save();

    await enqueueOtpEmail({ to: email, otp: otpState.otp, purpose: "verification" });

    res.json({ message: "A new OTP has been sent to your email." });
  } catch (error) {
    next(error);
  }
}
