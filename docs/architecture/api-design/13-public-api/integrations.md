# Integrations API Specification (13-public-api/integrations.md)

This document defines endpoints for managing external partner API integrations.

---

## POST /api/v1/public/integrations/partners

### Purpose

Registers a third-party partner integration client profile.

### Permission

`system:integration:write`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `system:integration:write`
- Tenant Isolation: Enforced
- Branch Isolation: Not Applicable
- RLS Validation: Enforced
- Sensitive Fields Masked: No.

### Request DTO

```json
{
  "partnerName": "NEET Mock Evaluators Inc",
  "allowedScopes": ["question.read", "student.verify"]
}
```

### Database Tables Affected

- `integration_partners` (Insert)

### Response DTO (201 Created)

```json
{
  "success": true,
  "message": "Partner client registered successfully.",
  "data": {
    "partnerId": "part02a-bf99-4d6a-8d1a-6b4b5e6f7a3f"
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
