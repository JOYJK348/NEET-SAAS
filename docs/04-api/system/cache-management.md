# Cache Management API Specification (11-system-api/cache-management.md)

This document defines endpoints for managing Redis caches.

---

## POST /api/v1/cache/evict

### Purpose

Evicts configured key patterns from Redis caches (e.g. settings parameters or permission registries).

### Permission

`system:cache:write`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `system:cache:write`
- Tenant Isolation: Enforced
- Branch Isolation: Not Applicable
- RLS Validation: Enforced
- Sensitive Fields Masked: No.

### Request DTO

```json
{
  "keyPattern": "tenant:123:settings:*"
}
```

### Business Rules

- Dispatches an eviction instruction directly to Redis caches cluster.

### Response DTO

```json
{
  "success": true,
  "message": "Caches cleared successfully.",
  "data": null,
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
