# Sprint 01 — Authentication & Identity Backend

> **Status:** ✅ Completed
> **Version:** v1.0
> **Primary Application:** `apps/api`

---

## Goal

Implement the complete authentication and authorization backend: JWT asymmetric authentication (RS256), refresh token rotation with HttpOnly cookies, RBAC guard pipeline (role + permission checks), Prisma auth schema, idempotent seeder, Swagger documentation, and integration test suite.

---

## Deliverables

| Deliverable                                              | Status  |
| :------------------------------------------------------- | :-----: |
| Prisma auth schema (users, roles, permissions, sessions) | ✅ Done |
| JWT authentication infrastructure (RS256)                | ✅ Done |
| Login service with credential validation                 | ✅ Done |
| Refresh token rotation with HttpOnly cookies             | ✅ Done |
| Session management and invalidation                      | ✅ Done |
| RBAC guard pipeline (role + permission checks)           | ✅ Done |
| Role/permission seeder with demo data                    | ✅ Done |
| Swagger documentation for all auth endpoints             | ✅ Done |
| Integration test suite for auth flows                    | ✅ Done |
| PR #1 merge into develop                                 | ✅ Done |

---

## Commit History

| Date       | Commit    | Task   | Description                                                                |
| :--------- | :-------- | :----- | :------------------------------------------------------------------------- |
| 2026-07-15 | `4ed2e4e` | S1-002 | Prisma auth foundation schema (users, roles, permissions, sessions tables) |
| 2026-07-15 | `c62d728` | S1-003 | JWT authentication infrastructure (RS256 signing, verification)            |
| 2026-07-15 | `dfa7fa0` | S1-004 | Login service with email/password validation                               |
| 2026-07-15 | `f1d3996` | —      | Move ESLint to root devDependencies for lint-staged                        |
| 2026-07-15 | `aacce42` | S1-005 | Refresh token rotation and session management                              |
| 2026-07-15 | `a04df44` | S1-006 | RBAC guard pipeline (role + permission decorators)                         |
| 2026-07-15 | `a97c7c3` | S1-007 | RBAC seeder with default roles, permissions, and demo data                 |
| 2026-07-15 | `34fa6cb` | —      | Try-create pattern for idempotent seeding                                  |
| 2026-07-15 | `76aa160` | —      | Add bcrypt rounds env var for configurable hash                            |
| 2026-07-15 | `584bc77` | S1-008 | Swagger documentation for all auth endpoints                               |
| 2026-07-15 | `0dd1708` | S1-009 | Integration test suite for auth flows                                      |
| 2026-07-15 | `993f666` | —      | Fix env loading and suppress Redis errors in dev                           |
| 2026-07-15 | `50ac3f5` | —      | Merge PR #1: feature/auth into develop                                     |

---

## API Endpoints Built

| Method | Path                        | Description                                                         |
| :----- | :-------------------------- | :------------------------------------------------------------------ |
| POST   | `/api/v1/auth/login`        | Authenticate with email + password, returns access + refresh tokens |
| POST   | `/api/v1/auth/logout`       | Invalidate current session                                          |
| POST   | `/api/v1/auth/refresh`      | Rotate refresh token, return new access token                       |
| POST   | `/api/v1/auth/mfa/setup`    | Configure MFA (future)                                              |
| POST   | `/api/v1/auth/mfa/verify`   | Verify MFA code (future)                                            |
| GET    | `/api/v1/auth/sessions`     | List active sessions                                                |
| DELETE | `/api/v1/auth/sessions/:id` | Invalidate specific session                                         |

---

## Auth Architecture

```
Client → POST /auth/login
  → Validate credentials (bcrypt)
  → Generate access token (RS256, 15min)
  → Generate refresh token (RS256, 7days)
  → Store session in DB
  → Return access token in body + refresh token in HttpOnly cookie

Client → POST /auth/refresh
  → Read HttpOnly cookie
  → Verify refresh token signature
  → Rotate: invalidate old, create new
  → Return new access token

Request → AuthGuard
  → Extract Bearer token
  → Verify RS256 signature
  → Load user + roles + permissions
  → Attach to RequestContext

Route → RolesGuard / PermissionsGuard
  → Check required roles/permissions
  → Allow/deny based on RBAC matrix
```

### Identity Data Model

```
User
 ├── Sessions (persisted, revocable)
 ├── User Roles → Roles → Role Permissions → Permissions
 └── Authentication (bcrypt hash, RS256 tokens)
```

---

## Key Architecture Decisions

| Area             | Decision                | Rationale                            |
| :--------------- | :---------------------- | :----------------------------------- |
| JWT Algorithm    | RS256 (asymmetric)      | Private signing, public verification |
| Access Token TTL | 15 minutes              | Short-lived to reduce compromise     |
| Refresh Token    | Rotated on each use     | Prevents indefinite reuse            |
| Refresh Storage  | HttpOnly cookie         | Inaccessible to JavaScript           |
| Password Storage | bcrypt                  | Industry-standard hashing            |
| Authorization    | RBAC + Permission guard | Role-level + granular control        |
| Session State    | Persisted in DB         | Enables revocation & audit           |

---

## Verification

| Check                                     | Result                |
| :---------------------------------------- | :-------------------- |
| `POST /auth/login` with valid credentials | ✅ Returns tokens     |
| `POST /auth/login` with invalid password  | ✅ Returns 401        |
| `POST /auth/refresh` with valid cookie    | ✅ Returns new tokens |
| `POST /auth/refresh` with expired cookie  | ✅ Returns 401        |
| `GET /auth/sessions` (authenticated)      | ✅ Lists sessions     |
| RBAC guard blocks unauthorized roles      | ✅ Returns 403        |
| Swagger UI shows auth endpoints           | ✅ All documented     |
| Integration tests                         | ✅ All pass           |
| PR #1 merged to develop                   | ✅ Merged             |
