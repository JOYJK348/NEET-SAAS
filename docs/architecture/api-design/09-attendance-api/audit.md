# Attendance Audit API Specification (09-attendance-api/audit.md)

This document defines audit query endpoints for tracking attendance overrides.

---

## GET /api/v1/attendance-corrections/{id}/audit

### Purpose
Retrieves audit records for manual attendance and clock override approvals.

### Permission
`attendance:audit:read`

### Security Notes
*   Authentication Required: Yes
*   Required RBAC Permission: `attendance:audit:read`
*   Tenant Isolation: Enforced
*   Branch Isolation: Not Applicable
*   RLS Validation: Enforced
*   Sensitive Fields Masked: No.

### Response DTO (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "logId": "l091a3d1-bf99-4d6a-8d1a-6b4b5e6f7a3f",
      "action": "CORRECTION_APPROVED",
      "oldValue": {
        "status": "ABSENT"
      },
      "newValue": {
        "status": "PRESENT"
      },
      "reason": "Student verified inside the campus via CCTV logs.",
      "createdAt": "2026-07-09T02:00:00.000Z",
      "actorName": "Academic Head Coordinator"
    }
  ],
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
