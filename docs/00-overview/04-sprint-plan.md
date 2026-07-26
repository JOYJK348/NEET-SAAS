# Sprint Plan — V1 Build

> **Status:** 🔒 FROZEN — See [V1 Scope Freeze](./v1-scope-freeze.md) for feature details.
> **Goal:** Ship V1 in ~15 weeks (3.5 months)

---

## Sprint 1 — Foundation (Week 1)

- Generate Prisma schema (all 200+ tables)
- Base NestJS project setup
- PrismaService + middleware
- JWT Auth + Refresh Token
- RBAC Guards (Platform Admin, Tenant Admin, Tutor, Student, Parent)
- Tenant middleware (institute_id injection)
- DB seed scripts

## Sprint 2 — Platform Admin (Week 2)

- Platform Admin login
- Create Tenant
- Activate / Deactivate Tenant
- Subscription management
- Basic Platform Dashboard
- Tenant Admin onboarding

## Sprint 3 — Tenant Setup + People (Weeks 3-4)

- Institute Profile
- Branches, Academic Years
- Courses / Subjects / Chapters / Topics CRUD
- Student Admission + Profile + Documents + Medical
- Parent mapping
- Tutor onboarding

## Sprint 4 — Academics (Weeks 5-6)

- Batch CRUD
- Tutor Assignment (Subject + Batch)
- Batch Timetable
- Attendance (Mark + Reports)
- Leave Management

## Sprint 5 — Learning + Live Classes (Weeks 7-8)

- Learning Materials upload (R2)
- Organize by Subject/Chapter
- Live Class schedule + Jitsi embed
- Google Calendar (one-way)
- Recording upload + R2 playback

## Sprint 6 — Assessments (Weeks 9-10)

- Question Bank CRUD (MCQ)
- Mock Test Create / Schedule / Attempt
- MCQ Auto Evaluation
- Manual Evaluation Flow (Tutor → Admin → Publish)
- Results display

## Sprint 7 — Fees + Papers (Weeks 11-12)

- Fee Structure + Components
- Installment Plans
- Student Fee Records
- Payments + Receipts
- Previous Papers Store (Upload, Price, Purchase, Unlock)

## Sprint 8 — Communication + AI (Week 13)

- Notifications (Email + In-App + Templates)
- Auto-reminders (Class, Test, Fee)
- AI Doubt Solver
- AI MCQ Explanation

## Sprint 9 — Dashboards + Polish (Week 14)

- All role dashboards
- Basic reports (Attendance, Fees, Results)
- Tenant Feature Flags (UI)
- Settings pages
- Error handling + validation

## Sprint 10 — Production Readiness (Week 15)

- Sentry error monitoring
- Rate limiting
- Health checks
- Vercel (Frontend) + Railway (Backend) deployment
- Production smoke test
- Documentation handoff
