# Waivers API Specification (08-fee-api/waivers.md)

This document defines endpoints for executing discretionary student fee waivers.

---

## POST /api/v1/invoices/{id}/waivers

### Purpose
Applies a fee waiver credit to an outstanding invoice ledger.

### Permission
`fee:waiver:write`

### Security Notes
*   Authentication Required: Yes
*   Required RBAC Permission: `fee:waiver:write`
*   Tenant Isolation: Enforced
*   Branch Isolation: Not Applicable
*   RLS Validation: Enforced
*   Sensitive Fields Masked: No.

### Request DTO
```json
{
  "amountWaived": 10000.00,
  "remarks": "Discretionary waiver approved by Director."
}
```

### Business Rules
1.  **Validation**: Ensures `amountWaived` does not exceed outstanding balance.
2.  **Credit Entry**: Inserts credit adjustment row in `invoice_waivers` table.

### Database Tables Affected
*   `invoice_waivers` (Insert)

### Response DTO (201 Created)
```json
{
  "success": true,
  "message": "Waiver applied successfully.",
  "data": {
    "waiverId": "wav092a-bf99-4d6a-8d1a-6b4b5e6f7a3f"
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
