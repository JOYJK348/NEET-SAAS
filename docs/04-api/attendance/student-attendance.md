# Student Attendance API Specification (09-attendance-api/student-attendance.md)

Refer to [common-errors.md](file:///d:/FreeLance/NEET_platform/docs/architecture/api-design/shared/common-errors.md) and [response-examples.md](file:///d:/FreeLance/NEET_platform/docs/architecture/api-design/shared/response-examples.md) for standard response envelopes.

---

## POST /api/v1/student-attendance

### Purpose

Records roll-call attendance logs for a classroom session.

### Permission

`attendance:student:write`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `attendance:student:write`
- Tenant Isolation: Enforced via `X-Tenant-ID` header.
- Branch Isolation: Enforced via batch parameters checks.
- RLS Validation: Enforced
- Sensitive Fields Masked: No.

### Request DTO

```json
{
  "timetableSlotId": "slot89a-bf99-4d6a-8d1a-6b4b5e6f7a3f",
  "records": [
    { "studentProfileId": "s71a3d12-bf99-4d6a-8d1a-6b4b5e6f7a3f", "status": "PRESENT" },
    { "studentProfileId": "s72a3d12-bf99-4d6a-8d1a-6b4b5e6f7a3f", "status": "ABSENT" }
  ]
}
```

### Validation Constraints

- `timetableSlotId`: Required.
- `status`: Required. Must be `PRESENT`, `ABSENT`, or `LATE`.

### Business Rules

1.  **Duplicate check**: Overwrites existing records for the slot, keeping only the latest version.
2.  **Date checking**: Prevents marking attendance for future timetable slots.

### Database Tables Affected

- `student_attendance` (Insert/Update)

### Response DTO (201 Created)

```json
{
  "success": true,
  "message": "Student roll-call attendance recorded successfully.",
  "data": null,
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
