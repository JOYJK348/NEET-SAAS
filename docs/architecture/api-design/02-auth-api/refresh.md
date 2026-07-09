# POST /api/v1/auth/refresh

### Purpose
Exchanges an active refresh token for a new access token and rotated refresh token.

### Permission
None.

### Security Notes
*   Authentication Required: No
*   Required RBAC Permission: None
*   Tenant Isolation: Not Applicable
*   Branch Isolation: Not Applicable
*   RLS Validation: Direct SQL verification.
*   Sensitive Fields Masked: Yes.

### Request Headers
*   `X-Request-ID`: UUID (Required).
*   `X-Correlation-ID`: UUID (Required).

### Request DTO
```json
{
  "refreshToken": "eyJhbGciOi..."
}
```

### Validation Constraints
*   `refreshToken`: Required. Must be a valid JWT string format.

### Business Rules
1.  **Mandatory Rotation (RTR - Refresh Token Rotation)**:
    *   Every refresh execution must revoke the submitted refresh token (`is_revoked` set to `true`) and issue a fresh refresh token with a new token hash mapping.
    *   If a revoked refresh token is presented a second time, this suggests a replay attack: the auth service must immediately revoke all active refresh tokens associated with that user's session family, logging a high-priority security exception.
2.  **Verify age**: Ensure that the token's expiration date has not passed.

### Transaction Boundary
Synchronous DB updates inside `refresh_tokens` wrapping rotation verification checks.

### Events Published
*   `RefreshTokenRotated`
*   `SessionFamilyRevoked` (on replay attack detection)

### Database Tables Affected
*   `refresh_tokens` (Insert / Update)

### Response DTO
```json
{
  "success": true,
  "message": "Token refreshed successfully.",
  "data": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi...",
    "expiresIn": 900
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```

### Error Codes
*   `TOKEN_EXPIRED` (401)
*   `TOKEN_REVOKED` (401)

### Idempotency
Not supported.
