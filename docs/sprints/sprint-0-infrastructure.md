# Sprint 0 — Shared Infrastructure Foundation

> **Commit:** `2892d3c`  
> **Branch:** `feature/people`  
> **Goal:** Build reusable multi-tenant infrastructure layer for all future bounded contexts.

---

## 1. What Was Done

Established the **People module** as a shared infrastructure module that exports tenant-scoped Prisma helpers, pagination utilities, and query parameter DTOs. This is the foundation every feature module depends on.

---

## 2. Files Created

| File                                                | Purpose                                                                                                           |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `apps/api/src/common/dto/paginated-response.dto.ts` | Generic `PaginatedResponseDto<T>` wrapper with `data` + `meta`                                                    |
| `apps/api/src/common/dto/query-params.dto.ts`       | `QueryParamsDto` — `page`, `limit`, `sortBy`, `sortOrder`, `search`                                               |
| `apps/api/src/common/utils/prisma-paginator.ts`     | `paginate()`, `paginateAndMap()`, `buildPrismaOrderBy()`, `buildPrismaSearch()`                                   |
| `apps/api/src/common/utils/tenant-scoped-prisma.ts` | Injectable class: `buildWhere()`, `findUnique()`, `findMany()`, `count()`, `create()`, `update()`, `softDelete()` |
| `apps/api/src/modules/people/people.module.ts`      | Module that exports `TenantScopedPrisma` (no controllers)                                                         |

---

## 3. Key Components

### TenantScopedPrisma

```typescript
// Central tenant isolation helper
buildWhere(tenantId, extra, options?)  // auto-appends tenantId + deletedAt:null
findUnique<T>(model, id, tenantId)     // by tenantId_id composite key
softDelete(model, id, tenantId, by)    // sets deletedAt + deletedBy
```

Every service across the entire codebase uses `this.tenantScoped.buildWhere(tenantId, {...})` to scope queries.

### Prisma Paginator

```typescript
paginate<T>({ model, where, orderBy, query, tenantId });
paginateAndMap<TInput, TOutput>(model, args, query, tenantId, mapper);
```

Returns `PaginatedResult<T>` with `data`, `meta.total`, `meta.page`, `meta.limit`, `meta.totalPages`, `meta.hasNextPage`, `meta.hasPreviousPage`.

---

## 4. Database Schema Changes

| Change              | Details                                                                    |
| ------------------- | -------------------------------------------------------------------------- |
| `EmergencyContacts` | Added `@@unique([tenantId, email])` for tenant-scoped email uniqueness     |
| `StudentParents`    | Added `updatedAt`, `updatedBy`, `deletedAt`, `deletedBy`, `version` fields |
| `StaffProfiles`     | Added optimized indexes                                                    |
| `StudentProfiles`   | Added optimized indexes                                                    |

**Migration:** `20260715211823_people_shared_infrastructure`

---

## 5. Tests

**Count:** 0 (infrastructure module — no controllers or services)

**Note:** The paginator and tenant-scoped helpers are tested implicitly by every downstream service test (Students, Admissions, BatchEnrollments).

---

## 6. Smoke Test

Ran `pnpm lint`, `pnpm typecheck`, `pnpm build` — all green.

---

## 7. Architecture Notes

- All entities use optimistic locking via `version: Int @default(1)`
- All entities support soft delete via `deletedAt: DateTime?` + `deletedBy: String?`
- Composite unique `@@unique([tenantId, id])` on all tenant-scoped models (enables `tenantId_id` composite key lookups)
- `PeopleModule` exports `TenantScopedPrisma` for injection into feature modules
