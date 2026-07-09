# Project Overview: Multi-Tenant Coaching Management Platform (CMP)

The **Multi-Tenant Coaching Management Platform (CMP)** is a software-as-a-service (SaaS) solution designed to run administrative, academic, learning, and financial workflows for premium coaching institutes and training centers.

The platform focuses on operational efficiency for administrators, curriculum mastery for tutors, transparent progress tracking for parents, and robust, adaptive learning tools for students.

---

## 🎯 Project Vision & Goals

The core objective of this project is to move institutes away from disjointed software stacks (combinations of WhatsApp groups, spreadsheets, manual OMR scanning, physical receipt books, and separate video calling systems) into a single unified workspace.

### Key Goals
- **Operational Excellence:** Complete scheduling, attendance, faculty workload, and fee tracking under a single console.
- **Accurate Mock Evaluator:** Standardized mock tests supporting physical paper evaluations (OMR uploads and tutor grading) with instant performance-analysis reports.
- **Learning Continuity:** Interactive live class schedules backed by auto-archived recordings and tagged study materials.
- **Tenant Isolation:** Absolute security boundaries matching high-grade compliance so that no institute's data ever leaks to another.

---

## 🛠️ Unified System Topology

The platform coordinates system layers across three primary operational views:

```text
                                   ┌──────────────────────────┐
                                   │   Platform Admin Portal  │
                                   └─────────────┬────────────┘
                                                 │
                                        (Onboards Tenants)
                                                 │
                                                 ▼
                                   ┌──────────────────────────┐
                                   │   Tenant Admin Portal    │
                                   └──────┬────────────┬──────┘
                                          │            │
                                  (Manages)            (Assigns)
                                          │            │
                                          ▼            ▼
                            ┌───────────────┐        ┌───────────────┐
                            │    Students   │        │    Tutors     │
                            └───────┬───────┘        └───────────────┘
                                    │
                               (Monitored by)
                                    │
                                    ▼
                            ┌───────────────┐
                            │    Parents    │
                            └───────────────┘
```

---

## 📂 System Core Modules

The Platform organizes functional specifications across these main interfaces:

### 1. Platform Administration
- **Tenant Onboarding:** Automatic generation of Tenant Admin identities and activation parameters.
- **Licensing and Subscriptions:** Custom subscription packages (tier configurations, max student limits, and feature flags).
- **Branding Orchestration:** Scoped setups allowing Tenant-specific logos and contact points.

### 2. Tenant Administration
- **User Lifecycle:** Direct operations for managing Student profiles, Tutor allocations, and Parent linkages.
- **Academic Setup:** Defining Course scopes, creating parallel Batches, and managing Course-level Subjects and Chapters.
- **Mock Tests:** Setup schedules, manage OMR evaluation queues, and track marks.
- **Fee Management:** Flexible payment installment structures, discount systems, payment recordings, and PDF receipts.

### 3. Tutor Portal
- **Classroom Delivery:** Access timetables, host live classes via Jitsi, and upload session materials.
- **Evaluation Queue:** Grade subjective test components and review scanned student answer sheets.

### 4. Student & Parent Portals
- **Learning Hub:** Direct access to live classes, study notes, class video records, and subjective assignments.
- **Analytics Dashboard:** Visual representation of weak test topics, mock test rankings, and cumulative syllabus progress.

---

## 🛡️ Critical Architectural Standards

The implementation matches these baseline engineering decisions:

1. **Stateless Authentication with Revocable Session State:**
   Using **JWT + Supabase Auth** carrying `institute_id` context. Access tokens are transient (15-min lifetimes, client in-memory storage only). Silent refreshes are run via **HttpOnly Secure SameSite=Strict cookies** using a rotating Refresh Token schema.
2. **Row-Level Tenancy Security:**
   Using a single, cost-effective Supabase PostgreSQL instance with **Row-Level Security (RLS)** and Prisma middlewares automatically injecting `institute_id` into all queries. 
3. **Curriculum Topology:**
   Subjects are Course-scoped, never Batch-scoped. This guarantees database reusability across multiple batches. Batch delivery is established exclusively through a `TutorAssignment` bridge model.

---

## 🚀 Phase 1 Implementation Roadmap

```mermaid
gantt
    title Coaching Management Platform Phase 1 Roadmap
    dateFormat  YYYY-MM-DD
    section Core Infrastructure
    Auth & Multi-Tenancy Design      :done,    des1, 2026-07-06, 2026-07-08
    Database Schema & Migration      :active,  des2, 2026-07-09, 3d
    section Module Setup
    Tenant Portal & Enrollment       :         des3, after des2, 5d
    Academic Setup (Courses/Subjects):         des4, after des3, 4d
    section Learning & Fees
    Study Material & Live Class (Jitsi):       des5, after des4, 5d
    Fee Structures & Receipts        :         des6, after des5, 5d
    section Assessments
    Mock Tests & Paper Evaluation    :         des7, after des6, 6d
```
