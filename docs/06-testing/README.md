# 06 Testing Strategy & QA Gates 🧪

Welcome to the **Testing Strategy & QA Gates** category. This section outlines our verification frameworks, testing guidelines, and security checkers.

## Current Testing Setup

### 1. Unit Testing

- Framework: Jest
- Location: Alongside source code (e.g. `*.spec.ts`)
- Script: `pnpm --filter api test` or `pnpm --filter web test`

### 2. Integration & End-to-End Testing

- Framework: Jest + Supertest
- Location: `apps/api/test/`
- Script: `pnpm --filter api test:e2e`
- Features: Utilizes mocked database (`PrismaService`) and cache (`RedisService`) providers to allow fast, headless test runs anywhere (including inside isolated CI environments).

---

## Upcoming QA Implementations

> [!NOTE]
>
> - **Unit Coverage Enforcement (Sprint 4)**: Enforcing a minimum of 80% coverage threshold gate in commits.
> - **Smoke Verification API (Sprint 5)**: Continuous health checker probes executing synthetic transactions in staging.
> - **Security Scanners (Sprint 5)**: Automated dependency CVE checks.

---

[⬅️ Back to Main Documentation Index](../README.md)
