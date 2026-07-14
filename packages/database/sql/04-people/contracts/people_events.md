# People Event Contracts

The **04-People** bounded context publishes events asynchronously whenever student or staff lifecycles change.

## Lifecycle Event Hooks

| Event Name               | Description                                               | Trigger                           |
| :----------------------- | :-------------------------------------------------------- | :-------------------------------- |
| `student.created`        | Emitted when a new student profile registration occurs.   | `student_profiles` Insert         |
| `student.updated`        | Emitted when demographics or credentials are changed.     | `student_profiles` Update         |
| `student.status_changed` | Emitted when status changes (e.g. suspended, left).       | `student_profiles` Status Update  |
| `student.promoted`       | Emitted when a student is promoted to a new year.         | `sp_promote_student` execution    |
| `student.transferred`    | Emitted when student transfers classroom batches.         | `sp_transfer_batch` execution     |
| `student.archived`       | Emitted when student profile is soft archived/deleted.    | `sp_archive_student` execution    |
| `parent.created`         | Emitted when a new parent profile is registered.          | `parent_profiles` Insert          |
| `staff.assigned`         | Emitted when staff is assigned to a department.           | `staff_departments` Mutation      |
| `batch.assigned`         | Emitted when teaching faculty is assigned to batch.       | `staff_batch_assignments` Insert  |
| `document.verified`      | Emitted when student identification document is verified. | `student_documents` Status Update |
| `medical.updated`        | Emitted when medical alert status is updated.             | `student_medical_profiles` Update |

## Notification Channels

All events are dispatched through the PostgreSQL database `pg_notify` interface on the **`people_events`** channel.
Format:

```json
{
  "event": "event_name",
  "data": { ... }
}
```
