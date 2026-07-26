# 02 System Architecture & Security 🏛️

Welcome to the **System Architecture & Security** category. This section outlines the core infrastructure patterns, data isolation techniques, security rules, and the complete register of 19 Architecture Decision Records (ADRs).

## Core Strategy Documents

- 🔑 **[auth-architecture.md](auth-architecture.md)** — JWT design, silent cookie refresh rotation, session states, and invalidations.
- 🔄 **[AUTH_FLOW.md](AUTH_FLOW.md)** — Detailed sequence diagram and parameters maps for OAuth/password authentication.
- 🛡️ **[multitenancy-strategy.md](multitenancy-strategy.md)** — Logical isolation scoping on `institute_id` with Row-Level Security (RLS) policies and prisma interceptors.
- 🏛️ **[database-access-strategy.md](database-access-strategy.md)** — Guidelines for type-safe database queries, writes, pagination, and Prisma client lifecycle hooks.
- 🗄️ **[partition-archive-strategy.md](partition-archive-strategy.md)** — Database table archiving schedules.
- 🧩 **[13-profile-system.md](13-profile-system.md)** — Generic profile config rules allowing multi-vertical adapters.
- 📦 **[14-shared-kernel.md](14-shared-kernel.md)** — Shared package definitions across backend/frontend layers.
- 📈 **[tech-stack.md](tech-stack.md)** — Rationale for selected languages, tools, frameworks, and deployment services.
- 📊 **[observability-operations.md](observability-operations.md)** — Structured structured logs config with Pino, async context, health checking probes, and telemetry monitors.

## ⚡ Architecture Decision Records (ADR Register)

We catalog all core decisions to prevent engineering drift:

- ⚡ **[ADR-001: Multi-Tenancy Strategy](adr/ADR-001-multi-tenancy.md)** — Tenant database partitions logic.
- ⚡ **[ADR-002: Soft Delete Strategy](adr/ADR-002-soft-delete-strategy.md)** — Database deleted state flags rules.
- ⚡ **[ADR-003: Event Driven Design](adr/ADR-003-event-driven-design.md)** — Microservice asynchronous event structures.
- ⚡ **[ADR-004: Snapshot Strategy](adr/ADR-004-snapshot-strategy.md)** — Relational historical cache.
- ⚡ **[ADR-005: Database Partitioning](adr/ADR-005-partitioning-strategy.md)** — Transactional tables partitioning logic.
- ⚡ **[ADR-006: Row Level Security (RLS)](adr/ADR-006-rls-strategy.md)** — Postgres RLS locks.
- ⚡ **[ADR-007: Asset Storage Management](adr/ADR-007-storage-strategy.md)** — Cloudflare R2 and Supabase RLS buckets boundaries.
- ⚡ **[ADR-008: Caching Architecture](adr/ADR-008-caching-strategy.md)** — Redis multi-tier invalidation pools.
- ⚡ **[ADR-009: Background Jobs Queue](adr/ADR-009-background-jobs.md)** — Priority job processors.
- ⚡ **[ADR-010: AI Integration Services](adr/ADR-010-ai-integration.md)** — Doubt solver pipelines.
- ⚡ **[ADR-011: Academic & LMS Isolation](adr/ADR-011-academic-lms-separation.md)** — Segregating curricula mappings from resource files.
- ⚡ **[ADR-012: Question Catalog Reuse](adr/ADR-012-question-bank-reuse.md)** — Standard question pool models.
- ⚡ **[ADR-013: LMS Domain Separation](adr/ADR-013-lms-domain-separation.md)** — Course-Subjects mappings.
- ⚡ **[ADR-014: Database Migration Strategy](adr/ADR-014-migration-strategy.md)** — Prisma deployments.
- ⚡ **[ADR-015: Concurrency & Idempotency](adr/ADR-015-concurrency-idempotency.md)** — Double-charge safety.
- ⚡ **[ADR-016: Backup & Recovery](adr/ADR-016-backup-recovery-dr.md)** — Failover policies.
- ⚡ **[ADR-017: Enums & Lookup Tables](adr/ADR-017-enum-lookup-evolution.md)** — Extensible code lookups.
- ⚡ **[ADR-018: Transaction Boundaries](adr/ADR-018-transaction-boundaries.md)** — Scope limits for DB lockups.
- ⚡ **[ADR-019: Observability Strategy](adr/ADR-019-observability-strategy.md)** — Pino logging structure.

---

[⬅️ Back to Main Documentation Index](../README.md)
