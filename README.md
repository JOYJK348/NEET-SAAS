# Education Management Platform (CMP) 🚀

Welcome to the central engineering portal for the **Education Management Platform (CMP)**.

This repository houses the complete multi-tenant Software-as-a-Service (SaaS) **Education Core Platform** designed to power any educational vertical (NEET coaching, JEE training, UPSC academies, schools, colleges, and corporate learning) through a unified configuration-driven profile engine.

**Target Profile (V1):** NEET Coaching Center  
**Long-term Vision:** Generic education platform where vertical-specific business rules are configured dynamically rather than through database schema alterations.

---

## 🏆 Project Progress & Roadmap

We are executing a multi-phased roadmap spanning structural foundation, database provisioning, API contracts, and portal integrations.

- 📊 **[Full Implementation Matrix](docs/implementation/implementfull.md)** — Track every single sprint goal, database schema migration status, and component task list.
- 🏁 **[V1 Scope Freeze Agreement](docs/v1-scope-freeze.md)** — Core V1 MVP product features, limits, and milestone definitions.
- 📈 **[Sprint Roadmap & Planning](docs/04-sprint-plan.md)** — High-level chronological planning.

### Current Milestone Status (Sprint 0 - Sprint 3)

- **Sprint 0A (Monorepo Setup)**: Turborepo orchestration, workspaces linking (`apps/api`, `apps/web`, `packages/database`, `packages/shared`), Docker compose integration. [Status: **100% COMPLETE**]
- **Sprint 0B (NestJS Platform Foundation)**: Type-safe Config validation (Zod), AsyncLocalStorage request tracing, Pino logs formatter, global exceptions parser, global response interceptor, Prisma integration module, Redis connection pools, Helmet/CORS security, Swagger, and Terminus live/ready health checks. [Status: **100% COMPLETE**]
- **Sprint 1 (Admissions & Onboarding)**: Institute onboarding, course/batch configuration, student profiles, and parent link setups. [Status: **100% COMPLETE**]
- **Sprint 2 (Academic Engine)**: Tutors registry, Subjects maps, Chapter topics tree, live class schedules. [Status: **100% COMPLETE**]
- **Sprint 3.1 & 3.2 (Assessments & LMS Core)**: Question banks, mock test configurations, study material library, CBT exams. [Status: **100% COMPLETE**]

---

## 🏛️ Central Architecture Specs

These files detail the system standards, database boundaries, and security rules of the platform:

- 📑 **[Project Overview](docs/00-project-overview.md)** — Business specifications and long-term vision.
- 🎯 **[Product Functional Requirements](docs/02-requirements.md)** — Core tenant and administrator capabilities.
- 🔑 **[Authentication & Session Architecture](docs/architecture/auth-architecture.md)** — Silent HttpOnly cookie rotation, JWT lifecycle, and multi-session revocation logs.
- 🛡️ **[Multi-Tenancy Isolation Strategy](docs/architecture/multitenancy-strategy.md)** — Row-Level Security (RLS), bypass indicators, and integration tests ensuring zero cross-tenant leakages.
- 🏛️ **[Database Access Strategy](docs/architecture/database-access-strategy.md)** — Guidelines for Prisma client, performance indexes, query pagination, and write bounds.
- 🗄️ **[Partition & Archive Strategy](docs/architecture/partition-archive-strategy.md)** — Temporal database table partition triggers.
- 🧩 **[Tenant Profile Configuration System](docs/architecture/13-profile-system.md)** — How vertical-specific configurations are injected dynamically.
- 📦 **[Shared Kernel Specs](docs/architecture/14-shared-kernel.md)** — Utility packages shared across NestJS backend and Next.js frontend.
- 💬 **[Meeting Notes Index](docs/01-meeting-notes.md)** — Decisions log from core architectural alignments.

---

## ⚡ Architecture Decision Records (ADR Register)

Our technical decisions are rigorously cataloged under the Architecture Decision Register (ADR) framework:

| ADR ID  | Decision Title              | Scope Description                                        | Spec Document                                                       |
| :------ | :-------------------------- | :------------------------------------------------------- | :------------------------------------------------------------------ |
| **001** | Multi-Tenancy Strategy      | Logical tenant database isolation via `institute_id`     | [ADR-001](docs/architecture/adr/ADR-001-multi-tenancy.md)           |
| **002** | Soft Delete Strategy        | Handling logical deletes for audited entities            | [ADR-002](docs/architecture/adr/ADR-002-soft-delete-strategy.md)    |
| **003** | Event Driven Design         | Asynchronous intra-service signaling                     | [ADR-003](docs/architecture/adr/ADR-003-event-driven-design.md)     |
| **004** | Snapshot Strategy           | Performance tuning for heavy relational entities         | [ADR-004](docs/architecture/adr/ADR-004-snapshot-strategy.md)       |
| **005** | Database Partitioning       | Table partitioning strategies for transactional tables   | [ADR-005](docs/architecture/adr/ADR-005-partitioning-strategy.md)   |
| **006** | Row Level Security (RLS)    | Database-level access guarantees for multitenancy        | [ADR-006](docs/architecture/adr/ADR-006-rls-strategy.md)            |
| **007** | Asset Storage Management    | Cloudflare R2 and Supabase Storage segregation           | [ADR-007](docs/architecture/adr/ADR-007-storage-strategy.md)        |
| **008** | Caching Architecture        | Distributed cache controls using Redis clusters          | [ADR-008](docs/architecture/adr/ADR-008-caching-strategy.md)        |
| **009** | Background Jobs Queue       | BullMQ task priority runners for reports and transcoding | [ADR-009](docs/architecture/adr/ADR-009-background-jobs.md)         |
| **010** | AI Integration Services     | Doubt solvers and automated explanations integrations    | [ADR-010](docs/architecture/adr/ADR-010-ai-integration.md)          |
| **011** | Academic & LMS Isolation    | Segregation of Course curricula from LMS Content files   | [ADR-011](docs/architecture/adr/ADR-011-academic-lms-separation.md) |
| **012** | Question Catalog Reuse      | Reusable question pools across batch exams               | [ADR-012](docs/architecture/adr/ADR-012-question-bank-reuse.md)     |
| **013** | Learning Management Domains | Chapter/Topic hierarchy mappings                         | [ADR-013](docs/architecture/adr/ADR-013-lms-domain-separation.md)   |
| **014** | Database Migration Strategy | Safely deploying database schema updates                 | [ADR-014](docs/architecture/adr/ADR-014-migration-strategy.md)      |
| **015** | Concurrency & Idempotency   | Avoiding duplicate payment processing                    | [ADR-015](docs/architecture/adr/ADR-015-concurrency-idempotency.md) |
| **016** | Backup & Disaster Recovery  | Database transaction replication and restore times       | [ADR-016](docs/architecture/adr/ADR-016-backup-recovery-dr.md)      |
| **017** | Enums & Lookup Tables       | Strategy for localized schema extensions                 | [ADR-017](docs/architecture/adr/ADR-017-enum-lookup-evolution.md)   |
| **018** | Transaction Boundaries      | Database transactions handling across nested services    | [ADR-018](docs/architecture/adr/ADR-018-transaction-boundaries.md)  |
| **019** | Observability Operations    | Logging, tracing, OpenTelemetry metrics collection       | [ADR-019](docs/architecture/adr/ADR-019-observability-strategy.md)  |

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

## 🔌 API Endpoint Design Specs

Every route, HTTP status code, query parameter, DTO shape, validation schema, and controller interface has been designed and cataloged prior to implementation:

- 📘 **[API Design Conventions Guide](docs/architecture/api-design/01-api-design-conventions.md)** — HTTP methods, REST standards, error formatting rules, and sorting/filtering guidelines.
- 📇 **[API Register Master Index](docs/architecture/api-design/00-api-index.md)** — Index of all 362+ planned endpoints in the system.

### Domain-Specific API Portals:

- 🔑 **[Authentication APIs Index](docs/architecture/api-design/02-auth-api/README.md)** — Endpoints for Login, Logout, MFA, password updates, session refresh, active token invalidation, and session audit logs.
- 👥 **[User HR APIs Index](docs/architecture/api-design/03-user-api/README.md)** — Staff onboarding, work shifts, tutor profiling, roles updates.
- 🎓 **[Student APIs Index](docs/architecture/api-design/04-student-api/README.md)** — Enrolments, admissions lifecycle, guardian mapping, cohort movements.
- 🏫 **[Academic APIs Index](docs/architecture/api-design/05-academic-api/README.md)** — Course configs, parallel batch triggers, tutor batch mappings, timetable configurations.
- 📝 **[Assessment APIs Index](docs/architecture/api-design/06-assessment-api/README.md)** — MCQ bank ingestion, template creations, test schedules, answer keys validation, results processing.
- 📹 **[LMS Content APIs Index](docs/architecture/api-design/07-lms-api/README.md)** — Video class configurations, R2 uploads, PDF books libraries, chapters/topics tree setup.
- 💳 **[Billing APIs Index](docs/architecture/api-design/08-fee-api/README.md)** — Installments schedule, tax invoice generation, adjustments ledger, and immutable transaction receipts.
- ⏱️ **[Attendance APIs Index](docs/architecture/api-design/09-attendance-api/README.md)** — Clock-in/out records, leave requests, shift configurations.
- 📢 **[Communication APIs Index](docs/architecture/api-design/10-communication-api/README.md)** — Email notifications templates, SMS queue alerts, push settings.
- 🔧 **[System APIs Index](docs/architecture/api-design/11-system-api/README.md)** — System uploads, bucket health status, and live/ready indicators.
- 📊 **[Analytics APIs Index](docs/architecture/api-design/12-analytics-api/README.md)** — Performance data exports, dashboards read model triggers.
- 🤖 **[AI Capabilities Spec](docs/architecture/api-design/13-ai-admin-api.md)** — Prompts register and AI token consumption checks.
- ⚙️ **[Platform Administration Specs](docs/architecture/api-design/14-platform-api.md)** — Tenant licensing, feature flag overrides.
- ⚙️ **[Internal Worker Orchestrator Specs](docs/architecture/api-design/15-internal-worker-api.md)** — Cron engines, queues pollers.

---

## 🖥️ Portal Navigation Layouts

The layout configuration rules for the different frontends mapping roles:

### 🏢 Platform Owner Portal

- [Navigation Index](docs/modules/platform-admin/01-navigation.md)
- [Global Dashboard Widgets](docs/modules/platform-admin/02-dashboard.md)
- [Tenants Boarding](docs/modules/platform-admin/03-institutes.md)
- [Licensing & Subscriptions](docs/modules/platform-admin/04-subscriptions.md)
- [Global Settings & Policy](docs/modules/platform-admin/05-settings.md)
- [Platform Automation Jobs](docs/modules/platform-admin/06-workflow.md)

### 🏫 Institute Administrator Portal

- [Navigation Index](docs/modules/tenant-admin/01-navigation.md)
- [Daily Metrics & KPI Dashboard](docs/modules/tenant-admin/02-dashboard.md)
- [Student Management System](docs/modules/tenant-admin/03-students.md)
- [Guardian Profiles Mappings](docs/modules/tenant-admin/04-parents.md)
- [Tutors Onboarding & Workload Board](docs/modules/tenant-admin/05-tutors.md)
- [Academics Curricula Configuration](docs/modules/tenant-admin/06-academics.md)
- [Mock Exam Creator & Results Board](docs/modules/tenant-admin/07-mock-tests.md)
- [Study Material Cataloging](docs/modules/tenant-admin/08-study-materials.md)
- [Fee Management Ledger](docs/modules/tenant-admin/09-billing.md)
- [Reporting Dashboard](docs/modules/tenant-admin/10-reports.md)
- [Branding & Hours settings](docs/modules/tenant-admin/11-settings.md)
- [Notification triggers](docs/modules/tenant-admin/12-workflow.md)

---

## 🛠️ Onboarding, Workflow & Standards

For new engineers joining the team, follow these governance guidelines to ensure architectural consistency:

- 📑 **[Engineering Design Plan](docs/implementation/00-implementation-plan.md)** — Code layout structure and deployment plans.
- 🔄 **[Local Git Workflow & Branching](docs/implementation/01-development-workflow.md)** — Conventional Commit guidelines and PR processes.
- 📐 **[Code Formatting & Quality Standards](docs/implementation/02-coding-standards.md)** — ESLint rules, TypeScript conventions, and naming protocols.
- ✅ **[Definition of Done (DoD) Checklist](docs/implementation/03-definition-of-done.md)** — Mandatory checks before merging any pull request.
- 🔒 **[Quality Gates & Security Audits](docs/implementation/04-quality-gates.md)** — Pre-commit audits and CI pipeline checks.
