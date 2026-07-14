# Feature Flags API Specification (11-system-api/feature-flags.md)

This document defines endpoints for managing platform feature flags.

---

## GET /api/v1/feature-flags

### Purpose

Retrieves active feature flags list mapping toggles for the user context.

### Permission

None (Active session required).

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: None
- Tenant Isolation: Enforced
- Branch Isolation: Not Applicable
- RLS Validation: Enforced
- Sensitive Fields Masked: No.

### Response DTO (200 OK)

```json
{
  "success": true,
  "message": "Feature flags list retrieved.",
  "data": {
    "cbt_module_enabled": true,
    "parent_portal_enabled": false
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
