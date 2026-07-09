# Preferences API Specification (10-communication-api/preferences.md)

This document defines endpoints for managing user notification channel preferences.

---

## POST /api/v1/user-preferences/notifications

### Purpose
Updates user settings for notification channel dispatches.

### Permission
None (Active session required).

### Security Notes
*   Authentication Required: Yes
*   Required RBAC Permission: None
*   Tenant Isolation: Enforced
*   Branch Isolation: Not Applicable
*   RLS Validation: Enforced
*   Sensitive Fields Masked: No.

### Request DTO
```json
{
  "preferenceSettings": [
    { "templateCategory": "MARKETING", "channel": "SMS", "isEnabled": false },
    { "templateCategory": "BILLING", "channel": "EMAIL", "isEnabled": true }
  ]
}
```

### Business Rules
*   Saves opt-in/opt-out configuration settings to the `user_notification_preferences` table.

### Database Tables Affected
*   `user_notification_preferences` (Insert/Update)

### Response DTO
```json
{
  "success": true,
  "message": "User communication preferences updated successfully.",
  "data": null,
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
