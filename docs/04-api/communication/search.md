# Comms Search API Specification (10-communication-api/search.md)

This document defines advanced filter parameters for the communication log.

---

## GET /api/v1/comms/search

### Purpose

Exposes a criteria-based search query API to filter dispatched notification logs.

### Permission

`notification:read`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `notification:read`
- Tenant Isolation: Enforced
- Branch Isolation: Not Applicable
- RLS Validation: Enforced
- Sensitive Fields Masked: Yes (details masked for non-comms-admin users).

### Request Parameters

- `filter[recipientUserId]`: UUID.
- `filter[status]`: String (`QUEUED`, `SENT`, `DELIVERED`, `FAILED`, `OPTED_OUT`).
- `filter[channel]`: String (`EMAIL`, `SMS`, `PUSH`).
- `page`: Positive Integer.
- `limit`: Integer.

### Response DTO (200 OK)

```json
{
  "success": true,
  "message": "Communication logs search executed successfully.",
  "data": [
    {
      "notificationId": "not092a-bf99-4d6a-8d1a-6b4b5e6f7a3f",
      "recipientUserId": "u091a3d1-bf99-4d6a-8d1a-6b4b5e6f7a3f",
      "templateCode": "WELCOME-EMAIL",
      "channel": "EMAIL",
      "status": "DELIVERED",
      "createdAt": "2026-07-09T03:00:00.000Z"
    }
  ],
  "meta": {
    "pagination": {
      "currentPage": 1,
      "pageSize": 25,
      "totalPages": 1,
      "totalRecords": 1
    },
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
