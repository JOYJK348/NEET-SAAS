# Sprint 1 — Student Module Foundation

> **Commits:** `2b83134` + `307dbae`  
> **Branch:** `feature/people`  
> **Goal:** Full CRUD for students with pagination, age validation, academic status state machine, and tenant isolation.

---

## 1. What Was Done

Built the complete **Students bounded context** including:

- CRUD endpoints (create, read paginated, read by ID, update, soft delete)
- Age validation rule (15–25 years)
- Academic status state machine (`ENQUIRY → ACTIVE → SUSPENDED | WITHDRAWN → ALUMNI`)
- Duplicate email/phone detection per tenant
- `$transaction` for update operations
- Tenant-scoped queries throughout

---

## 2. Files Created

| File                                           | Purpose                                                                |
| ---------------------------------------------- | ---------------------------------------------------------------------- |
| `modules/students/students.module.ts`          | Module registration, imports `PeopleModule`, exports `StudentsService` |
| `modules/students/students.controller.ts`      | REST controller with CRUD endpoints + Swagger docs                     |
| `modules/students/students.service.ts`         | All business logic, validation calls, transaction management           |
| `modules/students/students.validation.ts`      | Pure validation functions (age, academic status, duplicates)           |
| `modules/students/dto/create-student.dto.ts`   | Create DTO with class-validator decorators                             |
| `modules/students/dto/update-student.dto.ts`   | Partial update DTO                                                     |
| `modules/students/dto/student-response.dto.ts` | Response DTO (excludes sensitive fields)                               |

---

## 3. APIs Added

| Method   | Route                  | Auth         | Description                     |
| -------- | ---------------------- | ------------ | ------------------------------- |
| `POST`   | `/api/v1/students`     | JWT + Tenant | Create student                  |
| `GET`    | `/api/v1/students`     | JWT + Tenant | Paginated list with search/sort |
| `GET`    | `/api/v1/students/:id` | JWT + Tenant | Get single student              |
| `PATCH`  | `/api/v1/students/:id` | JWT + Tenant | Update student                  |
| `DELETE` | `/api/v1/students/:id` | JWT + Tenant | Soft delete student             |

### Controller Pattern

```typescript
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller({ path: 'students', version: '1' })
```

All endpoints receive `tenantId` from `@CurrentUser()`, never from request body.

---

## 4. Business Rules

### Age Validation

```typescript
// students.validation.ts
validateStudentAge(dob: Date): void
```

- Rejects if age < 15 or age > 25
- Uses date-of-birth calculation against current date
- Throws `BadRequestException` with descriptive message

### Academic Status State Machine

```
ENQUIRY ──► ACTIVE ──► SUSPENDED ──► ACTIVE (allowed)
              │             │
              ▼             ▼
           WITHDRAWN     ALUMNI
              │             │
              ▼             ▼
          (terminal)    (terminal)
```

| From      | To        | Allowed? |
| --------- | --------- | -------- |
| ENQUIRY   | ACTIVE    | ✅       |
| ACTIVE    | SUSPENDED | ✅       |
| ACTIVE    | WITHDRAWN | ✅       |
| SUSPENDED | ACTIVE    | ✅       |
| SUSPENDED | ALUMNI    | ❌       |
| WITHDRAWN | any       | ❌       |
| ALUMNI    | any       | ❌       |

### Duplicate Detection

- Email uniqueness: per tenant + non-deleted
- Phone uniqueness: per tenant + non-deleted
- Checked before create and update (excluding self)

### Tenant Isolation

Every query uses `this.tenantScoped.buildWhere(tenantId, {...})` to ensure cross-tenant data leakage is impossible.

---

## 5. Database Schema Changes

- Added `AcademicStatusEnum.ENQUIRY` to the Prisma enum (was missing previously)
- Migration amended into `20260715211823_people_shared_infrastructure`

---

## 6. Tests

**Location:** `modules/students/students.service.spec.ts`

**Total Tests:** ~30+

### Test Categories

| Category                 | What It Tests                                                                                                   |
| ------------------------ | --------------------------------------------------------------------------------------------------------------- |
| **Create**               | Successful creation, duplicate email/phone rejection, invalid age, missing required fields, rollback on failure |
| **Find All**             | Paginated results, empty results, search filtering, sorting                                                     |
| **Find One**             | Existing student, not found (404)                                                                               |
| **Update**               | Successful update, partial update, duplicate detection during update                                            |
| **Remove**               | Soft delete sets `deletedAt`, second read returns 404                                                           |
| **Academic Status**      | Valid transitions, invalid transitions, same-status rejection                                                   |
| **Age Validation**       | Under 15 rejected, over 25 rejected, boundary values accepted                                                   |
| **Tenant Isolation**     | Cross-tenant queries return empty/null                                                                          |
| **Transaction Rollback** | Simulated DB failure inside `$transaction` reverts all changes                                                  |

---

## 7. Smoke Test

```bash
pnpm lint       # 0 errors
pnpm typecheck  # clean
pnpm build      # api + web passed
pnpm test       # all student tests green
```
