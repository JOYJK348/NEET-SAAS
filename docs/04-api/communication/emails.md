# Emails API Specification (10-communication-api/emails.md)

This document defines query endpoints for tracking outbound email records.

---

## GET /api/v1/comms/email-logs

### Purpose

Retrieves a paginated list of dispatched email records.

### Permission

`notification:read`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `notification:read`
- Tenant Isolation: Enforced
- Branch Isolation: Not Applicable
- RLS Validation: Enforced
- Sensitive Fields Masked: Yes (masks email addresses in results).

### Response DTO (200 OK)

```json
{
  "success": true,
  "message": "Email logs retrieved.",
  "data": [
    {
      "emailId": "em892a-bf99-4d6a-8d1a-6b4b5e6f7a3f",
      "recipientEmail": "ad*****@example.com",
      "subject": "Payment Receipt for NEET 2-Year Program",
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
