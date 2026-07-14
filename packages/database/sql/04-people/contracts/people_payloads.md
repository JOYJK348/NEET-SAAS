# People Messaging Payloads Schema

JSON schema payloads definitions emitted on the database events bus:

## 1. `student.created`

Emitted when a student is admitted into the system.

```json
{
  "student_id": "UUID",
  "tenant_id": "UUID",
  "status": "ACTIVE",
  "profile_version": 1,
  "timestamp": "2026-07-13T10:45:00Z"
}
```

## 2. `student.status_changed`

Emitted during lifecycle state transitions.

```json
{
  "student_id": "UUID",
  "tenant_id": "UUID",
  "status": "LEFT",
  "profile_version": 4,
  "timestamp": "2026-07-13T10:45:00Z"
}
```

## 3. `batch.assigned`

Emitted when faculty is mapped to a batch/subject.

```json
{
  "assignment_id": "UUID",
  "staff_profile_id": "UUID",
  "batch_id": "UUID",
  "subject_id": "UUID",
  "tenant_id": "UUID",
  "effective_from": "2026-07-13",
  "timestamp": "2026-07-13T10:45:00Z"
}
```
