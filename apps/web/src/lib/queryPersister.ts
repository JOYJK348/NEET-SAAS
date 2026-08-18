import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

/**
 * LocalStorage Persister for TanStack Query Cache
 *
 * Why localStorage (not sessionStorage):
 *   - Survives tab close, browser restart, and logout+login cycles
 *   - Enables "stale-while-revalidate" across sessions: dashboard shows
 *     last-known data INSTANTLY on login, fresh data arrives in ~1s silently
 *
 * Storage Key Versioning: 'neet-query-cache-v3'
 *   - Bumping version (v2 → v3) automatically invalidates legacy entries.
 */
export const CACHE_STORAGE_KEY = 'neet-query-cache-v3';

export const sessionPersister = createSyncStoragePersister({
  storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  key: CACHE_STORAGE_KEY,
  throttleTime: 1000, // Write at most once per second to prevent UI jank
  serialize: JSON.stringify,
  deserialize: JSON.parse,
});

