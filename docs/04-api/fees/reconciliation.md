# Reconciliation API Specification (08-fee-api/reconciliation.md)

This document defines endpoints for manual bank statement uploads and transaction matching.

---

## POST /api/v1/reconciliations/statements

### Purpose

Uploads a bank statement (CSV/XLSX) to perform manual transaction matching (Async).

### Permission

`fee:reconcile:write`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `fee:reconcile:write`
- Tenant Isolation: Enforced
- Branch Isolation: Not Applicable
- RLS Validation: Enforced
- Sensitive Fields Masked: No.

### Request DTO

```json
{
  "fileVersionId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
}
```

### Business Rules

1.  **Async Processing**: This is an asynchronous operation. Returns a `202 Accepted` status along with a `jobId`.
2.  **Matching engine**: Reads statement cells, matches reference codes, dates, and amounts against pending invoices, and registers matched items.

### Response DTO (202 Accepted)

```json
{
  "success": true,
  "message": "Bank statement uploaded and queued for reconciliation matching.",
  "data": {
    "jobId": "j90a3d12-bf99-4d6a-8d1a-6b4b5e6f7a3f",
    "status": "PENDING"
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
