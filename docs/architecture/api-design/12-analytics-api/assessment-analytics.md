# Assessment Analytics API Specification (12-analytics-api/assessment-analytics.md)

This document defines endpoints for querying CBT exam scoring analytics.

---

## GET /api/v1/analytics/exams/{id}/scoring-analytics

### Purpose
Exposes distribution metrics (highest mark, class average, standard deviation) for an exam.

### Permission
`analytics:assessment:read`

### Security Notes
*   Authentication Required: Yes
*   Required RBAC Permission: `analytics:assessment:read`
*   Tenant Isolation: Enforced
*   Branch Isolation: Enforced via batch scopes.
*   RLS Validation: Enforced
*   Sensitive Fields Masked: No.

### Response DTO (200 OK)
```json
{
  "success": true,
  "message": "Exam scoring distribution analytics retrieved.",
  "data": {
    "examId": "e02a3d12-bf99-4d6a-8d1a-6b4b5e6f7a3f",
    "highestMark": 690.00,
    "lowestMark": 320.00,
    "classAverage": 510.50,
    "standardDeviation": 45.20
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
