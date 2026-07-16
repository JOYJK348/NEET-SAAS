# Face Recognition API Specification (09-attendance-api/face-recognition.md)

This document defines verification endpoints for face detection cameras.

---

## POST /api/v1/face-recognition/verify

### Purpose

Verifies a captured CCTV image frame check-in against user profile photos.

### Permission

`device:integration:write`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `device:integration:write`
- Tenant Isolation: Enforced
- Branch Isolation: Enforced
- RLS Validation: Enforced
- Sensitive Fields Masked: No.

### Request DTO

```json
{
  "deviceId": "cctv_cam_009",
  "capturedImageBase64": "base64_jpeg_frame_data_here"
}
```

### Business Rules

1.  **AI Match Call**: Invokes the secure face matching engine.
2.  **Resolution**: On success, logs a check-in event for the matched user ID.

### Response DTO

```json
{
  "success": true,
  "message": "User verified successfully.",
  "data": {
    "userId": "u091a3d1-bf99-4d6a-8d1a-6b4b5e6f7a3f",
    "matchConfidence": 0.98
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
