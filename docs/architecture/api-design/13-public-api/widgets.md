# Widgets API Specification (13-public-api/widgets.md)

This document defines endpoints for generating public website widgets.

---

## GET /api/v1/public/widgets/announcements

### Purpose
Exposes public announcements list data to be embedded in the institute's homepage.

### Permission
None (Public).

### Security Notes
*   Authentication Required: No
*   Required RBAC Permission: None
*   Tenant Isolation: Enforced via `X-Tenant-ID` header.
*   Branch Isolation: Not Applicable
*   RLS Validation: Enforced
*   Sensitive Fields Masked: No.

### Response DTO (200 OK)
```json
{
  "success": true,
  "message": "Announcements retrieved.",
  "data": [
    {
      "announcementId": "ann092a-bf99-4d6a-8d1a-6b4b5e6f7a3f",
      "title": "Admissions open for Batch 2026-27",
      "content": "Apply online today using our admissions portal.",
      "createdAt": "2026-07-09T03:00:00.000Z"
    }
  ],
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
