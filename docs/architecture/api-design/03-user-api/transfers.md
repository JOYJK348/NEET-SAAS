# Transfers API Specification (03-user-api/transfers.md)

This document defines endpoints for executing employee branch and department transfers.

---

## POST /api/v1/staff/{id}/transfer-department

### Purpose
Logs a department transfer and updates the employee's active record.

### Permission
`staff:transfer:write`

### Security Notes
*   Authentication Required: Yes
*   Required RBAC Permission: `staff:transfer:write`
*   Tenant Isolation: Enforced
*   Branch Isolation: Not Applicable
*   RLS Validation: Enforced
*   Sensitive Fields Masked: No.

### Request DTO
```json
{
  "newDepartmentId": "d09a3d12-bf99-4d6a-8d1a-6b4b5e6f7a3f",
  "effectiveFrom": "2026-07-15",
  "remarks": "Assigned to NEET Chemistry stream."
}
```

### Business Rules
1.  **State check**: Employee must be `ACTIVE` or `CONFIRMED`.
2.  **Update Employment**: Updates the `department_id` in the active `staff_employment` table.

### Database Tables Affected
*   `staff_employment` (Update)

### Response DTO
```json
{
  "success": true,
  "message": "Department transfer completed successfully.",
  "data": null,
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
