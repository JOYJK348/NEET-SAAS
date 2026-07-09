# Announcements API Specification (10-communication-api/announcements.md)

This document defines endpoints for managing public announcements.

---

## POST /api/v1/comms/announcements

### Purpose
Publishes a dashboard announcement alert.

### Permission
`announcement:write`

### Security Notes
*   Authentication Required: Yes
*   Required RBAC Permission: `announcement:write`
*   Tenant Isolation: Enforced
*   Branch Isolation: Enforced via `branchId` mappings.
*   RLS Validation: Enforced
*   Sensitive Fields Masked: No.

### Request DTO
```json
{
  "title": "Independence Day Holiday Notice",
  "content": "Please note that the campus will remain closed on August 15th.",
  "targetRoleCodes": ["STUDENT", "PARENT"],
  "branchId": "b12a3d12-bf99-4d6a-8d1a-6b4b5e6f7a3f"
}
```

### Business Rules
*   Saves the record to `announcements` table, restricting layout display scope to target roles.

### Database Tables Affected
*   `announcements` (Insert)

### Response DTO (201 Created)
```json
{
  "success": true,
  "message": "Announcement published successfully.",
  "data": {
    "announcementId": "ann092a-bf99-4d6a-8d1a-6b4b5e6f7a3f"
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
