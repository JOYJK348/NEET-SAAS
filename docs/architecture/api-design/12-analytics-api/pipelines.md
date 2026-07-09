# Pipelines API Specification (12-analytics-api/pipelines.md)

This document defines endpoints for running data sync pipelines.

---

## POST /api/v1/analytics/pipelines/sync

### Purpose
Triggers a manual synchronization of CQRS read-model tables from operational event databases (Async).

### Permission
`system:pipeline:write`

### Security Notes
*   Authentication Required: Yes
*   Required RBAC Permission: `system:pipeline:write`
*   Tenant Isolation: Enforced
*   Branch Isolation: Not Applicable
*   RLS Validation: Enforced
*   Sensitive Fields Masked: No.

### Business Rules
*   Adds the synchronization task to the background processing queue. Returns `202 Accepted` status immediately.

### Response DTO (202 Accepted)
```json
{
  "success": true,
  "message": "Analytics read-model sync pipeline initiated.",
  "data": {
    "jobId": "j90a3d12-bf99-4d6a-8d1a-6b4b5e6f7a3f",
    "status": "QUEUED"
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
