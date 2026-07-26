# Analytics Audit API Specification (12-analytics-api/audit.md)

This document defines audit query endpoints for tracking modifications to report configurations.

---

## GET /api/v1/analytics/reports/{id}/audit

### Purpose

Retrieves audit records for changes made to custom report templates and parameters.

### Permission

`analytics:report:audit:read`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `analytics:report:audit:read`
- Tenant Isolation: Enforced
- Branch Isolation: Not Applicable
- RLS Validation: Enforced
- Sensitive Fields Masked: No.

### Response DTO (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "logId": "l091a3d1-bf99-4d6a-8d1a-6b4b5e6f7a3f",
      "action": "UPDATE_TEMPLATE",
      "oldValue": {
        "domainFilter": "LMS"
      },
      "newValue": {
        "domainFilter": "ASSESSMENTS"
      },
      "reason": "Reconfigured report targets checklist.",
      "createdAt": "2026-07-09T02:00:00.000Z",
      "actorName": "Academic Coordinator"
    }
  ],
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
