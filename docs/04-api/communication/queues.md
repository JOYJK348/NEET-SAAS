# Queues API Specification (10-communication-api/queues.md)

This document defines endpoints for querying background outbox message queues.

---

## GET /api/v1/comms/queues/metrics

### Purpose

Retrieves real-time processing metrics for notification queues (pending, retrying, failed message counts).

### Permission

`notification:queue:read`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `notification:queue:read`
- Tenant Isolation: Enforced
- Branch Isolation: Not Applicable
- RLS Validation: Enforced
- Sensitive Fields Masked: No.

### Response DTO (200 OK)

```json
{
  "success": true,
  "message": "Queue metrics retrieved.",
  "data": {
    "pendingCount": 14,
    "retryingCount": 2,
    "failedCount": 1,
    "averageLatencyMs": 145.0
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
