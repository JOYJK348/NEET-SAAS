# Dashboards API Specification (12-analytics-api/dashboards.md)

Refer to [common-errors.md](file:///d:/FreeLance/NEET_platform/docs/architecture/api-design/shared/common-errors.md) and [response-examples.md](file:///d:/FreeLance/NEET_platform/docs/architecture/api-design/shared/response-examples.md) for standard response envelopes.

---

## GET /api/v1/analytics/dashboards/summary

### Purpose
Retrieves real-time counts and indicators summary metrics for active branch dashboards.

### Permission
`analytics:dashboard:read`

### Security Notes
*   Authentication Required: Yes
*   Required RBAC Permission: `analytics:dashboard:read`
*   Tenant Isolation: Enforced via `X-Tenant-ID` header.
*   Branch Isolation: Enforced via JWT branch scopes.
*   RLS Validation: Enforced
*   Sensitive Fields Masked: Yes (financial indicators restricted to finance/admin roles).

### Response DTO (200 OK)
```json
{
  "success": true,
  "message": "Dashboards summary metrics retrieved.",
  "data": {
    "studentStats": { "totalActive": 1250, "newEnrollmentsThisMonth": 48 },
    "facultyStats": { "totalActive": 45 },
    "attendanceRiskCount": 14,
    "financialStats": { "totalFeesCollected": 1200000.00, "outstandingFees": 350000.00 }
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
