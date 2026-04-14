import http from "node:http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { Redis } from "ioredis";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { registerSocketHandlers } from "./sockets/index.js";
import { logger } from "./config/logger.js";

async function bootstrap() {
  await connectDB();

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: env.clientOrigin,
      credentials: true,
    },
  });

  // ── Redis adapter for Socket.IO ──────────────────────────────
  // Only activated when REDIS_URL is set in the environment.
  // In local development (no Redis), Socket.IO uses its default
  // in-memory adapter — single process, works fine for dev.
  //
  // In production with PM2 cluster mode (multiple processes),
  // REDIS_URL must be set so all processes share the same
  // pub/sub channel and events reach every connected client.
  if (env.redisUrl) {
    const pubClient = new Redis(env.redisUrl);
    const subClient = pubClient.duplicate();
    io.adapter(createAdapter(pubClient, subClient));
    logger.info("Socket.IO Redis adapter connected");
  } else {
    logger.info("Socket.IO using in-memory adapter (no REDIS_URL set)");
  }

  registerSocketHandlers(io);
  app.set("io", io);

  server.listen(env.port, () => {
    logger.info(`Backend running on http://localhost:${env.port}`, {
      port: env.port,
      nodeEnv: process.env.NODE_ENV || "development",
    });
  });
}

bootstrap().catch((error) => {
  logger.error("Failed to start server", { error: error.message });
  process.exit(1);
});
