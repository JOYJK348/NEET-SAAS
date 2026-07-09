# Attendance Timeline API Specification (09-attendance-api/timeline.md)

This document defines endpoints for retrieving a user's chronological attendance events.

---

## GET /api/v1/students/{id}/attendance-timeline

### Purpose
Retrieves a chronological sequence of clock-ins, daily roll-calls, leaves, and corrections for a student.

### Permission
`attendance:student:read`

### Security Notes
*   Authentication Required: Yes
*   Required RBAC Permission: `attendance:student:read`
*   Tenant Isolation: Enforced
*   Branch Isolation: Enforced
*   RLS Validation: Enforced
*   Sensitive Fields Masked: No.

### Response DTO (200 OK)
```json
{
  "success": true,
  "message": "Student attendance timeline retrieved.",
  "data": [
    {
      "event": "CLOCK_IN",
      "timestamp": "2026-07-09T08:25:00.000Z",
      "title": "RFID Card Swiped",
      "description": "Entered campus via Main Gate scanner.",
      "actorName": "RFID Gate Scanner"
    },
    {
      "event": "LEAVE_SUBMITTED",
      "timestamp": "2026-07-09T09:00:00.000Z",
      "title": "Sick Leave Requested",
      "description": "Applied for leave for tomorrow.",
      "actorName": "Rajendra Kumar (Parent)"
    }
  ],
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
