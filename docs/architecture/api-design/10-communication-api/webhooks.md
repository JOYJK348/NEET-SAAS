# Webhooks API Specification (10-communication-api/webhooks.md)

This document defines endpoints for managing outbound integrations webhook subscriptions.

---

## POST /api/v1/comms/webhooks/subscriptions

### Purpose

Registers a webhook subscription URL to receive platform event notifications.

### Permission

`webhook:subscription:write`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `webhook:subscription:write`
- Tenant Isolation: Enforced
- Branch Isolation: Not Applicable
- RLS Validation: Enforced
- Sensitive Fields Masked: Yes (secret verification keys are encrypted in db).

### Request DTO

```json
{
  "targetUrl": "https://client-endpoint.com/webhook-receiver",
  "subscribedEvents": ["student.enrolled", "payment.received"]
}
```

### Business Rules

1.  **URL Validation**: Must verify target URL is valid and uses HTTPS protocol.
2.  **Secret generation**: Generates a secure signing secret key returned in the response payload to allow verification of the `X-Webhook-Signature` header in calls from this platform.

### Database Tables Affected

- `webhook_subscriptions` (Insert)

### Response DTO (201 Created)

```json
{
  "success": true,
  "message": "Webhook subscription registered successfully.",
  "data": {
    "subscriptionId": "sub092a-bf99-4d6a-8d1a-6b4b5e6f7a3f",
    "signingSecret": "whsec_secure_signing_secret_key_here"
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
