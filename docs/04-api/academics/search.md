# Academic Search API Specification (05-academic-api/search.md)

This document defines filters for academic catalogs and batch lookups.

---

## GET /api/v1/batches/search

### Purpose

Exposes a criteria-based search query API to retrieve active batches.

### Permission

`batch:read`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `batch:read`
- Tenant Isolation: Enforced
- Branch Isolation: Enforced
- RLS Validation: Enforced
- Sensitive Fields Masked: No.

### Request Parameters

- `filter[courseId]`: UUID.
- `filter[branchId]`: UUID.
- `search`: String (Fuzzy search matching batch name or code).
- `page`: Positive Integer.
- `limit`: Integer.

### Response DTO (200 OK)

```json
{
  "success": true,
  "message": "Batches search executed successfully.",
  "data": [
    {
      "batchId": "b02a3d12-bf99-4d6a-8d1a-6b4b5e6f7a3f",
      "name": "NEET 2026 Batch Alpha",
      "code": "NEET-26-ALPHA",
      "maxCapacity": 40,
      "currentEnrollmentCount": 35
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
