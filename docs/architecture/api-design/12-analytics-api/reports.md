# Reports API Specification (12-analytics-api/reports.md)

This document defines endpoints for configuring custom analytics reports.

---

## POST /api/v1/analytics/reports

### Purpose
Registers a custom reporting query template structure.

### Permission
`analytics:report:write`

### Security Notes
*   Authentication Required: Yes
*   Required RBAC Permission: `analytics:report:write`
*   Tenant Isolation: Enforced
*   Branch Isolation: Not Applicable
*   RLS Validation: Enforced
*   Sensitive Fields Masked: No.

### Request DTO
```json
{
  "name": "NEET Batch A Chemistry Progress",
  "domainFilter": "LMS",
  "aggregationRules": [
    { "field": "watchCompletionPercentage", "op": "AVG" }
  ]
}
```

### Database Tables Affected
*   `analytics_report_templates` (Insert)

### Response DTO (201 Created)
```json
{
  "success": true,
  "message": "Report template configuration saved.",
  "data": {
    "reportTemplateId": "rep89a-bf99-4d6a-8d1a-6b4b5e6f7a3f"
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
