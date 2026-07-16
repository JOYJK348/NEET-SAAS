# Shared Kernel — Cross-Cutting Services

> **Status:** 🔒 FROZEN  
> **Date:** July 13, 2026  
> **Purpose:** Define the shared infrastructure services that every module depends on. No module duplicates these.

---

## 1. Shared Kernel Map

```
┌──────────────────────────────────────────────────┐
│                   Shared Kernel                    │
│                                                   │
│  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │
│  │ DateTime  │  │  Money   │  │    Tenant      │  │
│  │  Service  │  │  Service │  │   Context      │  │
│  └──────────┘  └──────────┘  └────────────────┘  │
│                                                   │
│  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │
│  │  Current  │  │  Audit   │  │   Permission   │  │
│  │   User    │  │  Service │  │   Checker      │  │
│  └──────────┘  └──────────┘  └────────────────┘  │
│                                                   │
│  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │
│  │  Number   │  │ Storage  │  │  Notification  │  │
│  │ Generator │  │ Service  │  │    Engine      │  │
│  └──────────┘  └──────────┘  └────────────────┘  │
│                                                   │
│  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │
│  │  File     │  │  Search  │  │   Scheduler    │  │
│  │ Versioning│  │ Service  │  │    Service     │  │
│  └──────────┘  └──────────┘  └────────────────┘  │
│                                                   │
│  ┌──────────────────────────────────────────┐     │
│  │           Event Bus (Domain Events)       │     │
│  └──────────────────────────────────────────┘     │
└──────────────────────────────────────────────────┘
```

Every module uses Shared Kernel. No module reimplements these.

---

## 2. Domain Events

### 2.1 Principle

Every important state change emits a domain event. Downstream systems (Notification, Analytics, Audit, AI) subscribe without coupling.

### 2.2 Event Catalog (V1)

#### People Domain

| Event                    | Payload                            | Consumers                          |
| ------------------------ | ---------------------------------- | ---------------------------------- |
| `learner.created`        | learner_id, tenant_id, name, email | Notification (welcome), Audit      |
| `learner.enrolled`       | learner_id, group_id, course_id    | Analytics, Billing (create record) |
| `learner.status_changed` | learner_id, old_status, new_status | Notification, Audit                |
| `instructor.created`     | instructor_id, tenant_id, name     | Notification, Audit                |
| `instructor.assigned`    | instructor_id, group_id, unit_id   | Analytics                          |

#### Academics Domain

| Event                    | Payload                           | Consumers                           |
| ------------------------ | --------------------------------- | ----------------------------------- |
| `learning_group.created` | group_id, name, course_id         | Analytics                           |
| `attendance.marked`      | session_id, learner_ids[], status | Analytics, Notification (if absent) |
| `leave.approved`         | leave_id, instructor_id           | Attendance                          |
| `content.uploaded`       | content_id, unit_id, type         | Analytics, Notification             |

#### Assessments Domain

| Event                  | Payload                    | Consumers               |
| ---------------------- | -------------------------- | ----------------------- |
| `assessment.created`   | assessment_id, group_ids[] | Notification, Calendar  |
| `assessment.attempted` | attempt_id, learner_id     | Analytics               |
| `assessment.evaluated` | attempt_id, score, status  | Notification            |
| `assessment.published` | assessment_id              | Notification, Analytics |

#### Billing Domain

| Event                       | Payload                                  | Consumers                         |
| --------------------------- | ---------------------------------------- | --------------------------------- |
| `billing_structure.created` | structure_id, course_id                  | —                                 |
| `payment.recorded`          | payment_id, learner_id, amount           | Notification (receipt), Analytics |
| `payment.receipt.generated` | receipt_id, payment_id                   | Notification                      |
| `installment.due_soon`      | installment_id, learner_id, days_left    | Notification                      |
| `installment.overdue`       | installment_id, learner_id, days_overdue | Notification                      |

#### Digital Resources Domain

| Event               | Payload                             | Consumers               |
| ------------------- | ----------------------------------- | ----------------------- |
| `product.purchased` | purchase_id, learner_id, product_id | Notification, Analytics |
| `product.published` | product_id                          | Notification            |

#### AI Domain

| Event                     | Payload                             | Consumers                 |
| ------------------------- | ----------------------------------- | ------------------------- |
| `ai.request.completed`    | request_id, capability, tokens_used | Analytics, Usage Tracking |
| `ai.daily_quota.exceeded` | tenant_id                           | Notification (admin)      |

#### Platform Domain

| Event                   | Payload              | Consumers                           |
| ----------------------- | -------------------- | ----------------------------------- |
| `tenant.created`        | tenant_id, profile   | Notification (welcome email), Audit |
| `tenant.suspended`      | tenant_id, reason    | Audit                               |
| `subscription.expiring` | tenant_id, days_left | Notification                        |
| `subscription.expired`  | tenant_id            | Platform Admin Alert                |

### 2.3 Implementation

- **Library:** NestJS EventEmitter (in-process) + BullMQ (cross-process for async)
- **Format:** `{ event_name, event_id, aggregate_id, tenant_id, timestamp, data, correlation_id }`
- **Correlation ID:** Propagated from HTTP request through all downstream consumers

---

## 3. Audit Service

### 3.1 Principle

Every data mutation (CREATE, UPDATE, DELETE) on business entities creates an audit log entry. Audits are **append-only** and **immutable**.

### 3.2 Audit Log Schema

```json
{
  "id": "uuid",
  "tenant_id": "uuid",
  "entity_type": "learner | assessment | payment | ...",
  "entity_id": "uuid",
  "action": "CREATE | UPDATE | DELETE | APPROVE | PUBLISH | REVERSE",
  "old_value": "jsonb (null for CREATE)",
  "new_value": "jsonb (null for DELETE)",
  "changed_fields": ["field1", "field2"],
  "performed_by": "uuid (user_id)",
  "performed_by_role": "TENANT_ADMIN | INSTRUCTOR",
  "ip_address": "inet",
  "user_agent": "text",
  "correlation_id": "uuid",
  "created_at": "timestamptz"
}
```

### 3.3 Rules

- Every NestJS service method that mutates data calls `auditService.log()`
- Financial mutations (payment, receipt, reversal) are **always** audited
- Audit logs cannot be updated or deleted (DB trigger enforcement)
- Retention: 7 years for financial, 3 years for operational
- Platform Admin can query audit logs per tenant

---

## 4. Soft Delete Policy

### 4.1 Rule

**Never SQL DELETE on business data.** Three categories:

| Category           | Tables                                          | Behavior                                                                  |
| ------------------ | ----------------------------------------------- | ------------------------------------------------------------------------- |
| **Master Data**    | learners, instructors, courses, learning_groups | Set `deleted_at`, `deleted_by`. Queries filter `WHERE deleted_at IS NULL` |
| **Financial Data** | payments, receipts, billing_structures          | **No delete at all.** Corrections via reversal transactions               |
| **Transient Data** | notifications, logs, sessions                   | Can be physically deleted by cleanup jobs after retention period          |

### 4.2 Unique Indexes with Soft Delete

```sql
-- Email uniqueness ignores soft-deleted records
CREATE UNIQUE INDEX uq_learners_tenant_email
    ON learners(tenant_id, email)
    WHERE deleted_at IS NULL;
```

---

## 5. Number Generator Service

### 5.1 Principle

Single service that generates all sequential, scoped identifiers. Atomic, gap-resistant.

### 5.2 Number Sequences (V1)

| Sequence        | Prefix  | Scope         | Example         | Used By             |
| --------------- | ------- | ------------- | --------------- | ------------------- |
| Learner ID      | `STU-`  | Tenant + Year | `STU-2026-0001` | Learner admission   |
| Receipt No      | `RCP-`  | Tenant + Year | `RCP-2026-0042` | Payment receipts    |
| Invoice No      | `INV-`  | Tenant        | `INV-00089`     | Future billing      |
| Assessment No   | `ASM-`  | Tenant        | `ASM-0045`      | Assessment creation |
| Enrollment No   | `ENR-`  | Tenant + Year | `ENR-2026-0123` | Learner enrollment  |
| Certificate No  | `CERT-` | Tenant        | `CERT-0012`     | Future certificates |
| Transaction Ref | `TXN-`  | Tenant        | `TXN-a81x92`    | Payment gateway     |

### 5.3 Database Table

```sql
CREATE TABLE number_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    sequence_key VARCHAR(50) NOT NULL,  -- e.g. "learner_id", "receipt_no"
    prefix VARCHAR(20) NOT NULL,
    year_prefix VARCHAR(10),            -- optional year scoping
    last_number INTEGER NOT NULL DEFAULT 0,
    padding INTEGER NOT NULL DEFAULT 4,
    UNIQUE(tenant_id, sequence_key, year_prefix)
);
```

### 5.4 Service Pattern

```
numberGenerator.next('learner_id', tenantId, '2026')
    → Atomic UPDATE ... RETURNING last_number
    → Format: "STU-2026-0001"
```

---

## 6. Storage Service

### 6.1 Principle

Abstract storage behind an interface. Currently R2. Future providers = config change, not code change.

### 6.2 Interface

```typescript
interface StorageProvider {
  upload(file: Buffer, path: string, options?: UploadOptions): Promise<UploadResult>;
  download(path: string): Promise<Buffer>;
  getSignedUrl(path: string, expiresIn: number): Promise<string>;
  delete(path: string): Promise<void>;
  copy(fromPath: string, toPath: string): Promise<void>;
  exists(path: string): Promise<boolean>;
}
```

### 6.3 Provider Configuration

| Provider            | V1          | Config                                 |
| ------------------- | ----------- | -------------------------------------- |
| Cloudflare R2       | ✅ Primary  | `STORAGE_PROVIDER=r2`, `R2_*` env vars |
| AWS S3              | 🔜 Future   | `STORAGE_PROVIDER=s3`                  |
| Azure Blob          | 🔜 Future   | `STORAGE_PROVIDER=azure`               |
| MinIO (Self-hosted) | 🔜 Future   | `STORAGE_PROVIDER=minio`               |
| Local FS            | 🔜 Dev only | `STORAGE_PROVIDER=local`               |

### 6.4 Path Convention

```
{tenant_id}/{entity_type}/{entity_id}/{filename}
Example: abc123/learning_content/xyz456/mechanics-ch5.pdf
```

---

## 7. Notification Engine

### 7.1 Principle

One notification request → multiple channel deliveries. Channel abstraction.

### 7.2 Architecture

```
Notification Request
    │
    ▼
Channel Router
    │
    ├── Email Provider (Resend / SMTP)
    ├── In-App Provider (DB notification)
    ├── SMS Provider (Twilio)     → V1.1
    ├── WhatsApp Provider (Twilio) → V1.1
    └── Webhook Provider          → V2
```

### 7.3 Channel Status

| Channel  | V1  | V1.1 | V2  |
| -------- | --- | ---- | --- |
| Email    | ✅  | ✅   | ✅  |
| In-App   | ✅  | ✅   | ✅  |
| SMS      | ❌  | ✅   | ✅  |
| WhatsApp | ❌  | ✅   | ✅  |
| Webhook  | ❌  | ❌   | ✅  |

### 7.4 Template Engine

- Templates stored in DB with variables: `{{learner_name}}`, `{{due_date}}`
- Per-channel rendering (HTML for email, text for SMS)
- Versioned (changes create new version, old notifications retain original)

---

## 8. Scheduler Service

### 8.1 Principle

All scheduled/background work goes through a central scheduler. No setTimeout, no cron in application code.

### 8.2 Job Catalog (V1)

| Job                                | Schedule                   | Purpose                                        |
| ---------------------------------- | -------------------------- | ---------------------------------------------- |
| `assessment.lock`                  | At assessment.end_time     | Auto-lock assessment, prevent further attempts |
| `assessment.auto_submit`           | At assessment.end_time     | Submit incomplete attempts                     |
| `notification.live_class_reminder` | 30 min before class        | Send remind to all enrolled                    |
| `notification.assessment_reminder` | 24 hours before assessment | Send reminder                                  |
| `notification.billing_due`         | 7, 3, 1 days before        | Fee due reminders                              |
| `notification.billing_overdue`     | 3, 7, 14 days after        | Overdue alerts                                 |
| `analytics.refresh`                | Daily (2 AM)               | Refresh summary tables                         |
| `session.cleanup`                  | Hourly                     | Expire old login sessions                      |
| `audit.archive`                    | Weekly                     | Archive audit logs > 3 years                   |

### 8.3 Job Lifecycle

```
Scheduled → Queued → Running → Completed
                              → Failed (retry 3x, then dead letter)
```

### 8.4 Technology

- **V1:** pg-boss (same DB, zero infra cost)
- **V2:** BullMQ + Redis (when scale demands)

---

## 9. Global Search

### 9.1 Principle

Single search endpoint that searches across all entities. Unified result format.

### 9.2 V1 Implementation

```text
GET /api/v1/search?q=ravi&types=learner,instructor,assessment
    ↓
PostgreSQL pg_trgm extension + GIN indexes
    ↓
Unified response:
{
  learners: [...],
  instructors: [...],
  assessments: [...],
  products: [...]
}
```

### 9.3 Searchable Entities (V1)

| Entity           | Fields Indexed                   |
| ---------------- | -------------------------------- |
| Learner          | name, email, phone, admission_no |
| Instructor       | name, email, phone               |
| Assessment       | title, subject                   |
| Learning Content | title, description               |
| Products         | title, type                      |
| Receipts         | receipt_no, learner_name         |
| Batches          | name, code                       |

### 9.4 V2 Upgrade Path

PostgreSQL full-text search → Meilisearch / Typesense → Elasticsearch (at scale)

---

## 10. File Versioning

### 10.1 Principle

Every file upload creates a version. No overwrites. Metadata tracks the chain.

### 10.2 Database Schema

```sql
CREATE TABLE file_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    file_id UUID NOT NULL,               -- logical file identifier
    version INTEGER NOT NULL DEFAULT 1,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    storage_path TEXT NOT NULL,            -- R2 path
    checksum VARCHAR(64) NOT NULL,         -- SHA-256
    uploaded_by UUID NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(file_id, version)
);
```

### 10.3 Version Rules (V1)

- No public versioning API in V1. Only metadata tracking.
- On upload of same filename → automatically versioned behind the scenes.
- Display always shows latest version.
- V2: Version history UI, rollback, compare.

---

## 11. API Versioning

### 11.1 Principle

API versioning from Day 1. Never break existing clients.

### 11.2 Strategy

```text
URL Prefix:  /api/v1/learners
Header:      Accept: application/vnd.cmp.v1+json
```

### 11.3 Version Lifecycle

| Phase      | Label           | Behavior                             |
| ---------- | --------------- | ------------------------------------ |
| Active     | v1              | Current. All new features            |
| Deprecated | v1 (deprecated) | Still works, returns `Sunset` header |
| Sunset     | —               | Returns 410 Gone                     |
| Removed    | —               | 404                                  |

### 11.4 Rules

- Breaking changes → new version (v2, v3)
- Non-breaking additions → same version
- Support minimum 2 versions simultaneously
- Deprecation notice must be sent 90 days before sunset

---

## 12. Tenant Onboarding (Async Flow)

### 12.1 Flow

```
Platform Admin submits Create Tenant
    ↓
API returns 202 Accepted (job_id)
    ↓
Background Job executes:
    1. INSERT institutes
    2. Seed Profile Config (NEET labels, rules, feature flags)
    3. Seed Default Permissions
    4. Create Tenant Admin User
    5. Generate Temporary Password
    6. Send Welcome Email
    7. Log to Audit
    ↓
Job completes → Tenant Active
```

### 12.2 Benefits

- No HTTP timeout during complex onboarding
- Retry on failure (idempotent steps)
- Audit trail of entire onboarding process
- Future: progress tracking in Platform Admin UI

---

## 13. AI Module Guardrails

### 13.1 Rate Limiting

| Limit                    | Scope | Window      |
| ------------------------ | ----- | ----------- |
| Max requests per learner | 100   | Per day     |
| Max requests per tenant  | 1000  | Per day     |
| Max tokens per request   | 4096  | Per request |

### 13.2 Cost Tracking

```sql
CREATE TABLE ai_daily_usage (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    date DATE NOT NULL,
    total_requests INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    total_cost DECIMAL(10,6) DEFAULT 0,
    UNIQUE(tenant_id, date)
);
```

### 13.3 Fallback Model

```json
{
  "primary_model": "gpt-4o",
  "fallback_model": "gpt-4o-mini",
  "fallback_trigger": "rate_limit | timeout | error",
  "max_retries": 2
}
```

### 13.4 Prompt Versioning

```sql
CREATE TABLE ai_prompts (
    id UUID PRIMARY KEY,
    capability VARCHAR(50) NOT NULL,   -- "doubt_solver", "mcq_explain"
    version INTEGER NOT NULL,
    system_prompt TEXT NOT NULL,
    parameters JSONB,                    -- temperature, max_tokens
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(capability, version)
);
```

---

## 14. Assessment Guardrails (V1)

### 14.1 Question Shuffle

- Questions are shuffled per learner attempt
- Options (A/B/C/D) shuffled per question per learner
- Shuffle seed = attempt_id (deterministic, reproducible)

### 14.2 Attempt Resume

- Auto-save every 30 seconds
- On reconnect → restore to last saved state
- Time remaining calculated from server, not client

### 14.3 Time Sync

- Server time is source of truth
- Client shows countdown from server
- Auto-submit when server time reaches end_time
- No reliance on client clock

---

## 15. Attendance Guardrails (V1)

### 15.1 Bulk Mark

- Select session, mark all learners at once
- Bulk status: PRESENT / ABSENT / LATE
- Individual override after bulk mark

### 15.2 Copy Previous Session

- Copy attendance from previous session of same group
- Manually adjust differences
- Saves time for recurring classes

### 15.3 Holiday Calendar

- Pre-defined holidays skip attendance marking
- Tenant Admin configures at start of academic year
- Working day validation: cannot mark on holiday/weekend unless override

---

## 16. Billing Guardrails (V1)

### 16.1 Ledger Entry Pattern

```
Every payment creates:
  1. Payment Record (id, amount, mode, date)
  2. Ledger Entry (debit: Cash/Bank, credit: Fee Receivable)
  3. Receipt (immutable, printable)
```

### 16.2 Transaction Reference

- Every payment has a unique transaction reference
- Manual payments: auto-generated `TXN-{tenant}-{seq}`
- Online payments: gateway transaction ID

### 16.3 Payment Reversal

```
Cannot DELETE payment. Only REVERSE:
  1. Create reversal record (references original payment_id)
  2. Create reverse ledger entry
  3. New receipt marked as "REVERSAL"
  4. Original receipt remains unchanged
```

### 16.4 Receipt Lock

- Receipts are locked 24 hours after generation
- Locked receipts cannot be reversed without Platform Admin approval
- Visual indicator: "LOCKED" watermark on PDF

---

> **This document freezes the Shared Kernel and all cross-cutting concerns.**  
> Every module below depends on these services. No exceptions.
