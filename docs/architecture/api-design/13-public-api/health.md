# Public Health API Specification (13-public-api/health.md)

This document defines endpoints for public gateway health checks.

---

## GET /api/v1/public/health

### Purpose
Exposes public API gateway container health check.

### Permission
None (Public).

### Response DTO (200 OK)
```json
{
  "status": "UP"
}
```
