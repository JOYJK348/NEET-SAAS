# Progress Tracking API Specification (07-lms-api/progress.md)

This document defines endpoints for capturing student progression telemetry.

---

## POST /api/v1/students/{id}/progress/topics

### Purpose
Logs completion of a teaching/learning topic for a student (telemetry tracker).

### Permission
`student:progress:write`

### Security Notes
*   Authentication Required: Yes
*   Required RBAC Permission: `student:progress:write`
*   Tenant Isolation: Enforced
*   Branch Isolation: Enforced
*   RLS Validation: Enforced
*   Sensitive Fields Masked: No.

### Request DTO
```json
{
  "topicId": "top02b-bf99-4d6a-8d1a-6b4b5e6f7a3f",
  "status": "COMPLETED",
  "completionMethod": "STUDENT_SELF_DECLARATION"
}
```

### Business Rules
1.  **State check**: Verifies the student profile status is `ACTIVE`.
2.  **Telemetry save**: Inserts or updates the progress row in `student_topic_progress` table.

### Database Tables Affected
*   `student_topic_progress` (Insert/Update)

### Response DTO
```json
{
  "success": true,
  "message": "Topic progress logged successfully.",
  "data": null,
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
