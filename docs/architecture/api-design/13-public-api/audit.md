# Public Domain Audit API Specification (13-public-api/audit.md)

This document defines audit query endpoints for tracking modifications to public integrations config settings.

---

## GET /api/v1/public/integrations/audit

### Purpose
Retrieves audit records for changes made to partner configurations, CORS settings, and API keys.

### Permission
`system:integration:audit:read`

### Security Notes
*   Authentication Required: Yes
*   Required RBAC Permission: `system:integration:audit:read`
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
      "action": "API_KEY_REVOKED",
      "oldValue": {
        "partnerId": "part02a-bf99-4d6a-8d1a-6b4b5e6f7a3f"
      },
      "newValue": null,
      "reason": "Deactivated partner integration.",
      "createdAt": "2026-07-09T02:00:00.000Z",
      "actorName": "Platform Security Officer"
    }
  ],
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
