# Subjects Mapping API Specification (03-user-api/subjects.md)

This document defines endpoints for mapping teaching staff (faculty) to specific subjects.

---

## POST /api/v1/staff/{id}/subjects

### Purpose
Assigns a subject to a teaching staff profile.

### Permission
`staff:subject:write`

### Security Notes
*   Authentication Required: Yes
*   Required RBAC Permission: `staff:subject:write`
*   Tenant Isolation: Enforced
*   Branch Isolation: Not Applicable
*   RLS Validation: Enforced
*   Sensitive Fields Masked: No.

### Request DTO
```json
{
  "subjectId": "sub02a-bf99-4d6a-8d1a-6b4b5e6f7a3f"
}
```

### Business Rules
*   Verifies that the target staff profile is in `ACTIVE` status before mapping subject records.

### Database Tables Affected
*   `staff_subjects` (Insert)

### Response DTO
```json
{
  "success": true,
  "message": "Subject mapped to instructor successfully.",
  "data": null,
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
