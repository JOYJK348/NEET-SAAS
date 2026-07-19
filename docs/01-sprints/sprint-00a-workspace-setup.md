# Sprint 0A — Workspace Setup

> **Status:** ✅ Completed
> **Duration:** 3 days
> **Version:** v0.1

---

## Goal

Initialize the monorepo workspace with Turborepo orchestration, scaffold `apps/api` (NestJS) and `apps/web` (Next.js), configure Docker Compose for local Postgres + Redis, and set up CI/CD pipeline.

---

## Deliverables

| Deliverable                                                                                                                                | Status  |
| :----------------------------------------------------------------------------------------------------------------------------------------- | :-----: |
| pnpm workspace with Turborepo cache                                                                                                        | ✅ Done |
| NestJS scaffold in `apps/api`                                                                                                              | ✅ Done |
| Next.js scaffold in `apps/web`                                                                                                             | ✅ Done |
| Docker Compose (Postgres + Redis)                                                                                                          | ✅ Done |
| GitHub Actions CI pipeline                                                                                                                 | ✅ Done |
| Shared packages scaffolding (`packages/database`, `packages/shared`, `packages/config`, `packages/types`, `packages/ui`, `packages/utils`) | ✅ Done |

---

## Commit History

| Date       | Commit    | Description                                          |
| :--------- | :-------- | :--------------------------------------------------- |
| 2026-07-13 | `de7cf6e` | Initialize monorepo                                  |
| 2026-07-13 | `7dbdecb` | Scaffold apps and packages workspaces                |
| 2026-07-13 | `e439442` | Scaffold NestJS API & Next.js app routers            |
| 2026-07-13 | `f8a2f1a` | Add local Docker Compose & CI workflows pipeline     |
| 2026-07-13 | `579477b` | Relocate database layer & expand folders structure   |
| 2026-07-13 | `270a086` | Add common, config, and shared directory structures  |
| 2026-07-13 | `6f053a0` | Fix floating promise TypeScript warning on bootstrap |
| 2026-07-13 | `305d29f` | Relocate SQL models inside packages/database/sql     |
| 2026-07-14 | `e86b655` | Sprint 0A final implementation tracking updates      |

---

## Key Decisions

| Decision           | Choice              | Rationale                                                       |
| :----------------- | :------------------ | :-------------------------------------------------------------- |
| Package manager    | pnpm                | Native monorepo support, strict dependency isolation            |
| Build orchestrator | Turborepo           | Parallel task execution, caching, dependency graph              |
| Backend framework  | NestJS              | Modular architecture, dependency injection, guards/interceptors |
| Frontend framework | Next.js App Router  | React server components, file-based routing, middleware         |
| Database           | PostgreSQL + Prisma | Type-safe queries, migrations, multi-tenant via RLS             |
| Cache              | Redis (ioredis)     | Fast session store, rate limiting, job queues                   |
| Containerization   | Docker Compose      | Local development parity with production                        |

---

## Verification

| Check             | Result                                 |
| :---------------- | :------------------------------------- |
| `pnpm install`    | ✅ Resolves all workspaces             |
| `pnpm build`      | ✅ Compiles all packages               |
| `pnpm dev`        | ✅ Starts api + web concurrently       |
| Docker Compose up | ✅ Postgres + Redis containers healthy |
| GitHub Actions CI | ✅ Pipeline triggers on push/PR        |
