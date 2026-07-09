# Attendance Analytics API Specification (12-analytics-api/attendance-analytics.md)

This document defines endpoints for querying attendance risk analytics.

---

## GET /api/v1/analytics/attendance/risk-indicators

### Purpose
Exposes lists of student profiles showing high rates of consecutive absences or attendance percentages below threshold guidelines.

### Permission
`analytics:attendance:read`

### Security Notes
*   Authentication Required: Yes
*   Required RBAC Permission: `analytics:attendance:read`
*   Tenant Isolation: Enforced
*   Branch Isolation: Enforced
*   RLS Validation: Enforced
*   Sensitive Fields Masked: No.

### Request Parameters
*   `filter[branchId]`: UUID.
*   `filter[batchId]`: UUID.
*   `filter[thresholdPercentage]`: Decimal (Default: 75.00).

### Response DTO (200 OK)
```json
{
  "success": true,
  "message": "High-risk attendance indicators lists retrieved.",
  "data": [
    {
      "studentProfileId": "s71a3d12-bf99-4d6a-8d1a-6b4b5e6f7a3f",
      "name": "Adithya Kumar",
      "attendancePercentage": 72.50,
      "consecutiveAbsences": 4
    }
  ],
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
