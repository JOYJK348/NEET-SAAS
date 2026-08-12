import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

/**
 * SessionStorage Persister for TanStack Query Cache
 * 
 * Storage Key Versioning: 'neet-query-cache-v1'
 * - Bumping version string (v1 → v2) automatically invalidates legacy cache entries on deployment.
 * - Restores memory cache synchronously before React components mount on F5 refresh.
 */
export const CACHE_STORAGE_KEY = 'neet-query-cache-v1';

export const sessionPersister = createSyncStoragePersister({
  storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
  key: CACHE_STORAGE_KEY,
  throttleTime: 1000, // Write at most once per second to prevent UI jank
  serialize: JSON.stringify,
  deserialize: JSON.parse,
});
