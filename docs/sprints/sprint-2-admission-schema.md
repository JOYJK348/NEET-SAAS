# Sprint 2 — Admission Schema Design

> **Commit:** `35b7dc8`  
> **Branch:** `feature/people`  
> **Goal:** Design and migrate the database schema for admission lifecycle management.

---

## 1. What Was Done

Applied a Prisma migration that restructured `StudentAdmissions` and created `AdmissionStatusHistory` to support the full admission lifecycle (PENDING → CONFIRMED → ACTIVE → COMPLETED / CANCELLED).

This was a **schema-only sprint** — no business logic, no endpoints, no tests.

---

## 2. Files Modified

| File                                                                          | Change                                                         |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `packages/database/prisma/schema.prisma`                                      | Added enum values, new model, nullable fields, composite index |
| `packages/database/prisma/migrations/20260716000000_update_admission_schema/` | Full migration with SQL                                        |

---

## 3. Schema Changes

### AdmissionStatusEnum

```prisma
enum AdmissionStatusEnum {
  PENDING
  CONFIRMED
  ACTIVE
  COMPLETED
  CANCELLED
}
```

### StudentAdmissions (updated)

| Field            | Before              | After                                                                    |
| ---------------- | ------------------- | ------------------------------------------------------------------------ |
| `feeStructureId` | `String` (required) | `String?` (nullable)                                                     |
| `remarks`        | Not present         | `String?` (nullable)                                                     |
| Index            | None                | `@@index([tenantId, studentProfileId, academicYearId, admissionStatus])` |
| Index            | None                | `@@index([tenantId, branchId])`                                          |
| Index            | None                | `@@index([tenantId, academicYearId, admissionStatus])`                   |

### AdmissionStatusHistory (new model)

```prisma
model AdmissionStatusHistory {
  id              String              @id @default(uuid())
  tenantId        String
  admissionId     String
  fromStatus      AdmissionStatusEnum
  toStatus        AdmissionStatusEnum
  changedAt       DateTime
  changedBy       String
  reason          String?
  // ... audit fields (createdAt, createdBy, updatedAt, updatedBy, deletedAt, deletedBy, version)
  // ... relations to Institutes, Users, StudentAdmissions

  @@unique([tenantId, id])
  @@index([tenantId, admissionId])
}
```

### Relationship

```
StudentAdmissions 1 ──── * AdmissionStatusHistory
```

Each status change creates an immutable audit record with `fromStatus`, `toStatus`, `changedAt`, `changedBy`, and optional `reason`.

---

## 4. Design Decisions

| Decision                                                                | Rationale                                                                                                           |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `AdmissionStatusHistory` references `Admission`, not `Student` directly | Enables per-admission audit trail; a student can have multiple admissions across years                              |
| `feeStructureId` made nullable                                          | Fee structure may be assigned later in the admission workflow                                                       |
| `remarks` added as nullable                                             | Ad-hoc notes for admission processors                                                                               |
| Status history uses `fromStatus` + `toStatus`                           | Full before/after snapshot for compliance                                                                           |
| No formal Prisma relation for `academicYearId`/`courseId`/`branchId`    | These are logical foreign keys; adding Prisma relations would require modifying those models which are out of scope |

---

## 5. Tests

**Count:** 0 (schema-only sprint)

---

## 6. Smoke Test

```bash
pnpm lint       # 0 errors
pnpm typecheck  # clean
pnpm build      # passed
```
