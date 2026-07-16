# RFID API Specification (09-attendance-api/rfid.md)

This document defines endpoints for mapping RFID hardware tags.

---

## POST /api/v1/rfids/register

### Purpose

Registers a hardware RFID badge card to a user profile.

### Permission

`rfid:write`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `rfid:write`
- Tenant Isolation: Enforced
- Branch Isolation: Not Applicable
- RLS Validation: Enforced
- Sensitive Fields Masked: No.

### Request DTO

```json
{
  "userId": "u091a3d1-bf99-4d6a-8d1a-6b4b5e6f7a3f",
  "badgeCode": "rfid_881902"
}
```

### Business Rules

- Ensures that `badgeCode` is globally unique in `user_rfid_cards` table.

### Response DTO

```json
{
  "success": true,
  "message": "RFID badge registered successfully.",
  "data": null,
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
