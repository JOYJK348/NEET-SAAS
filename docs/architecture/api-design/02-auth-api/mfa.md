# POST /api/v1/auth/mfa/enable

### Purpose
Initiates the TOTP-based Multi-Factor Authentication enrollment workflow.

### Permission
None (Active session required).

### Response DTO (200 OK)
```json
{
  "success": true,
  "message": "TOTP MFA enrollment initiated.",
  "data": {
    "secret": "JBSWY3DPEHPK3PXP",
    "qrCodeUrl": "otpauth://totp/NEETPlatform:tutor@eliteneet.com?secret=JBSWY3DPEHPK3PXP&issuer=NEETPlatform"
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```

---

# POST /api/v1/auth/mfa/verify

### Purpose
Verifies the TOTP code to complete enrollment or finish the login challenge.

### Permission
None (Requires active JWT session or valid short-lived `mfaToken`).

### Request DTO
```json
{
  "code": "123456",
  "mfaToken": "mfa_challenge_jwt_token_here"
}
```

### Business Rules
1.  **MFA Activation**: If this is the initial enrollment check, successful verification flags `mfa_enabled = true` on the user's record and generates **10 one-time recovery codes**.
2.  **Recovery Codes**: Recovery codes are returned in the response as raw strings (e.g. `XXXX-XXXX-XXXX`) and must be saved immediately. They are stored securely in the database as salted hashes.
3.  **MFA Login Challenge**: If this is a login challenge verify check, successful validation returns the final Access and Refresh tokens.

### Response DTO (200 OK - Activation)
```json
{
  "success": true,
  "message": "MFA activated successfully.",
  "data": {
    "recoveryCodes": [
      "ABCD-EFGH-IJKL",
      "MNOP-QRST-UVWX"
    ]
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```

---

# POST /api/v1/auth/mfa/disable

### Purpose
Disables multi-factor authentication.

### Permission
None.

### Request DTO
```json
{
  "code": "123456"
}
```

### Business Rules
*   Requires verification of a valid TOTP code (or fallback recovery code) to execute disable request.
