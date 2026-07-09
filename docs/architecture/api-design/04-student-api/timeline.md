# Student Timeline API Specification (04-student-api/timeline.md)

This document defines endpoints for retrieving a student's chronological history.

---

## GET /api/v1/students/{id}/timeline

### Purpose
Retrieves a chronological sequence of all lifecycle and audit milestones for a student.

### Permission
`student:read`

### Security Notes
*   Authentication Required: Yes
*   Required RBAC Permission: `student:read`
*   Tenant Isolation: Enforced
*   Branch Isolation: Enforced
*   RLS Validation: Enforced
*   Sensitive Fields Masked: No.

### Response DTO (200 OK)
```json
{
  "success": true,
  "message": "Student lifecycle timeline retrieved.",
  "data": [
    {
      "event": "CREATED",
      "timestamp": "2026-07-09T01:00:00.000Z",
      "title": "Admission Application Submitted",
      "description": "Onboarding initialized in PENDING state.",
      "actorName": "Adithya Kumar"
    },
    {
      "event": "JOINED",
      "timestamp": "2026-07-09T03:00:00.000Z",
      "title": "Student Enrolled",
      "description": "Enrollment approved, allocated to NEET Physics Batch A.",
      "actorName": "Admissions Officer"
    }
  ],
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
