# Push Notifications API Specification (10-communication-api/push-notifications.md)

This document defines endpoints for managing device push notification tokens.

---

## POST /api/v1/push-tokens

### Purpose

Registers or updates a mobile/desktop browser device push notification token.

### Permission

None (Active session required).

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: None
- Tenant Isolation: Enforced
- Branch Isolation: Not Applicable
- RLS Validation: Enforced
- Sensitive Fields Masked: No.

### Request DTO

```json
{
  "deviceToken": "firebase_fcm_device_token_string_here",
  "platform": "MOBILE_IOS",
  "deviceName": "iPhone 15 Pro Max"
}
```

### Business Rules

- Saves the FCM device token mapped to active `userId` inside `user_device_tokens` table.
- Enforces uniqueness on the `deviceToken`. If token exists on another user, re-maps it to the active logging user context to prevent leakage.

### Database Tables Affected

- `user_device_tokens` (Insert/Update)

### Response DTO

```json
{
  "success": true,
  "message": "Device push token registered successfully.",
  "data": null,
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
