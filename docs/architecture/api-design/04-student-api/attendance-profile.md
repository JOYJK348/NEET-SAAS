# Attendance Profile API Specification (04-student-api/attendance-profile.md)

This document defines endpoints for querying student attendance summaries.

---

## GET /api/v1/students/{id}/attendance-profile

### Purpose
Retrieves a summary of the student's active attendance rates (total present, absent days, and percentages) for dashboard components.

### Permission
`student:read`

### Security Notes
*   Authentication Required: Yes
*   Required RBAC Permission: `student:read`
*   Tenant Isolation: Enforced
*   Branch Isolation: Enforced
*   RLS Validation: Enforced
*   Sensitive Fields Masked: No.

### Response DTO (200 OK)
```json
{
  "success": true,
  "message": "Student attendance summary retrieved successfully.",
  "data": {
    "studentProfileId": "s71a3d12-bf99-4d6a-8d1a-6b4b5e6f7a3f",
    "totalWorkingDays": 120,
    "presentDays": 108,
    "absentDays": 12,
    "attendancePercentage": 90.00
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
