import NodeCache from "node-cache";
import { env } from "./env.js";
import { logger } from "./logger.js";
import { getRedisClient, isRedisEnabled } from "./redis.js";

// Redis-first cache wrapper for the whole app.
//
// If REDIS_URL is configured, cached values are stored in Redis so they are
// shared across all server instances/processes.
//
// NodeCache stays as a local fallback so development still works even when
// Redis is unavailable.
//
// When to cache:
//   ✅ Read-heavy lists that change rarely (announcements, events, amenities)
//
// When NOT to cache:
//   ❌ User-specific data (tickets, bookings) — wrong user might get wrong data
//   ❌ Write operations — always hit the DB directly
//
// When to invalidate (delete from cache):
//   Every time the data changes (create / update / delete),
//   call cache.del(key) so the next read gets fresh data.

const fallbackCache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

function redisCacheKey(key) {
  return `${env.redisKeyPrefix}:cache:${key}`;
}

export const cache = {
  async get(key) {
    if (isRedisEnabled()) {
      try {
        const client = getRedisClient();
        const raw = await client.get(redisCacheKey(key));
        if (!raw) return null;
        return JSON.parse(raw);
      } catch (error) {
        logger.warn(`Redis cache get failed for key ${key}: ${error.message}`);
      }
    }

    return fallbackCache.get(key) ?? null;
  },

  async set(key, value, ttlSeconds = env.redisCacheTtlSeconds) {
    if (isRedisEnabled()) {
      try {
        const client = getRedisClient();
        await client.set(redisCacheKey(key), JSON.stringify(value), "EX", ttlSeconds);
      } catch (error) {
        logger.warn(`Redis cache set failed for key ${key}: ${error.message}`);
      }
    }

    fallbackCache.set(key, value, ttlSeconds);
  },

  async del(key) {
    if (isRedisEnabled()) {
      try {
        const client = getRedisClient();
        await client.del(redisCacheKey(key));
      } catch (error) {
        logger.warn(`Redis cache delete failed for key ${key}: ${error.message}`);
      }
    }

    fallbackCache.del(key);
  },
};

// Cache key builder — keeps keys consistent across controllers.
// e.g. cacheKey("announcements", "tenant-123abc") → "announcements:tenant-123abc"
export function cacheKey(resource, tenantId) {
  return `${resource}:${tenantId}`;
}     //to solve the multi-tenant problem in our project.
