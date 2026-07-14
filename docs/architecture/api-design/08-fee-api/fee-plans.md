# Fee Plans API Specification (08-fee-api/fee-plans.md)

Refer to [common-errors.md](file:///d:/FreeLance/NEET_platform/docs/architecture/api-design/shared/common-errors.md) and [response-examples.md](file:///d:/FreeLance/NEET_platform/docs/architecture/api-design/shared/response-examples.md) for standard response envelopes.

---

## POST /api/v1/fee-plans

### Purpose

Registers a new fee plan structure configuration (e.g. NEET Premium Pack).

### Permission

`fee:plan:write`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `fee:plan:write`
- Tenant Isolation: Enforced via `X-Tenant-ID` header.
- Branch Isolation: Not Applicable
- RLS Validation: Enforced
- Sensitive Fields Masked: No.

### Request DTO

```json
{
  "name": "NEET Premium 2-Year Program Fees",
  "code": "NEET-PREM-2YR",
  "courseId": "cne26-bf99-4d6a-8d1a-6b4b5e6f7a3f",
  "totalAmount": 150000.0,
  "currencyCode": "INR"
}
```

### Validation Constraints

- `totalAmount`: Required. Positive numeric value.
- `code`: Required. Unique per tenant.

### Business Rules

- Prevents duplication of code within tenant.
- Creates fee plan templates mapped in `fee_plans` table.

### Database Tables Affected

- `fee_plans` (Insert)

### Response DTO (201 Created)

```json
{
  "success": true,
  "message": "Fee plan registered successfully.",
  "data": {
    "feePlanId": "fp092a-bf99-4d6a-8d1a-6b4b5e6f7a3f"
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
