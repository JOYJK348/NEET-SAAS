# GET /api/v1/auth/health

### Purpose
Authentications service container health check.

### Permission
None (Public).

### Response DTO (200 OK)
```json
{
  "success": true,
  "message": "Health status retrieved.",
  "data": {
    "status": "HEALTHY",
    "version": "1.0.0",
    "dependencies": {
      "database": {
        "status": "UP",
        "latencyMs": 8
      },
      "redis": {
        "status": "UP",
        "latencyMs": 2
      }
    }
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
