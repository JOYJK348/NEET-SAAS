# Academic Audit API Specification (05-academic-api/audit.md)

This document defines audit query endpoints for tracking scheduling updates.

---

## GET /api/v1/timetable-slots/{id}/audit

### Purpose
Retrieves scheduling modifications logs for a timetable slot.

### Permission
`timetable:audit:read`

### Security Notes
*   Authentication Required: Yes
*   Required RBAC Permission: `timetable:audit:read`
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
      "action": "RESCHEDULE",
      "oldValue": {
        "startTime": "2026-07-09T09:00:00.000Z",
        "endTime": "2026-07-09T10:30:00.000Z"
      },
      "newValue": {
        "startTime": "2026-07-09T11:00:00.000Z",
        "endTime": "2026-07-09T12:30:00.000Z"
      },
      "reason": "Instructor emergency leave adjustments.",
      "createdAt": "2026-07-09T02:00:00.000Z"
    }
  ],
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
