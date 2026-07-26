# Analytics Search API Specification (12-analytics-api/search.md)

This document defines advanced filter parameters for querying report archives.

---

## GET /api/v1/analytics/reports/search

### Purpose

Exposes a criteria-based search query API to filter generated report templates.

### Permission

`analytics:report:read`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `analytics:report:read`
- Tenant Isolation: Enforced
- Branch Isolation: Not Applicable
- RLS Validation: Enforced
- Sensitive Fields Masked: No.

### Request Parameters

- `filter[domainFilter]`: String (`LMS`, `FEES`, `ASSESSMENTS`, `ATTENDANCE`).
- `search`: String (Fuzzy search matching report name).
- `page`: Positive Integer.
- `limit`: Integer.

### Response DTO (200 OK)

```json
{
  "success": true,
  "message": "Report templates search completed.",
  "data": [
    {
      "reportTemplateId": "rep89a-bf99-4d6a-8d1a-6b4b5e6f7a3f",
      "name": "NEET Batch A Chemistry Progress",
      "domainFilter": "LMS"
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
