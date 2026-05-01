import { StatusCodes } from "http-status-codes";
import { AppError } from "../utils/app-error.js";
import { incrementCounter } from "../services/redis-features.service.js";

function resolveClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || "unknown";
}

export function createRedisRateLimiter(options) {
  const {
    keyPrefix,
    windowSeconds,
    maxRequests,
    message = "Too many requests, please try again later.",
  } = options;

  return async function redisRateLimiter(req, _res, next) {
    try {
      const ip = resolveClientIp(req);
      const userId = req.user?.userId;
      // Authenticated routes: each user gets their own counter regardless of IP.
      // Unauthenticated routes (e.g. /auth/login): fall back to IP.
      const key = userId
        ? `${keyPrefix}:${userId}:${ip}`
        : `${keyPrefix}:${ip}`;
      const count = await incrementCounter(key, { ttlSeconds: windowSeconds });

      if (typeof count === "number" && count > maxRequests) {
        throw new AppError(message, StatusCodes.TOO_MANY_REQUESTS);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
