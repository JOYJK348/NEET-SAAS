# Multi-Tenancy Isolation Strategy

> **Status:** ✅ Decided
> **Decision Date:** July 8, 2026
> **Applies To:** PostgreSQL Database + NestJS Backend + Prisma ORM
> **Affects:** Every table in the database, every query in the codebase, every API endpoint

---

## 1. Problem Statement

The Coaching Management Platform is a **SaaS product**. Multiple coaching institutes (tenants) share:

- A single Railway-hosted PostgreSQL instance
- A single NestJS backend deployment
- A single Vercel-deployed Next.js frontend

The core engineering challenge is:

> **How do we ensure that Institute A can NEVER read or write Institute B's data — ever — under any circumstance?**

This decision affects every single table design, every query, every ORM call, and every test we write.

---

## 2. Options Evaluated

### Option A — Row-Level Isolation (Single Schema)

One database, one schema. Every tenant-owned table has an `institute_id` column. All queries are filtered by it.

```sql
-- All tenant tables look like this
SELECT * FROM students WHERE institute_id = 'inst_abc123';
```

| ✅ Pros                                                | ❌ Cons                                                  |
| ------------------------------------------------------ | -------------------------------------------------------- |
| Simple to implement                                    | Risk of missing WHERE clause → data leak                 |
| Low infrastructure cost                                | Requires strict discipline at query layer                |
| Works perfectly with Prisma                            | institute_id index required on every tenant table        |
| Easy schema migrations (one migration for all tenants) | Shared DB means one tenant's heavy query can slow others |
| Railway single-DB works natively                       | No hard isolation boundary                               |
| JWT already carries institute_id (Decision 01)         |                                                          |

---

### Option B — Schema-Per-Tenant

One database, one schema per institute (`inst_abc123.students`, `inst_xyz789.students`).

```sql
SET search_path TO inst_abc123;
SELECT * FROM students;
```

| ✅ Pros                         | ❌ Cons                                                    |
| ------------------------------- | ---------------------------------------------------------- |
| Better isolation than row-level | Prisma has **zero support** for schema-per-tenant          |
| Schema-level backup per tenant  | `SET search_path` per connection breaks connection pooling |
| Cleaner DB browser view         | Every migration must run N times (once per tenant)         |
|                                 | Railway managed Postgres + pgBouncer makes this painful    |
|                                 | Requires raw SQL for schema operations                     |
|                                 | New tenant onboarding = schema creation + migration run    |

---

### Option C — Database-Per-Tenant

Separate PostgreSQL database per institute.

| ✅ Pros              | ❌ Cons                                            |
| -------------------- | -------------------------------------------------- |
| Maximum isolation    | $$$: Railway charges per database                  |
| Easy tenant deletion | One NestJS instance → dynamic DB connections       |
| Independent backups  | Connection pool management nightmare               |
|                      | Prisma requires separate `PrismaClient` per tenant |
|                      | Migrations must run across N databases             |
|                      | Completely disproportionate for our scale          |

---

## 3. Decision: Option A — Row-Level Isolation

**Chosen strategy: Single schema, `institute_id` on every tenant-scoped table.**

### Rationale

**1. Prisma compatibility**
Prisma's schema file is single-schema. Schema-per-tenant would force us to abandon Prisma entirely and write raw SQL for everything. That eliminates type safety, auto-completion, and migration tooling — a catastrophic tradeoff.

**2. Railway infrastructure reality**
Railway's managed PostgreSQL does not easily support per-schema connection routing. `pgBouncer` (connection pooler) breaks `SET search_path = X` because connections are reused across requests — meaning the search path set for one tenant leaks to another. This is actually _worse_ than row-level in practice.

**3. JWT already delivers institute_id to every request**
Decision 01 bakes `institute_id` into every JWT. The isolation context is already delivered to NestJS on every request. Row-level isolation is the natural continuation of this decision.

**4. Phase 1 is single-tenant**
The platform starts with one coaching institute. All the multi-tenant isolation work is forward-compatible scaffolding. We need correctness without over-engineering.

**5. Mitigation strategy makes it safe**
The risk of missing a WHERE clause is real but fully mitigable with a **3-layer defense** (see Section 6). No query escapes without institute_id scoping.

---

## 4. Table Taxonomy: Global vs Tenant-Scoped

Not every table needs `institute_id`. Tables fall into three categories:

### Category 1: Global Tables (Platform-level, no `institute_id`)

These tables are owned by the platform — not by any specific institute.

| Table                | Why Global                                                          |
| -------------------- | ------------------------------------------------------------------- |
| `roles`              | PLATFORM_ADMIN, TENANT_ADMIN, TUTOR, STUDENT, PARENT — defined once |
| `permissions`        | Permission definitions — global                                     |
| `role_permissions`   | Role → Permission mapping — global                                  |
| `subscription_plans` | Plan catalog (Basic, Pro, Enterprise) — global                      |
| `platform_settings`  | Platform-wide configuration                                         |

> These tables are **read-only from a tenant's perspective**. Tenants never write to them.

---

### Category 2: Platform-Scoped Tables (Owned by Platform Admin)

These tables ARE scoped to specific institutes but are managed by the Platform Admin, not the Tenant.

| Table                 | `institute_id`?   | Notes                     |
| --------------------- | ----------------- | ------------------------- |
| `institutes`          | No (IS the root)  | The tenant itself         |
| `subscriptions`       | `institute_id` FK | Managed by Platform Admin |
| `platform_audit_logs` | `institute_id` FK | Platform-level audit      |

---

### Category 3: Tenant-Scoped Tables (Every row owned by an institute)

**Every single one of these tables MUST have `institute_id UUID NOT NULL` as a column and index.**

| Domain        | Tables                                                                                                                                                               |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| User          | `users`, `login_sessions`, `password_reset_tokens`, `user_profiles`                                                                                                  |
| Academic      | `academic_years`, `courses`, `batches`, `subjects`, `chapters`, `timetables`, `live_classes`, `recorded_classes`, `tutor_assignments`                                |
| Student       | `students`, `student_enrollments`, `attendance_records`                                                                                                              |
| Tutor         | `tutors`, `tutor_subjects`                                                                                                                                           |
| Parent        | `parents`, `student_parent_links`                                                                                                                                    |
| Learning      | `study_materials`, `assignments`, `student_assignments`                                                                                                              |
| Assessment    | `mock_tests`, `test_questions`, `test_results`, `student_answers`                                                                                                    |
| Communication | `announcements`, `notifications`, `messages`                                                                                                                         |
| Fee           | `fee_structures`, `fee_components`, `installment_plans`, `fee_discounts`, `student_fee_records`, `fee_installments`, `payments`, `payment_receipts`, `fee_reminders` |
| Reporting     | `report_snapshots`, `analytics_events`                                                                                                                               |
| System        | `audit_logs`, `system_settings`                                                                                                                                      |

---

## 5. The `institute_id` Column Standard

Every tenant-scoped table **must** implement this exact pattern:

### Column Definition

```sql
institute_id  UUID  NOT NULL  REFERENCES institutes(id)  ON DELETE RESTRICT
```

- `NOT NULL` — a row without a tenant owner is illegal at the DB level.
- `REFERENCES institutes(id)` — referential integrity enforced by PostgreSQL.
- `ON DELETE RESTRICT` — cannot delete an institute while it has data (forces explicit cleanup).

### Index Strategy

Every tenant-scoped table **must** have a **compound index** with `institute_id` as the first column:

```sql
-- Single-column queries (list all students of an institute)
CREATE INDEX idx_students_institute ON students(institute_id);

-- Compound queries (find a student by ID within an institute — prevents cross-tenant ID guessing)
CREATE INDEX idx_students_institute_id ON students(institute_id, id);

-- Foreign key queries (find all batches of a course within an institute)
CREATE INDEX idx_batches_institute_course ON batches(institute_id, course_id);
```

> **Why institute_id first in compound indexes?**
> PostgreSQL uses the leftmost columns of a compound index for filtering.
> Since institute_id is on EVERY query, it must be first. This eliminates full table scans.

### Prisma Schema Pattern

```prisma
model Student {
  id            String    @id @default(uuid())
  institute_id  String                          // ← MANDATORY on every tenant model
  institute     Institute @relation(fields: [institute_id], references: [id])

  first_name    String
  last_name     String
  email         String

  created_at    DateTime  @default(now())
  updated_at    DateTime  @updatedAt

  @@index([institute_id])
  @@index([institute_id, id])
  @@unique([institute_id, email])              // ← email unique WITHIN an institute, not globally
}
```

> **Critical: `@@unique([institute_id, email])`**
> Email uniqueness is per-institute, not global. Student `ravi@gmail.com` can exist in
> Institute A and Institute B simultaneously. Never use `@@unique([email])` alone.

---

## 6. The 3-Layer Defense Architecture

Row-level isolation is only as strong as the guards around it. We implement **3 independent layers**:

### Layer 1: Prisma Middleware (Application Layer)

A Prisma middleware runs on every single database operation and automatically injects `institute_id` into all queries.

```typescript
// prisma.middleware.ts

/**
 * GLOBAL_TABLES — tables that do NOT carry institute_id.
 * Queries on these tables bypass tenant scoping entirely.
 * IMPORTANT: Keep this list in sync with Section 4 (Table Taxonomy).
 * Adding a table here without understanding the security implications is a critical bug.
 */
const GLOBAL_TABLES = new Set([
  'Role',
  'Permission',
  'RolePermission',
  'SubscriptionPlan',
  'PlatformSetting',
]);

prisma.$use(async (params, next) => {
  const tenantId = requestContext.get('institute_id'); // string | null
  const isPlatformAdmin = requestContext.get('is_platform_admin') === true;
  const isGlobalTable = GLOBAL_TABLES.has(params.model ?? '');

  // ─── STEP 1: Skip tenant scoping for global (platform-level) tables ───────
  // Global tables never have institute_id. Injecting it would break the query.
  if (isGlobalTable) {
    return next(params);
  }

  // ─── STEP 2: Skip tenant scoping for Platform Admin ───────────────────────
  // Platform Admin has no institute_id in their JWT by design.
  // Their routes are protected separately by @Roles('PLATFORM_ADMIN') guard.
  // A regular tenant user can NEVER reach this branch.
  if (isPlatformAdmin) {
    return next(params);
  }

  // ─── STEP 3: HARD FAIL if tenantId is missing for a tenant-scoped table ──
  //
  // ⚠️ CRITICAL SECURITY NOTE:
  // Without this check, if tenantId is null or undefined, Prisma silently
  // injects `WHERE institute_id = null` which PostgreSQL treats as
  // `WHERE institute_id IS NULL` — matching NO rows, but on some Prisma
  // versions it may be omitted entirely, causing a full-table scan that
  // returns ALL institutes' data. This is a cross-tenant data leak.
  //
  // The correct behaviour is: CRASH LOUDLY. A 500 error is infinitely
  // preferable to silently leaking another institute's data.
  if (!tenantId) {
    throw new Error(
      `[TenantMiddleware] SECURITY VIOLATION: institute_id is missing from ` +
        `request context for model "${params.model}" action "${params.action}". ` +
        `This query has been blocked. Check that the JWT guard ran before this query ` +
        `and that requestContext is correctly propagated via AsyncLocalStorage.`,
    );
  }

  // ─── STEP 4: Inject institute_id into every operation ────────────────────
  const tenantScope = { institute_id: tenantId };

  if (params.action === 'create') {
    params.args.data = { ...params.args.data, ...tenantScope };
  }

  if (params.action === 'createMany') {
    params.args.data = params.args.data.map((row: Record<string, unknown>) => ({
      ...row,
      ...tenantScope,
    }));
  }

  if (
    ['findFirst', 'findUnique', 'findMany', 'count', 'aggregate', 'groupBy'].includes(params.action)
  ) {
    params.args.where = { ...params.args.where, ...tenantScope };
  }

  if (['update', 'updateMany'].includes(params.action)) {
    params.args.where = { ...params.args.where, ...tenantScope };
  }

  if (['delete', 'deleteMany'].includes(params.action)) {
    params.args.where = { ...params.args.where, ...tenantScope };
  }

  return next(params);
});
```

> **This is the primary safety net.** Even if a developer forgets to add `institute_id`
> in a service query, this middleware catches it automatically.

> **⚠️ Known failure mode of the naive implementation (DO NOT revert):**
> Removing the null-check on `tenantId` causes a silent failure: Prisma injects
> `WHERE institute_id = null` which on some Prisma + PostgreSQL configurations
> is silently dropped, causing a full-table cross-tenant data leak with no error or log.
> The `throw new Error(...)` in Step 3 ensures this fails loudly in development,
> and surfaces as a 500 in production (triggering alerts) rather than a silent data leak.

> **`requestContext` implementation note:**
> Use Node.js `AsyncLocalStorage` to propagate the request context through async call chains.
> Do NOT use a global singleton — it will bleed between concurrent requests.
> NestJS middleware sets the store at the start of every request:
>
> ```typescript
> // tenant-context.middleware.ts
> export class TenantContextMiddleware implements NestMiddleware {
>   use(req: Request, _res: Response, next: NextFunction) {
>     const store = {
>       institute_id: req.user?.institute_id ?? null,
>       is_platform_admin: req.user?.role === 'PLATFORM_ADMIN',
>     };
>     asyncLocalStorage.run(store, next);
>   }
> }
> ```

---

### Layer 2: PostgreSQL Row-Level Security (Database Layer)

PostgreSQL's native RLS provides a **database-level** safety net that operates independently of the application code.

```sql
-- Enable RLS on the students table
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Create policy: only allow access when app.current_institute_id matches
CREATE POLICY tenant_isolation_policy ON students
  USING (institute_id = current_setting('app.current_institute_id')::UUID);
```

NestJS sets the session variable at the start of every transaction:

```sql
-- Set per-transaction in NestJS before executing queries
SET LOCAL app.current_institute_id = 'inst_abc123';
```

> **Why both Prisma middleware AND RLS?**
> Defense in depth. If the Prisma middleware has a bug, the database itself still blocks
> the query. Two independent failure points must both fail simultaneously for a data leak.
> This is standard practice in any multi-tenant SaaS with sensitive data.

> **RLS caveat:** RLS has a performance overhead (~5-10% per query). Acceptable for our scale.
> RLS is bypassed for `SUPERUSER` role — never use superuser for application queries.
> Use a dedicated `app_user` PostgreSQL role with limited permissions.

---

### Layer 3: Integration Tests (CI/CD Layer)

Every API endpoint must have cross-tenant isolation tests that **automatically fail the build** if tenant data can be accessed across institutes.

```typescript
// Example: Cross-tenant isolation test (must exist for EVERY endpoint)
describe('Cross-Tenant Isolation: GET /students', () => {
  it('should never return students from a different institute', async () => {
    // Setup: Create Institute A and Institute B
    const instituteA = await createTestInstitute('Institute A');
    const instituteB = await createTestInstitute('Institute B');

    // Create a student in Institute B
    const studentB = await createStudent(instituteB.id, 'Ravi Kumar');

    // Login as Tenant Admin of Institute A
    const tokenA = await loginAs(instituteA.tenantAdmin);

    // Try to access students using Institute A's token
    const response = await request(app).get('/students').set('Authorization', `Bearer ${tokenA}`);

    // Assert: Institute B's student must NOT appear
    expect(response.body.data).not.toContainEqual(expect.objectContaining({ id: studentB.id }));
  });
});
```

> **Rule:** Every module must have at least one cross-tenant isolation test before it can be merged to main.

---

## 7. Platform Admin Exception

Platform Admin users do NOT have an `institute_id` in their JWT (`institute_id = null`).

When a Platform Admin makes a request:

- The Prisma middleware **skips** automatic `institute_id` injection — handled by `isPlatformAdmin` check in Step 2 of the Layer 1 middleware.
- The RLS policy must be **bypassed** for Platform Admin database connections.
- The NestJS `TenantGuard` must **skip** tenant validation.

> **See the canonical middleware implementation in Layer 1 (Section 6) above.**
> The `isPlatformAdmin` flag read from `requestContext` handles the bypass correctly.
> Do NOT write a separate middleware for Platform Admin — it creates a second code path
> to maintain and is the most common source of security regressions in multi-tenant SaaS.

> **⚠️ Order of checks matters:**
> In the Layer 1 middleware, **GLOBAL_TABLES check (Step 1) must come before Platform Admin check (Step 2)**.
> Why: Platform Admin might query `Role` or `Permission` tables which are global.
> If the Platform Admin check ran first and passed, the code would never reach the global-table check,
> which is fine — but the reverse (global-table check first) is safer and clearer in intent.
> Current implementation: Step 1 → Step 2 → Step 3 (null-check) → Step 4 (inject). This order is correct.

> **This is a precise exception, not a backdoor.** Platform Admin routes are protected
> by a separate `@Roles('PLATFORM_ADMIN')` guard. A regular tenant user can never
> access Platform Admin routes, and therefore can never trigger the `isPlatformAdmin` bypass.

---

## 8. Tenant Onboarding (New Institute Registration)

When a new institute is created by the Platform Admin, the following happens **atomically in a single transaction**:

```
BEGIN TRANSACTION;

  1. INSERT INTO institutes (id, name, code, ...) VALUES (...);
  2. INSERT INTO users (id, institute_id, email, role, ...) VALUES (...);  -- Tenant Admin user
  3. INSERT INTO subscriptions (id, institute_id, plan_id, ...) VALUES (...);
  4. INSERT INTO system_settings (id, institute_id, ...) VALUES (...);      -- Default settings

COMMIT;
```

> **No data is pre-seeded per tenant** (no "default course", no "default batch").
> The Tenant Admin configures everything through the UI.
> This keeps onboarding atomic and rollback-safe.

---

## 9. Tenant Data Deletion / Offboarding

When an institute is suspended or cancelled:

```
Phase 1: Soft Delete (immediate)
  → institutes.status = 'SUSPENDED'
  → All JWT tokens for this institute are immediately rejected by TenantGuard
  → Login is blocked

Phase 2: Data Archival (scheduled — 90 day grace period)
  → All tenant data is exported to Cloudflare R2 as a JSON archive
  → Soft-deleted flag set on all tenant records

Phase 3: Hard Delete (after grace period + explicit approval)
  → DELETE FROM <all tenant tables> WHERE institute_id = 'inst_xxx'
  → Delete in dependency order (children before parents)
  → institutes record is finally deleted
```

> **Hard deletion is irreversible.** Requires double confirmation from Platform Admin.
> Not implemented in Phase 1 — data is only ever soft-deleted or suspended.

---

## 10. Query Patterns — What Developers Must Follow

### ✅ CORRECT Patterns

```typescript
// Correct: service always receives institute_id from RequestContext
async findStudents(instituteId: string) {
  return this.prisma.student.findMany({
    where: { institute_id: instituteId }
  });
}

// Correct: finding by ID must ALWAYS include institute_id
async findStudentById(instituteId: string, studentId: string) {
  return this.prisma.student.findFirst({
    where: {
      id: studentId,
      institute_id: instituteId   // ← MANDATORY
    }
  });
}
```

### ❌ FORBIDDEN Patterns

```typescript
// FORBIDDEN: findUnique by id alone — can access any tenant's data
async findStudentById(studentId: string) {
  return this.prisma.student.findUnique({
    where: { id: studentId }   // ← NO institute_id = DATA LEAK
  });
}

// FORBIDDEN: findMany without institute_id — returns ALL tenants' data
async findAllStudents() {
  return this.prisma.student.findMany();   // ← CATASTROPHIC
}
```

> **Code review rule:** Any PR that contains `findUnique({ where: { id } })` on a
> tenant-scoped table WITHOUT `institute_id` must be **blocked from merging**.

---

## 11. Cross-Tenant Foreign Key References

Some tenant-scoped tables reference entities from other tenant-scoped tables (e.g., `batches` references `courses`).

**Rule:** When querying across a relationship, **both sides must include `institute_id`** in the join condition.

```typescript
// Correct: join explicitly scoped to the same institute
async findBatchesWithCourse(instituteId: string) {
  return this.prisma.batch.findMany({
    where: { institute_id: instituteId },
    include: {
      course: {
        where: { institute_id: instituteId }  // ← Also scope the join
      }
    }
  });
}
```

> In practice, if the FK relationship is correct (batch.institute_id = course.institute_id),
> and the Prisma middleware is active, the join will already be scoped correctly.
> The explicit include where is a defensive coding practice.

---

## 12. Performance Implications

Row-level isolation has real performance implications that must be planned for:

### Index Requirements

Every tenant table needs these indexes as a minimum:

```sql
CREATE INDEX idx_{table}_institute    ON {table}(institute_id);
CREATE INDEX idx_{table}_institute_id ON {table}(institute_id, id);
```

Domain-specific compound indexes (added as needed during API design):

```sql
-- Students: find by email within institute
CREATE UNIQUE INDEX idx_students_email ON students(institute_id, email);

-- Batches: list all batches for a course within an institute
CREATE INDEX idx_batches_course ON batches(institute_id, course_id);

-- Payments: list payments for a date range within institute
CREATE INDEX idx_payments_date ON payments(institute_id, created_at);
```

### Partition Strategy (Phase 2 consideration)

If a single institute grows very large (unlikely in Phase 1), PostgreSQL table partitioning by `institute_id` can be applied without any application code changes — the table taxonomy and indexes are already partition-ready.

---

## 13. What This Decision Unblocks

| Unblocked Work              | Why                                                                            |
| --------------------------- | ------------------------------------------------------------------------------ |
| **Database schema design**  | Every table's structure is now known — add `institute_id NOT NULL` + index     |
| **Prisma schema file**      | Can start writing `schema.prisma` with correct model patterns                  |
| **NestJS service patterns** | All service methods know they receive `instituteId` from context               |
| **API design**              | Every endpoint knows its query scope                                           |
| **Sprint 1 database setup** | Can write the initial Prisma migration                                         |
| **ORM selection**           | Confirms Prisma as the correct choice (schema-per-tenant would have killed it) |

---

## 14. Summary of Key Decisions

| Decision               | Choice                                          | Rationale                                              |
| ---------------------- | ----------------------------------------------- | ------------------------------------------------------ |
| Isolation strategy     | Row-Level (single schema)                       | Prisma compatible, Railway compatible, cost-effective  |
| institute_id column    | `UUID NOT NULL REFERENCES institutes(id)`       | FK integrity enforced at DB level                      |
| ON DELETE behavior     | `RESTRICT`                                      | Cannot delete institute while data exists              |
| Primary safety net     | Prisma middleware (auto-inject)                 | Application-level, developer-transparent               |
| Secondary safety net   | PostgreSQL RLS                                  | Database-level, independent of application             |
| Third safety net       | Integration tests                               | CI/CD enforcement                                      |
| Compound index order   | `(institute_id, other_col)`                     | institute_id always leftmost                           |
| Email uniqueness       | Per-institute `@@unique([institute_id, email])` | Same email allowed across institutes                   |
| Platform Admin scoping | Skip institute_id injection                     | Separate guard ensures only PLATFORM_ADMIN can trigger |
| Tenant deletion        | Soft-delete only (Phase 1)                      | Safety, reversibility                                  |
| New tenant onboarding  | Single atomic transaction                       | No partial state                                       |
