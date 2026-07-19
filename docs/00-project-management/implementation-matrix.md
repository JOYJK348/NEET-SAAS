# Implementation Matrix

> Master feature tracking with unique IDs, statuses, version mapping, and priority.

**Last Updated:** 2026-07-19  
**Source:** [V1 Scope Freeze](../v1-scope-freeze.md), [Implementation Workbook](../implementation/implementfull.md)  
**Owner:** Jay

---

## Legend

| Status         | Meaning                          |
| :------------- | :------------------------------- |
| ✅ Done        | Implemented, tested, merged      |
| 🔄 In Progress | Active development               |
| ⏳ Planned     | Defined but not started          |
| 📝 Scoped      | Added to scope, pending schedule |

---

## Features

| ID        | Feature                         | Domain          | Sprint | Version  |   Priority   |       Status       | Dependencies        |
| :-------- | :------------------------------ | :-------------- | :----: | :------: | :----------: | :----------------: | :------------------ |
| **F-001** | Monorepo Setup                  | Infrastructure  |  S0A   |   v0.1   |   Critical   |      ✅ Done       | None                |
| **F-002** | Docker Environment              | Infrastructure  |  S0A   |   v0.1   |   Critical   |      ✅ Done       | F-001               |
| **F-003** | CI/CD Pipeline                  | Infrastructure  |  S0A   |   v0.1   |     High     |      ✅ Done       | F-001               |
| **F-004** | NestJS Platform Foundation      | Backend         |  S0B   |   v0.2   |   Critical   |      ✅ Done       | F-001               |
| **F-005** | Prisma Database Integration     | Backend         |  S0B   |   v0.2   |   Critical   |      ✅ Done       | F-004               |
| **F-006** | Redis Cache Layer               | Backend         |  S0B   |   v0.2   |   Critical   |      ✅ Done       | F-004               |
| **F-007** | Auth Foundation (JWT)           | Backend         |   S1   |   v0.2   |   Critical   |      ✅ Done       | F-004               |
| **F-008** | RBAC & Permissions              | Backend         |   S1   |   v0.2   |   Critical   |      ✅ Done       | F-007               |
| **F-009** | Swagger API Docs                | Backend         |  S0B   |   v0.2   |   Critical   |      ✅ Done       | F-004               |
| **F-010** | Health Checks                   | Backend         |  S0B   |   v0.2   |   Critical   |      ✅ Done       | F-004               |
| **F-011** | Frontend Foundation             | Frontend        |  S0C   |   v0.3   |   Critical   |      ✅ Done       | F-004               |
| **F-012** | UI Component Library            | Frontend        |  S0C   |   v0.3   |     High     |      ✅ Done       | F-011               |
| **F-013** | Portal Dashboard Layouts        | Frontend        |  S0C   |   v0.3   |   Critical   |      ✅ Done       | F-011               |
| **F-014** | Auth UI (Login/Register)        | Frontend        |   S3   |   v1.0   |   Critical   |      ✅ Done       | F-007, F-011        |
| **F-015** | People Management (BE)          | Backend         |   S2   |   v1.2   |   Critical   |      ✅ Done       | F-004               |
| **F-016** | Student CRUD (BE)               | Backend         |   S2   |   v1.2   |   Critical   |      ✅ Done       | F-015               |
| **F-017** | Admissions Lifecycle (BE)       | Backend         |   S2   |   v1.2   |   Critical   |      ✅ Done       | F-016               |
| **F-018** | Batch Enrollment (BE)           | Backend         |   S2   |   v1.2   |   Critical   |      ✅ Done       | F-017               |
| **F-019** | Student Management UI           | Frontend        |   S3   |   v1.0   |   Critical   |      ✅ Done       | F-016, F-011        |
| **F-020** | Admissions UI                   | Frontend        |   S3   |   v1.0   |   Critical   |      ✅ Done       | F-017, F-011        |
| **F-021** | Batch Management UI             | Frontend        |   S3   |   v1.0   |   Critical   |      ✅ Done       | F-018, F-011        |
| **F-022** | Responsive UX Polish            | Frontend        |   S4   |   v1.0   |     High     |      ✅ Done       | F-019, F-020, F-021 |
| **F-023** | **Branches (BE + FE)**          | **Master Data** | **S5** | **v1.1** | **Critical** | **🔄 In Progress** | F-004, F-011        |
| **F-024** | **Courses (BE + FE)**           | **Master Data** | **S5** | **v1.1** | **Critical** | **🔄 In Progress** | F-023               |
| **F-025** | **Subjects (BE + FE)**          | **Master Data** | **S5** | **v1.1** | **Critical** | **🔄 In Progress** | F-024               |
| **F-026** | **Chapters & Topics (BE + FE)** | **Master Data** | **S5** | **v1.1** | **Critical** | **🔄 In Progress** | F-025               |
| **F-027** | **Academic Years (BE + FE)**    | **Master Data** | **S5** | **v1.1** |   **High**   | **🔄 In Progress** | F-023               |
| **F-028** | **Delivery Types (BE + FE)**    | **Master Data** | **S5** | **v1.1** |   **High**   | **🔄 In Progress** | F-023               |
| **F-029** | Platform Admin (Tenants)        | Backend         |   S1   |   v1.0   |   Critical   |     ⏳ Planned     | F-004               |
| **F-030** | Attendance (Sessions, Records)  | Backend         |   S4   |   v1.3   |     High     |     ⏳ Planned     | F-018               |
| **F-031** | Attendance UI                   | Frontend        |   S4   |   v1.3   |     High     |     ⏳ Planned     | F-030, F-011        |
| **F-032** | Study Materials (BE)            | Backend         |   S6   |   v1.4   |     High     |     ⏳ Planned     | F-004               |
| **F-033** | Homework & Assignments (BE)     | Backend         |   S6   |   v1.4   |     High     |     ⏳ Planned     | F-032               |
| **F-034** | Learning Materials UI           | Frontend        |   S6   |   v1.4   |     High     |     ⏳ Planned     | F-032, F-011        |
| **F-035** | Live Classes (Jitsi)            | Backend         |   S7   |   v1.5   |     High     |     ⏳ Planned     | F-004               |
| **F-036** | Recordings & Watch History      | Backend         |   S7   |   v1.5   |    Medium    |     ⏳ Planned     | F-035               |
| **F-037** | Live Classes UI                 | Frontend        |   S7   |   v1.5   |     High     |     ⏳ Planned     | F-035, F-011        |
| **F-038** | Question Bank (BE)              | Backend         |   S8   |   v1.6   |   Critical   |     ⏳ Planned     | F-004               |
| **F-039** | MCQ Auto-Grader                 | Backend         |   S8   |   v1.6   |   Critical   |     ⏳ Planned     | F-038               |
| **F-040** | Exam Taker UI                   | Frontend        |   S8   |   v1.6   |   Critical   |     ⏳ Planned     | F-038, F-011        |
| **F-041** | Fee Structures (BE)             | Backend         |   S9   |   v1.7   |     High     |     ⏳ Planned     | F-004               |
| **F-042** | Payments & Receipts (BE)        | Backend         |   S9   |   v1.7   |   Critical   |     ⏳ Planned     | F-041               |
| **F-043** | Billing UI                      | Frontend        |   S9   |   v1.7   |   Critical   |     ⏳ Planned     | F-041, F-011        |
| **F-044** | Notifications & Comms           | Backend         |  S10   |   v1.8   |    Medium    |     ⏳ Planned     | F-007               |
| **F-045** | Analytics Dashboards            | Backend         |  S10   |   v1.8   |    Medium    |     ⏳ Planned     | F-004               |
| **F-046** | AI Doubt Assistant              | Backend         |  S10   |   v1.8   |    Medium    |     ⏳ Planned     | F-004               |
| **F-047** | Production Deploy               | DevOps          |  S11   |   v2.0   |   Critical   |     ⏳ Planned     | All                 |

---

## Version Map

| Version | Sprints    | Key Features                                      |
| :------ | :--------- | :------------------------------------------------ |
| v0.1    | S0A        | Monorepo, Docker, CI                              |
| v0.2    | S0B, S1    | Backend foundation, Auth                          |
| v0.3    | S0C        | Frontend foundation, UI library                   |
| v1.0    | S2, S3, S4 | People, Students, Admissions, Batches, Responsive |
| v1.1    | S5         | Master Data (Branches, Courses, Subjects, Topics) |
| v1.2    | —          | _(future)_                                        |
| v1.3    | —          | _(future)_                                        |
| v2.0    | S11        | Production Go-Live                                |
