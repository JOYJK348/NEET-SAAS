# LMS Audit API Specification (07-lms-api/audit.md)

This document defines audit query endpoints for tracking modifications to course materials.

---

## GET /api/v1/study-materials/{id}/audit

### Purpose
Retrieves action audit trails for study materials.

### Permission
`lms:material:audit:read`

### Security Notes
*   Authentication Required: Yes
*   Required RBAC Permission: `lms:material:audit:read`
*   Tenant Isolation: Enforced
*   Branch Isolation: Not Applicable
*   RLS Validation: Enforced
*   Sensitive Fields Masked: No.

### Response DTO (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "logId": "l091a3d1-bf99-4d6a-8d1a-6b4b5e6f7a3f",
      "action": "UPDATE_FILE",
      "oldValue": {
        "fileVersionId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
      },
      "newValue": {
        "fileVersionId": "f79a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
      },
      "reason": "Updated file to correct typographical errors on organic chemistry formulas.",
      "createdAt": "2026-07-09T02:00:00.000Z",
      "actorName": "Chemistry Faculty HOD"
    }
  ],
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
