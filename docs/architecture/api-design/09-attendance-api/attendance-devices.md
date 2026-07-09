# Attendance Devices API Specification (09-attendance-api/attendance-devices.md)

This document defines integration endpoints for physical IoT attendance scanners.

---

## POST /api/v1/attendance-devices/logs

### Purpose
Ingests check-in logs from biometric, RFID, or face scanners (Async).

### Permission
`device:integration:write`

### Security Notes
*   Authentication Required: Yes (Device JWT credentials).
*   Required RBAC Permission: `device:integration:write`
*   Tenant Isolation: Enforced via device metadata mapping.
*   Branch Isolation: Enforced
*   RLS Validation: Direct SQL verification.
*   Sensitive Fields Masked: No.

### Request DTO
```json
{
  "deviceId": "dev_bio_physics_081",
  "logType": "RFID_CARD_SCAN",
  "rawLogs": [
    { "badgeCode": "rfid_881902", "timestamp": "2026-07-09T08:25:00.000Z" }
  ]
}
```

### Business Rules
1.  **Async Ingestion**: Queues the raw log entries in `background_jobs`, returning a `202 Accepted` status along with a `jobId`.
2.  **Resolution logic**: A background worker maps `badgeCode` to the matching student or staff user profile context and appends active clock-in rows.

### Response DTO (202 Accepted)
```json
{
  "success": true,
  "message": "Device scan logs received and queued for processing.",
  "data": {
    "jobId": "j90a3d12-bf99-4d6a-8d1a-6b4b5e6f7a3f",
    "status": "PENDING"
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
