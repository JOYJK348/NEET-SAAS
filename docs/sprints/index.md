# Sprint Documentation Index

> Use these docs to understand the full development history of the NEET SaaS platform.

| #   | Sprint                                                  | Commit                            | Files Changed    | APIs Added  | Tests | Module                |
| --- | ------------------------------------------------------- | --------------------------------- | ---------------- | ----------- | ----- | --------------------- |
| 0   | [Infrastructure Foundation](sprint-0-infrastructure.md) | `2892d3c`                         | 9 files          | —           | 0     | People (shared infra) |
| 1   | [Student Module](sprint-1-student-module.md)            | `2b83134` + `307dbae`             | 15 files         | 5 CRUD      | ~30   | Students              |
| 2   | [Admission Schema](sprint-2-admission-schema.md)        | `35b7dc8`                         | 2 files (schema) | —           | 0     | Schema only           |
| 3   | [Admissions Module](sprint-3-admissions-module.md)      | `8cd777b` + `ddee7c5` + `992a92f` | 16 files         | 6 endpoints | ~76   | Admissions            |
| 4   | [Batch Enrollment](sprint-4-batch-enrollment.md)        | `f9c6632`                         | 10 files         | 4 endpoints | 19    | BatchEnrollments      |

## Totals

| Metric                | Value                   |
| --------------------- | ----------------------- |
| **Total Commits**     | 9 (on `feature/people`) |
| **Files Created**     | ~60                     |
| **Total APIs**        | ~25                     |
| **Test Suites**       | 13                      |
| **Total Tests**       | 95 (all passing)        |
| **Schema Migrations** | 2                       |
| **Business Rules**    | ~15                     |
| **Lint Errors**       | 0                       |

## Verification

Each sprint passed:

- `pnpm lint` — 0 errors
- `pnpm typecheck` — clean
- `pnpm build` — api + web successful
- `pnpm test` — all tests green (95/95 as of Sprint 4)
