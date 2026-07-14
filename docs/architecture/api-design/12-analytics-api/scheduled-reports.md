# Scheduled Reports API Specification (12-analytics-api/scheduled-reports.md)

This document defines endpoints for managing scheduled email reports.

---

## POST /api/v1/analytics/scheduled-reports

### Purpose

Schedules an automated email report to be sent periodically.

### Permission

`analytics:report:write`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `analytics:report:write`
- Tenant Isolation: Enforced
- Branch Isolation: Not Applicable
- RLS Validation: Enforced
- Sensitive Fields Masked: No.

### Request DTO

```json
{
  "reportTemplateId": "rep89a-bf99-4d6a-8d1a-6b4b5e6f7a3f",
  "cronExpression": "0 8 * * 1",
  "recipientEmails": ["director@eliteneet.com"]
}
```

### Business Rules

- Enforces standard 5-field cron parsing formats. Registers scheduling tasks in system background cron jobs.

### Database Tables Affected

- `scheduled_reports` (Insert)

### Response DTO (201 Created)

```json
{
  "success": true,
  "message": "Report schedule registered successfully.",
  "data": {
    "scheduleId": "sch89a-bf99-4d6a-8d1a-6b4b5e6f7a3f"
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
