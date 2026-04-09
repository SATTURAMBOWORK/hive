import express from "express";
import cors from "cors";
import morgan from "morgan";

import { env } from "./config/env.js";
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

const app = express();

app.use(
  cors({
    origin: env.clientOrigin,
    credentials: true
  })
);
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/announcements", announcementRouter);
app.use("/api/tickets", ticketRouter);
app.use("/api/events", eventRouter);
app.use("/api/amenities", amenityRouter);
app.use("/api/societies", societiesRouter);
app.use("/api/membership", membershipRouter);
app.use("/api/admin", adminRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/users", userRouter);
app.use("/api/visitors", visitorRouter);
app.use("/api/visitor-prereg", preRegRouter);
app.use("/api/freq-visitors", freqVisitorRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export { app };
