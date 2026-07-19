# Project Dashboard

> Central overview of the Education Management Platform (CMP) engineering progress.

**Last Updated:** 2026-07-19  
**Owner:** Jay

---

## Overall Status

| Metric            | Value                             |
| :---------------- | :-------------------------------- |
| **Total Sprints** | 12 (S0A–S11)                      |
| **Completed**     | 7 (S0A, S0B, S0C, S1, S2, S3, S4) |
| **Current**       | S5 — Master Data                  |
| **Progress**      | ~40%                              |
| **Active Bugs**   | 2                                 |
| **Blockers**      | 0                                 |

---

## Sprint Completion Summary

| Sprint  | Name                   |    Status     | Key Deliverables                                                                                                                                    |
| :------ | :--------------------- | :-----------: | :-------------------------------------------------------------------------------------------------------------------------------------------------- |
| **S0A** | Workspace Setup        |    ✅ Done    | Monorepo, Turborepo, pnpm workspaces, NestJS scaffold, Next.js scaffold, Docker Compose (Postgres + Redis), GitHub Actions CI                       |
| **S0B** | Backend Foundation     |    ✅ Done    | NestJS platform (Config, Context, Logger, Validation, Exceptions, Interceptors, Prisma, Redis, Security, Swagger, Health Checks, Integration Tests) |
| **S0C** | UI Foundation          |    ✅ Done    | Axios client + refresh interceptor, React Query, Zustand stores, Next.js middleware, UI component library (5 portal dashboard shells)               |
| **S1**  | Auth & Identity (BE)   |    ✅ Done    | JWT asymmetric auth, refresh token rotation, RBAC guards, permission seeding, session management, Swagger docs, integration tests                   |
| **S2**  | People & Students (BE) |    ✅ Done    | Person profiles, Student CRUD, Admissions lifecycle, Batch enrollments, Business rules, Validation layer, DB schemas + indexes                      |
| **S3**  | Frontend Platform UI   |    ✅ Done    | Auth pages, Dashboard layout, Students/Admissions/Batch management UI, React Query migration                                                        |
| **S4**  | Responsive Polish      |    ✅ Done    | Responsive audit (6 High + 3 Medium fixes), Radix Select migration, skeleton/button/table fixes                                                     |
| **S5**  | **Master Data**        | **🔄 Active** | **Branches, Courses, Subjects, Chapters, Topics, Academic Years, Delivery Types — BE + FE**                                                         |
| **S6**  | Learning               |  ⏳ Planned   | Study materials, Homework, Assignments                                                                                                              |
| **S7**  | Live Classes           |  ⏳ Planned   | Jitsi meetings, Recordings, Video player                                                                                                            |
| **S8**  | Assessments & QB       |  ⏳ Planned   | Question bank, Manual grading workflow, Exams                                                                                                       |
| **S9**  | Billing                |  ⏳ Planned   | Fee structures, Payments, Receipts                                                                                                                  |
| **S10** | Comms, Analytics & AI  |  ⏳ Planned   | Notifications, Dashboards, AI assistant                                                                                                             |
| **S11** | Production Go-Live     |  ⏳ Planned   | QA hardening, Deploy, Load testing                                                                                                                  |

---

## Backend Module Status

| Module              |     Status     | APIs Built                            | Notes                                     |
| :------------------ | :------------: | :------------------------------------ | :---------------------------------------- |
| `health`            |    ✅ Done     | GET /health, /live, /ready            | Terminus checks (DB, Redis, disk, memory) |
| `auth`              |    ✅ Done     | Login, Logout, Refresh, MFA, Sessions | JWT RS256, refresh rotation, RBAC         |
| `people`            |    ✅ Done     | Person CRUD                           | Shared person infrastructure              |
| `students`          |    ✅ Done     | Student CRUD                          | Full lifecycle with business rules        |
| `admissions`        |    ✅ Done     | Create, Status, History, Eligibility  | State machine with terminal guards        |
| `batch-enrollments` |    ✅ Done     | Enroll, Validate, Lifecycle           | Batch eligibility validation              |
| `master`            | 🔄 In Progress | Branches, Courses, Subjects           | Sprint 5 — BE + FE                        |
| `platform`          | ⏳ Scaffolded  | —                                     | Tenant mgmt, subscriptions, feature flags |
| `attendance`        | ⏳ Scaffolded  | —                                     | Sessions, Records, Leave                  |
| `learning`          | ⏳ Scaffolded  | —                                     | Materials, Assignments                    |
| `live`              | ⏳ Scaffolded  | —                                     | Live classes, Recordings                  |
| `billing`           | ⏳ Scaffolded  | —                                     | Fee structures, Payments                  |
| `ai`                | ⏳ Scaffolded  | —                                     | AI doubt solver                           |
| `analytics`         | ⏳ Scaffolded  | —                                     | Dashboards, Reports                       |

---

## Portal-wise Status

### 🏢 Platform Admin (Super Admin)

| Feature                   |     Status     | Notes                        |
| :------------------------ | :------------: | :--------------------------- |
| Dashboard                 | ⏳ Not Started | Global KPIs, tenant overview |
| Tenant Management         | ⏳ Not Started | CRUD, onboarding workflow    |
| Subscriptions & Licensing | ⏳ Not Started | Plans, quotas, billing       |
| Global Settings           | ⏳ Not Started | Feature flags, policies      |
| Automation Jobs           | ⏳ Not Started | Cron, workflows              |

### 🏫 Tenant Admin (Institute Admin)

| Feature                |       Status       | Notes                                   |
| :--------------------- | :----------------: | :-------------------------------------- |
| Dashboard              |   ✅ Shell Done    | Daily metrics, KPI widgets pending      |
| **Student Management** |    **✅ Done**     | **List, detail, CRUD**                  |
| **Admissions**         |    **✅ Done**     | **Wizard, status management, history**  |
| **Batch Management**   |    **✅ Done**     | **Cards, detail, configuration**        |
| Parents                |   ⏳ Not Started   | Guardian profiles, mapping              |
| Tutors                 |   ⏳ Not Started   | Onboarding, workload board              |
| **Master Data**        | **🔄 In Progress** | **Branches, Courses, Subjects, Topics** |
| Mock Tests             |   ⏳ Not Started   | Manual grading only (no auto-grade)     |
| Study Materials        |   ⏳ Not Started   | Upload, cataloging                      |
| Fee Management         |   ⏳ Not Started   | Structures, ledger, receipts            |
| Reports                |   ⏳ Not Started   | Performance, attendance                 |
| Settings               |   ⏳ Not Started   | Branding, hours                         |
| Notifications          |   ⏳ Not Started   | Triggers, templates                     |

### 👨‍🏫 Tutor Portal

| Feature         |     Status     | Notes                      |
| :-------------- | :------------: | :------------------------- |
| Dashboard       | ✅ Shell Done  | Schedule, upcoming classes |
| My Batches      | ⏳ Not Started | Batch list, student roster |
| Attendance      | ⏳ Not Started | Mark, view history         |
| Study Materials | ⏳ Not Started | Upload, organize           |
| Live Classes    | ⏳ Not Started | Schedule, host Jitsi       |
| Assessments     | ⏳ Not Started | Create, grade manually     |
| Homework        | ⏳ Not Started | Assign, evaluate           |

### 🎓 Student Portal

| Feature         |     Status     | Notes                                    |
| :-------------- | :------------: | :--------------------------------------- |
| Dashboard       | ✅ Shell Done  | Overview, upcoming                       |
| My Batches      | ⏳ Not Started | Batch info, timetable                    |
| Study Materials | ⏳ Not Started | View, download                           |
| Live Classes    | ⏳ Not Started | Join, recordings                         |
| Mock Tests      | ⏳ Not Started | Take test, view results (manual grading) |
| Fee & Payments  | ⏳ Not Started | Ledger, pay online                       |
| Attendance      | ⏳ Not Started | View history                             |

### 👪 Parent Portal

| Feature        |     Status     | Notes                      |
| :------------- | :------------: | :------------------------- |
| Dashboard      | ✅ Shell Done  | Child overview, alerts     |
| Child Progress | ⏳ Not Started | Attendance, marks, reports |
| Fee Payments   | ⏳ Not Started | Ledger, pay online         |
| Communication  | ⏳ Not Started | Messages, notifications    |

---

## Frontend Routes Built

| Route                   | Page              | Status  |
| :---------------------- | :---------------- | :-----: |
| `/auth/login`           | Login             | ✅ Done |
| `/auth/register`        | Register          | ✅ Done |
| `/auth/forgot-password` | Forgot Password   | ✅ Done |
| `/auth/reset-password`  | Reset Password    | ✅ Done |
| `/dashboard`            | Main Dashboard    | ✅ Done |
| `/students`             | Student List      | ✅ Done |
| `/students/:id`         | Student Detail    | ✅ Done |
| `/admissions`           | Admissions List   | ✅ Done |
| `/admissions/new`       | Admissions Wizard | ✅ Done |
| `/batches`              | Batch List        | ✅ Done |
| `/batches/:id`          | Batch Detail      | ✅ Done |

---

## Key Metrics

| Metric                 | Current         | Target |
| :--------------------- | :-------------- | :----: |
| TypeScript strict mode | ✅ Enabled      |   —    |
| ESLint pass rate       | ✅ 100%         |  100%  |
| Build success rate     | ✅ 100%         |  100%  |
| Test coverage          | ⏳ Not measured | > 85%  |
| API endpoints built    | ~20+            |  362+  |
| Frontend routes        | 11              |  40+   |
| Active bugs            | 2               |   0    |

---

## Quick Links

- [Implementation Workbook](../implementation/implementfull.md)
- [V1 Scope Freeze](../v1-scope-freeze.md)
- [Sprint Roadmap](../04-sprint-plan.md)
- [API Design Index](../architecture/api-design/00-api-index.md)
- [Sprint 0A — Workspace Setup](../01-sprints/sprint-00a-workspace-setup.md)
- [Sprint 0B — Backend Foundation](../01-sprints/sprint-00b-backend-foundation.md)
- [Sprint 01 — Auth & Identity Backend](../01-sprints/sprint-01-auth-identity.md)
- [Sprint 02 — People & Students Backend](../01-sprints/sprint-02-people-students.md)
- [Sprint 03 — Frontend Platform UI](../01-sprints/sprint-03-frontend-platform-ui.md)
- [Sprint 05 — Master Data](../01-sprints/sprint-05-master-data.md)
