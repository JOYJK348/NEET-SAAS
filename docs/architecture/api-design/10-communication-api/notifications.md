# Notifications API Specification (10-communication-api/notifications.md)

Refer to [common-errors.md](file:///d:/FreeLance/NEET_platform/docs/architecture/api-design/shared/common-errors.md) and [response-examples.md](file:///d:/FreeLance/NEET_platform/docs/architecture/api-design/shared/response-examples.md) for standard response envelopes.

---

## POST /api/v1/notifications

### Purpose

Queues a new notification message to be dispatched to one or more channels.

### Permission

`notification:write`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `notification:write`
- Tenant Isolation: Enforced via active session validation checks.
- Branch Isolation: Not Applicable
- RLS Validation: Enforced
- Sensitive Fields Masked: Yes (redacts personal identification fields in logs).

### Request DTO

```json
{
  "recipientUserId": "u091a3d1-bf99-4d6a-8d1a-6b4b5e6f7a3f",
  "templateCode": "WELCOME-EMAIL",
  "channels": ["EMAIL", "PUSH"],
  "payloadVariables": {
    "studentName": "Adithya Kumar",
    "portalUrl": "https://portal.eliteneet.com"
  }
}
```

### Validation Constraints

- `recipientUserId`: Required.
- "templateCode": Required. Valid registered template.
- `channels`: Required. Minimum 1 channel. Must contain `EMAIL`, `SMS`, or `PUSH`.

### Business Rules

1.  **Async Processing**: Queues the dispatch task immediately, returning `202 Accepted` with a `notificationId`.
2.  **Opt-Out Enforcement**: Checks recipient's notification preferences before dispatch. If user has disabled the channel for this template class, updates status to `OPTED_OUT` and discards delivery.

### Database Tables Affected

- `notification_logs` (Insert)

### Response DTO (202 Accepted)

```json
{
  "success": true,
  "message": "Notification queued for dispatch.",
  "data": {
    "notificationId": "not092a-bf99-4d6a-8d1a-6b4b5e6f7a3f"
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
