# Sprint 3 — Admissions Module (S3-003)

> **Commits:** `8cd777b` + `ddee7c5` + `992a92f`  
> **Branch:** `feature/people`  
> **Goal:** Full admission lifecycle — creation, reads, status management, business rules, validation service.

---

## 1. What Was Done

Implemented the complete **Admissions bounded context** across three sub-sprints:

| Sub-Sprint | Commit    | What                                                                  |
| ---------- | --------- | --------------------------------------------------------------------- |
| S3-003.1   | `8cd777b` | Admission creation with number generator, validations, `$transaction` |
| S3-003.2   | `ddee7c5` | Read APIs (list, current, detail), status update + history            |
| S3-003.3   | `992a92f` | Terminal state guards, one-active rule, batch eligibility validator   |

---

## 2. Files Created

| File                                               | Purpose                                                                             |
| -------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `admissions/admissions.module.ts`                  | Module registration                                                                 |
| `admissions/admissions.service.ts`                 | Core business logic                                                                 |
| `admissions/admissions.validation.ts`              | Shared validation helpers (transitions, terminals, active check, batch eligibility) |
| `admissions/admissions-student.controller.ts`      | Student-scoped routes                                                               |
| `admissions/admission-item.controller.ts`          | Admission-scoped routes                                                             |
| `admissions/utils/admission-number-generator.ts`   | Sequential number generator `{YEAR}-{000001}`                                       |
| `admissions/dto/create-admission.dto.ts`           | Create DTO                                                                          |
| `admissions/dto/admission-response.dto.ts`         | Response DTO                                                                        |
| `admissions/dto/update-admission-status.dto.ts`    | Status update DTO                                                                   |
| `admissions/dto/admission-history-response.dto.ts` | History response DTO                                                                |
| `admissions/index.ts`                              | Barrel exports for cross-module use                                                 |

---

## 3. APIs Added

### Student-Scoped Routes (`/students/:studentId/admissions`)

| Method | Route                 | Description                                |
| ------ | --------------------- | ------------------------------------------ |
| `POST` | `/admissions`         | Create new admission                       |
| `GET`  | `/admissions`         | Paginated list of admissions for a student |
| `GET`  | `/admissions/current` | Get highest-priority active admission      |

### Admission-Scoped Routes (`/admissions/:admissionId`)

| Method  | Route                              | Description                               |
| ------- | ---------------------------------- | ----------------------------------------- |
| `GET`   | `/admissions/:admissionId`         | Full admission details with history count |
| `PATCH` | `/admissions/:admissionId/status`  | Update admission status                   |
| `GET`   | `/admissions/:admissionId/history` | Chronological status change history       |

---

## 4. Status Lifecycle

```
                ┌─── CANCELLED (terminal)
                │
PENDING ───► CONFIRMED ───► ACTIVE ───► COMPLETED (terminal)
                │
                └─── CANCELLED (terminal)
```

| Transition            | Allowed?    |
| --------------------- | ----------- |
| PENDING → CONFIRMED   | ✅          |
| PENDING → CANCELLED   | ✅          |
| CONFIRMED → ACTIVE    | ✅          |
| CONFIRMED → CANCELLED | ✅          |
| ACTIVE → COMPLETED    | ✅          |
| COMPLETED → any       | ❌ terminal |
| CANCELLED → any       | ❌ terminal |

---

## 5. Business Rules

### Rule 1: Admission Number Auto-Generation

```typescript
// admission-number-generator.ts
generate(tenantId, academicYearId) → "2026-000001"
```

- Format: `{academicYearStartYear}-{6-digit-sequence}`
- Sequence resets per academic year
- Queries last admission number starting with `{year}-` to determine next sequence

### Rule 2: Duplicate Active Admission Prevention

At **creation time**, prevents more than one admission with status in `[PENDING, CONFIRMED, ACTIVE]` for the same student+year+tenant.

### Rule 3: Terminal State Guard

`validateTerminalState()` — called at the start of every `updateStatus()`:

- If current status is `COMPLETED` or `CANCELLED`, throws `BadRequestException`
- No further status updates allowed

### Rule 4: One Active Admission Rule

`validateActiveAdmission()` — called inside `$transaction` when transitioning to ACTIVE:

- Checks no other admission with `status === ACTIVE` exists for same student+year+tenant
- Excludes the current admission from the check (self-comparison)
- Throws `ConflictException` if duplicate found

### Rule 5: Batch Eligibility

`validateBatchEligibility(admissionStatus)` — reusable by future Batch module:

- Only `ACTIVE` status passes
- All other statuses throw `BadRequestException`
- Exported via `admissions/index.ts` for cross-module import

### Rule 6: Transaction Integrity

All status updates use `Prisma.$transaction()`:

1. Validate terminal state
2. Validate transition (state machine)
3. Validate one-active rule (if transitioning to ACTIVE)
4. Update admission status
5. Create `AdmissionStatusHistory` record
6. If any step fails → full rollback

---

## 6. Validation Helpers (`admissions.validation.ts`)

| Function                                                     | When Called                 | Throws                |
| ------------------------------------------------------------ | --------------------------- | --------------------- |
| `validateAdmissionStatusTransition(from, to)`                | Every status update         | `BadRequestException` |
| `validateTerminalState(status)`                              | Every status update (first) | `BadRequestException` |
| `validateActiveAdmission(studentId, tenantId, yearId, opts)` | Before CONFIRMED→ACTIVE     | `ConflictException`   |
| `validateBatchEligibility(status)`                           | Batch module (external)     | `BadRequestException` |

---

## 7. Tests

**Location:** `modules/admissions/admissions.service.spec.ts`

**Total Tests:** ~76 (shared with earlier sprints)

### Test Categories

| Category              | Tests                                                                                                                  |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Create**            | Success, student not found, duplicate admission, academic year inactive, course/branch not found, transaction rollback |
| **Find All**          | Paginated list, student not found                                                                                      |
| **Find Current**      | Priority order (ACTIVE > CONFIRMED > PENDING), not found                                                               |
| **Find One**          | With history count, not found                                                                                          |
| **Update Status**     | Each valid transition, invalid transition, same status, not found, rollback                                            |
| **Terminal State**    | COMPLETED rejects updates, CANCELLED rejects updates                                                                   |
| **Duplicate ACTIVE**  | Rejected when another ACTIVE exists, allowed when unique                                                               |
| **Batch Eligibility** | ACTIVE passes, PENDING/CONFIRMED/COMPLETED/CANCELLED all rejected                                                      |
| **Full Lifecycle**    | PENDING → CONFIRMED → ACTIVE → COMPLETED end-to-end                                                                    |
| **Tenant Isolation**  | Queries scoped to tenant via mock                                                                                      |

---

## 8. Smoke Test

```bash
pnpm lint       # 0 errors
pnpm typecheck  # clean
pnpm build      # passed
pnpm test       # 76/76 passing
```
