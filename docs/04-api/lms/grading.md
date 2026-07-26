# Grading API Specification (07-lms-api/grading.md)

This document defines endpoints for grading student coursework submissions.

---

## POST /api/v1/submissions/{id}/grade

### Purpose

Grades a student's homework submission (marks allocation and remarks).

### Permission

`lms:assignment:grade`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `lms:assignment:grade`
- Tenant Isolation: Enforced
- Branch Isolation: Not Applicable
- RLS Validation: Enforced
- Sensitive Fields Masked: No.

### Request DTO

```json
{
  "marksObtained": 45.5,
  "gradingRemarks": "Excellent steps. Minor arithmetic mistake on Q4."
}
```

### Validation Constraints

- `marksObtained`: Required. Decimal value. Must not exceed assignment maximum marks constraints.

### Business Rules

- Updates the submission record status to `GRADED`, stamping the grading staff ID.

### Database Tables Affected

- `assignment_submissions` (Update)

### Response DTO

```json
{
  "success": true,
  "message": "Submission graded successfully.",
  "data": null,
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
