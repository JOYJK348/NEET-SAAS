# Receipts API Specification (08-fee-api/receipts.md)

This document defines endpoints for generating payment receipts.

---

## GET /api/v1/payments/{id}/receipt

### Purpose
Generates a transactional voucher receipt PDF for a credit payment.

### Permission
`fee:payment:read`

### Security Notes
*   Authentication Required: Yes
*   Required RBAC Permission: `fee:payment:read`
*   Tenant Isolation: Enforced
*   Branch Isolation: Enforced via student batch checks.
*   RLS Validation: Enforced
*   Sensitive Fields Masked: No.

### Response DTO (200 OK)
```json
{
  "success": true,
  "message": "Payment receipt voucher generated.",
  "data": {
    "receiptNumber": "REC-2026-08129",
    "studentName": "Adithya Kumar",
    "amountPaid": 75000.00,
    "paymentDate": "2026-07-09",
    "pdfDownloadUrl": "https://storage.eliteneet.com/files/v1/receipts/rec889.pdf"
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
