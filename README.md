# Education Management Platform (CMP)

Welcome to the architectural specifications and documentation repository for the **Education Management Platform (CMP)**.

This is a multi-tenant Software-as-a-Service (SaaS) **Education Core Platform** designed to power any educational institution — NEET coaching, JEE training, UPSC academies, schools, colleges, tuition centers, and corporate training institutes.

**Target Profile (V1):** NEET Coaching Center  
**Long-term Vision:** Generic education platform where business-specific behavior = configuration, not schema changes.

The platform manages academic operations, student profiles, study materials, assessments, communication, and financial operations through a unified, role-based architecture.

---

## 🚀 Core Technology Stack

The platform is designed to scale on modern cloud infrastructure using robust, type-safe development tools:

- **Frontend:** Next.js (App Router, React, Zustand, React Query)
- **Backend:** NestJS (Node.js framework, TypeScript, decorator-driven authentication guards)
- **Database:** Supabase Managed PostgreSQL (with Transaction Connection Pooling and Row-Level Security)
- **Object-Relational Mapping (ORM):** Prisma ORM (Type-safe query building and automatic migration management)
- **Hosting / Infrastructure:** Vercel (Frontend), Railway (Backend)
- **Asset Storage:** Supabase Storage (secured PDFs and files) + Cloudflare R2 (Recorded video classes, zero-egress)
- **Live Class Video Engine:** Jitsi Meet Integration (Hybrid/Online class orchestration self-hosted on DigitalOcean Droplets)

---

## 🏛️ Central Architecture Docs

All fundamental architectural decisions, safety guards, and system scoping details are documented below:

- 📑 **[Project Overview](docs/00-project-overview.md):** High-level summary of business targets and roadmap.
- 💬 **[Meeting Notes Index](docs/01-meeting-notes.md):** Chronological log of stakeholder alignments and choices.
- 🎯 **[Product Requirements](docs/02-requirements.md):** Functional and non-functional specifications.
- ⚡ **[Decisions Register](docs/03-decisions.md):** Architecture Decisions Register (ADR) mapping ORM, Jobs, and Caching.
- 🔑 **[Authentication Architecture](docs/architecture/auth-architecture.md):** JWT + Supabase Auth management, silent HttpOnly Cookie refresh rotation, and session invalidation workflow.
- 🛡️ **[Multi-Tenancy Isolation Strategy](docs/architecture/multitenancy-strategy.md):** Row-level database partitioning scoped on `institute_id` with 3-layer security (Prisma middleware, PostgreSQL RLS, and Integration tests).
- 📈 **[Sprint Roadmap & Planning](docs/04-sprint-plan.md):** Sprint goals and deliverables index.
- 🏛️ **[Database Access Strategy](docs/architecture/database-access-strategy.md):** The global database constitution rules.
- 🗄️ **[Partition & Archive Strategy](docs/architecture/partition-archive-strategy.md):** Lifecycle rules for high-volume database tables.
- 🎯 **[V1 Scope Freeze](docs/v1-scope-freeze.md):** Complete V1 MVP specification and sprint plan.
- 🧩 **[Profile System](docs/architecture/13-profile-system.md):** Generic platform configuration for any educational vertical.

---

## 📂 Domain Architectural Breakdown

The system is built as a **generic Education Core Platform** with configuration-driven profiles. The domain breakdown:

```
Education Core Platform
├── Institute (multi-tenant root)
├── People (Person → User → Role — unified identity)
├── Master (Courses, Subjects, Chapters, Topics, Batches)
├── Attendance (Sessions, Records, Leave)
├── Learning (Materials, Videos, Assignments)
├── Exams (Question Bank, Tests, Evaluations, Results)
├── Fees (Structures, Payments, Receipts, Discounts)
├── Communication (Notifications, Templates, Reminders)
├── AI Service (Capabilities: Doubt Solver, MCQ Explain, ...)
├── Digital Store (Products, Purchases, Access)
├── Calendar (Events, Participants)
├── Platform (Settings, Feature Flags, Storage)
│
└── Profile Layer (tenant configuration)
      └── NEET Coaching V1 (first implementation)
```

Each domain defines its entities, relationships, and ERD structures:

| Domain | Entity Specs | ERD Models |
| :--- | :--- | :--- |
| **01. Institute** | [Institute Specs](docs/architecture/entities/01-institute-management.md) | [Institute ERD](docs/architecture/erd/01-institute.md) |
| **02. User (Identity)** | [User Specs](docs/architecture/entities/02-user-management.md) | [User ERD](docs/architecture/erd/02-user.md) |
| **02a. Student** | [Student Specs](docs/architecture/entities/02a-student-management.md) | [Student ERD](docs/architecture/erd/02a-student.md) |
| **02b. Tutor** | [Tutor Specs](docs/architecture/entities/02b-tutor-management.md) | [Tutor ERD](docs/architecture/erd/02b-tutor.md) |
| **02c. Parent** | [Parent Specs](docs/architecture/entities/02c-parent-management.md) | [Parent ERD](docs/architecture/erd/02c-parent.md) |
| **03. Academic** | [Academic Specs](docs/architecture/entities/03-academic-management.md) | [Academic ERD](docs/architecture/erd/03-academic.md) |
| **04. Learning** | [Learning Specs](docs/architecture/entities/04-learning-management.md) | [Learning ERD](docs/architecture/erd/04-learning.md) |
| **05. Assessment** | [Assessment Specs](docs/architecture/entities/05-assessment-management.md) | [Assessment ERD](docs/architecture/erd/05-assessment.md) |
| **06. Communication** | [Communication Specs](docs/architecture/entities/06-communication-management.md) | [Communication ERD](docs/architecture/erd/06-communication.md) |
| **07. Reporting** | [Reporting Specs](docs/architecture/entities/07-reporting-management.md) | [Reporting ERD](docs/architecture/erd/07-reporting.md) |
| **08. System** | [System Specs](docs/architecture/entities/08-system-management.md) | [System ERD](docs/architecture/erd/08-system.md) |
| **09. Fee Management** | [Fee Specs](docs/architecture/entities/09-fee-management.md) | [Fee ERD](docs/architecture/erd/09-fee-management.md) |

---

## 🖥️ System Modules (Portal Actions)

The system boundary organizes business portals according to operational roles. Modules are grouped and numbered sequentially based on layout navigation flow:

### 🏢 Platform Administrator Portal
*Managed by Platform Owner to configure and monitor tenants.*
- [01-navigation.md](docs/modules/platform-admin/01-navigation.md): Main platform portal index.
- [02-dashboard.md](docs/modules/platform-admin/02-dashboard.md): Global overview indicators.
- [03-institutes.md](docs/modules/platform-admin/03-institutes.md): Onboarding and status controls.
- [04-subscriptions.md](docs/modules/platform-admin/04-subscriptions.md): Licensing tiers.
- [05-settings.md](docs/modules/platform-admin/05-settings.md): Platform policies.
- [06-workflow.md](docs/modules/platform-admin/06-workflow.md): Automated provisioning systems.

### 🏫 Tenant Administrator Portal
*Managed by coaching institute owner or operational staffs.*
- [01-navigation.md](docs/modules/tenant-admin/01-navigation.md): Portal layout index.
- [02-dashboard.md](docs/modules/tenant-admin/02-dashboard.md): Daily stats & metrics.
- [03-students.md](docs/modules/tenant-admin/03-students.md): Enrolling and profile management.
- [04-parents.md](docs/modules/tenant-admin/04-parents.md): Profile setup and performance links.
- [05-tutors.md](docs/modules/tenant-admin/05-tutors.md): Onboarding teachers & workload.
- [06-academics.md](docs/modules/tenant-admin/06-academics.md): Courses, parallel Batches, and Course-level Subjects.
- [07-mock-tests.md](docs/modules/tenant-admin/07-mock-tests.md): Test creations, evaluations, and results.
- [08-study-materials.md](docs/modules/tenant-admin/08-study-materials.md): Content folders, tags, and chapter links.
- [09-fee-management.md](docs/modules/tenant-admin/09-fee-management.md): Fee structures, installment plans, payments, and immutable receipts.
- [10-reports.md](docs/modules/tenant-admin/10-reports.md): Custom data extraction and analytics dashboards.
- [11-settings.md](docs/modules/tenant-admin/11-settings.md): Tenant custom assets, working hours, and branding configurations.
- [12-workflow.md](docs/modules/tenant-admin/12-workflow.md): Batch triggers, auto-notifications, and lifecycle events.

---

## 🛠️ Developer Onboarding & Contribution Guide

To begin working on database models or API development, follow these architectural directives:

1. **Strict Multi-Tenant Queries:** Never write un-scoped database reads. All queries must pass through context scoping:
   ```typescript
   // Correct pattern:
   const students = await prisma.student.findMany({ where: { institute_id } });
   ```
2. **Asymmetric Security:** The secret keys are signed on the server; public keys must be used on separate client service validations. Keep access token lifetime at 15 minutes.
3. **Subject-Batch Relationship Rule:** Never define a Subject directly under a Batch. Subjects must belong to a Course, and are connected to Batches only via a `TutorAssignment` mapping model.
4. **Immutable Transaction Rules:** No payment record can be modified or deleted directly. Corrections must be handled through explicit compensation/adjustment transactions generating new payment receipts.
