# Configurations API Specification (11-system-api/configurations.md)

This document defines endpoints for managing global system and tenant-level configurations.

---

## POST /api/v1/tenant-settings

### Purpose
Updates settings parameters for the tenant.

### Permission
`tenant:settings:write`

### Security Notes
*   Authentication Required: Yes
*   Required RBAC Permission: `tenant:settings:write`
*   Tenant Isolation: Enforced
*   Branch Isolation: Not Applicable
*   RLS Validation: Enforced
*   Sensitive Fields Masked: No.

### Request DTO
```json
{
  "academicYearId": "ay26-bf99-4d6a-8d1a-6b4b5e6f7a3f",
  "timezone": "Asia/Kolkata",
  "currencyCode": "INR",
  "allowedIpAddressRanges": ["192.168.1.0/24"]
}
```

### Business Rules
*   Saves the config values in `tenant_settings` table, updating global settings caches in Redis.

### Database Tables Affected
*   `tenant_settings` (Insert/Update)

### Response DTO
```json
{
  "success": true,
  "message": "Tenant settings updated successfully.",
  "data": null,
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
