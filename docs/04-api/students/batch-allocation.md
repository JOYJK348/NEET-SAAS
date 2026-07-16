# Batch Allocation API Specification (04-student-api/batch-allocation.md)

This document defines endpoints for allocating students to academic batches.

---

## POST /api/v1/students/{id}/batch-allocations

### Purpose

Allocates a student to an active academic study batch.

### Permission

`student:batch:write`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `student:batch:write`
- Tenant Isolation: Enforced
- Branch Isolation: Not Applicable
- RLS Validation: Enforced
- Sensitive Fields Masked: No.

### Request DTO

```json
{
  "batchId": "b02a3d12-bf99-4d6a-8d1a-6b4b5e6f7a3f",
  "joiningDate": "2026-07-09"
}
```

### Business Rules

1.  **State check**: Verifies the student profile status is `ACTIVE`.
2.  **Unique enrollment**: Prevents mapping multiple active batch enrollments concurrently.
3.  **Active records**: Creates the active link inside `batch_enrollments`.

### Database Tables Affected

- `batch_enrollments` (Insert)

### Response DTO (201 Created)

```json
{
  "success": true,
  "message": "Student allocated to batch successfully.",
  "data": {
    "enrollmentId": "be02a3d1-bf99-4d6a-8d1a-6b4b5e6f7a3f"
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
