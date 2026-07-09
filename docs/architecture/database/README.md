# Database Governance & Architecture Specifications (database/README.md)

*   **Version**: 0.9 (Draft)
*   **Status**: UNDER REVIEW
*   **Owner**: Architecture Review Board

---

## 1. Purpose
This document establishes the master database governance, multi-tenant schemas isolation boundaries, key strategies, auditing guidelines, and performance standards for the NEET Coaching Management Platform.

---

## 2. Database Architecture & PostgreSQL Schemas

To optimize project lifecycle management, the database enforces logical segmentations:
*   **Schema Strategy**: We will utilize **prefix namespaces** on tables rather than distinct PostgreSQL schemas (e.g. `auth_users`, `user_staff_profiles`, `stud_profiles`, `acad_courses`, `finance_invoices`, `comms_notifications`, `sys_file_versions`). 
*   **Reasoning**: Keeping tables under a single `public` schema avoids ORM migration conflicts, simplifies Supabase RLS configuration across joins, and reduces maintenance complexity, while retaining clear domain segment separation.

---

## 3. Multi-Tenant Strategy & RLS Governance
The platform uses **Row-Level Security (RLS)** at the PostgreSQL layer to guarantee tenant isolation:

1.  **JWT Claim Extraction**: Database policies extract active context values directly from JWT session tokens.
2.  **RLS Policies Philosophy**: Every table (except shared system tables) must have an active RLS policy.
3.  **Super Admin / Service Role Bypass**: Database administrator roles and internal sync worker execution scopes bypass RLS policies to perform cross-tenant operations.

---

## 4. Key Strategy (UUIDv7 Preference)
To prevent index page fragmentation and ensure write performance under high concurrency:
*   **UUIDv7** is the preferred Primary Key (PK) strategy for all transaction tables. Its time-ordered prefix ensures index locality.
*   **Fallback (gen_random_uuid)**: Where UUIDv7 generation is not supported natively by the engine version, `gen_random_uuid()` (from `pgcrypto`) is used.


---

## 5. Inheritable Standard Entity Templates

### 5.1 Base Entity Wrapper
Every standard table must include these columns:
*   `id`: `UUID` (UUIDv7 Primary Key, defaults to UUIDv7 generator).
*   `tenant_id`: `UUID` (Foreign Key referencing `institutes.id`. Enforces multi-tenancy).
*   `created_at`: `TIMESTAMP WITH TIME ZONE` (Defaults to `now()`).
*   `created_by`: `UUID` (Nullable. User ID responsible for insert).
*   `updated_at`: `TIMESTAMP WITH TIME ZONE` (Defaults to `now()`).
*   `updated_by`: `UUID` (Nullable. User ID responsible for update).

### 5.2 Auditable Entity Wrapper
Tables representing mutable assets (e.g. schedules, compensations, student details) must append:
*   `deleted_at`: `TIMESTAMP WITH TIME ZONE` (Nullable. Enables soft delete patterns).
*   `deleted_by`: `UUID` (Nullable. User ID responsible for deletion).
*   `version`: `INTEGER` (Default `1`. Used for optimistic locking).

---

## 6. Concurrency Control (Optimistic Locking)
*   For mutable records, updates must implement Optimistic Concurrency Control (OCC).
*   Every write update check must verify that `version = expected_version` and increment `version = version + 1`. If the row count affected returns `0`, the transaction is rolled back.

---

## 7. PostgreSQL Indexing Standards
To optimize query latency:
*   **B-Tree Indexes**: Default for unique lookups, primary/foreign keys, and query filters.
*   **GIN Indexes**: Required for `JSONB` fields and `TSVECTOR` fuzzy search fields.
*   **Partial Indexes**: Enforced for active state filters (e.g. indexing only non-deleted records: `WHERE deleted_at IS NULL`).
*   **Covering Indexes**: Append selected fields using the `INCLUDE` clause to allow Index-Only Scans.

---

## 8. Table Partitioning Strategies
*   **High Volume Tables** (Telemetry logs, audit logs, communication histories) **must** implement Range Partitioning by Month.
*   Master registries (users, student profiles, subjects) **must not** be partitioned.

---

## 9. Transaction Outbox Pattern Schema
To guarantee reliable event-driven integrations without 2PC overhead:
*   All mutations write event payloads to the `sys_outbox_events` table in the same database transaction.
*   Outbox events schema:
    *   `id`: `UUID` (UUIDv7 Primary Key).
    *   `event_type`: `VARCHAR(100)` (e.g., `StudentEnrolled`).
    *   `payload`: `JSONB` (Event details).
    *   `status`: `VARCHAR(20)` (e.g., `PENDING`, `PROCESSED`, `FAILED`).
    *   `retry_count`: `INTEGER` (Default `0`).
    *   `error_log`: `TEXT` (Failed execution details).
    *   `correlation_id`: `UUID`.
    *   `created_at`: `TIMESTAMP WITH TIME ZONE` (Default `now()`).

---

## 10. Data Retention & Archiving
*   Outbox logs and transient telemetry tables are archived to Cloudflare R2 (as read-only parquet files) after 90 days, then pruned from PostgreSQL.
*   Financial transactions and student timeline logs are retained indefinitely.

---

## 11. Database Naming Standards
To keep queries readable and prevent identifier collisions:
*   **Tables**: Plural snake_case, prefixed by domain namespace (e.g. `auth_refresh_tokens`, `stud_guardians`).
*   **Columns**: Singular snake_case (`first_name`, `email`).
*   **Primary Keys**: `pk_{table_name}`.
*   **Foreign Keys**: `fk_{source_table}_{target_table}_{column_name}`.
*   **Indexes**: `idx_{table_name}_{columns}` (prefix with `uq_` for unique indexes, and `part_` for partial indexes).
*   **Constraints**: `chk_{table_name}_{field}` (for check constraints) and `excl_{table_name}_{field}` (for exclusion constraints).

---

## 12. Constraint Standards
*   **Foreign Keys**: Must define explicit referential integrity triggers. Default to `ON DELETE RESTRICT` for parent configuration records to prevent orphan rows. Use `ON DELETE CASCADE` only for dependent child details tables.
*   **Exclusion Constraints**: Used to enforce interval safety rules natively in Postgres (e.g. preventing time overlaps in schedules or salary timelines).
*   **NOT NULL Constraints**: Default to strict `NOT NULL` constraints on all fields. Make fields nullable only when there is a clear business requirement for optional data.

---

## 13. Query Standards
*   **No SELECT \***: Queries must explicitly select required fields to optimize bandwidth and memory usage.
*   **No OFFSET Pagination**: Large lists must use Cursor-based pagination. Offset pagination is allowed only on low-volume configuration tables.
*   **N+1 Query Prevention**: Utilize joins, batch loading, or eager loading in ORM layers. Direct loops executing queries in code are prohibited.
*   **Sargable Queries**: Avoid wrapping index columns in database functions inside `WHERE` clauses (e.g., use `created_at >= '2026-07-01'` instead of `DATE(created_at) = '2026-07-01'`) to ensure indexes are utilized.

---

## 14. Connection Pooling (PgBouncer)
*   The application gateway communicates with the database through **PgBouncer** in **Transaction Pooling** mode.
*   Application code must release connections to the pool immediately after transaction completion. For long-running operations or migrations, use session-based connections explicitly.

---

## 15. Caching Strategy (Redis)
*   **Session Contexts & Permissions**: Cached in Redis with a 15-minute TTL.
*   **Global Configuration Data**: Cached indefinitely, with invalidation triggers on update.
*   **Dashboard Aggregations**: Pre-computed by sync tasks and cached in Redis with a 5-minute TTL.

---

## 16. Database Migration Standards
*   **Forward-Only Migrations**: Schema alterations must be additive. Down migrations are discouraged in production; correction updates must be applied by writing a new additive forward migration script.
*   **Zero-Downtime Releases**: Avoid locks on high-volume tables. Adding columns must be nullable or include defaults to prevent lock contention.

---

## 17. Operational SLA Performance Targets
*   **Primary Key Lookups**: < 20 ms.
*   **Standard Paginated Queries**: < 100 ms.
*   **Pre-computed Dashboard Widgets**: < 300 ms.
*   **Analytics Reports Queries**: < 2000 ms.

---

## 18. Database Monitoring Metrics
The operations team monitors the following metrics using PgHero/Supabase dashboards:
*   **Slow Queries**: Any query taking longer than 100 ms.
*   **Sequential Scans**: High-frequency sequential scans on tables exceeding 10,000 rows.
*   **Cache Hit Ratio**: Database memory cache hit ratio must remain above **99%**.
*   **Connection Count**: Monitoring PgBouncer pool saturation levels.
*   **Lock Wait Latency**: Detecting transaction blocks.

