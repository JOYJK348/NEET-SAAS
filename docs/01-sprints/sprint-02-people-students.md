# Sprint 02 — People & Students Backend

> **Status:** ✅ Completed
> **Duration:** 14 days
> **Version:** v1.2

---

## Goal

Implement the People domain (shared person infrastructure) and the Students domain (student profiles, admissions lifecycle, batch enrollments) with full CRUD APIs, business rules, validation, and database schemas.

---

## Deliverables

| Deliverable                                                    | Status  |
| :------------------------------------------------------------- | :-----: |
| People shared infrastructure (Person module, base service)     | ✅ Done |
| Student module foundation with Prisma schema                   | ✅ Done |
| Student business rules + validation layer (Zod DTOs)           | ✅ Done |
| Student CRUD API (create, read, update, list, delete)          | ✅ Done |
| Admission schema (lifecycle enum, status history, indexes)     | ✅ Done |
| Admission create endpoint with validation                      | ✅ Done |
| Admission lifecycle management (read APIs, status transitions) | ✅ Done |
| Admission terminal state guards + one-active rule              | ✅ Done |
| Batch enrollment foundation with validation APIs               | ✅ Done |
| Batch enrollment lifecycle management                          | ✅ Done |
| Documentation restructure (README, architecture index)         | ✅ Done |

---

## Commit History

| Date       | Commit    | Task   | Description                                                                      |
| :--------- | :-------- | :----- | :------------------------------------------------------------------------------- |
| 2026-07-15 | `2892d3c` | S2-001 | People shared infrastructure (PersonModule, base CRUD, TenantScopedPrisma)       |
| 2026-07-16 | `2b83134` | —      | Student module foundation (Prisma schema, module structure)                      |
| 2026-07-16 | `307dbae` | —      | Student business rules (Zod validation, DTOs)                                    |
| 2026-07-16 | `35b7dc8` | —      | Admission schema with lifecycle enum, status history, nullable fields, indexes   |
| 2026-07-16 | `8cd777b` | —      | Admission creation endpoint with validation                                      |
| 2026-07-16 | `ddee7c5` | —      | Complete admission lifecycle: read APIs, status management, history queries      |
| 2026-07-17 | `992a92f` | —      | Terminal state guards, one-active-rule enforcement, batch eligibility validation |
| 2026-07-17 | `f9c6632` | —      | Batch enrollment foundation with validation and lifecycle APIs                   |
| 2026-07-17 | `ab15adb` | —      | Fix: import PeopleModule for TenantScopedPrisma                                  |
| 2026-07-17 | `94c6ac2` | —      | Merge feature/people into develop                                                |
| 2026-07-17 | `e3f532e` | —      | Student module foundation (after merge)                                          |
| 2026-07-17 | `d0849ea` | —      | Student business rules + validation layer                                        |
| 2026-07-17 | `ac6c899` | —      | Admission schema (lifecycle enum, status history, indexes)                       |
| 2026-07-17 | `b1b0c09` | —      | Admission creation endpoint                                                      |
| 2026-07-17 | `12246da` | —      | Admission lifecycle: read APIs, status management, history                       |
| 2026-07-17 | `1177aba` | —      | Terminal state guards, one-active rule, batch eligibility                        |
| 2026-07-17 | `4145fc8` | —      | Batch enrollment foundation with validation and lifecycle APIs                   |

### Documentation Work (during this sprint)

| Date       | Commit    | Description                                                            |
| :--------- | :-------- | :--------------------------------------------------------------------- |
| 2026-07-16 | `014fb08` | Restructure README to index architecture, ADR, entity, API design docs |
| 2026-07-16 | `1c47706` | Restructure documentation hub with clean category index maps           |
| 2026-07-16 | `d8a5195` | Add domain models index, architecture tree, database overview table    |
| 2026-07-16 | `40e0397` | Add API design references to architectural specification index         |
| 2026-07-17 | `28298fa` | Add sprint planning docs (Sprint 0-4)                                  |

---

## Database Schemas Built

### Persons

```prisma
model Person {
  id            String   @id @default(cuid())
  instituteId   String
  firstName     String
  lastName      String
  email         String?
  phone         String?
  dateOfBirth   DateTime?
  gender        GenderType?
  bloodGroup    BloodGroupType?
  address       String?
  city          String?
  state         String?
  pincode       String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

### Students

```prisma
model Student {
  id              String
  instituteId     String
  personId        String
  admissionDate   DateTime
  academicStatus  AcademicStatusEnum
  rollNumber      String?
  batchId         String?
  createdAt       DateTime
  updatedAt       DateTime
}
```

### Admission lifecycle

Enrollment stages: `APPLIED → ENQUIRY → DOCUMENT_VERIFICATION → ADMISSION_TEST → INTERVIEW → PAYMENT_PENDING → CONFIRMED → CANCELLED`
Terminal states: `CONFIRMED`, `CANCELLED` — cannot transition out.

### Batch Enrollment

Batch assignment with lifecycle tracking and eligibility validation.

---

## API Endpoints Built

| Method | Path                             | Module            |
| :----- | :------------------------------- | :---------------- |
| POST   | `/api/v1/people/persons`         | People            |
| GET    | `/api/v1/people/persons`         | People            |
| GET    | `/api/v1/people/persons/:id`     | People            |
| PUT    | `/api/v1/people/persons/:id`     | People            |
| POST   | `/api/v1/students`               | Students          |
| GET    | `/api/v1/students`               | Students          |
| GET    | `/api/v1/students/:id`           | Students          |
| PUT    | `/api/v1/students/:id`           | Students          |
| DELETE | `/api/v1/students/:id`           | Students          |
| POST   | `/api/v1/admissions`             | Admissions        |
| GET    | `/api/v1/admissions`             | Admissions        |
| GET    | `/api/v1/admissions/:id`         | Admissions        |
| PATCH  | `/api/v1/admissions/:id/status`  | Admissions        |
| GET    | `/api/v1/admissions/:id/history` | Admissions        |
| POST   | `/api/v1/batch-enrollments`      | Batch Enrollments |
| GET    | `/api/v1/batch-enrollments`      | Batch Enrollments |
| GET    | `/api/v1/batch-enrollments/:id`  | Batch Enrollments |
| PATCH  | `/api/v1/batch-enrollments/:id`  | Batch Enrollments |

---

## Key Decisions

| Decision          | Choice                                           | Rationale                                 |
| :---------------- | :----------------------------------------------- | :---------------------------------------- |
| Prisma enum types | Declared in schema, generated client             | Type-safe enum references across services |
| Soft delete       | `isActive` flag + `deletedAt` timestamp          | Audit trail, data recovery                |
| Tenant isolation  | `instituteId` on every table + Prisma middleware | RLS-compatible, easy to enforce           |
| Admission states  | State machine with terminal guards               | Prevents invalid transitions              |
| Batch validation  | Eligibility rules before enrollment              | Ensures data consistency                  |

---

## Verification

| Check                              | Result                                   |
| :--------------------------------- | :--------------------------------------- |
| Person CRUD                        | ✅ Create, read, update, soft-delete     |
| Student CRUD                       | ✅ Full lifecycle with business rules    |
| Admission creation with validation | ✅ Returns 201 / 400 / 409               |
| Terminal state enforcement         | ✅ Confirmed/Cancelled cannot transition |
| One-active admission rule          | ✅ Blocks duplicate active admissions    |
| Batch enrollment eligibility       | ✅ Validates before enrollment           |
| Tenant isolation                   | ✅ institute_id scoped queries           |
| TypeScript strict mode             | ✅ No errors                             |
