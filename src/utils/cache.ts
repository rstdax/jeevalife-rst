/**
 * Simple in-memory stale-while-revalidate cache.
 * Data is shown instantly from cache, then refreshed in background.
 * TTL default: 60 seconds.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const store = new Map<string, CacheEntry<unknown>>();

const DEFAULT_TTL = 60_000; // 60 seconds

export const cache = {
  get<T>(key: string): T | null {
    const entry = store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    return entry.data;
  },

  isStale(key: string, ttl = DEFAULT_TTL): boolean {
    const entry = store.get(key);
    if (!entry) return true;
    return Date.now() - entry.timestamp > ttl;
  },

  set<T>(key: string, data: T): void {
    store.set(key, { data, timestamp: Date.now() });
  },

  invalidate(key: string): void {
    store.delete(key);
  },

  invalidatePrefix(prefix: string): void {
    for (const key of store.keys()) {
      if (key.startsWith(prefix)) store.delete(key);
    }
  },
};
