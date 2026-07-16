# Biometric API Specification (09-attendance-api/biometric.md)

This document defines endpoints for managing staff/student biometric scanner registration templates.

---

## POST /api/v1/biometrics/templates

### Purpose

Registers a biometric scan template pattern hash for a user.

### Permission

`biometric:template:write`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `biometric:template:write`
- Tenant Isolation: Enforced
- Branch Isolation: Not Applicable
- RLS Validation: Enforced
- Sensitive Fields Masked: Yes (raw biometric hash strings are encrypted in db).

### Request DTO

```json
{
  "userId": "u091a3d1-bf99-4d6a-8d1a-6b4b5e6f7a3f",
  "templateHash": "enc_fingerprint_template_hash_here"
}
```

### Business Rules

- Encrypts the biometric signature template hash string before saving to PostgreSQL table `user_biometrics`.

### Response DTO

```json
{
  "success": true,
  "message": "Biometric template registered successfully.",
  "data": null,
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
