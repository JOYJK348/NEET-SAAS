# Sprint 4 — Batch Enrollment Foundation (S4-001)

> **Commit:** `f9c6632`  
> **Branch:** `feature/people`  
> **Goal:** Connect an ACTIVE admission to an academic batch with full validation, capacity enforcement, primary batch switching, and tenant isolation.

---

## 1. What Was Done

Built the complete **Batch Enrollment bounded context**:

- Enroll a student into a batch (requires ACTIVE admission)
- Validate batch matches admission (academic year, course, branch)
- Enforce batch capacity (`maxStudents`)
- Prevent duplicate enrollment in same batch
- Auto-switch primary batch within `$transaction`
- Soft-delete enrollment
- List enrollments with pagination
- Get current primary batch
- Fully extracted validation layer for reuse by future modules

---

## 2. Files Created (10 files)

| File                                                         | Purpose                                                   |
| ------------------------------------------------------------ | --------------------------------------------------------- |
| `batch-enrollments/batch-enrollments.module.ts`              | Module registration, imports `PrismaModule`               |
| `batch-enrollments/batch-enrollments.service.ts`             | Core service (create, findAll, findCurrent, remove)       |
| `batch-enrollments/batch-enrollments.validation.ts`          | Shared validators (admission, batch, duplicate, capacity) |
| `batch-enrollments/batch-enrollment-admission.controller.ts` | Admission-scoped routes                                   |
| `batch-enrollments/batch-enrollment-item.controller.ts`      | Enrollment-scoped routes                                  |
| `batch-enrollments/dto/create-batch-enrollment.dto.ts`       | `batchId` + `isPrimary` (optional, default true)          |
| `batch-enrollments/dto/batch-enrollment-response.dto.ts`     | Response DTO                                              |
| `batch-enrollments/batch-enrollments.service.spec.ts`        | 19 unit tests                                             |
| `batch-enrollments/index.ts`                                 | Barrel exports                                            |

---

## 3. APIs Added

### Admission-Scoped Routes (`/admissions/:admissionId/batches`)

| Method | Route              | Description                          |
| ------ | ------------------ | ------------------------------------ |
| `POST` | `/batches`         | Enroll student into a batch          |
| `GET`  | `/batches`         | Paginated list of enrollments        |
| `GET`  | `/batches/current` | Get current primary batch enrollment |

### Enrollment-Scoped Routes (`/batch-enrollments/:id`)

| Method   | Route  | Description            |
| -------- | ------ | ---------------------- |
| `DELETE` | `/:id` | Soft-delete enrollment |

### Request/Response Examples

**POST /api/v1/admissions/:admissionId/batches**

```json
// Request
{ "batchId": "uuid", "isPrimary": true }

// Response 201
{
  "id": "uuid",
  "admissionId": "uuid",
  "batchId": "uuid",
  "joinedAt": "2026-07-16T...",
  "status": "ACTIVE",
  "isPrimary": true,
  "createdAt": "2026-07-16T...",
  "updatedAt": "2026-07-16T..."
}
```

---

## 4. Business Rules

| #   | Rule                          | Implementation                                                                           | Throws                |
| --- | ----------------------------- | ---------------------------------------------------------------------------------------- | --------------------- |
| 1   | **ACTIVE Admission Required** | Reuses `validateBatchEligibility()` from Admissions validation layer                     | `BadRequestException` |
| 2   | **Batch must be ACTIVE**      | Checks `batch.status === BatchStatusType.ACTIVE`                                         | `BadRequestException` |
| 3   | **Same Academic Year**        | `batch.academicYearId === admission.academicYearId`                                      | `BadRequestException` |
| 4   | **Same Course**               | `batch.courseId === admission.courseId`                                                  | `BadRequestException` |
| 5   | **Same Branch**               | `batch.branchId === admission.branchId`                                                  | `BadRequestException` |
| 6   | **No Duplicate Enrollment**   | Checks no active enrollment exists for same admission+batch                              | `ConflictException`   |
| 7   | **Batch Capacity**            | Counts existing ACTIVE enrollments vs `batch.maxStudents` (default: 40)                  | `ConflictException`   |
| 8   | **Primary Batch Rule**        | When `isPrimary=true`, auto-unsets previous primary in same transaction via `updateMany` | —                     |
| 9   | **Soft Delete**               | `remove()` sets `deletedAt` + `deletedBy`, does not hard delete                          | —                     |

---

## 5. Validation Layer (`batch-enrollments.validation.ts`)

| Function                                                                | Responsibility                                                                  |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `validateAdmissionForEnrollment(admissionId, tenantId, prisma)`         | Finds admission, calls `validateBatchEligibility()` from admissions module      |
| `validateBatchForEnrollment(batchId, tenantId, admission, prisma)`      | Finds batch, checks ACTIVE status, matches year/course/branch against admission |
| `validateNoDuplicateEnrollment(admissionId, batchId, tenantId, prisma)` | Checks `StudentBatchEnrollments` for existing active enrollment                 |
| `validateBatchCapacity(batchId, tenantId, prisma)`                      | Counts active enrollments vs `maxStudents`                                      |

All validators accept `prisma: any` so they work with both the regular `PrismaService` and a transaction client (`tx`).

---

## 6. Transaction Flow

```typescript
this.prisma.$transaction(async (tx) => {
  // 1. Validate admission (ACTIVE + exists)
  const admission = await validateAdmissionForEnrollment(admissionId, tenantId, tx);
  // 2. Validate batch (exists + ACTIVE + year/course/branch match)
  await validateBatchForEnrollment(dto.batchId, tenantId, admission, tx);
  // 3. Check duplicate
  await validateNoDuplicateEnrollment(admissionId, dto.batchId, tenantId, tx);
  // 4. Check capacity
  await validateBatchCapacity(dto.batchId, tenantId, tx);
  // 5. If primary=true, unset previous primary
  if (isPrimary) { await tx.studentBatchEnrollments.updateMany({...}); }
  // 6. Create enrollment
  const created = await tx.studentBatchEnrollments.create({...});
  return created;
});
```

Any failure in steps 1–6 rolls back the entire transaction.

---

## 7. Tests

**Location:** `modules/batch-enrollments/batch-enrollments.service.spec.ts`

**Total Tests:** 19

| Category                          | What It Tests                                                     | Assertions                                               |
| --------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------- |
| **Create (success)**              | Full create flow                                                  | Transaction called, create data correct, response mapped |
| **Admission not found**           | Invalid admissionId                                               | `NotFoundException`                                      |
| **Admission not ACTIVE**          | PENDING/CONFIRMED admission                                       | `BadRequestException`                                    |
| **Batch not found**               | Invalid batchId                                                   | `NotFoundException`                                      |
| **Batch not ACTIVE**              | PLANNED/COMPLETED batch                                           | `BadRequestException`                                    |
| **Year mismatch**                 | Different academicYearId                                          | `BadRequestException`                                    |
| **Course mismatch**               | Different courseId                                                | `BadRequestException`                                    |
| **Branch mismatch**               | Different branchId                                                | `BadRequestException`                                    |
| **Duplicate enrollment**          | Same admission+batch already exists                               | `ConflictException`                                      |
| **Capacity full**                 | 40/40 already enrolled                                            | `ConflictException`                                      |
| **Primary auto-unset**            | `isPrimary=true` triggers `updateMany`                            | Previous primary unset                                   |
| **Primary skip**                  | `isPrimary=false` does NOT trigger `updateMany` + stored as false | `isPrimary` returned as false                            |
| **Transaction rollback**          | Simulated DB error in create                                      | Error thrown, `$transaction` called                      |
| **FindAll (paginated)**           | List enrollments with pagination                                  | Correct count + data                                     |
| **FindAll (admission not found)** | Invalid admissionId                                               | `NotFoundException`                                      |
| **FindCurrent (success)**         | Returns primary enrollment                                        | Correct id + isPrimary                                   |
| **FindCurrent (not found)**       | No primary enrollment                                             | `NotFoundException`                                      |
| **Remove (soft delete)**          | Deletes successfully                                              | `softDelete` called with correct args                    |
| **Remove (not found)**            | Invalid enrollmentId                                              | `NotFoundException`                                      |

---

## 8. Integration with Admissions Module

The Batch Enrollment module reuses `validateBatchEligibility()` from the Admissions module via the barrel export:

```typescript
// batch-enrollments.validation.ts
import { validateBatchEligibility } from '../admissions/admissions.validation';
```

This ensures that if the admission status rules change in the future, both modules stay consistent.

---

## 9. Smoke Test

```bash
pnpm lint       # 0 errors
pnpm typecheck  # clean
pnpm build      # passed (api + web)
pnpm test       # 95/95 passing (all 13 suites)
```
