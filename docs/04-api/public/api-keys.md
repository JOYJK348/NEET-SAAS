# API Keys API Specification (13-public-api/api-keys.md)

This document defines endpoints for managing integration credentials.

---

## POST /api/v1/public/api-keys

### Purpose

Generates a secure API key credentials credential token for a partner integration.

### Permission

`system:integration:write`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `system:integration:write`
- Tenant Isolation: Enforced
- Branch Isolation: Not Applicable
- RLS Validation: Enforced
- Sensitive Fields Masked: Yes (raw API key returned once, stored encrypted).

### Request DTO

```json
{
  "partnerId": "part02a-bf99-4d6a-8d1a-6b4b5e6f7a3f",
  "monthlyQuota": 10000
}
```

### Business Rules

- Generates a cryptographically secure token prefix (`pk_live_...`).
- Stores encrypted hash matching parameters in `partner_api_keys` table.

### Response DTO (201 Created)

```json
{
  "success": true,
  "message": "API key generated successfully.",
  "data": {
    "apiKey": "pk_live_sec_token_hash_returned_once_here",
    "expiresAt": "2027-07-09T00:00:00.000Z"
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```

---

## DELETE /api/v1/public/api-keys/{id}

### Purpose

Revokes an API key credentials token immediately.

### Permission

`system:integration:write`
