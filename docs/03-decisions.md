# Architecture Decisions

This document is the central index of all architectural decisions made for the Coaching Management Platform.

For each decision, the status, date, and a link to the detailed decision document is recorded.

---

## Decision Index

| # | Decision | Status | Date | Document |
|---|----------|--------|------|-----------|
| 01 | Authentication Architecture | ✅ Decided | July 8, 2026 | See below — **Supabase Auth + JWT** |
| 02 | Multi-Tenancy Isolation Strategy | ✅ Decided | July 8, 2026 | [multitenancy-strategy.md](architecture/multitenancy-strategy.md) |
| 03 | ORM Selection | ✅ Decided | July 8, 2026 | See below — **Prisma** |
| 04 | Email Provider | ⏳ Pending | — | — |
| 05 | Background Job Queue | ✅ Decided | July 8, 2026 | See below — **pg-boss** |
| 06 | Caching Strategy | ✅ Decided | July 8, 2026 | See below — **In-memory (NestJS) + Redis** |
| 07 | File Storage Strategy | ✅ Decided | July 8, 2026 | See below — **Supabase Storage + Cloudflare R2** |
| 08 | Live Class Provider | ✅ Decided | July 6, 2026 | See below — **Jitsi Meet (Self-hosted)** |
| 09 | Host Infrastructure | ✅ Decided | July 8, 2026 | See below — **Railway + Vercel** |
| 10 | Database Provider | ✅ Decided | July 8, 2026 | See below — **Supabase Postgres** |

---

## Decision 01 — Authentication Architecture

**Status:** ✅ Decided
**Date:** July 8, 2026

**Decision:** **Supabase Auth + JWT**

**Summary of choices made:**
- Strategy: **JWT + Supabase Auth management**
- Refresh Token Rotation: Managed natively by Supabase Auth Client
- Tenant isolation: `institute_id` injected into custom JWT claims on login
- Session scope: Handled via safe httpOnly cookie rotation rules in backend middleware
- Role scoping: RBAC constraints mapped at Next.js layout level and NestJS service routes.

---

## Decision 02 — Multi-Tenancy Isolation Strategy

**Status:** ✅ Decided
**Date:** July 8, 2026

**Summary of choices made:**

- Strategy: **Row-Level Isolation** (single schema, `institute_id` on every tenant table)
- Rejected: Schema-per-tenant (Prisma incompatible, Railway pgBouncer breaks `SET search_path`)
- Rejected: Database-per-tenant (excessive cost and ops complexity at our scale)
- Safety: **3-layer defense** — Prisma middleware (auto-inject) + PostgreSQL RLS + Integration tests
- Column standard: `institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE RESTRICT`
- Index standard: Compound index `(institute_id, id)` on every tenant table — `institute_id` always leftmost
- Email uniqueness: Per-institute `@@unique([institute_id, email])` — NOT global
- Platform Admin: Skips institute_id scoping via separate `PLATFORM_ADMIN` guard
- Tenant deletion: Soft-delete only in Phase 1

**Full document:** [multitenancy-strategy.md](architecture/multitenancy-strategy.md)

**What this unblocks:**
- Every table's `institute_id` column and index pattern is now defined
- `schema.prisma` file can be started
- NestJS service patterns are defined (every method receives `instituteId` from context)
- Confirms Prisma as the correct ORM (schema-per-tenant would have required raw SQL)
- Sprint 1 database migration can be written

---

## Decision 03 — ORM Selection

**Status:** ✅ Decided
**Date:** July 8, 2026

**Decision:** **Prisma**

**Rationale:**

- Prisma's **schema-first approach** (`schema.prisma`) gives a single source of truth for the entire data model — critical when 9 domains are being defined simultaneously.
- **Type-safe query client** auto-generated from the schema eliminates a full class of runtime errors that TypeORM's decorator model is prone to.
- **Prisma Migrate** produces clean, reviewable SQL migration files. TypeORM migrations are often auto-generated noise that developers don't read.
- **Prisma Client middleware** is the correct mechanism for implementing the `institute_id` auto-injection strategy defined in Decision 02. TypeORM interceptors would require significantly more boilerplate.
- Schema-per-tenant (which would have required raw SQL) was explicitly rejected in Decision 02 — this aligns perfectly with Prisma's row-level model.

**Rejected: TypeORM**
- Decorator-based metadata makes the schema scattered across multiple entity files — harder to review for a 9-domain system.
- TypeORM's `Relations` decorator syntax makes compound index definitions (`(institute_id, id)`) harder to express cleanly.
- Less predictable migration generation for complex schema evolutions.

**What this unblocks:**
- `schema.prisma` file can now be created
- `PrismaService` and middleware can be implemented in Sprint 1
- All NestJS service patterns are unblocked

---

## Decision 04 — Email Provider

**Status:** ⏳ Pending

**Required for:**
- Welcome email (Tenant Admin creation)
- Password reset email
- Fee payment receipt (future)
- Fee reminder notifications (future)

**Options:**
- **Resend** — Developer-friendly, simple API, good free tier
- **SendGrid** — Industry standard, higher free tier
- **Nodemailer + SMTP** — No vendor dependency, but no analytics

---

## Decision 05 — Background Job Queue

**Status:** ✅ Decided
**Date:** July 8, 2026

**Decision:** **pg-boss (Phase 1)**

**Required for:**
- Fee reminder notifications (installment due date triggers)
- Email delivery (async, non-blocking)
- Report generation (heavy DB aggregation queries)
- Notification dispatch (student/parent/tutor events)

**Rationale:**
- Phase 1 runs on a **single Railway PostgreSQL instance** that is already paid for. pg-boss uses the same DB — zero additional infrastructure cost.
- BullMQ requires a Redis add-on on Railway (~$15–25/month for persistent Redis). Unjustified at Phase 1 scale.
- pg-boss provides **persistent job records** in PostgreSQL with retry logic, dead-letter queue, and job scheduling — all the Phase 1 requirements are covered.
- pg-boss jobs survive server restarts (unlike in-memory BullMQ without Redis persistence).
- Migration path to BullMQ + Redis is clean when scale demands it — the job producer/consumer interfaces are similar enough to refactor without business logic changes.

**Rejected: BullMQ (for Phase 1)**
- Requires Redis add-on (extra infra cost and operational complexity).
- Over-engineered for Phase 1's expected queue volume (< 10K jobs/day).

**What this unblocks:**
- Fee reminder scheduler can be designed
- Email delivery service (async) can be implemented
- Report generation endpoint can be implemented without blocking HTTP request

---

## Decision 06 — Caching Strategy

**Status:** ✅ Decided
**Date:** July 8, 2026

**Decision:** **In-memory cache (NestJS Map) for Phase 1**

**Required for:**
- Role → Permissions map (loaded at startup, cached in memory)
- Institute settings (frequently read, rarely changed)
- Dashboard summary counts

**Rationale:**
- Phase 1 runs as a **single NestJS instance** on Railway. There is no multi-instance deployment requiring a shared cache layer.
- In-memory cache using a `Map<string, T>` inside a NestJS provider is zero-cost, zero-infra, and zero-latency.
- The two primary cache targets (role→permissions map, institute settings) are **read-heavy, write-rare** — ideal for startup-loaded in-memory cache.
- Cache invalidation is simple and predictable: role changes → restart or in-process cache refresh event; institute settings changes → invalidate by `institute_id` key.

**Cache Invalidation Rules (must be implemented):**

| Cache Key | Updated When | Invalidation Method |
|---|---|---|
| `role:permissions:{role}` | Role permissions are modified | Clear that role's cache key in-process |
| `institute:settings:{id}` | Tenant Admin updates settings | Clear that institute's key in-process |
| All keys | Server restart | Auto-reloaded on next request |

**⚠️ Security Note:** Stale role→permissions cache must NOT persist beyond the server request cycle after a permission change. Implement a NestJS `EventEmitter` event on role update that clears the in-process cache immediately.

**Rejected: Redis (for Phase 1)**
- Requires Redis add-on (additional Railway cost).
- Shared cache across instances is not needed when running a single instance.
- Can be added in Phase 2 if horizontal scaling is required.

**What this unblocks:**
- `RolePermissionsCache` NestJS provider can be implemented
- `InstituteSettingsCache` can be implemented
- Guards and interceptors can use cached permissions without DB hits

---

## Decision 07 — File Storage Strategy

**Status:** ✅ Decided
**Date:** July 8, 2026

**Decision:** **Supabase Storage + Cloudflare R2**

**Rationale:**
- **Supabase Storage:** Used for transactional documents (student documents, study material PDFs) requiring tight integration with Postgres row-level security (RLS).
- **Cloudflare R2:** Used for large video files (live class recordings). R2 has **zero egress fees**, which saves significant bandwidth cost (₹1.25/GB storage pricing only).

---

## Decision 08 — Live Class Provider

**Status:** ✅ Decided
**Date:** July 6, 2026

**Decision:** **Jitsi Meet (Self-hosted on DigitalOcean Droplet)**

**Rationale:**
- Full control of stream data and recording layout.
- Cost-effective scaling (~₹1,500/mo flat-rate virtual machine CPU) without session-minute charges.
- Integrates with local FFmpeg transcoding processes.

---

## Decision 09 — Host Infrastructure

**Status:** ✅ Decided
**Date:** July 8, 2026

**Decision:** **Railway (NestJS Backend) + Vercel (Next.js Frontend)**

**Rationale:**
- **Vercel:** Auto-deploy, optimized Next.js App Router caching, edge API routes, fast global CDN.
- **Railway:** Auto-deploy on git push, auto-scale containers, simple ENV management, cost-effective (₹500/mo flat rate pricing models for early workloads).

---

## Decision 10 — Database Provider

**Status:** ✅ Decided
**Date:** July 8, 2026

**Decision:** **Supabase Managed PostgreSQL**

**Rationale:**
- High performance PostgreSQL database with built-in connection pooler (PgBouncer/Supavisor).
- Integrates with Supabase Auth and Supabase Storage under a single management system.
- Supports native PostgreSQL RLS and migrations schema control via Prisma.

---

*Last updated: July 8, 2026 — This document is updated as decisions are made. All decisions must be documented here before implementation begins.*
