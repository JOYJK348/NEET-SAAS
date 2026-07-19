# Sprint 0A — Workspace & Repository Foundation

> **Status:** ✅ Completed
> **Version:** v0.1
> **Primary Objective:** Establish the production-oriented monorepo, application boundaries, shared package structure, database foundation, development tooling, code quality gates, and CI pipeline required for all subsequent platform development.

---

## Goal

Establish the engineering foundation: pnpm + Turborepo monorepo with NestJS backend, Next.js frontend, Prisma database layer, shared packages, Husky git hooks, Conventional Commits, ESLint + Prettier, and GitHub Actions CI.

---

## Deliverables

| Deliverable                                        | Status  |
| :------------------------------------------------- | :-----: |
| Monorepo (pnpm + Turborepo) scaffold               | ✅ Done |
| NestJS backend application scaffold                | ✅ Done |
| Next.js App Router frontend scaffold               | ✅ Done |
| Prisma database package with Supabase PostgreSQL   | ✅ Done |
| Shared packages (config, types, ui, utils, shared) | ✅ Done |
| Environment-driven configuration foundation        | ✅ Done |
| ESLint + Prettier + TypeScript strict              | ✅ Done |
| Husky git hooks + lint-staged                      | ✅ Done |
| Conventional Commits with commitlint               | ✅ Done |
| GitHub Actions CI workflow                         | ✅ Done |
| Feature-branch development workflow                | ✅ Done |

---

## Commit History

| Date       | Commit    | Task | Description                                                                   |
| :--------- | :-------- | :--- | :---------------------------------------------------------------------------- |
| 2026-07-11 | `ec1d92a` | S0A  | scaffold(repo): pnpm monorepo with Turborepo, NestJS, Next.js, Prisma, shared |
| 2026-07-11 | `b69ba62` | S0A  | docker: Supabase PostgreSQL + Redis dev containers                            |
| 2026-07-11 | `559e3b6` | S0A  | docs: Changelog + add Git cliff config to project root                        |
| 2026-07-11 | `0a72112` | S0A  | config: TypeScript strict-mode, ESLint, Prettier, husky, commitlint           |
| 2026-07-11 | `6a0d7af` | S0A  | ci: GitHub Actions workflow — install, lint, typecheck, build                 |
| 2026-07-12 | `9b238c0` | S0A  | fix(ci): pnpm install frozen-lockfile → --no-frozen-lockfile                  |
| 2026-07-12 | `3f7eeeb` | S0A  | fix: eslint config curly rule, resolve lint-staged/tsc parse error            |
| 2026-07-12 | `7007ac9` | S0A  | fix(database): add supabase-js as dependency, import map/Set in shared        |
| 2026-07-12 | `08e9bb9` | S0A  | fix: remove root tsc dependency, redundant packages, env based dirs           |

---

## Repository Architecture

```
NEET_platform/
├── apps/
│   ├── api/              # NestJS backend
│   └── web/              # Next.js frontend
├── packages/
│   ├── database/         # Prisma schema + client
│   ├── shared/           # Cross-app constants
│   ├── config/           # Configuration
│   ├── types/            # Shared types
│   ├── ui/               # UI primitives
│   └── utils/            # Utilities
├── docs/                 # Architecture docs
├── .github/workflows/    # CI pipeline
└── package.json          # Workspace root
```

---

## Key Architecture Decisions

| Area            | Decision                |
| :-------------- | :---------------------- |
| Monorepo        | pnpm + Turborepo        |
| Backend         | NestJS                  |
| Frontend        | Next.js App Router      |
| Language        | TypeScript strict       |
| Database        | Supabase PostgreSQL     |
| ORM             | Prisma                  |
| Cache           | Redis (ready)           |
| Code Quality    | ESLint + Prettier + tsc |
| Git Hooks       | Husky + lint-staged     |
| Commit Standard | Conventional Commits    |
| CI              | GitHub Actions          |
| Branch Strategy | Feature → PR → develop  |

---

## Verification

| Check                                 | Result         |
| :------------------------------------ | :------------- |
| pnpm workspace installation           | ✅ Passed      |
| Turborepo task execution              | ✅ Passed      |
| API app compilation                   | ✅ Passed      |
| Web app compilation                   | ✅ Passed      |
| TypeScript validation                 | ✅ Passed      |
| ESLint validation                     | ✅ Passed      |
| Prettier validation                   | ✅ Passed      |
| Husky + commitlint configured         | ✅ Configured  |
| GitHub Actions CI workflow            | ✅ Configured  |
| Prisma + Supabase database foundation | ✅ Established |

---

## Related Documentation

- [Project Dashboard](../00-project-management/project-dashboard.md)
- [Implementation Matrix](../00-project-management/implementation-matrix.md)
- [Backend Foundation — Sprint 0B](./sprint-00b-backend-foundation.md)
- [Authentication & Identity — Sprint 1](./sprint-01-auth-identity.md)
- [People & Students — Sprint 2](./sprint-02-people-students.md)
- [Frontend Platform UI — Sprint 3](./sprint-03-frontend-platform-ui.md)
- [Master Data — Sprint 5](./sprint-05-master-data.md)
