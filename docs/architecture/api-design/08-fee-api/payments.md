# Payments API Specification (08-fee-api/payments.md)

This document defines endpoints for recording ledger credit payment events.

---

## POST /api/v1/payments

### Purpose
Records a fee credit payment transaction (gateway success token or manual cash receipt).

### Permission
`fee:payment:write`

### Security Notes
*   Authentication Required: Yes
*   Required RBAC Permission: `fee:payment:write`
*   Tenant Isolation: Enforced
*   Branch Isolation: Not Applicable
*   RLS Validation: Enforced
*   Sensitive Fields Masked: No.

### Request DTO
```json
{
  "invoiceId": "inv092a-bf99-4d6a-8d1a-6b4b5e6f7a3f",
  "installmentId": "inst02a-bf99-4d6a-8d1a-6b4b5e6f7a3f",
  "amountPaid": 75000.00,
  "paymentMethod": "ONLINE_GATEWAY",
  "transactionReference": "tx_razorpay_08912d",
  "paymentDate": "2026-07-09"
}
```

### Business Rules
1.  **State check**: Verifies linked invoice exists and is unpaid/partially paid.
2.  **Ledger Credit Entry**: Inserts a transaction entry into `payments` table.
3.  **Invoice Status Update**: Recalculates payment balances to check if invoice can transition to `PAID` or `PARTIALLY_PAID`.

### Database Tables Affected
*   `payments` (Insert)
*   `invoices` (Update balances status)

### Response DTO (201 Created)
```json
{
  "success": true,
  "message": "Payment recorded successfully in ledger.",
  "data": {
    "paymentId": "pay092a-bf99-4d6a-8d1a-6b4b5e6f7a3f"
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
