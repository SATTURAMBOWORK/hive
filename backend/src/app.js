import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";

import { env } from "./config/env.js";
import { responseTimeMiddleware } from "./middlewares/response-time.middleware.js";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.js";
import { healthRouter } from "./routes/health.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { announcementRouter } from "./routes/announcements.routes.js";
import { ticketRouter } from "./routes/tickets.routes.js";
import { eventRouter } from "./routes/events.routes.js";
import { amenityRouter } from "./routes/amenities.routes.js";
import { societiesRouter } from "./routes/societies.routes.js";
import { membershipRouter } from "./routes/membership.routes.js";
import { adminRouter } from "./routes/admin.routes.js";
import { notificationRouter } from "./routes/notification.routes.js";
import { userRouter } from "./routes/user.routes.js";
import { visitorRouter } from "./routes/visitor.routes.js";
import { preRegRouter } from "./routes/visitor-prereg.routes.js";
import { freqVisitorRouter } from "./routes/freq-visitor.routes.js";
import { groupPassRouter } from "./routes/group-pass.routes.js";
import { staffRouter } from "./routes/staff.routes.js";
import { pollRouter } from "./routes/poll.routes.js";
import { deliveryRouter } from "./routes/delivery.routes.js";
import { deliveryPreRegRouter } from "./routes/delivery-prereg.routes.js";
import { lostFoundRouter } from "./routes/lost-found.routes.js";
import { sosRouter } from "./routes/sos.routes.js";

const app = express();

// ── Trust reverse proxy ────────────────────────────────────────
// Required in production so req.ip returns the real client IP
// instead of the load balancer's IP. Without this, all users
// share one rate-limit bucket (the proxy's IP).
app.set("trust proxy", 1);

// ── Security headers (XSS protection, clickjacking, etc.) ──────
app.use(helmet());

// ── Gzip compress all responses ────────────────────────────────
// Skips responses already small enough (< 1kb threshold by default)
app.use(compression());

// ── CORS ───────────────────────────────────────────────────────
// In development, allow any origin so local devices (phones, tablets)
// on the same network can reach the API without adding each IP manually.
const allowedOrigins = [
	env.clientOrigin,
	"http://localhost:5175",
].filter(Boolean);
const corsOrigin = env.nodeEnv === "development"
  ? true
  : allowedOrigins;
app.use(cors({ origin: corsOrigin, credentials: true }));

// ── Body parser — cap at 50kb to prevent large payload attacks ─
app.use(express.json({ limit: "50kb" }));

// ── Request timing headers for latency checks ─────────────────
app.use(responseTimeMiddleware);

// ── HTTP request logging ───────────────────────────────────────
// "dev" format is noisy — only use it in development.
// In production, logs are handled by PM2 / the hosting platform.
if (env.nodeEnv !== "production") {
  app.use(morgan("dev"));
}

// ── Global rate limit ─────────────────────────────────────────
// Safety net: 200 requests per 15 minutes per IP across all API routes.
// Tighter per-route limits are applied on sensitive endpoints (auth, OTP, SOS).
app.use("/api", rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
}));

// ── Routes ─────────────────────────────────────────────────────
app.use("/api/health",        healthRouter);
app.use("/api/auth",          authRouter);
app.use("/api/announcements", announcementRouter);
app.use("/api/tickets",       ticketRouter);
app.use("/api/events",        eventRouter);
app.use("/api/amenities",     amenityRouter);
app.use("/api/societies",     societiesRouter);
app.use("/api/membership",    membershipRouter);
app.use("/api/admin",         adminRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/users",         userRouter);
app.use("/api/visitors",      visitorRouter);
app.use("/api/visitor-prereg",preRegRouter);
app.use("/api/freq-visitors", freqVisitorRouter);
app.use("/api/group-passes",  groupPassRouter);
app.use("/api/staff",         staffRouter);
app.use("/api/polls",         pollRouter);
app.use("/api/delivery",      deliveryRouter);
app.use("/api/delivery-prereg", deliveryPreRegRouter);
app.use("/api/lost-found",     lostFoundRouter);
app.use("/api/sos",            sosRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export { app };
