# Media Processing API Specification (11-system-api/media-processing.md)

This document defines endpoints for managing recorded video lecture transcoding.

---

## POST /api/v1/media/transcode

### Purpose
Triggers a video transcoding job (e.g. converting a raw video recording to adaptive HLS/M3U8 streaming formats).

### Permission
`system:media:write`

### Security Notes
*   Authentication Required: Yes
*   Required RBAC Permission: `system:media:write`
*   Tenant Isolation: Enforced
*   Branch Isolation: Not Applicable
*   RLS Validation: Enforced
*   Sensitive Fields Masked: No.

### Request DTO
```json
{
  "sourceFileId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a",
  "resolutions": ["360p", "720p", "1080p"]
}
```

### Business Rules
1.  **Job Queuing**: Adds the task to the media processor queue (handled asynchronously, returns a `202 Accepted` status along with a `jobId`).
2.  **Output Registration**: Background workers save output HLS playlist files and update streaming links inside the LMS domain recordings metadata records.

### Database Tables Affected
*   `media_transcode_jobs` (Insert)

### Response DTO (202 Accepted)
```json
{
  "success": true,
  "message": "Video transcoding job initiated.",
  "data": {
    "jobId": "j90a3d12-bf99-4d6a-8d1a-6b4b5e6f7a3f",
    "status": "QUEUED"
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
