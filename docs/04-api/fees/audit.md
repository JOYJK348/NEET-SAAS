# Financial Audit API Specification (08-fee-api/audit.md)

This document defines audit query endpoints for tracking financial ledger overrides.

---

## GET /api/v1/invoices/{id}/audit

### Purpose

Retrieves ledger adjustment audit trails (e.g. manual status changes, refund overrides, waiver authorizations).

### Permission

`fee:audit:read`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `fee:audit:read`
- Tenant Isolation: Enforced
- Branch Isolation: Not Applicable
- RLS Validation: Enforced
- Sensitive Fields Masked: No.

### Response DTO (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "logId": "l091a3d1-bf99-4d6a-8d1a-6b4b5e6f7a3f",
      "action": "WAIVER_AUTHORIZED",
      "oldValue": {
        "status": "UNPAID"
      },
      "newValue": {
        "status": "PARTIALLY_PAID"
      },
      "reason": "Scholarship adjustments matching errors.",
      "createdAt": "2026-07-09T02:00:00.000Z",
      "actorName": "Finance Director"
    }
  ],
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
