# 🗄️ Database Design Standards & Protocols

> **Document Type:** Architecture Standard (ADR-Complement)  
> **Target Engine:** PostgreSQL 16+ · Prisma ORM 5+  
> **Status:** 🟢 Decided & Locked  
> **Author:** Architecture Review (15+ Years Architect Guideline)

---

## 📖 Purpose

This document defines the strict, non-negotiable database design standards and schema guidelines for the Coaching Management Platform.

All future database changes, Prisma schema files, and SQL migration files **MUST** conform to these rules. Any schema pull request that violates these rules will fail code review automatically.

---

## 🛠️ 1. Naming & Case Strategy

PostgreSQL is case-insensitive by default and wraps camelCase in double quotes, leading to messy raw SQL queries. To prevent this, we enforce a strict separation between database-level names and application-level code names.

### 1.1 Database-Level (PostgreSQL)
*   **Tables:** Plural and `snake_case` (e.g., `student_enrollments`, `question_banks`).
*   **Columns:** Singular and `snake_case` (e.g., `enrolled_at`, `institute_id`).
*   **Foreign Keys:** End with `_id` suffix (e.g., `student_id`, `batch_id`).
*   **Indexes:** Prefixed with `idx_` followed by table name and indexed columns (e.g., `idx_enrollments_institute_student`).
*   **Unique Constraints:** Prefixed with `uq_` followed by table and columns (e.g., `uq_enrollments_student_course_batch`).

### 1.2 Application-Level (Prisma Schema)
*   **Models:** Singular and `PascalCase` (e.g., `StudentEnrollment`).
*   **Relations:** Singular/Plural `camelCase` depending on cardinality (e.g., `studentEnrollment`, `attendanceRecords`).
*   **Directives:** Model names must explicitly map to snake_case tables using `@@map("table_name")`. Columns must map via `@map("column_name")` if they differ from camelCase fields.

#### Example Model Definition:
```prisma
model StudentEnrollment {
  id              String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  instituteId     String   @map("institute_id") @db.Uuid
  studentId       String   @map("student_id") @db.Uuid
  courseId        String   @map("course_id") @db.Uuid
  batchId         String   @map("batch_id") @db.Uuid
  enrolledAt      DateTime @default(now()) @map("enrolled_at") @db.Timestamptz(6)
  
  // Relations
  institute       Institute @relation(fields: [instituteId], references: [id], onDelete: Restrict)
  student         Student   @relation(fields: [studentId], references: [id], onDelete: Restrict)

  @@map("student_enrollments") // ← MANDATORY snake_case mapping
  @@index([instituteId, studentId], name: "idx_enrollments_inst_student")
  @@unique([instituteId, studentId, courseId, batchId], name: "uq_enrollments_student_course_batch")
}
```

---

## 🔑 2. Primary Keys & Identity Protocol

1.  **UUID Primary Keys:** Every table must use **UUID** as its primary key.
    *   *Why?* Auto-incrementing integers (`SERIAL` / `BIGINT`) expose the system to ID enumeration attacks. UUIDs make IDs unguessable.
2.  **PostgreSQL Engine Generation:** Define primary keys in Prisma using `@default(dbgenerated("gen_random_uuid()")) @db.Uuid`. This ensures the database generates the key natively instead of forcing Prisma to make an extra roundtrip. (Letting PostgreSQL generate UUIDs dynamically allows future support of newer UUID variants).
3.  **Junction Tables:** Do not use composite primary keys `PRIMARY KEY (A_id, B_id)` on junction tables. Always use a single surrogate `id UUID PRIMARY KEY` and enforce uniqueness via a `@@unique([A_id, B_id])` constraint.
    *   *Why?* Many GraphQL/REST API builders and ORMs handle single surrogate primary keys significantly better than composite keys.

---

## 🔒 3. Tenant Isolation Indexing Rules

Every tenant-scoped table **must** include an `institute_id UUID` column pointing to the `institutes` table. To enforce RLS performance and security, follow these rules:

1.  **Leftmost Index Rule:** Every lookup index on a tenant-scoped table must include `institute_id` as the **leftmost (first)** column.
    ```prisma
    // ✅ CORRECT - PostgreSQL filters out other tenants first
    @@index([institute_id, id])
    @@index([institute_id, status])
    
    // ❌ INCORRECT - index scan will bleed across other tenants
    @@index([status, institute_id])
    ```
2.  **Unique Constraint Scoping:** Any unique constraint (e.g. unique student email, unique transaction number) must include `institute_id`.
    ```prisma
    // ✅ CORRECT - Email unique within the same institute, allows user to exist in multiple institutes
    @@unique([institute_id, email])
    
    // ❌ INCORRECT - Email globally unique, blocks users joining other institutes
    @@unique([email])
    ```

---

## 🌊 4. Referential Integrity & Deletion Protocols

To prevent orphaned rows and accidental bulk data loss, deletion behaviors must follow strict guidelines:

1.  **Restricted Deletions (`onDelete: Restrict`):**
    *   Applying `ON DELETE RESTRICT` is the **default rule** for all primary business entities (e.g., deleting a Course should fail if students are enrolled in it).
    *   Deleting an `Institute` must NEVER cascade delete core transactional records like `payments` or `attendance_records`. These must be explicitly archived or deleted via admin script.
2.  **Cascade Deletions (`onDelete: Cascade`):**
    *   Allowed **ONLY** for private child records that cannot exist without their parent.
    *   *Allowed example:* `QuestionPaper` → `QuestionPaperQuestion` (junction entity). If the paper is deleted, it is safe to cascade delete its question-mapping rows.
    *   *Allowed example:* `User` → `LoginSession`. If a user is deleted, delete their sessions.
3.  **Standardized Soft Delete Pattern:**
    *   Core business entities (`Student`, `Tutor`, `Course`, `Batch`) must not support physical SQL `DELETE` calls.
    *   Standardize on a domain-specific `status` column mapping to a PostgreSQL `ENUM` (e.g. `ACTIVE`, `INACTIVE`, `ARCHIVED`, `DROPPED`, `COMPLETED`).
    *   Avoid binary boolean `is_active` fields for primary business models, as business lifecycles almost always expand beyond two states.

---

## 📅 5. Datetime & Audit Trail Protocols

1.  **Timestamptz (UTC):** All timestamps must be stored as `TIMESTAMP WITH TIME ZONE` (`DateTime @db.Timestamptz(6)` in Prisma).
2.  **UTC Only:** The database engine timezone must be set to `UTC`.
3.  **Presentation Separation:** The database never handles local timezone formatting (e.g. Indian Standard Time). Timezone conversions must be done at the API client or frontend level.
4.  **Audit Columns:** Every table must have audit columns:
    ```prisma
    created_at DateTime @default(now()) @db.Timestamptz(6) @map("created_at")
    updated_at DateTime @updatedAt @db.Timestamptz(6) @map("updated_at")
    ```
5.  **Creator References (Optional but Recommended):** For primary configuration and content models (e.g., `Course`, `Subject`, `Assessment`), include direct creator references:
    ```prisma
    created_by String? @map("created_by") @db.Uuid
    updated_by String? @map("updated_by") @db.Uuid
    ```
    This provides an immediate audit footprint on the row itself, bypassing heavy joins on system audit tables.

---

## 📈 6. Data Types & Precision Standards

*   **Money & Currency (Fees, Payments):** Never use `Float` or `Real` for financial amounts (due to floating-point rounding errors). Always use `Decimal` with fixed precision:
    ```prisma
    amount Decimal @db.Decimal(10, 2) // Supports up to 99,999,999.99
    ```
*   **Assessment Marks:** Use `Decimal(5, 2)` to support half or quarter marks (e.g., `4.25` or `-1.33` for negative markings) without rounding loss:
    ```prisma
    marks Decimal @db.Decimal(5, 2)
    ```
*   **PostgreSQL Native ENUM Strategy:**
    *   Always use database-level native enums for columns with predefined, static business states (e.g. `Role`, `Gender`, `AttendanceStatus`, `PaymentStatus`). Do not store them as free text.
    *   *Example in Prisma:*
        ```prisma
        enum AttendanceStatus {
          PRESENT
          ABSENT
          LATE
          EXCUSED
          @@map("attendance_status")
        }
        ```
*   **JSONB Only for Documents:**
    *   Any dynamic payload, settings object, metadata bag, or rich configuration must use PostgreSQL `JSONB` data type (`Json @db.JsonB` in Prisma).
    *   *Why?* `JSONB` stores data in a decomposed binary format, enabling GIN (Generalized Inverted Index) indexing and fast search evaluations. Never use plain `JSON` in PostgreSQL.

---

## 🔍 7. Index Optimization & Guardrails

*   **Do Not Over-Index:** Every index created adds a write/insert performance tax (Postgres must update the B-Tree on every insert, update, or delete).
*   **Query-Driven Indexes:** Do not add database indexes speculatively. Only introduce indexes when:
    1.  The column is a foreign key (`_id`).
    2.  The column is actively used in a search filter (`WHERE` / `AND`) or joining query.
    3.  The column is used for ordering list results (`ORDER BY`).
*   **Composite Index Column Ordering:** When defining a multi-column index, place the most selective filter column first. For tenant tables, `institute_id` is always leftmost.

---

## 🚀 8. Protocol for Schema Migrations

*   **No Manual Production Alterations:** Developers must never run manual `ALTER TABLE` commands on live databases. All changes must be packaged into Prisma migrations.
*   **Migration Naming Scheme:** Use descriptive names for database changes:
    *   `20260708000000_init_auth`
    *   `20260708123000_add_attendance_records`
*   **Destructive Migration Guard:** If a migration contains a column drop or type change that might cause data loss, the migration script must include a data preservation step (copying to temporary storage or transforming column values first) before execution.
