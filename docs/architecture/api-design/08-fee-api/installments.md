# Installments API Specification (08-fee-api/installments.md)

This document defines endpoints for managing installment billing terms.

---

## POST /api/v1/invoices/{id}/installments

### Purpose

Splits an invoice's total bill into installment intervals.

### Permission

`fee:installment:write`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `fee:installment:write`
- Tenant Isolation: Enforced
- Branch Isolation: Not Applicable
- RLS Validation: Enforced
- Sensitive Fields Masked: No.

### Request DTO

```json
{
  "installments": [
    { "installmentNo": 1, "amount": 75000.0, "dueDate": "2026-08-09" },
    { "installmentNo": 2, "amount": 75000.0, "dueDate": "2026-12-09" }
  ]
}
```

### Business Rules

- Ensures sum of installment values matches invoice total amount context.

### Database Tables Affected

- `invoice_installments` (Insert)

### Response DTO (201 Created)

```json
{
  "success": true,
  "message": "Installment schedule mapped to invoice successfully.",
  "data": null,
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
