# Sprint 05 — Master Data

> **Status:** 🔄 In Progress  
> **Duration:** 2026-07-19 to 2026-08-02 (14 days)  
> **Version:** v1.1  
> **Owner:** Jay

---

## Goal

Implement the Master Data domain: Branches, Courses, Subjects, Chapters, Topics, Academic Years, and Delivery Types. This covers both backend APIs and frontend management UIs.

---

## Scope

### Backend (apps/api)

| Task ID   | Module   | Description                                                                                   | Priority | Est. (hrs) |     Status     |
| :-------- | :------- | :-------------------------------------------------------------------------------------------- | :------: | :--------: | :------------: |
| S5-BE-001 | `master` | Scaffold Branch CRUD — Create, Read, Update, Delete, List                                     | Critical |     4      | 🔄 In Progress |
| S5-BE-002 | `master` | Scaffold Course CRUD with branch association                                                  | Critical |     4      |   ⏳ Planned   |
| S5-BE-003 | `master` | Scaffold Subject CRUD with course association                                                 | Critical |     4      |   ⏳ Planned   |
| S5-BE-004 | `master` | Scaffold Chapter CRUD with subject association                                                | Critical |     3      |   ⏳ Planned   |
| S5-BE-005 | `master` | Scaffold Topic CRUD with chapter association                                                  | Critical |     3      |   ⏳ Planned   |
| S5-BE-006 | `master` | Scaffold Academic Year CRUD                                                                   |   High   |     3      |   ⏳ Planned   |
| S5-BE-007 | `master` | Scaffold Delivery Type CRUD                                                                   |   High   |     2      |   ⏳ Planned   |
| S5-BE-008 | `master` | Prisma schema — branches, courses, subjects, chapters, topics, academic_years, delivery_types | Critical |     3      | 🔄 In Progress |
| S5-BE-009 | `master` | Validation layer — Zod DTOs + business rules                                                  | Critical |     3      |   ⏳ Planned   |
| S5-BE-010 | `master` | Tenant-scoped Prisma queries (institute_id isolation)                                         | Critical |     2      |   ⏳ Planned   |
| S5-BE-011 | `master` | Integration tests for master data endpoints                                                   |   High   |     4      |   ⏳ Planned   |

### Frontend (apps/web)

| Task ID   | Module   | Description                                    | Priority | Est. (hrs) |   Status   |
| :-------- | :------- | :--------------------------------------------- | :------: | :--------: | :--------: |
| S5-FE-001 | `master` | Branch management list + create/edit view      | Critical |     4      | ⏳ Planned |
| S5-FE-002 | `master` | Course management list + create/edit view      | Critical |     4      | ⏳ Planned |
| S5-FE-003 | `master` | Subject management list + create/edit view     | Critical |     4      | ⏳ Planned |
| S5-FE-004 | `master` | Chapter/Topic tree editor (drag-and-drop)      | Critical |     6      | ⏳ Planned |
| S5-FE-005 | `master` | Academic Year selector + management UI         |   High   |     3      | ⏳ Planned |
| S5-FE-006 | `master` | Delivery Type management UI                    |   High   |     2      | ⏳ Planned |
| S5-FE-007 | `master` | Breadcrumb navigation for curriculum hierarchy |  Medium  |     2      | ⏳ Planned |
| S5-FE-008 | `master` | Search/filter across master data entities      |  Medium  |     3      | ⏳ Planned |

### Database Schema

```prisma
model Branch {
  id            String   @id @default(cuid())
  instituteId   String
  name          String
  code          String   @unique
  description   String?
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  // Relations
  courses       Course[]
  academicYears AcademicYear[]
}

model Course {
  id            String   @id @default(cuid())
  instituteId   String
  branchId      String
  name          String
  code          String
  description   String?
  durationMonths Int
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  // Relations
  branch        Branch   @relation(fields: [branchId], references: [id])
  subjects      Subject[]
}

model Subject {
  id            String   @id @default(cuid())
  instituteId   String
  courseId      String
  name          String
  code          String
  displayOrder  Int
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  // Relations
  course        Course   @relation(fields: [courseId], references: [id])
  chapters      Chapter[]
}

model Chapter {
  id            String   @id @default(cuid())
  instituteId   String
  subjectId     String
  name          String
  displayOrder  Int
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  // Relations
  subject       Subject  @relation(fields: [subjectId], references: [id])
  topics        Topic[]
}

model Topic {
  id            String   @id @default(cuid())
  instituteId   String
  chapterId     String
  name          String
  displayOrder  Int
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  // Relations
  chapter       Chapter  @relation(fields: [chapterId], references: [id])
}

model AcademicYear {
  id            String   @id @default(cuid())
  instituteId   String
  branchId      String
  name          String
  startDate     DateTime
  endDate       DateTime
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  // Relations
  branch        Branch   @relation(fields: [branchId], references: [id])
}

model DeliveryType {
  id            String   @id @default(cuid())
  instituteId   String
  name          String
  code          String
  description   String?
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

---

## API Endpoints Planned

| Method | Path                               | Description                   |
| :----- | :--------------------------------- | :---------------------------- |
| GET    | `/master/branches`                 | List branches (tenant-scoped) |
| POST   | `/master/branches`                 | Create branch                 |
| GET    | `/master/branches/:id`             | Get branch detail             |
| PUT    | `/master/branches/:id`             | Update branch                 |
| DELETE | `/master/branches/:id`             | Soft-delete branch            |
| GET    | `/master/courses?branchId=`        | List courses by branch        |
| POST   | `/master/courses`                  | Create course                 |
| GET    | `/master/courses/:id`              | Get course with subjects      |
| PUT    | `/master/courses/:id`              | Update course                 |
| DELETE | `/master/courses/:id`              | Soft-delete course            |
| GET    | `/master/subjects?courseId=`       | List subjects by course       |
| POST   | `/master/subjects`                 | Create subject                |
| GET    | `/master/subjects/:id`             | Get subject with chapters     |
| PUT    | `/master/subjects/:id`             | Update subject                |
| GET    | `/master/chapters?subjectId=`      | List chapters by subject      |
| POST   | `/master/chapters`                 | Create chapter                |
| GET    | `/master/chapters/:id`             | Get chapter with topics       |
| PUT    | `/master/chapters/:id`             | Update chapter                |
| PATCH  | `/master/chapters/reorder`         | Reorder chapters (drag-drop)  |
| GET    | `/master/topics?chapterId=`        | List topics by chapter        |
| POST   | `/master/topics`                   | Create topic                  |
| PUT    | `/master/topics/:id`               | Update topic                  |
| PATCH  | `/master/topics/reorder`           | Reorder topics (drag-drop)    |
| GET    | `/master/academic-years?branchId=` | List academic years           |
| POST   | `/master/academic-years`           | Create academic year          |
| PUT    | `/master/academic-years/:id`       | Update academic year          |
| GET    | `/master/delivery-types`           | List delivery types           |
| POST   | `/master/delivery-types`           | Create delivery type          |
| PUT    | `/master/delivery-types/:id`       | Update delivery type          |

---

## Acceptance Criteria

- [ ] Tenant admin can create and manage branches
- [ ] Courses are scoped to branches
- [ ] Subjects are scoped to courses
- [ ] Chapters can be reordered via drag-and-drop
- [ ] Topics can be reordered within a chapter
- [ ] Academic years can be set as active/inactive
- [ ] All master data respects tenant isolation via `institute_id`
- [ ] Curriculum tree loads in < 300ms

---

## Risks

| Risk                                 | Mitigation                                                          |
| :----------------------------------- | :------------------------------------------------------------------ |
| Deeply nested tree queries cause N+1 | Use Prisma `include` with nested joins, add indexes on foreign keys |
| Drag-and-drop reorder loops          | Optimistic UI updates + debounced API calls                         |
| Large curriculum data (> 1000 nodes) | Implement pagination + lazy loading for tree branches               |

---

## Dependencies

- Backend foundation (Sprint 0B) — ✅ Done
- Frontend foundation (Sprint 0C) — ✅ Done
- API conventions from `master` module scaffold — ✅ Done
