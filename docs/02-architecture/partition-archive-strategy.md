# 🗄️ Partition & Archive Strategy — Hot Table Lifecycle Management

> **Document Type:** Architecture Strategy  
> **Applies To:** Tables exceeding 10 Lakh+ rows within 1 year  
> **Status:** 🟢 Decided & Locked  
> **Stack:** Supabase PostgreSQL · pg_partman (if needed) · pg-boss  
> **Date:** July 8, 2026

---

## 📖 Purpose

This document defines the **lifecycle management strategy** for high-volume tables in the Coaching Management Platform. It covers:

- Which tables need partitioning and when
- How data is partitioned (key selection, range boundaries)
- How old data is archived and eventually purged
- Retention policies per table

**This document does NOT cover cold or warm tables.** Those tables remain in a single partition with standard indexes. See `database-access-strategy.md` for the full table classification.

---

## 🔥 1. Hot Tables Requiring Lifecycle Management

Only tables that are projected to exceed **10 Lakh rows within the first year** of operation qualify for partition planning. Based on scale targets (500 institutes, 5L+ students):

| Table                   | Expected Rows (Year 1) | Expected Rows (Year 3) | Primary Write Pattern                         |
| ----------------------- | ---------------------- | ---------------------- | --------------------------------------------- |
| `attendance_records`    | 1.5 Crore              | 5+ Crore               | Tutor marks attendance per class per student  |
| `student_responses`     | 50 Lakh                | 2+ Crore               | Student submits answers during assessment     |
| `notifications`         | 30 Lakh                | 1+ Crore               | System generates event-driven notifications   |
| `communication_history` | 40 Lakh                | 1+ Crore               | One row per message per channel per recipient |
| `activity_logs`         | 60 Lakh                | 2+ Crore               | Every user action (page view, click)          |
| `audit_logs`            | 30 Lakh                | 1+ Crore               | Every data mutation (create, update, delete)  |
| `login_sessions`        | 15 Lakh                | 50+ Lakh               | Every user login creates a session row        |

---

## 📐 2. Partitioning Strategy Per Table

### 2.1 `attendance_records` — The Highest Volume Table

**Why partition:** A single institute with 1,000 students and 6 classes/day generates ~1.5 Lakh rows/month. Across 500 institutes, this table hits **5 Crore rows in 3 years**. Unpartitioned, a simple monthly attendance report query would scan millions of irrelevant rows.

| Property              | Decision                                                        |
| --------------------- | --------------------------------------------------------------- |
| **Partition Key**     | `session_date` (DATE)                                           |
| **Partition Type**    | Range (Monthly)                                                 |
| **Partition Naming**  | `attendance_records_2026_07`, `attendance_records_2026_08`, ... |
| **Active Partitions** | Current month + previous 2 months (3 months active)             |
| **Archive Trigger**   | Data older than 12 months moves to archive partition            |
| **Delete Policy**     | Data older than 5 years is permanently deleted                  |

**Query Impact:** When a tutor queries "this month's attendance for Batch A", PostgreSQL's partition pruning automatically skips all other months' partitions. A 5 Crore row table behaves like a 15 Lakh row table for current-month queries.

---

### 2.2 `student_responses` — Assessment Submission Data

**Why partition:** Every mock test with 200 questions × 500 students = 1 Lakh rows per test event. With weekly tests across 500 institutes, this accumulates rapidly.

| Property              | Decision                                         |
| --------------------- | ------------------------------------------------ |
| **Partition Key**     | `submitted_at` (TIMESTAMPTZ)                     |
| **Partition Type**    | Range (Monthly)                                  |
| **Active Partitions** | Current academic year (12 months)                |
| **Archive Trigger**   | Data older than 1 academic year moves to archive |
| **Delete Policy**     | Data older than 3 years is permanently deleted   |

**Note:** Results and rankings are computed and stored in the `results` table (warm table, not partitioned). Raw student responses are only needed for dispute resolution and detailed analytics.

---

### 2.3 `notifications` — System Event Messages

**Why partition:** Every attendance mark, fee overdue, result publication, and assignment upload generates notifications for students and parents. High-frequency writes with rapidly declining read relevance.

| Property              | Decision                                           |
| --------------------- | -------------------------------------------------- |
| **Partition Key**     | `created_at` (TIMESTAMPTZ)                         |
| **Partition Type**    | Range (Monthly)                                    |
| **Active Partitions** | Current month + previous 1 month (2 months active) |
| **Archive Trigger**   | Data older than 6 months moves to archive          |
| **Delete Policy**     | Data older than 2 years is permanently deleted     |

**Rationale:** Users rarely scroll past 1 month of notifications. The "Notifications" UI shows recent items with cursor pagination. Archived notifications are accessible via an "Older Notifications" link that queries the archive partition.

---

### 2.4 `communication_history` — Delivery Logs

**Why partition:** One announcement to 1,000 users across 2 channels = 2,000 history rows per announcement. This is pure audit/compliance data.

| Property              | Decision                                       |
| --------------------- | ---------------------------------------------- |
| **Partition Key**     | `created_at` (TIMESTAMPTZ)                     |
| **Partition Type**    | Range (Monthly)                                |
| **Active Partitions** | Current month + previous 2 months              |
| **Archive Trigger**   | Data older than 6 months moves to archive      |
| **Delete Policy**     | Data older than 3 years is permanently deleted |

---

### 2.5 `activity_logs` — User Interaction Tracking

**Why partition:** Every page view, button click, and feature interaction generates a log entry. This is the highest-velocity write table in the platform but has the lowest read priority.

| Property              | Decision                                      |
| --------------------- | --------------------------------------------- |
| **Partition Key**     | `occurred_at` (TIMESTAMPTZ)                   |
| **Partition Type**    | Range (Monthly)                               |
| **Active Partitions** | Current month only                            |
| **Archive Trigger**   | Data older than 3 months moves to archive     |
| **Delete Policy**     | Data older than 1 year is permanently deleted |

**Note:** Activity logs exist for product analytics, not compliance. Aggressive archival is acceptable.

---

### 2.6 `audit_logs` — Compliance & Security Records

**Why partition:** Every data mutation (student created, fee recorded, attendance edited) generates an immutable audit entry. Unlike activity logs, audit logs have **legal retention requirements**.

| Property              | Decision                                                        |
| --------------------- | --------------------------------------------------------------- |
| **Partition Key**     | `created_at` (TIMESTAMPTZ)                                      |
| **Partition Type**    | Range (Quarterly)                                               |
| **Active Partitions** | Current quarter + previous quarter                              |
| **Archive Trigger**   | Data older than 1 year moves to cold archive                    |
| **Delete Policy**     | Data older than **7 years** is permanently deleted (compliance) |

**Critical:** Audit logs must never be modified or deleted before the retention period. Archive partitions must be read-only.

---

### 2.7 `login_sessions` — Authentication Sessions

**Why partition:** Every login creates a session row. Sessions are short-lived (7-30 days) but accumulate over time. Only active sessions matter for security monitoring.

| Property              | Decision                                          |
| --------------------- | ------------------------------------------------- |
| **Partition Key**     | `created_at` (TIMESTAMPTZ)                        |
| **Partition Type**    | Range (Monthly)                                   |
| **Active Partitions** | Current month only                                |
| **Archive Trigger**   | Expired sessions older than 3 months are archived |
| **Delete Policy**     | Data older than 1 year is permanently deleted     |

**Optimization:** A nightly pg-boss job should clean up expired sessions (`WHERE expires_at < NOW() AND status = 'EXPIRED'`) from the active partition to keep it lean.

---

## 📊 3. Retention Policy Summary

| Table                   | Active Window | Archive After   | Delete After | Legal Hold? |
| ----------------------- | ------------- | --------------- | ------------ | ----------- |
| `attendance_records`    | 3 months      | 12 months       | 5 years      | No          |
| `student_responses`     | 12 months     | 1 academic year | 3 years      | No          |
| `notifications`         | 2 months      | 6 months        | 2 years      | No          |
| `communication_history` | 3 months      | 6 months        | 3 years      | No          |
| `activity_logs`         | 1 month       | 3 months        | 1 year       | No          |
| `audit_logs`            | 6 months      | 1 year          | **7 years**  | **Yes**     |
| `login_sessions`        | 1 month       | 3 months        | 1 year       | No          |

---

## ⚙️ 4. Implementation Approach

### 4.1 Phase 1 — No Partitioning (Launch)

At launch scale (1-2 institutes, < 1,000 students), partitioning adds unnecessary complexity. All tables operate as standard single-partition tables.

**When to activate partitioning:**

- Any hot table exceeds **10 Lakh rows**, OR
- Any query on a hot table exceeds **1 second mean execution time** (measured via `pg_stat_statements`)

### 4.2 Phase 2 — Declarative Partitioning (Growth Phase)

When partitioning is activated, use PostgreSQL's native declarative partitioning:

```sql
-- Example: Partition attendance_records by month
CREATE TABLE attendance_records (
  id              UUID NOT NULL DEFAULT gen_random_uuid(),
  institute_id    UUID NOT NULL,
  session_date    DATE NOT NULL,
  -- ... other columns ...
  PRIMARY KEY (id, session_date)  -- Partition key must be in PK
) PARTITION BY RANGE (session_date);

-- Create monthly partitions
CREATE TABLE attendance_records_2026_07
  PARTITION OF attendance_records
  FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');

CREATE TABLE attendance_records_2026_08
  PARTITION OF attendance_records
  FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');
```

### 4.3 Automatic Partition Management

Use a pg-boss scheduled job (or `pg_partman` extension if available on Supabase) to:

1. **Auto-create** next month's partition 7 days before month end
2. **Auto-detach** partitions older than the active window
3. **Auto-archive** detached partitions to a separate `_archive` schema

```text
pg-boss Job: "partition-maintenance" (runs weekly)
    │
    ├── Check if next month's partition exists → Create if missing
    ├── Detach partitions older than active window
    └── Move detached partitions to archive schema
```

---

## 🗃️ 5. Archive Strategy

### 5.1 Archive Schema

Archived partitions are moved to a separate PostgreSQL schema named `archive`:

```sql
-- Move old partition to archive schema
ALTER TABLE attendance_records_2025_01 SET SCHEMA archive;
```

This keeps the `public` schema clean while preserving data accessibility for compliance queries.

### 5.2 Archive Access Pattern

Archived data is accessed only through explicit admin endpoints:

```text
/api/admin/archive/attendance?year=2025&month=01
```

Standard user-facing APIs **never** query the archive schema. This separation ensures that archive data volume never impacts production query performance.

### 5.3 Cold Storage (Phase 3+)

For data exceeding the archive retention period (e.g., audit logs > 3 years old), export to compressed CSV/Parquet files and store in Cloudflare R2:

```text
Archive Schema (PostgreSQL)
    │
    └── After 3 years → Export to R2 as compressed Parquet
                         └── r2://cmp-archive/audit_logs/2023/Q1.parquet
```

---

## 🚨 6. Critical Rules

1. **Never partition in Phase 1.** Start simple. Monitor with `pg_stat_statements`. Partition only when evidence demands it.
2. **Partition key must be in the PRIMARY KEY.** PostgreSQL requires this for declarative partitioning.
3. **All indexes on partitioned tables are per-partition.** A composite index `(institute_id, session_date)` on the parent table automatically creates the same index on each partition.
4. **Prisma compatibility:** Prisma does not natively manage partitioned tables. Partitioning must be done via raw SQL migrations. Prisma queries work transparently against partitioned tables (PostgreSQL handles partition routing).
5. **Archiving must be reversible.** Archived partitions can be re-attached to the main table if needed for audits or investigations.
6. **Audit logs are untouchable.** Never modify, never delete before 7-year retention. This is a compliance requirement for educational institutions handling student data.

---

_Last updated: July 8, 2026 — This document applies only to hot tables identified in database-access-strategy.md. Cold and warm tables do not need lifecycle management._
