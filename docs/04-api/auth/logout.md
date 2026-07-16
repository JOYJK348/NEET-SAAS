# POST /api/v1/auth/logout

### Purpose

Revokes the current session's refresh token.

### Permission

None (Active session required).

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: None
- Tenant Isolation: Not Applicable
- Branch Isolation: Not Applicable
- RLS Validation: Enforced
- Sensitive Fields Masked: Yes.

### Request Headers

- `Authorization`: Bearer `<jwt_token>` (Required).

### Request DTO

None.

### Business Rules

- Revokes the active refresh token matching the JWT's `jti` (JWT ID claim).
- Evicts the token session mapping from Redis cache immediately.

### Database Tables Affected

- `refresh_tokens` (Update)

### Response DTO

```json
{
  "success": true,
  "message": "Session terminated successfully.",
  "data": null,
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```

---

# POST /api/v1/auth/logout-all

### Purpose

Terminates all active sessions for the user account.

### Permission

None (Active session required).

### Business Rules

- Updates all active `refresh_tokens` matching the current user ID to `is_revoked = true`.
- Bulk evicts all user keys from Redis cache.

### Database Tables Affected

- `refresh_tokens` (Update)

### Response DTO

```json
{
  "success": true,
  "message": "All sessions terminated successfully.",
  "data": null,
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
