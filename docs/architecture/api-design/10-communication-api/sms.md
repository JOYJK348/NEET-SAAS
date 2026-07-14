# SMS API Specification (10-communication-api/sms.md)

This document defines query endpoints for tracking outbound SMS logs.

---

## GET /api/v1/comms/sms-logs

### Purpose

Retrieves a paginated list of dispatched SMS records.

### Permission

`notification:read`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `notification:read`
- Tenant Isolation: Enforced
- Branch Isolation: Not Applicable
- RLS Validation: Enforced
- Sensitive Fields Masked: Yes (masks phone numbers in results).

### Response DTO (200 OK)

```json
{
  "success": true,
  "message": "SMS logs retrieved.",
  "data": [
    {
      "smsId": "sms892a-bf99-4d6a-8d1a-6b4b5e6f7a3f",
      "recipientPhone": "+91******3210",
      "messageText": "Hello Adithya, your fee installment of 75000 INR has been credited.",
      "status": "DELIVERED",
      "dispatchedAt": "2026-07-09T03:00:00.000Z"
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
