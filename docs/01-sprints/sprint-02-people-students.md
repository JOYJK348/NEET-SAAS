# Sprint 02 — People, Students & Admission Lifecycle

> **Status:** ✅ Completed
> **Version:** v1.2
> **Primary Application:** `apps/api`

---

## Goal

Build the complete student onboarding lifecycle: shared Person infrastructure, Student academic identity, Admission state machine with terminal-state protection, and Batch Enrollment with eligibility validation — all tenant-scoped.

---

## Deliverables

| Deliverable                                              | Status  |
| :------------------------------------------------------- | :-----: |
| Shared Person entity (reusable across all personas)      | ✅ Done |
| Student module (academic identity, roll number, status)  | ✅ Done |
| Admission lifecycle state machine (6 states + terminal)  | ✅ Done |
| Admission status transition with validation              | ✅ Done |
| Terminal state protection (CONFIRMED/CANCELLED → locked) | ✅ Done |
| One-active-admission rule enforcement                    | ✅ Done |
| Admission status history tracking                        | ✅ Done |
| Batch Enrollment with eligibility validation             | ✅ Done |
| Tenant-scoped (instituteId) data isolation               | ✅ Done |
| Soft-delete support for students                         | ✅ Done |
| Shared tenant-scoped CRUD infrastructure                 | ✅ Done |

---

## Commit History

| Date       | Commit    | Area        | Description                               |
| :--------- | :-------- | :---------- | :---------------------------------------- |
| 2026-07-16 | `2892d3c` | People      | Shared People infrastructure              |
| 2026-07-16 | `2b83134` | Students    | Student module foundation                 |
| 2026-07-16 | `307dbae` | Students    | Business rules and validation             |
| 2026-07-16 | `35b7dc8` | Admissions  | Admission schema and lifecycle            |
| 2026-07-16 | `8cd777b` | Admissions  | Admission creation endpoint               |
| 2026-07-16 | `ddee7c5` | Admissions  | Admission lifecycle APIs and history      |
| 2026-07-16 | `992a92f` | Admissions  | Terminal states and one-active rule       |
| 2026-07-16 | `f9c6632` | Enrollment  | Batch enrollment foundation               |
| 2026-07-16 | `ab15adb` | Infra       | PeopleModule dependency fix               |
| 2026-07-16 | `94c6ac2` | Integration | People feature merge                      |
| 2026-07-16 | `d0849ea` | Students    | Business rules and validation refinement  |
| 2026-07-16 | `ac6c899` | Admissions  | Schema refinement                         |
| 2026-07-16 | `b1b0c09` | Admissions  | Creation endpoint refinement              |
| 2026-07-16 | `12246da` | Admissions  | Lifecycle and history refinement          |
| 2026-07-16 | `1177aba` | Admissions  | Terminal-state and eligibility refinement |
| 2026-07-16 | `4145fc8` | Enrollment  | Enrollment lifecycle APIs                 |

---

## API Endpoints Built

### People

| Method | Path                         | Description   |
| :----- | :--------------------------- | :------------ |
| POST   | `/api/v1/people/persons`     | Create person |
| GET    | `/api/v1/people/persons`     | List persons  |
| GET    | `/api/v1/people/persons/:id` | Get person    |
| PUT    | `/api/v1/people/persons/:id` | Update person |

### Students

| Method | Path                   | Description    |
| :----- | :--------------------- | :------------- |
| POST   | `/api/v1/students`     | Create student |
| GET    | `/api/v1/students`     | List students  |
| GET    | `/api/v1/students/:id` | Get student    |
| PUT    | `/api/v1/students/:id` | Update student |
| DELETE | `/api/v1/students/:id` | Soft-delete    |

### Admissions

| Method | Path                             | Description        |
| :----- | :------------------------------- | :----------------- |
| POST   | `/api/v1/admissions`             | Create admission   |
| GET    | `/api/v1/admissions`             | List admissions    |
| GET    | `/api/v1/admissions/:id`         | Get admission      |
| PATCH  | `/api/v1/admissions/:id/status`  | Transition status  |
| GET    | `/api/v1/admissions/:id/history` | Get status history |

### Batch Enrollments

| Method | Path                            | Description       |
| :----- | :------------------------------ | :---------------- |
| POST   | `/api/v1/batch-enrollments`     | Create enrollment |
| GET    | `/api/v1/batch-enrollments`     | List enrollments  |
| GET    | `/api/v1/batch-enrollments/:id` | Get enrollment    |
| PATCH  | `/api/v1/batch-enrollments/:id` | Update enrollment |

---

## Domain Architecture

```
Person (reusable identity)
  ↓
Student (academic profile, roll number, status)
  ↓
Admission (state machine lifecycle)
  ├── APPLIED → ENQUIRY → DOCUMENT_VERIFICATION → ADMISSION_TEST → INTERVIEW → PAYMENT_PENDING → CONFIRMED
  └── Any → CANCELLED (terminal)
  ↓
Batch Enrollment (eligibility-validated)
  ↓
Academic Participation
```

---

## Key Architecture Decisions

| Decision            | Choice                    | Rationale                         |
| :------------------ | :------------------------ | :-------------------------------- |
| Person abstraction  | Shared `Person` entity    | Avoid duplicate identity data     |
| Student identity    | Separate `Student` entity | Keep academic data separate       |
| Admission lifecycle | State machine             | Prevent invalid transitions       |
| Terminal states     | Business-rule enforcement | Protect finalized records         |
| One-active rule     | Service-layer validation  | Prevent duplicate enrollments     |
| Admission history   | Status audit trail        | Auditability                      |
| Tenant isolation    | `instituteId` scoped      | Prevent cross-tenant access       |
| Soft deletion       | `isActive` + `deletedAt`  | Preserve records, enable recovery |

---

## Verification

| Check                               | Result      |
| :---------------------------------- | :---------- |
| Person CRUD                         | ✅ Working  |
| Student creation + retrieval        | ✅ Working  |
| Student soft delete                 | ✅ Working  |
| Admission invalid transition reject | ✅ Rejected |
| Terminal state locked               | ✅ Enforced |
| Duplicate active admission blocked  | ✅ Blocked  |
| Admission history available         | ✅ Working  |
| Batch enrollment eligibility check  | ✅ Enforced |
| Tenant-scoped queries               | ✅ Isolated |
| TypeScript + ESLint                 | ✅ Passing  |
