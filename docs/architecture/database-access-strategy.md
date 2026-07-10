# 🏛️ Database Access Strategy — The Database Constitution

> **Document Type:** Architecture Strategy (Non-Negotiable Rules)  
> **Applies To:** Every query, every service, every migration in the Coaching Management Platform  
> **Status:** 🟢 Decided & Locked  
> **Stack:** Supabase PostgreSQL · Prisma ORM · NestJS · Redis  
> **Date:** July 8, 2026

---

## 📖 Purpose

This document defines **how** the database is accessed, queried, cached, and protected across the entire platform. It is the single reference that governs all runtime database behavior.

**Relationship to other docs:**
- `database-design.md` = *How tables are structured* (naming, types, constraints)
- `database-access-strategy.md` = *How tables are used at runtime* (queries, caching, performance) ← **This document**
- `partition-archive-strategy.md` = *How hot tables are lifecycle-managed* (partitioning, retention, archival)
- `schema/*.md` = *What each table contains* (columns, indexes, relationships)

---

## 🔒 1. Multi-Tenant Query Isolation Rules

Every database query in this platform operates inside a tenant boundary. There are zero exceptions for tenant-scoped tables.

### 1.1 The Golden Rule

```sql
-- ✅ EVERY query on a tenant-scoped table MUST start with this filter
WHERE institute_id = $tenantId

-- ❌ NEVER write a query without tenant scoping on tenant tables
SELECT * FROM students WHERE status = 'ACTIVE'  -- BANNED
```

### 1.2 Enforcement Layers (Defense in Depth)

| Layer | Technology | What It Does |
|---|---|---|
| **Layer 1 — Application** | Prisma Middleware | Auto-injects `institute_id` into every query. Hard-throws on null. |
| **Layer 2 — Database** | PostgreSQL RLS | Blocks rows where `institute_id ≠ current_setting('app.current_institute_id')` |
| **Layer 3 — Testing** | Integration Tests | Every API endpoint has a cross-tenant isolation test. Fails CI if breached. |

> See [multitenancy-strategy.md](multitenancy-strategy.md) for full implementation details.

### 1.3 Platform Admin Exception

Platform Admin queries bypass tenant scoping. This is controlled by the `isPlatformAdmin` flag in the Prisma middleware. Platform Admin routes are protected by `@Roles('PLATFORM_ADMIN')` — a regular tenant user can never trigger un-scoped queries.

---

## 🌡️ 2. Table Classification (Hot / Warm / Cold)

Not all tables are equal. Some get millions of writes per month. Others barely change after initial setup. This classification drives every optimization decision.

### 2.1 Classification Matrix

| Table | Classification | Expected Rows (3 Years) | Read Frequency | Write Frequency | Optimization Priority |
|---|---|---|---|---|---|
| `attendance_records` | 🔥 **Hot Write** | 5+ Crore | High (reports) | Very High (daily marks) | Partition + Minimal Indexes |
| `student_responses` | 🔥 **Hot Write** | 2+ Crore | Medium (results) | High (test submissions) | Partition + Batch Insert |
| `notifications` | 🔥 **Hot Write** | 1+ Crore | Medium (user inbox) | High (system events) | Partition + Auto-Archive |
| `activity_logs` | 🔥 **Hot Write** | 2+ Crore | Low (admin audit) | Very High (every action) | Partition + Archive After 1yr |
| `audit_logs` | 🔥 **Hot Write** | 1+ Crore | Very Low (compliance) | High (every mutation) | Partition + Cold Storage After 3yr |
| `login_sessions` | 🔥 **Hot Write** | 50+ Lakh | Low (active only) | High (every login) | TTL Cleanup + Archive |
| `communication_history` | 🔥 **Hot Write** | 1+ Crore | Low (delivery logs) | High (every send) | Partition + Archive |
| `students` | 🟡 **Warm** | 10+ Lakh | Very High (lists, search) | Medium (admissions) | Read-Optimized Indexes |
| `student_enrollments` | 🟡 **Warm** | 15+ Lakh | Very High (joins) | Medium (per admission) | Composite Indexes |
| `tutors` | 🟡 **Warm** | 1+ Lakh | High (assignments) | Low (onboarding) | Read-Optimized |
| `assignments` | 🟡 **Warm** | 5+ Lakh | High (student view) | Medium (tutor creates) | Read-Optimized |
| `study_materials` | 🟡 **Warm** | 5+ Lakh | High (student view) | Medium (tutor uploads) | Read-Optimized |
| `payments` | 🟡 **Warm** | 20+ Lakh | Medium (reports) | Medium (per installment) | Composite Indexes |
| `fee_installments` | 🟡 **Warm** | 15+ Lakh | High (dashboard) | Medium (per enrollment) | Composite Indexes |
| `results` | 🟡 **Warm** | 10+ Lakh | High (student view) | Medium (post-evaluation) | Read-Optimized |
| `institutes` | 🧊 **Cold** | < 1,000 | Low | Very Low | No special optimization |
| `branches` | 🧊 **Cold** | < 5,000 | Low | Very Low | Cache in Redis |
| `academic_years` | 🧊 **Cold** | < 5,000 | Low | Very Low | Cache in Redis |
| `courses` | 🧊 **Cold** | < 10,000 | Medium | Very Low | Cache in Redis |
| `subjects` | 🧊 **Cold** | < 50,000 | Medium | Very Low | Cache in Redis |
| `chapters` | 🧊 **Cold** | < 200,000 | Medium | Very Low | Cache in Redis |
| `batches` | 🧊 **Cold** | < 20,000 | Medium | Very Low | Cache in Redis |
| `roles` | 🧊 **Cold** | 5 | Low | Never | In-Memory Cache |
| `permissions` | 🧊 **Cold** | < 100 | Low | Never | In-Memory Cache |
| `fee_structures` | 🧊 **Cold** | < 10,000 | Low | Very Low | Cache in Redis |
| `question_banks` | 🧊 **Cold** | < 50,000 | Medium | Low | Standard Indexes |

### 2.2 Optimization Rules by Classification

| Classification | Index Count | Write Strategy | Read Strategy | Partition? | Archive? |
|---|---|---|---|---|---|
| 🔥 **Hot Write** | **Minimal** (≤ 3 indexes) | Batch inserts, async writes | Avoid direct reads for dashboards — use summary tables | ✅ Yes | ✅ Yes |
| 🟡 **Warm** | **Moderate** (3-6 indexes) | Standard single-row writes | Composite indexes for filtered reads | ❌ Not initially | Soft delete |
| 🧊 **Cold** | **Minimal** (1-2 indexes) | Rare writes | Cache in Redis/memory — avoid DB hits | ❌ No | ❌ No |

---

## 💾 3. Caching Strategy

### 3.1 What to Cache (Redis / In-Memory)

These entities change **rarely** (hours or days between updates). Hitting the database for them on every request is wasteful.

| Entity | Cache Location | TTL | Invalidation Trigger |
|---|---|---|---|
| Roles & Permissions map | NestJS In-Memory (Map) | Until server restart | Never changes at runtime |
| Institute settings | Redis | 1 hour | On settings update API call |
| Course list (per institute) | Redis | 30 minutes | On course create/update |
| Subject list (per course) | Redis | 30 minutes | On subject create/update |
| Chapter list (per subject) | Redis | 30 minutes | On chapter create/update |
| Batch list (per course) | Redis | 15 minutes | On batch create/update |
| Fee structures (per course) | Redis | 1 hour | On fee structure update |
| Feature flags (per license) | Redis | 1 hour | On license update |
| System configuration | Redis | 1 hour | On config update |

### 3.2 What to NEVER Cache

These entities change **frequently** or have **financial/legal implications** where stale data is unacceptable.

| Entity | Why Not Cache |
|---|---|
| `attendance_records` | Changes every class session. Stale data = wrong attendance reports. |
| `student_responses` | Test submissions must be immediately consistent. |
| `payments` | Financial records — stale cache = incorrect fee status displayed to parents. |
| `fee_installments` | Payment status must be real-time. |
| `results` | Marks must be accurate the moment they're published. |
| `student_enrollments` | Enrollment status affects access to batches, materials, and fees. |
| `notifications` | Must reflect real-time delivery status. |

### 3.3 Cache Invalidation Protocol

```text
Admin updates Course name
    │
    ├── Service layer saves to DB via Prisma
    │
    └── Service layer calls Redis DEL key: `courses:${instituteId}`
         │
         └── Next request rebuilds cache from DB
```

> **Rule:** Every service method that performs a CREATE/UPDATE/DELETE on a cached entity **must** invalidate the corresponding Redis key in the same method. This is enforced via code review.

---

## 📊 4. Summary Table Strategy (Dashboard Performance)

### 4.1 The Problem

A Tenant Admin dashboard needs:
- Total active students
- Today's attendance percentage across all batches
- Outstanding fee amount (sum of overdue installments)
- Upcoming assessments (next 7 days)
- Active batch count

Running `COUNT(*)`, `SUM()`, and multi-table JOINs **live on every dashboard refresh** against millions of rows is unacceptable. At 1 lakh+ students, this degrades to 5-10 second response times.

### 4.2 Phase 1 — Live Queries (Acceptable at Launch Scale)

At launch (< 500 students per institute), live aggregate queries are acceptable. Dashboard API endpoints execute real-time SQL.

```sql
-- Phase 1: Live query (acceptable for < 500 students)
SELECT COUNT(*) FROM student_enrollments
WHERE institute_id = $id AND status = 'ACTIVE';
```

### 4.3 Phase 2 — Pre-Computed Summary Tables (When Scale Demands)

When any institute exceeds 2,000 active students, introduce summary tables updated by `pg-boss` background jobs.

| Summary Table | Updated By | Frequency | Dashboard Reads |
|---|---|---|---|
| `daily_institute_summary` | pg-boss job | Nightly (2 AM) + on-demand refresh | Admin dashboard cards |
| `batch_attendance_summary` | pg-boss job | After every class session ends | Attendance overview widget |
| `fee_collection_summary` | pg-boss job | Nightly (2 AM) | Fee dashboard cards |
| `assessment_performance_summary` | pg-boss job | After result publication | Performance charts |

```sql
-- Phase 2: Summary table read (< 5ms response)
SELECT * FROM daily_institute_summary
WHERE institute_id = $id AND summary_date = CURRENT_DATE;
```

### 4.4 Transition Rule

> **Do NOT create summary tables in Phase 1.** Start with live queries. Monitor query execution times using `pg_stat_statements`. When any dashboard query exceeds **2 seconds consistently**, introduce the corresponding summary table. Premature optimization is the root of all evil.

---

## 📝 5. Audit & Activity Trail Strategy

### 5.1 Two Separate Systems

| System | Table | Purpose | Who Reads It |
|---|---|---|---|
| **Audit Log** | `audit_logs` | Security-critical actions (login, permission changes, data deletions) | Platform Admin, Compliance |
| **Activity Log** | `activity_logs` | User interaction tracking (page views, feature usage) | Analytics, Reporting |

### 5.2 Audit Log Rules

- Every `CREATE`, `UPDATE`, `DELETE` on business entities must create an audit log entry.
- Audit logs are **append-only** and **immutable**. No updates. No deletes.
- Store the `before` and `after` state as `JSONB` for data change tracking.
- Audit logs are **never** displayed in real-time dashboards (they are compliance records, not UX features).

### 5.3 Activity Log Rules

- Lightweight event tracking (e.g., "student viewed assignment", "tutor opened batch").
- Used for product analytics and engagement metrics.
- Acceptable to lose some entries (not mission-critical like audit logs).
- Can be archived aggressively (retain 6 months, archive rest).

---

## 🗂️ 6. File & Media Storage Strategy

### 6.1 What Goes Where

| Content Type | Storage | Database Column | Why |
|---|---|---|---|
| Student profile photos | Supabase Storage | `avatar_url TEXT` | Small files, RLS-protected access |
| Student documents (ID, certificates) | Supabase Storage | `document_url TEXT` | RLS-protected, admin-only access |
| Study material PDFs | Supabase Storage | `file_url TEXT` | Batch-scoped access via RLS |
| Assignment submissions | Supabase Storage | `submission_url TEXT` | Student-specific access |
| Live class recordings (video) | Cloudflare R2 | `recording_url TEXT` | Large files, zero egress fees |
| OMR sheet scans | Supabase Storage | `omr_scan_url TEXT` | Assessment-specific |
| Institute logo | Supabase Storage | `logo_url TEXT` | Public access |

### 6.2 What NEVER Goes in the Database

| Content | Why Not |
|---|---|
| Raw image/video binary data (`BYTEA`) | Bloats database size, kills backup speed, wastes connection bandwidth |
| Base64-encoded files | Same problems as BYTEA but worse (33% larger than binary) |
| File content for search | Use file metadata (name, tags) for search. Full-text search on PDFs = separate service (Phase 3+) |

### 6.3 Database Stores Only Metadata

```sql
-- ✅ CORRECT — DB stores only the pointer
study_materials (
  id           UUID PRIMARY KEY,
  file_url     TEXT NOT NULL,        -- 'https://storage.supabase.co/...' or 'https://r2.cloudflare.com/...'
  file_name    TEXT NOT NULL,        -- 'science-chapter-5.pdf'
  file_size    BIGINT NOT NULL,      -- bytes
  mime_type    TEXT NOT NULL,        -- 'application/pdf'
  checksum     TEXT,                 -- SHA-256 for integrity verification
  uploaded_by  UUID REFERENCES users(id)
);
```

---

## 🔌 7. Connection Strategy (Supabase Pooling)

### 7.1 Connection Types

Supabase provides two connection modes. Using the wrong one causes connection exhaustion.

| Mode | URL | Use For | Max Connections |
|---|---|---|---|
| **Transaction Mode (PgBouncer)** | `postgresql://...6543/postgres` | All Prisma ORM queries | 200+ (pooled) |
| **Session Mode (Direct)** | `postgresql://...5432/postgres` | Prisma migrations, long transactions | Limited (~20) |

### 7.2 Connection Rules

```env
# .env — NestJS Backend
# ✅ Runtime queries use Transaction Mode (port 6543)
DATABASE_URL="postgresql://user:pass@host:6543/postgres?pgbouncer=true"

# ✅ Migrations use Session Mode (port 5432)
DIRECT_URL="postgresql://user:pass@host:5432/postgres"
```

```prisma
// schema.prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")       // PgBouncer for queries
  directUrl = env("DIRECT_URL")         // Direct for migrations
}
```

> **Critical Rule:** Never use the Session Mode URL for runtime application queries. PgBouncer in Transaction Mode handles connection recycling. Without it, 50 concurrent API requests will exhaust the PostgreSQL connection limit and crash the backend.

---

## ⚡ 8. Query Rules & Performance Guardrails

### 8.1 Banned Patterns

| Pattern | Why Banned | Correct Alternative |
|---|---|---|
| `SELECT *` | Fetches unnecessary columns, wastes network bandwidth | `SELECT id, name, status` — fetch only needed columns |
| `SELECT COUNT(*)` on dashboards | Full table scan on millions of rows | Summary tables or cached counts |
| N+1 queries (loop inside loop) | 100 students × 3 relations = 301 queries | Prisma `include` (translates to `IN ()` batch query) |
| `LIKE '%keyword%'` for search | Cannot use indexes, forces sequential scan | `pg_trgm` trigram index or full-text search |
| `OFFSET 1000` pagination | Scans and discards 1000 rows before returning results | Cursor-based pagination (`WHERE id > $lastId LIMIT 20`) |
| Unscoped `DELETE` | Deletes across all tenants | Always `WHERE institute_id = $id AND ...` |
| `ORDER BY random()` | Full table scan + sort | Application-level randomization on a limited result set |

### 8.2 Required Patterns

| Pattern | Why Required | Example |
|---|---|---|
| **Tenant-first filtering** | PostgreSQL uses leftmost index column first | `WHERE institute_id = $id AND batch_id = $batchId` |
| **Cursor pagination** | Constant-time pagination regardless of page depth | `WHERE institute_id = $id AND id > $cursor ORDER BY id LIMIT 20` |
| **Prisma `select` over `include`** | Fetch only the columns you need from relations | `prisma.student.findMany({ select: { id: true, name: true } })` |
| **Batch operations** | Reduce round-trips for bulk actions | `prisma.attendance.createMany({ data: [...] })` |
| **`Promise.all()` for parallel queries** | Dashboard loads 5 independent widgets simultaneously | `await Promise.all([getStudents(), getAttendance(), getFees()])` |

### 8.3 Pagination Standard

All list endpoints must implement cursor-based pagination by default:

```typescript
// ✅ Standard pagination response shape
interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;           // Total matching records
    cursor: string | null;   // Last record's ID for next page
    hasNextPage: boolean;
  };
}
```

### 8.4 Search Strategy

| Search Type | Technology | Use Case |
|---|---|---|
| Exact match | Standard `WHERE` clause + index | Student by admission number, email |
| Prefix search | `LIKE 'kumar%'` (uses B-tree index) | Autocomplete on name fields |
| Substring search | PostgreSQL `pg_trgm` extension + GIN index | "Search students by partial name or phone" |
| Full-text search | PostgreSQL `tsvector` + `tsquery` | Search across study material titles and descriptions |

> **Phase 1:** Use `pg_trgm` for student/tutor search. It handles 90% of search needs.
> **Phase 2+:** If search becomes a bottleneck (> 500ms on 10L+ rows), evaluate Meilisearch or Typesense as a dedicated search layer.

---

## 🗑️ 9. Soft Delete & Data Lifecycle

### 9.1 Soft Delete Rules (Repeated from database-design.md for emphasis)

Core business entities are **never physically deleted**. They transition through states:

```
ACTIVE → INACTIVE → ARCHIVED → (physically deleted only via admin migration script after 5+ years)
```

### 9.2 Entity Lifecycle States

| Entity | Valid States | Notes |
|---|---|---|
| Student | `ACTIVE`, `INACTIVE`, `DROPPED`, `COMPLETED`, `TRANSFERRED` | `COMPLETED` = graduated, `TRANSFERRED` = moved to another institute |
| Tutor | `ACTIVE`, `INACTIVE`, `TERMINATED` | — |
| Course | `ACTIVE`, `INACTIVE`, `ARCHIVED` | `ARCHIVED` = academic year ended |
| Batch | `ACTIVE`, `COMPLETED`, `CANCELLED` | `COMPLETED` = all sessions done |
| Assessment | `DRAFT`, `PUBLISHED`, `COMPLETED`, `CANCELLED` | — |
| Enrollment | `ACTIVE`, `COMPLETED`, `DROPPED`, `TRANSFERRED` | — |
| Payment | `PENDING`, `COMPLETED`, `FAILED`, `REFUNDED` | Financial — never soft-delete |
| Announcement | `DRAFT`, `SCHEDULED`, `SENT`, `EXPIRED`, `CANCELLED` | — |

### 9.3 Querying Active Records

Every list query on soft-deletable entities **must** filter by active status unless explicitly requesting archived data:

```sql
-- ✅ Standard list query (default = active only)
SELECT * FROM students
WHERE institute_id = $id AND status = 'ACTIVE'
ORDER BY created_at DESC;

-- ✅ Admin archive view (explicit request)
SELECT * FROM students
WHERE institute_id = $id AND status IN ('INACTIVE', 'ARCHIVED', 'DROPPED')
ORDER BY updated_at DESC;
```

---

## 🔍 10. Index Philosophy

### 10.1 Core Principles

1. **Query-driven indexing:** Only index columns that appear in `WHERE`, `JOIN ON`, or `ORDER BY` clauses of actual queries.
2. **Write-cost awareness:** Every index slows down `INSERT`, `UPDATE`, and `DELETE`. Hot-write tables should have ≤ 3 indexes.
3. **Composite indexes over single-column:** `(institute_id, batch_id, status)` serves 3 query patterns. Three separate single-column indexes serve only 1 each while costing 3x write overhead.
4. **Leftmost rule:** `institute_id` is always the first column in any composite index on tenant-scoped tables.

### 10.2 Index Budget Per Table Type

| Table Type | Max Indexes | Examples |
|---|---|---|
| 🔥 Hot Write | ≤ 3 | PK + `(tenant_id, session_date)` + `(tenant_id, student_admission_id)` |
| 🟡 Warm | 3–6 | PK + tenant composite + search + sort |
| 🧊 Cold | 1–2 | PK + `(institute_id)` only |

> Detailed per-table index definitions are specified in each `schema/*.md` file.

---

## 📐 11. Cross-Domain Query Rules

### 11.1 Allowed Join Depth

| Context | Max Join Depth | Why |
|---|---|---|
| List endpoints | ≤ 2 JOINs | Fast list loading |
| Detail endpoints | ≤ 4 JOINs | Single entity with related data |
| Report queries | ≤ 5 JOINs | Complex aggregations (Phase 1 live queries) |
| Dashboard | **0 JOINs** | Read from summary tables or cache only |

### 11.2 N+1 Prevention

```typescript
// ❌ BANNED — N+1 pattern
const students = await prisma.student.findMany({ where: { instituteId } });
for (const student of students) {
  const enrollment = await prisma.enrollment.findFirst({ where: { studentId: student.id } });
  // This runs 100 queries for 100 students
}

// ✅ REQUIRED — Batch loading via include
const students = await prisma.student.findMany({
  where: { instituteId },
  include: {
    enrollments: {
      where: { status: 'ACTIVE' },
      select: { id: true, courseId: true, batchId: true }
    }
  }
});
// This runs exactly 2 queries regardless of student count
```

---

## 📏 12. Performance Targets

| Metric | Target | Measurement |
|---|---|---|
| Standard CRUD API response | < 100ms | p95 latency |
| List endpoint (paginated) | < 200ms | p95 latency |
| Dashboard load (all widgets) | < 500ms | Total time for `Promise.all()` |
| Search endpoint | < 300ms | p95 latency |
| Report generation (Phase 1 live) | < 2 seconds | p95 latency |
| Database connection acquisition | < 10ms | PgBouncer pool checkout |
| Redis cache hit | < 5ms | p99 latency |

### Monitoring

```sql
-- Enable query statistics tracking
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Find slowest queries (run weekly)
SELECT query, mean_exec_time, calls, total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;
```

> **Rule:** Any query exceeding 500ms mean execution time must be reviewed and optimized before the next sprint starts.

---

*Last updated: July 8, 2026 — This document governs all database access patterns across the Coaching Management Platform. Changes require architecture review.*
