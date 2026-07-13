# V1 Scope Freeze — Education Management Platform (CMP)

> **Status:** 🔒 FROZEN  
> **Date:** July 13, 2026  
> **Target Profile:** NEET Coaching Center V1  
> **Goal:** One NEET Coaching Center runs completely without developer support.  
> **Rule:** Future-ready database. MVP-ready implementation.  
> **Golden Rule:** Business-specific behavior belongs in configuration, not in the database schema.  
> **Profile System:** See [13-profile-system.md](docs/architecture/13-profile-system.md) for the full generic platform architecture.  
> **Shared Kernel:** See [14-shared-kernel.md](docs/architecture/14-shared-kernel.md) for cross-cutting services (Audit, Events, Number Gen, Storage, Notifications, Scheduler, Search).

---

## 1. Platform Identity

```
Education Core Platform (Generic DB/API)
│
├── Auth
├── People (Person → User → Role)
├── Master (Institutes, Learning Groups, Curriculum)
├── Attendance
├── Learning Content
├── Assessments
├── Billing
├── Communication
├── AI Service
├── Platform (Settings, Flags, Storage)
├── Calendar
├── Digital Resources
│
└── Profile System (Configuration Layer)
      │
      ├── NEET Coaching V1  ← first implementation
      ├── JEE / UPSC / TNPSC
      ├── School / College
      ├── Tuition / Language Institute
      └── Corporate Training
```

### Generic Naming (DB/API) → NEET Profile (UI Labels)

| Generic (DB/API) | NEET Profile Label | Why Generic |
|-----------------|-------------------|-------------|
| Assessment | Mock Test | Covers MCQ, Subjective, Quiz, Assignment, Practice Test |
| Learning Content | Study Material | Covers PDF, Video, Audio, SCORM, Interactive, URL |
| Learning Group | Batch | Covers Batch, Class, Section, Cohort, Group |
| Instructor | Tutor | Covers Tutor, Teacher, Faculty, Trainer, Coach, Mentor |
| Learner | Student | Covers Student, Employee, Resident, Trainee |
| Associated Contact | Parent | Covers Parent, Guardian, Sponsor, Manager |
| Learning Unit | Subject | Covers Subject, Skill, Module, Rotation |
| Curriculum Node | Chapter | Configurable depth: Course→Subject→Chapter→Topic |
| Billing | Fee | Covers Fee, Subscription, Tuition, Transport, Hostel |
| Digital Resource | Previous Paper | Covers Paper, Notes, PDF, Video Course, Test Series |

---

## 2. V1 Feature Matrix

| Module | Generic Name (DB/API) | V1 (Must-Have) | V1.1 | V2+ |
|--------|----------------------|---------------|------|-----|
| **Platform Admin** | platform_admin | ✅ Login, Create Tenant, Activate/Deactivate, Subscription, Storage, Dashboard | — | Advanced Analytics |
| **Multi-Tenant** | tenant_isolation | ✅ Row-Level Isolation, institute_id scoping | — | Sharding |
| **Institute** | institutes | ✅ Profile, Logo, Address, Contact, Code, Timezone | Theme | White-label |
| **Branches** | branches | ✅ Create, Edit, Status | — | Branch Analytics |
| **Academic Years** | academic_years | ✅ Create, Set Active | — | Multi-Year Planning |
| **Curriculum** | curriculum_nodes | ✅ Configurable tree: Course→Subject→Chapter→Topic | Bulk Import | AI Generation |
| **Learning Groups** | learning_groups | ✅ Create, Assign Instructor/Learner, Timetable | Auto Scheduling | AI Optimization |
| **People** | people → users → roles | ✅ Unified Person model. Roles: Tenant Admin, Instructor, Learner, Associated Contact, Staff | Bulk Upload | Advanced Roles |
| **Attendance** | attendance | ✅ Mark, Reports, Leave, Configurable Statuses | SMS Alerts | Biometric/RFID |
| **Learning Content** | learning_content | ✅ Upload PDF/PPT/Video/Audio, Organize by Curriculum Node, R2 Storage | Version History | AI Recommendations |
| **Live Classes** | live_classes | ✅ Schedule, Google Calendar (One-Way), Jitsi, Attendance, R2 Recording, Session Types (BATCH/GROUP/ONE_TO_ONE) | Auto-Processing | Breakout, Polls |
| **Assessments** | assessments | ✅ Type: MCQ (auto-eval), Subjective (manual-eval). Create, Schedule, Lock, Publish | Quizzes | Coding Tests |
| **Manual Evaluation** | evaluations | ✅ Instructor Evaluates → Admin Approves → Publish. Draft→Submit→Approve→Publish | — | OCR |
| **Digital Resources** | digital_resources | ✅ Product Types (Paper, Notes, PDF, Workbook, Series). Upload, Price, R2, Purchase, Discounts, Bundles | — | Subscriptions |
| **Billing** | billing | ✅ Structure, Components, Installments, Payments, Receipts, Discounts, Pending, Online Payment Gateway (Razorpay) | — | Auto Late Fee |
| **Notifications** | notifications | ✅ Email, In-App, Templates, Auto-Reminders | WhatsApp | Push |
| **AI Service** | ai_service | ✅ Capabilities: Doubt Solver, MCQ Explanation. Cache-first. Feature-flagged | Summarize | Voice, Planner |
| **Google Calendar** | calendar | ✅ One-Way Sync: Class → Event, Assessment → Event | — | Two-Way Sync |
| **Dashboards** | dashboards | ✅ Platform Admin, Tenant Admin, Instructor, Learner, Associated Contact | Custom Widgets | Predictive |
| **Analytics** | analytics | ✅ Attendance, Billing, Assessment, Progress reports | Export | AI Insights |
| **Feature Flags** | feature_flags | ✅ Toggle: AI, Live Class, Assessments, Store, Billing, Portal, Calendar | — | Per-Rule |
| **Associated Contact Portal** | contact_portal | ✅ Dashboard, Attendance, Results, Billing, Notifications | Self-Payment | Two-Way Comms |
| **Profile System** | profiles | ⚠️ Generic DB naming only. NEET labels hardcoded in UI | UI Labels Config | Multi-Profile |
| **Workflow Engine** | workflow | ❌ | ❌ | ✅ V2 |
| **Advanced RBAC** | abac | ❌ | ❌ | ✅ V2 |

---

## 3. Roles & Permissions (V1 Scope)

### 3.0 Person → User → Role Model

```
Person (identity: name, DOB, gender, phone, email, address)
  │
  ▼
User (credentials: email, password, status, force_password_change)
  │
  ▼
Role (TENANT_ADMIN | INSTRUCTOR | LEARNER | ASSOCIATED_CONTACT | STAFF)
```

- One Person can have multiple Roles
- Roles control menu access, API permissions, and data visibility
- New roles require configuration, not schema changes

**V1 NEET Profile role mapping:**

| Generic Role | NEET Label | Description |
|-------------|-----------|-------------|
| TENANT_ADMIN | Tenant Admin | Full institute control |
| INSTRUCTOR | Tutor | Teaching + evaluation |
| LEARNER | Student | Learning + assessments |
| ASSOCIATED_CONTACT | Parent | Monitoring + communication |
| STAFF | Staff (Receptionist, Cashier) | Limited operational access |

### 3.1 Platform Admin
- Login to platform
- Create new tenant (select profile: NEET)
- Activate / Deactivate tenant
- Assign / Renew / Extend subscription
- View storage usage across tenants
- View basic platform dashboard
- Resend welcome email, reset tenant admin password

### 3.2 Tenant Admin (Full Control)
- Everything below is configurable without code changes
- Full CRUD on: Institute Profile, Branches, Academic Years, Curriculum Tree
- Full CRUD on: Learning Groups, Learners, Instructors, Associated Contacts
- Manage: Attendance, Learning Content, Live Classes, Assessments, Billing, Notifications
- Configure: All settings, Feature Flags, Billing Structures, Notification Templates
- Approve: Manual Evaluations (publish results)
- View: All reports and dashboards
- Cannot: Delete other tenant data, access platform admin features

### 3.3 Instructor (Assigned Data Only)
- Dashboard with assigned learning groups
- Mark attendance for assigned groups
- Upload learning content for assigned learning units
- Schedule live classes for assigned groups
- Create assessments for assigned groups/units
- Evaluate submissions (manual evaluation)
- View learner progress for assigned groups
- **Cannot:** Publish results (only submit for admin approval)

### 3.4 Learner
- Dashboard with my learning groups
- View learning content (assigned only)
- Join live classes (assigned only)
- View recordings (assigned only)
- Attempt assessments (assigned only)
- View results (after published)
- View attendance
- View billing status
- Browse and purchase digital resources
- AI Service: Doubt Solver, MCQ Explanation

### 3.5 Associated Contact
- Dashboard with learner's progress
- View learner's attendance
- View learner's assessment results
- View learner's billing status
- Receive notifications
- View upcoming schedule

---

## 4. Tenant Admin Configuration Matrix

> **Principle:** Every setting changeable from UI. Zero code changes. NEET defaults shown.

### 4.1 Institute Settings
| Setting | Type | Default (NEET) | Description |
|---------|------|----------------|-------------|
| Institute Name | Text | — | Display name |
| Platform Profile | Select (locked) | NEET Coaching | Vertical configuration |
| Institute Logo | Image | — | Logo across platform |
| Institute Code | Text (auto) | — | Unique code |
| Address | Text | — | Physical address |
| Contact Phone | Phone | — | Primary contact |
| Support Email | Email | — | For notifications |
| Website | URL | — | Optional |
| Timezone | Select | Asia/Kolkata | All timestamps display in this TZ |
| Academic Year | Select (active) | — | Current active academic year |

### 4.2 Academic Settings
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Working Days | Multi-select | Mon-Sat | Days classes run |
| Default Session Duration | Minutes | 60 | Default class length |
| Default Course Duration | Months | 12 | When creating course |
| Learning Group Naming | Text | "{Course}-{Year}-{Shift}" | Auto-generate names |
| Attendance Policy | Select | PER_SESSION | PER_SESSION or PER_DAY |
| Curriculum Levels | Config | Course→Subject→Chapter→Topic | Hierarchy depth |

### 4.3 Billing Settings
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Default Late Fee Amount | Decimal | 0 | Per day late fee |
| Late Fee Grace Days | Integer | 3 | Days before late fee applies |
| Receipt Prefix | Text | "RCP-" | Prefix for receipt numbers |
| Default Installment Plan | Select | — | When creating structure |
| Partial Payment Allowed | Boolean | true | Allow partial payments |
| Auto-Generate Receipt | Boolean | true | Auto on payment recording |

### 4.4 Assessment Settings
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| MCQ Correct Mark | Decimal | 4 | Per correct answer (NEET: +4) |
| MCQ Negative Mark | Decimal | 1 | Per wrong answer deduction |
| MCQ Unattempted Mark | Decimal | 0 | For unanswered |
| Allow Negative Scoring | Boolean | false | Can total go below 0 |
| Default Total Marks | Integer | 720 | Per assessment |
| Default Duration Minutes | Integer | 180 | Per assessment |
| Leaderboard Enabled | Boolean | true | Show rankings |
| Leaderboard Visibility | Select | ALL | ALL or TOP_10 |
| Auto-Publish on Eval | Boolean | false | Auto after all evaluated |
| Re-evaluation Allowed | Boolean | true | Admin can reopen |

### 4.5 Feature Flags
| Feature | Generic Key | Toggle | Default | Description |
|---------|------------|--------|---------|-------------|
| AI Service | ai_service | ON/OFF | ON | Master toggle for all AI |
| AI: Doubt Solver | ai_doubt_solver | ON/OFF | ON | Q&A capability |
| AI: MCQ Explanation | ai_mcq_explain | ON/OFF | ON | Explain capability |
| Live Classes | live_classes | ON/OFF | ON | Jitsi integration |
| Assessments | assessments | ON/OFF | ON | Exam module |
| Digital Resources | digital_resources | ON/OFF | ON | Product purchase |
| Billing | billing | ON/OFF | ON | Fee management |
| Associated Contact Portal | contact_portal | ON/OFF | ON | Parent access |
| Google Calendar | calendar | ON/OFF | ON | Calendar events |
| Attendance | attendance | ON/OFF | ON | Tracking |
| Learner Registration | learner_registration | ON/OFF | ON | New admissions |
| WhatsApp | whatsapp | ON/OFF | OFF | V1.1 feature |

### 4.6 Notification Settings
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Email Notifications | ON/OFF | ON | Master toggle |
| In-App Notifications | ON/OFF | ON | Master toggle |
| Live Class Reminder | Minutes | 30 | Before class |
| Assessment Reminder | Hours | 24 | Before test |
| Billing Due Reminder Days | Integer | 7, 3, 1 | Before due date |
| Billing Overdue Reminder Days | Integer | 3, 7, 14 | After due date |
| Default Email From | Email | institute@email | Sender address |

### 4.7 Storage Settings
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| R2 Storage Bucket | Text | — | Cloudflare R2 bucket |
| Storage Quota MB | Integer | 10240 | Per-institute limit |
| Max File Size MB | Integer | 100 | Single file limit |
| Allowed File Types | Multi-select | pdf, ppt, mp4, jpg, png | Upload whitelist |

### 4.8 Branding Settings
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Institute Name | Text | — | Displayed everywhere |
| Logo | Image | — | Header, receipts, emails |
| Theme Color | Color | #2563EB | Primary color |
| Footer Text | Text | — | Custom footer |

### 4.9 UI Labels (V1.1)
| Generic Key | NEET Label | Description |
|------------|-----------|-------------|
| learning_group | Batch | Display name for groups |
| instructor | Tutor | Display name for teachers |
| learner | Student | Display name for students |
| associated_contact | Parent | Display name for guardians |
| learning_unit | Subject | Display name for subjects |
| assessment | Mock Test | Display name for exams |
| learning_content | Study Material | Display name for resources |
| billing | Fee | Display name for charges |
| digital_resource | Previous Paper | Display name for store items |

---

## 5. Complete User Flows (V1 — NEET Profile)

### 5.1 Platform Admin Flow
```
Login
  ↓
Dashboard (Total Institutes, Active/Suspended, Subscriptions Expiring)
  ↓
Create Institute
  ├── Select Profile: NEET Coaching
  ├── Enter: Name, Code (auto), Owner Name, Email, Phone, Address
  └── Select Subscription Plan
        ↓
Create Tenant Admin
  ├── Enter: Name, Email, Phone
  └── System generates temporary password
        ↓
Welcome Email Sent (auto)
  └── Institute Status → ACTIVE
        ↓
Platform Admin can:
  ├── View Institute Details (Info, Admins, Subscription, Stats, Timeline)
  ├── Activate / Suspend Institute
  ├── Manage Subscription (Assign, Renew, Extend, Upgrade)
  └── Platform Settings (Name, Logo, Support, SMTP, AI, Storage, Security)
```

### 5.2 Tenant Admin — Complete Operations Flow
```
Tenant Admin Login (first login → force password change)
  ↓
Dashboard
  ├── Welcome (Greeting, Institute Name, Date, Academic Year)
  ├── Today's Operations (Scheduled Classes, Live Classes, Assessments)
  ├── Action Required (Pending Evaluations, Alerts)
  ├── Quick Actions (Add Learner, Add Instructor, Create Assessment, Upload Content)
  ├── Institute Summary (Totals: Learners, Instructors, Batches, Subjects)
  ├── Recent Activities
  └── Announcements
        ↓
─── Academic Setup ──────────────────────────────────────────────
  1. Settings → Academic Year → Set Active Year
  2. Course → Create Course (Name, Duration, Type)
  3. Course → Add Subjects (Name, Code)
  4. Subject → Add Chapters (Name, Order)
  5. Chapter → Add Topics (Name, Order)
  6. Batch → Create Batch (Name, Course, Year, Max Seats)
  7. Batch → Assign Instructors (Subject + Instructor mapping)
  8. Batch → Create Timetable (Day, Time, Subject, Instructor, Room)
        ↓
─── Learner Management ─────────────────────────────────────────
  1. Learners → Register (via unified Person)
     ├── Personal Info (Name, DOB, Gender, Phone, Email)
     ├── Address
     ├── Documents (Photo, ID Proof, Marksheet)
     ├── Medical Info (Blood Group, Allergies, Conditions)
     ├── Associated Contacts (Name, Phone, Email, Relationship)
     └── One or more contact mappings
        ↓
  2. Learners → Enroll (Select Course → Billing Structure → Installment Plan)
        ↓
  3. Learners → Assign to Batch
        ↓
  4. Status: ACTIVE (can be INACTIVE, DROPPED, COMPLETED, TRANSFERRED)
        ↓
─── Instructor Management ──────────────────────────────────────
  1. Instructors → Add (via unified Person)
     ├── Personal Info (Name, DOB, Gender, Phone, Email)
     ├── Department
     ├── Qualifications
     └── Learning Units (one or more)
        ↓
  2. Instructors → Assign to Batch (Batch + Learning Unit mapping)
        ↓
─── Attendance ─────────────────────────────────────────────────
  1. Attendance → Select Batch → Select Date
  2. Mark each learner: PRESENT / ABSENT / LATE / EXCUSED
  3. Reports: Daily, Weekly, Monthly, Batch-wise, Low Attendance
  4. Leave Management: Instructor applies, Admin approves/rejects
        ↓
─── Learning Content ───────────────────────────────────────────
  1. Content → Upload
     ├── File (PDF/PPT/Video/Audio)
     ├── Organize by: Course → Subject → Chapter
     ├── Title, Description
     └── Visibility (All or specific batches)
        ↓
  2. Stored in Cloudflare R2
  3. Learners view/download from portal
        ↓
─── Live Classes ────────────────────────────────────────────────
  1. Live Classes → Schedule
     ├── Title, Description
     ├── Batch
     ├── Subject, Chapter (optional)
     ├── Date, Start Time, End Time
     ├── Jitsi link auto-generated
     └── Google Calendar event created (one-way)
        ↓
  2. Class starts → Instructor joins → Jitsi opens
  3. Learners join from portal
  4. Attendance auto-tracked
  5. Recording uploaded to R2 post-class
  6. Learners view recording from portal
        ↓
─── Assessments ─────────────────────────────────────────────────
  1. Assessment → Create
     ├── Title
     ├── Type: MCQ (auto-eval) or Subjective (manual-eval)
     ├── Course → Subject → Chapter scope
     ├── Total Marks, Duration
     ├── Start Time, End Time (auto-lock after end)
     ├── Marking Scheme (+4/-1 configurable)
     └── Assign to Batch(es)
        ↓
  2. Add Questions (MCQ)
     ├── Question Text
     ├── Options (A/B/C/D)
     ├── Correct Answer
     └── Difficulty Level, Marks
        ↓
  3. Scheduled → Learners see in portal
  4. Learner attempts (within time window)
     ├── MCQ Selection
     ├── Auto-submit on end time
     └── Locked after end
        ↓
  5. Auto Evaluation (MCQ)
     ├── Score calculated
     ├── Status: EVALUATED
     └── Pending Admin Review
        ↓
─── Manual Evaluation (Subjective) ─────────────────────────────
  1. Learner submits answer (PDF upload / text)
        ↓
  2. Instructor opens submission
     ├── Download answer sheet
     ├── Add marks, Add remarks
     ├── Mark Pass/Fail
     ├── Save Draft
     └── Submit for Approval → Status: SUBMITTED
        ↓
  3. Tenant Admin reviews
     ├── View Instructor's evaluation
     ├── Approve → Status: APPROVED
     ├── Request Changes → back to Instructor
     └── Reopen for Re-evaluation if needed
        ↓
  4. Admin → Publish Results → Status: PUBLISHED → Learner can view
        ↓
─── Digital Resources ──────────────────────────────────────────
  1. Store → Add Product
     ├── Product Type (Previous Paper, Notes, Premium PDF, Workbook, Test Series)
     ├── Title, Year, Subject
     ├── File → Store in R2
     ├── Set Price (₹)
     └── Publish
        ↓
  2. Learner browses → Filter by Type, Subject, Year
        ↓
  3. Learner purchases (Cash/UPI/Online) → Unlocked → Read/Download
        ↓
  4. Admin views purchase history
        ↓
─── Billing ─────────────────────────────────────────────────────
  1. Billing Structure → Create
     ├── Select Course
     ├── Add Components (Tuition, Library, Lab)
     ├── Total Amount (auto-calculated)
     └── Create Installment Plan(s)
        ↓
  2. Learner Enrolled → Record Auto-Created
     ├── Installments Generated
     └── Reminders Auto-Scheduled
        ↓
  3. Discounts → Apply (if eligible)
        ↓
  4. Payments → Record
     ├── Select Learner, Select Installment
     ├── Amount, Date, Mode (Cash/UPI/Bank)
     └── Receipt Auto-Generated
        ↓
  5. View: Pending, Overdue, Collection Reports
        ↓
─── Notifications ──────────────────────────────────────────────
  Auto-sends:
  ├── Welcome Email (new learner/instructor)
  ├── Live Class Reminder (30 min before)
  ├── Assessment Reminder (24 hours before)
  ├── Billing Due (7, 3, 1 days before)
  ├── Billing Overdue (3, 7, 14 days after)
  ├── Result Published Alert
  └── Low Attendance Alert
        ↓
  Admin can: Manual announcement (Email + In-App), View delivery, Configure templates
        ↓
─── AI Service ──────────────────────────────────────────────────
  Capability: Doubt Solver
    1. Learner types question → LLM → Answer displayed
    2. Conversation saved (history viewable)
        ↓
  Capability: MCQ Explanation
    1. Learner clicks "Explain" on any MCQ
    2. AI shows: Correct Answer, Why correct, Why wrong, Concept
    3. Previously explained → served from cache
        ↓
─── Analytics ───────────────────────────────────────────────────
  ├── Learner Progress (Assessments, Attendance, Billing)
  ├── Attendance Reports (Daily, Monthly, Batch-wise)
  ├── Billing Reports (Collection, Pending, Overdue)
  ├── Assessment Results (Batch-wise, Subject-wise, Rankings)
  └── Instructor Reports (Classes Conducted, Pending Evaluation)
        ↓
─── Settings ───────────────────────────────────────────────────
  Configure everything from Section 4 (Configuration Matrix)
```

### 5.3 Instructor Flow (NEET: Tutor)
```
Login
  ↓
Dashboard
  ├── My Batches
  ├── Today's Schedule
  ├── Pending Evaluations
  └── Recent Activities
        ↓
Batches → Select Batch
  ├── View Learners
  ├── Mark Attendance
  ├── Upload Content
  ├── Schedule Live Class
  └── Create Assessment
        ↓
Evaluations → Pending
  ├── Open Submission
  ├── Add Marks + Remarks
  ├── Save Draft
  └── Submit for Approval
        ↓
Learner Progress → View
  ├── Attendance %
  ├── Assessment Scores
  └── Overall Performance
```

### 5.4 Learner Flow (NEET: Student)
```
Login
  ↓
Dashboard
  ├── My Courses
  ├── Upcoming Classes / Assessments
  ├── Recent Results
  ├── Attendance %
  └── Billing Status
        ↓
Learning Content → Browse by Subject/Chapter → View/Download
  ↓
Live Classes → View Schedule → Join (at time) → View Recordings
  ↓
Assessments → View Upcoming → Attempt (within window) → Results (after publish)
  ↓
Digital Resources → Browse → Purchase → Read/Download
  ↓
AI → Doubt Solver → Ask → Get Answer
  ↓
AI → MCQ Explanation → Click Explain → Get Explanation
  ↓
Attendance → View My Attendance
  ↓
Billing → View Records → Download Receipts
```

### 5.5 Associated Contact Flow (NEET: Parent)
```
Login (via learner association)
  ↓
Dashboard
  ├── Learner's Name, Course, Batch
  ├── Attendance % (this month)
  ├── Upcoming Assessments
  ├── Recent Results
  ├── Billing Status (Paid / Pending / Overdue)
  └── Notifications
        ↓
View → Attendance (Daily/Monthly)
  ↓
View → Assessment Results (Subject-wise, Scores, Rank)
  ↓
View → Billing Status (Installments, Due dates)
  ↓
Notifications → Upcoming Classes, Assessment Reminders, Billing Alerts
```

---

## 6. Assessment Evaluation State Machine (V1)

### 6.1 MCQ Assessments (Auto Evaluation)
```
Learner Attempts
    ↓
Auto Evaluated (score calculated)
    ↓
Status: EVALUATED
    ↓
Tenant Admin Reviews (Optional)
    ↓
Admin → Publish
    ↓
Status: PUBLISHED → Learner Can View
```

### 6.2 Subjective Assessments (Manual Evaluation)
```
Learner Submits Answer (PDF/Text)
    ↓
Status: SUBMITTED
    ↓
Instructor Opens Submission
    ├── Download Answer Sheet
    ├── Add Marks + Remarks
    ├── Save as DRAFT
    └── Submit → Status: EVALUATED
        ↓
Tenant Admin Reviews
    ├── Approve → Status: APPROVED
    ├── Request Changes → back to Instructor
    └── Admin clicks → Publish
        ↓
Status: PUBLISHED → Learner Can View
    ├── Marks, Remarks, Pass/Fail
    └── Download Report
```

### 6.3 Result States
| State | Description | Set By |
|-------|-------------|--------|
| DRAFT | Instructor is evaluating | Instructor |
| EVALUATED | Submitted for approval | Instructor |
| APPROVED | Admin approved, not yet published | Tenant Admin |
| PUBLISHED | Visible to learners | Tenant Admin |
| REOPENED | Reopened for re-evaluation | Tenant Admin |

---

## 7. Database Scope (V1 API Coverage)

> **All 200+ tables exist in the database.** Below shows which get V1 APIs vs. sit ready for future.

| Domain | V1 CRUD APIs | V1 Read-Only | Future (No V1 APIs) |
|--------|-------------|-------------|---------------------|
| **Master** | institutes, branches, academic_years, curriculum_nodes, learning_groups | batch_delivery_types | — |
| **Auth** | users, user_roles, user_sessions | roles, permissions, role_permissions | auth_events |
| **People** | persons, learners, instructors, associated_contacts, contact_mappings, enrollments, group_assignments, documents, medical_profiles | — | qualifications, employment_history, status_history, identifiers |
| **Attendance** | attendance_sessions, attendance_records, leave_requests | — | adjustments, leave_attachments |
| **Assessments** | assessments, assessment_sections, assessment_questions, registrations, attempts, answers, results, evaluations | — | result_history, documents |
| **Question Bank** | questions, question_options, question_explanations, tags, tag_mappings | — | versions, attachments, reviews, usage, import_jobs |
| **Learning Content** | learning_content, content_attachments, assignment_submissions | — | versions, paths, progress, bookmarks, notes, discussions |
| **Live Classes** | live_classes, sessions, participants, attendance, recordings, resources | — | instructors, chat, polls, whiteboard, breakout, events |
| **Billing** | billing_structures, structure_items, assignments, installments, payments, transactions, receipts, discounts, discount_assignments, penalties | — | refunds, waivers, reconciliation, audit, adjustments, allocations, closures, centers, scholarships |
| **Communication** | notification_templates, queue, deliveries, preferences, announcements, reads | — | versions, campaigns, targets, channels, subscriptions, logs, providers, webhooks, audit, attachments, retry, rate_limits, failovers |
| **AI Service** | ai_conversations, ai_messages, ai_requests, ai_generated_content | providers, models, prompts | feedback, usage_logs, audit_logs |
| **Platform** | tenant_settings, feature_flags, file_uploads | — | background_jobs, schedulers, api_keys, logs, health, configs, events, audit |
| **Calendar** | calendar_events, event_participants | — | recurring, two-way sync |
| **Digital Resources** | store_products, product_files, purchases, access_grants | — | subscriptions, bundles |
| **Profile System** | profiles, profile_ui_labels, profile_feature_packs, tenant_profile_config | profile_business_rules | curriculum_levels, attendance_statuses, assessment_types, billing_types, resource_types |

---

## 8. Data Flows for Key Operations

### 8.1 File Upload (All Types)
```
User uploads file
    ↓
Validate: type, size
    ↓
Upload to Cloudflare R2 (presigned URL)
    ↓
Save metadata in DB (url, name, size, mime_type, checksum)
    ↓
Access: R2 signed URL with expiry
```

### 8.2 Digital Resource Purchase
```
Learner browses store
    ↓
Selects product → Price displayed
    ↓
Pays (Cash / UPI / Online)
    ↓
Admin records / Gateway callback
    ↓
Access Grant created (learner_id + product_id)
    ↓
Product unlocked → Read/Download
```

### 8.3 AI Service (Generic)
```
Learner triggers AI Capability (Doubt Solve / MCQ Explain / future)
    ↓
Identify capability + parameters
    ↓
Check cache (ai_generated_content) for same input
    ├── Hit → Return cached (no API cost)
    └── Miss → Select LLM model + prompt template
        ↓
Send to LLM
    ↓
Store request + response
    ↓
Cache for future
    ↓
Display result
```

---

## 9. Sprint Plan (V1 Build — 15 Weeks)

| Sprint | Focus | Duration | Deliverables |
|--------|-------|----------|-------------|
| **Sprint 1** | Foundation | Week 1 | Prisma schema (all tables), Base NestJS, PrismaService, Tenant middleware, JWT auth, RBAC guards, Seed scripts |
| **Sprint 2** | Platform Admin | Week 2 | Login, Create Tenant (Profile: NEET), Activate/Deactivate, Subscription, Dashboard |
| **Sprint 3** | Institute + People | Weeks 3-4 | Institute profile, Branches, Academic Years, Curriculum Nodes CRUD, Unified Person model, Learner/Instructor/Contact management |
| **Sprint 4** | Academics | Weeks 5-6 | Learning Groups (Batches), Instructor Assignment, Timetable, Attendance (mark + reports), Leave |
| **Sprint 5** | Content + Live Classes | Weeks 7-8 | Learning Content upload (R2), Organize by Curriculum, Live Class schedule + Jitsi, Google Calendar one-way, Recording + playback |
| **Sprint 6** | Assessments | Weeks 9-10 | Question Bank CRUD, Assessment Create/Schedule/Attempt, MCQ Auto-Eval, Manual Evaluation flow (Instructor→Admin→Publish) |
| **Sprint 7** | Billing + Store | Weeks 11-12 | Billing Structure, Learner Records, Payments + Receipts, Digital Resources Store (upload + purchase + unlock) |
| **Sprint 8** | Comms + AI | Week 13 | Notifications (Email + In-App), Templates, Auto-Reminders, AI Doubt Solver, AI MCQ Explanation |
| **Sprint 9** | Dashboards + Settings | Week 14 | All role dashboards, Basic analytics, Feature Flags UI, Settings pages, Error handling |
| **Sprint 10** | Production | Week 15 | Sentry, Rate limiting, Health checks, Vercel + Railway deploy, Smoke test, Handoff |

---

## 10. Technology Decisions

| Decision | Choice | Status |
|----------|--------|--------|
| Frontend | Next.js 14 (App Router) | ✅ Locked |
| Styling | Tailwind CSS + shadcn/ui | ✅ Locked |
| State | Zustand + React Query | ✅ Locked |
| Backend | NestJS (TypeScript) | ✅ Locked |
| ORM | Prisma | ✅ Locked |
| Database | Supabase PostgreSQL (RLS) | ✅ Locked |
| Auth | JWT + Refresh Token (RS256) | ✅ Locked |
| Live Classes | Jitsi Meet (Self-hosted) | ✅ Locked |
| Video Storage | Cloudflare R2 | ✅ Locked |
| Document Storage | R2 (via Supabase Storage) | ✅ Locked |
| AI | LLM API (OpenAI / Claude) | ✅ Locked |
| Payments | Manual (V1) / Razorpay (V1.1) | ✅ Locked |
| Notifications | Email (Resend) + In-App | ✅ Locked |
| Calendar | Google Calendar API (One-Way) | ✅ Locked |
| Hosting | Vercel + Railway | ✅ Locked |
| Monitoring | Sentry | ✅ Locked |
| CI/CD | GitHub Actions | ✅ Locked |

---

## 11. V1 Success Criteria

A NEET Coaching Center can do the following **without calling a developer**:

- [ ] Admit learners (students)
- [ ] Manage instructors (tutors)
- [ ] Create learning groups (batches)
- [ ] Schedule and conduct live classes
- [ ] Store and playback recordings
- [ ] Upload and organize learning content (study materials)
- [ ] Create and conduct assessments (MCQ auto-evaluated)
- [ ] Manual evaluation with admin approval flow
- [ ] Collect billing (fees) and generate receipts
- [ ] Track attendance
- [ ] Send notifications (Email + In-App)
- [ ] Sell digital resources (previous year papers)
- [ ] Learners can ask AI doubts
- [ ] Learners can get MCQ explanations from AI
- [ ] Associated contacts (parents) can monitor progress
- [ ] All of the above configured from Tenant Admin settings (zero code changes)

---

## 12. Out of V1 Scope (Explicitly Excluded)

These will be **rejected** if requested during V1:

- ❌ WhatsApp notifications (→ V1.1)
- ❌ OCR Evaluation (→ V2)
- ❌ AI Evaluation / Auto Subjective Scoring (→ V2)
- ❌ Workflow Engine / State Machine Automation (→ V2)
- ❌ Advanced RBAC / ABAC (→ V2)
- ❌ Breakout Rooms, Polls, Whiteboard (→ V2)
- ❌ Google Calendar Two-Way Sync (→ V2)
- ❌ Question Bank Versioning / Import (→ V2)
- ❌ Learning Paths / Auto Progress (→ V2)
- ❌ AI Question Generator / Study Planner / Adaptive Learning (→ V3)
- ❌ Gamification (→ V3)
- ❌ Advanced Analytics / Predictive Reports (→ V3)
- ❌ Biometric / RFID Attendance (→ V3)
- ❌ Multi-Year Billing Planning (→ V3)
- ❌ White-label / Custom Domain (→ V3)
- ❌ UI Labels Profile Config (→ V1.1)
- ❌ Multi-Profile Activation (→ V2)

---

## 13. Key Principles

### Golden Rule
> **Business-specific behavior belongs in configuration, not in the database schema.**

### Platform Architecture
```
Education Core Platform (generic DB/API)
         │
    Profile System (configuration)
         │
    NEET Coaching V1 (first profile)
```

### Principles
1. **Future-ready database, MVP-ready implementation.** All 200+ tables exist. Only V1 features get APIs + UI.
2. **Everything configurable from Tenant Admin.** Zero code changes for daily operations.
3. **Generic naming in DB/API.** Profile-specific labels in UI config.
4. **MCQ auto-evaluated, subjective manually evaluated, admin publishes.**
5. **Feature flags control all toggles.** AI, Live Class, Assessments, etc. switchable ON/OFF.
6. **Immutable financial records.** Payments cannot be edited — only reversed via adjustment.
7. **Multi-tenant isolation is non-negotiable.** 3-layer defense (Prisma middleware + RLS + tests).
8. **Digital Store is generic.** Product types expand via config, not schema.
9. **AI is capability-based.** New capabilities = config change, not code change.
10. **AI is cache-first.** Previously answered → no LLM hit.
11. **Shared Kernel is the backbone.** Every module depends on shared services — never duplicates them. See [14-shared-kernel.md](docs/architecture/14-shared-kernel.md).
12. **Domain events for every state change.** Downstream systems subscribe without coupling.
13. **Every mutation is audited.** Append-only, immutable, 3–7 year retention.
14. **Soft delete everywhere, except financial data.** Financial mutations are permanent, only reversible.
15. **API versioned from Day 1.** `/api/v1/`. Breaking change = new version. No breaking existing clients.
16. **Storage abstracted behind interface.** R2 today, any provider tomorrow — config change only.
17. **Scope creep prevention.** Every new idea → `V2.md` (or `V1.1.md`). Never disturbs the current sprint. If it's not in this freeze, it doesn't exist for V1.

---

## 14. Scope Creep Management

Every new idea follows this process:

```
Idea vandha
    ↓
Add to V2.md
    ↓
Current sprint undisturbed
    ↓
Review at next sprint planning
```

**V2.md** lives at `docs/V2.md`. If it's not classified as V1, V1.1, V2, or V3 in this document, it goes to `V2.md` first.

---

> **This document is frozen as of July 13, 2026.**  
> See [V2.md](V2.md) for future ideas.  
> Any feature request must be classified as V1, V1.1, V2, or V3 before implementation.
