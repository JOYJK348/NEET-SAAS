# Telemetry API Specification (11-system-api/telemetry.md)

This document defines endpoints for querying system operational logs.

---

## GET /api/v1/telemetry/metrics

### Purpose

Exposes API latency metrics and server logs (for administrator monitoring dashboards).

### Permission

`system:telemetry:read`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `system:telemetry:read`
- Tenant Isolation: Not Applicable
- Branch Isolation: Not Applicable
- RLS Validation: Direct SQL verification.
- Sensitive Fields Masked: Yes (PII fields masked in results).

### Response DTO (200 OK)

```json
{
  "success": true,
  "data": {
    "totalRequests": 10245,
    "p95LatencyMs": 140.0,
    "errorPercentage": 0.02
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
