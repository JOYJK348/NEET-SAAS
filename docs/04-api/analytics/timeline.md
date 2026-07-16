# Analytics Timeline API Specification (12-analytics-api/timeline.md)

This document defines endpoints for retrieving chronological analytics events.

---

## GET /api/v1/analytics/reports/{id}/timeline

### Purpose

Retrieves a chronological history of report configurations, exports, and scheduled distributions.

### Permission

`analytics:report:read`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `analytics:report:read`
- Tenant Isolation: Enforced
- Branch Isolation: Not Applicable
- RLS Validation: Enforced
- Sensitive Fields Masked: No.

### Response DTO (200 OK)

```json
{
  "success": true,
  "message": "Report template timeline retrieved.",
  "data": [
    {
      "event": "TEMPLATE_CREATED",
      "timestamp": "2026-07-09T03:00:00.000Z",
      "title": "Report Config Saved",
      "description": "Custom query template defined for LMS chemistry tracking.",
      "actorName": "Academic Coordinator"
    },
    {
      "event": "EXPORT_GENERATED",
      "timestamp": "2026-07-09T03:05:00.000Z",
      "title": "CSV Export Completed",
      "description": "Background task formatted calculations to output file.",
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
