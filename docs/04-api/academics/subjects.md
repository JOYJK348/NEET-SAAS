# Subjects API Specification (05-academic-api/subjects.md)

This document defines endpoints for managing subject catalogs.

---

## POST /api/v1/subjects

### Purpose

Registers a new academic subject.

### Permission

`subject:create`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `subject:create`
- Tenant Isolation: Enforced
- Branch Isolation: Not Applicable
- RLS Validation: Enforced
- Sensitive Fields Masked: No.

### Request DTO

```json
{
  "courseId": "cne26-bf99-4d6a-8d1a-6b4b5e6f7a3f",
  "name": "Organic Chemistry",
  "code": "NEET-ORG-CHEM"
}
```

### Business Rules

- Enforces subject code uniqueness per course scope context (`uq_course_subject_code`).

### Database Tables Affected

- `subjects` (Insert)

### Response DTO (201 Created)

```json
{
  "success": true,
  "message": "Subject registered successfully.",
  "data": {
    "subjectId": "sub02a-bf99-4d6a-8d1a-6b4b5e6f7a3f"
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
