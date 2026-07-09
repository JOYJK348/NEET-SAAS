# Financial Timeline API Specification (08-fee-api/timeline.md)

This document defines endpoints for retrieving a student's billing timeline.

---

## GET /api/v1/invoices/{id}/timeline

### Purpose
Retrieves a chronological sequence of all transaction events (invoice, payments, waivers, and refunds) for an invoice.

### Permission
`fee:invoice:read`

### Security Notes
*   Authentication Required: Yes
*   Required RBAC Permission: `fee:invoice:read`
*   Tenant Isolation: Enforced
*   Branch Isolation: Not Applicable
*   RLS Validation: Enforced
*   Sensitive Fields Masked: No.

### Response DTO (200 OK)
```json
{
  "success": true,
  "message": "Invoice ledger timeline retrieved.",
  "data": [
    {
      "event": "INVOICE_GENERATED",
      "timestamp": "2026-07-09T01:00:00.000Z",
      "title": "Invoice Raised (Debit)",
      "description": "Total amount due: 150000.00 INR.",
      "actorName": "System Billing Engine"
    },
    {
      "event": "PAYMENT_RECEIVED",
      "timestamp": "2026-07-09T03:00:00.000Z",
      "title": "Installment 1 Received (Credit)",
      "description": "Amount credited: 75000.00 INR.",
      "actorName": "Razorpay Webhook"
    }
  ],
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
