import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "./logger.js";

export async function connectDB() {
  await mongoose.connect(env.mongoUri, {
    // How many simultaneous DB connections Mongoose keeps open.
    // Default is 10 — raise to 20 so 100 concurrent users don't
    // queue up waiting for a free slot.
    maxPoolSize: 30,

    // If MongoDB takes longer than 5s to respond to a new connection
    // attempt, fail fast instead of hanging silently.
    serverSelectionTimeoutMS: 5000,

    // If a query is waiting for a socket but gets no bytes for 45s,
    // treat it as a timeout instead of blocking a pool slot forever.
    socketTimeoutMS: 45000,
  });
  logger.info("MongoDB connected");
}
