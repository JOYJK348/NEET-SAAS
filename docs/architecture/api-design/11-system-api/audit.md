# Configurations Audit API Specification (11-system-api/audit.md)

This document defines audit query endpoints for tracking modifications to system configurations.

---

## GET /api/v1/system/configs/audit

### Purpose
Retrieves audit records for changes made to tenant global settings and configs.

### Permission
`system:settings:audit:read`

### Security Notes
*   Authentication Required: Yes
*   Required RBAC Permission: `system:settings:audit:read`
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
      "action": "UPDATE_SETTINGS",
      "oldValue": {
        "allowedIpAddressRanges": []
      },
      "newValue": {
        "allowedIpAddressRanges": ["192.168.1.0/24"]
      },
      "reason": "Locked internal networks access scopes.",
      "createdAt": "2026-07-09T02:00:00.000Z",
      "actorName": "Platform Architect Admin"
    }
  ],
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
