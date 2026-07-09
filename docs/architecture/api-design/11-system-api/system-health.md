# System Health API Specification (11-system-api/system-health.md)

This document defines endpoints for querying container check states.

---

## GET /health

### Purpose
Exposes container health status check.

### Permission
None (Public).

### Response DTO (200 OK)
```json
{
  "status": "UP"
}
```

---

## GET /ready

### Purpose
Exposes downstream dependency check states.

### Response DTO (200 OK - Healthy)
```json
{
  "status": "READY",
  "dependencies": {
    "supabase_db": "UP",
    "redis_cache": "UP",
    "r2_storage": "UP"
  }
}
```
