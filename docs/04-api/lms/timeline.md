# LMS Timeline API Specification (07-lms-api/timeline.md)

This document defines endpoints for retrieving a student's coursework timeline.

---

## GET /api/v1/students/{id}/lms-timeline

### Purpose

Retrieves a chronological learning progress history (materials accessed, homework submitted, grades awarded, and topic completions).

### Permission

`student:progress:read`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `student:progress:read`
- Tenant Isolation: Enforced
- Branch Isolation: Enforced
- RLS Validation: Enforced
- Sensitive Fields Masked: No.

### Response DTO (200 OK)

```json
{
  "success": true,
  "message": "Student LMS timeline retrieved.",
  "data": [
    {
      "event": "MATERIAL_ACCESSED",
      "timestamp": "2026-07-09T01:00:00.000Z",
      "title": "Revision Notes Accessed",
      "description": "Opened 'Organic Chemistry Revision Notes' document.",
      "actorName": "Adithya Kumar"
    },
    {
      "event": "ASSIGNMENT_SUBMITTED",
      "timestamp": "2026-07-09T03:00:00.000Z",
      "title": "Kinematics Practice Sheet Submitted",
      "description": "Scanned document uploaded.",
      "actorName": "Adithya Kumar"
    }
  ],
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
