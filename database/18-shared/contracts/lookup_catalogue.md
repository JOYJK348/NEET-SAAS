# Shared Lookup Catalogue Standards

## Naming Standards

- **Country codes**: ISO 3166-1 alpha-2 (uppercase, 2 chars)
- **Language codes**: ISO 639-1 (lowercase, 2-3 chars)
- **Currency codes**: ISO 4217 (uppercase, 3 chars)
- **Timezone names**: IANA TZ identifiers (e.g. `Asia/Kolkata`)
- **Locale codes**: BCP-47 tags (e.g. `en-IN`, `ta-IN`)
- **MIME types**: IANA MIME types (lowercase, e.g. `image/png`)
- **Error codes**: `MODULE_NNN` format (e.g. `AUTH_001`, `COMMON_005`)

## ISO Standards Compliance

| Table | Standard | Version |
|---|---|---|
| countries | ISO 3166-1 | Current |
| languages | ISO 639-1 / ISO 639-2 | Current |
| currencies | ISO 4217 | Current |
| timezones | IANA TZ | 2024a+ |
| locales | BCP-47 (RFC 5646) | Current |
| mime_types | IANA MIME | Current |
| file_types | Custom (logical grouping) | 1.0 |

## Versioning

- Reference data uses `version` column for optimistic locking
- Schema changes use migration scripts
- Seed data is idempotent (ON CONFLICT DO NOTHING)
- ISO updates are applied via seed re-runs (never DROP/recreate)

## Immutability Rules

1. **Countries, Languages, Currencies, Timezones, Locales, Error Codes** — DELETE prohibited via trigger
2. **States, File Types, MIME Types, Storage Providers, Notification Channels** — Soft delete only (is_active = false)
3. **No hard deletes** on any shared table from application code
4. **Admin-only** INSERT/UPDATE via RLS

## Caching Strategy

- Shared lookup data is **read-heavy, write-almost-never**
- Application layer should cache aggressively (in-memory, Redis)
- Cache invalidation via `pg_notify` on `lookup_cache_refresh` channel
- All lookups use `STABLE` functions for query plan optimization
