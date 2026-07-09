# Comms Timeline API Specification (10-communication-api/timeline.md)

This document defines endpoints for retrieving a user's chronological communication delivery events.

---

## GET /api/v1/students/{id}/comms-timeline

### Purpose
Retrieves a chronological sequence of all alerts dispatched to a student/parent.

### Permission
`notification:read`

### Security Notes
*   Authentication Required: Yes
*   Required RBAC Permission: `notification:read`
*   Tenant Isolation: Enforced
*   Branch Isolation: Not Applicable
*   RLS Validation: Enforced
*   Sensitive Fields Masked: No.

### Response DTO (200 OK)
```json
{
  "success": true,
  "message": "Student comms delivery timeline retrieved.",
  "data": [
    {
      "event": "QUEUED",
      "timestamp": "2026-07-09T03:00:00.000Z",
      "title": "Welcome Email Queued",
      "description": "Message queued inside systems outbox.",
      "actorName": "System Billing Engine"
    },
    {
      "event": "SENT",
      "timestamp": "2026-07-09T03:00:02.000Z",
      "title": "Welcome Email Dispatched",
      "description": "Transferred to SendGrid SMTP servers.",
      "actorName": "Comms Dispatcher"
    }
  ],
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
