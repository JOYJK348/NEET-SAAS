# Academic Analytics API Specification (12-analytics-api/academic-analytics.md)

This document defines endpoints for querying courses analytics.

---

## GET /api/v1/analytics/academic/courses-summary

### Purpose
Exposes aggregate indicators (average class durations, syllabus completion percentages) for courses and batches.

### Permission
`analytics:academic:read`

### Security Notes
*   Authentication Required: Yes
*   Required RBAC Permission: `analytics:academic:read`
*   Tenant Isolation: Enforced
*   Branch Isolation: Enforced
*   RLS Validation: Enforced
*   Sensitive Fields Masked: No.

### Request Parameters
*   `filter[courseId]`: UUID.
*   `filter[branchId]`: UUID.

### Response DTO (200 OK)
```json
{
  "success": true,
  "message": "Academic analytics summaries retrieved.",
  "data": [
    {
      "courseId": "cne26-bf99-4d6a-8d1a-6b4b5e6f7a3f",
      "courseName": "NEET 2-Year Intensive Program",
      "averageSyllabusCompletionPercentage": 65.50
    }
  ],
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
