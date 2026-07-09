# Assignments API Specification (07-lms-api/assignments.md)

This document defines endpoints for managing coursework homework assignments.

---

## POST /api/v1/assignments

### Purpose
Publishes a new homework assignment task for a batch.

### Permission
`lms:assignment:write`

### Security Notes
*   Authentication Required: Yes
*   Required RBAC Permission: `lms:assignment:write`
*   Tenant Isolation: Enforced
*   Branch Isolation: Not Applicable
*   RLS Validation: Enforced
*   Sensitive Fields Masked: No.

### Request DTO
```json
{
  "batchId": "b02a3d12-bf99-4d6a-8d1a-6b4b5e6f7a3f",
  "topicId": "top02b-bf99-4d6a-8d1a-6b4b5e6f7a3f",
  "title": "Kinematics Practice Sheet 1",
  "description": "Solve all numericals in the attached sheet.",
  "dueDate": "2026-07-15T23:59:59.000Z",
  "maxMarks": 50.00
}
```

### Validation Constraints
*   `dueDate`: Required. Must be in the future.
*   `maxMarks`: Required. Positive decimal.

### Business Rules
*   Creates the assignment record, automatically setting status to `PUBLISHED`.

### Database Tables Affected
*   `assignments` (Insert)

### Response DTO (201 Created)
```json
{
  "success": true,
  "message": "Assignment published successfully.",
  "data": {
    "assignmentId": "as092a-bf99-4d6a-8d1a-6b4b5e6f7a3f"
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
