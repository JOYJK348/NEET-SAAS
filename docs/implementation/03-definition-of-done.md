# 03 — Definition of Done (DoD)

This document outlines the validation checkpoints that every Bounded Context must pass before being merged into the master code branch.

---

## 1. The 6-Artifact Completion Checklist

A module is considered complete **only if** all of the following six artifacts exist in the repository:

1.  **Database Artifacts (`database/<context>/`):**
    - Prisma schema definitions synced correctly.
    - Migration files compiled and deployed.
    - Row-Level Security (RLS) rules enabled.
    - Indexes applied to all query lookup columns.
2.  **Backend Artifacts (`src/modules/<context>/`):**
    - All NestJS controllers, services, repositories, and modules implemented.
    - DTO models defined with validation rules.
    - OpenAPI annotation properties generated for all endpoints.
3.  **Frontend Artifacts (`src/features/<context>/`):**
    - Client interface screens built using CSS branding variables.
    - Axios calls encapsulated in React Query hooks.
    - Form validations bound to Zod schemas.
    - No deep imports across isolated feature boundaries.
4.  **Testing Artifacts (`tests/<context>/`):**
    - Unit tests covering service business logic (Target: `> 85%`).
    - Integration API tests validating controller pathways.
    - Playwright E2E browser flows verifying user journeys.
5.  **Documentation Artifacts (`docs/<context>/`):**
    - API docs detailing route parameters and responses.
    - A completed local `README.md` file in the module directory.
6.  **Seed Data Artifacts (`seed/<context>/`):**
    - Master seeds loaded.
    - Test fixtures available for testing suites.

---

## 2. Bounded Context README Template

Every context folder **must** include a `README.md` detailing its specifications. Copy and complete this template:

```markdown
# [Module ID] - [Module Name]

## Scope

Brief functional scope description of the module.

## Dependencies

List of other modules or services this context depends on.

- Imports: [Other Contexts]

## Database Tables

List of database tables owned by this context:

- `table_name`

## API Contracts

Links to controller actions and DTO schemas.

## Event Catalog

List of emitted and consumed events:

- Emits: [Events]
- Consumes: [Events]

## Permissions Matrix

Required role permissions to access specific routes:

- Admin: [Permissions]
- Tutor: [Permissions]
- Student: [Permissions]

## Test Coverage

- Unit tests path.
- Integration tests path.
- Current coverage metrics.

## Known Limitations

List of features explicitly out of scope for V1.
```

---

## 3. Security Checklist

Every Pull Request must verify the following security parameters:

- [ ] **Authorization Verified:** All controller routes carry explicit `@Permissions()` checks mapping to authorization matrices.
- [ ] **Row-Level Security (RLS) Verified:** Queries filter on `tenant_id` context (verifying users cannot access cross-tenant data frames).
- [ ] **Input Validation Completed:** All parameters pass validation DTO classes containing class-validator annotations.
- [ ] **Rate Limiting Checked:** High-risk APIs (login, password reset, file uploads) carry rate-limiting wrappers.
- [ ] **Audit Log Added:** Database alterations trigger audit logger logs (recording old values, user details, and timestamp).

---

## 4. Pull Request Review checklist

Before signing off a PR, the reviewer must verify:

- [ ] The codebase compiles without errors.
- [ ] Database migrations run cleanly on target environments.
- [ ] All tests execute and pass successfully.
- [ ] Structured logs capture critical events.
- [ ] No N+1 queries exist inside the repository file.
- [ ] The module contains a completed `README.md` following the template.
