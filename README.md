# NEET SaaS Platform 🚀

Welcome to the central engineering portal for the **NEET SaaS Platform**.

This repository houses a complete multi-tenant Software-as-a-Service (SaaS) platform purpose-built for NEET coaching centers to manage students, tutors, batches, exams, fees, and learning content — with a configuration-driven architecture extensible to other educational verticals.

**Target Users:** NEET coaching institutes, students, tutors, and parents.

---

## 🏆 Project Progress & Roadmap

We are executing a multi-phased roadmap spanning structural foundation, database provisioning, API contracts, portal integrations, and master data configuration.

### 📋 Project Management

- 📊 **[Project Dashboard](docs/00-project-management/project-dashboard.md)** — Overall progress, active sprints, key metrics.

### Completed Milestones

| Sprint        | Name                                                                |       Status       |
| :------------ | :------------------------------------------------------------------ | :----------------: |
| **Sprint 0A** | Workspace Setup (Monorepo, Turborepo, Docker)                       |      ✅ Done       |
| **Sprint 0B** | Backend Foundation (NestJS, Prisma, Redis, Auth, Security)          |      ✅ Done       |
| **Sprint 0C** | Frontend Foundation (Next.js, Auth UI, Dashboard, Components)       |      ✅ Done       |
| **Sprint 1**  | Auth & Identity Backend (JWT, RBAC, Refresh Tokens, Sessions)       |      ✅ Done       |
| **Sprint 2**  | People & Students Backend (Profiles, Admissions, Batch Enrollments) |      ✅ Done       |
| **Sprint 3**  | Frontend Platform UI (Students, Admissions, Batches, Responsive)    |      ✅ Done       |
| **Sprint 4**  | Responsive Polish & Bug Fixes                                       |      ✅ Done       |
| **Sprint 5**  | **Master Data (Branches, Courses, Subjects, Topics)**               | **🔄 In Progress** |

### Upcoming Milestones

| Sprint        | Name                             |     Status     |
| :------------ | :------------------------------- | :------------: |
| **Sprint 6**  | Learning (Materials, Homework)   | ⏳ Not Started |
| **Sprint 7**  | Live Classes (Jitsi, Recordings) | ⏳ Not Started |
| **Sprint 8**  | Assessments & Question Bank      | ⏳ Not Started |
| **Sprint 9**  | Billing & Payments               | ⏳ Not Started |
| **Sprint 10** | Communication, Analytics & AI    | ⏳ Not Started |

---

## 🏛️ Central Architecture Specs

These files detail the system standards, database boundaries, and security rules of the platform:

- 📑 **[Project Overview](docs/00-project-overview.md)** — Business specifications and long-term vision.
- 💬 **[Meeting Notes Index](docs/01-meeting-notes.md)** — Chronological log of stakeholder alignments and choices.
- 🔑 **[Authentication Architecture](docs/architecture/auth-architecture.md)** — JWT + Supabase Auth management, silent HttpOnly Cookie refresh rotation, and session invalidation workflow.
- 🏛️ **[Database Access Strategy](docs/architecture/database-access-strategy.md)** — The global database constitution rules.
- 🎯 **[V1 Scope Freeze](docs/v1-scope-freeze.md)** — Complete V1 MVP specification and sprint plan.
- 🧩 **[Profile System](docs/architecture/13-profile-system.md)** — Generic platform configuration for any educational vertical.
- 🔌 **[API Master Register Index](docs/architecture/api-design/00-api-index.md)** — The 362+ planned endpoints index.

---

## 📂 Domain Breakdown & Database Models (ERD)

The system enforces type-safe entity definitions. Each domain is completely specifications-defined:

| Domain                      | Entity Specs                                                                     | ERD Model & Database Schema                                    |
| :-------------------------- | :------------------------------------------------------------------------------- | :------------------------------------------------------------- |
| **01. Institute Core**      | [Institute Specs](docs/architecture/entities/01-institute-management.md)         | [Institute ERD](docs/architecture/erd/01-institute.md)         |
| **02. User (Identity)**     | [User Specs](docs/architecture/entities/02-user-management.md)                   | [User ERD](docs/architecture/erd/02-user.md)                   |
| **02a. Student Profiles**   | [Student Specs](docs/architecture/entities/02a-student-management.md)            | [Student ERD](docs/architecture/erd/02a-student.md)            |
| **02b. Tutor Profiles**     | [Tutor Specs](docs/architecture/entities/02b-tutor-management.md)                | [Tutor ERD](docs/architecture/erd/02b-tutor.md)                |
| **02c. Parent Profiles**    | [Parent Specs](docs/architecture/entities/02c-parent-management.md)              | [Parent ERD](docs/architecture/erd/02c-parent.md)              |
| **03. Academic Core**       | [Academic Specs](docs/architecture/entities/03-academic-management.md)           | [Academic ERD](docs/architecture/erd/03-academic.md)           |
| **04. LMS & Content**       | [Learning Specs](docs/architecture/entities/04-learning-management.md)           | [Learning ERD](docs/architecture/erd/04-learning.md)           |
| **05. Assessment Engine**   | [Assessment Specs](docs/architecture/entities/05-assessment-management.md)       | [Assessment ERD](docs/architecture/erd/05-assessment.md)       |
| **06. Communication Queue** | [Communication Specs](docs/architecture/entities/06-communication-management.md) | [Communication ERD](docs/architecture/erd/06-communication.md) |
| **07. Performance Reports** | [Reporting Specs](docs/architecture/entities/07-reporting-management.md)         | [Reporting ERD](docs/architecture/erd/07-reporting.md)         |
| **08. Core System Specs**   | [System Specs](docs/architecture/entities/08-system-management.md)               | [System ERD](docs/architecture/erd/08-system.md)               |
| **09. Fee Billing**         | [Fee Specs](docs/architecture/entities/09-fee-management.md)                     | [Fee ERD](docs/architecture/erd/09-fee-management.md)          |

---

## 📅 Sprint History & Tracking

Every sprint is documented with full task matrices, commit history, deliverables, and verification results:

| Sprint | Name                                                                                 |    Status     |                            Doc                            |
| :----- | :----------------------------------------------------------------------------------- | :-----------: | :-------------------------------------------------------: |
| **0A** | Workspace Setup (Monorepo, Docker, CI)                                               |    ✅ Done    |   [View](docs/01-sprints/sprint-00a-workspace-setup.md)   |
| **0B** | Backend Foundation (NestJS, Prisma, Redis, Health)                                   |    ✅ Done    | [View](docs/01-sprints/sprint-00b-backend-foundation.md)  |
| **1**  | Auth & Identity Backend (JWT, RBAC, Sessions)                                        |    ✅ Done    |    [View](docs/01-sprints/sprint-01-auth-identity.md)     |
| **2**  | People & Students Backend (Profiles, Admissions, Batch)                              |    ✅ Done    |   [View](docs/01-sprints/sprint-02-people-students.md)    |
| **3**  | Frontend Platform UI (Auth UI, Dashboard, Students, Admissions, Batches, Responsive) |    ✅ Done    | [View](docs/01-sprints/sprint-03-frontend-platform-ui.md) |
| **5**  | **Master Data (Branches, Courses, Subjects, Topics)**                                | **🔄 Active** |     [View](docs/01-sprints/sprint-05-master-data.md)      |

---

## Onboarding, Workflow & Standards

For new engineers joining the team, follow these governance guidelines to ensure architectural consistency:

- **[Engineering Design Plan](docs/implementation/00-implementation-plan.md)** — Code layout structure and deployment plans.
- **[Local Git Workflow & Branching](docs/implementation/01-development-workflow.md)** — Conventional Commit guidelines and PR processes.
- **[Code Formatting & Quality Standards](docs/implementation/02-coding-standards.md)** — ESLint rules, TypeScript conventions, and naming protocols.
- **[Definition of Done (DoD) Checklist](docs/implementation/03-definition-of-done.md)** — Mandatory checks before merging any pull request.
- **[Quality Gates & Security Audits](docs/implementation/04-quality-gates.md)** — Pre-commit audits and CI pipeline checks.
