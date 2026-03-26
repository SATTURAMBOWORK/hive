import bcrypt from "bcryptjs";
import { StatusCodes } from "http-status-codes";
import { User } from "../models/user.model.js";
import { Tenant } from "../models/tenant.model.js";
import { AppError } from "../utils/app-error.js";
import { signToken } from "../utils/jwt.js";

export async function register(req, res, next) {
  try {
    const { fullName, email, password, tenantSlug } = req.body;

    if (!fullName || !email || !password || !tenantSlug) {
      throw new AppError("fullName, email, password, tenantSlug are required", StatusCodes.BAD_REQUEST);
    }

    const tenant = await Tenant.findOne({ slug: tenantSlug });
    if (!tenant) {
      throw new AppError("Invalid tenantSlug", StatusCodes.BAD_REQUEST);
    }

    const existing = await User.findOne({ tenantId: tenant._id, email: email.toLowerCase() });
    if (existing) {
      throw new AppError("User already exists", StatusCodes.CONFLICT);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      tenantId: tenant._id,
      fullName,
      email: email.toLowerCase(),
      passwordHash,
      role: "resident"
    });

    const token = signToken({
      userId: user._id,
      tenantId: user.tenantId,
      role: user.role,
      email: user.email
    });

    res.status(StatusCodes.CREATED).json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password, tenantSlug } = req.body;

    if (!email || !password || !tenantSlug) {
      throw new AppError("email, password, tenantSlug are required", StatusCodes.BAD_REQUEST);
    }

    const tenant = await Tenant.findOne({ slug: tenantSlug });
    if (!tenant) {
      throw new AppError("Invalid tenantSlug", StatusCodes.BAD_REQUEST);
    }

    const user = await User.findOne({ tenantId: tenant._id, email: email.toLowerCase() });
    if (!user) {
      throw new AppError("Invalid credentials", StatusCodes.UNAUTHORIZED);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError("Invalid credentials", StatusCodes.UNAUTHORIZED);
    }

    const token = signToken({
      userId: user._id,
      tenantId: user.tenantId,
      role: user.role,
      email: user.email
    });

    res.json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId
      }
    });
  } catch (error) {
    next(error);
  }
}
