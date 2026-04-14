import NodeCache from "node-cache";

// One shared cache instance for the whole app.
//
// stdTTL: 60  → cached items expire after 60 seconds by default.
//              After 60s the next request hits MongoDB and refreshes the cache.
// checkperiod: 120 → NodeCache scans for and deletes expired keys every 120s.
//                    Prevents stale entries from sitting in memory forever.
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

export const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

// Cache key builder — keeps keys consistent across controllers.
// e.g. cacheKey("announcements", "tenant-123abc") → "announcements:tenant-123abc"
export function cacheKey(resource, tenantId) {
  return `${resource}:${tenantId}`;
}     //to solve the multi-tenant problem in our project.
