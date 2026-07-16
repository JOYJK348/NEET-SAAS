# Attendance Search API Specification (09-attendance-api/search.md)

This document defines advanced filter parameters for the attendance registry database.

---

## GET /api/v1/attendance/search

### Purpose

Exposes a criteria-based search query API to filter student attendance entries.

### Permission

`attendance:student:read`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `attendance:student:read`
- Tenant Isolation: Enforced
- Branch Isolation: Enforced
- RLS Validation: Enforced
- Sensitive Fields Masked: No.

### Request Parameters

- `filter[studentProfileId]`: UUID.
- `filter[date]`: ISO Date.
- `filter[status]`: String (`PRESENT`, `ABSENT`, `LATE`).
- `page`: Positive Integer.
- `limit`: Integer.

### Response DTO (200 OK)

```json
{
  "success": true,
  "message": "Attendance registry search completed.",
  "data": [
    {
      "studentName": "Adithya Kumar",
      "rollNumber": "PH-2026-0089",
      "date": "2026-07-09",
      "status": "PRESENT"
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
