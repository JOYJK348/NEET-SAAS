# Transfers & Promotions API Specification (04-student-api/transfers.md)

This document defines endpoints for executing student branch relocations, batch transfers, and academic year promotions.

---

## POST /api/v1/students/{id}/transfer-batch

### Purpose
Transfers a student to a new study batch (re-allocating enrollment histories).

### Permission
`student:transfer:write`

### Security Notes
*   Authentication Required: Yes
*   Required RBAC Permission: `student:transfer:write`
*   Tenant Isolation: Enforced
*   Branch Isolation: Not Applicable
*   RLS Validation: Enforced
*   Sensitive Fields Masked: No.

### Request DTO
```json
{
  "targetBatchId": "b09a3d12-bf99-4d6a-8d1a-6b4b5e6f7a3f",
  "effectiveFrom": "2026-07-15",
  "reason": "ACADEMIC",
  "remarks": "Performance upgrade to elite batch based on unit test marks."
}
```

### Validation Constraints
*   `reason`: Required. Must be `ACADEMIC`, `BEHAVIOR`, `PARENT_REQUEST`, `ADMINISTRATIVE`, `MEDICAL`, or `FEE_RELATED`.

### Business Rules
1.  **Old Batch Exit**: Updates the current active `batch_enrollments` record for the student, setting `left_on` to the transfer date.
2.  **New Batch Enrollment**: Inserts a new active record into the `batch_enrollments` table with status `ACTIVE`.
3.  **Logs Audit**: Inserts a transfer trace entry into the `batch_transfer_logs` audit table (which is strictly immutable/non-editable).

### Database Tables Affected
*   `batch_enrollments` (Update / Insert)
*   `batch_transfer_logs` (Insert)

### Response DTO
```json
{
  "success": true,
  "message": "Student batch transfer completed successfully.",
  "data": null,
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```

---

## POST /api/v1/students/{id}/promote

### Purpose
Promotes an active student to the next academic year program.

### Permission
`student:promotion:write`

### Request DTO
```json
{
  "targetAcademicYearId": "ay27-bf99-4d6a-8d1a-6b4b5e6f7a3f",
  "targetBatchId": "b89a3d12-bf99-4d6a-8d1a-6b4b5e6f7a3f"
}
```

### Business Rules
*   Verifies student's current status is `ACTIVE` and all fee dues for the current year are cleared (calls fee billing context verify checks).

---

## POST /api/v1/students/{id}/repeat-year

### Purpose
Retains a student in the same academic level for the next year session.

### Permission
`student:promotion:write`

---

## POST /api/v1/students/bulk-transfer

### Purpose
Executes a bulk batch transfer for multiple students (Async).

### Permission
`student:transfer:write`

### Request DTO
```json
{
  "studentProfileIds": [
    "s71a3d12-bf99-4d6a-8d1a-6b4b5e6f7a3f",
    "s72a3d12-bf99-4d6a-8d1a-6b4b5e6f7a3f"
  ],
  "targetBatchId": "b09a3d12-bf99-4d6a-8d1a-6b4b5e6f7a3f",
  "reason": "ADMINISTRATIVE"
}
```
