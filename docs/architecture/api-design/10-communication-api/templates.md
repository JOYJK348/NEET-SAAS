# Templates API Specification (10-communication-api/templates.md)

This document defines endpoints for managing communication templates.

---

## POST /api/v1/comms/templates

### Purpose
Registers a new notification layout template.

### Permission
`template:create`

### Security Notes
*   Authentication Required: Yes
*   Required RBAC Permission: `template:create`
*   Tenant Isolation: Enforced
*   Branch Isolation: Not Applicable
*   RLS Validation: Enforced
*   Sensitive Fields Masked: No.

### Request DTO
```json
{
  "code": "WELCOME-EMAIL",
  "name": "Student Welcome Onboarding Email",
  "subjectLayout": "Welcome to NEET Coaching, {{studentName}}!",
  "bodyLayout": "<html><body>Hello {{studentName}}, your login account is ready. Access it here: {{portalUrl}}</body></html>"
}
```

### Business Rules
*   Validates template variables structure format using dynamic template compilation checks.
*   Enforces code uniqueness.

### Database Tables Affected
*   `communication_templates` (Insert)

### Response DTO (201 Created)
```json
{
  "success": true,
  "message": "Communication template registered successfully.",
  "data": {
    "templateId": "tmpl89a-bf99-4d6a-8d1a-6b4b5e6f7a3f"
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
