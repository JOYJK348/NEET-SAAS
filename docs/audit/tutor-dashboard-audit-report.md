# 🎯 Tutor Dashboard — Codebase Audit Report

## Executive Summary

Generated after full codebase audit of backend (NestJS + Prisma/PostgreSQL) and frontend (Next.js + React Query + Zustand).

**Status: Tenant Admin foundation is SOLID ✅**

The Tutor Dashboard can be built entirely on top of existing real data without any duplicate models or mock data. This report maps every requirement to the existing API/model and identifies only the gaps that need new backend endpoints.

---

## 1. 🏗️ ARCHITECTURE OVERVIEW

### Tech Stack
| Layer | Technology |
|-------|-----------|
| Backend | NestJS (v11), Prisma ORM, PostgreSQL |
| Frontend | Next.js 16 (App Router), React 19 |
| State | Zustand (client), TanStack Query v5 (server) |
| Auth | JWT (RS256) + Refresh Token Rotation |
| API Base | `http://localhost:3000/api/v1` |
| Styling | TailwindCSS v4, Radix UI primitives |

### Data Flow for Tutor Dashboard
```
JWT Login
  ↓
AuthenticatedRequestUser { sub, tenantId, roleCode }
  ↓
staffProfileId = sub (since StaffProfiles.userId = Users.id)
  ↓
StaffBatchAssignments → Batches → Courses/Branches/AcademicYears
  ↓
Schedules → AttendanceSessions → AttendanceRecords
```

---

## 2. 🗄️ DATABASE SCHEMA (Relevant Models)

### Core Tutor Data Chain
```
Users (userType='TUTOR')
  ↓ (1:1)
StaffProfiles (userId = PK)
  ↓ (1:N)
  ├── StaffSubjects (staffProfileId, subjectId)
  ├── StaffDepartments (staffProfileId, branchId, departmentId)
  ├── StaffQualifications (staffProfileId, degree, experienceMonths)
  └── StaffBatchAssignments (staffProfileId, batchId, subjectId, isActive)
```

### Batch → Schedule → Session Chain
```
Batches (courseId → Courses, branchId → Branches, academicYearId → AcademicYears)
  ↓ (1:N)
Schedules (batchId, staffProfileId, subjectId, dayOfWeek, startTime, endTime, deliveryMode, roomId)
  ↓ (1:N)
AttendanceSessions (scheduleId, attendanceDate, startsAt, endsAt, staffProfileId, sessionStatus, sessionSource, overrideType)
  ↓ (1:N)
AttendanceRecords (attendanceSessionId, studentAdmissionId, attendanceStatus, markedBy)
```

### Key Enums/Status Fields
- `AttendanceSessionStatusEnum`: SCHEDULED | DRAFT | ONGOING | COMPLETED | CANCELLED
- `AttendanceStatusEnum`: PRESENT | ABSENT | LATE | EXCUSED | NOT_MARKED
- `SessionSourceEnum`: SCHEDULE | MANUAL | EXTRA | MAKEUP
- `OverrideTypeEnum`: NONE | TIME_CHANGED | TUTOR_CHANGED | ROOM_CHANGED | CANCELLED

---

## 3. 📡 EXISTING BACKEND APIs — Full Mapping

### 3.1 Auth APIs
| Method | Endpoint | Status | Purpose for Tutor Dashboard |
|--------|----------|--------|---------------------------|
| POST | `/auth/login` | ✅ | Login → get JWT with `sub` (userId) |
| POST | `/auth/refresh` | ✅ | Token refresh |
| GET | `/auth/me` | ❌ **Not implemented** (throws NotImplementedException) | **CRITICAL** — Returns current user profile |

### 3.2 People APIs (Tutors)
| Method | Endpoint | Status | Purpose for Tutor Dashboard |
|--------|----------|--------|---------------------------|
| GET | `/people/tutors` | ✅ | List tutors (paginated, filterable by subject, branch) |
| GET | `/people/tutors/:id` | ✅ | Tutor detail (profile, subjects, branches, batches) |
| POST | `/people/tutors` | ✅ | Create tutor |
| PATCH | `/people/tutors/:id` | ✅ | Update tutor |
| DELETE | `/people/tutors/:id` | ✅ | Soft-delete tutor |

**What tutor detail returns:**
```json
{
  "id": "user-uuid", // This = staffProfileId = userId
  "firstName": "...",
  "lastName": "...",
  "email": "...",
  "subjects": [{ "subjectId": "..." }],
  "branches": [{ "branchId": "...", "departmentId": "..." }],
  "batchAssignments": [{ "batchId": "...", "subjectId": "...", "isActive": true }],
  "batchCount": 5
}
```

### 3.3 Master Data APIs
| Method | Endpoint | Status | Purpose |
|--------|----------|--------|---------|
| GET | `/master/batches` | ✅ | List batches (paginated) |
| GET | `/master/batches/:id` | ✅ | Batch detail |
| GET | `/master/courses` | ✅ | List courses |
| GET | `/master/subjects` | ✅ | List subjects |
| GET | `/master/branches` | ✅ | List branches |
| GET | `/master/academic-years` | ✅ | List academic years |
| GET | `/master/chapters` | ✅ | List chapters (by courseSubjectId) |
| GET | `/master/topics` | ✅ | List topics (by chapterId) |

### 3.4 Scheduling APIs
| Method | Endpoint | Status | Purpose |
|--------|----------|--------|---------|
| GET | `/scheduling/schedules` | ✅ | List schedules (filterable by staffProfileId, batchId, dayOfWeek, etc.) |
| GET | `/scheduling/schedules/weekly-view` | ✅ | Weekly timetable (grouped by day) |
| GET | `/scheduling/schedules/:id` | ✅ | Schedule detail |
| POST | `/scheduling/schedules` | ✅ | Create schedule (auto-generates 30-day sessions) |
| POST | `/scheduling/schedules/check-conflicts` | ✅ | Conflict detection engine |
| GET | `/scheduling/sessions/:id` | ✅ | Session detail |
| GET | `/scheduling/sessions/:id/history` | ✅ | Session audit trail |
| PATCH | `/scheduling/sessions/:id/override` | ✅ | Override session (reschedule, tutor change, cancel) |
| POST | `/scheduling/sessions/extra` | ✅ | Create extra/makeup class |

### 3.5 Student APIs
| Method | Endpoint | Status | Purpose |
|--------|----------|--------|---------|
| GET | `/students` | ✅ | List students (paginated, filterable) |
| GET | `/students/:id` | ✅ | Student detail |
| GET | `/students/stats` | ✅ | Student statistics |

### 3.6 Batch Enrollment APIs
| Method | Endpoint | Status | Purpose |
|--------|----------|--------|---------|
| GET | `/batch-enrollments` | ✅ | List batch enrollments |
| POST | `/batch-enrollments` | ✅ | Create enrollment |
| GET | `/batch-enrollments/check-conflict` | ✅ | Enrollment conflict check |

---

## 4. 🔍 GAP ANALYSIS — Missing Backend Capabilities

### GAP 1: `/auth/me` — Current User Profile
**Current**: `NotImplementedException` thrown
**Required**: Returns `User` + `StaffProfile` for TUTOR users
**Priority**: 🔴 CRITICAL (needed on every page load)

### GAP 2: Tutor Dashboard Statistics
**Current**: No aggregated stats endpoint
**Required**: Summary endpoint for dashboard overview
**Priority**: 🟡 HIGH (saves multiple API calls)

### GAP 3: Tutor's Sessions with Related Data
**Current**: `GET /scheduling/sessions/:id` returns raw session without batch/course/subject/branch names
**Required**: A list endpoint that returns sessions enriched with batch name, course name, subject name, branch name, student count, attendance status
**Priority**: 🟡 HIGH

### GAP 4: Attendance Records Bulk Operations
**Current**: AttendanceRecords model exists but no endpoints exposed
**Required**: 
- `POST /scheduling/sessions/:id/attendance/bulk` — Mark all students present/absent
- `PATCH /scheduling/sessions/:id/attendance/:recordId` — Update individual attendance
**Priority**: 🟡 HIGH

### GAP 5: Batch Students List
**Current**: No direct "get students in a batch" endpoint
**Required**: `GET /scheduling/batches/:id/students` — Returns enrolled students with attendance stats
**Priority**: 🟡 HIGH

### GAP 6: Tutor's Teaching Content
**Current**: Course/Subject/Chapter/Topic endpoints exist but not scoped to tutor's assignments
**Required**: `GET /learning/tutor-content?staffProfileId=xxx` — Scoped by tutor's assigned subjects
**Priority**: 🟢 MEDIUM

---

## 5. 🖥️ FRONTEND ANALYSIS

### 5.1 Current Frontend Architecture

**Routing Structure** (Next.js App Router):
```
/dashboard                  → Role-based (PlatformAdmin | TenantAdmin)
/dashboard/students         → Student list (working, real API)
/dashboard/students/[id]    → Student detail
/dashboard/tutors           → Tutor list (working, real API)
/dashboard/batches          → Batch list
/dashboard/timetable        → Timetable view
/tenant-admin/branches      → Branch management
/tenant-admin/curriculum    → Curriculum builder
```

**Existing Patterns to Follow** (from students feature):
```
features/students/
├── components/       → UI components (Table, Card, Filters, Search, Pagination, Skeleton, Error, Empty states)
├── hooks/            → use-students.ts (React Query hooks with stale times, prefetch, mutation invalidation)
├── services/         → student-service.ts (API calls via `api.get/post/patch/delete`)
├── types/            → TypeScript interfaces
└── validation/       → Zod schemas
```

**Key Frontend Infrastructure**:
- ✅ `api` singleton — auto auth headers, token refresh, error toasts
- ✅ `useAuth` — user, isAuthenticated, isLoading, login, logout
- ✅ `auth-store` — Zustand + persist (rememberMe)
- ✅ React Query — with staleTime/gcTime config pattern
- ✅ Prefetch pattern (`usePrefetchStudentDetail`)
- ✅ UI components — Card, Button, Avatar, Badge, Dialog, Table, Tabs, Select, etc.
- ✅ Loading states — `LoadingSpinner`, skeleton components
- ✅ Error/Empty states — `ErrorState`, `EmptyState` components

### 5.2 Frontend Gaps

| Gap | Detail | Priority |
|-----|--------|----------|
| No tutor dashboard route | `/dashboard/tutor` doesn't exist | 🔴 |
| No tutor-specific sidebar | Sidebar shows Tenant Admin nav for all | 🟡 |
| No prefetch setup for tutor data | Need hooks with prefetch for instant data | 🟡 |
| No role-based route protection | Need TUTOR-specific guard | 🟡 |

---

## 6. 📋 TUTOR DASHBOARD — SPECIFICATION & IMPLEMENTATION PLAN

### 6.1 Routes
```
/dashboard/tutor                          → Tutor Dashboard Home
/dashboard/tutor/timetable                → My Timetable (week/day view)
/dashboard/tutor/batches                  → My Batches
/dashboard/tutor/batches/:id              → Batch Details + Students
/dashboard/tutor/sessions/:id             → Class Session Details + Attendance
/dashboard/tutor/content                  → My Teaching Content
```

### 6.2 Feature Structure
```
features/tutor-dashboard/
├── components/
│   ├── TutorDashboardOverview.tsx     — Home page
│   ├── TodaySchedule.tsx              — Today's classes card
│   ├── UpcomingClasses.tsx            — Upcoming classes
│   ├── TutorStats.tsx                 — Stats cards (today's classes, batches, students)
│   ├── TutorTimetable.tsx             — Weekly timetable
│   ├── TutorBatchList.tsx             — Assigned batches
│   ├── TutorBatchDetails.tsx          — Batch detail + students
│   ├── ClassSessionDetails.tsx        — Session detail
│   ├── ClassSessionContent.tsx        — Teaching content linked
│   └── AttendancePanel.tsx            — Mark attendance UI
├── hooks/
│   ├── use-tutor-dashboard.ts         — Dashboard stats
│   ├── use-tutor-schedule.ts          — Schedule queries
│   ├── use-tutor-batches.ts           — Batch queries
│   ├── use-tutor-sessions.ts          — Session queries
│   └── use-attendance.ts              — Attendance mutations
├── services/
│   └── tutor-dashboard.api.ts         — API calls
└── types/
    └── tutor-dashboard.types.ts       — TypeScript interfaces
```

### 6.3 Build Order (9 Steps)

**STEP 1: Backend — Implement `/auth/me`**
- Return `User` + `StaffProfile` + `StaffSubjects` + `StaffBatchAssignments` for current user
- Essential for identifying the logged-in tutor

**STEP 2: Backend — Tutor Dashboard Backend Module**
Create new `TutorDashboardModule` (or extend Scheduling/People) with:
- `GET /tutor-dashboard/overview` — Stats (today's classes count, upcoming count, batch count, student count)
- `GET /tutor-dashboard/sessions` — List sessions with enriched data (batch name, subject name, course name, branch name, room name)
- `GET /tutor-dashboard/batches/:id/students` — Students in batch with attendance percentage
- `POST /tutor-dashboard/sessions/:id/attendance/bulk` — Mark attendance

**STEP 3: Frontend — Shell & Routing**
- Create route `/dashboard/tutor` pages
- Create feature folder structure
- Add sidebar navigation for TUTOR role
- Wire up auth to detect TUTOR userType

**STEP 4: Frontend — Dashboard Overview**
- Today's Classes (real data from sessions API)
- Upcoming Classes (next 5 sessions)
- Stats cards (real counts)
- Connect to prefetched queries

**STEP 5: Frontend — My Timetable (Week View)**
- Use `GET /scheduling/schedules/weekly-view?staffProfileId=xxx`
- Display Monday-Sunday grid
- Show time slots, batch, subject, room
- Handle rescheduled/cancelled markers

**STEP 6: Frontend — My Batches**
- Use `StaffBatchAssignments` data from `/auth/me`
- Show batch cards with course, subject, branch, student count
- Detail page with real student list

**STEP 7: Frontend — Class Session Details**
- Session info (date, time, batch, subject, room, status)
- Attendance panel
- Link to teaching content

**STEP 8: Frontend — Attendance Integration**
- Mark All Present button
- Individual PRESENT/ABSENT/LATE/EXCUSED
- Persist to backend API
- Invalidate queries on success

**STEP 9: Frontend — Teaching Content Integration**
- Show Course → Subject → Chapter → Topic hierarchy
- Read-only view for tutor
- Link to TopicItems (lessons, PDFs, videos)

### 6.4 Prefetch Strategy
```
1. On Tutor Dashboard mount → prefetchQuery:
   - Today's sessions (with 5min staleTime)
   - Upcoming sessions (with 5min staleTime)
   - Assigned batches (with 30min staleTime)

2. On hover over "My Batches" → prefetchQuery:
   - Batch details
   - Student list (with 5min staleTime)

3. On hover over timetable day → prefetchQuery:
   - Sessions for that day (with 2min staleTime)

4. On completion of attendance → invalidateQueries:
   - Today's sessions
   - Batch students (to refresh attendance %)
```

### 6.5 Data Isolation Check
| Check | Mechanism | Status |
|-------|-----------|--------|
| Tenant isolation | `tenantId` in every Prisma query | ✅ Built-in |
| Tutor-only data | Filter by `staffProfileId` from JWT | ✅ To implement |
| Batch isolation | `StaffBatchAssignments.isActive = true` | ✅ Built-in |
| Student isolation | Only batch enrolled students visible | ✅ Built-in |
| No Tutor table dup | Using existing `Users.userType='TUTOR'` + `StaffProfiles` | ✅ Already correct |

---

## 7. ⚠️ RISKS & MITIGATIONS

| Risk | Impact | Mitigation |
|------|--------|------------|
| `/auth/me` not implemented | All tutor pages fail | Implement first (STEP 1) |
| No bulk attendance endpoint | Cannot mark attendance | Implement in STEP 2 |
| Session list without enrichment | Shows raw UUIDs | Implement enriched query in STEP 2 |
| JWT `sub` vs `staffProfileId` | Auth confusion | `sub` = userId = StaffProfiles.userId ✅ |
| Sidebar shows Tenant Admin | Wrong nav for tutors | Add role check in sidebar ✅ |

---

## 8. ✅ ACCEPTANCE CRITERIA CHECKLIST

- [ ] Login identifies the actual tutor (via JWT → `/auth/me`)
- [ ] Dashboard stats are real (from backend queries)
- [ ] Today's classes are real AttendanceSessions
- [ ] Upcoming classes are real future sessions
- [ ] Timetable is real schedule data filtered by tutor
- [ ] Batches are real StaffBatchAssignments
- [ ] Students are real StudentBatchEnrollments
- [ ] Course content is real Course → Subject → Chapter → Topic
- [ ] Attendance is persisted to the backend (AttendanceRecords)
- [ ] Tenant isolation works (Tenant A tutor sees only Tenant A data)
- [ ] Tutor assignment permissions work (Tutor sees only their batches)
- [ ] Rescheduled/cancelled sessions appear correctly
- [ ] No hardcoded demo data
- [ ] No duplicate database models created
- [ ] Existing Tenant Admin continues to work
- [ ] Typecheck passes (`pnpm typecheck`)
- [ ] Lint passes (`pnpm lint`)
- [ ] Production build passes (`pnpm build`)

---

## 9. 📊 SUMMARY

| Module | Existing APIs | New APIs Needed | Frontend Work |
|--------|---------------|----------------|---------------|
| Auth / Current User | ❌ `/auth/me` missing | 1 new endpoint | Auth context update |
| Dashboard Overview | ✅ Schedules, Sessions exist | 1 aggregate endpoint | New components |
| My Timetable | ✅ Weekly view exists | 0 new | New components |
| My Batches | ✅ Tutor data, Batches exist | 1 endpoint (batch students) | New components |
| Class Sessions | ✅ Sessions exist | 0 new (enriched) | New components |
| Attendance | ❌ Missing endpoints | 2 endpoints (bulk + individual) | New components |
| Teaching Content | ✅ Course/Subject/Chapter/Topic exist | 0 new (just filter by subject) | New components |
| **TOTAL** | **12 existing APIs** | **~5 new endpoints** | **~15 new components** |

