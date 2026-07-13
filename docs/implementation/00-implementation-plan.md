# 00 — V1 Agile Implementation Plan

> **Version:** 5.0.0-Final  
> **Classification:** Internal Engineering Roadmap  
> **Context:** Bounded-Context Matching (00-14) + Vertical Portal Delivery  
> **Target:** One NEET Coaching Center runs completely without developer support.

---

## 1. Core Dependency Flow

```
[Sprint 0A: Workspace Setup] ──> [Sprint 0B: Platform Foundation] ──> [Sprint 0C: UI Foundation]
                                                                                │
                                                                                ▼
[Sprint 3: Identity & People] <── [Sprint 2: Tenant & Master] <── [Sprint 1: Platform Admin]
    │
    ▼
[Sprint 4: Academics (Attendance)] ──> [Sprint 5: Learning] ──> [Sprint 6: Live Classes]
                                                                          │
                                                                          ▼
                                                              [Sprint 7: Exams & QB]
                                                                          │
                                                                          ▼
                                                              [Sprint 8: Fees & Billing]
                                                                          │
                                                                          ▼
                                                              [Sprint 9: Comms, Analytics & AI]
                                                                          │
                                                                          ▼
                                                              [Sprint 10: Production Go-Live]
```

---

## 2. Sprint Deliverables & Portal Map

### Sprint 0 — Foundation & Infrastructure
*   **Sprint 0A — Workspace Setup:** Turborepo initialization, pnpm-workspace setup, NestJS scaffolding, Next.js bootstrap, Prisma connection, shared config packages, and basic Docker compose settings.
*   **Sprint 0B — Platform Foundation:** JWT RS256 token exchange setup, Silent refresh token cookie rotation, Supabase tenant RLS policies, Redis pools, BullMQ queue instances, R2 storage connections, and Resend SMTP email provider setup.
*   **Sprint 0C — UI Foundation:** Next.js design theme variables, Axios client configuration with request/response interceptors (Correlation IDs), React Query + Zustand stores setup, Route guards, shared UI component library, and all 5 dashboard layouts mock shells.
*   **📱 Portal Deliverables:**
    *   **All Portals (Platform, Tenant, Faculty, Student, Parent):** Login page wrapper, dynamic route guards, and empty layout frame.

---

### Sprint 1 — Platform Admin Portal
*   **Deliverables:** Tenant registration, subscription plan mapping (trial dates, license usage limits, storage quotas), feature flag resolvers, and platform metrics analyzer.
*   **📱 Portal Deliverables:**
    *   **Platform Admin Portal:** Active Tenant listings screen (DataTable with activate/deactivate toggles), Subscription management interface, Storage/Usage metrics analyzer.

---

### Sprint 2 — Tenant Setup & Master Data
*   **Deliverables:** Branch profiles, active academic year configuration, and recursive Curriculum tree editor.
*   **📱 Portal Deliverables:**
    *   **Tenant Admin Portal:** Dashboard setup wizard (onboard first branch, select year), Branch settings screen, and Curriculum Tree Manager interface.

---

### Sprint 3 — Identity & People
*   **Deliverables:** Unified Person API (person profile ➔ user account ➔ role mapping in a single transaction). Link parent-to-student mapping. Bulk CSV student parser (BullMQ background task).
*   **📱 Portal Deliverables:**
    *   **Tenant Admin Portal:** Student Directory (DataTable), Faculty directory, Staff manager, Parent contact links dashboard. Bulk import console.
    *   **Faculty Portal:** Faculty Dashboard home layout shell (My schedule card, profile settings).
    *   **Student Portal:** Student Dashboard home layout shell (My courses list, current attendance %, fees alert widget).
    *   **Parent Portal:** Parent Dashboard home layout shell (Linked student profiles, notifications center).

---

### Sprint 4 — Academics
*   **Deliverables:** Batch CRUD, student/tutor assignment APIs, Timetable CRUD, Bulk attendance record endpoints, and leave request workflows.
*   **📱 Portal Deliverables:**
    *   **Tenant Admin Portal:** Batch management board, Timetable builder interface, Leave approval pane, Attendance reports page.
    *   **Faculty Portal:** **Attendance Grid** (Select batch ➔ select date ➔ mark roster: Present / Absent / Late / Excused), Leave application form.
    *   **Student Portal:** Attendance monthly calendar view, weekly class timetable schedule.
    *   **Parent Portal:** Linked child's daily/monthly attendance calendar view.

---

### Sprint 5 — Learning
*   **Deliverables:** Upload materials controller (linked to curriculum chapter nodes), download logs API, assignment submission endpoints, and student progress trackers.
*   **📱 Portal Deliverables:**
    *   **Tenant Admin Portal:** Learning resource directories manager.
    *   **Faculty Portal:** File upload dashboard (Upload PDF/Video under chapter nodes), Assignment submission viewer (Review student homework uploads, input evaluation feedback).
    *   **Student Portal:** Subject content roster (Download files, view videos with progress-bar logging), Submit assignment button (file upload + comments).
    *   **Parent Portal:** View child's learning resources list and assignment submission status.

---

### Sprint 6 — Live Classes
*   **Deliverables:** Jitsi meeting room provider, Google Calendar event sync (one-way), recording callback webhook, R2 video processor, and watch position tracker.
*   **📱 Portal Deliverables:**
    *   **Tenant Admin Portal:** Live meeting lists and storage usage trackers.
    *   **Faculty Portal:** Schedule Live Class form, Host Class window (Jitsi embed + chat), Previous recordings roster.
    *   **Student Portal:** Join class link, **Recording Library watch screen** (playback speed toggles, resume progress position, and notes).
    *   **Parent Portal:** Previous recordings browser (Allow parents to view child's conducted online classes).

---

### Sprint 7 — Assessments & Question Bank
*   **Deliverables:** MCQ auto-grading calculator (+4/-1 evaluation), subjective grading pipeline, and result ranking views.
*   **📱 Portal Deliverables:**
    *   **Tenant Admin Portal:** Assessment configuration board, Result publish dashboard.
    *   **Faculty Portal:** Question bank editor, Evaluation grid (Grade subjective uploads, write comments).
    *   **Student Portal:** Online Exam Taker portal, results page (marks breakdown, rank).
    *   **Parent Portal:** Result card display (Child's mock test score, class ranking).

---

### Sprint 8 — Fees & Billing
*   **Deliverables:** Installment schedule generator, manual cash payment logger, Razorpay checkout interceptor APIs, and receipt PDF generator.
*   **📱 Portal Deliverables:**
    *   **Tenant Admin Portal:** Fee structures manager, Billing assignments card, Record manual payment dashboard.
    *   **Student Portal:** Fee ledger (Installments timeline, pay balance online via Razorpay), PDF receipt download.
    *   **Parent Portal:** Invoice balance dashboard, checkout options.

---

### Sprint 9 — Communication, Analytics & AI
*   **Deliverables:** Email template renderer (Resend SMTP), WebSocket alerts pusher, KPI calculator (Aggregates revenue, class completion), and AI LLM prompt handler.
*   **📱 Portal Deliverables:**
    *   **Tenant Admin Portal:** Send Announcement broadcast panel, KPI Dashboard metrics widgets.
    *   **Faculty Portal:** Dynamic KPI Cards (Conduct class targets, student average scores), Send batch message button.
    *   **Student Portal:** AI doubt clearing dashboard assistant, "Explain question" button.
    *   **Parent Portal:** Child performance analytics curves (Radar chart of subject progress).

---

### Sprint 10 — QA, Performance & Go Live
*   **Deliverables:** Sentry logging mapping, Rate limiting configurations, Health endpoints validation, Production builds & Deployments (Railway + Vercel), Pen testing, UAT execution, and load tests.
