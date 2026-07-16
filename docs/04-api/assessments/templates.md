# Templates API Specification (06-assessment-api/templates.md)

This document defines endpoints for managing reusable exam patterns.

---

## POST /api/v1/exam-templates

### Purpose

Registers a reusable exam pattern layout template (e.g., standard NEET-UG mock exam layout).

### Permission

`template:create`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `template:create`
- Tenant Isolation: Enforced
- Branch Isolation: Not Applicable
- RLS Validation: Enforced
- Sensitive Fields Masked: No.

### Request DTO

```json
{
  "name": "Standard NEET-UG Mock Layout",
  "totalDurationMinutes": 200,
  "totalMarks": 720,
  "sections": [
    {
      "sectionName": "Physics Section A",
      "subjectId": "sub02a-bf99-4d6a-8d1a-6b4b5e6f7a3f",
      "questionCount": 35,
      "marksPerQuestion": 4.0,
      "negativeMarksPerQuestion": -1.0
    }
  ]
}
```

### Business Rules

- Ensures sum of section marks matches the `totalMarks` parameter.

### Database Tables Affected

- `exam_templates` (Insert)
- `exam_template_sections` (Insert)

### Response DTO (201 Created)

```json
{
  "success": true,
  "message": "Exam template registered successfully.",
  "data": {
    "templateId": "t02a3d12-bf99-4d6a-8d1a-6b4b5e6f7a3f"
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
