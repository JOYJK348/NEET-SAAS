# Late Fees API Specification (08-fee-api/late-fees.md)

This document defines endpoints for managing late fee accruals.

---

## POST /api/v1/invoices/{id}/late-fees

### Purpose
Calculates and accrues late fee penalties for an overdue invoice.

### Permission
`fee:late:write`

### Security Notes
*   Authentication Required: Yes
*   Required RBAC Permission: `fee:late:write`
*   Tenant Isolation: Enforced
*   Branch Isolation: Not Applicable
*   RLS Validation: Enforced
*   Sensitive Fields Masked: No.

### Request DTO
None.

### Business Rules
1.  **Overdue verification**: Confirms current date is past invoice `dueDate` and balance remains unpaid.
2.  **Accrual entry**: Appends a penalty debit row to the invoice balance context.

### Database Tables Affected
*   `invoice_penalties` (Insert)

### Response DTO (201 Created)
```json
{
  "success": true,
  "message": "Late fee penalty calculated and appended successfully.",
  "data": {
    "penaltyAmount": 500.00
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
