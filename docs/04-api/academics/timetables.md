# Timetables API Specification (05-academic-api/timetables.md)

This document defines endpoints for managing class schedules.

---

## POST /api/v1/timetable-slots

### Purpose

Schedules a class slot session for a batch.

### Permission

`timetable:write`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `timetable:write`
- Tenant Isolation: Enforced
- Branch Isolation: Enforced via batch metadata checks.
- RLS Validation: Enforced
- Sensitive Fields Masked: No.

### Request DTO

```json
{
  "batchId": "b02a3d12-bf99-4d6a-8d1a-6b4b5e6f7a3f",
  "subjectId": "sub02a-bf99-4d6a-8d1a-6b4b5e6f7a3f",
  "staffId": "s89a3d12-bf99-4d6a-8d1a-6b4b5e6f7a3f",
  "roomId": "room02-bf99-4d6a-8d1a-6b4b5e6f7a3f",
  "startTime": "2026-07-09T09:00:00.000Z",
  "endTime": "2026-07-09T10:30:00.000Z"
}
```

### Business Rules

1.  **Staff Conflict Check**: Verifies that the instructor (`staffId`) has no overlapping class slot schedules in the database.
2.  **Room Conflict Check**: Verifies the classroom (`roomId`) has no scheduling collisions.
3.  **Batch Conflict Check**: Verifies the batch is not scheduled for another class during the same time interval.
4.  If any conflict is detected, aborts execution and returns `409 Conflict` with error code `SCHEDULE_CONFLICT`.

### Database Tables Affected

- `timetable_slots` (Insert)

### Response DTO (201 Created)

```json
{
  "success": true,
  "message": "Class session scheduled successfully.",
  "data": {
    "slotId": "slot89a-bf99-4d6a-8d1a-6b4b5e6f7a3f"
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
