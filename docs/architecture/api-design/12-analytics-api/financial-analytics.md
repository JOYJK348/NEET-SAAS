# Financial Analytics API Specification (12-analytics-api/financial-analytics.md)

This document defines endpoints for querying fees and revenue projections.

---

## GET /api/v1/analytics/financial/collections-summary

### Purpose

Exposes monthly fee collections aggregates and outstanding payment projections.

### Permission

`analytics:financial:read`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `analytics:financial:read`
- Tenant Isolation: Enforced
- Branch Isolation: Not Applicable
- RLS Validation: Enforced
- Sensitive Fields Masked: No (restricted strictly to authorized financial roles).

### Response DTO (200 OK)

```json
{
  "success": true,
  "message": "Financial collections summary retrieved.",
  "data": {
    "totalCollected": 1200000.0,
    "totalOutstanding": 350000.0,
    "projections": [{ "month": "2026-08", "estimatedReceivables": 150000.0 }]
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
