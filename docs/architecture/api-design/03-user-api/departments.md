# Departments API Specification (03-user-api/departments.md)

This document defines endpoints for managing curriculum/administrative streams (departments).

Refer to [common-errors.md](file:///d:/FreeLance/NEET_platform/docs/architecture/api-design/shared/common-errors.md) and [pagination.md](file:///d:/FreeLance/NEET_platform/docs/architecture/api-design/shared/pagination.md) for shared schemas.

---

## POST /api/v1/departments

### Purpose

Registers a new department/curriculum stream (e.g., NEET, JEE, Admin).

### Permission

`department:create`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `department:create`
- Tenant Isolation: Enforced via `X-Tenant-ID` header.
- Branch Isolation: Not Applicable
- RLS Validation: Enforced
- Sensitive Fields Masked: No.

### Request DTO

```json
{
  "name": "NEET Coaching Stream",
  "code": "NEET-STREAM"
}
```

### Validation Constraints

- `name`: Required. Max 150 characters.
- `code`: Required. Unique per tenant scope.

### Business Rules

1.  **Duplicate check**: Fails if a department code already exists in the same tenant scope (`uq_departments_code`).

### Database Tables Affected

- `departments` (Insert)

### Response DTO (201 Created)

```json
{
  "success": true,
  "message": "Department registered successfully.",
  "data": {
    "departmentId": "d02a3d12-bf99-4d6a-8d1a-6b4b5e6f7a3f"
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```

---

## GET /api/v1/departments

### Purpose

Lists all departments registered in the tenant.

### Permission

`department:read`

---

## GET /api/v1/departments/{id}/staff

### Purpose

Retrieves a paginated list of staff members assigned to the department.

### Permission

`staff:read`

### Response DTO

Returns a standard list wrapped in the paginated response envelope structure.
