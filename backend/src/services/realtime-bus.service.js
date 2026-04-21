import { isRedisEnabled } from "../config/redis.js";
import { logger } from "../config/logger.js";
import { publishEvent, subscribeToChannel } from "./redis-features.service.js";

const REALTIME_CHANNEL = "socket:emit";

export async function emitRealtime(io, { room, event, payload }) {
  if (!room || !event) return;

  if (isRedisEnabled()) {
    try {
      await publishEvent(REALTIME_CHANNEL, { room, event, payload });
      return;
    } catch (error) {
      logger.warn(`Realtime publish failed, falling back to direct emit: ${error.message}`);
    }
  }

  io.to(room).emit(event, payload);
}

export async function startRealtimeSubscriber(io) {
  if (!isRedisEnabled()) return () => {};

  logger.info("Realtime Redis subscriber started");

  return subscribeToChannel(REALTIME_CHANNEL, (message) => {
    const data = message?.payload ?? message;
    if (!data?.room || !data?.event) return;

    io.to(data.room).emit(data.event, data.payload);
  });
}
