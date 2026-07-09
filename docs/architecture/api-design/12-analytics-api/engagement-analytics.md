# Engagement Analytics API Specification (12-analytics-api/engagement-analytics.md)

This document defines endpoints for querying LMS content engagement.

---

## GET /api/v1/analytics/engagement/lms-usage

### Purpose
Exposes aggregate stats for study materials accessed counts and video playbacks watch completions.

### Permission
`analytics:engagement:read`

### Security Notes
*   Authentication Required: Yes
*   Required RBAC Permission: `analytics:engagement:read`
*   Tenant Isolation: Enforced
*   Branch Isolation: Enforced
*   RLS Validation: Enforced
*   Sensitive Fields Masked: No.

### Response DTO (200 OK)
```json
{
  "success": true,
  "message": "LMS usage engagement stats retrieved.",
  "data": {
    "totalPdfViews": 1420,
    "averageVideoWatchCompletionPercentage": 68.20
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
