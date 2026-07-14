# Staff Attendance API Specification (09-attendance-api/staff-attendance.md)

This document defines endpoints for recording employee timesheets.

---

## POST /api/v1/staff-attendance/clock-in

### Purpose

Records a staff member's morning clock-in timesheet log.

### Permission

`attendance:staff:write`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `attendance:staff:write`
- Tenant Isolation: Enforced
- Branch Isolation: Enforced
- RLS Validation: Enforced
- Sensitive Fields Masked: No.

### Request DTO

```json
{
  "clockInTime": "2026-07-09T08:30:00.000Z",
  "locationCoordinates": "12.9716,77.5946"
}
```

### Business Rules

- Creates a timesheet row inside `staff_attendance_logs` table, storing coordinate points for geofencing compliance verification.

### Database Tables Affected

- `staff_attendance_logs` (Insert)

### Response DTO (201 Created)

```json
{
  "success": true,
  "message": "Staff clock-in recorded successfully.",
  "data": {
    "logId": "att89a3d-bf99-4d6a-8d1a-6b4b5e6f7a3f"
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```

---

## POST /api/v1/staff-attendance/clock-out

### Purpose

Records a staff member's evening clock-out log.

### Permission

`attendance:staff:write`

### Request DTO

```json
{
  "clockOutTime": "2026-07-09T17:30:00.000Z"
}
```
