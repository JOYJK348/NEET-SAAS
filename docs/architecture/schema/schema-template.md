# 📋 Schema Document Template — Standard Structure (v3.1)

> **Purpose:** Every schema file (01–11) MUST follow this exact template.  
> **Rule:** No section should be skipped. If not applicable, write "N/A" with reason.  
> **Philosophy:** Business → Screen → Query → Performance → Table → Index → Cache → Events → Observability → Prisma  
> **Version:** 3.1  
> **Last Reviewed By:** [Reviewer] — [Date]

---

## How To Use This Template

1. Copy this template for each new schema file.
2. Fill sections **in strict order** — do NOT jump to Entity Design before completing Query Patterns.
3. Every decision must trace back to a business reason.
4. Reference ADR decisions from `docs/03-decisions.md` wherever a major design choice is made.

---

# [Domain Name] Database Schema

> **Domain:** [Domain Name]  
> **Owner Team:** [Team Name] (e.g., Platform Team, Academic Team, Billing Team)  
> **Database:** PostgreSQL (Supabase)  
> **Schema Version:** 1.0  
> **Status:** 🟡 Draft / 🟢 Decided & Locked  
> **Parent ERD:** `docs/architecture/erd/[XX-domain].md`  
> **Last Reviewed By:** [Name] — [Date]

---

## 1. Overview

**Purpose:** What does this domain manage? One paragraph, business language only.

**Contains:**
- Entity A
- Entity B

**Domain Type:** 🧊 Cold / 🟡 Warm / 🔥 Hot

---

## 2. Business Scope

### ✅ Included
- List every entity that belongs to this domain

### ❌ Excluded
- List entities that might seem related but belong to other domains
- Explain why they are excluded

---

## 3. Lifecycle & State Machines

> Define valid states and allowed transitions for every entity that has a status field.
> This prevents invalid state transitions at both API and database level.

### Entity A — State Machine

```text
[State A] → [State B] → [State C]
```

**Allowed Transitions:**

| From | To | Trigger | Who Can Trigger |
|---|---|---|---|
| State A | State B | Action X | Role Y |

**Forbidden Transitions:**
- State C → State A (reason)

---

## 4. Usage Pattern & Access Matrix

### 4.1 Access Pattern (Read/Write Ratio)

| Entity | Read % | Write % | Update % | Delete % | Pattern | Owner Team |
|---|---|---|---|---|---|---|
| Entity A | 95% | 2% | 3% | 0% | Read-heavy | Platform Team |

### 4.2 CRUD Authorization Matrix

| Entity | Create | Read | Update | Delete/Deactivate |
|---|---|---|---|---|
| Entity A | Platform Admin | Everyone | Tenant Admin | Nobody |

### 4.3 API Dependency Map

| Entity | Used By Modules | Upstream Dependencies | Downstream Dependents |
|---|---|---|---|
| Entity A | Auth, Dashboard | None (root entity) | User, Academic, Student |

---

## 5. Growth Forecast & Capacity Planning

### 5.1 Row Count Projection (3 Years)

| Entity | Year 1 | Year 3 | Growth Pattern |
|---|---|---|---|
| Entity A | X rows | Y rows | Linear / Exponential / Stable |

### 5.2 Row Size Estimation

| Entity | Approx Row Size | Year 1 Total | Year 3 Total | Partition? |
|---|---|---|---|---|
| Entity A | ~400 bytes | ~400 KB | ~4 MB | No |

### 5.3 Write TPS (Peak Load)

| Entity | Normal TPS | Peak Scenario | Peak TPS | Peak Reads/sec |
|---|---|---|---|---|
| Entity A | < 1 | Onboarding wave | 5 | 200 |
| Entity B | 2 | Admissions day | 50 | 500 |

---

## 6. Performance Budget

> Define latency SLAs per query. Measured at application layer (not raw DB).

| Query | P50 | P95 | P99 | Cold Start | Notes |
|---|---|---|---|---|---|
| Query 1 — Name | < 5ms | < 20ms | < 50ms | < 200ms | Cached after first hit |
| Query 2 — Name | < 10ms | < 40ms | < 100ms | < 300ms | Index scan |

**Domain SLA:**
- Availability: 99.9%
- Recovery Time Objective (RTO): [X minutes]
- Recovery Point Objective (RPO): [X minutes]

---

## 7. Query Patterns ⭐

> **MOST IMPORTANT SECTION.** Think from UI screens, not from SQL.
> No SQL syntax. Business language only.

### Query [N] — [Descriptive Name]

| Property | Value |
|---|---|
| **Screen** | [Which UI screen triggers this] |
| **Purpose** | [What the user is trying to accomplish] |
| **Input** | [Parameters] |
| **Output** | [What fields are returned] |
| **Cardinality** | [1:1 lookup / 1:N list / N:N join / Aggregate] |
| **Pagination** | [None / Offset / Cursor / Keyset] |
| **Frequency** | [Every request / Per login / Rare] |
| **Expected Rows** | [1 / 2-5 / 10-50 / 100+] |
| **Latency Target** | [P95 target from Section 6] |
| **Cache?** | [Yes — Redis 1hr / No — real-time] |
| **Index Used** | [Index name from Section 12] |

---

## 8. Enum Definitions

> Centralized enum definitions used across this domain.
> Prevents hardcoded magic strings. Maps to Prisma `enum` types.

### `EnumName`

| Value | Description | Notes |
|---|---|---|
| `VALUE_A` | Description | Default / Terminal / etc. |
| `VALUE_B` | Description | |

---

## 9. Entity Design

> Only now — after queries are clear — define the tables.
> No Prisma syntax. No raw SQL.

### 9.1 `table_name`

**Purpose:** One-line description.

#### Columns

| Column | Type | Nullable | Default | Business Purpose |
|---|---|---|---|---|
| `id` | UUID | No | `gen_random_uuid()` | Primary Key |

#### Business Rules
- Rule 1
- Rule 2

#### Validation Rules

| Column | Enforcement | Rule | Example |
|---|---|---|---|
| `email` | Application (regex) | RFC 5322 format | `admin@academy.com` |
| `code` | Database (CHECK) | Uppercase, 3-50 chars | `APEX` |
| `phone` | Application (library) | E.164 format | `+919876543210` |
| `status` | Database (ENUM) | Allowed values only | `ACTIVE` |

> **Enforcement types:** Database (CHECK, ENUM, NOT NULL) / Application (regex, library) / External API (email verification, phone OTP)

---

## 10. Foreign Keys

> Detailed FK specification per table.

### `table_name` Foreign Keys

| FK Column | References | On Delete | On Update | Indexed? | Tenant Scoped? | Deferrable? |
|---|---|---|---|---|---|---|
| `institute_id` | `institutes.id` | Restrict | Cascade | Yes | Yes | No (Immediate) |

> **Deferrable:** Set to `INITIALLY DEFERRED` only for bulk data migration scenarios. Default is `INITIALLY IMMEDIATE` for runtime safety.

---

## 11. Constraints

> Classify by enforcement level.

### Database-Enforced Constraints

| Constraint Name | Type | Table | Columns | Business Rule |
|---|---|---|---|---|
| `uq_xxx_code` | Unique | table | `(code)` | Globally unique |
| `chk_xxx_dates` | Check | table | `start < end` | Date ordering |

### Application-Enforced Constraints

| Rule | Table | Logic | Reason Not in DB |
|---|---|---|---|
| Only 1 active year per institute | `academic_years` | Service layer transaction | Requires deactivate + activate atomically |

### Distributed Constraints

| Rule | Table | External System | Enforcement |
|---|---|---|---|
| Payment verified | `subscriptions` | Payment Gateway webhook | Eventual consistency |

---

## 12. Index Strategy

> Every index MUST reference which query from Section 7 it supports.

| Index Name | Table | Columns | Include (Covering) | Supports Query | Type | Justification |
|---|---|---|---|---|---|---|
| `idx_xxx` | table | `(col_a, col_b)` | `(name, code)` | Query N | B-tree | Index-only scan for dashboard |

**Index Budget:** X indexes total (Cold ≤ 2/table, Warm 3-6/table, Hot ≤ 3/table)

---

## 13. Cache Strategy & Failure Handling

### 13.1 Cache Plan

| Entity | Cache Location | Source of Truth | TTL | Key Pattern | Invalidation Trigger |
|---|---|---|---|---|---|
| Entity A | Redis | PostgreSQL | 1 hr | `entity:{id}` | On create/update API |
| Entity B | In-Memory | PostgreSQL | Until restart | N/A | N/A |

### 13.2 Cache Failure Strategy

| Scenario | Behavior | Recovery |
|---|---|---|
| Redis unavailable | Fallback to direct DB query | Circuit breaker (30s timeout, 3 retries) |
| Cache miss | Fetch from DB, populate cache | Automatic on read |
| Stale cache after crash | TTL-based self-heal | No manual intervention |
| Cache + DB mismatch | DB is always source of truth | Cache invalidation on next write |

---

## 14. Transaction Boundaries

> Define multi-table transactions that MUST be atomic.

### Transaction [N] — [Name]

**Trigger:** [What action initiates this transaction]

**Steps (in order):**
1. Step 1 — Table A update
2. Step 2 — Table B insert
3. Step 3 — Cache invalidation
4. Step 4 — Publish domain event

**Tables Involved:** Table A, Table B  
**Isolation Level:** `READ COMMITTED` (PostgreSQL default) / `SERIALIZABLE`  
**Rollback Strategy:** [What happens on failure]  
**Performance Impact:** [Estimated lock duration]

---

## 15. Consistency Model

> For every cross-entity operation, define: Strong / Eventual / Async.

| Operation | Consistency | Mechanism | Staleness Window |
|---|---|---|---|
| Branch create → Dashboard update | Strong | Same transaction | None |
| Holiday create → Timetable update | Eventual (Async) | Domain event → queue | 5-30 seconds |
| Subscription expire → Institute suspend | Strong | Cron job transaction | None (batch, runs hourly) |

---

## 16. Domain Events

> Business events published by this domain. Other domains subscribe to these.
> These events also feed the monitoring & observability layer.

### Events Published

| Event Name | Trigger | Payload | Consumers |
|---|---|---|---|
| `EntityCreated` | After create | `{ id, name, ... }` | Module A, Module B |
| `EntityUpdated` | After update | `{ id, changes }` | Module C |

### Events Consumed

| Event Name | Source Domain | Handler | Side Effect |
|---|---|---|---|
| `PaymentCompleted` | Billing | `SubscriptionService.activate()` | Activate subscription |

---

## 17. Cross-Domain Contracts

> Define what this domain exports to and imports from other domains.
> This is the API contract between bounded contexts.

### Exports (This Domain → Others)

| Consumer Domain | Data Provided | Access Method | Freshness |
|---|---|---|---|
| User Domain | Institute ID, Name, Status | FK lookup / Cache | Real-time |
| Academic Domain | Branch ID, Academic Year ID | FK lookup / Cache | Cached (15 min) |

### Imports (Other Domains → This)

| Provider Domain | Data Consumed | Access Method | Freshness |
|---|---|---|---|
| Billing Domain | Payment status | Webhook event | Eventual |

---

## 18. Audit Strategy

> Define what is audited and how.

### Audit Columns (Built-in)

| Column | Purpose | Auto-populated? |
|---|---|---|
| `created_at` | When record was created | Yes (DB default) |
| `updated_at` | When record was last modified | Yes (DB trigger / Prisma) |
| `created_by` | Who created | Yes (from JWT in middleware) |
| `updated_by` | Who last modified | Yes (from JWT in middleware) |

### Audit Log (External — System Domain)

| Entity | Auditable Actions | Before/After Stored? | Retention |
|---|---|---|---|
| Entity A | Create, Update, Deactivate | Yes (JSONB diff) | 2 years |
| Entity B | Create, Delete | No (low-value entity) | 1 year |

> Full audit log implementation lives in System Domain (`11-system.md`). Each domain only declares WHAT is auditable.

---

## 19. Security Notes

- RLS policies
- Tenant isolation
- PII columns
- Immutable fields
- Sensitive data handling

---

## 20. Future Scalability & Migration

### 20.1 Scalability Thresholds

| Trigger (Exact Threshold) | Action | Priority |
|---|---|---|
| When entity exceeds X,000 rows | Action Y | Phase Z |

### 20.2 Migration Roadmap

| Phase | Change | Reason | Impact |
|---|---|---|---|
| Phase 2 | Add column X | Reason | Low / Medium / High |

---

## 21. Domain Observability

> **Lightweight** domain-specific hooks only. Full observability architecture lives in  
> `docs/architecture/observability-operations.md`.

### 21.1 Key Metrics (Domain-Specific)

| Metric | Type | Alert Threshold | Dashboard |
|---|---|---|---|
| Example: Active subscriptions count | Gauge | < 1 (critical) | Grafana: Business |

### 21.2 Domain-Specific Alerts

| Alert | Condition | Severity |
|---|---|---|
| Example: Subscription cron failure | Any failure | 🔴 Critical |

### 21.3 Business Events for Monitoring

> These events feed the observability layer. Listed in detail in Section 16 (Domain Events).

| Event | Log Level | Monitored? |
|---|---|---|
| `EntityCreated` | INFO | Yes — dashboard counter |
| `EntitySuspended` | WARN | Yes — alert if spike |

---

## Appendix: Domain Notes

> Trade-offs, architectural decisions, naming conventions, references.

### Naming Conventions (Global)
- Tables: `snake_case`, plural (`institutes`, `branches`)
- PKs: `id` (UUID)
- FKs: `{referenced_table_singular}_id` (e.g., `institute_id`)
- Timestamps: `created_at`, `updated_at` (TIMESTAMPTZ)
- Status: Named enums (not magic strings)
- Indexes: `idx_{table}_{columns}`
- Unique: `uq_{table}_{columns}`
- Check: `chk_{table}_{rule}`

### Decision Log
- Reference relevant ADR entries from `docs/03-decisions.md`

---

*Template Version: 3.0 — Last updated: July 8, 2026*
