import bcrypt from "bcryptjs";
import { StatusCodes } from "http-status-codes";
import { User } from "../models/user.model.js";
import { Tenant } from "../models/tenant.model.js";
import { AppError } from "../utils/app-error.js";
import { signToken } from "../utils/jwt.js";
import { ROLES } from "../config/roles.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

function sanitizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(email) {
  return sanitizeText(email).toLowerCase();
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
      tenantId: user.tenantId
    }
  };
}

export async function register(req, res, next) {
  try {
    const fullName = sanitizeText(req.body?.fullName);
    const email = normalizeEmail(req.body?.email);
    const password = sanitizeText(req.body?.password);
    const tenantSlug = sanitizeText(req.body?.tenantSlug).toLowerCase();

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

    const tenant = await Tenant.findOne({ slug: tenantSlug });
    if (!tenant) {
      throw new AppError("Invalid tenantSlug", StatusCodes.BAD_REQUEST);
    }

    if (!tenant.isActive) {
      throw new AppError("Tenant is inactive", StatusCodes.FORBIDDEN);
    }

    const existing = await User.findOne({ tenantId: tenant._id, email });
    if (existing) {
      throw new AppError("User already exists", StatusCodes.CONFLICT);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      tenantId: tenant._id,
      fullName,
      email,
      passwordHash,
      role: ROLES.RESIDENT
    });

    res.status(StatusCodes.CREATED).json(buildAuthResponse(user));
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

    res.json(buildAuthResponse(user));
  } catch (error) {
    next(error);
  }
}
