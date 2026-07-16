# Student Analytics API Specification (12-analytics-api/student-analytics.md)

This document defines endpoints for querying student performance trends.

---

## GET /api/v1/analytics/students/{id}/performance-trends

### Purpose

Exposes chronological performance trends (attendance rates, CBT averages, LMS material accessed counts) for a student.

### Permission

`analytics:student:read`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `analytics:student:read`
- Tenant Isolation: Enforced
- Branch Isolation: Enforced
- RLS Validation: Enforced
- Sensitive Fields Masked: No.

### Response DTO (200 OK)

```json
{
  "success": true,
  "message": "Student performance trends retrieved.",
  "data": {
    "studentProfileId": "s71a3d12-bf99-4d6a-8d1a-6b4b5e6f7a3f",
    "timeline": [
      {
        "month": "2026-06",
        "averageAttendancePercentage": 92.0,
        "cbtAveragePercentage": 75.0,
        "lmsCompletionCount": 14
      }
    ]
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
