# 🏢 Institute Domain Database Schema

> **Domain:** Institute Management  
> **Owner Team:** Platform Team  
> **Database:** PostgreSQL (Supabase)  
> **Schema Version:** 3.1  
> **Status:** 🟡 Draft  
> **Parent ERD:** `docs/architecture/erd/01-institute.md`  
> **Last Reviewed By:** — (Pending)

---

## 1. Overview

**Purpose:** The Institute Domain manages tenant-level configuration of the Coaching Management Platform. It is the root domain — every other entity in the system ultimately belongs to an institute. This domain covers organizational identity, physical locations, academic calendar cycles, commercial subscription parameters, and calendar exceptions.

**Contains:**
- Institute
- Institute Category
- Branch
- Academic Year
- Subscription
- Holiday

**Domain Type:** 🧊 Cold — Entities configured once during onboarding, updated infrequently (days/weeks between writes).

---

## 2. Business Scope

### ✅ Included
- Institute identity and branding (name, code, logo, contact info)
- Institute categorization (coaching type — configurable master data)
- Branch management (physical campus locations)
- Academic year lifecycle (yearly operational cycles)
- Subscription and licensing (commercial tier limits)
- Holiday calendar (scheduling exceptions)

### ❌ Excluded
- **Users / Roles / Permissions** → User Domain (`02-user.md`) — Users are people, not tenant config
- **Courses / Subjects / Batches** → Academic Domain (`03-academic.md`) — Operational, not organizational
- **Students / Enrollments** → Student Domain (`04-student.md`) — Students use the tenant, they don't define it
- **Fee Structures / Payments** → Fee Domain — Financial transactions, not identity
- **System Config / Audit Logs** → System Domain (`11-system.md`) — Platform-level, not tenant-level

---

## 3. Lifecycle & State Machines

### Institute — State Machine

```text
                        ┌───────────┐
        ┌──────────────→│  ACTIVE   │←─────────────┐
        │               └─────┬─────┘              │
        │                     │                     │
        │              Deactivate              Reactivate
        │                     ↓                     │
        │               ┌───────────┐               │
        │               │ INACTIVE  │───────────────┘
        │               └─────┬─────┘
        │                     │
        │                  Suspend
        │                     ↓
        │               ┌───────────┐
        │               │ SUSPENDED │
        │               └─────┬─────┘
        │                     │
        │                  Archive
        │                     ↓
        │               ┌───────────┐
        └───────────────│ ARCHIVED  │ (Terminal)
                        └───────────┘
```

**Allowed Transitions:**

| From | To | Trigger | Who Can Trigger |
|---|---|---|---|
| ACTIVE | INACTIVE | Manual deactivation | Platform Admin |
| INACTIVE | ACTIVE | Reactivation after review | Platform Admin |
| ACTIVE | SUSPENDED | Subscription expired / Policy violation | System / Platform Admin |
| SUSPENDED | ACTIVE | Subscription renewed / Issue resolved | Platform Admin |
| SUSPENDED | ARCHIVED | Long-term suspension finalized | Platform Admin |
| INACTIVE | ARCHIVED | Institute permanently closed | Platform Admin |

**Forbidden Transitions:**
- ARCHIVED → Any (terminal state — data retained for compliance, never reactivated)
- ACTIVE → ARCHIVED (must go through INACTIVE or SUSPENDED first — prevents accidental data loss)

---

### Academic Year — State Machine

```text
    ┌──────────┐         ┌──────────┐         ┌──────────┐
    │ UPCOMING │────────→│  ACTIVE  │────────→│ COMPLETED│
    └──────────┘         └──────────┘         └──────────┘
```

**Allowed Transitions:**

| From | To | Trigger | Who Can Trigger |
|---|---|---|---|
| UPCOMING | ACTIVE | Admin activates for current cycle | Tenant Admin |
| ACTIVE | COMPLETED | End date reached / Manual closure | System / Tenant Admin |

**Forbidden Transitions:**
- COMPLETED → ACTIVE (historical data must not be re-opened — create a new year instead)
- COMPLETED → UPCOMING (meaningless reverse transition)

**Business Rule:** Only ONE academic year can be ACTIVE per institute at any time.

---

### Subscription — State Machine

```text
    ┌──────────┐         ┌──────────┐         ┌──────────┐
    │  TRIAL   │────────→│  ACTIVE  │────────→│ EXPIRED  │
    └──────────┘         └──────────┘         └────┬─────┘
                              │                    │
                           Cancel               Renew
                              ↓                    ↓
                         ┌──────────┐         ┌──────────┐
                         │CANCELLED │         │  ACTIVE  │
                         └──────────┘         └──────────┘
```

**Allowed Transitions:**

| From | To | Trigger | Who Can Trigger |
|---|---|---|---|
| TRIAL | ACTIVE | Payment completed | System (payment webhook) |
| ACTIVE | EXPIRED | `ends_at` date reached | System (cron job) |
| ACTIVE | CANCELLED | Manual cancellation request | Tenant Admin / Platform Admin |
| EXPIRED | ACTIVE | Renewal payment completed | System (payment webhook) |

**Forbidden Transitions:**
- CANCELLED → ACTIVE (must create a new subscription record — preserves billing history)
- TRIAL → EXPIRED (trial converts to ACTIVE or becomes CANCELLED, never expires silently)

---

## 4. Usage Pattern & Access Matrix

### 4.1 Access Pattern (Read/Write Ratio)

| Entity | Read % | Write % | Update % | Delete % | Pattern | Owner Team |
|---|---|---|---|---|---|---|
| Institute | 95% | 1% | 4% | 0% | Read-heavy | Platform Team |
| Institute Category | 99% | 1% | 0% | 0% | Read-only | Platform Team |
| Branch | 90% | 5% | 5% | 0% | Read-heavy | Platform Team |
| Academic Year | 85% | 5% | 10% | 0% | Read-heavy | Academic Team |
| Subscription | 80% | 5% | 15% | 0% | Read-heavy | Billing Team |
| Holiday | 70% | 20% | 10% | 0% | Moderate writes | Academic Team |

### 4.2 CRUD Authorization Matrix

| Entity | Create | Read | Update | Delete / Deactivate |
|---|---|---|---|---|
| Institute | Platform Admin | Everyone (own tenant) | Tenant Admin (own), Platform Admin (any) | Nobody — status change only (Platform Admin) |
| Institute Category | Platform Admin | Everyone | Platform Admin | Platform Admin (`is_active = false` only) |
| Branch | Tenant Admin | Tenant Users | Tenant Admin | Nobody — status change only (Tenant Admin) |
| Academic Year | Tenant Admin | Tenant Users | Tenant Admin | Nobody — transition to COMPLETED only |
| Subscription | System (auto) | Tenant Admin, Platform Admin | System (auto), Platform Admin | Nobody — expires naturally |
| Holiday | Tenant Admin | Tenant Users | Tenant Admin | Tenant Admin (hard delete allowed) |

### 4.3 API Dependency Map

| Entity | Used By Modules | Upstream Dependencies | Downstream Dependents |
|---|---|---|---|
| Institute | Auth, Dashboard, All Modules | None (root entity) | User, Academic, Student, Fee, Assessment, Communication |
| Institute Category | Institute Onboarding, Platform Admin | None (seed data) | Institute |
| Branch | Admissions, Students, Timetable, Attendance, Reports | Institute | Batch, Enrollment, Timetable |
| Academic Year | Enrollment, Attendance, Assessment, Fees, Reports, Timetable | Institute | Enrollment, Attendance, Assessment, Holiday |
| Subscription | Entitlement Checks (Enrollment, Branch, Tutor) | Institute | Institute status (triggers SUSPENDED) |
| Holiday | Timetable Generation, Attendance Validation, Dashboard | Institute, Academic Year | Timetable, Attendance |

---

## 5. Growth Forecast & Capacity Planning

### 5.1 Row Count Projection (3 Years)

| Entity | Year 1 | Year 3 | Growth Pattern |
|---|---|---|---|
| Institute | 100 | 1,000 | Linear (SaaS onboarding) |
| Institute Category | 15 | 25 | Stable (master data) |
| Branch | 200 | 5,000 | Linear (2-5 per institute) |
| Academic Year | 200 | 3,000 | Linear (1-2 per institute/year) |
| Subscription | 100 | 3,000 | Linear (1 active + history) |
| Holiday | 2,000 | 30,000 | Linear (15-30 per institute/year) |

### 5.2 Row Size Estimation

| Entity | Approx Row Size | Year 1 Total | Year 3 Total | Partition? |
|---|---|---|---|---|
| Institute | ~450 bytes | ~45 KB | ~450 KB | No |
| Institute Category | ~200 bytes | ~3 KB | ~5 KB | No |
| Branch | ~400 bytes | ~80 KB | ~2 MB | No |
| Academic Year | ~200 bytes | ~40 KB | ~600 KB | No |
| Subscription | ~300 bytes | ~30 KB | ~900 KB | No |
| Holiday | ~250 bytes | ~500 KB | ~7.5 MB | No |

**Total Domain Storage (Year 3):** ~11.5 MB — Entire domain fits in RAM. No partitioning needed.

### 5.3 Write TPS (Peak Load)

| Entity | Normal TPS | Peak Scenario | Peak Write TPS | Peak Read TPS |
|---|---|---|---|---|
| Institute | < 0.1 | Platform onboarding drive | 2 | 500 |
| Institute Category | < 0.01 | Initial platform setup | 0.5 | 100 |
| Branch | < 0.1 | New institute onboarding | 3 | 300 |
| Academic Year | < 0.01 | Start of academic cycle (June) | 1 | 1,000 |
| Subscription | < 0.01 | Annual renewal period | 2 | 200 |
| Holiday | 0.5 | Beginning of year (admin setup) | 10 | 200 |

**Conclusion:** No entity in this domain exceeds 10 write TPS even at peak. Standard PostgreSQL handles this effortlessly. No write-optimized architecture needed.

---

## 6. Performance Budget

| Query | P50 | P95 | P99 | Cold Start | Notes |
|---|---|---|---|---|---|
| Q1 — Resolve Tenant | < 2ms | < 5ms | < 20ms | < 100ms | Cached (Redis 1hr). Cold start only on first login. |
| Q2 — Active Branches | < 5ms | < 20ms | < 50ms | < 150ms | Cached (Redis 15min). Index-only scan possible. |
| Q3 — Current Academic Year | < 2ms | < 5ms | < 20ms | < 100ms | Cached (Redis 1hr). Single row lookup. |
| Q4 — Active Subscription | < 2ms | < 10ms | < 30ms | < 100ms | Cached (Redis 1hr). Entitlement check. |
| Q5 — List Academic Years | < 10ms | < 30ms | < 80ms | < 200ms | Not cached. Admin-only, low frequency. |
| Q6 — Holidays in Range | < 5ms | < 20ms | < 50ms | < 150ms | Cached (Redis 30min). Composite index scan. |
| Q7 — Upcoming Holidays | < 5ms | < 15ms | < 40ms | < 100ms | Cached (Redis 30min). Dashboard widget. |
| Q8 — Entitlement Count | < 10ms | < 40ms | < 100ms | < 300ms | Cross-domain. Redis counter + DB fallback. |
| Q9 — Category Dropdown | < 1ms | < 2ms | < 5ms | < 50ms | In-memory cache. Never changes at runtime. |

**Domain SLA:**
- **Availability:** 99.9% (Institute domain is critical path — all auth/API depends on it)
- **RTO (Recovery Time Objective):** 15 minutes (Supabase managed, point-in-time recovery)
- **RPO (Recovery Point Objective):** 5 minutes (WAL-based continuous backup)

---

## 7. Query Patterns ⭐

### Query 1 — Resolve Tenant Context

| Property | Value |
|---|---|
| **Screen** | All Screens (system-level, every authenticated request) |
| **Purpose** | Resolve which institute the logged-in user belongs to; load tenant context |
| **Input** | `institute_id` (from JWT claim) |
| **Output** | Institute name, logo_url, status, category name |
| **Cardinality** | 1:1 lookup |
| **Pagination** | None |
| **Frequency** | Every API request |
| **Expected Rows** | 1 |
| **Latency Target** | P95 < 5ms |
| **Cache?** | Yes — Redis, 1hr TTL |
| **Index Used** | PK `institutes.id` |

---

### Query 2 — Load Active Branches

| Property | Value |
|---|---|
| **Screen** | Dashboard, Admission Form (branch dropdown), Student Management |
| **Purpose** | Populate branch dropdown and dashboard branch list for the current tenant |
| **Input** | `institute_id`, `status = ACTIVE` |
| **Output** | Branch id, name, code, city |
| **Cardinality** | 1:N list |
| **Pagination** | None (max 5-10 branches, no pagination needed) |
| **Frequency** | High (every dashboard load, every admission form) |
| **Expected Rows** | 2–5 |
| **Latency Target** | P95 < 20ms |
| **Cache?** | Yes — Redis, 15min TTL |
| **Index Used** | `idx_branches_inst_status` |

---

### Query 3 — Get Current Academic Year

| Property | Value |
|---|---|
| **Screen** | Dashboard, Enrollment, Attendance, Reports, Timetable |
| **Purpose** | Identify the active academic cycle for date-scoped operations |
| **Input** | `institute_id`, `status = ACTIVE` |
| **Output** | Academic year id, name, start_date, end_date |
| **Cardinality** | 1:1 lookup (only one active per institute) |
| **Pagination** | None |
| **Frequency** | High (context for most data operations) |
| **Expected Rows** | 1 |
| **Latency Target** | P95 < 5ms |
| **Cache?** | Yes — Redis, 1hr TTL |
| **Index Used** | `idx_academic_years_inst_status` |

---

### Query 4 — Check Active Subscription

| Property | Value |
|---|---|
| **Screen** | Entitlement check (internal — enrollment, branch creation, tutor onboarding) |
| **Purpose** | Verify if the institute is within its plan limits before allowing resource creation |
| **Input** | `institute_id`, `status = ACTIVE` |
| **Output** | plan_name, max_students, max_branches, max_tutors, ends_at |
| **Cardinality** | 1:1 lookup |
| **Pagination** | None |
| **Frequency** | Medium (every enrollment, branch creation) |
| **Expected Rows** | 1 |
| **Latency Target** | P95 < 10ms |
| **Cache?** | Yes — Redis, 1hr TTL |
| **Index Used** | `idx_subscriptions_inst_status` |

---

### Query 5 — List All Academic Years

| Property | Value |
|---|---|
| **Screen** | Academic Year Management (Admin) |
| **Purpose** | Admin views full history of academic years |
| **Input** | `institute_id` |
| **Output** | All academic year fields |
| **Cardinality** | 1:N list |
| **Pagination** | None (max 5-10 years, no pagination needed) |
| **Frequency** | Low (admin-only, visited rarely) |
| **Expected Rows** | 2–5 |
| **Latency Target** | P95 < 30ms |
| **Cache?** | No — admin page, always fresh |
| **Index Used** | `idx_academic_years_inst_status` (partial match on `institute_id`) |

---

### Query 6 — Get Holidays in Date Range

| Property | Value |
|---|---|
| **Screen** | Timetable Generation, Attendance Validation (internal) |
| **Purpose** | Determine non-working days within a date range for scheduling |
| **Input** | `institute_id`, `academic_year_id`, `start_date`, `end_date` |
| **Output** | Holiday name, start_date, end_date, holiday_type |
| **Cardinality** | 1:N list (filtered by range) |
| **Pagination** | None (max 30 holidays per year) |
| **Frequency** | Medium (timetable: weekly/monthly, attendance: daily) |
| **Expected Rows** | 5–15 |
| **Latency Target** | P95 < 20ms |
| **Cache?** | Yes — Redis, 30min TTL |
| **Index Used** | `idx_holidays_inst_year_dates` |

---

### Query 7 — Upcoming Holidays (Dashboard Widget)

| Property | Value |
|---|---|
| **Screen** | Dashboard (widget: "Upcoming Holidays") |
| **Purpose** | Show next 7 days' holidays on the dashboard |
| **Input** | `institute_id`, `start_date >= today`, `start_date <= today + 7` |
| **Output** | Holiday name, start_date, end_date |
| **Cardinality** | 1:N list (small result set) |
| **Pagination** | None |
| **Frequency** | High (every dashboard load) |
| **Expected Rows** | 0–3 |
| **Latency Target** | P95 < 15ms |
| **Cache?** | Yes — Redis, 30min TTL |
| **Index Used** | `idx_holidays_inst_year_dates` |

---

### Query 8 — Entitlement: Count Current Students

| Property | Value |
|---|---|
| **Screen** | Enrollment (internal pre-check before admission) |
| **Purpose** | Compare current student count against `max_students` to enforce plan limits |
| **Input** | `institute_id` |
| **Output** | COUNT of active students (aggregate) |
| **Cardinality** | Aggregate (COUNT) |
| **Pagination** | None |
| **Frequency** | Medium (every enrollment) |
| **Expected Rows** | 1 (single aggregate value) |
| **Latency Target** | P95 < 40ms |
| **Cache?** | Yes — Redis counter, invalidated on enrollment/withdrawal |
| **Index Used** | Cross-domain — index in Student domain (`04-student.md`) |

> **Cross-Domain Note:** Subscription entity lives here, student count comes from Student Domain. Entitlement service orchestrates both.

---

### Query 9 — Load Institute Categories (Dropdown)

| Property | Value |
|---|---|
| **Screen** | Platform Admin → Institute Onboarding Form |
| **Purpose** | Populate "Institute Type" dropdown during new institute creation |
| **Input** | `is_active = true` |
| **Output** | Category id, name, code |
| **Cardinality** | 1:N list (full table scan, tiny table) |
| **Pagination** | None |
| **Frequency** | Low (Platform Admin only) |
| **Expected Rows** | 10–25 |
| **Latency Target** | P95 < 2ms |
| **Cache?** | Yes — NestJS In-Memory (never changes at runtime) |
| **Index Used** | None needed (< 30 rows, sequential scan is faster) |

---

## 8. Enum Definitions

### `InstituteStatus`

| Value | Description | Notes |
|---|---|---|
| `ACTIVE` | Institute is operational | Default on creation |
| `INACTIVE` | Temporarily disabled by admin | Reversible |
| `SUSPENDED` | System-enforced due to subscription/policy | Reversible by Platform Admin |
| `ARCHIVED` | Permanently closed | Terminal state |

### `AcademicYearStatus`

| Value | Description | Notes |
|---|---|---|
| `UPCOMING` | Created but not yet started | Default on creation |
| `ACTIVE` | Currently running | Only 1 per institute |
| `COMPLETED` | Finished | Terminal for this record |

### `SubscriptionStatus`

| Value | Description | Notes |
|---|---|---|
| `TRIAL` | Free trial period | Default on creation |
| `ACTIVE` | Paid and operational | Only 1 per institute |
| `EXPIRED` | Past `ends_at` date | Can renew → ACTIVE |
| `CANCELLED` | Manually cancelled | Terminal for this record |

### `HolidayType`

| Value | Description | Notes |
|---|---|---|
| `PUBLIC` | Government/national holiday | Default |
| `INSTITUTE` | Institute-specific closure | Custom |
| `EXAM_BREAK` | Exam preparation period | Blocks scheduling |
| `ACADEMIC_BREAK` | Semester/term break | Blocks scheduling |

### `BranchStatus`

| Value | Description | Notes |
|---|---|---|
| `ACTIVE` | Branch is operational | Default |
| `INACTIVE` | Temporarily closed | Blocks new enrollments |

---

## 9. Entity Design

### 9.1 `institutes`

**Purpose:** Master tenant record. Root entity of the entire platform. Every other entity has a foreign key path back to this table.

#### Columns

| Column | Type | Nullable | Default | Business Purpose |
|---|---|---|---|---|
| `id` | UUID | No | `gen_random_uuid()` | Primary Key |
| `name` | VARCHAR(255) | No | - | Official institute name |
| `code` | VARCHAR(50) | No | - | Unique URL slug for tenant routing |
| `email` | VARCHAR(255) | Yes | - | Primary administrative email |
| `phone` | VARCHAR(20) | Yes | - | Primary contact phone |
| `logo_url` | TEXT | Yes | - | Branding asset (Supabase Storage URL) |
| `category_id` | UUID | No | - | FK → `institute_categories.id` |
| `status` | `InstituteStatus` | No | `'ACTIVE'` | Lifecycle state (see Section 3) |
| `created_at` | TIMESTAMPTZ | No | `now()` | Audit: creation time |
| `updated_at` | TIMESTAMPTZ | No | `now()` | Audit: last modification |
| `created_by` | UUID | Yes | - | Audit: Platform Admin who created |
| `updated_by` | UUID | Yes | - | Audit: who last modified |

#### Business Rules
- `code` is **immutable** after creation — used in URL routing (`/tenant/{code}/...`). Changing it breaks bookmarks, API integrations, and cached references.
- `status` transitions MUST follow the state machine in Section 3. Direct ACTIVE → ARCHIVED is forbidden.
- `status` cannot transition to ACTIVE if the linked subscription is EXPIRED or CANCELLED.
- `email` should be verified during onboarding (application layer, not DB).
- `logo_url` is optional — UI renders a default avatar when null.
- An institute can NEVER be hard-deleted. Status is set to ARCHIVED for compliance retention.

#### Validation Rules

| Column | Enforcement | Rule | Example |
|---|---|---|---|
| `name` | Application | Non-empty, 2–255 chars, trimmed | `Apex Coaching Academy` |
| `code` | Database (CHECK) + Application | Uppercase alphanumeric + underscore, 3–50 chars | `APEX_ACADEMY` |
| `email` | Application (regex/library) | RFC 5322 format (or null) | `admin@apex.edu.in` |
| `phone` | Application (library) | E.164 format, 10–15 digits (or null) | `+919876543210` |
| `logo_url` | Application | Valid URL, `https://` only (or null) | `https://storage.supabase.co/...` |
| `status` | Database (ENUM) | Only values in `InstituteStatus` | `ACTIVE` |

---

### 9.2 `institute_categories`

**Purpose:** Configurable master catalog of coaching/academy types. Adding a new category = one DB insert, zero code changes.

#### Columns

| Column | Type | Nullable | Default | Business Purpose |
|---|---|---|---|---|
| `id` | UUID | No | `gen_random_uuid()` | Primary Key |
| `name` | VARCHAR(100) | No | - | Display label (e.g., "Medical Prep") |
| `code` | VARCHAR(50) | No | - | System identifier (e.g., `MEDICAL`) |
| `description` | TEXT | Yes | - | Optional explanation |
| `is_active` | BOOLEAN | No | `true` | Soft disable without deleting |
| `created_at` | TIMESTAMPTZ | No | `now()` | Audit: creation time |

#### Business Rules
- **Platform-global** table — no `institute_id`. Only Platform Admins manage it.
- `code` is immutable — used in system logic (e.g., "if MEDICAL, show biology subject templates").
- Deactivating (`is_active = false`) does NOT affect existing institutes. New institutes simply can't select it.
- Rows are NEVER hard-deleted.

#### Validation Rules

| Column | Enforcement | Rule | Example |
|---|---|---|---|
| `name` | Application | Non-empty, 2–100 chars | `Engineering Prep` |
| `code` | Database (CHECK) + Application | Uppercase alphanumeric + underscore, 3–50 chars | `ENGINEERING` |

---

### 9.3 `branches`

**Purpose:** Physical campus/location record. Each branch hosts batches, students, and timetables independently.

#### Columns

| Column | Type | Nullable | Default | Business Purpose |
|---|---|---|---|---|
| `id` | UUID | No | `gen_random_uuid()` | Primary Key |
| `institute_id` | UUID | No | - | FK → `institutes.id` (Tenant Key) |
| `name` | VARCHAR(255) | No | - | Branch label |
| `code` | VARCHAR(50) | Yes | - | Short internal reference |
| `address` | TEXT | Yes | - | Full physical address |
| `city` | VARCHAR(100) | Yes | - | City (for grouping/filtering) |
| `phone` | VARCHAR(20) | Yes | - | Branch contact number |
| `status` | `BranchStatus` | No | `'ACTIVE'` | `ACTIVE`, `INACTIVE` |
| `created_at` | TIMESTAMPTZ | No | `now()` | Audit: creation time |
| `updated_at` | TIMESTAMPTZ | No | `now()` | Audit: last modification |

#### Business Rules
- Creation requires entitlement check against `subscriptions.max_branches`.
- Cannot deactivate if it has active batches with enrolled students.
- Never hard-deleted — transitions to `INACTIVE`.
- `name` must be unique within the same institute.

#### Validation Rules

| Column | Enforcement | Rule | Example |
|---|---|---|---|
| `name` | Application | Non-empty, 2–255 chars | `Anna Nagar Branch` |
| `code` | Application | Alphanumeric + underscore, 3–50 chars (or null) | `AN_BR_01` |
| `phone` | Application (library) | E.164 format (or null) | `+914423456789` |
| `city` | Application | 2–100 chars (or null) | `Chennai` |
| `status` | Database (ENUM) | Only values in `BranchStatus` | `ACTIVE` |

---

### 9.4 `academic_years`

**Purpose:** Operational cycle definition. Every date-scoped operation (enrollment, attendance, assessment, reporting) is anchored to an academic year.

#### Columns

| Column | Type | Nullable | Default | Business Purpose |
|---|---|---|---|---|
| `id` | UUID | No | `gen_random_uuid()` | Primary Key |
| `institute_id` | UUID | No | - | FK → `institutes.id` (Tenant Key) |
| `name` | VARCHAR(50) | No | - | Display label (e.g., "2026 – 2027") |
| `start_date` | DATE | No | - | Cycle begins |
| `end_date` | DATE | No | - | Cycle ends |
| `status` | `AcademicYearStatus` | No | `'UPCOMING'` | Lifecycle state (see Section 3) |
| `created_at` | TIMESTAMPTZ | No | `now()` | Audit: creation time |
| `updated_at` | TIMESTAMPTZ | No | `now()` | Audit: last modification |

#### Business Rules
- Only ONE academic year with `status = 'ACTIVE'` per institute. Enforced at application layer (NestJS service) — requires deactivate-previous + activate-new in one transaction.
- `start_date` must be before `end_date`.
- Overlapping date ranges within same institute are not allowed (application-level check).
- Cannot delete if associated enrollments, attendance records, or assessments exist.
- `name` must be unique within the same institute.

#### Validation Rules

| Column | Enforcement | Rule | Example |
|---|---|---|---|
| `name` | Application | Non-empty, 4–50 chars | `2026 – 2027` |
| `start_date` | Database (CHECK) | Must be before `end_date` | `2026-06-01` |
| `end_date` | Database (CHECK) | Must be after `start_date` | `2027-05-31` |
| `status` | Database (ENUM) | Only values in `AcademicYearStatus` | `ACTIVE` |

---

### 9.5 `subscriptions`

**Purpose:** Commercial licensing parameters. Each record = one billing cycle. Controls features and capacities.

#### Columns

| Column | Type | Nullable | Default | Business Purpose |
|---|---|---|---|---|
| `id` | UUID | No | `gen_random_uuid()` | Primary Key |
| `institute_id` | UUID | No | - | FK → `institutes.id` |
| `plan_name` | VARCHAR(100) | No | - | Tier label: "Starter", "Premium", etc. |
| `max_students` | INT | No | `100` | Student enrollment cap |
| `max_branches` | INT | No | `1` | Branch creation cap |
| `max_tutors` | INT | No | `10` | Tutor onboarding cap |
| `status` | `SubscriptionStatus` | No | `'TRIAL'` | Lifecycle state (see Section 3) |
| `starts_at` | TIMESTAMPTZ | No | - | Billing cycle start |
| `ends_at` | TIMESTAMPTZ | No | - | Billing cycle expiration |
| `created_at` | TIMESTAMPTZ | No | `now()` | Audit: creation time |
| `updated_at` | TIMESTAMPTZ | No | `now()` | Audit: last modification |

#### Business Rules
- 1:N with Institute (NOT 1:1). Each record = one billing cycle. Only ACTIVE one is current.
- When subscription expires, cron job transitions it to EXPIRED and triggers `SubscriptionExpired` event → may suspend institute.
- `max_students`, `max_branches`, `max_tutors` checked before resource creation.
- Creating a new ACTIVE subscription automatically expires any existing ACTIVE one (same-transaction).
- `starts_at` must be before `ends_at`.

#### Validation Rules

| Column | Enforcement | Rule | Example |
|---|---|---|---|
| `plan_name` | Application | Non-empty, 2–100 chars | `Premium Annual` |
| `max_students` | Database (CHECK) | Positive integer, min 1 | `500` |
| `max_branches` | Database (CHECK) | Positive integer, min 1 | `5` |
| `max_tutors` | Database (CHECK) | Positive integer, min 1 | `50` |
| `starts_at` | Database (CHECK) | Before `ends_at` | `2026-06-01T00:00:00Z` |
| `ends_at` | Database (CHECK) | After `starts_at` | `2027-05-31T23:59:59Z` |
| `status` | Database (ENUM) | Only values in `SubscriptionStatus` | `ACTIVE` |

---

### 9.6 `holidays`

**Purpose:** Calendar exception entries used by timetable generation and attendance validation.

#### Columns

| Column | Type | Nullable | Default | Business Purpose |
|---|---|---|---|---|
| `id` | UUID | No | `gen_random_uuid()` | Primary Key |
| `institute_id` | UUID | No | - | FK → `institutes.id` (Tenant Key) |
| `academic_year_id` | UUID | No | - | FK → `academic_years.id` |
| `name` | VARCHAR(150) | No | - | Holiday name |
| `start_date` | DATE | No | - | Holiday begins |
| `end_date` | DATE | No | - | Holiday ends |
| `holiday_type` | `HolidayType` | No | `'PUBLIC'` | Category of holiday |
| `created_at` | TIMESTAMPTZ | No | `now()` | Audit: creation time |

#### Business Rules
- `academic_year_id` mandatory — holidays must belong to a specific year. Prevents orphan holidays.
- Hard delete allowed (holidays are not auditable entities — no compliance requirement).
- Overlapping holidays within same year are allowed (e.g., public holiday within exam break is fine).
- Holiday CRUD should trigger timetable recalculation (async event, not blocking).

#### Validation Rules

| Column | Enforcement | Rule | Example |
|---|---|---|---|
| `name` | Application | Non-empty, 2–150 chars | `Pongal Break` |
| `start_date` | Database (CHECK) | On or before `end_date` | `2027-01-14` |
| `end_date` | Database (CHECK) | On or after `start_date` | `2027-01-17` |
| `holiday_type` | Database (ENUM) | Only values in `HolidayType` | `PUBLIC` |

---

## 10. Foreign Keys

### `institutes` Foreign Keys

| FK Column | References | On Delete | On Update | Indexed? | Tenant Scoped? | Deferrable? |
|---|---|---|---|---|---|---|
| `category_id` | `institute_categories.id` | Restrict | Cascade | Yes (single) | No (global table) | No (Immediate) |

### `branches` Foreign Keys

| FK Column | References | On Delete | On Update | Indexed? | Tenant Scoped? | Deferrable? |
|---|---|---|---|---|---|---|
| `institute_id` | `institutes.id` | Restrict | Cascade | Yes (composite: `idx_branches_inst_status`) | Yes | No (Immediate) |

### `academic_years` Foreign Keys

| FK Column | References | On Delete | On Update | Indexed? | Tenant Scoped? | Deferrable? |
|---|---|---|---|---|---|---|
| `institute_id` | `institutes.id` | Restrict | Cascade | Yes (composite: `idx_academic_years_inst_status`) | Yes | No (Immediate) |

### `subscriptions` Foreign Keys

| FK Column | References | On Delete | On Update | Indexed? | Tenant Scoped? | Deferrable? |
|---|---|---|---|---|---|---|
| `institute_id` | `institutes.id` | Restrict | Cascade | Yes (composite: `idx_subscriptions_inst_status`) | Yes | No (Immediate) |

### `holidays` Foreign Keys

| FK Column | References | On Delete | On Update | Indexed? | Tenant Scoped? | Deferrable? |
|---|---|---|---|---|---|---|
| `institute_id` | `institutes.id` | Cascade | Cascade | Yes (composite: `idx_holidays_inst_year_dates`) | Yes | No (Immediate) |
| `academic_year_id` | `academic_years.id` | Cascade | Cascade | Yes (composite: `idx_holidays_inst_year_dates`) | N/A | No (Immediate) |

> **Deferrable Policy:** All FKs default to `INITIALLY IMMEDIATE`. Deferred constraints only for future bulk-migration scripts — to be decided per-migration.

---

## 11. Constraints

### Database-Enforced Constraints

| Constraint Name | Type | Table | Columns | Business Rule |
|---|---|---|---|---|
| `uq_institutes_code` | Unique | `institutes` | `(code)` | Code globally unique (URL routing) |
| `uq_institutes_email` | Unique | `institutes` | `(email)` | No duplicate admin emails |
| `uq_categories_code` | Unique | `institute_categories` | `(code)` | Category code globally unique |
| `uq_branches_inst_name` | Unique | `branches` | `(institute_id, name)` | Branch name unique per tenant |
| `uq_academic_years_inst_name` | Unique | `academic_years` | `(institute_id, name)` | Year label unique per tenant |
| `chk_academic_years_dates` | Check | `academic_years` | `start_date < end_date` | Start before end |
| `chk_holidays_dates` | Check | `holidays` | `start_date <= end_date` | Start on or before end |
| `chk_subscriptions_dates` | Check | `subscriptions` | `starts_at < ends_at` | Start before expiry |
| `chk_subscriptions_limits` | Check | `subscriptions` | `max_students > 0 AND max_branches > 0 AND max_tutors > 0` | Positive limits only |

### Application-Enforced Constraints

| Rule | Table | Logic | Reason Not in DB |
|---|---|---|---|
| Only 1 active academic year per institute | `academic_years` | Service layer transaction (deactivate old + activate new) | Requires multi-row atomic update |
| Only 1 active subscription per institute | `subscriptions` | Service layer transaction (expire old + create new) | Requires multi-row atomic update |
| Branch count ≤ `max_branches` | `branches` + `subscriptions` | Entitlement service cross-table check | Cross-table business rule |
| Student count ≤ `max_students` | Cross-domain | Entitlement service | Cross-domain aggregate |
| No overlapping academic year dates | `academic_years` | Service layer date range check | Complex range overlap logic |
| Institute code immutability | `institutes` | API rejects update on `code` field | DB partial immutability not natively supported |

### Distributed Constraints

| Rule | Table | External System | Enforcement |
|---|---|---|---|
| Payment verified before ACTIVE | `subscriptions` | Payment Gateway (Razorpay/Stripe webhook) | Eventual consistency — webhook handler |
| Email ownership verified | `institutes` | Email verification service (OTP/link) | Eventual — verified flag in User domain |

---

## 12. Index Strategy

| Index Name | Table | Columns | Include (Covering) | Supports Query | Type | Justification |
|---|---|---|---|---|---|---|
| PK (auto) | `institutes` | `(id)` | - | Q1 | B-tree (PK) | Primary key, O(1) |
| `uq_institutes_code` | `institutes` | `(code)` | - | URL routing | B-tree (Unique) | Auto-created by unique constraint |
| `uq_institutes_email` | `institutes` | `(email)` | - | Email uniqueness | B-tree (Unique) | Auto-created by unique constraint |
| `idx_branches_inst_status` | `branches` | `(institute_id, status)` | `(name, code, city)` | Q2 | B-tree | **Covering index** — dashboard branch list becomes index-only scan |
| `idx_academic_years_inst_status` | `academic_years` | `(institute_id, status)` | `(name, start_date, end_date)` | Q3, Q5 | B-tree | **Covering index** — avoids heap access for year lookups |
| `idx_subscriptions_inst_status` | `subscriptions` | `(institute_id, status)` | `(plan_name, max_students, max_branches, max_tutors)` | Q4 | B-tree | **Covering index** — entitlement checks become index-only |
| `idx_holidays_inst_year_dates` | `holidays` | `(institute_id, academic_year_id, start_date)` | `(name, end_date, holiday_type)` | Q6, Q7 | B-tree | **Covering index** — holiday range lookups avoid table access |

**Index Budget:** 7 indexes across 6 tables (Cold domain ≤ 2 per table — all within budget)

**Notes:**
- `institute_categories` has no custom index. PK + `uq_categories_code` sufficient for < 30 rows.
- All composite indexes are tenant-first (`institute_id` leading) for RLS compatibility.
- **PostgreSQL 11+** `INCLUDE` clause used for covering indexes to achieve index-only scans on frequent queries.

---

## 13. Cache Strategy & Failure Handling

### 13.1 Cache Plan

| Entity | Cache Location | Source of Truth | TTL | Key Pattern | Invalidation Trigger |
|---|---|---|---|---|---|
| Institute details | Redis | PostgreSQL | 1 hr | `institute:{instituteId}` | On settings update API |
| Category list | NestJS In-Memory | PostgreSQL | Until restart | N/A (singleton) | Never changes at runtime |
| Branch list | Redis | PostgreSQL | 15 min | `branches:{instituteId}` | On branch create/update |
| Active Academic Year | Redis | PostgreSQL | 1 hr | `academic_year:active:{instituteId}` | On year activation/completion |
| Active Subscription | Redis | PostgreSQL | 1 hr | `subscription:active:{instituteId}` | On subscription create/expire |
| Holiday list | Redis | PostgreSQL | 30 min | `holidays:{instituteId}:{yearId}` | On holiday create/update/delete |
| Entitlement counters | Redis | PostgreSQL | 15 min | `entitlement:students:{instituteId}` | On enrollment/withdrawal |

### 13.2 Cache Failure Strategy

| Scenario | Behavior | Recovery | Latency Impact |
|---|---|---|---|
| Redis unavailable | Fallback to direct DB query | Circuit breaker: 3 failures → open (30s), then half-open | P95 degrades from 5ms → 30ms |
| Cache miss (key expired) | Fetch from DB, populate cache | Automatic on read (cache-aside pattern) | One-time penalty, subsequent hits fast |
| Stale cache after app crash | TTL-based self-heal | No manual intervention needed | Max staleness = TTL duration |
| Cache + DB mismatch | DB is ALWAYS source of truth | Cache invalidation on next write | At most TTL window of stale data |
| Redis reconnection | Warm-up on startup (optional) | Lazy loading — cache populates on first access | First N requests slower |

---

## 14. Transaction Boundaries

### Transaction 1 — Academic Year Activation

**Trigger:** Tenant Admin activates a new academic year

**Steps (in order):**
1. Find currently ACTIVE academic year for this institute
2. Set current ACTIVE year to `COMPLETED`
3. Set selected UPCOMING year to `ACTIVE`
4. Invalidate Redis cache `academic_year:active:{instituteId}`
5. Publish `AcademicYearActivated` event

**Tables Involved:** `academic_years` (same table, 2 rows)  
**Isolation Level:** `READ COMMITTED` (default — sufficient because both rows are in same table, locked by `FOR UPDATE`)  
**Rollback Strategy:** If any step fails, entire transaction rolls back. No year is left without an active state.  
**Performance Impact:** Minimal — 2 row updates + 1 cache delete. < 10ms.

---

### Transaction 2 — Subscription Renewal

**Trigger:** Payment gateway webhook confirms renewal payment

**Steps (in order):**
1. Find currently ACTIVE subscription for this institute
2. Set current ACTIVE subscription to `EXPIRED`
3. Insert new subscription record with `status = ACTIVE`
4. If institute was SUSPENDED → update `institutes.status` to `ACTIVE`
5. Invalidate Redis cache `subscription:active:{instituteId}` and `institute:{instituteId}`
6. Publish `SubscriptionRenewed` event

**Tables Involved:** `subscriptions`, `institutes`  
**Isolation Level:** `READ COMMITTED` with `SELECT FOR UPDATE` on subscription row  
**Rollback Strategy:** If payment webhook is idempotent, retry is safe. If insert fails, old subscription remains ACTIVE.  
**Performance Impact:** Low — 1 update + 1 insert + optional 1 update. < 20ms.

---

### Transaction 3 — Institute Suspension (Subscription Expiry)

**Trigger:** System cron job detects subscription past `ends_at`

**Steps (in order):**
1. Find all ACTIVE subscriptions where `ends_at < now()`
2. Set each to `EXPIRED`
3. For each affected institute → set `institutes.status` to `SUSPENDED`
4. Invalidate Redis caches for each affected institute
5. Publish `SubscriptionExpired` event per institute
6. Publish `InstituteSuspended` event per institute

**Tables Involved:** `subscriptions`, `institutes`  
**Isolation Level:** `READ COMMITTED` (batch operation, row-level locks per institute)  
**Rollback Strategy:** Per-institute transaction — failure for one institute doesn't affect others  
**Performance Impact:** Low — batch runs at off-peak hours. Even 100 expirations < 1 second.

---

### Transaction 4 — Branch Creation with Entitlement Check

**Trigger:** Tenant Admin creates a new branch

**Steps (in order):**
1. Get active subscription for this institute (cached or DB)
2. Count current branches for this institute
3. If count >= `max_branches` → reject with `403 Plan Limit Exceeded`
4. Insert new branch record
5. Invalidate Redis cache `branches:{instituteId}`
6. Publish `BranchCreated` event

**Tables Involved:** `branches`, `subscriptions` (read-only)  
**Isolation Level:** `READ COMMITTED` (entitlement check is advisory, not strict — rare race condition acceptable)  
**Rollback Strategy:** If insert fails, no side effects.  
**Performance Impact:** Minimal — 1 count + 1 insert. < 15ms.

---

## 15. Consistency Model

| Operation | Consistency | Mechanism | Staleness Window | Rationale |
|---|---|---|---|---|
| Tenant context resolution | Strong (cached) | Redis with DB fallback | Max 1 hour (TTL) | Acceptable — institute details rarely change |
| Branch list for dropdown | Strong (cached) | Redis, invalidated on write | Max 15 min (TTL) | Dropdown can tolerate brief delay for new branch |
| Academic year activation | Strong | Single DB transaction | None | Critical — all date-scoped operations depend on it |
| Subscription entitlement check | Strong (cached) | Redis counter + DB fallback | Max 15 min | Over-enrollment risk low, checked at API layer |
| Holiday → Timetable update | Eventual (Async) | `HolidayCreated` event → Timetable service queue | 5–30 seconds | Timetable can tolerate brief delay |
| Subscription expiry → Institute suspend | Strong (batched) | Cron job transaction | Up to 1 hour (cron interval) | Batch process, not real-time |
| Holiday → Attendance validation | Strong (cached) | Redis, checked before attendance marking | Max 30 min (TTL) | Acceptable — holidays don't change mid-day |

---

## 16. Domain Events

### Events Published

| Event Name | Trigger | Payload | Consumers |
|---|---|---|---|
| `InstituteCreated` | After new institute onboarding | `{ id, name, code, categoryId }` | User Domain (create default admin), Notification |
| `InstituteUpdated` | After settings change | `{ id, changedFields }` | Dashboard cache, Notification |
| `InstituteSuspended` | After status → SUSPENDED | `{ id, reason }` | User Domain (block logins), Notification, Audit |
| `InstituteReactivated` | After status → ACTIVE from SUSPENDED | `{ id }` | User Domain (unblock logins), Notification |
| `BranchCreated` | After new branch added | `{ id, instituteId, name }` | Dashboard, Audit |
| `BranchDeactivated` | After branch status → INACTIVE | `{ id, instituteId }` | Student Domain (reassign students?), Timetable |
| `AcademicYearActivated` | After year status → ACTIVE | `{ id, instituteId, name, startDate, endDate }` | Enrollment, Timetable, Attendance, Fees, Reports |
| `AcademicYearCompleted` | After year status → COMPLETED | `{ id, instituteId }` | Reports (finalize), Archive |
| `SubscriptionActivated` | After subscription → ACTIVE | `{ id, instituteId, planName, limits }` | Entitlement cache, Notification |
| `SubscriptionExpired` | After subscription → EXPIRED | `{ id, instituteId }` | Institute suspension trigger, Notification, Audit |
| `SubscriptionRenewed` | After renewal payment | `{ id, instituteId, newPlanName }` | Institute reactivation, Notification |
| `HolidayCreated` | After holiday added | `{ id, instituteId, yearId, startDate, endDate }` | Timetable (recalculate), Dashboard widget |
| `HolidayDeleted` | After holiday removed | `{ id, instituteId, yearId, startDate, endDate }` | Timetable (recalculate) |

### Events Consumed

| Event Name | Source Domain | Handler | Side Effect |
|---|---|---|---|
| `PaymentCompleted` | Billing / Payment Gateway | `SubscriptionService.activate()` | Create/activate subscription record |
| `PaymentFailed` | Billing / Payment Gateway | `SubscriptionService.handleFailure()` | Log failure, notify admin |
| `PaymentExpired` | Billing / Payment Gateway | `SubscriptionService.expire()` | Trigger subscription expiry flow |

---

## 17. Cross-Domain Contracts

### Exports (Institute Domain → Others)

| Consumer Domain | Data Provided | Access Method | Freshness | Contract |
|---|---|---|---|---|
| User Domain | `institute_id`, `name`, `status` | FK lookup / Redis cache | Cached (1hr) | User must verify institute is ACTIVE before login |
| Academic Domain | `branch_id`, `academic_year_id` | FK lookup / Redis cache | Cached (15min) | Course/Batch must reference valid branch + year |
| Student Domain | `institute_id`, `branch_id`, `academic_year_id` | FK lookup | Real-time (FK) | Enrollment requires all three active |
| Fee Domain | `subscription.plan_name`, `subscription.limits` | Service call / Redis | Cached (1hr) | Fee module checks plan tier for pricing rules |
| Assessment Domain | `academic_year_id` | FK lookup | Real-time (FK) | Assessments scoped to academic year |
| Communication Domain | `institute_id`, `branch_id` | FK lookup | Real-time (FK) | Notifications scoped to tenant |

### Imports (Other Domains → Institute)

| Provider Domain | Data Consumed | Access Method | Freshness | Contract |
|---|---|---|---|---|
| Billing / Payment | Payment status (success/failure/expiry) | Webhook event | Eventual | Triggers subscription state machine |
| User Domain | User count per institute | Service call (on admin request) | On-demand | Dashboard stats display |
| Student Domain | Active student count | Redis counter / Service call | Cached (15min) | Entitlement enforcement |

---

## 18. Audit Strategy

### Audit Columns (Built-in)

| Column | Purpose | Auto-populated? | How |
|---|---|---|---|
| `created_at` | Record creation timestamp | Yes | DB default `now()` |
| `updated_at` | Last modification timestamp | Yes | Prisma `@updatedAt` / DB trigger |
| `created_by` | Who created the record | Yes | From JWT `userId` in NestJS middleware |
| `updated_by` | Who last modified | Yes | From JWT `userId` in NestJS middleware |

### Audit Log (External — System Domain)

| Entity | Auditable Actions | Before/After Stored? | Retention | Priority |
|---|---|---|---|---|
| Institute | Create, Update, Status Change | Yes (JSONB diff: before + after) | 3 years (compliance) | High |
| Branch | Create, Update, Deactivate | Yes (JSONB diff) | 2 years | Medium |
| Academic Year | Create, Activate, Complete | Yes (JSONB diff) | 2 years | Medium |
| Subscription | Create, Activate, Expire, Cancel | Yes (JSONB diff) | 5 years (financial compliance) | High |
| Holiday | Create, Update, Delete | No (low-value, non-auditable) | 1 year | Low |
| Institute Category | Create, Update, Deactivate | No (Platform admin action, low frequency) | 1 year | Low |

> **Implementation:** Full audit log table lives in System Domain (`11-system.md`). Institute domain publishes domain events; the audit service subscribes and stores diffs. Each domain only declares WHAT is auditable and for how long.

---

## 19. Security Notes

- **Tenant Isolation (RLS):** Every table except `institute_categories` carries `institute_id`. Supabase RLS policies MUST filter on `institute_id` matching the JWT `institute_id` claim. No cross-tenant data leakage.
- **Platform-Global Tables:** `institute_categories` — `SELECT` for all authenticated, `INSERT/UPDATE/DELETE` for `role = 'PLATFORM_ADMIN'` only.
- **PII Columns:** `institutes.email`, `institutes.phone` — must be masked in logs, excluded from analytics exports, encrypted at rest (Supabase default).
- **Immutable Fields:** `institutes.code`, `institute_categories.code` — API must reject `PATCH`/`PUT` requests that attempt to change these.
- **Audit Trail:** `created_by` and `updated_by` are nullable because system-generated actions (cron jobs, webhooks) don't have a human actor. In those cases, a special system user UUID is used.
- **Status Transition Security:** State machine transitions must be validated server-side — client cannot directly set `status = ARCHIVED`.

---

## 20. Future Scalability & Migration

### 20.1 Scalability Thresholds

| Trigger (Exact Threshold) | Action | Priority |
|---|---|---|
| Institutes > 5,000 | Add `pg_trgm` GIN index on `institutes.name` for fuzzy search | Phase 3 |
| Institutes > 50,000 | Evaluate horizontal sharding by institute (Citus) | Phase 5+ |
| Branches > 20,000 | Add `region` / `zone` column for hierarchical grouping | Phase 3 |
| Branches > 100,000 | Partition by `institute_id` range | Phase 5+ |
| Holidays > 100,000 | Partition by `academic_year_id` (yearly partitions) | Phase 4 |
| Subscriptions > 50,000 | Archive EXPIRED/CANCELLED to cold storage (S3/parquet) | Phase 4 |
| Category list > 100 | Move from in-memory to Redis cache | Phase 3 |

### 20.2 Migration Roadmap

| Phase | Change | Reason | Impact |
|---|---|---|---|
| Phase 2 | Add `timezone` (VARCHAR) to `institutes` | Multi-timezone support | Low — nullable column, no data migration |
| Phase 2 | Add `currency` (VARCHAR) to `institutes` | Multi-currency fee management | Low — nullable column |
| Phase 3 | Add `features` (JSONB) to `subscriptions` | Feature-flag licensing beyond caps | Medium — migrate existing cap checks |
| Phase 3 | Add `parent_institute_id` to `institutes` | Franchise/chain management | Medium — self-ref FK, UI changes |
| Phase 4 | Add `branch_id` to `academic_years` | Branch-specific academic calendars | High — breaks "1 active year per institute" assumption |
| Phase 4 | Add `recurrence_rule` to `holidays` | Auto-generate recurring holidays (iCal RRULE) | Medium — new feature, no breaking changes |
| Future | Add `state`, `country` to `branches` | Geo-based filtering + compliance | Low — nullable columns |

---

## 21. Domain Observability

> **Lightweight** domain-specific hooks only. Full observability architecture lives in  
> `docs/architecture/observability-operations.md`.

### 21.1 Key Metrics (Domain-Specific)

| Metric | Type | Alert Threshold | Dashboard |
|---|---|---|---|
| Active subscriptions count | Gauge | < 1 (critical) | Grafana: Business |
| Active tenant institutes | Gauge | N/A (informational) | Grafana: Business |
| Total active branches | Gauge | N/A (informational) | Grafana: Business |

### 21.2 Domain-Specific Alerts

| Alert | Condition | Severity |
|---|---|---|
| Subscription Cron Failure | Any failure in subscription expiry check cron | 🔴 Critical |
| Rapid Tenant Suspensions | > 5 institutes suspended within 10 minutes | ⚠️ Warning |

### 21.3 Business Events for Monitoring

> These events feed the observability layer. Detailed payloads are defined in Section 16 (Domain Events).

| Event | Log Level | Monitored? |
|---|---|---|
| `InstituteCreated` | INFO | Yes — dashboard onboarding counter |
| `InstituteSuspended` | WARN | Yes — alerts if threshold exceeded |
| `SubscriptionExpired` | INFO | Yes — dashboard subscription tracker |
| `SubscriptionRenewed` | INFO | Yes — dashboard revenue/billing tracker |

---

## Appendix: Domain Notes

### Naming Conventions (Global)
- **Tables:** `snake_case`, plural (`institutes`, `branches`, `holidays`)
- **PKs:** `id` (UUID, `gen_random_uuid()`)
- **FKs:** `{referenced_table_singular}_id` (e.g., `institute_id`, `category_id`)
- **Timestamps:** `created_at`, `updated_at` (TIMESTAMPTZ)
- **Status fields:** Named PostgreSQL ENUMs (e.g., `InstituteStatus`, not `VARCHAR`)
- **Indexes:** `idx_{table}_{columns}` (e.g., `idx_branches_inst_status`)
- **Unique constraints:** `uq_{table}_{columns}`
- **Check constraints:** `chk_{table}_{rule}`
- **Booleans:** `is_` prefix (`is_active`, not `active`)

### Decision Log
- **ADR-001:** Status enum vs boolean `is_active` — Enum chosen for richer lifecycle representation. See `docs/03-decisions.md`.
- **ADR-002:** Subscription 1:N vs 1:1 — 1:N preserves billing history. Previous records are EXPIRED, only ACTIVE matters.
- **ADR-003:** Application-level "only 1 active" constraint vs DB partial unique index — Application chosen for transactional atomicity (deactivate + activate must be in same transaction).
- **ADR-004:** Holiday hard delete vs soft delete — Hard delete allowed because holidays have no compliance/audit requirement.
- **ADR-005:** Covering indexes — Added INCLUDE columns for high-frequency queries (Q2, Q3, Q4, Q6) to achieve index-only scans.
- **ADR-006:** `institute_categories` as platform-global — No `institute_id` because categories are shared across tenants.

---

*Last updated: July 8, 2026*
