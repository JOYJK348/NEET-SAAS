# Delivery Status API Specification (10-communication-api/delivery-status.md)

This document defines endpoints for carrier callback hooks.

---

## POST /api/v1/comms/delivery-callbacks/sms

### Purpose

Callback endpoint for SMS carriers (Twilio/Msg91) to report message delivery status updates.

### Permission

None (Public carrier webhook verified via endpoint matching secret key parameters).

### Security Notes

- Authentication Required: No
- Required RBAC Permission: None
- Tenant Isolation: Not Applicable (Resolved from payload variables).
- Branch Isolation: Not Applicable
- RLS Validation: Enforced on internal updates.
- Sensitive Fields Masked: No.

### Request DTO

Matches incoming formats defined by carrier.

### Business Rules

1.  **Carrier verification**: Verifies request origins using carrier signature verification logic checks.
2.  **Status update**: Updates corresponding message status in `notification_logs` table (`DELIVERED`, `FAILED`).

### Database Tables Affected

- `notification_logs` (Update)

### Response DTO

```json
{
  "status": "ACCEPTED"
}
```
