# Campaigns API Specification (10-communication-api/campaigns.md)

This document defines endpoints for managing communication campaigns.

---

## POST /api/v1/comms/campaigns

### Purpose
Creates a communication campaign (bulk dispatch to batches).

### Permission
`campaign:write`

### Security Notes
*   Authentication Required: Yes
*   Required RBAC Permission: `campaign:write`
*   Tenant Isolation: Enforced
*   Branch Isolation: Not Applicable
*   RLS Validation: Enforced
*   Sensitive Fields Masked: No.

### Request DTO
```json
{
  "name": "NEET Crash Course Registrations Notice",
  "templateCode": "GENERAL-ANNOUNCEMENT",
  "targetBatchIds": [
    "b02a3d12-bf99-4d6a-8d1a-6b4b5e6f7a3f"
  ],
  "channels": ["EMAIL"]
}
```

### Business Rules
1.  **Async Batch Processing**: Operations are asynchronous. Returns `202 Accepted` immediately containing `jobId`.
2.  **Target Resolves**: Background tasks resolve student list recipients inside target batches and queue individual messages in `notification_logs`.

### Database Tables Affected
*   `campaigns` (Insert)

### Response DTO (202 Accepted)
```json
{
  "success": true,
  "message": "Campaign queued for dispatch.",
  "data": {
    "jobId": "j90a3d12-bf99-4d6a-8d1a-6b4b5e6f7a3f",
    "status": "PENDING"
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
