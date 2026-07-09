# Maintenance API Specification (11-system-api/maintenance.md)

This document defines endpoints for configuring maintenance modes.

---

## POST /api/v1/system/maintenance

### Purpose
Locks the gateway to activate system-wide maintenance mode blocks.

### Permission
`system:maintenance:write`

### Security Notes
*   Authentication Required: Yes
*   Required RBAC Permission: `system:maintenance:write`
*   Tenant Isolation: Not Applicable
*   Branch Isolation: Not Applicable
*   RLS Validation: Direct SQL verification.
*   Sensitive Fields Masked: No.

### Request DTO
```json
{
  "isEnabled": true,
  "estimatedDurationMinutes": 60,
  "userFriendlyNotice": "NEET Platform is undergoing scheduled database indexing checks."
}
```

### Business Rules
*   Sets lock state flags in Redis cache memory. Subsequent client requests receive a `503 Service Unavailable` status showing the custom notification content (except requests carrying authorized Platform Admin tokens).

### Response DTO
```json
{
  "success": true,
  "message": "Maintenance state locked.",
  "data": null,
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
