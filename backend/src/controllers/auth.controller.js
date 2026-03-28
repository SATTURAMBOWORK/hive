import bcrypt from "bcryptjs";
import { StatusCodes } from "http-status-codes";
import { User } from "../models/user.model.js";
import { Tenant } from "../models/tenant.model.js";
import { AppError } from "../utils/app-error.js";
import { signToken } from "../utils/jwt.js";
import { ROLES } from "../config/roles.js";
import { env } from "../config/env.js";

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

    if (!fullName || !email || !password || !tenantSlug) {
      throw new AppError("fullName, email, password, tenantSlug are required", StatusCodes.BAD_REQUEST);
    }

    if (!EMAIL_REGEX.test(email)) {
      throw new AppError("Invalid email format", StatusCodes.BAD_REQUEST);
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      throw new AppError(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
        StatusCodes.BAD_REQUEST
      );
    }

    let tenant = await Tenant.findOne({ slug: tenantSlug });
    const isSuperAdminSignup = desiredRole === ROLES.SUPER_ADMIN;

    if (isSuperAdminSignup) {
      if (!env.superAdminSignupKey) {
        throw new AppError(
          "SUPER_ADMIN_SIGNUP_KEY is not configured on server",
          StatusCodes.FORBIDDEN
        );
      }

      if (superAdminSignupKey !== env.superAdminSignupKey) {
        throw new AppError("Invalid super admin signup key", StatusCodes.FORBIDDEN);
      }

      if (!tenant) {
        if (!tenantName) {
          throw new AppError(
            "tenantName is required when creating a new society",
            StatusCodes.BAD_REQUEST
          );
        }

        tenant = await Tenant.create({ slug: tenantSlug, name: tenantName, city: tenantCity });
      }

      if (!tenant.isActive) {
        throw new AppError("Tenant is inactive", StatusCodes.FORBIDDEN);
      }

      const existingSuperAdmin = await User.findOne({
        tenantId: tenant._id,
        role: ROLES.SUPER_ADMIN
      });

      if (existingSuperAdmin) {
        throw new AppError(
          "Super admin already exists for this society",
          StatusCodes.CONFLICT
        );
      }
    } else {
      if (!tenant) {
        throw new AppError("Invalid tenantSlug", StatusCodes.BAD_REQUEST);
      }

      if (!tenant.isActive) {
        throw new AppError("Tenant is inactive", StatusCodes.FORBIDDEN);
      }

      if (!flatNumber || !phone) {
        throw new AppError("flatNumber and phone are required for resident registration", StatusCodes.BAD_REQUEST);
      }

      if (phone.length < 10 || phone.length > 15) {
        throw new AppError("phone must be between 10 and 15 digits", StatusCodes.BAD_REQUEST);
      }
    }

    const existing = await User.findOne({ tenantId: tenant._id, email });
    if (existing) {
      throw new AppError("User already exists", StatusCodes.CONFLICT);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const isVerified = isSuperAdminSignup;
    const otpState = isSuperAdminSignup ? null : await buildOtpState();

    const user = await User.create({
      tenantId: tenant._id,
      fullName,
      email,
      passwordHash,
      role: isSuperAdminSignup ? ROLES.SUPER_ADMIN : ROLES.RESIDENT,
      flatNumber,
      phone,
      isVerified,
      verificationOtpHash: otpState?.verificationOtpHash || "",
      verificationOtpExpiresAt: otpState?.verificationOtpExpiresAt || null,
      verificationAttempts: 0
    });

    if (isSuperAdminSignup) {
      res.status(StatusCodes.CREATED).json(buildAuthResponse(user));
      return;
    }

    const payload = {
      message: "Registration created. Verify OTP to activate your account.",
      verificationRequired: true,
      email: user.email,
      tenantSlug
    };

    if (process.env.NODE_ENV !== "production") {
      payload.devOtp = otpState.otp;
    }

    res.status(StatusCodes.CREATED).json(payload);
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
    if (!user) {
      throw new AppError("Invalid credentials", StatusCodes.UNAUTHORIZED);
    }

    if (user.tenantId.toString() !== tenant._id.toString()) {
      throw new AppError("Invalid credentials", StatusCodes.UNAUTHORIZED);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError("Invalid credentials", StatusCodes.UNAUTHORIZED);
    }

    if (!user.isVerified) {
      throw new AppError("Account not verified. Please verify OTP before login.", StatusCodes.FORBIDDEN);
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

    if (!EMAIL_REGEX.test(email)) {
      throw new AppError("Invalid email format", StatusCodes.BAD_REQUEST);
    }

    if (!OTP_REGEX.test(otp)) {
      throw new AppError("otp must be a 6 digit code", StatusCodes.BAD_REQUEST);
    }

    const tenant = await Tenant.findOne({ slug: tenantSlug });
    if (!tenant) {
      throw new AppError("Invalid tenantSlug", StatusCodes.BAD_REQUEST);
    }

    const user = await User.findOne({ tenantId: tenant._id, email });
    if (!user) {
      throw new AppError("User not found", StatusCodes.NOT_FOUND);
    }

    if (user.isVerified) {
      res.json({ message: "Account already verified" });
      return;
    }

    if (!user.verificationOtpHash || !user.verificationOtpExpiresAt) {
      throw new AppError("Verification code not found. Please request a new OTP.", StatusCodes.BAD_REQUEST);
    }

    if (user.verificationAttempts >= MAX_OTP_ATTEMPTS) {
      throw new AppError("Too many invalid attempts. Please request a new OTP.", StatusCodes.TOO_MANY_REQUESTS);
    }

    if (new Date(user.verificationOtpExpiresAt).getTime() < Date.now()) {
      throw new AppError("OTP expired. Please request a new OTP.", StatusCodes.BAD_REQUEST);
    }

    const isOtpMatch = await bcrypt.compare(otp, user.verificationOtpHash);
    if (!isOtpMatch) {
      user.verificationAttempts += 1;
      await user.save();
      throw new AppError("Invalid OTP", StatusCodes.BAD_REQUEST);
    }

    user.isVerified = true;
    user.verificationOtpHash = "";
    user.verificationOtpExpiresAt = null;
    user.verificationAttempts = 0;
    await user.save();

    res.json({ message: "Account verified successfully. Please login." });
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

    if (!EMAIL_REGEX.test(email)) {
      throw new AppError("Invalid email format", StatusCodes.BAD_REQUEST);
    }

    const tenant = await Tenant.findOne({ slug: tenantSlug });
    if (!tenant) {
      throw new AppError("Invalid tenantSlug", StatusCodes.BAD_REQUEST);
    }

    const user = await User.findOne({ tenantId: tenant._id, email });
    if (!user) {
      throw new AppError("User not found", StatusCodes.NOT_FOUND);
    }

    if (user.isVerified) {
      res.json({ message: "Account already verified" });
      return;
    }

    const otpState = await buildOtpState();
    user.verificationOtpHash = otpState.verificationOtpHash;
    user.verificationOtpExpiresAt = otpState.verificationOtpExpiresAt;
    user.verificationAttempts = 0;
    await user.save();

    const payload = {
      message: "A new OTP has been issued",
      verificationRequired: true
    };

    if (process.env.NODE_ENV !== "production") {
      payload.devOtp = otpState.otp;
    }

    res.json(payload);
  } catch (error) {
    next(error);
  }
}
