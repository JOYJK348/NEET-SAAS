# Attendance Reports API Specification (09-attendance-api/reports.md)

This document defines endpoints for retrieving attendance analysis reports.

---

## GET /api/v1/attendance-reports/summary

### Purpose

Retrieves monthly attendance statistics and flags warning counts (consecutive absences) for risk dashboards.

### Permission

`attendance:report:read`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `attendance:report:read`
- Tenant Isolation: Enforced
- Branch Isolation: Enforced
- RLS Validation: Enforced
- Sensitive Fields Masked: No.

### Request Parameters

- `filter[batchId]`: UUID.
- `filter[month]`: String (`YYYY-MM`).
- `page`: Positive Integer.
- `limit`: Integer.

### Response DTO (200 OK)

```json
{
  "success": true,
  "message": "Attendance reports summary generated.",
  "data": [
    {
      "studentName": "Adithya Kumar",
      "rollNumber": "PH-2026-0089",
      "attendancePercentage": 72.5,
      "consecutiveAbsencesCount": 4,
      "attendanceRiskStatus": "HIGH_RISK"
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
