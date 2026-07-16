# Assessment Timeline API Specification (06-assessment-api/timeline.md)

This document defines endpoints for retrieving chronological exam status updates.

---

## GET /api/v1/exams/{id}/timeline

### Purpose

Retrieves a chronological history of exam milestones (creation, scheduling, starts, auto-grading execution, and results publication).

### Permission

`exam:read`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `exam:read`
- Tenant Isolation: Enforced
- Branch Isolation: Enforced via batch associations.
- RLS Validation: Enforced
- Sensitive Fields Masked: No.

### Response DTO (200 OK)

```json
{
  "success": true,
  "message": "Exam lifecycle timeline retrieved.",
  "data": [
    {
      "event": "CREATED",
      "timestamp": "2026-07-09T01:00:00.000Z",
      "title": "Exam Template Defined",
      "description": "Mock Exam structured with Physics and Chemistry Sections.",
      "actorName": "Academic Coordinator"
    },
    {
      "event": "SCHEDULED",
      "timestamp": "2026-07-09T03:00:00.000Z",
      "title": "Exam Window Scheduled",
      "description": "Exam scheduled for July 20th, mapped to Batch Alpha.",
      "actorName": "Academic Coordinator"
    }
  ],
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
