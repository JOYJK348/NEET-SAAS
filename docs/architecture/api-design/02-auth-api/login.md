# POST /api/v1/auth/login

### Purpose
Authenticates user credentials and returns access and rotatable refresh tokens.

### Permission
None (Public).

### Security Notes
*   Authentication Required: No
*   Required RBAC Permission: None
*   Tenant Isolation: Enforced via `X-Tenant-ID` header lookup.
*   Branch Isolation: Not Applicable
*   RLS Validation: Direct SQL verification.
*   Sensitive Fields Masked: Yes (input `password` is never logged).

### Request Headers
*   `X-Tenant-ID`: UUID (Required. Current active institute namespace).
*   `X-Request-ID`: UUID (Required).
*   `X-Correlation-ID`: UUID (Required).
*   `User-Agent`: String (Required. For device session tracking).
*   `X-Forwarded-For`: String (IP tracking).

### Request DTO
```json
{
  "email": "tutor@eliteneet.com",
  "password": "SecurePassword123!",
  "deviceId": "dev_mac_chrome_101d2",
  "deviceName": "Chrome Browser on macOS",
  "platform": "DESKTOP",
  "appVersion": "v1.4.2",
  "timezone": "Asia/Kolkata",
  "pushToken": "firebase_fcm_token_string_here"
}
```

### Validation Constraints
*   `email`: Required. Valid email format. Max 255 chars.
*   `password`: Required.
*   `deviceId`: Required. Unique hardware string.
*   `platform`: Required. Must be `DESKTOP`, `MOBILE_IOS`, `MOBILE_ANDROID`, or `WEB`.

### Business Rules
1.  **State check**: User status must be `ACTIVE`. Suspended accounts return `403 Forbidden` with `USER_SUSPENDED`.
2.  **Failed Counter**: Increment failed count on password mismatch. Lock account for 15 minutes after 5 consecutive failures.
3.  **Active Session Limits (Session Cap)**:
    *   Maximum allowed concurrent sessions per user is **5**.
    *   If a 6th session is registered, the system automatically deletes the oldest active session in the database and evicts its key from Redis cache.
4.  **MFA redirect**: If TOTP MFA is enabled on the user's record, return a `202 Accepted` with code `MFA_REQUIRED` and an short-lived `mfaToken` (valid for 5 minutes).

### Transaction Boundary
Synchronous DB updates inside user identities, inserting audit `login_histories` and updating `refresh_tokens`.

### Events Published
*   `UserLoginSuccess`
*   `UserLoginFailed`
*   `AccountLocked`

### Database Tables Affected
*   `refresh_tokens` (Insert/Update)
*   `login_histories` (Insert)

### Response DTO (200 OK - MFA Disabled)
```json
{
  "success": true,
  "message": "Authenticated successfully.",
  "data": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi...",
    "expiresIn": 900,
    "tokenType": "Bearer"
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```

### Response DTO (202 Accepted - MFA Required)
```json
{
  "success": true,
  "message": "MFA code verification required.",
  "data": {
    "mfaToken": "mfa_challenge_jwt_token_here",
    "challengeType": "TOTP"
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```

### Error Codes
*   `INVALID_CREDENTIALS` (401)
*   `USER_SUSPENDED` (403)
*   `ACCOUNT_LOCKED` (423)
*   `TENANT_ACCESS_DENIED` (403)

### Idempotency
Not supported.

### Performance & Cache Notes
*   Rate Limits: 5 login attempts per email per 5 minutes.
