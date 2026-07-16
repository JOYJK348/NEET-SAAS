# Education Management Platform (CMP) 🚀

Welcome to the central engineering portal for the **Education Management Platform (CMP)**.

This repository houses the complete multi-tenant Software-as-a-Service (SaaS) **Education Core Platform** designed to power any educational vertical (NEET coaching, JEE training, UPSC academies, schools, colleges, and corporate learning) through a unified configuration-driven profile engine.

**Target Profile (V1):** NEET Coaching Center  
**Long-term Vision:** Generic education platform where vertical-specific business rules are configured dynamically rather than through database schema alterations.

---

## 🚀 Project Status Dashboard

| Module / Scope                    |  Build Status  | Completion | Description / Phase                        |
| :-------------------------------- | :------------: | :--------: | :----------------------------------------- |
| **Monorepo Setup (Sprint 0A)**    |  ✅ Complete   |    100%    | Turborepo, workspaces, docker configs      |
| **NestJS Foundation (Sprint 0B)** |  ✅ Complete   |    100%    | Logger, filter, wrapper, DB & cache client |
| **Authentication & RBAC**         |  ✅ Complete   |    100%    | Silent refreshes, Multi-sessions logging   |
| **People Infrastructure**         |  ✅ Complete   |    100%    | Core Person mappings, User roles setup     |
| **Student Module**                | 🚧 In Progress |    60%     | Cohorts, registration adapters             |
| **Admissions & Enrolments**       | 🟡 In Progress |    20%     | Application processing pipelines           |
| **Staff & Tutors**                |   ⏳ Planned   |     0%     | Scheduling workload configurations         |
| **Attendance & Leave**            |   ⏳ Planned   |     0%     | Daily clock-in counters                    |
| **Exams (Assessments)**           |   ⏳ Planned   |     0%     | Question pools ingestion, CBT engine       |
| **Fees & Invoices**               |   ⏳ Planned   |     0%     | Installments schedule, immutable ledger    |
| **Communication Queue**           |   ⏳ Planned   |     0%     | Auto SMS/Email dispatchers                 |
| **AI Capabilities**               |   ⏳ Planned   |     0%     | LLM doubt solvers integration              |

---

## 🗺️ Quick Navigation Hub

Navigate directly to our structured documentation categories:

```
    [ Getting Started ] ────> [ docs/07-deployment/README.md ]
    [ Architecture Specs ] ──> [ docs/02-architecture/README.md ]
    [ Database Schema ] ────> [ docs/03-database/README.md ]
    [ REST API Design ] ────> [ docs/04-api/README.md ]
    [ Contributing ] ───────> [ docs/08-contributing/README.md ]
```

---

## 🏛️ System Domain Architecture

```
Education Management Platform
   │
   ├── Institute (Tenant Root)
   │
   ├── Authentication
   ├── People
   │     ├── Student
   │     ├── Staff
   │     └── Parent
   │
   ├── Academic
   ├── Attendance
   ├── Learning
   ├── Exams
   ├── Fees
   ├── Communication
   ├── AI Services
   └── Platform
```

---

## 🗄️ Database Overview

| Category      | Count |
| :------------ | ----: |
| Prisma Models |  214+ |
| Tables        |  214+ |
| Domains       |    13 |
| API Endpoints |  360+ |
| Migrations    |     4 |
| ADR Documents |    19 |
| Test Cases    |   49+ |

---

## 🗃️ Domain Model & ERD Index

Every business domain has a dedicated Entity Relationship Diagram (ERD), entity specification, database design notes, and API implementation guide.

| Domain                | Entity Specification                                             | ERD                                              | API Spec                                   | Status |
| :-------------------- | :--------------------------------------------------------------- | :----------------------------------------------- | :----------------------------------------- | :----: |
| **🏢 Institute**      | [Spec](docs/03-database/entities/01-institute-management.md)     | [ERD](docs/03-database/erd/01-institute.md)      | [API](docs/04-api/system/README.md)        |   ✅   |
| **👤 Authentication** | [Spec](docs/03-database/entities/02-user-management.md)          | [ERD](docs/03-database/erd/02-user.md)           | [API](docs/04-api/auth/README.md)          |   ✅   |
| **👨‍🎓 Student**        | [Spec](docs/03-database/entities/02a-student-management.md)      | [ERD](docs/03-database/erd/02a-student.md)       | [API](docs/04-api/students/README.md)      |   🚧   |
| **👨‍🏫 Staff**          | [Spec](docs/03-database/entities/02b-tutor-management.md)        | [ERD](docs/03-database/erd/02b-tutor.md)         | [API](docs/04-api/users/README.md)         |   ⏳   |
| **👨‍👩‍👧 Parent**         | [Spec](docs/03-database/entities/02c-parent-management.md)       | [ERD](docs/03-database/erd/02c-parent.md)        | [API](docs/04-api/students/README.md)      |   ⏳   |
| **📚 Academic**       | [Spec](docs/03-database/entities/03-academic-management.md)      | [ERD](docs/03-database/erd/03-academic.md)       | [API](docs/04-api/academics/README.md)     |   ⏳   |
| **⏱️ Attendance**     | [Spec](docs/03-database/entities/08-system-management.md)        | [ERD](docs/03-database/erd/08-system.md)         | [API](docs/04-api/attendance/README.md)    |   ⏳   |
| **🧪 Exams**          | [Spec](docs/03-database/entities/05-assessment-management.md)    | [ERD](docs/03-database/erd/05-assessment.md)     | [API](docs/04-api/assessments/README.md)   |   ⏳   |
| **💰 Fees**           | [Spec](docs/03-database/entities/09-fee-management.md)           | [ERD](docs/03-database/erd/09-fee-management.md) | [API](docs/04-api/fees/README.md)          |   ⏳   |
| **🎥 Learning**       | [Spec](docs/03-database/entities/04-learning-management.md)      | [ERD](docs/03-database/erd/04-learning.md)       | [API](docs/04-api/lms/README.md)           |   ⏳   |
| **📢 Communication**  | [Spec](docs/03-database/entities/06-communication-management.md) | [ERD](docs/03-database/erd/06-communication.md)  | [API](docs/04-api/communication/README.md) |   ⏳   |
| **🤖 AI Services**    | [Spec](docs/03-database/entities/08-system-management.md)        | [ERD](docs/03-database/erd/08-system.md)         | [API](docs/04-api/13-ai-admin-api.md)      |   ⏳   |
| **⚙️ Platform**       | [Spec](docs/03-database/entities/08-system-management.md)        | [ERD](docs/03-database/erd/08-system.md)         | [API](docs/04-api/14-platform-api.md)      |   ⏳   |

---

## 🏛️ Documentation Categories Index

Explore the folders inside [`docs/`](docs/README.md) organizing all specifications:

1.  📑 **[00. Overview & Vision](docs/00-overview/README.md)** — Project roadmap, sprint tracks, and client reports.
2.  🎯 **[01. Business Requirements](docs/01-business/README.md)** — Product specifications, meeting notes, and scope freeze details.
3.  🏛️ **[02. System Architecture](docs/02-architecture/README.md)** — Tenancy filters, authentication flows, and the 19 ADR registers.
4.  🗄️ **[03. Database Models (ERDs)](docs/03-database/README.md)** — Prisma schema references, database naming rules, and ERD files.
5.  🔌 **[04. REST API Designs](docs/04-api/README.md)** — 360+ REST routes DTOs and query guidelines.
6.  🛠️ **[05. Implementation Guides](docs/05-implementation/README.md)** — Code layout structure, Git workflow, and definitions of done.
7.  🧪 **[06. Testing Strategy](docs/06-testing/README.md)** — E2E test runs and mock databases setup.
8.  🚀 **[07. Deployments](docs/07-deployment/README.md)** — Local environment boot configurations.
9.  🤝 **[08. Contribution Guidelines](docs/08-contributing/README.md)** — Conventional Commit rules and review checklists.
10. 🗺️ **[09. System Diagrams](docs/09-diagrams/README.md)** — Mermaid sequence charts and diagrams indexes.

---

## ⚡ Architecture Decision Records (ADR Register)

Our technical decisions are rigorously cataloged under the ADR framework:

| ADR ID  | Decision Title              | Scope Description                                        | Spec Document                                                          |
| :------ | :-------------------------- | :------------------------------------------------------- | :--------------------------------------------------------------------- |
| **001** | Multi-Tenancy Strategy      | Logical tenant database isolation via `institute_id`     | [ADR-001](docs/02-architecture/adr/ADR-001-multi-tenancy.md)           |
| **002** | Soft Delete Strategy        | Handling logical deletes for audited entities            | [ADR-002](docs/02-architecture/adr/ADR-002-soft-delete-strategy.md)    |
| **003** | Event Driven Design         | Asynchronous intra-service signaling                     | [ADR-003](docs/02-architecture/adr/ADR-003-event-driven-design.md)     |
| **004** | Snapshot Strategy           | Performance tuning for heavy relational entities         | [ADR-004](docs/02-architecture/adr/ADR-004-snapshot-strategy.md)       |
| **005** | Database Partitioning       | Table partitioning strategies for transactional tables   | [ADR-005](docs/02-architecture/adr/ADR-005-partitioning-strategy.md)   |
| **006** | Row Level Security (RLS)    | Database-level access guarantees for multitenancy        | [ADR-006](docs/02-architecture/adr/ADR-006-rls-strategy.md)            |
| **007** | Asset Storage Management    | Cloudflare R2 and Supabase Storage segregation           | [ADR-007](docs/02-architecture/adr/ADR-007-storage-strategy.md)        |
| **008** | Caching Architecture        | Distributed cache controls using Redis clusters          | [ADR-008](docs/02-architecture/adr/ADR-008-caching-strategy.md)        |
| **009** | Background Jobs Queue       | BullMQ task priority runners for reports and transcoding | [ADR-009](docs/02-architecture/adr/ADR-009-background-jobs.md)         |
| **010** | AI Integration Services     | Doubt solvers and automated explanations integrations    | [ADR-010](docs/02-architecture/adr/ADR-010-ai-integration.md)          |
| **011** | Academic & LMS Isolation    | Segregation of Course curricula from LMS Content files   | [ADR-011](docs/02-architecture/adr/ADR-011-academic-lms-separation.md) |
| **012** | Question Catalog Reuse      | Reusable question pools across batch exams               | [ADR-012](docs/02-architecture/adr/ADR-012-question-bank-reuse.md)     |
| **013** | Learning Management Domains | Chapter/Topic hierarchy mappings                         | [ADR-013](docs/02-architecture/adr/ADR-013-lms-domain-separation.md)   |
| **014** | Database Migration Strategy | Safely deploying database schema updates                 | [ADR-014](docs/02-architecture/adr/ADR-014-migration-strategy.md)      |
| **015** | Concurrency & Idempotency   | Avoiding duplicate payment processing                    | [ADR-015](docs/02-architecture/adr/ADR-015-concurrency-idempotency.md) |
| **016** | Backup & Recovery           | Database transaction replication and restore times       | [ADR-016](docs/02-architecture/adr/ADR-016-backup-recovery-dr.md)      |
| **017** | Enums & Lookup Tables       | Strategy for localized schema extensions                 | [ADR-017](docs/02-architecture/adr/ADR-017-enum-lookup-evolution.md)   |
| **018** | Transaction Boundaries      | Database transactions handling across nested services    | [ADR-018](docs/02-architecture/adr/ADR-018-transaction-boundaries.md)  |
| **019** | Observability Strategy      | Logging, tracing, OpenTelemetry metrics collection       | [ADR-019](docs/02-architecture/adr/ADR-019-observability-strategy.md)  |

---

## 🛠️ Developer Quick Start

### 1. Boot Local Environment

Ensure you have **Node.js >= 18**, **pnpm >= 9.x**, and **Docker** active.

```bash
# Clone the repository and copy configurations
cp .env.example .env

# Spin up database and Redis services
docker-compose up -d

# Generate client and push schema
pnpm --filter @neet/database db:generate
pnpm --filter @neet/database db:push

# Launch backend & frontend applications
pnpm run dev
```

### 2. Verify Validations & Tests

```bash
# Run ESLint checkers
pnpm lint

# Execute E2E integration test suite
pnpm --filter api test:e2e
```

Refer to the complete **[Developer Onboarding Manual](docs/08-contributing/README.md)** for branch protocols and Conventional Commit guidelines before opening pull requests!
