# Video Recordings API Specification (07-lms-api/recordings.md)

This document defines endpoints for managing recorded video lectures.

---

## POST /api/v1/live-recordings

### Purpose
Registers a recorded video lecture from a live class session.

### Permission
`lms:recording:write`

### Security Notes
*   Authentication Required: Yes
*   Required RBAC Permission: `lms:recording:write`
*   Tenant Isolation: Enforced
*   Branch Isolation: Not Applicable
*   RLS Validation: Enforced
*   Sensitive Fields Masked: No.

### Request DTO
```json
{
  "batchId": "b02a3d12-bf99-4d6a-8d1a-6b4b5e6f7a3f",
  "topicId": "top02b-bf99-4d6a-8d1a-6b4b5e6f7a3f",
  "title": "Kinematics - Lecture 3",
  "videoFileId": "vid78a2-bf99-4d6a-8d1a-6b4b5e6f7a3f"
}
```

### Business Rules
*   Validates that `videoFileId` exists in the system files storage engine.

### Database Tables Affected
*   `live_session_recordings` (Insert)

### Response DTO (201 Created)
```json
{
  "success": true,
  "message": "Class recording registered successfully.",
  "data": {
    "recordingId": "rec092a-bf99-4d6a-8d1a-6b4b5e6f7a3f"
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
