# POST /api/v1/auth/change-password

### Purpose
Allows an authenticated user to change their password credentials.

### Permission
None.

### Request DTO
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewSecurePassword456!"
}
```

### Validation Constraints
*   `currentPassword`: Required.
*   `newPassword`: Required. Minimum 12 characters. Must pass password complexity rules.

### Business Rules
1.  **Old password match**: Validates that current password matches the database hash stored in `auth_identities`.
2.  **History check**: Must not match any of the user's last 5 passwords.
3.  **Invalidate other sessions**: Revokes all other active refresh tokens for the user to secure the account.

---

# POST /api/v1/auth/forgot-password

### Purpose
Triggers a password recovery workflow email or SMS link.

### Permission
None (Public).

### Request DTO
```json
{
  "email": "student@eliteneet.com"
}
```

### Business Rules
1.  **Single-Use Token**: Generates a cryptographically secure, single-use reset token that is valid for 15 minutes.
2.  **Telemetry Job**: Spawns an outbox email task.
3.  *Security*: Always returns `200 OK` (success) to prevent email enumeration attacks.

---

# POST /api/v1/auth/reset-password

### Purpose
Resets password credentials using a recovery token.

### Permission
None (Public).

### Request DTO
```json
{
  "token": "reset_token_guid_here",
  "newPassword": "NewSecurePassword123!"
}
```

### Business Rules
1.  **Validation**: Validates that the token exists, is not expired, and has not been marked as used.
2.  **Invalidate token**: The token is immediately consumed (deleted/invalidated) upon successful password reset.
3.  **Update hash**: Updates password hash in `auth_identities`.
