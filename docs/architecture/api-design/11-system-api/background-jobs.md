# Background Jobs API Specification (11-system-api/background-jobs.md)

This document defines endpoints for querying background outbox tasks.

---

## GET /api/v1/background-jobs/{id}

### Purpose
Retrieves details and processing progress of a background job.

### Permission
`system:job:read`

### Security Notes
*   Authentication Required: Yes
*   Required RBAC Permission: `system:job:read`
*   Tenant Isolation: Enforced
*   Branch Isolation: Not Applicable
*   RLS Validation: Enforced
*   Sensitive Fields Masked: No.

### Response DTO (200 OK)
```json
{
  "success": true,
  "message": "Background job details retrieved.",
  "data": {
    "jobId": "j90a3d12-bf99-4d6a-8d1a-6b4b5e6f7a3f",
    "status": "PROCESSING",
    "progressPercentage": 45,
    "createdAt": "2026-07-09T03:00:00.000Z"
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```

---

## POST /api/v1/background-jobs/{id}/retry

### Purpose
Triggers a manual retry execution for a failed background job.

### Permission
`system:job:write`

### Business Rules
*   Verifies that the target job status is `FAILED`.
*   Resets the execution attempt counter and sets the status back to `PENDING` to trigger immediate queue pick-up.
