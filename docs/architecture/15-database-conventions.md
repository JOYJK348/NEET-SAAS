# Database Conventions — Prisma Schema Generation

> **Status:** 🔒 FROZEN  
> **Date:** July 13, 2026  
> **Purpose:** Lock all naming/type/relationship conventions before Prisma schema generation. Every rule must be applied consistently across 200+ tables.

---

## 1. Naming Conventions

### Database Level (PostgreSQL)
| Artifact | Convention | Example |
|----------|-----------|---------|
| Tables | Plural `snake_case` | `student_profiles`, `fee_structures` |
| Columns | Singular `snake_case` | `student_code`, `total_marks` |
| Foreign Keys | `referenced_table_singular_id` | `course_id`, `tenant_id` |
| Indexes | `idx_{table}_{columns}` | `idx_fee_structures_tenant_course` |
| Unique Indexes | `uq_part_{table}_{columns}` | `uq_part_students_tenant_code` |
| Primary Key | `id` | — |

### Prisma Level
| Artifact | Convention | Example |
|----------|-----------|---------|
| Models | Singular `PascalCase` | `StudentProfile`, `FeeStructure` |
| Fields | `camelCase` | `studentCode`, `totalMarks` |
| Relations | `camelCase` | `course`, `feeStructureItems` |
| Enum Names | `PascalCase` | `ExamType`, `UserType` |
| Enum Values | `UPPER_SNAKE_CASE` | `WEEKLY`, `FULL_SYLLABUS` |

Every Prisma model must use:
- `@@map("snake_case_table_name")`
- `@map("snake_case_column_name")` for every field
- `@@index([fields], name: "idx_name")` for indexes

---

## 2. Primary Key Strategy

| Rule | Value |
|------|-------|
| Type | `String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid` |
| Map | `@map("id")` |
| Generator | `gen_random_uuid()` (standard PG, no custom function) |

**Exception:** Tables using composite PKs or user_id as PK (like `student_profiles` where `user_id` is PK) retain their natural PK.

---

## 3. Foreign Key Naming

Standard pattern: `fk_{table}_{referenced_table}`
```
fk_student_profiles_tenant        → tenant_id REFERENCES institutes(id)
fk_student_profiles_user          → user_id REFERENCES users(id)
```

Composite FKs (tenant-scoped):
```
fk_fee_structures_course_tenant   → (tenant_id, course_id) REFERENCES courses(tenant_id, id)
```

**Prisma relation naming:**
- Singular: belongs-to relation (`course`, `tenant`)
- Plural: has-many relation (`feeStructureItems`, `payments`)
- Explicit `@relation` name with FK field reference

---

## 4. Standard Audit Columns

Every table **must** include:

```prisma
createdAt  DateTime  @default(now()) @db.Timestamptz(6) @map("created_at")
createdBy  String?   @map("created_by") @db.Uuid
updatedAt  DateTime  @updatedAt @db.Timestamptz(6) @map("updated_at")
updatedBy  String?   @map("updated_by") @db.Uuid
deletedAt  DateTime? @map("deleted_at") @db.Timestamptz(6)
deletedBy  String?   @map("deleted_by") @db.Uuid
version    Int       @default(1) @map("version")
```

**Optional:** `metadata Json? @map("metadata") @db.JsonB`

---

## 5. Tenant Isolation Column

Every tenant-scoped table must have:
```prisma
tenantId  String  @map("tenant_id") @db.Uuid
```

Tenant must be the **leftmost** column in all composite indexes.

---

## 6. Domain Type → Prisma Type Mapping

| PostgreSQL Domain | Prisma Type |
|------------------|-------------|
| `email_address` (CITEXT) | `String @db.VarChar(255)` |
| `phone_number` (VARCHAR(20)) | `String @db.VarChar(20)` |
| `currency_code` (CHAR(3)) | `String @db.VarChar(3)` |
| `percentage` (NUMERIC(5,2)) | `Decimal @db.Decimal(5, 2)` |
| `positive_amount` (NUMERIC(12,2)) | `Decimal @db.Decimal(12, 2)` |
| `latitude` (NUMERIC(9,6)) | `Decimal @db.Decimal(9, 6)` |
| `longitude` (NUMERIC(9,6)) | `Decimal @db.Decimal(9, 6)` |
| `color_hex` (CHAR(7)) | `String @db.VarChar(7)` |

---

## 7. PostgreSQL Type → Prisma Type Mapping

| PostgreSQL Type | Prisma Type | Attributes |
|----------------|-------------|------------|
| `UUID` | `String` | `@db.Uuid` |
| `VARCHAR(n)` | `String` | `@db.VarChar(n)` |
| `TEXT` | `String` | `@db.Text` |
| `CITEXT` | `String` | `@db.VarChar(255)` |
| `INTEGER` | `Int` | — |
| `BIGINT` | `BigInt` | — |
| `SMALLINT` | `Int` | — |
| `DECIMAL(p,s)` | `Decimal` | `@db.Decimal(p, s)` |
| `NUMERIC(p,s)` | `Decimal` | `@db.Decimal(p, s)` |
| `BOOLEAN` | `Boolean` | — |
| `DATE` | `DateTime` | `@db.Date` |
| `TIMESTAMP WITH TIME ZONE` | `DateTime` | `@db.Timestamptz(6)` |
| `TIMESTAMPTZ` | `DateTime` | `@db.Timestamptz(6)` |
| `TIME` | `DateTime` | `@db.Time` |
| `JSONB` | `Json` | `@db.JsonB` |
| `INET` | `String` | `@db.VarChar(45)` |
| `BYTEA` | `Bytes` | — |
| `REAL` | `Float` | — |
| `DOUBLE PRECISION` | `Float` | — |

---

## 8. Enum Naming Convention

```prisma
enum UserType {
  STAFF
  STUDENT
  PARENT
  TUTOR
  SYSTEM

  @@map("user_type_enum")
}
```

Every PostgreSQL enum maps to a Prisma enum with `@@map("pg_enum_name")`.

---

## 9. Soft Delete Policy

- Business tables: soft delete via `deleted_at`, `deleted_by`
- All queries must include `WHERE deleted_at IS NULL` (handled at ORM/Repository level)
- Financial tables: **no delete at all**. Corrections via reversal.
- Unique indexes use `WHERE deleted_at IS NULL` to allow tenant-level unique constraints on soft-deleted records

---

## 10. Cascade vs Restrict Rules

| Scenario | Rule |
|----------|------|
| Parent entity with mandatory child (tenant relation) | `onDelete: Restrict` |
| Parent entity with optional child | `onDelete: SetNull` |
| Junction/bridge table | `onDelete: Cascade` |
| Audit/created_by user reference | `onDelete: SetNull` |
| Financial records | `onDelete: Restrict` |

---

## 11. Composite Unique Constraints

For tenant-scoped uniqueness:
```prisma
@@unique([tenantId, code], name: "uq_table_tenant_code")
@@unique([tenantId, id], name: "uq_table_tenant_id")
```

The `uq_table_tenant_id` composite unique enables composite foreign keys from child tables.

---

## 12. Indexing Standards

- Every tenant-scoped table: `@@index([tenantId, field1, field2])` with tenantId as leftmost
- Foreign key columns: always indexed
- Status + date range queries: composite index with status first
- Text search: GIN trigram index (via raw SQL, not in Prisma)
- Soft-delete filter: `WHERE deleted_at IS NULL` partial indexes where beneficial

---

## 13. Relation Mapping in Prisma

Every FK has a corresponding relation. Naming:

```prisma
// Direct FK to users table
createdBy  String? @map("created_by") @db.Uuid
created_by User?   @relation("EntityCreatedBy", fields: [createdBy], references: [id], onDelete: SetNull)

// FK to tenant
tenantId   String  @map("tenant_id") @db.Uuid
tenant     Institute @relation(fields: [tenantId], references: [id], onDelete: Restrict)

// Composite FK (tenant_id, other_id)
courseId   String  @map("course_id") @db.Uuid
course     Course  @relation(fields: [courseId, tenantId], references: [id, tenantId], onDelete: Restrict)
```

---

## 14. Generator Function Mapping

| SQL Default | Prisma Equivalent |
|-------------|-------------------|
| `DEFAULT generate_primary_key()` | `@default(dbgenerated("gen_random_uuid()"))` |
| `DEFAULT gen_random_uuid()` | `@default(dbgenerated("gen_random_uuid()"))` |
| `DEFAULT now()` | `@default(now())` |
| `DEFAULT CURRENT_DATE` | `@default(now()) @db.Date` |
| `DEFAULT true` | `@default(true)` |
| `DEFAULT 0` | `@default(0)` |

---

## 15. Schema Scope — What Goes Into Prisma

| Include in schema.prisma | Exclude from schema.prisma |
|--------------------------|---------------------------|
| All CREATE TABLE → Prisma models | RLS policies |
| All CREATE TYPE → Prisma enums | Triggers |
| All indexes → @@index | Functions |
| All unique constraints → @@unique | Stored procedures |
| All FK constraints → Relations | Views |
| Default values | Seed data |
| Column type mappings | Check constraints (inline) |
| Proper `@@map` and `@map` | Comments |
| `@@index` with explicit names | Partition config |

---

> This document governs the automated schema.prisma generation.  
> Every SQL-to-P model conversion must follow these rules.
