# Infrastructure Search API Specification (11-system-api/search.md)

This document defines advanced filters for background jobs and system files.

---

## GET /api/v1/background-jobs/search

### Purpose

Exposes a criteria-based search query API to filter background jobs.

### Permission

`system:job:read`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `system:job:read`
- Tenant Isolation: Enforced
- Branch Isolation: Not Applicable
- RLS Validation: Enforced
- Sensitive Fields Masked: No.

### Request Parameters

- `filter[status]`: String (`PENDING`, `PROCESSING`, `SUCCESS`, `FAILED`).
- `search`: String (Fuzzy search matching correlationId).
- `page`: Positive Integer.
- `limit`: Integer.

### Response DTO (200 OK)

```json
{
  "success": true,
  "message": "Background jobs search executed successfully.",
  "data": [
    {
      "jobId": "j90a3d12-bf99-4d6a-8d1a-6b4b5e6f7a3f",
      "status": "PROCESSING",
      "progressPercentage": 45,
      "createdAt": "2026-07-09T03:00:00.000Z"
    }
  ],
  "meta": {
    "pagination": {
      "currentPage": 1,
      "pageSize": 25,
      "totalPages": 1,
      "totalRecords": 1
    },
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
