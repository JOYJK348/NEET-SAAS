# Attendance Corrections API Specification (09-attendance-api/attendance-corrections.md)

This document defines endpoints for requesting manual clock-in/out timesheet overrides.

---

## POST /api/v1/attendance-corrections

### Purpose

Submits an attendance override request (for missed clock-ins or errors).

### Permission

`attendance:correction:submit`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `attendance:correction:submit`
- Tenant Isolation: Enforced
- Branch Isolation: Not Applicable
- RLS Validation: Enforced
- Sensitive Fields Masked: No.

### Request DTO

```json
{
  "targetDate": "2026-07-09",
  "requestedTime": "08:30:00",
  "correctionType": "CLOCK_IN",
  "reason": "RFID card reader malfunction."
}
```

### Business Rules

- Saves the request in `attendance_corrections` table under `PENDING` status.

### Database Tables Affected

- `attendance_corrections` (Insert)

### Response DTO (201 Created)

```json
{
  "success": true,
  "message": "Correction request submitted successfully.",
  "data": {
    "correctionId": "corr092a-bf99-4d6a-8d1a-6b4b5e6f7a3f"
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```

---

## PATCH /api/v1/attendance-corrections/{id}/approve

### Purpose

Approves or rejects a correction request.

### Permission

`attendance:correction:approve`

### Request DTO

```json
{
  "status": "APPROVED"
}
```

### Business Rules

- On approval, updates the target record status to `APPROVED` and inserts/updates matching logs in timesheets.
