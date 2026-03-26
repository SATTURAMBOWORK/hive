import { StatusCodes } from "http-status-codes";
import { verifyToken } from "../utils/jwt.js";
import { AppError } from "../utils/app-error.js";

export function requireAuth(req, _res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("Unauthorized", StatusCodes.UNAUTHORIZED));
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (_error) {
    next(new AppError("Invalid or expired token", StatusCodes.UNAUTHORIZED));
  }
}

export function requireRoles(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError("Unauthorized", StatusCodes.UNAUTHORIZED));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError("Forbidden", StatusCodes.FORBIDDEN));
    }

    next();
  };
}
