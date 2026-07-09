# Roles API Specification (03-user-api/roles.md)

---

## POST /api/v1/roles

### Purpose
Registers a custom tenant role.

### Permission
`role:create`

### Security Notes
*   Authentication Required: Yes
*   Required RBAC Permission: `role:create`
*   Tenant Isolation: Enforced
*   Branch Isolation: Not Applicable
*   RLS Validation: Enforced
*   Sensitive Fields Masked: No.

### Request DTO
```json
{
  "name": "Course Evaluator",
  "code": "EVALUATOR",
  "scope": "TENANT",
  "description": "Custom role for evaluating assessment papers."
}
```

### Business Rules
*   Custom roles are stored with a non-null `tenant_id` to prevent cross-tenant leakage.

### Database Tables Affected
*   `roles` (Insert)

### Response DTO
```json
{
  "success": true,
  "message": "Role registered successfully.",
  "data": {
    "roleId": "r01a3d12-bf99-4d6a-8d1a-6b4b5e6f7a3f"
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```

---

## POST /api/v1/roles/{id}/permissions

### Purpose
Assigns permission capabilities to a custom role.

### Permission
`role:permissions:write`

### Request DTO
```json
{
  "permissionIds": [
    "p01a3d12-bf99-4d6a-8d1a-6b4b5e6f7a3f",
    "p02a3d12-bf99-4d6a-8d1a-6b4b5e6f7a3f"
  ]
}
```

### Business Rules
*   Verifies that the caller is not modifying a global system role (which are read-only).
*   Evicts the permission caches in Redis for all users carrying this role.
