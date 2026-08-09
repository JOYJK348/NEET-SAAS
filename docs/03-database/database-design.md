# 🗄️ Database Design Standards & Protocols

> **Document Type:** Architecture Standard (ADR-Complement)  
> **Target Engine:** PostgreSQL 16+ · Prisma ORM 5+  
> **Status:** 🟢 Decided & Locked  
> **Author:** Architecture Review (15+ Years Architect Guideline)

---

## 📖 Purpose

This document defines the strict, non-negotiable database design standards and schema guidelines for the Coaching Management Platform.

All database changes, Prisma schema files, and SQL migration files **MUST** conform to these rules. Any schema pull request that violates these rules will fail code review automatically.

---

## 🛠️ 1. Naming & Case Strategy

PostgreSQL is case-insensitive by default and wraps camelCase in double quotes, leading to messy raw SQL queries. To prevent this, we enforce a strict mapping between database-level names and Prisma model declarations.

### 1.1 Database-Level (PostgreSQL)

- **Tables:** Plural and `snake_case` (e.g., `student_admissions`, `batches`, `live_classes`).
- **Columns:** Singular and `snake_case` (e.g., `admission_number`, `tenant_id`).
- **Foreign Keys:** End with `_id` suffix (e.g., `student_admission_id`, `batch_id`).
- **Indexes:** Prefixed with `idx_` followed by table name and indexed columns (e.g., `idx_student_admissions_tenant_course`).
- **Unique Constraints:** Prefixed with `uq_` followed by table and columns (e.g., `uq_student_admissions_tenant_id`).

### 1.2 Application-Level (Prisma Schema)

- **Models:** Plural `PascalCase` matching PostgreSQL table identifiers (e.g., `Institutes`, `Batches`, `StudentAdmissions`, `LiveClasses`).
- **Fields:** `camelCase` identifiers in Prisma schema mapping to mapped column keys (e.g., `tenantId`, `academicYearId`, `createdAt`).
- **Relations:** `camelCase` relation field names linking models through named relations (e.g., `tenant`, `course`, `academicYear`).

#### Standard Model Definition Example (from `schema.prisma`):

```prisma
model Batches {
  id                 String          @id @default(uuid())
  tenantId           String
  branchId           String
  courseId           String
  academicYearId     String
  deliveryTypeId     String
  code               String
  name               String
  description        String
  status             BatchStatusType
  maxStudents        Int             @default(40)
  startDate          DateTime
  endDate            DateTime
  startTime          String?
  endTime            String?
  allowNewAdmissions Boolean         @default(true)
  isActive           Boolean         @default(true)
  isSystem           Boolean         @default(false)
  createdAt          DateTime        @default(now())
  createdBy          String
  updatedAt          DateTime        @default(now())
  updatedBy          String
  deletedAt          DateTime?
  deletedBy          String?
  version            Int             @default(1)
  
  tenant             Institutes      @relation("tenant_id_to_institutes", fields: [tenantId], references: [id])
  course             Courses         @relation("batches_course_id_to_courses", fields: [courseId], references: [id])

  @@unique([tenantId, id])
  @@index([tenantId, code])
}
```

---

## 🔑 2. Primary Keys & Identity Protocol

1.  **UUID Primary Keys:** Every table uses **UUID String** as its primary key (`id String @id @default(uuid())`).
    - _Why?_ Auto-incrementing integers (`SERIAL` / `BIGINT`) expose the system to ID enumeration attacks. UUIDs make IDs unguessable across distributed nodes.
2.  **Prisma Generator Default:** Primary key fields are specified using `@id @default(uuid())` or `@default(dbgenerated("gen_random_uuid()"))`.
3.  **Junction Tables:** Do not use composite primary keys `PRIMARY KEY (A_id, B_id)` on junction tables. Always use a single surrogate `id String @id @default(uuid())` and enforce uniqueness via `@@unique([tenantId, A_id, B_id])` or `@@unique([tenantId, id])` constraints.

---

## 🔒 3. Tenant Isolation Indexing Rules

Every tenant-scoped model **must** include a `tenantId String` column pointing to the `Institutes` model via `tenant Institutes @relation("tenant_id_to_institutes", fields: [tenantId], references: [id])`. To enforce multi-tenant isolation, performance, and security:

1.  **Leftmost Index Rule:** Every lookup index on a tenant-scoped table must include `tenantId` as the **leftmost (first)** column.
    ```prisma
    // ✅ CORRECT - PostgreSQL filters out other tenants first
    @@index([tenantId, code])
    @@index([tenantId, slug])

    // ❌ INCORRECT - index scan will bleed across other tenants
    @@index([code, tenantId])
    ```
2.  **Unique Constraint Scoping:** Any unique constraint must include `tenantId`.
    ```prisma
    // ✅ CORRECT - Unique within the same institute tenant
    @@unique([tenantId, id])
    @@unique([tenantId, code])

    // ❌ INCORRECT - Globally unique across tenants
    @@unique([code])
    ```

---

## 🌊 4. Referential Integrity & Deletion Protocols

1.  **Restricted & Explicit Relations:**
    - Primary relations link back to `Institutes` via named relations (e.g. `@relation("tenant_id_to_institutes", fields: [tenantId], references: [id])`).
    - Deleting an `Institute` tenant must NEVER cascade delete core transactional records like `payments`, `attendance_records`, or `exam_attempts`.
2.  **Standardized Soft Delete Pattern:**
    - Core business entities (`StudentAdmissions`, `Batches`, `Courses`, `LiveClasses`) support soft delete tracking using audit columns:
      ```prisma
      deletedAt DateTime?
      deletedBy String?
      ```
    - Primary state tracking uses explicit domain `status` Enums (e.g., `BatchStatusType`, `AttendanceSessionStatusEnum`, `ExamPublishStatusEnum`).

---

## 📅 5. Datetime & Audit Trail Protocols

1.  **Timestamptz (UTC):** All timestamps are stored in UTC format.
2.  **Presentation Separation:** The database stores UTC timestamps (`DateTime`). Timezone conversions (e.g., Indian Standard Time `Asia/Kolkata`) are handled at the presentation/API level.
3.  **Mandatory Audit Footprint:** Every model in `schema.prisma` includes the standardized audit suite:
    ```prisma
    createdAt DateTime  @default(now())
    createdBy String
    updatedAt DateTime  @default(now())
    updatedBy String
    deletedAt DateTime?
    deletedBy String?
    version   Int       @default(1)
    ```

---

## 📈 6. Data Types & Precision Standards

- **Money & Currency (Fees, Billing):** Never use `Float` for financial transactions. Always use `Decimal` with fixed precision:
  ```prisma
  amount Decimal @db.Decimal(10, 2)
  ```
- **Marks & Scores:** Use `Decimal(5, 2)` to support negative markings or decimal scores (e.g., `4.25` or `-1.33`):
  ```prisma
  marks Decimal @db.Decimal(5, 2)
  ```
- **Native Prisma ENUMs:** Always use native Enums for predefined static domain states (e.g., `BatchStatusType`, `AttendanceSessionStatusEnum`, `ExamPublishStatusEnum`, `LiveClassStatusEnum`).

---

## 🔍 7. Index Optimization & Guardrails

- **Index Primary Keys & Foreign Keys:** Ensure foreign keys (`tenantId`, `branchId`, `courseId`, `batchId`) are indexed with `tenantId` leftmost.
- **Composite Uniqueness:** Combine `tenantId` and business unique identifiers into compound unique directives:
  ```prisma
  @@unique([tenantId, id])
  @@unique([tenantId, code])
  ```

---

## 🚀 8. Migration & Schema Workflow

- **Prisma Migrations:** All production schema changes are applied via versioned Prisma migration scripts (`pnpm prisma migrate dev` / `pnpm prisma migrate deploy`).
- **Single Source of Truth:** `packages/database/prisma/schema.prisma` is the single source of truth for all database models, relations, and TypeScript client definitions across the monorepo.

