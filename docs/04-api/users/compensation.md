# Compensation API Specification (03-user-api/compensation.md)

This document defines endpoints for managing employee salary, compensation history, and payment timelines.

---

## POST /api/v1/staff/{id}/compensations

### Purpose

Appends a new compensation structure for a staff member (Salary Revision).

### Permission

`staff:compensation:write`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `staff:compensation:write`
- Tenant Isolation: Enforced
- Branch Isolation: Not Applicable
- RLS Validation: Enforced
- Sensitive Fields Masked: Yes (financial fields masked in log traces).

### Request DTO

```json
{
  "basicSalary": 75000.0,
  "allowances": 15000.0,
  "currencyCode": "INR",
  "effectiveFrom": "2026-08-01",
  "effectiveTo": null
}
```

### Validation Constraints

- `basicSalary`: Required. Positive numeric value.
- `effectiveFrom`: Required. ISO-8601 Date.
- `currencyCode`: Required. Standard 3-letter currency code (e.g. `INR`, `AED`).

### Business Rules

1.  **Append Only**: Direct updates (SQL `UPDATE`) are prohibited. Salary changes must insert a new compensation structure record.
2.  **Date Validation**: The `effectiveFrom` date must be equal to or later than the active joining date of the staff profile.
3.  **Exclusion check**: Verifies no time overlap bounds exist with prior structures (`uq_staff_compensations_no_overlap` PostgreSQL exclusion constraint).

### Database Tables Affected

- `staff_compensations` (Insert)

### Response DTO (201 Created)

```json
{
  "success": true,
  "message": "Salary structure revision appended successfully.",
  "data": {
    "compensationId": "c02a3d12-bf99-4d6a-8d1a-6b4b5e6f7a3f"
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```

---

## GET /api/v1/staff/{id}/compensations

### Purpose

Lists the historic compensation registry timeline for the staff profile.

### Permission

`staff:compensation:read`
