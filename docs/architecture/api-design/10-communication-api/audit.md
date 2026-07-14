# Comms Audit API Specification (10-communication-api/audit.md)

This document defines audit query endpoints for tracking modifications to templates and webhook subscriptions.

---

## GET /api/v1/comms/templates/{id}/audit

### Purpose

Retrieves action audit trails for a communication template.

### Permission

`template:audit:read`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `template:audit:read`
- Tenant Isolation: Enforced
- Branch Isolation: Not Applicable
- RLS Validation: Enforced
- Sensitive Fields Masked: No.

### Response DTO (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "logId": "l091a3d1-bf99-4d6a-8d1a-6b4b5e6f7a3f",
      "action": "UPDATE_LAYOUT",
      "oldValue": {
        "bodyLayout": "Old markup here."
      },
      "newValue": {
        "bodyLayout": "New markup here."
      },
      "reason": "Updated contact URL placeholders.",
      "createdAt": "2026-07-09T02:00:00.000Z",
      "actorName": "Marketing Admin"
    }
  ],
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
