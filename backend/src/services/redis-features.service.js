import { randomUUID } from "node:crypto";
import {
  getRedisClient,
  getRedisPublisher,
  getRedisSubscriber,
  isRedisEnabled,
} from "../config/redis.js";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

const LOCK_RELEASE_SCRIPT = `
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("DEL", KEYS[1])
else
  return 0
end
`;

const channelHandlers = new Map();
let isSubscriberBound = false;

function prefixed(type, key) {
  return `${env.redisKeyPrefix}:${type}:${key}`;
}

function ensureSubscriberBinding() {
  if (isSubscriberBound || !isRedisEnabled()) return;

  const subscriber = getRedisSubscriber();
  subscriber.on("message", (channel, payload) => {
    const handlers = channelHandlers.get(channel) || [];

    let parsed = payload;
    try {
      parsed = JSON.parse(payload);
    } catch {
      // Keep raw payload for non-JSON messages.
    }

    for (const handler of handlers) {
      try {
        handler(parsed);
      } catch (error) {
        logger.warn(`Redis subscriber handler error on ${channel}: ${error.message}`);
      }
    }
  });

  isSubscriberBound = true;
}

export async function publishEvent(channel, payload) {
  if (!isRedisEnabled()) return false;

  const publisher = getRedisPublisher();
  const message = JSON.stringify({ payload, at: new Date().toISOString() });
  await publisher.publish(prefixed("pubsub", channel), message);
  return true;
}

export async function subscribeToChannel(channel, handler) {
  if (!isRedisEnabled()) {
    return () => {};
  }

  ensureSubscriberBinding();

  const subscriber = getRedisSubscriber();
  const topic = prefixed("pubsub", channel);
  const handlers = channelHandlers.get(topic) || [];
  handlers.push(handler);
  channelHandlers.set(topic, handlers);

  if (handlers.length === 1) {
    await subscriber.subscribe(topic);
  }

  return async () => {
    const current = channelHandlers.get(topic) || [];
    const next = current.filter((item) => item !== handler);

    if (next.length === 0) {
      channelHandlers.delete(topic);
      await subscriber.unsubscribe(topic);
      return;
    }

    channelHandlers.set(topic, next);
  };
}

export async function incrementCounter(counterKey, options = {}) {
  if (!isRedisEnabled()) return null;

  const { by = 1, ttlSeconds = 60 } = options;
  const client = getRedisClient();
  const key = prefixed("counter", counterKey);

  const nextValue = await client.incrby(key, by);
  const ttl = await client.ttl(key);
  if (ttl < 0) {
    await client.expire(key, ttlSeconds);
  }

  return nextValue;
}

export async function acquireLock(lockKey, options = {}) {
  if (!isRedisEnabled()) return null;

  const { ttlMs = 10000 } = options;
  const client = getRedisClient();
  const key = prefixed("lock", lockKey);
  const token = randomUUID();

  const result = await client.set(key, token, "PX", ttlMs, "NX");
  if (result !== "OK") return null;

  return { key, token };
}

export async function releaseLock(lockHandle) {
  if (!isRedisEnabled() || !lockHandle) return false;

  const client = getRedisClient();
  const result = await client.eval(
    LOCK_RELEASE_SCRIPT,
    1,
    lockHandle.key,
    lockHandle.token
  );

  return Number(result) === 1;
}

export async function enqueueJob(queueName, payload) {
  if (!isRedisEnabled()) return null;

  const client = getRedisClient();
  const key = prefixed("queue", queueName);
  const item = JSON.stringify({ payload, enqueuedAt: new Date().toISOString() });
  return client.rpush(key, item);
}

export async function dequeueJob(queueName, options = {}) {
  if (!isRedisEnabled()) return null;

  const { timeoutSeconds = 1 } = options;
  const client = getRedisClient();
  const key = prefixed("queue", queueName);
  const result = await client.blpop(key, timeoutSeconds);

  if (!result) return null;

  const raw = result[1];
  try {
    return JSON.parse(raw);
  } catch {
    return { payload: raw };
  }
}
