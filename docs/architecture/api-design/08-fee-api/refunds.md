# Refunds API Specification (08-fee-api/refunds.md)

This document defines endpoints for managing payments refunds and ledger adjustments.

---

## POST /api/v1/refunds

### Purpose
Processes a refund request, recording debit adjustment rows in the ledger.

### Permission
`fee:refund:write`

### Security Notes
*   Authentication Required: Yes
*   Required RBAC Permission: `fee:refund:write`
*   Tenant Isolation: Enforced
*   Branch Isolation: Not Applicable
*   RLS Validation: Enforced
*   Sensitive Fields Masked: No.

### Request DTO
```json
{
  "paymentId": "pay092a-bf99-4d6a-8d1a-6b4b5e6f7a3f",
  "refundAmount": 20000.00,
  "reason": "Student course withdrawal",
  "remarks": "Refund issued based on exit policies."
}
```

### Business Rules
1.  **Balance verification**: Ensures `refundAmount` does not exceed the payment's original credited value.
2.  **Ledger Adjustment Entry**: Inserts a debit adjustment record in `refunds` table (which is immutable).

### Database Tables Affected
*   `refunds` (Insert)

### Response DTO (201 Created)
```json
{
  "success": true,
  "message": "Refund processed and logged in ledger.",
  "data": {
    "refundId": "ref092a-bf99-4d6a-8d1a-6b4b5e6f7a3f"
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
