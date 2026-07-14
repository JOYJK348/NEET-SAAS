# NEET Platform V1 Implementation Workbook (Maturity Level 10/10)

Machi, here is the complete, production-grade **17-Sheet Project Management Workbook** data. It uses the **Final Sprint Sheet Structure** mapping every sprint to the strict database ➔ backend ➔ frontend ➔ testing ➔ deployment ➔ documentation ➔ demo lifecycle.

---

## WORKBOOK TAB DIRECTORY
*   **TAB 00:** [Dashboard](#tab-00--dashboard)
*   **TAB 01:** [Sprint Roadmap](#tab-01--sprint-roadmap)
*   **TAB 02:** [Sprint 0A — Workspace Setup](#tab-02--sprint-0a--workspace-setup)
*   **TAB 03:** [Sprint 0B — Platform Foundation](#tab-03--sprint-0b--platform-foundation)
*   **TAB 04:** [Sprint 0C — UI Foundation](#tab-04--sprint-0c--ui-foundation)
*   **TAB 05:** [Sprint 1 — 14 Platform](#tab-05--sprint-1--14-platform)
*   **TAB 06:** [Sprint 2 — 01 Master Setup](#tab-06--sprint-2--01-master-setup)
*   **TAB 07:** [Sprint 3 — 04 Identity & People](#tab-07--sprint-3--04-identity--people)
*   **TAB 08:** [Sprint 4 — 05 Academics](#tab-08--sprint-4--05-academics)
*   **TAB 09:** [Sprint 5 — 08 Learning](#tab-09--sprint-5--08-learning)
*   **TAB 10:** [Sprint 6 — 09 Live Classes](#tab-10--sprint-6--09-live-classes)
*   **TAB 11:** [Sprint 7 — 06 Exams & 07 QB](#tab-11--sprint-7--06-exams--07-qb)
*   **TAB 12:** [Sprint 8 — 10 Billing](#tab-12--sprint-8--10-billing)
*   **TAB 13:** [Sprint 9 — 11 Comms, 12 Analytics & 13 AI](#tab-13--sprint-9--11-comms-12-analytics--13-ai)
*   **TAB 14:** [Sprint 10 — Production Go-Live](#tab-14--sprint-10--production-go-live)
*   **TAB 15:** [Bugs & Blockers](#tab-15--bugs--blockers)
*   **TAB 16:** [Release Checklist](#tab-16--release-checklist)
*   **TAB 17:** [Change Log](#tab-17--change-log)
*   **TAB 18:** [Risks & Dependencies](#tab-18--risks--dependencies)

---

## TAB 00 — Dashboard

*Copy to Sheet: `00_dashboard`*

| Metric Description | Current Value / Formula | Target / SLA | Status |
|:---|:---|:---|:---:|
| **Overall Project Progress %** | `=AVERAGE('01 Sprint Roadmap'!D2:D12)` | `100.0%` | In Progress |
| **Total Completed Tasks** | `=COUNTIF('02 Sprint 0A'!C:C, "Completed") + COUNTIF('03 Sprint 0B'!C:C, "Completed") + ...` | `All Tasks` | Tracking |
| **Active Bugs Count** | `=COUNTIF('15 Bugs'!G:G, "Open")` | `0` | Stable |
| **Resolved Bugs Count** | `=COUNTIF('15 Bugs'!G:G, "Resolved")` | — | Tracking |
| **Release Quality Gate Readiness** | `=COUNTIF('16 Release Checklist'!C:C, "Verified") / COUNTA('16 Release Checklist'!C:C)` | `100.0%` | Pending |
| **Current Active Sprint** | `Sprint 0A` | — | Active |

---

## TAB 01 — Sprint Roadmap

*Copy to Sheet: `01_sprint_roadmap`*

| Sprint | Name | Duration | Progress | Status | Dependencies | Owner |
|:---|:---|:---:|:---:|:---|:---|:---|
| **0A** | Workspace Setup | 3 Days | 0% | Active | None | Jay |
| **0B** | Platform Foundation | 7 Days | 0% | Not Started | Sprint 0A | Jay |
| **0C** | UI Foundation | 7 Days | 0% | Not Started | Sprint 0B | Jay |
| **1** | Platform Admin | 7 Days | 0% | Not Started | Sprint 0C | Jay |
| **2** | Tenant Setup & Master | 7 Days | 0% | Not Started | Sprint 1 | Jay |
| **3** | Identity & People | 14 Days | 0% | Not Started | Sprint 2 | Jay |
| **4** | Academics (Attendance) | 7 Days | 0% | Not Started | Sprint 3 | Jay |
| **5** | Learning | 7 Days | 0% | Not Started | Sprint 4 | Jay |
| **6** | Live Classes | 14 Days | 0% | Not Started | Sprint 5 | Jay |
| **7** | Assessments & QB | 14 Days | 0% | Not Started | Sprint 6 | Jay |
| **8** | Fees & Billing | 14 Days | 0% | Not Started | Sprint 3 | Jay |
| **9** | Comms, Analytics & AI | 14 Days | 0% | Not Started | Sprint 7 | Jay |
| **10** | Production Go-Live | 14 Days | 0% | Not Started | All Sprints | Jay |

---

## TAB 02 — Sprint 0A — Workspace Setup

### Sprint Metadata
*   **Sprint Goal:** Workspace Scaffolding & Monorepo Setup
*   **Duration:** 3 Days
*   **Expected Deliverables:** Running monorepo structure with apps/api, apps/web, shared configurations, and local docker environment.
*   **Version:** `v0.1` | **Release Date:** 2026-07-22
*   **Owner:** Jay | **Progress:** `=COUNTIF(F11:F25, "Done") / COUNTA(F11:F25)`
*   **Expected Output:** Tables: `0` \| APIs: `1` \| Pages: `1` \| Components: `0` \| Workers: `0` \| Queues: `0`
*   **Dependencies:** None
*   **Risks:** None

### Task Execution Matrix
*Columns: `Task ID`, `Phase`, `Task Description`, `Priority`, `Estimate (hrs)`, `Actual (hrs)`, `Variance`, `Status`, `Git Branch`, `PR Link`, `Issue Link`, `Remarks`*

| Task ID | Phase | Task Description | Priority | Estimate (hrs) | Actual (hrs) | Variance | Status | Git Branch | PR Link | Issue Link | Remarks |
|:---|:---|:---|:---:|:---:|:---:|:---:|:---|:---|:---|:---|:---|
| **S0A-001** | Repo | Initialize git repository | Critical | 1 | 1 | 0 | Done | feature/S0A-001-git-init | develop | — | Run git init |
| **S0A-002** | Repo | Setup pnpm-workspace.yaml | Critical | 1 | 1 | 0 | Done | feature/S0A-001-git-init | develop | — | Define package scopes |
| **S0A-003** | Repo | Setup Turborepo cache workspace configuration | Critical | 2 | 2 | 0 | Done | feature/S0A-001-git-init | develop | — | Write turbo.json rules |
| **S0A-004** | Repo | Scaffold apps/api, apps/web, packages/ folders | Critical | 1 | 1 | 0 | Done | feature/S0A-004-scaffold | develop | — | Folder scaffolding |
| **S0A-005** | Repo | Setup shared config packages (ESLint, Prettier) | High | 3 | 3 | 0 | Done | feature/S0A-004-scaffold | develop | — | Shared TS guidelines |
| **S0A-006** | Backend | Scaffold NestJS API app in apps/api | Critical | 2 | 2 | 0 | Done | feature/S0A-006-nestjs | develop | — | Base NestJS install |
| **S0A-007** | Backend | Configure NestJS folders structure and modules | Critical | 2 | 2 | 0 | Done | feature/S0A-006-nestjs | develop | — | Align contexts dirs |
| **S0A-008** | Backend | Implement NestJS baseline health check API controller | Critical | 2 | 2 | 0 | Done | feature/S0A-006-nestjs | develop | — | `/health` endpoint |
| **S0A-009** | Frontend | Bootstrap Next.js App Router in apps/web | Critical | 2 | 2 | 0 | Done | feature/S0A-009-nextjs | develop | — | Base Next.js install |
| **S0A-010** | Frontend | Install Tailwind CSS & configure global styles config | Critical | 2 | 2 | 0 | Done | feature/S0A-009-nextjs | develop | — | Theme base variables |
| **S0A-011** | Frontend | Configure apps/web route folders and layouts structure | High | 2 | 2 | 0 | Done | feature/S0A-009-nextjs | develop | — | Scopes routes layout |
| **S0A-012** | DevOps | Create docker-compose.yml for local Postgres & Redis | Critical | 3 | 3 | 0 | Done | develop | develop | — | Local docker containers |
| **S0A-013** | CI/CD | Setup GitHub Actions check pipeline | High | 3 | 3 | 0 | Done | develop | develop | — | PR compile checks |

### Acceptance Criteria
*   [ ] Monorepo workspace initializes packages dynamically.
*   [ ] Local Docker compose spins up Postgres database and Redis memory instances.
*   [ ] Git pre-commit hooks check ESLint and formatting standards before commit logs.

### Definition of Done (DoD)
*   [ ] pnpm install resolves successfully.
*   [ ] pnpm dev starts apps/api and apps/web concurrently.
*   [ ] pnpm build compiles all workspaces successfully.

### Client Demo Tracker
*   **Demo Date:** 2026-07-22 | **Demo URL:** `http://web-preview.neet-platform.com`
*   **Demo Status:** Pending | **Feedback:** —

---

## TAB 03 — Sprint 0B — Platform Foundation

### Sprint Metadata
*   **Sprint Goal:** Secure connection layer, DB Schemas, RLS execution, Redis, BullMQ, R2, Mailer.
*   **Duration:** 7 Days
*   **Expected Deliverables:** Secure APIs with JWT asymmetric signature verification, active tenant scoping, files storage adapter, and health checks.
*   **Version:** `v0.2` | **Release Date:** 2026-07-30
*   **Owner:** Jay | **Progress:** `=COUNTIF(F11:F26, "Done") / COUNTA(F11:F26)`
*   **Expected Output:** Tables: `6` \| APIs: `8` \| Pages: `0` \| Components: `0` \| Workers: `2` \| Queues: `2`
*   **Dependencies:** Sprint 0A
*   **Risks:** Delay in Cloudflare R2 bucket connection credentials validation.

### Task Execution Matrix
*Columns: `Task ID`, `Phase`, `Task Description`, `Priority`, `Estimate (hrs)`, `Actual (hrs)`, `Variance`, `Status`, `Git Branch`, `PR Link`, `Issue Link`, `Remarks`*

| Task ID | Phase | Task Description | Priority | Estimate (hrs) | Actual (hrs) | Variance | Status | Git Branch | PR Link | Issue Link | Remarks |
|:---|:---|:---|:---:|:---:|:---:|:---:|:---|:---|:---|:---|:---|
| **S0B-001** | Config | ConfigModule + Zod environment validation (split config files) | Critical | 2 | 2 | 0 | Done | develop | develop | — | Split typed config schema |
| **S0B-002** | Context | Request Context (AsyncLocalStorage rich context Middleware) | Critical | 3 | 3 | 0 | Done | develop | develop | — | Tenant/User rich context |
| **S0B-003** | Logger | LoggerModule (Pino Integration with Context Enrichment) | Critical | 3 | 3 | 0 | Done | develop | develop | — | Structured request logging |
| **S0B-004** | Valid | Validation Pipe + DTO Standardizations | Critical | 2 | 2 | 0 | Done | develop | develop | — | Transform & Whitelist DTOs |
| **S0B-005** | Filter | Global Exception Filter (standardized errors + requestId + DB error masking) | Critical | 3 | 3 | 0 | Done | develop | develop | — | Mask sensitive stack traces |
| **S0B-006** | Intercept | Response Interceptor (success response wrapping) | Critical | 2 | 2 | 0 | Done | develop | develop | — | Wrap unified return body |
| **S0B-007** | Prisma | PrismaModule + PrismaService (common/prisma) | Critical | 3 | 3 | 0 | Done | develop | develop | — | Prisma client setup |
| **S0B-008** | Redis | RedisModule + RedisService (common/redis with get/set/del/ttl abstractions) | Critical | 3 | 3 | 0 | Done | develop | develop | — | Cache abstraction service |
| **S0B-009** | Security | Security, Global Prefix & API Versioning (main.ts setup) | Critical | 3 | 3 | 0 | Done | develop | develop | — | Global express middlewares |
| **S0B-010** | Swagger | Swagger Configuration (common/swagger) | Critical | 2 | 2 | 0 | Done | develop | develop | — | API docs specifications |
| **S0B-011** | Health | Enhanced Health Checks (Terminus live/ready/health checks) | Critical | 3 | 0 | 0 | Not Started | — | — | — | Database/Redis terminuses |
| **S0B-012** | Testing | Integration Tests + CI Pipeline Verification | High | 3 | 0 | 0 | Not Started | — | — | — | Verify endpoints behavior |

### Acceptance Criteria
*   [ ] All request actions carrying invalid tenant ID headers are rejected with 400 Bad Request.
*   [ ] Access tokens expire in 15 minutes, automatically rotating via HttpOnly refresh tokens.
*   [ ] Upload adapter blocks files exceeding 100MB on Cloudflare R2.

### Definition of Done (DoD)
*   [ ] Database migrations deploy without data loss warnings.
*   [ ] Swagger documentation page displays active auth controllers APIs correctly.
*   [ ] RLS policy rules prevent users from querying alternate tenant scopes.

### Client Demo Tracker
*   **Demo Date:** 2026-07-30 | **Demo URL:** `http://api-staging.neet-platform.com/swagger`
*   **Demo Status:** Pending | **Feedback:** —

---

## TAB 04 — Sprint 0C — UI Foundation

### Sprint Metadata
*   **Sprint Goal:** Axios client interceptor setup, Zustand stores, 5 dashboard layouts mock shells.
*   **Duration:** 7 Days
*   **Expected Deliverables:** UI client containing token handling interceptor, global navigation frame layouts, dynamic theme toggle selector, and atomic components library.
*   **Version:** `v0.3` | **Release Date:** 2026-08-07
*   **Owner:** Jay | **Progress:** `=COUNTIF(F11:F22, "Done") / COUNTA(F11:F22)`
*   **Expected Output:** Tables: `0` \| APIs: `0` \| Pages: `5` \| Components: `16` \| Workers: `0` \| Queues: `0`
*   **Dependencies:** Sprint 0B
*   **Risks:** UI design system inconsistencies in responsive frame limits on mobile.

### Task Execution Matrix
*Columns: `Task ID`, `Phase`, `Task Description`, `Priority`, `Estimate (hrs)`, `Actual (hrs)`, `Variance`, `Status`, `Git Branch`, `PR Link`, `Issue Link`, `Remarks`*

| Task ID | Phase | Task Description | Priority | Estimate (hrs) | Actual (hrs) | Variance | Status | Git Branch | PR Link | Issue Link | Remarks |
|:---|:---|:---|:---:|:---:|:---:|:---:|:---|:---|:---|:---|:---|
| **S0C-001** | Frontend | Setup Axios client with refresh tokens interceptor | Critical | 2 | 0 | 0 | Not Started | — | — | — | Client interceptor |
| **S0C-002** | Frontend | Configure React Query Client provider wrapper | Critical | 1 | 0 | 0 | Not Started | — | — | — | Local caching setup |
| **S0C-003** | Frontend | Initialize global Zustand stores (auth, theme) | Critical | 2 | 0 | 0 | Not Started | — | — | — | Save active session |
| **S0C-004** | Frontend | Write Next.js middleware.ts path checkers | Critical | 3 | 0 | 0 | Not Started | — | — | — | Redirect filters |
| **S0C-005** | Frontend | Build shared atomic components (Button, Input) | High | 4 | 0 | 0 | Not Started | — | — | — | UI primitives setup |
| **S0C-006** | Frontend | Build shared data display layouts (Table, Modal) | High | 4 | 0 | 0 | Not Started | — | — | — | Primitive modals UI |
| **S0C-007** | Frontend | Integrate toast notification banners wrapper | High | 2 | 0 | 0 | Not Started | — | — | — | Alert UI banner |
| **S0C-008** | Frontend | Build Platform Admin shell layout dashboard | Medium | 2 | 0 | 0 | Not Started | — | — | — | Super-admin dashboard|
| **S0C-009** | Frontend | Build Tenant Admin shell containing sidebar layout | Critical | 3 | 0 | 0 | Not Started | — | — | — | Admin portal layout |
| **S0C-010** | Frontend | Build Faculty Portal dashboard shell frame | High | 2 | 0 | 0 | Not Started | — | — | — | Tutor portal layout |
| **S0C-011** | Frontend | Build Student Portal dashboard shell frame | High | 2 | 0 | 0 | Not Started | — | — | — | Student portal layout|
| **S0C-012** | Frontend | Build Parent Portal dashboard shell frame | High | 2 | 0 | 0 | Not Started | — | — | — | Parent portal layout |

### Acceptance Criteria
*   [ ] Axios client rotates token in background on receiving 401 Unauthorized codes.
*   [ ] Path guard middleware redirects unauthenticated users to `/login`.
*   [ ] Dashboard sidebars collapse responsively on screen widths under 768px.

### Definition of Done (DoD)
*   [ ] All 5 portal shells render mock frames without Cumulative Layout Shift (CLS).
*   [ ] Accessibility check: Keyboard navigation maps through sidebars correctly.
*   [ ] Theme toggle switches variables between Light and Dark mode options.

### Client Demo Tracker
*   **Demo Date:** 2026-08-07 | **Demo URL:** `http://dev-portal.neet-platform.com`
*   **Demo Status:** Pending | **Feedback:** —

---

## TAB 05 — Sprint 1 — 14 Platform

### Sprint Metadata
*   **Sprint Goal:** Tenant onboarding, subscriptions configurations, feature flags management.
*   **Expected Deliverables:** Platform Admin Tenant provisioning interface, custom storage quotas limits, Razorpay webhook callback endpoints, and preview deployment setup.
*   **Version:** `v1.0` | **Release Date:** 2026-08-15
*   **Owner:** Jay | **Progress:** `=COUNTIF(F11:F18, "Done") / COUNTA(F11:F18)`
*   **Expected Output:** Tables: `4` \| APIs: `6` \| Pages: `3` \| Components: `8` \| Workers: `0` \| Queues: `0`
*   **Dependencies:** Sprint 0C
*   **Risks:** None

### Task Execution Matrix
*Columns: `Task ID`, `Phase`, `Task Description`, `Priority`, `Estimate (hrs)`, `Actual (hrs)`, `Variance`, `Status`, `Git Branch`, `PR Link`, `Issue Link`, `Remarks`*

| Task ID | Phase | Task Description | Priority | Estimate (hrs) | Actual (hrs) | Variance | Status | Git Branch | PR Link | Issue Link | Remarks |
|:---|:---|:---|:---:|:---:|:---:|:---:|:---|:---|:---|:---|:---|
| **S1-001** | Database | Scaffold tenants, subscriptions, plans, quotas tables | Critical | 3 | 0 | 0 | Not Started | — | — | — | Tenant base schemas |
| **S1-002** | Backend | Create Tenant profile CRUD API endpoints | Critical | 4 | 0 | 0 | Not Started | — | — | — | Create/edit tenants |
| **S1-003** | Backend | Write subscription storage quota and active user checker | Critical | 4 | 0 | 0 | Not Started | — | — | — | Lock check guards |
| **S1-004** | Backend | Implement dynamic feature flags evaluator controller | High | 3 | 0 | 0 | Not Started | — | — | — | Feature flags resolver|
| **S1-005** | Frontend | Build Platform Admin Tenant lists DataTable component | High | 3 | 0 | 0 | Not Started | — | — | — | DataTable display |
| **S1-006** | Frontend | Build Create Tenant modal containing default NEET configs | High | 3 | 0 | 0 | Not Started | — | — | — | Form inputs setup |
| **S1-007** | QA | Write integration tests verifying RLS scopes blocks | Critical | 4 | 0 | 0 | Not Started | — | — | — | DB security tests |
| **S1-008** | DevOps | Configure Preview Deployments for API and Web | Medium | 2 | 0 | 0 | Not Started | — | — | — | Automated preview link|

### Acceptance Criteria
*   [ ] Creating a tenant creates default workspace configurations automatically.
*   [ ] Changing a tenant's feature flag disables features in their admin settings.
*   [ ] Non-tenant users cannot access platform management API routes.

### Definition of Done (DoD)
*   [ ] Tenant CRUD API returns standard response envelopes.
*   [ ] System logs all tenant setup database alters.
*   [ ] RLS rules are verified on a local test database.

### Client Demo & Sign-off
*   **Demo Date:** 2026-08-15 | **Demo URL:** `http://preview.platform-admin.neet.com`
*   **Demo Status:** Pending | **Feedback:** —

---

## TAB 06 — Sprint 2 — 01 Master Setup

### Sprint Metadata
*   **Sprint Goal:** Initialize branches, active years, and Curriculum tree editor.
*   **Expected Deliverables:** Course ➔ Subject ➔ Chapter ➔ Topic curriculum tree manager, branch setup, and Year switcher.
*   **Version:** `v1.1` | **Release Date:** 2026-08-23
*   **Owner:** Jay | **Progress:** `=COUNTIF(F11:F18, "Done") / COUNTA(F11:F18)`
*   **Expected Output:** Tables: `4` \| APIs: `8` \| Pages: `2` \| Components: `6` \| Workers: `0` \| Queues: `0`
*   **Dependencies:** Sprint 1
*   **Risks:** Drag-and-drop hierarchy updates loop on large curriculum structures.

### Task Execution Matrix
*Columns: `Task ID`, `Phase`, `Task Description`, `Priority`, `Estimate (hrs)`, `Actual (hrs)`, `Variance`, `Status`, `Git Branch`, `PR Link`, `Issue Link`, `Remarks`*

| Task ID | Phase | Task Description | Priority | Estimate (hrs) | Actual (hrs) | Variance | Status | Git Branch | PR Link | Issue Link | Remarks |
|:---|:---|:---|:---:|:---:|:---:|:---:|:---|:---|:---|:---|:---|
| **S2-001** | Database | Scaffold branches, academic_years, curriculum_nodes tables| Critical | 3 | 0 | 0 | Not Started | — | — | — | Master schemas setup |
| **S2-002** | Backend | Create branch CRUD endpoints | Critical | 3 | 0 | 0 | Not Started | — | — | — | Create/edit branches |
| **S2-003** | Backend | Write active academic year selection endpoints | Critical | 3 | 0 | 0 | Not Started | — | — | — | Year active switcher |
| **S2-004** | Backend | Write recursive Curriculum nodes tree constructor API | Critical | 4 | 0 | 0 | Not Started | — | — | — | Tree CRUD queries |
| **S2-005** | Frontend | Build Branch profiles setup forms and year selectors | High | 3 | 0 | 0 | Not Started | — | — | — | Master config forms |
| **S2-006** | Frontend | Build drag-and-drop Curriculum Tree Manager UI component | Critical | 5 | 0 | 0 | Not Started | — | — | — | Drag curriculum UI |
| **S2-007** | QA | Write unit tests verifying tree database queries speed | Medium | 3 | 0 | 0 | Not Started | — | — | — | Performance check |
| **S2-008** | DevOps | Verify no memory loops in curriculum tree endpoints | High | 2 | 0 | 0 | Not Started | — | — | — | Node trace check |

### Acceptance Criteria
*   [ ] Dragging a curriculum node updates sort orders in the database.
*   [ ] Setting an academic year as inactive blocks new enrollments.
*   [ ] Curriculum tree load time `< 250ms`.

### Definition of Done (DoD)
*   [ ] Branches CRUD passes RLS checks.
*   [ ] Dynamic tree editor resolves drag-drop changes instantly.
*   [ ] Swagger documentation page displays active master APIs correctly.

### Client Demo & Sign-off
*   **Demo Date:** 2026-08-23 | **Demo URL:** `http://preview.tenant-admin.neet.com/master`
*   **Demo Status:** Pending | **Feedback:** —

---

## TAB 07 — Sprint 3 — 04 Identity & People

### Sprint Metadata
*   **Sprint Goal:** Student, Tutor, Parent onboarding + Portal dashboards shells.
*   **Expected Deliverables:** Registration forms, CSV student parser (BullMQ task), student/tutor directories, and parent linked student switcher.
*   **Version:** `v1.2` | **Release Date:** 2026-09-07
*   **Owner:** Jay | **Progress:** `=COUNTIF(F11:F21, "Done") / COUNTA(F11:F21)`
*   **Expected Output:** Tables: `5` \| APIs: `10` \| Pages: `8` \| Components: `14` \| Workers: `1` \| Queues: `1`
*   **Dependencies:** Sprint 2
*   **Risks:** CSV files parsing loops on invalid text parameters.

### Task Execution Matrix
*Columns: `Task ID`, `Phase`, `Task Description`, `Priority`, `Estimate (hrs)`, `Actual (hrs)`, `Variance`, `Status`, `Git Branch`, `PR Link`, `Issue Link`, `Remarks`*

| Task ID | Phase | Task Description | Priority | Estimate (hrs) | Actual (hrs) | Variance | Status | Git Branch | PR Link | Issue Link | Remarks |
|:---|:---|:---|:---:|:---:|:---:|:---:|:---|:---|:---|:---|:---|
| **S3-001** | Database | Write persons, learner_profiles, instructor_profiles tables | Critical | 3 | 0 | 0 | Not Started | — | — | — | Profile schemas setup |
| **S3-002** | Database | Write associated_contacts and contact_mappings tables | Critical | 3 | 0 | 0 | Not Started | — | — | — | Link maps schema |
| **S3-003** | Database | Write documents and medical_profiles schemas tables | High | 3 | 0 | 0 | Not Started | — | — | — | Medical profiles |
| **S3-004** | Backend | Create unified Person registration transaction API | Critical | 5 | 0 | 0 | Not Started | — | — | — | Transaction wrapper |
| **S3-005** | Backend | Write student and instructor profile edit controllers | Critical | 4 | 0 | 0 | Not Started | — | — | — | Edit user profile |
| **S3-006** | Backend | Create dynamic student/parent association mapping API | Critical | 3 | 0 | 0 | Not Started | — | — | — | Linked contacts |
| **S3-007** | Backend | Write background task CSV parsing bulk importer service | Critical | 4 | 0 | 0 | Not Started | — | — | — | CSV parses worker |
| **S3-008** | Frontend | Build student directory lists DataTable with search filters | High | 4 | 0 | 0 | Not Started | — | — | — | DataTable display |
| **S3-009** | Frontend | Build student admission wizard form elements UI | High | 4 | 0 | 0 | Not Started | — | — | — | Form wizard UI |
| **S3-010** | Frontend | Build bulk upload drag-and-drop CSV importer console | High | 3 | 0 | 0 | Not Started | — | — | — | CSV Console UI |
| **S3-011** | Frontend | Build linked parent portal profile switcher component | High | 3 | 0 | 0 | Not Started | — | — | — | Profile selector UI |

### Acceptance Criteria
*   [ ] Unified register creates person + user + role mapping in a single database transaction.
*   [ ] Uploading a non-whitelisted document format (e.g. executable files) is blocked.
*   [ ] Bulk parser handles 10,000 student rows in under 30s.

### Definition of Done (DoD)
*   [ ] User register endpoint returns validation error objects.
*   [ ] RLS rules are verified on people lookup endpoints.
*   [ ] System audits all user profile updates.

### Client Demo & Sign-off
*   **Demo Date:** 2026-09-07 | **Demo URL:** `http://preview.tenant-admin.neet.com/people`
*   **Demo Status:** Pending | **Feedback:** —

---

## TAB 08 — Sprint 4 — 05 Academics

### Sprint Metadata
*   **Sprint Goal:** Batch configuration, timetable scheduler, Attendance marking board.
*   **Expected Deliverables:** Batch directory, timetables editor, bulk attendance endpoints, Attendance Grid Board.
*   **Version:** `v1.3` | **Release Date:** 2026-09-15
*   **Owner:** Jay | **Progress:** `=COUNTIF(F11:F22, "Done") / COUNTA(F11:F22)`
*   **Expected Output:** Tables: `6` \| APIs: `8` \| Pages: `4` \| Components: `10` \| Workers: `0` \| Queues: `0`
*   **Dependencies:** Sprint 3
*   **Risks:** High database load when marking attendance in batches containing 100+ students.

### Task Execution Matrix
*Columns: `Task ID`, `Phase`, `Task Description`, `Priority`, `Estimate (hrs)`, `Actual (hrs)`, `Variance`, `Status`, `Git Branch`, `PR Link`, `Issue Link`, `Remarks`*

| Task ID | Phase | Task Description | Priority | Estimate (hrs) | Actual (hrs) | Variance | Status | Git Branch | PR Link | Issue Link | Remarks |
|:---|:---|:---|:---:|:---:|:---:|:---:|:---|:---|:---|:---|:---|
| **S4-001** | Database | Write learning_groups & group_assignments tables | Critical | 2 | 0 | 0 | Not Started | — | — | — | Batch allocation DB |
| **S4-002** | Database | Write timetable_entries & batch_instructors schemas | Critical | 3 | 0 | 0 | Not Started | — | — | — | Dynamic timetable DB|
| **S4-003** | Database | Write attendance_sessions & attendance_records schemas | Critical | 3 | 0 | 0 | Not Started | — | — | — | Attendance records DB|
| **S4-004** | Backend | Create student-to-batch allocation APIs | Critical | 3 | 0 | 0 | Not Started | — | — | — | Allocations routes |
| **S4-005** | Backend | Write weekly timetable schedule generator endpoints | Critical | 3 | 0 | 0 | Not Started | — | — | — | Timetable slots API |
| **S4-006** | Backend | Create bulk attendance post endpoints controller | Critical | 3 | 0 | 0 | Not Started | — | — | — | Bulk mark attendance |
| **S4-007** | Frontend | Build Tenant Admin batch configuration manager view | High | 3 | 0 | 0 | Not Started | — | — | — | Batch managers UI |
| **S4-008** | Frontend | Build Timetable calendar visual planner schedule grid | High | 3 | 0 | 0 | Not Started | — | — | — | Timetable schedule UI|
| **S4-009** | Frontend | Build Faculty Attendance marking Grid Board component | Critical | 4 | 0 | 0 | Not Started | — | — | — | Bulk checklist grid |
| **S4-010** | Frontend | Build Student Portal attendance tracking monthly view | High | 3 | 0 | 0 | Not Started | — | — | — | Student logs UI |
| **S4-011** | Frontend | Build Parent Portal child-attendance logs screen | High | 3 | 0 | 0 | Not Started | — | — | — | Parent logs UI |
| **S4-012** | QA | Write integration tests checking attendance mark limits | High | 4 | 0 | 0 | Not Started | — | — | — | Verify mark endpoints|

### Acceptance Criteria
*   [ ] Attendance grid resolves and renders in <300ms for 100 students.
*   [ ] Database queries avoid N+1 select loops.
*   [ ] Schedule conflict rules block overlapping classes for tutors/rooms.

### Definition of Done (DoD)
*   [ ] Attendance grid maps Present/Absent/Late/Excused selections correctly.
*   [ ] Database queries utilize proper indexes for branch lookup.
*   [ ] Swagger documentation page displays active academics APIs correctly.

### Client Demo & Sign-off
*   **Demo Date:** 2026-09-15 | **Demo URL:** `http://preview.faculty-portal.neet.com/attendance`
*   **Demo Status:** Pending | **Feedback:** —

---

## TAB 09 — Sprint 5 — 08 Learning

### Sprint Metadata
*   **Sprint Goal:** Upload study materials, set homework, submit assignments.
*   **Expected Deliverables:** Document upload dropzones, PDF/Video players, student homework upload forms, and grading queue panels.
*   **Version:** `v1.4` | **Release Date:** 2026-09-23
*   **Owner:** Jay | **Progress:** `=COUNTIF(F11:F20, "Done") / COUNTA(F11:F20)`
*   **Expected Output:** Tables: `3` \| APIs: `6` \| Pages: `4` \| Components: `8` \| Workers: `0` \| Queues: `0`
*   **Dependencies:** Sprint 4
*   **Risks:** None

### Task Execution Matrix
*Columns: `Task ID`, `Phase`, `Task Description`, `Priority`, `Estimate (hrs)`, `Actual (hrs)`, `Variance`, `Status`, `Git Branch`, `PR Link`, `Issue Link`, `Remarks`*

| Task ID | Phase | Task Description | Priority | Estimate (hrs) | Actual (hrs) | Variance | Status | Git Branch | PR Link | Issue Link | Remarks |
|:---|:---|:---|:---:|:---:|:---:|:---:|:---|:---|:---|:---|:---|
| **S5-001** | Database | Write learning_content, progress, and submissions tables | Critical | 3 | 0 | 0 | Not Started | — | — | — | Materials schema DB |
| **S5-002** | Backend | Integrate presigned URL uploads generator with R2 | Critical | 3 | 0 | 0 | Not Started | — | — | — | R2 file uploads hook|
| **S5-003** | Backend | Create study materials CRUD controller endpoints | Critical | 3 | 0 | 0 | Not Started | — | — | — | Resources list API |
| **S5-004** | Backend | Create homework assignments submissions & grading endpoints | Critical | 4 | 0 | 0 | Not Started | — | — | — | Homework evaluation|
| **S5-005** | Frontend | Build Faculty study files uploader console UI | High | 3 | 0 | 0 | Not Started | — | — | — | Upload manager UI |
| **S5-006** | Frontend | Build Faculty homework evaluation workspace queue | High | 3 | 0 | 0 | Not Started | — | — | — | Evaluate submissions|
| **S5-007** | Frontend | Build Student content listing and downloader panel | Critical | 4 | 0 | 0 | Not Started | — | — | — | Materials library UI|
| **S5-008** | Frontend | Build Student homework file upload panel | Critical | 4 | 0 | 0 | Not Started | — | — | — | Submit homework UI |
| **S5-009** | QA | Write unit tests verifying R2 upload file size block | Medium | 3 | 0 | 0 | Not Started | — | — | — | File size limit checks|
| **S5-010** | DevOps | Deploy updates and check storage usage metrics updates | Low | 1 | 0 | 0 | Not Started | — | — | — | Verify staging build|

### Acceptance Criteria
*   [ ] Tutor uploads note PDFs under Kinematics topic.
*   [ ] Non-batch students are blocked from downloading materials.
*   [ ] Large files process via chunked upload paths.

### Definition of Done (DoD)
*   [ ] Study materials download endpoint maps access roles.
*   [ ] Homework uploads update progress metrics in backend.
*   [ ] UI renders progress percentage accurately.

### Client Demo & Sign-off
*   **Demo Date:** 2026-09-23 | **Demo URL:** `http://preview.student-portal.neet.com/learning`
*   **Demo Status:** Pending | **Feedback:** —

---

## TAB 10 — Sprint 6 — 09 Live Classes

### Sprint Metadata
*   **Sprint Goal:** Jitsi meetings integration, R2 auto-recording callback webhooks, player bookmark tools.
*   **Expected Deliverables:** Class scheduler, meeting container, Video Player watch screen (speeds, bookmarks, progress).
*   **Version:** `v1.5` | **Release Date:** 2026-10-08
*   **Owner:** Jay | **Progress:** `=COUNTIF(F11:F21, "Done") / COUNTA(F11:F21)`
*   **Expected Output:** Tables: `4` \| APIs: `8` \| Pages: `4` \| Components: `10` \| Workers: `2` \| Queues: `2`
*   **Dependencies:** Sprint 5
*   **Risks:** Live video streaming playback latency under load.

### Task Execution Matrix
*Columns: `Task ID`, `Phase`, `Task Description`, `Priority`, `Estimate (hrs)`, `Actual (hrs)`, `Variance`, `Status`, `Git Branch`, `PR Link`, `Issue Link`, `Remarks` | Metadata*

| Task ID | Phase | Task Description | Priority | Estimate (hrs) | Actual (hrs) | Variance | Status | Git Branch | PR Link | Issue Link | Remarks |
|:---|:---|:---|:---:|:---:|:---:|:---:|:---|:---|:---|:---|:---|
| **S6-001** | Database | Write live_classes & sessions metadata tables | Critical | 2 | 0 | 0 | Not Started | — | — | — | Class scheduling DB |
| **S6-002** | Database | Write recordings & recording_watch_history schemas tables | Critical | 3 | 0 | 0 | Not Started | — | — | — | Video watch logs DB |
| **S6-003** | Backend | Implement Jitsi meeting rooms link generator endpoint | Critical | 4 | 0 | 0 | Not Started | — | — | — | Generate room links |
| **S6-004** | Backend | Write google calendar one-way sync event creator | Medium | 3 | 0 | 0 | Not Started | — | — | — | Sync calendar slots |
| **S6-005** | Backend | Write webhook controller to auto-sync R2 video paths | Critical | 4 | 0 | 0 | Not Started | — | — | — | Sync R2 video paths |
| **S6-006** | Backend | Create watch progress position logger endpoints | High | 4 | 0 | 0 | Not Started | — | — | — | Update watch history|
| **S6-007** | Frontend | Build Faculty Live class schedule calendar view | High | 3 | 0 | 0 | Not Started | — | — | — | Class calendar UI |
| **S6-008** | Frontend | Build Jitsi video meeting iframe container component | Critical | 4 | 0 | 0 | Not Started | — | — | — | Host video meeting UI|
| **S6-009** | Frontend | Build Student Recorded Video Player with speeds | Critical | 4 | 0 | 0 | Not Started | — | — | — | Play recorded video |
| **S6-010** | Frontend | Build student timestamp bookmarks & notes console | High | 3 | 0 | 0 | Not Started | — | — | — | Bookmarks panel UI |
| **S6-011** | QA | Write integration tests checking watch stats updates | High | 4 | 0 | 0 | Not Started | — | — | — | Verify watch logs |

### Acceptance Criteria
*   [ ] Tutors schedule classes. Room links are generated and synced to Google Calendar.
*   [ ] Video player loads and plays processed recordings from CDN in under 2.0 seconds.
*   [ ] Player resumes playback from the exact saved time index on page reload.

### Definition of Done (DoD)
*   [ ] Attendance is recorded automatically on session end.
*   [ ] Webhook endpoints verify Jitsi token signature keys.
*   [ ] Swagger documentation displays active live classes APIs correctly.

### Client Demo & Sign-off
*   **Demo Date:** 2026-10-08 | **Demo URL:** `http://preview.student-portal.neet.com/live`
*   **Demo Status:** Pending | **Feedback:** —

---

## TAB 11 — Sprint 7 — Assessments & QB

### Sprint Metadata
*   **Sprint Goal:** Question Bank editor, MCQ auto-grader, subjective evaluations approval pipeline.
*   **Expected Deliverables:** Question bank editor, exam taker portal containing timers, grading queue, scorecard ranking widgets.
*   **Version:** `v1.6` | **Release Date:** 2026-10-23
*   **Owner:** Jay | **Progress:** `=COUNTIF(F11:F20, "Done") / COUNTA(F11:F20)`
*   **Expected Output:** Tables: `6` \| APIs: `10` \| Pages: `4` \| Components: `12` \| Workers: `0` \| Queues: `0`
*   **Dependencies:** Sprint 6
*   **Risks:** Auto-grading concurrency locks on multiple submissions at the same timestamp.

### Task Execution Matrix
*Columns: `Task ID`, `Phase`, `Task Description`, `Priority`, `Estimate (hrs)`, `Actual (hrs)`, `Variance`, `Status`, `Git Branch`, `PR Link`, `Issue Link`, `Remarks`*

| Task ID | Phase | Task Description | Priority | Estimate (hrs) | Actual (hrs) | Variance | Status | Git Branch | PR Link | Issue Link | Remarks |
|:---|:---|:---|:---:|:---:|:---:|:---:|:---|:---|:---|:---|:---|
| **S7-001** | Database | Write questions, options, explain templates schemas | Critical | 3 | 0 | 0 | Not Started | — | — | — | Question schemas DB |
| **S7-002** | Database | Write assessments, attempts, answers tables | Critical | 3 | 0 | 0 | Not Started | — | — | — | Exam attempts DB |
| **S7-003** | Backend | Write MCQ exam auto-grading (+4/-1 evaluation) engine | Critical | 4 | 0 | 0 | Not Started | — | — | — | MCQ auto-grade |
| **S7-004** | Backend | Create subjective evaluation workflow controllers | Critical | 4 | 0 | 0 | Not Started | — | — | — | Grading queue API |
| **S7-005** | Frontend | Build Faculty Question Bank question editor form | High | 3 | 0 | 0 | Not Started | — | — | — | Question composer UI|
| **S7-006** | Frontend | Build Tenant Admin assessment configurations board | High | 3 | 0 | 0 | Not Started | — | — | — | Config assessments UI|
| **S7-007** | Frontend | Build Student Online Exam Taker containing timer | Critical | 5 | 0 | 0 | Not Started | — | — | — | Exam taker screen UI|
| **S7-008** | Frontend | Build Faculty grading evaluation grid layout screen | High | 3 | 0 | 0 | Not Started | — | — | — | Grade submissions UI|
| **S7-009** | Frontend | Build Student/Parent scorecard & ranking dashboard | Critical | 3 | 0 | 0 | Not Started | — | — | — | Results rankings UI |
| **S7-010** | QA | Write unit tests verifying grading logic results | High | 4 | 0 | 0 | Not Started | — | — | — | Verify grader logic |

### Acceptance Criteria
*   [ ] MCQ mock test evaluates scores (+4/-1) automatically on submit.
*   [ ] Subjective test papers route to the Faculty Grading Queue for review.
*   [ ] Results rankings are updated upon admin approval.

### Definition of Done (DoD)
*   [ ] MCQ evaluation completes in under 2.0 seconds.
*   [ ] Exam page monitors tab focus shifts (triggers warnings).
*   [ ] Auto-submit blocks student attempts when the timer reaches 0.

### Client Demo & Sign-off
*   **Demo Date:** 2026-10-23 | **Demo URL:** `http://preview.student-portal.neet.com/exams`
*   **Demo Status:** Pending | **Feedback:** —

---

## TAB 12 — Sprint 8 — 10 Billing

### Sprint Metadata
*   **Sprint Goal:** Billing structures setup, payment loggers, Razorpay webhooks checkout.
*   **Expected Deliverables:** Fee structures config form, payment ledgers, checkout modules, PDF receipt compilation queue.
*   **Version:** `v1.7` | **Release Date:** 2026-11-07
*   **Owner:** Jay | **Progress:** `=COUNTIF(F11:F19, "Done") / COUNTA(F11:F19)`
*   **Expected Output:** Tables: `6` \| APIs: `6` \| Pages: `3` \| Components: `8` \| Workers: `1` \| Queues: `1`
*   **Dependencies:** Sprint 3
*   **Risks:** Razorpay sandbox callback failures under load.

### Task Execution Matrix
*Columns: `Task ID`, `Phase`, `Task Description`, `Priority`, `Estimate (hrs)`, `Actual (hrs)`, `Variance`, `Status`, `Git Branch`, `PR Link`, `Issue Link`, `Remarks`*

| Task ID | Phase | Task Description | Priority | Estimate (hrs) | Actual (hrs) | Variance | Status | Git Branch | PR Link | Issue Link | Remarks |
|:---|:---|:---|:---:|:---:|:---:|:---:|:---|:---|:---|:---|:---|
| **S8-001** | Database | Write billing_structures, payments, receipts tables | Critical | 3 | 0 | 0 | Not Started | — | — | — | Billing schemas DB |
| **S8-002** | Backend | Write installment schedules calculator generator | Critical | 4 | 0 | 0 | Not Started | — | — | — | Generate installments|
| **S8-003** | Backend | Create PDF receipts compiler background worker task | High | 3 | 0 | 0 | Not Started | — | — | — | PDF compiler worker |
| **S8-004** | Backend | Implement Razorpay checkout webhook callback endpoint | Critical | 4 | 0 | 0 | Not Started | — | — | — | Webhook payment verify|
| **S8-005** | Frontend | Build Tenant Admin fee structures planner component | High | 3 | 0 | 0 | Not Started | — | — | — | Set fee structures UI|
| **S8-006** | Frontend | Build Student fee ledger with pay online buttons | Critical | 4 | 0 | 0 | Not Started | — | — | — | Ledger invoices list|
| **S8-007** | Frontend | Build Student download PDF receipt component button | High | 2 | 0 | 0 | Not Started | — | — | — | Download receipts UI|
| **S8-008** | Frontend | Build Parent fee checkout dashboard card | High | 3 | 0 | 0 | Not Started | — | — | — | Parent ledger UI |
| **S8-009** | QA | Write integration tests verifying webhook validation | High | 4 | 0 | 0 | Not Started | — | — | — | Webhook validation |

### Acceptance Criteria
*   [ ] Admin configures installment billing schedules.
*   [ ] Student completes checkout via Razorpay and gets a PDF receipt.
*   [ ] Double payment attempts on the same invoice block are blocked.

### Definition of Done (DoD)
*   [ ] Webhook controllers verify signature keys.
*   [ ] PDF receipts compile in the background without blocking the UI thread.
*   [ ] Ledger views pull data through optimized query indices.

### Client Demo & Sign-off
*   **Demo Date:** 2026-11-07 | **Demo URL:** `http://preview.student-portal.neet.com/billing`
*   **Demo Status:** Pending | **Feedback:** —

---

## TAB 13 — Sprint 9 — 11 Comms, 12 Analytics & 13 AI

### Sprint Metadata
*   **Sprint Goal:** Notification email templates (Resend), KPI Dashboards, AI doubt assistant, explanations box.
*   **Expected Deliverables:** Email broadcaster, WebSocket alerts dropdown, dashboards containing charts widgets, AI chat interface.
*   **Version:** `v1.8` | **Release Date:** 2026-11-22
*   **Owner:** Jay | **Progress:** `=COUNTIF(F11:F20, "Done") / COUNTA(F11:F20)`
*   **Expected Output:** Tables: `4` \| APIs: `6` \| Pages: `4` \| Components: `12` \| Workers: `2` \| Queues: `2`
*   **Dependencies:** Sprint 7
*   **Risks:** OpenAI API response times exceed NFR thresholds (> 2000ms).

### Task Execution Matrix
*Columns: `Task ID`, `Phase`, `Task Description`, `Priority`, `Estimate (hrs)`, `Actual (hrs)`, `Variance`, `Status`, `Git Branch`, `PR Link`, `Issue Link`, `Remarks`*

| Task ID | Phase | Task Description | Priority | Estimate (hrs) | Actual (hrs) | Variance | Status | Git Branch | PR Link | Issue Link | Remarks |
|:---|:---|:---|:---:|:---:|:---:|:---:|:---|:---|:---|:---|:---|
| **S9-001** | Database | Write notification_templates & AI history schemas | Critical | 2 | 0 | 0 | Not Started | — | — | — | Comms & AI schemas |
| **S9-002** | Backend | Deploy Resend email queues + WebSocket push alerts | Critical | 4 | 0 | 0 | Not Started | — | — | — | Push dispatcher |
| **S9-003** | Backend | Create aggregated Dashboard KPIs analytics views | Critical | 4 | 0 | 0 | Not Started | — | — | — | KPI metrics API |
| **S9-004** | Backend | Integrate OpenAI prompt resolver with DB caching keys | High | 4 | 0 | 0 | Not Started | — | — | — | OpenAI query cache |
| **S9-005** | Frontend | Build Tenant Admin announcement broadcast form UI | High | 3 | 0 | 0 | Not Started | — | — | — | Broadcaster UI |
| **S9-006** | Frontend | Build Tenant Admin KPI widgets and analytics charts | Critical | 4 | 0 | 0 | Not Started | — | — | — | View KPI charts UI |
| **S9-007** | Frontend | Build Student AI Chat screen doubt assistant panel | High | 4 | 0 | 0 | Not Started | — | — | — | Chatbot assistant UI|
| **S9-008** | Frontend | Build Student Mock result explanation drawer panel | High | 3 | 0 | 0 | Not Started | — | — | — | Explanations drawer UI|
| **S9-009** | QA | Write integration tests validating AI cache checks | High | 4 | 0 | 0 | Not Started | — | — | — | Verify prompt cache |
| **S9-010** | DevOps | Deploy changes and verify telemetry monitoring | High | 2 | 0 | 0 | Not Started | — | — | — | Staging monitoring |

### Acceptance Criteria
*   [ ] AI doubt solver resolves queries in under 2 seconds (returns cached answer if available).
*   [ ] System dispatches fee reminders automatically.
*   [ ] Dashboard charts populate real-time data accurately.

### Definition of Done (DoD)
*   [ ] WebSockets push alerts are delivered in <100ms.
*   [ ] Prompt handlers query database caches first.
*   [ ] Unsubscribe parameter hooks respect user selections.

### Client Demo & Sign-off
*   **Demo Date:** 2026-11-22 | **Demo URL:** `http://preview.student-portal.neet.com/assistant`
*   **Demo Status:** Pending | **Feedback:** —

---

## TAB 14 — Sprint 10 — Production Go-Live

### Sprint Metadata
*   **Sprint Goal:** QA Hardening, Railway + Vercel deployment setup, Load testing validation.
*   **Expected Deliverables:** UAT environment, Sentry dashboard, production build containers, and SSL domains.
*   **Version:** `v2.0` | **Release Date:** 2026-12-07
*   **Owner:** Jay | **Progress:** `=COUNTIF(F11:F17, "Done") / COUNTA(F11:F17)`
*   **Expected Output:** Tables: `0` \| APIs: `0` \| Pages: `0` \| Components: `0` \| Workers: `0` \| Queues: `0`
*   **Dependencies:** All Sprints
*   **Risks:** Connection pooling limit issues under load.

### Task Execution Matrix
*Columns: `Task ID`, `Phase`, `Task Description`, `Priority`, `Estimate (hrs)`, `Actual (hrs)`, `Variance`, `Status`, `Git Branch`, `PR Link`, `Issue Link`, `Remarks`*

| Task ID | Phase | Task Description | Priority | Estimate (hrs) | Actual (hrs) | Variance | Status | Git Branch | PR Link | Issue Link | Remarks |
|:---|:---|:---|:---:|:---:|:---:|:---:|:---|:---|:---|:---|:---|
| **S10-001** | QA | Integrate Sentry logging to apps/api and apps/web | High | 2 | 0 | 0 | Not Started | — | — | — | Telemetry logging |
| **S10-002** | QA | Audit CORS policies, CSP headers, rate-limiting rules | High | 3 | 0 | 0 | Not Started | — | — | — | Security lockdown |
| **S10-003** | QA | Execute load tests targeting 500+ concurrent requests | High | 4 | 0 | 0 | Not Started | — | — | — | Scale validation |
| **S10-004** | Deploy | Compile production Docker files for apps/ | High | 3 | 0 | 0 | Not Started | — | — | — | Docker containers |
| **S10-005** | Deploy | Configure Railway cluster and Vercel hosting rules | Critical | 4 | 0 | 0 | Not Started | — | — | — | Production clusters |
| **S10-006** | Deploy | Map staging domains and configure SSL certificates | Critical | 4 | 0 | 0 | Not Started | — | — | — | Production domains |
| **S10-007** | Release | Run final regression smoke check across all portals | Critical | 4 | 0 | 0 | Not Started | — | — | — | Final sign-off UAT |

### Acceptance Criteria
*   [ ] Staging smoke tests pass with zero console errors.
*   [ ] Auto-backups run successfully.
*   [ ] Rollback scripts restore DB state in under 10 minutes.

### Definition of Done (DoD)
*   [ ] Sentry captures unhandled runtime crashes.
*   [ ] Rate limiters block API abuse.
*   [ ] `/health` endpoint resolves with a 200 OK status.

### Client Demo & Sign-off
*   **Demo Date:** 2026-12-07 | **Demo URL:** `http://prod.neet-platform.com`
*   **Demo Status:** Pending | **Feedback:** —

---

## TAB 15 — Bugs & Blockers

*Copy to Sheet: `15_bugs`*

| Bug ID | Date | Sprint | Context | Description | Severity | Owner | Status | Resolved Date |
|:---|:---|:---:|:---|:---|:---:|:---|:---|:---|
| **BUG-001** | 2026-07-14 | Sprint 0B | 02 Auth | Silent token refresh cookie fails on Safari | High | Jay | Open | — |
| **BUG-002** | 2026-07-14 | Sprint 0C | 14 Platform | File upload component drops connection on >50MB | Medium | Jay | Open | — |

---

## TAB 16 — Release Checklist

*Copy to Sheet: `16_release_checklist`*

| Release Gate | Verification Criteria | Target Metrics | Status | Verified By |
|:---|:---|:---|:---:|:---|
| **DB Migration** | Prisma migration succeeds on staging | 100% success rate | ❌ Pending | Jay |
| **API Contract validation**| OpenAPI Swagger specs reflect routes | 100% Swagger sync | ❌ Pending | Jay |
| **RLS Scoping** | Verification queries confirm isolation | 0 leaks across tenants | ❌ Pending | Jay |
| **NFR Latency** | GET API response metrics checked | < 200ms | ❌ Pending | Jay |
| **Error Handling** | Envelopes match Error Catalog keys | 0 raw error payloads | ❌ Pending | Jay |
| **Accessibility (WCAG)**| Keyboards, focus traps, aria labels checked | AA compliance | ❌ Pending | Jay |
| **Testing coverage** | Unit tests cover lines threshold | > 85% coverage | ❌ Pending | Jay |
| **E2E Playwright** | Complete admissions and payment flows pass | 100% pass rate | ❌ Pending | Jay |
| **DevOps Hardening** | Rate limiters and CORS rules verified | Blocks unauthorized | ❌ Pending | Jay |

---

## TAB 17 — Change Log

*Copy to Sheet: `17_change_log`*

| Date | Scope | Document / Context | Modification Description | Rationale | Author |
|:---|:---|:---|:---|:---|:---|
| 2026-07-13 | V1 Roadmap | `docs/implementation/` | Created 5 definitive execution guides | Project planning lock | Jay |
| 2026-07-13 | Excel Model | `implementfull.md` | Restructured to 17-sheet template workbook | Operational tracking lock| Jay |

---

## TAB 18 — Risks & Dependencies

*Copy to Sheet: `18_risks_dependencies`*

| Risk ID | Description | Impact | Severity | Mitigation Strategy | Status |
|:---|:---|:---|:---:|:---|:---|
| **RSK-001** | Jitsi self-hosted instance latency under load | Live Classes lag | High | Cache Jitsi CDN assets and set scale guidelines | Open |
| **RSK-002** | Razorpay sandbox API verification delay | Billing launch block | Medium| Setup mock webhook responders to bypass API dependencies | Open |
