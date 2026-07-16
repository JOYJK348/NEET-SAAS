# Exports API Specification (12-analytics-api/exports.md)

This document defines endpoints for generating data exports.

---

## POST /api/v1/analytics/reports/{id}/export

### Purpose

Triggers a background process to export report calculations to CSV or PDF (Async).

### Permission

`analytics:report:read`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `analytics:report:read`
- Tenant Isolation: Enforced
- Branch Isolation: Not Applicable
- RLS Validation: Enforced
- Sensitive Fields Masked: No.

### Request DTO

```json
{
  "exportFormat": "PDF"
}
```

### Business Rules

1.  **Async Processing**: This is an asynchronous operation. Returns `202 Accepted` immediately containing `jobId`.
2.  **Output registration**: Once formatting completes, saves output pdf files in system storage, linking download links inside the background job results logs.

### Response DTO (202 Accepted)

```json
{
  "success": true,
  "message": "Report export job queued.",
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
