# Students API Specification (04-student-api/students.md)

---

## POST /api/v1/students

### Purpose
Completes enrollment for an approved admission, creating the active student profile.

### Permission
`student:create`

### Security Notes
*   Authentication Required: Yes
*   Required RBAC Permission: `student:create`
*   Tenant Isolation: Enforced
*   Branch Isolation: Not Applicable
*   RLS Validation: Enforced
*   Sensitive Fields Masked: No.

### Request DTO
```json
{
  "admissionId": "adm89a3-bf99-4d6a-8d1a-6b4b5e6f7a3f",
  "userId": "u091a3d1-bf99-4d6a-8d1a-6b4b5e6f7a3f",
  "admissionNumber": "NEET-2026-8899",
  "rollNumber": "PH-2026-0089",
  "branchId": "b12a3d12-bf99-4d6a-8d1a-6b4b5e6f7a3f"
}
```

### Validation Constraints
*   `admissionId`: Required. Approved admission record ID.
*   `admissionNumber`: Required. Tenant-unique code.
*   `branchId`: Required.

### Business Rules
1.  **Duplicate check**: Enforces unique constraints on `admissionNumber` within the active tenant.
2.  **State check**: Verifies `admissions.status` is `APPROVED`.
3.  **Active Student**: Creates the record in `student_profiles` setting status to `ACTIVE`.

### Database Tables Affected
*   `student_profiles` (Insert)
*   `admissions` (Update status to `ENROLLED`)

### Response DTO (201 Created)
```json
{
  "success": true,
  "message": "Student enrollment completed successfully.",
  "data": {
    "studentProfileId": "s71a3d12-bf99-4d6a-8d1a-6b4b5e6f7a3f"
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```

---

## POST /api/v1/students/bulk-import

### Purpose
Triggers a bulk import task for student enrollments (Async).

### Permission
`student:create`

### Request DTO
```json
{
  "fileVersionId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
}
```

### Business Rules
*   Processes file asynchronously via outbox task patterns, returning `202 Accepted` immediately containing `jobId`.
