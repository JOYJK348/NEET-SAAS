# Users API Specifications (03-user-api/users.md)

Refer to [01-api-design-conventions.md](file:///d:/FreeLance/NEET_platform/docs/architecture/api-design/01-api-design-conventions.md) for global wrappers.

---

## POST /api/v1/users

### Purpose
Creates a core system user credentials identity.

### Permission
`user:create`

### Security Notes
*   Authentication Required: Yes
*   Required RBAC Permission: `user:create`
*   Tenant Isolation: Not Applicable (Users are global identities in auth registry).
*   Branch Isolation: Not Applicable
*   RLS Validation: Direct SQL verification.
*   Sensitive Fields Masked: Yes (passwords).

### Request DTO
```json
{
  "email": "user@coachingplatform.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "9876543210"
}
```

### Validation Constraints
*   `email`: Required. Unique globally. Max 255 characters.
*   `password`: Required. Must pass password rules.

### Business Rules
*   Enforces global email uniqueness constraints before writing credential hashes to `users` and `auth_identities`.

### Transaction Boundary
Synchronous single database transaction.

### Events Published
*   `UserIdentityCreated`

### Database Tables Affected
*   `users` (Insert)
*   `auth_identities` (Insert)

### Response DTO
```json
{
  "success": true,
  "message": "User identity created successfully.",
  "data": {
    "userId": "u091a3d1-bf99-4d6a-8d1a-6b4b5e6f7a3f"
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
