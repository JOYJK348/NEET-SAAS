# Holidays API Specification (09-attendance-api/holidays.md)

This document defines endpoints for configuring academic calendar holidays.

---

## POST /api/v1/holidays

### Purpose

Registers a holiday in the academic calendar (disables default attendance checks).

### Permission

`holiday:write`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `holiday:write`
- Tenant Isolation: Enforced
- Branch Isolation: Not Applicable
- RLS Validation: Enforced
- Sensitive Fields Masked: No.

### Request DTO

```json
{
  "name": "Independence Day",
  "startDate": "2026-08-15",
  "endDate": "2026-08-15",
  "isNationalHoliday": true
}
```

### Business Rules

- Prevents scheduling timetable slots or enforcing attendance checks on registered holiday dates.

### Database Tables Affected

- `holidays` (Insert)

### Response DTO (201 Created)

```json
{
  "success": true,
  "message": "Holiday registered in calendar successfully.",
  "data": {
    "holidayId": "hol89a-bf99-4d6a-8d1a-6b4b5e6f7a3f"
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
