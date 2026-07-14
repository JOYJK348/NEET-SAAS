# Submissions API Specification (07-lms-api/submissions.md)

This document defines endpoints for student assignment submissions.

---

## POST /api/v1/assignments/{id}/submissions

### Purpose

Submits student work for a published homework assignment.

### Permission

`student:assignment:submit`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `student:assignment:submit`
- Tenant Isolation: Enforced via student token.
- Branch Isolation: Enforced
- RLS Validation: Enforced
- Sensitive Fields Masked: No.

### Request DTO

```json
{
  "submittedFileId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a",
  "studentRemarks": "All questions solved on paper and scanned."
}
```

### Business Rules

1.  **Late submissions**: If the submission date is past the assignment `dueDate`, flags the record as `LATE`.
2.  **State check**: Fails if the student has already submitted this assignment and the template disables resubmissions.

### Database Tables Affected

- `assignment_submissions` (Insert)

### Response DTO (201 Created)

```json
{
  "success": true,
  "message": "Assignment work submitted successfully.",
  "data": {
    "submissionId": "sub092a-bf99-4d6a-8d1a-6b4b5e6f7a3f"
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
