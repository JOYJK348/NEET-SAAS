# Financial Search API Specification (08-fee-api/search.md)

This document defines advanced filter parameters for the financial transactions ledger.

---

## GET /api/v1/payments/search

### Purpose

Exposes a criteria-based search query API to filter financial payments.

### Permission

`fee:payment:read`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `fee:payment:read`
- Tenant Isolation: Enforced
- Branch Isolation: Not Applicable
- RLS Validation: Enforced
- Sensitive Fields Masked: Yes (details masked for non-finance users).

### Request Parameters

- `filter[paymentMethod]`: String (`ONLINE_GATEWAY`, `CASH`, `BANK_TRANSFER`).
- `filter[startDate]`: ISO Date.
- `filter[endDate]`: ISO Date.
- `search`: String (Fuzzy search matching transaction reference or student name).
- `page`: Positive Integer.
- `limit`: Integer.

### Response DTO (200 OK)

```json
{
  "success": true,
  "message": "Financial ledger search executed successfully.",
  "data": [
    {
      "paymentId": "pay092a-bf99-4d6a-8d1a-6b4b5e6f7a3f",
      "amountPaid": 75000.0,
      "paymentMethod": "ONLINE_GATEWAY",
      "transactionReference": "tx_razorpay_08912d",
      "paymentDate": "2026-07-09"
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
