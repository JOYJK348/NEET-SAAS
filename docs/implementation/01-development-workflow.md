# 01 — Backend-First Development Workflow

To ensure high reliability, minimize API contract drift, and speed up client-side coding, the platform enforces a **strict backend-first development lifecycle**. Frontend coding must **never begin** until the underlying API contract is verified, documented, and covered by integration tests.

---

## 1. The 12-Step Lifecycle Pipeline

```
┌────────────────────────────────────────────────────────┐
│ 1. Database: Update Schema (SQL alters)                │
│                         ↓                              │
│ 2. Migration: Generate and deploy Prisma diff          │
│                         ↓                              │
│ 3. Repository: Bind Prisma client query handlers       │
│                         ↓                              │
│ 4. Service: Write core business logic & events         │
│                         ↓                              │
│ 5. DTO: Define input/output validations                │
│                         ↓                              │
│ 6. Controller: Map HTTP endpoints                      │
│                         ↓                              │
│ 7. OpenAPI: Auto-generate Swagger spec contracts       │
│                         ↓                              │
│ 8. Unit Test: Assert service methods & logic           │
│                         ↓                              │
│ 9. Integration Test: Verify complete API controller behavior│
│                         ↓                              │
│ 10. Frontend: Integrate Next.js components & UI state   │
│                         ↓                              │
│ 11. Playwright: Run user flow browser automation check │
│                         ↓                              │
│ 12. PR Review: Final checklist audit                   │
└────────────────────────────────────────────────────────┘
```

---

## 2. Step Details & Requirements

### Step 1: Database (SQL schema changes)
*   Modify raw SQL schemas inside the database directory (`database/<context>/`).
*   Ensure all primary and foreign key constraints are explicitly declared.
*   Enforce index rules: Indexes **must** be created for all search columns and foreign key mappings.

### Step 2: Migration (Prisma Sync)
*   Sync changes to the local Prisma schema.
*   Run `npx prisma migrate dev --name <migration_name>` to generate SQL migrations.
*   Verify that rollback scripts match.

### Step 3: Repository Pattern
*   Scaffold database lookup logic inside a repository file.
*   Do not query Prisma directly from Services. Keep DB mappings encapsulated inside repositories.

### Step 4: Service Layer
*   Write business validation logic inside the service class.
*   Trigger events through local emitters (e.g., `eventEmitter.emit('StudentCreated', student)`).

### Step 5: Data Transfer Objects (DTOs)
*   Scaffold Input/Output DTO models.
*   Apply class-validator decorators (`@IsString()`, `@IsEmail()`, `@IsOptional()`) to validate inputs before executing actions.

### Step 6: Controller Layer
*   Map HTTP verbs (`@Get()`, `@Post()`, `@Patch()`, `@Delete()`).
*   Apply route authentication and permission guards (`@Permissions('student.create')`).

### Step 7: OpenAPI Generation
*   Annotate controller endpoints with `@ApiOperation()` and `@ApiResponse()`.
*   Validate Swagger output matches api design.

### Step 8: Unit Testing
*   Write unit tests for the service layer using mocked repositories.
*   Verify boundary conditions and error throwing.

### Step 9: Integration Testing
*   Write tests for the controller endpoints using supertest.
*   Perform test database seeding before running check assertions.

### Step 10: Frontend Integration
*   Scaffold Next.js routes, query hooks, and state slices.
*   Retrieve data via strongly typed Axios calls and React Query hooks.

### Step 11: Playwright Flow
*   Write E2E browser tests tracking complete user journeys (e.g., Log in -> Admit Student -> Select course -> Process billing).

### Step 12: PR Review
*   Verify the module meets all Definition of Done (DoD) criteria and Quality Gate baselines.
