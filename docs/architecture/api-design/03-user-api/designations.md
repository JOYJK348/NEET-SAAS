# Designations API Specification (03-user-api/designations.md)

---

## POST /api/v1/designations

### Purpose
Registers a new workforce job title designation in the tenant.

### Permission
`designation:create`

### Security Notes
*   Authentication Required: Yes
*   Required RBAC Permission: `designation:create`
*   Tenant Isolation: Enforced
*   Branch Isolation: Not Applicable
*   RLS Validation: Enforced
*   Sensitive Fields Masked: No.

### Request DTO
```json
{
  "name": "Senior Instructor",
  "code": "SR-FACULTY"
}
```

### Business Rules
*   Prevents duplication of the designation code within the same tenant.

### Database Tables Affected
*   `designations` (Insert)

### Response DTO
```json
{
  "success": true,
  "message": "Designation registered successfully.",
  "data": {
    "designationId": "des89a3-bf99-4d6a-8d1a-6b4b5e6f7a3f"
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```

---

## GET /api/v1/designations

### Purpose
Lists all job designations.

### Permission
`designation:read`
