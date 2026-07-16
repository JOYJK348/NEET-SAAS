# Exams Scheduling API Specification (06-assessment-api/exams.md)

This document defines endpoints for scheduling exams and assigning them to student batches.

---

## POST /api/v1/exams

### Purpose

Schedules an exam window for target student batches.

### Permission

`exam:write`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `exam:write`
- Tenant Isolation: Enforced
- Branch Isolation: Not Applicable
- RLS Validation: Enforced
- Sensitive Fields Masked: No.

### Request DTO

```json
{
  "templateId": "t02a3d12-bf99-4d6a-8d1a-6b4b5e6f7a3f",
  "name": "NEET Monthly Assessment - July",
  "scheduledStartTime": "2026-07-20T09:00:00.000Z",
  "scheduledEndTime": "2026-07-20T12:20:00.000Z",
  "targetBatchIds": ["b02a3d12-bf99-4d6a-8d1a-6b4b5e6f7a3f"]
}
```

### Business Rules

1.  **Date constraints**: Scheduled start time must be in the future.
2.  **Batch Mapping**: Links the exam to active batches, generating records in `exam_batches` to handle student eligibility policies.

### Database Tables Affected

- `exams` (Insert)
- `exam_batches` (Insert)

### Response DTO (201 Created)

```json
{
  "success": true,
  "message": "Exam scheduled successfully.",
  "data": {
    "examId": "e02a3d12-bf99-4d6a-8d1a-6b4b5e6f7a3f"
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
