# Invoices API Specification (08-fee-api/invoices.md)

This document defines endpoints for managing invoices.

---

## POST /api/v1/invoices

### Purpose

Generates an invoice ledger debit record for an enrolled student.

### Permission

`fee:invoice:write`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `fee:invoice:write`
- Tenant Isolation: Enforced
- Branch Isolation: Not Applicable
- RLS Validation: Enforced
- Sensitive Fields Masked: No.

### Request DTO

```json
{
  "studentProfileId": "s71a3d12-bf99-4d6a-8d1a-6b4b5e6f7a3f",
  "feePlanId": "fp092a-bf99-4d6a-8d1a-6b4b5e6f7a3f",
  "billingDate": "2026-07-09",
  "dueDate": "2026-08-09"
}
```

### Business Rules

1.  **State check**: Verifies student profile is active.
2.  **Ledger debit registration**: Creates the debit row in `invoices` table.

### Database Tables Affected

- `invoices` (Insert)

### Response DTO (201 Created)

```json
{
  "success": true,
  "message": "Student invoice generated successfully.",
  "data": {
    "invoiceId": "inv092a-bf99-4d6a-8d1a-6b4b5e6f7a3f"
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
