# Shared Foundation Layer (Platform Foundation)

## Purpose

The Shared bounded context provides **platform-wide reference data, lookups, and contracts** used by every other module. It contains ISO-standard lookup tables, shared error codes, storage provider abstractions, and validation helpers.

**Rule:** No business logic. No domain-specific tables. No tenant-specific data.

## Scope

14 tables across 6 logical groups:

| Group | Tables | Standard |
|---|---|---|
| **Geography** | `countries`, `states`, `countries_phone_codes` | ISO 3166-1 |
| **Language & Culture** | `languages`, `currencies`, `timezones`, `locales` | ISO 639 / ISO 4217 / IANA / BCP-47 |
| **File Handling** | `file_types`, `mime_types`, `storage_providers` | IANA MIME |
| **Communication** | `notification_channels` | Custom |
| **Contracts** | `error_codes`, `units_of_measure` | Custom |
| **Formatting** | `date_formats` | Custom |

## Design Principles

1. **Immutable by Default** — Core lookups (countries, languages, currencies, timezones, locales, error codes, date formats): DELETE triggers prevent deletion
2. **ISO Compliant** — Every reference table follows published international standards
3. **Idempotent Seeds** — All seed scripts use `ON CONFLICT DO NOTHING`
4. **Cache-Friendly** — `pg_notify` on `lookup_cache_refresh` for app-level cache invalidation
5. **No Business Logic** — Zero domain rules; pure reference data
6. **Admin-Only Writes** — RLS allows SELECT for all authenticated users, INSERT/UPDATE only for platform admins

## Naming Standards

| Category | Standard | Example |
|---|---|---|
| Country codes | ISO 3166-1 alpha-2 (uppercase) | `IN`, `US`, `AE` |
| Language codes | ISO 639-1 (lowercase) | `en`, `ta`, `hi` |
| Currency codes | ISO 4217 (uppercase) | `INR`, `USD`, `AED` |
| Timezone names | IANA TZ identifier | `Asia/Kolkata` |
| Locale codes | BCP-47 tag | `en-IN`, `ta-IN` |
| MIME types | IANA MIME (lowercase) | `image/png` |
| Error codes | `MODULE_NNN` (uppercase) | `AUTH_001` |
| Date format codes | `CATEGORY_FORMAT` (uppercase) | `DD_MM_YYYY` |
| File type codes | Uppercase underscore | `IMAGE`, `PDF` |

## Immutability Rules

| Rule | Applies To |
|---|---|
| **No DELETE** (trigger-enforced) | countries, languages, currencies, timezones, locales, error_codes, units_of_measure, date_formats |
| **Soft delete only** (is_active = false) | states, file_types, mime_types, storage_providers, notification_channels, countries_phone_codes |
| **No hard deletes** from application code | All shared tables |
| **Append-only audit** (separate module) | Via 17-governance audit_logs |

## Seed Strategy

- **Idempotent**: All seeds use `ON CONFLICT DO NOTHING` — safe to re-run
- **ISO-based**: Countries, languages, currencies follow published standards
- **No demo data**: Seeds contain only production reference data
- **Sequential**: Seeds must run in dependency order (countries before states, etc.)
- **Versioned**: Schema changes use migration scripts; seeds are re-runnable

## Versioning

- Each table has a `version` column for optimistic locking
- Schema changes require new migration scripts (never edit existing DDL in-place after deployment)
- Seed data uses `ON CONFLICT` for idempotent re-runs
- ISO updates are applied via seed re-runs (never DROP/recreate)

## Migration Rules

1. **Adding a column**: ALTER TABLE ADD COLUMN with default value
2. **Adding a lookup value**: Insert into seed file, re-run seed
3. **Removing a lookup value**: Set `is_active = false` (never DELETE)
4. **Adding a new table**: Create DDL + seed + function + update validation
5. **Removing a table**: Deprecate first, remove in next major version
6. **Never DROP** a shared table after the first production deployment

## Backward Compatibility

- New columns must have default values (NULL or sensible DEFAULT)
- Removing columns is prohibited — set `is_active = false` on dependent rows
- Function signatures can be overloaded but never removed
- Views can be extended but never have columns removed

## Caching Strategy

- Shared lookup data is **read-heavy, write-almost-never**
- Application layer should cache aggressively (in-memory, Redis)
- Cache invalidation via `pg_notify` on `lookup_cache_refresh` channel:
  - Fired on INSERT/UPDATE/DELETE of countries, currencies, locales
  - Application subscribes and busts local cache
- All lookup functions use `STABLE` volatility for query plan optimization

## Dependency Graph

```
countries ───┬── states
              ├── locales
              ├── countries_phone_codes
              └── (referenced by every other module)

languages ────┴── locales

file_types ───┴── mime_types

(All other tables are independent)
```

## Compile Order

| Step | File | Depends On |
|------|------|------------|
| 1 | `tables/001_countries.sql` | — |
| 2 | `tables/002_states.sql` | 001 |
| 3 | `tables/003_languages.sql` | — |
| 4 | `tables/004_currencies.sql` | — |
| 5 | `tables/005_timezones.sql` | — |
| 6 | `tables/006_locales.sql` | 003, 001 |
| 7 | `tables/007_file_types.sql` | — |
| 8 | `tables/008_mime_types.sql` | 007 |
| 9 | `tables/009_storage_providers.sql` | — |
| 10 | `tables/010_notification_channels.sql` | — |
| 11 | `tables/011_error_codes.sql` | — |
| 12 | `tables/012_units_of_measure.sql` | — |
| 13 | `tables/013_countries_phone_codes.sql` | 001 |
| 14 | `tables/014_date_formats.sql` | — |
| 15 | `functions/001_shared_functions.sql` | All |
| 16 | `procedures/001_shared_procedures.sql` | 15 |
| 17 | `triggers/001_shared_triggers.sql` | All |
| 18 | `rls/001_shared_rls.sql` | All |
| 19 | `indexes/001_shared_indexes.sql` | All |
| 20 | `views/001_shared_views.sql` | 1–6 |
| 21 | `seeds/001_countries.sql` | 001 |
| 22 | `seeds/002_states.sql` | 001, 002 |
| 23 | `seeds/003_languages.sql` | 003 |
| 24 | `seeds/004_currencies.sql` | 004 |
| 25 | `seeds/005_timezones.sql` | 005 |
| 26 | `seeds/006_file_types.sql` | 007 |
| 27 | `seeds/007_mime_types.sql` | 007, 008 |
| 28 | `seeds/008_notification_channels.sql` | 010 |
| 29 | `seeds/009_error_codes.sql` | 011 |
| 30 | `seeds/010_storage_providers.sql` | 009 |
| 31 | `seeds/011_countries_phone_codes.sql` | 001, 013 |
| 32 | `seeds/012_date_formats.sql` | 014 |
| 33 | `validation/999_validation.sql` | All |

> `contracts/` is documentation only — no SQL execution required.

## Externally Required Objects

- `touch_audit_columns()` — from `00-governance`
- `fn_rls_can_select/insert/update()` — from `15-authorization`

## Key Functions

| Function | Purpose |
|---|---|
| `fn_get_country(iso2, iso3)` | Resolve country by ISO code |
| `fn_get_currency(code)` | Resolve currency by ISO code |
| `fn_get_locale(code)` | Resolve locale by BCP-47 tag |
| `fn_get_timezone(name)` | Resolve timezone by IANA name |
| `fn_get_error(code)` | Resolve error code with message |
| `fn_get_storage_provider(code)` | Resolve storage provider config schema |
| `fn_get_phone_code(country_iso2)` | Get phone validation rules for a country |
| `fn_validate_phone(phone, country_iso2)` | Validate phone number format |
| `fn_get_date_format(code)` | Get date format pattern |
| `fn_validate_locale(code)` | Check if locale is active |
| `fn_validate_currency(code)` | Check if currency is active |
| `fn_validate_country(iso2)` | Check if country is active |
| `fn_validate_mime(mime)` | Check if MIME type is registered |
| `fn_validate_file_type(code)` | Check if file type is active |

## Validation Checks (20 total)

| # | Check | Type |
|---|---|---|
| 1 | Duplicate ISO2 codes | EXCEPTION |
| 2 | Duplicate ISO3 codes | EXCEPTION |
| 3 | Duplicate numeric codes | EXCEPTION |
| 4 | Duplicate locale codes | EXCEPTION |
| 5 | Duplicate currency codes | EXCEPTION |
| 6 | Duplicate MIME types | EXCEPTION |
| 7 | Duplicate storage provider codes | EXCEPTION |
| 8 | Duplicate notification channel codes | EXCEPTION |
| 9 | Duplicate error codes | EXCEPTION |
| 10 | Duplicate date format codes | EXCEPTION |
| 11 | Duplicate phone codes per country | EXCEPTION |
| 12 | Locales referencing invalid languages | EXCEPTION |
| 13 | Locales referencing invalid countries | EXCEPTION |
| 14 | MIME types referencing invalid file types | EXCEPTION |
| 15 | States referencing invalid countries | EXCEPTION |
| 16 | Phone codes referencing invalid countries | EXCEPTION |
| 17 | Countries referencing non-existent currencies | WARNING |
| 18 | Error codes invalid format | EXCEPTION |
| 19 | Date formats invalid category | EXCEPTION |
| 20 | Units of measure invalid category | EXCEPTION |
