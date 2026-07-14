# Courses API Specification (05-academic-api/courses.md)

Refer to [common-errors.md](file:///d:/FreeLance/NEET_platform/docs/architecture/api-design/shared/common-errors.md) and [response-examples.md](file:///d:/FreeLance/NEET_platform/docs/architecture/api-design/shared/response-examples.md) for standard response envelopes.

---

## POST /api/v1/courses

### Purpose

Registers a new academic course catalog entry.

### Permission

`course:create`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `course:create`
- Tenant Isolation: Enforced via `X-Tenant-ID` header.
- Branch Isolation: Not Applicable
- RLS Validation: Enforced
- Sensitive Fields Masked: No.

### Request DTO

```json
{
  "name": "NEET 2-Year Intensive Program",
  "code": "NEET-2YR-INT",
  "description": "Comprehensive coaching syllabus mapping Physics, Chemistry, and Biology.",
  "durationMonths": 24
}
```

### Validation Constraints

- `name`: Required. Max 255 characters.
- `code`: Required. Unique per tenant.

### Business Rules

- Enforces alphanumeric constraints on `code`.
- Saves the course record to `courses` table under `DRAFT` status.

### Database Tables Affected

- `courses` (Insert)

### Response DTO (201 Created)

```json
{
  "success": true,
  "message": "Course created successfully.",
  "data": {
    "courseId": "cne26-bf99-4d6a-8d1a-6b4b5e6f7a3f"
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
