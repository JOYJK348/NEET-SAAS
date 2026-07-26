# File Timeline API Specification (11-system-api/timeline.md)

This document defines endpoints for retrieving a file's chronological history.

---

## GET /api/v1/files/{id}/timeline

### Purpose

Retrieves a chronological sequence of all file actions (presign url generation, binary upload completion, and verification checks).

### Permission

`file:read`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `file:read`
- Tenant Isolation: Enforced
- Branch Isolation: Not Applicable
- RLS Validation: Enforced
- Sensitive Fields Masked: No.

### Response DTO (200 OK)

```json
{
  "success": true,
  "message": "File history timeline retrieved.",
  "data": [
    {
      "event": "PRESIGNED_LINK_GENERATED",
      "timestamp": "2026-07-09T03:00:00.000Z",
      "title": "Presign URL Requested",
      "description": "Upload link generated for avatar.jpg.",
      "actorName": "HR Coordinator"
    },
    {
      "event": "UPLOAD_VERIFIED",
      "timestamp": "2026-07-09T03:02:00.000Z",
      "title": "Upload Verified",
      "description": "Checksum matched against object store metadata. File is ACTIVE.",
      "actorName": "HR Coordinator"
    }
  ],
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
